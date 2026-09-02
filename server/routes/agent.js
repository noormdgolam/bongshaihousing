const express = require('express');
const multer = require('multer');
const db = require('../lib/db');
const requireAgent = require('../middleware/requireAgent');
const { sendMail } = require('../lib/mailer');
const { sendTelegramAlert } = require('../lib/telegram');
const { saveDocument, documentPath } = require('../lib/document-uploader');
const {
  getAgentSettings,
  calculateAgentTier,
  calculateCommission,
  calculateTranches,
  getAgentReferralCode,
  composeWhatsAppMessage,
} = require('../lib/agent-settings');
const { generateBrochurePdf } = require('../lib/brochure-generator');

const router = express.Router();

const DOCUMENT_FIELDS = ['doc_application_letter', 'doc_passport_photo', 'doc_trade_license', 'doc_tin_certificate', 'doc_nid_copy'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, WebP, or PDF files are accepted.'), ok);
  },
});
const documentUpload = upload.fields(DOCUMENT_FIELDS.map((name) => ({ name, maxCount: 1 })));

async function leadStats(agentId, filters = {}) {
  const allLeads = await db('agent_leads').where({ agent_id: agentId }).select('id', 'status', 'milestone_stage', 'created_at');
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const stats = { total: allLeads.length, new: 0, contacted: 0, quoted: 0, won: 0, lost: 0, wonThisMonth: 0 };
  for (const l of allLeads) {
    stats[l.status] = (stats[l.status] || 0) + 1;
    if (l.status === 'won' && new Date(l.created_at) >= startOfMonth) {
      stats.wonThisMonth += 1;
    }
  }

  let query = db('agent_leads')
    .leftJoin('products', 'products.id', 'agent_leads.product_id')
    .where('agent_leads.agent_id', agentId)
    .select(
      'agent_leads.*',
      'products.title as product_title',
      'products.model_number as product_model_number',
      'products.main_image as product_hero_image'
    )
    .orderBy('agent_leads.created_at', 'desc');

  const statusFilter = filters.status || 'all';
  if (statusFilter && statusFilter !== 'all') {
    query = query.where({ 'agent_leads.status': statusFilter });
  }

  const milestoneFilter = filters.milestone || 'all';
  if (milestoneFilter && milestoneFilter !== 'all') {
    query = query.where({ 'agent_leads.milestone_stage': milestoneFilter });
  }

  const search = (filters.q || '').trim();
  if (search) {
    query = query.where((builder) => {
      builder.where('agent_leads.customer_name', 'like', `%${search}%`)
        .orWhere('agent_leads.customer_phone', 'like', `%${search}%`)
        .orWhere('agent_leads.customer_district', 'like', `%${search}%`)
        .orWhere('agent_leads.product_interest', 'like', `%${search}%`)
        .orWhere('products.title', 'like', `%${search}%`)
        .orWhere('products.model_number', 'like', `%${search}%`);
    });
  }

  const countQuery = query.clone().clearSelect().clearOrder().count({ count: '*' }).first();
  const totalCountResult = await countQuery;
  const filteredTotal = totalCountResult ? Number(totalCountResult.count) : 0;

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(filters.limit, 10) || 10));
  const totalPages = Math.ceil(filteredTotal / limit) || 1;
  const offset = (page - 1) * limit;

  const leads = await query.offset(offset).limit(limit);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stageMap = {
    site_visit: 1,
    design_boq: 2,
    agreement_advance: 3,
    fabrication: 4,
    handover_commission: 5,
  };

  for (const l of leads) {
    l.is_overdue = l.status === 'new' && new Date(l.created_at) < oneDayAgo;
    if (l.protection_expires_at) {
      const expDate = new Date(l.protection_expires_at);
      l.is_protected = expDate >= now;
      l.days_left = Math.max(0, Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)));
    } else {
      l.is_protected = false;
      l.days_left = 0;
    }
    l.milestone_num = stageMap[l.milestone_stage] || 1;
  }

  return {
    leads,
    stats,
    pagination: {
      page,
      limit,
      totalCount: filteredTotal,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    filters: {
      status: statusFilter,
      milestone: milestoneFilter,
      q: search,
    },
  };
}

router.get(['/agent/dashboard', '/agent/dashboard.html'], requireAgent, async (req, res) => {
  const settings = await getAgentSettings(db);

  // Ensure referral code
  if (!req.agent.referral_code) {
    req.agent.referral_code = getAgentReferralCode(req.agent);
    try {
      await db('agents').where({ id: req.agent.id }).update({ referral_code: req.agent.referral_code });
    } catch (e) {}
  }

  const result = await leadStats(req.agent.id, req.query);

  // Won count & Tier calculation
  const [wonRow] = await db('agent_leads')
    .where({ agent_id: req.agent.id, status: 'won' })
    .count({ count: '*' })
    .catch(() => [{ count: 0 }]);
  const wonCount = Number(wonRow?.count) || 0;
  const tierInfo = calculateAgentTier(wonCount, settings);

  // Pipeline valuation (active leads)
  const [pipelineRow] = await db('agent_leads')
    .where({ agent_id: req.agent.id })
    .whereNot({ status: 'lost' })
    .whereNot({ milestone_stage: 'handover_commission' })
    .sum({ val: 'deal_value' })
    .catch(() => [{ val: 0 }]);
  const pipelineValue = parseFloat(pipelineRow?.val) || 0;

  // Unpaid commission
  const [unpaidRow] = await db('agent_leads')
    .where({ agent_id: req.agent.id })
    .whereIn('commission_status', ['pending', 'approved', 'partial_paid'])
    .sum({ val: 'estimated_commission' })
    .catch(() => [{ val: 0 }]);
  const unpaidCommission = parseFloat(unpaidRow?.val) || 0;

  // Paid this year
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const [paidYearRow] = await db('agent_payouts')
    .where({ agent_id: req.agent.id })
    .where('paid_at', '>=', startOfYear)
    .sum({ val: 'amount' })
    .catch(() => [{ val: 0 }]);
  const paidThisYear = parseFloat(paidYearRow?.val) || 0;

  // Active deals count
  const activeDealsCount = result.leads.filter((l) => l.status !== 'lost' && l.milestone_stage !== 'handover_commission').length;

  // Fetch products for dynamic model selector
  const products = await db('products')
    .where({ published: true })
    .orderBy('sort_order', 'asc')
    .select('id', 'title', 'model_number', 'slug', 'fixed_price', 'price_per_sqft', 'total_floor_area', 'main_image')
    .catch(() => []);

  // Fetch payout ledger history for this agent
  const payouts = await db('agent_payouts')
    .leftJoin('agent_leads', 'agent_leads.id', 'agent_payouts.agent_lead_id')
    .where('agent_payouts.agent_id', req.agent.id)
    .select(
      'agent_payouts.*',
      'agent_leads.customer_name',
      'agent_leads.deal_value'
    )
    .orderBy('agent_payouts.paid_at', 'desc')
    .catch(() => []);

  // WhatsApp share message & links
  const referralUrl = `https://bongshaihousing.com/?ref=${encodeURIComponent(req.agent.referral_code)}`;
  const whatsappText = composeWhatsAppMessage(req.agent, settings);
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  // Project portfolio for partner kit
  const projects = await db('projects')
    .select('id', 'title', 'slug', 'location', 'image')
    .limit(8)
    .catch(() => []);

  res.render('agent/dashboard.njk', {
    agent: req.agent,
    leads: result.leads,
    stats: result.stats,
    pagination: result.pagination,
    filters: result.filters,
    settings,
    tierInfo,
    products,
    payouts,
    projects,
    activeDealsCount,
    pipelineValue: pipelineValue.toLocaleString(),
    unpaidCommission: unpaidCommission.toLocaleString(),
    paidThisYear: paidThisYear.toLocaleString(),
    referralUrl,
    whatsappShareUrl,
    whatsappText,
    error: null,
  });
});

router.post('/agent/leads', requireAgent, async (req, res) => {
  const { customer_name, customer_phone, customer_district, product_id, custom_deal_value, notes } = req.body;

  if (!customer_name || !customer_phone) {
    return res.redirect('/agent/dashboard.html?error=' + encodeURIComponent('Customer name and phone number are required.'));
  }

  try {
    const settings = await getAgentSettings(db);

    // Agent Tier
    const [wonRow] = await db('agent_leads')
      .where({ agent_id: req.agent.id, status: 'won' })
      .count({ count: '*' })
      .catch(() => [{ count: 0 }]);
    const wonCount = Number(wonRow?.count) || 0;
    const tierInfo = calculateAgentTier(wonCount, settings);

    let productId = null;
    let productInterest = null;
    let dealValue = 0;

    if (product_id && product_id.trim()) {
      productId = parseInt(product_id, 10);
      const product = await db('products').where({ id: productId }).first();
      if (product) {
        productInterest = product.title || product.model_number;
        if (custom_deal_value && parseFloat(custom_deal_value) > 0) {
          dealValue = parseFloat(custom_deal_value);
        } else if (product.fixed_price) {
          dealValue = parseFloat(product.fixed_price);
        } else if (product.price_per_sqft && product.total_floor_area) {
          dealValue = parseFloat(product.price_per_sqft) * parseFloat(product.total_floor_area);
        }
      }
    } else if (custom_deal_value && parseFloat(custom_deal_value) > 0) {
      dealValue = parseFloat(custom_deal_value);
      productInterest = req.body.product_interest || 'Custom Prefab Structure';
    } else {
      productInterest = req.body.product_interest || null;
    }

    const commissionRate = tierInfo.rate || parseFloat(settings.commission_default_rate) || 2.0;
    const estCommission = Math.round((dealValue * commissionRate) / 100);

    const protectionDays = parseInt(settings.lead_protection_days, 10) || 90;
    const protectionExpiresAt = new Date(Date.now() + protectionDays * 24 * 60 * 60 * 1000);

    const [leadId] = await db('agent_leads').insert({
      agent_id: req.agent.id,
      product_id: productId,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_district: customer_district ? customer_district.trim() : null,
      product_interest: productInterest,
      deal_value: dealValue,
      commission_rate: commissionRate,
      estimated_commission: estCommission,
      commission_status: 'pending',
      milestone_stage: 'site_visit',
      protection_expires_at: protectionExpiresAt,
      notes: notes ? notes.trim() : null,
      status: 'new',
    });

    try {
      const text = `New Lead Submitted by Agent:
Agent Name: ${req.agent.name || 'N/A'} (${req.agent.business_name || 'N/A'})
Agent Code: ${getAgentReferralCode(req.agent)}
Phone: ${req.agent.phone || 'N/A'}
Tier: ${tierInfo.label} (${commissionRate}%)

Customer Details:
Name: ${customer_name}
Phone: ${customer_phone}
District: ${customer_district || 'N/A'}
Product: ${productInterest || 'N/A'}
Est. Deal Value: BDT ${dealValue.toLocaleString()}
Est. Commission: BDT ${estCommission.toLocaleString()}
Protected Until: ${protectionExpiresAt.toISOString().slice(0, 10)}
Notes: ${notes || 'N/A'}
`;
      await sendMail({
        to: process.env.MAIL_TO_SALES || 'sales@bongshai.com',
        subject: `[Agent Lead] ${customer_name} - ${productInterest || 'Inquiry'} (Ref: ${getAgentReferralCode(req.agent)})`,
        replyTo: req.agent.email || undefined,
        text,
      });
    } catch (err) {
      console.error('Failed to send agent lead notification email:', err.message);
    }

    sendTelegramAlert(
      `🔔 New Agent Lead #${leadId} from ${req.agent.name} (${getAgentReferralCode(req.agent)}):\n👤 ${customer_name}\n📞 ${customer_phone}\n📍 ${customer_district || 'N/A'}\n🏠 ${productInterest || 'N/A'}\n💰 Deal: ৳${dealValue.toLocaleString()} | Comm: ৳${estCommission.toLocaleString()} (${commissionRate}%)`
    );

    res.redirect('/agent/dashboard.html?lead_submitted=1');
  } catch (err) {
    console.error('Failed to submit agent lead:', err);
    res.redirect('/agent/dashboard.html?error=' + encodeURIComponent(err.message));
  }
});

// Co-branded PDF brochure download for agents
router.get('/agent/toolkit/brochure/:productId', requireAgent, async (req, res) => {
  try {
    const product = await db('products').where({ id: req.params.productId }).first();
    if (!product) return res.status(404).send('Product model not found');

    const specs = await db('product_specs').where({ product_id: product.id }).orderBy('sort_order', 'asc').catch(() => []);

    const safeTitle = (product.model_number || product.title || 'Product').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Bongshai-${safeTitle}-SpecSheet.pdf"`);

    generateBrochurePdf({ product, agent: req.agent, specs, res });
  } catch (err) {
    console.error('Failed to generate brochure:', err);
    res.status(500).send('Error generating PDF brochure');
  }
});

router.post('/agent/leads/:id/status', requireAgent, async (req, res) => {
  const { status } = req.body;
  const allowed = ['new', 'contacted', 'quoted', 'won', 'lost'];
  if (!allowed.includes(status)) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    return res.redirect('/agent/dashboard.html');
  }

  // CRITICAL: Scoped to req.agent.id so one agent cannot modify another agent's lead
  const updated = await db('agent_leads')
    .where({ id: req.params.id, agent_id: req.agent.id })
    .update({ status, updated_at: db.fn.now() });

  if (!updated) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(404).json({ error: 'Lead not found or unauthorized' });
    }
    return res.redirect('/agent/dashboard.html?error=Lead+not+found+or+unauthorized');
  }

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({ success: true, status });
  }

  const returnTo = req.body.return_to || '/agent/dashboard.html';
  res.redirect(returnTo);
});

router.get(['/agent/profile', '/agent/profile.html'], requireAgent, async (req, res) => {
  res.render('agent/profile.njk', {
    agent: req.agent,
    saved: req.query.saved === '1',
    error: req.query.error || null,
  });
});

router.post('/agent/profile', requireAgent, function (req, res, next) {
  documentUpload(req, res, (err) => {
    if (err) {
      return res.redirect('/agent/profile.html?error=' + encodeURIComponent(err.message));
    }
    next();
  });
}, async (req, res) => {
  try {
    const { contact_address, landline_phone, email, current_business_address, permanent_address, trade_license_number, tin_number } = req.body;
    
    const updateData = {
      updated_at: db.fn.now(),
    };

    if (typeof contact_address === 'string') updateData.contact_address = contact_address.trim() || null;
    if (typeof landline_phone === 'string') updateData.landline_phone = landline_phone.trim() || null;
    if (typeof email === 'string' && email.trim()) updateData.email = email.trim();
    if (typeof current_business_address === 'string') updateData.current_business_address = current_business_address.trim() || null;
    if (typeof permanent_address === 'string') updateData.permanent_address = permanent_address.trim() || null;
    if (typeof trade_license_number === 'string') updateData.trade_license_number = trade_license_number.trim() || null;
    if (typeof tin_number === 'string') updateData.tin_number = tin_number.trim() || null;

    if (req.files) {
      for (const field of DOCUMENT_FIELDS) {
        if (req.files[field] && req.files[field][0]) {
          const file = req.files[field][0];
          const savedName = saveDocument(file.buffer, file.mimetype);
          updateData[field] = savedName;
        }
      }
    }

    await db('agents').where({ id: req.agent.id }).update(updateData);
    res.redirect('/agent/profile.html?saved=1');
  } catch (err) {
    console.error('Agent profile update error:', err);
    res.redirect('/agent/profile.html?error=' + encodeURIComponent(err.message));
  }
});

router.get('/agent/document/:field', requireAgent, async (req, res) => {
  if (!DOCUMENT_FIELDS.includes(req.params.field)) return res.status(400).send('Invalid document field');
  const filename = req.agent[req.params.field];
  if (!filename) return res.status(404).send('Document not found');
  res.sendFile(documentPath(filename), (err) => {
    if (err) res.status(404).send('Document file not found');
  });
});

module.exports = router;
