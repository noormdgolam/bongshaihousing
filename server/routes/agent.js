const express = require('express');
const db = require('../lib/db');
const requireAgent = require('../middleware/requireAgent');
const { sendMail } = require('../lib/mailer');
const { sendTelegramAlert } = require('../lib/telegram');

const router = express.Router();

async function leadStats(agentId, filters = {}) {
  const allLeads = await db('agent_leads').where({ agent_id: agentId }).select('id', 'status', 'created_at');
  const stats = { total: allLeads.length, new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
  for (const l of allLeads) stats[l.status] = (stats[l.status] || 0) + 1;

  let query = db('agent_leads').where({ agent_id: agentId }).orderBy('created_at', 'desc');
  
  const statusFilter = filters.status || 'all';
  if (statusFilter && statusFilter !== 'all') {
    query = query.where({ status: statusFilter });
  }

  const search = (filters.q || '').trim();
  if (search) {
    query = query.where((builder) => {
      builder.where('customer_name', 'like', `%${search}%`)
        .orWhere('customer_phone', 'like', `%${search}%`)
        .orWhere('customer_district', 'like', `%${search}%`)
        .orWhere('product_interest', 'like', `%${search}%`);
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
  for (const l of leads) {
    l.is_overdue = l.status === 'new' && new Date(l.created_at) < oneDayAgo;
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
      q: search,
    }
  };
}

router.get(['/agent/dashboard', '/agent/dashboard.html'], requireAgent, async (req, res) => {
  const result = await leadStats(req.agent.id, req.query);
  res.render('agent/dashboard.njk', {
    agent: req.agent,
    leads: result.leads,
    stats: result.stats,
    pagination: result.pagination,
    filters: result.filters,
    error: null
  });
});

router.post('/agent/leads', requireAgent, async (req, res) => {
  const { customer_name, customer_phone, customer_district, product_interest, notes } = req.body;

  if (!customer_name || !customer_phone) {
    const { leads, stats } = await leadStats(req.agent.id);
    return res.status(400).render('agent/dashboard.njk', {
      agent: req.agent, leads, stats, error: 'Customer name and phone number are required.',
    });
  }

  await db('agent_leads').insert({
    agent_id: req.agent.id, customer_name, customer_phone,
    customer_district: customer_district || null,
    product_interest: product_interest || null,
    notes: notes || null,
  });

  try {
    const text = `New Lead Submitted by Agent:
Name: ${req.agent.name || 'N/A'}
Business: ${req.agent.business_name || 'N/A'}
Phone: ${req.agent.phone || 'N/A'}
Email: ${req.agent.email || 'N/A'}
District: ${req.agent.district || 'N/A'}

Customer Details:
Name: ${customer_name}
Phone: ${customer_phone}
District: ${customer_district || 'N/A'}
Interest: ${product_interest || 'N/A'}
Notes: ${notes || 'N/A'}
`;
    await sendMail({
      to: process.env.MAIL_TO_SALES || 'sales@bongshai.com',
      subject: `New Agent Lead from ${req.agent.business_name || req.agent.name || 'Agent'}`,
      replyTo: req.agent.email || undefined,
      text
    });
  } catch (err) {
    console.error('Failed to send agent lead notification email:', err);
  }

  sendTelegramAlert(
    `🔔 New Agent Lead from ${req.agent.business_name || req.agent.name}:\n👤 ${customer_name}\n📞 ${customer_phone}\n📍 ${customer_district || 'N/A'}\n🏠 ${product_interest || 'N/A'}`
  );

  res.redirect('/agent/dashboard.html');
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
    const result = await leadStats(req.agent.id, req.query);
    return res.status(404).render('agent/dashboard.njk', {
      agent: req.agent,
      leads: result.leads,
      stats: result.stats,
      pagination: result.pagination,
      filters: result.filters,
      error: 'Lead not found or unauthorized.'
    });
  }

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({ success: true, status });
  }

  const returnTo = req.body.return_to || '/agent/dashboard.html';
  res.redirect(returnTo);
});

module.exports = router;
