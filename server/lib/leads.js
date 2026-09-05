// Shared lead-recording pipeline. Every entry point (contact form + both cost
// calculators via /send_email.php, agent signup, POST /api/leads, and any future
// sister-site form) calls recordLead() instead of writing to the `leads` table
// directly - so "every form that collects a phone number writes to the same
// place" is true by construction, not by every route remembering to do it.
//
// System of record is the existing `leads` DB table (already live, already
// feeding agent-referral commission attribution and portal auto-provisioning -
// see server/routes/contact.js), extended by the 2026-09-05 migrations rather
// than introducing a second, parallel Google-Sheet-backed store.
const db = require('./db');
const fs = require('fs');
const path = require('path');
const { sendWhatsAppTemplate } = require('./whatsapp');
const { sendMail } = require('./mailer');

const BD_PHONE_RE = /^01[3-9]\d{8}$/;
const FALLBACK_LOG = path.join(__dirname, '..', 'data', 'leads-fallback.jsonl');
const KNOWN_SITES = ['bongshaihousing.com', 'bongshaisteel.com', 'bongshaiengineering.com', 'bongshai.com'];
const TERMINAL_STATUSES = ['বিক্রি', 'হারানো'];

// A lead is "overdue" when a followup date has passed with no touch logged
// since - compares last_touch_at against each followup date rather than a
// literal "next_action is empty" check, because next_action holds the latest
// touch note (not a boolean), and a static empty-check would stop flagging a
// row forever after one touch, even once the *next* scheduled date (2 or 3)
// later passes untouched. Shared by /agent/today (server/routes/lead-dashboard.js)
// and the weekly report (server/lib/lead-report.js) so both ever mean the same
// thing by "overdue" - built once here instead of risking the two definitions
// drifting apart under separate edits.
function applyOverdueFilter(qb) {
  const today = new Date().toISOString().slice(0, 10);
  qb.whereNotIn('status', TERMINAL_STATUSES).where((outer) => {
    outer.where((q) => q.whereNotNull('followup_1_at').andWhere('followup_1_at', '<=', today)
      .andWhere((q2) => q2.whereNull('last_touch_at').orWhere('last_touch_at', '<', db.raw('followup_1_at'))))
      .orWhere((q) => q.whereNotNull('followup_2_at').andWhere('followup_2_at', '<=', today)
        .andWhere((q2) => q2.whereNull('last_touch_at').orWhere('last_touch_at', '<', db.raw('followup_2_at'))))
      .orWhere((q) => q.whereNotNull('followup_3_at').andWhere('followup_3_at', '<=', today)
        .andWhere((q2) => q2.whereNull('last_touch_at').orWhere('last_touch_at', '<', db.raw('followup_3_at'))));
  });
}

// Accepts a Bangladeshi mobile in any of the forms visitors actually type -
// "01712345678", "+8801712345678", "880 1712-345678" - and returns the
// canonical 11-digit local form (01[3-9]XXXXXXXX), or null if it never
// resolves to a valid BD mobile number. This canonical form doubles as the
// dedup key.
function isValidBdPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('880')) local = '0' + local.slice(3);
  else if (local.length === 10 && !local.startsWith('0')) local = '0' + local;
  return BD_PHONE_RE.test(local) ? local : null;
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Last-resort record of a lead that couldn't reach the database - append-only,
// one JSON object per line, so a lead is never silently dropped even if the DB
// itself is down. Not a queue to replay automatically (small and boring): the
// operator greps/reads this file by hand if it's ever non-empty.
function appendFallbackLog(payload, reason) {
  try {
    fs.mkdirSync(path.dirname(FALLBACK_LOG), { recursive: true });
    fs.appendFileSync(FALLBACK_LOG, JSON.stringify({ at: new Date().toISOString(), reason, payload }) + '\n');
  } catch (e) {
    console.error('[leads] FALLBACK LOG ITSELF FAILED - lead may be lost:', e.message, JSON.stringify(payload));
  }
}

// WhatsApp, falling back to email if unavailable/failed - exactly the two
// channels the spec asks for. Deliberately does NOT also fire Telegram here:
// server/routes/contact.js already sends its own Telegram alert on every
// contact-form/calculator lead (lib/telegram.js), and this function is called
// from inside that same request - calling it again here would double-notify
// for that path. Callers with no notify channel of their own (agent signup,
// the public /api/leads route) get exactly WhatsApp+email from this, which is
// what the spec actually asks this pipeline to guarantee.
async function notifyOwner({ name, phoneDisplay, district, product }) {
  const waLink = `https://wa.me/88${String(phoneDisplay).replace(/\D/g, '')}`;
  const summary = `🔔 নতুন লিড\n👤 ${name}\n📞 ${phoneDisplay}\n📍 ${district || 'N/A'}\n🏠 ${product || 'N/A'}\n${waLink}`;

  let whatsappOk = false;
  try {
    whatsappOk = await sendWhatsAppTemplate({ name, phoneDisplay, district, product });
  } catch (e) {
    console.error('[leads] WhatsApp notify failed:', e.message);
  }

  if (!whatsappOk) {
    try {
      await sendMail({
        to: process.env.OWNER_NOTIFY_EMAIL || process.env.MAIL_TO_SALES || 'sales@bongshai.com',
        subject: `নতুন লিড: ${name}`,
        text: summary,
      });
    } catch (e) {
      console.error('[leads] Email fallback notify also failed:', e.message);
    }
  }

  return whatsappOk;
}

/**
 * Records a lead: validates the phone, dedups (same normalized phone + same
 * site within 24h), inserts into `leads`, pre-fills the three followup dates,
 * and notifies the owner. Never throws - every failure mode is caught, logged,
 * and reflected in the returned result, because a visitor's form submission
 * succeeding should never depend on notify/DB internals working.
 *
 * @param {object} input
 * @param {string} input.name
 * @param {string} input.phone
 * @param {string} [input.district]
 * @param {string} [input.source]  utm_source, or 'direct'
 * @param {string} [input.product]
 * @param {string|number} [input.sft]
 * @param {string} [input.budget]
 * @param {string} [input.message]
 * @param {string} [input.email]
 * @param {string} [input.site]  defaults to bongshaihousing.com
 * @returns {Promise<{ok:boolean, deduped:boolean, leadId:?number, reason:?string}>}
 */
async function recordLead(input) {
  const name = String(input.name || '').trim();
  const phoneKey = isValidBdPhone(input.phone);
  const site = KNOWN_SITES.includes(input.site) ? input.site : 'bongshaihousing.com';

  if (!name) return { ok: false, deduped: false, leadId: null, reason: 'name required' };
  if (!phoneKey) return { ok: false, deduped: false, leadId: null, reason: 'invalid Bangladesh mobile number' };

  const payload = {
    name,
    phone: String(input.phone).trim(),
    phone_key: phoneKey,
    site,
    district: input.district ? String(input.district).trim() : null,
    source: input.source ? String(input.source).trim().slice(0, 50) : 'direct',
    model: input.product ? String(input.product).trim() : null,
    floor_area: input.sft != null && input.sft !== '' ? String(input.sft) : null,
    budget: input.budget ? String(input.budget).trim() : null,
    message: input.message ? String(input.message).trim() : null,
    email: input.email ? String(input.email).trim() : null,
  };

  if (!db) {
    appendFallbackLog(payload, 'database unavailable');
    await notifyOwner({ name, phoneDisplay: payload.phone, district: payload.district, product: payload.model });
    return { ok: false, deduped: false, leadId: null, reason: 'database unavailable, logged to fallback file' };
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dup = await db('leads').where({ phone_key: phoneKey, site }).andWhere('created_at', '>', since).first();
    if (dup) {
      return { ok: true, deduped: true, leadId: dup.id, reason: 'duplicate phone+site within 24h' };
    }

    const [leadId] = await db('leads').insert({
      ...payload,
      status: 'নতুন',
      followup_1_at: addDays(3),
      followup_2_at: addDays(14),
      followup_3_at: addDays(45),
    });

    // Fire-and-forget: the lead is already safely written, so a slow or
    // failed notify shouldn't delay the caller's response.
    notifyOwner({ name, phoneDisplay: payload.phone, district: payload.district, product: payload.model })
      .catch((e) => console.error('[leads] post-insert notify failed:', e.message));

    return { ok: true, deduped: false, leadId, reason: null };
  } catch (err) {
    console.error('[leads] DB write failed, falling back to file + notify:', err.message);
    appendFallbackLog(payload, err.message);
    await notifyOwner({ name, phoneDisplay: payload.phone, district: payload.district, product: payload.model });
    return { ok: false, deduped: false, leadId: null, reason: 'db write failed, logged to fallback file' };
  }
}

// Checks the same dedup rule recordLead() uses (same phone + same site within
// 24h), without writing anything - for a caller that already builds its own
// insert (server/routes/contact.js) and needs to decide *before* inserting
// whether this is a repeat submission.
async function checkDuplicate(phoneKey, site) {
  if (!db || !phoneKey) return null;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const targetSite = KNOWN_SITES.includes(site) ? site : 'bongshaihousing.com';
  return db('leads').where({ phone_key: phoneKey, site: targetSite }).andWhere('created_at', '>', since).first();
}

// The fields every new lead row needs regardless of which route is inserting
// it - for a caller with its own insert (contact.js) to spread into its own
// field object, so the dedup key and followup schedule stay identical across
// every entry point without duplicating this logic per-route.
function leadDefaults(phoneKey, site) {
  return {
    phone_key: phoneKey,
    site: KNOWN_SITES.includes(site) ? site : 'bongshaihousing.com',
    status: 'নতুন',
    followup_1_at: addDays(3),
    followup_2_at: addDays(14),
    followup_3_at: addDays(45),
  };
}

module.exports = {
  recordLead, isValidBdPhone, checkDuplicate, leadDefaults, notifyOwner, appendFallbackLog,
  applyOverdueFilter, KNOWN_SITES, TERMINAL_STATUSES,
};
