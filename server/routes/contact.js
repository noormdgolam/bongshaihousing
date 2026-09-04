const express = require('express');
const { stripTags, singleLine, sanitizeEmail, safeFilenamePart } = require('../lib/sanitize');
const { buildQuotePdf } = require('../lib/pdf');
const { sendMail } = require('../lib/mailer');
const { sendTelegramAlert } = require('../lib/telegram');
const { formatTakaAscii } = require('../lib/format');
const { normalizePhone } = require('../lib/customer-identity');
const { isValidBdPhone, checkDuplicate, leadDefaults, notifyOwner } = require('../lib/leads');
let db;
try {
  db = require('../lib/db');
} catch (e) {
  db = null;
}

const router = express.Router();

// Per-IP rate limit: this route sends real SMTP mail and generates a PDF on
// every hit, unlike the honeypot (which only catches bots that fill the
// hidden field) - a script that skips the honeypot could otherwise spam
// unlimited submissions, burning SMTP send quota / getting the sending
// domain flagged. Same in-memory Map pattern as admin-auth.js's login
// lockout (single-process app, no Redis needed).
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const submitAttempts = new Map(); // ip -> { count, windowStart }

function isRateLimited(ip) {
  const now = Date.now();
  const state = submitAttempts.get(ip);
  if (!state || now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
    submitAttempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  state.count += 1;
  if (submitAttempts.size > 5000) {
    for (const [key, val] of submitAttempts.entries()) {
      if (now - val.windowStart > RATE_LIMIT_WINDOW_MS) submitAttempts.delete(key);
    }
  }
  return state.count > RATE_LIMIT_MAX;
}

function getCookieVal(req, name) {
  if (!req.headers || !req.headers.cookie) return null;
  const match = req.headers.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// Mirrors send_email.php, wired to contact.html's #contactForm (submits JSON).
router.post('/send_email.php', async (req, res) => {
  const body = req.body || {};

  if (isRateLimited(req.ip)) {
    return res.status(429).json({ status: 'error', message: 'Too many requests. Please try again in a few minutes.' });
  }

  // Honeypot: legitimate visitors never see or fill this field (hidden via
  // CSS + aria-hidden in contact.html), so a non-empty value means a bot.
  // Return success without sending mail so bots don't learn to look elsewhere.
  if (body.website_url) {
    return res.status(200).json({ status: 'success', message: 'Message sent successfully.' });
  }

  const name = singleLine(body.name);
  const email = sanitizeEmail(body.email);
  const countryCode = stripTags(body.country_code);
  const phoneRaw = stripTags(body.phone);
  const phone = countryCode ? `${countryCode} ${phoneRaw}` : phoneRaw;
  const district = stripTags(body.district) || 'N/A';
  const upazila = stripTags(body.upazila) || 'N/A';
  const model = stripTags(body.model) || 'N/A';
  const floorArea = stripTags(body.floor_area) || 'N/A';
  const bedrooms = stripTags(body.bedrooms) || 'N/A';
  const message = stripTags(body.message) || 'No additional notes.';

  // email is intentionally NOT required here (leads.email is nullable as of
  // the 2026-09-05 migration): this same route is what the cost calculators'
  // postLeadToCrm() posts to, and neither calculator form has ever collected
  // an email address. Requiring it meant every calculator-sourced submission
  // was silently rejected with a 400 - postLeadToCrm's fetch().catch(()=>{})
  // swallows that, so the visitor still saw the WhatsApp handoff open and had
  // no way to know the lead was never actually recorded. Confirmed live:
  // production had exactly 1 row in `leads`, source=contact_form, zero with
  // source=calculator, despite the calculators being live and "working" all
  // session from a visitor's point of view.
  if (!name || !phoneRaw) {
    return res.status(400).json({ status: 'error', message: 'Please fill in all required fields.' });
  }

  const phoneKey = isValidBdPhone(phoneRaw);

  // Save to database leads table if DB is available
  let leadId = null;
  let isNewLead = false; // false on a dedup hit - controls whether we notify
  // the owner and credit an agent referral again below, so a visitor
  // resubmitting the same form (or the calculator + contact form both firing
  // for the same person within a few minutes) doesn't page the owner twice
  // or double-credit a commission for one underlying inquiry.
  let portalCustomer = null; // set below if auto-provisioning succeeds
  if (db) {
    try {
      const dup = await checkDuplicate(phoneKey, 'bongshaihousing.com');
      if (dup) {
        leadId = dup.id;
      }

      const refCode = req.session?.agentRef || getCookieVal(req, 'bh_agent_ref');
      let attributedAgent = null;

      if (!dup && refCode) {
        attributedAgent = await db('agents').where({ referral_code: refCode, status: 'active' }).first();
        if (!attributedAgent) {
          const { parseAgentIdFromFallbackCode } = require('../lib/agent-settings');
          const numericId = parseAgentIdFromFallbackCode(refCode);
          if (numericId !== null) {
            attributedAgent = await db('agents').where({ id: numericId, status: 'active' }).first();
          }
        }
      }

      if (!dup) [leadId] = await db('leads').insert({
        name,
        email,
        phone,
        ...leadDefaults(phoneKey, 'bongshaihousing.com'),
        district: district !== 'N/A' ? district : null,
        upazila: upazila !== 'N/A' ? upazila : null,
        model: model !== 'N/A' ? model : null,
        floor_area: floorArea !== 'N/A' ? floorArea : null,
        bedrooms: bedrooms !== 'N/A' ? bedrooms : null,
        message: message !== 'No additional notes.' ? message : null,
        // status comes from leadDefaults() above (Bangla funnel, defaults to
        // নতুন) - not re-set here, so it isn't silently overridden back to
        // the old English 'new' value by object-literal ordering.
        // The lead pipeline's "কোথা থেকে এসেছে" column wants the UTM source
        // (js/utm-capture.js attaches it as body.utm_source from a 30-day
        // first-party cookie), falling back to this route's own pre-existing
        // channel labels when no campaign data exists at all - an agent
        // referral link, or plain 'contact_form', are still more informative
        // than a bare "direct".
        source: attributedAgent ? `agent_referral: ${refCode}` : (stripTags(body.utm_source) || 'contact_form'),
      });
      if (!dup) isNewLead = true;

      // If referral lead, auto-attribute into agent_leads table
      if (attributedAgent) {
        try {
          const { getAgentSettings, calculateAgentTier } = require('../lib/agent-settings');
          const settings = await getAgentSettings(db);
          const [wonRow] = await db('agent_leads').where({ agent_id: attributedAgent.id, status: 'won' }).count({ count: '*' }).catch(() => [{ count: 0 }]);
          const tierInfo = calculateAgentTier(wonRow?.count || 0, settings);
          const commissionRate = tierInfo.rate || 2.0;

          let product = null;
          if (model && model !== 'N/A') {
            product = await db('products')
              .where('title', 'like', `%${model}%`)
              .orWhere('model_number', 'like', `%${model}%`)
              .first()
              .catch(() => null);
          }

          let dealVal = 0;
          if (product) {
            if (product.fixed_price) dealVal = parseFloat(product.fixed_price);
            else if (product.price_per_sqft && product.total_floor_area) dealVal = parseFloat(product.price_per_sqft) * parseFloat(product.total_floor_area);
          }
          const estComm = Math.round((dealVal * commissionRate) / 100);
          const protectionDays = parseInt(settings.lead_protection_days, 10) || 90;
          const protectionExpiresAt = new Date(Date.now() + protectionDays * 24 * 60 * 60 * 1000);

          await db('agent_leads').insert({
            agent_id: attributedAgent.id,
            product_id: product?.id || null,
            customer_name: name,
            customer_phone: phone,
            customer_district: district !== 'N/A' ? district : null,
            product_interest: model !== 'N/A' ? model : (product?.title || null),
            deal_value: dealVal,
            commission_rate: commissionRate,
            estimated_commission: estComm,
            commission_status: 'pending',
            milestone_stage: 'site_visit',
            protection_expires_at: protectionExpiresAt,
            notes: `Auto-attributed via public website inquiry (Partner Code: ${refCode}). Message: ${message !== 'No additional notes.' ? message : 'N/A'}`,
            status: 'new',
          });
        } catch (attrErr) {
          console.error('[AutoAttribution] Failed to attribute lead to agent:', attrErr.message);
        }
      }

      const hasActivity = await db.schema.hasTable('activity_log');
      if (hasActivity) {
        await db('activity_log').insert({
          admin_name: 'Website Lead Capture',
          action: 'create',
          entity_type: 'lead',
          entity_id: leadId || null,
          summary: `New quote inquiry from ${name} (${district}) for ${model}${attributedAgent ? ` [Ref: ${refCode} -> Agent: ${attributedAgent.name}]` : ''}`,
        });
      }

      // Auto-provision a portal account for this phone number (or reuse
      // the existing one for a repeat inquiry) and link this lead to it,
      // so the visitor can immediately check status at /my-project
      // without waiting for a sale to close. Best-effort - a failure
      // here shouldn't block the inquiry itself from succeeding.
      try {
        const phoneKey = normalizePhone(phoneRaw);
        if (phoneKey) {
          portalCustomer = await db('customers').where({ phone_key: phoneKey }).first();
          if (!portalCustomer) {
            const [customerId] = await db('customers').insert({ name, phone_key: phoneKey, phone, email });
            portalCustomer = { id: customerId, name, phone_key: phoneKey, phone, email, password_hash: null };
          } else if (!portalCustomer.email && email) {
            await db('customers').where({ id: portalCustomer.id }).update({ email });
          }
          await db('leads').where({ id: leadId }).update({ customer_id: portalCustomer.id });

          // Log them straight into the portal - submitting the form from
          // this browser is proof enough of ownership for a first look at
          // their own inquiry; regenerate() first so a stale/anonymous
          // session id isn't reused for a newly-identified visitor.
          await new Promise((resolve) => {
            req.session.regenerate((err) => {
              if (err) { console.error('Session regenerate failed for auto-login:', err.message); return resolve(); }
              req.session.customerId = portalCustomer.id;
              req.session.save(resolve);
            });
          });
        }
      } catch (custErr) {
        console.error('Failed to auto-provision customer portal account:', custErr.message);
      }
    } catch (dbErr) {
      console.error('Failed to save lead to database:', dbErr.message);
    }
  }

  sendTelegramAlert(
    `🔔 New Lead: ${name}\n📞 ${phone}\n📍 ${district}, ${upazila}\n🏠 ${model}\n💬 ${message}`
  );
  // WhatsApp (falling back to email) - only for a genuinely new lead, not a
  // dedup hit within 24h, so a visitor resubmitting the form doesn't page
  // the owner twice about the same person.
  if (isNewLead) {
    notifyOwner({ name, phoneDisplay: phone, district: district !== 'N/A' ? district : null, product: model !== 'N/A' ? model : null })
      .catch((e) => console.error('[leads] notify failed:', e.message));
  }

  // Ballpark estimate for the sales rep's reference, not a customer-facing
  // quote - only computed when the form's free-text model/floor-area
  // values happen to match a real catalog entry and a real number.
  let estimatedPrice = null;
  if (db && model !== 'N/A') {
    try {
      const product = await db('products').where({ model_number: model }).first();
      const numericArea = Number(floorArea);
      if (product && product.price_per_sqft && Number.isFinite(numericArea) && numericArea > 0) {
        estimatedPrice = formatTakaAscii(numericArea * product.price_per_sqft);
      }
    } catch (priceErr) {
      console.error('Failed to compute estimated price for PDF:', priceErr.message);
    }
  }

  const filename = `${safeFilenamePart(name)}_${safeFilenamePart(model)}.pdf`;

  let pdfBuffer;
  try {
    pdfBuffer = await buildQuotePdf({ name, email, phone, district, upazila, model, floorArea, bedrooms, message, leadId, estimatedPrice });
  } catch (err) {
    // The lead itself (and portal account) is already saved above even
    // though the PDF failed - still hand back dashboard access so the
    // customer isn't left with no way to check on an inquiry that did
    // go through.
    return res.status(500).json({
      status: 'error',
      message: `Failed to generate PDF. Error: ${err.message}`,
      dashboardUrl: portalCustomer ? '/my-project' : null,
    });
  }

  try {
    await sendMail({
      to: process.env.MAIL_TO_SALES || 'sales@bongshai.com',
      subject: `New Quote Request from ${name}`,
      replyTo: email || undefined, // calculator-sourced leads have no email
      text:
        'You have received a new inquiry from your website contact form. Please find the detailed Quote Request attached as a PDF.\n\n' +
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nModel: ${model}\n`,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });
    return res.status(200).json({
      status: 'success',
      message: 'Message sent successfully.',
      dashboardUrl: portalCustomer ? '/my-project' : null,
      hasPassword: portalCustomer ? !!portalCustomer.password_hash : null,
    });
  } catch (err) {
    console.error('send_email.php mail failure:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Message could not be sent. Please check your mail server configuration.',
      dashboardUrl: portalCustomer ? '/my-project' : null,
    });
  }
});

module.exports = router;
