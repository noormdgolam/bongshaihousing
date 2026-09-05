// The internal lead dashboard - an operations tool for the owner + a few
// agents, reusing the existing /agent/* login (see middleware/requireAgent.js)
// rather than a new auth system. System of record is the `leads` table
// (extended by the 2026-09-05 migrations), populated by lib/leads.js from
// every entry point (contact form, calculators, agent signup, POST /api/leads).
//
// Deliberately does NOT touch the existing /agent/leads, /agent/dashboard.html
// etc. routes in routes/agent.js - those are a separate, already-working
// referral-commission system built on the `agent_leads` table, a different
// data model. This file only adds new routes.
const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const requireAgent = require('../middleware/requireAgent');
const { sendWhatsAppTemplate } = require('../lib/whatsapp');
const { applyOverdueFilter } = require('../lib/leads');

// Express 4 does not catch a rejected promise from an async route handler -
// an uncaught error inside one leaves the request hanging with NO response
// at all (not even a timeout) rather than a 500, since nothing ever calls
// res.send()/res.render(). Wrapping every handler here turns "the dashboard
// silently hangs forever" into a real, visible error - essential for an
// internal tool with no other error-reporting channel.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error('[lead-dashboard]', req.method, req.path, err);
      if (!res.headersSent) res.status(500).send(`Dashboard error: ${err.message}`);
    });
  };
}

const STATUSES = ['নতুন', 'যোগাযোগ হয়েছে', 'কোটেশন দেওয়া', 'সাইট ভিজিট', 'আলোচনায়', 'বিক্রি', 'হারানো'];
const TERMINAL_STATUSES = ['বিক্রি', 'হারানো'];
const LOST_REASONS = ['দাম', 'প্রস্তুত না', 'সন্দেহ', 'প্রতিযোগী', 'অন্যান্য'];
const SETTINGS_KEY = 'lead_dashboard_settings';

const DEFAULT_TEMPLATES = [
  { id: 1, label: 'প্রথম যোগাযোগ', text: 'আসসালামু আলাইকুম {{নাম}} ভাই। বংশাই হাউজিং থেকে বলছি। আপনি {{জেলা}}-তে আমাদের সাথে যোগাযোগ করেছিলেন। আপনার প্রয়োজন সম্পর্কে একটু জানতে চাই, কখন কথা বলা সুবিধাজনক হবে?' },
  { id: 2, label: 'ফলোআপ', text: '{{নাম}} ভাই, আসসালামু আলাইকুম। {{তারিখ}}-এ আমাদের কথা হয়েছিল। আপনার সিদ্ধান্ত সম্পর্কে জানালে খুশি হব। কোনো প্রশ্ন থাকলে জানাবেন।' },
  { id: 3, label: 'কোটেশনের পর', text: '{{নাম}} ভাই, আপনার কোটেশনটি দেখেছেন কি? দাম বা শর্ত নিয়ে কোনো প্রশ্ন থাকলে সরাসরি কল করুন, আলোচনা করতে পারি।' },
];

// theme_settings is a wide key/value table (setting_key, setting_value - one
// row per named setting), NOT the narrow {key, data} shape its original
// migration described - a later migration (20260817000013) renamed the
// columns to match what lib/theme.js has always actually queried. Reusing
// that same real schema here rather than a {key, data} pair that was never
// actually live.
async function getSettings() {
  const row = await db('theme_settings').where({ setting_key: SETTINGS_KEY }).first();
  if (!row) return { adSpendFacebookMonthly: 0, templates: DEFAULT_TEMPLATES };
  try {
    const data = JSON.parse(row.setting_value);
    return { adSpendFacebookMonthly: data.adSpendFacebookMonthly || 0, templates: data.templates || DEFAULT_TEMPLATES };
  } catch (e) {
    return { adSpendFacebookMonthly: 0, templates: DEFAULT_TEMPLATES };
  }
}

async function saveSettings(settings) {
  const exists = await db('theme_settings').where({ setting_key: SETTINGS_KEY }).first();
  const setting_value = JSON.stringify(settings);
  if (exists) await db('theme_settings').where({ setting_key: SETTINGS_KEY }).update({ setting_value, updated_at: db.fn.now() });
  else await db('theme_settings').insert({ setting_key: SETTINGS_KEY, setting_value });
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysStr(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function waLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  const local = digits.startsWith('880') ? digits : digits.startsWith('0') ? '88' + digits.slice(1) : '88' + digits;
  return `https://wa.me/${local}` + (text ? `?text=${encodeURIComponent(text)}` : '');
}

// Plain-text top-bar numbers for the current calendar month - no chart
// library, just counts. "Cost per lead" divides the editable monthly ad-spend
// setting by leads whose source is literally 'facebook' (utm_source=facebook,
// or the fbclid-derived fallback in js/utm-capture.js) - the spec's own
// parenthetical defines the denominator this way, so that's what's used
// rather than a broader "any paid source" guess.
async function computeMonthlyStats(isAdmin, agentId) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const base = () => db('leads').where('created_at', '>=', monthStart).modify((qb) => {
    if (!isAdmin) qb.where({ assigned_to: agentId });
  });

  const [leads] = await base().count({ n: '*' });
  const [quoted] = await base().whereIn('status', ['কোটেশন দেওয়া', 'সাইট ভিজিট', 'আলোচনায়', 'বিক্রি', 'হারানো']).count({ n: '*' });
  const [sold] = await base().where({ status: 'বিক্রি' }).count({ n: '*' });
  const [lost] = await base().where({ status: 'হারানো' }).count({ n: '*' });
  const [fbLeads] = await base().where({ source: 'facebook' }).count({ n: '*' });

  const settings = await getSettings();
  const adSpend = settings.adSpendFacebookMonthly || 0;
  const costPerLead = fbLeads.n > 0 ? Math.round(adSpend / fbLeads.n) : null;
  const quoteRate = leads.n > 0 ? Math.round((quoted.n / leads.n) * 100) : 0;

  return { leads: leads.n, quoted: quoted.n, quoteRate, sold: sold.n, lost: lost.n, costPerLead, fbLeads: fbLeads.n };
}

// ---------------------------------------------------------------------------
// "আজকের কাজ" - the default landing page. Sorted by urgency: overdue
// followups, quoted-with-no-followup, then untouched new leads. "Overdue" is
// applyOverdueFilter() from lib/leads.js - shared with the weekly report so
// the two can't drift into disagreeing about what "overdue" means.
// ---------------------------------------------------------------------------
router.get(['/agent/today', '/agent/today.html'], requireAgent, asyncHandler(async (req, res) => {
  const isAdmin = req.agent.role === 'admin';
  const today = todayStr();

  const base = () => db('leads').whereNotIn('status', TERMINAL_STATUSES).modify((qb) => {
    if (!isAdmin) qb.where({ assigned_to: req.agent.id });
  });

  const overdue = await db('leads').modify(applyOverdueFilter).modify((qb) => {
    if (!isAdmin) qb.where({ assigned_to: req.agent.id });
  }).orderBy('created_at', 'asc');

  const overdueIds = overdue.map((r) => r.id);

  const quotedNoFollowup = await base()
    .where({ status: 'কোটেশন দেওয়া' })
    .whereNotIn('id', overdueIds.length ? overdueIds : [0])
    .where((qb) => qb.whereNull('last_touch_at').orWhere('last_touch_at', '<', db.raw('quoted_at')))
    .orderBy('quoted_at', 'asc');

  const quotedIds = quotedNoFollowup.map((r) => r.id);

  const newUncontacted = await base()
    .where({ status: 'নতুন' })
    .whereNotIn('id', [...overdueIds, ...quotedIds, 0])
    .orderBy('created_at', 'asc');

  const rows = [
    ...overdue.map((r) => ({ ...r, reason: 'ফলোআপ বাকি' })),
    ...quotedNoFollowup.map((r) => ({ ...r, reason: 'কোটেশনের পর যোগাযোগ হয়নি' })),
    ...newUncontacted.map((r) => ({ ...r, reason: 'নতুন লিড' })),
  ].map((r) => ({
    ...r,
    daysSinceTouch: daysSince(r.last_touch_at || r.created_at),
    waHref: waLink(r.phone),
    telHref: `tel:${r.phone}`,
  }));

  const settings = await getSettings();
  const stats = await computeMonthlyStats(isAdmin, req.agent.id);
  res.render('agent/leads-today.njk', {
    rows,
    templates: settings.templates,
    isAdmin,
    agentName: req.agent.name,
    stats,
  });
}));

router.post('/agent/today/touch/:id', requireAgent, asyncHandler(async (req, res) => {
  const isAdmin = req.agent.role === 'admin';
  const lead = await db('leads').where({ id: req.params.id }).first();
  if (!lead) return res.status(404).send('Lead not found');
  if (!isAdmin && lead.assigned_to !== req.agent.id) return res.status(403).send('Not assigned to you');

  const note = String(req.body.note || 'যোগাযোগ করা হয়েছে').trim().slice(0, 500);
  await db('leads').where({ id: lead.id }).update({ next_action: note, last_touch_at: db.fn.now() });
  await db('lead_notes').insert({ lead_id: lead.id, note, created_by: req.agent.id, created_by_name: req.agent.name });

  res.redirect(req.body.return_to || '/agent/today');
}));

// ---------------------------------------------------------------------------
// All leads - filterable table, inline status edit, CSV export/import.
// ---------------------------------------------------------------------------
function applyLeadFilters(qb, { isAdmin, agentId, status, source, district, from, to, q }) {
  if (!isAdmin) qb.where({ assigned_to: agentId });
  if (status) qb.where({ status });
  if (source) qb.where({ source });
  if (district) qb.where('district', 'like', `%${district}%`);
  if (from) qb.where('created_at', '>=', from);
  if (to) qb.where('created_at', '<=', to + ' 23:59:59');
  if (q) qb.where((q2) => q2.where('name', 'like', `%${q}%`).orWhere('phone', 'like', `%${q}%`));
}

router.get(['/agent/all-leads', '/agent/all-leads.html'], requireAgent, asyncHandler(async (req, res) => {
  const isAdmin = req.agent.role === 'admin';
  const { status, source, district, from, to, q } = req.query;
  const filterArgs = { isAdmin, agentId: req.agent.id, status, source, district, from, to, q };

  const rows = await db('leads').modify((qb) => applyLeadFilters(qb, filterArgs))
    .orderBy('created_at', 'desc').limit(300);
  const districts = await db('leads').distinct('district').whereNotNull('district').pluck('district');
  const sources = await db('leads').distinct('source').whereNotNull('source').pluck('source');

  res.render('agent/all-leads.njk', {
    rows, statuses: STATUSES, lostReasons: LOST_REASONS,
    districts: districts.filter(Boolean), sources: sources.filter(Boolean),
    filters: { status, source, district, from, to, q },
    query_string: new URLSearchParams(req.query).toString(),
    isAdmin, agentName: req.agent.name,
  });
}));

router.post('/agent/all-leads/:id/status', requireAgent, asyncHandler(async (req, res) => {
  const isAdmin = req.agent.role === 'admin';
  const lead = await db('leads').where({ id: req.params.id }).first();
  if (!lead) return res.status(404).send('Lead not found');
  if (!isAdmin && lead.assigned_to !== req.agent.id) return res.status(403).send('Not assigned to you');

  const status = req.body.status;
  if (!STATUSES.includes(status)) return res.status(400).send('Invalid status');

  const patch = { status };
  if (status === 'কোটেশন দেওয়া' && lead.status !== 'কোটেশন দেওয়া') {
    // Spec: quote sent resets the followup cadence to a tighter schedule.
    patch.quoted_at = db.fn.now();
    patch.followup_1_at = addDaysStr(2);
    patch.followup_2_at = addDaysStr(7);
    patch.followup_3_at = addDaysStr(21);
    if (req.body.quote_amount) patch.quote_amount = parseFloat(req.body.quote_amount) || null;
  }
  if (status === 'হারানো' && req.body.lost_reason && LOST_REASONS.includes(req.body.lost_reason)) {
    patch.lost_reason = req.body.lost_reason;
  }
  if (isAdmin && req.body.assigned_to !== undefined) {
    patch.assigned_to = req.body.assigned_to ? parseInt(req.body.assigned_to, 10) : null;
  }

  await db('leads').where({ id: lead.id }).update(patch);
  if (status !== lead.status) {
    await db('lead_notes').insert({
      lead_id: lead.id, created_by: req.agent.id, created_by_name: req.agent.name,
      note: `স্ট্যাটাস পরিবর্তন: ${lead.status} → ${status}`,
    });
  }
  res.redirect(req.body.return_to || '/agent/all-leads');
}));

router.get('/agent/all-leads/export.csv', requireAgent, asyncHandler(async (req, res) => {
  const isAdmin = req.agent.role === 'admin';
  const { status, source, district, from, to, q } = req.query;
  const filterArgs = { isAdmin, agentId: req.agent.id, status, source, district, from, to, q };
  const rows = await db('leads').modify((qb) => applyLeadFilters(qb, filterArgs)).orderBy('created_at', 'desc');

  const headers = ['তারিখ', 'নাম', 'ফোন', 'জেলা', 'কোথা থেকে এসেছে', 'কী চায়', 'আনুমানিক সাইজ (sft)', 'বাজেট', 'স্ট্যাটাস', 'ফলোআপ ১ (তারিখ)', 'ফলোআপ ২ (তারিখ)', 'ফলোআপ ৩ (তারিখ)', 'পরবর্তী কাজ', 'নোট'];
  const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  // created_at is a TIMESTAMP (unaffected by knexfile's DATE-only
  // dateStrings), so it still comes back as a JS Date object here - plain
  // String(dateObject) prints Node's full locale-dependent toString()
  // (weekday, timezone name and all), not a clean date for a CSV column.
  const fmtDateTime = (v) => (v ? new Date(v).toISOString().slice(0, 16).replace('T', ' ') : '');
  const lines = [headers.map(esc).join(',')];
  rows.forEach((r) => {
    lines.push([
      fmtDateTime(r.created_at), r.name, r.phone, r.district, r.source, r.model, r.floor_area, r.budget,
      r.status, r.followup_1_at, r.followup_2_at, r.followup_3_at, r.next_action, r.message,
    ].map(esc).join(','));
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="leads-${todayStr()}.csv"`);
  res.send('﻿' + lines.join('\r\n')); // BOM so Excel opens Bangla correctly
}));

// One-time migration path from a pre-existing Google Sheet (or any export
// with these exact Bangla headers) into the DB - not an ongoing sync. Sent as
// JSON ({_csrf, csv}) rather than a raw text/csv body specifically so the
// existing global express.json() parser (server.js) populates req.body._csrf
// the way the generic /agent CSRF middleware already expects - a raw-text
// body would reach that middleware unparsed and always fail its check before
// this handler ever ran.
router.post('/agent/all-leads/import', requireAgent, asyncHandler(async (req, res) => {
  if (req.agent.role !== 'admin') return res.status(403).send('Admin only');

  const text = String(req.body.csv || '').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return res.status(400).send('CSV appears empty');

  function parseCsvLine(line) {
    const out = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out;
  }

  const headerMap = {
    'তারিখ': 'created_at', 'নাম': 'name', 'ফোন': 'phone', 'জেলা': 'district',
    'কোথা থেকে এসেছে': 'source', 'কী চায়': 'model', 'আনুমানিক সাইজ (sft)': 'floor_area',
    'বাজেট': 'budget', 'স্ট্যাটাস': 'status', 'ফলোআপ ১ (তারিখ)': 'followup_1_at',
    'ফলোআপ ২ (তারিখ)': 'followup_2_at', 'ফলোআপ ৩ (তারিখ)': 'followup_3_at',
    'পরবর্তী কাজ': 'next_action', 'নোট': 'message',
  };
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const cols = headers.map((h) => headerMap[h] || null);

  const { isValidBdPhone } = require('../lib/leads');
  let imported = 0; let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row = {};
    cols.forEach((field, idx) => { if (field) row[field] = (cells[idx] || '').trim() || null; });
    const phoneKey = isValidBdPhone(row.phone);
    if (!row.name || !phoneKey) { skipped++; continue; }
    await db('leads').insert({
      name: row.name, phone: row.phone, phone_key: phoneKey, site: 'bongshaihousing.com',
      district: row.district, source: row.source || 'import', model: row.model,
      floor_area: row.floor_area, budget: row.budget,
      status: STATUSES.includes(row.status) ? row.status : 'নতুন',
      followup_1_at: row.followup_1_at || null, followup_2_at: row.followup_2_at || null,
      followup_3_at: row.followup_3_at || null, next_action: row.next_action, message: row.message,
      email: null,
    });
    imported++;
  }

  res.redirect(`/agent/all-leads?imported=${imported}&skipped=${skipped}`);
}));

// ---------------------------------------------------------------------------
// Settings - admin only: monthly Facebook ad spend + the 3 WhatsApp templates.
// ---------------------------------------------------------------------------
router.get('/agent/settings', requireAgent, asyncHandler(async (req, res) => {
  if (req.agent.role !== 'admin') return res.status(403).send('Admin only');
  const settings = await getSettings();
  const agents = await db('agents').where({ status: 'active' }).select('id', 'name', 'phone', 'role');
  res.render('agent/lead-settings.njk', { settings, agents, agentName: req.agent.name });
}));

router.post('/agent/settings', requireAgent, asyncHandler(async (req, res) => {
  if (req.agent.role !== 'admin') return res.status(403).send('Admin only');
  const templates = [1, 2, 3].map((n) => ({
    id: n,
    label: String(req.body[`label_${n}`] || '').trim().slice(0, 50),
    text: String(req.body[`text_${n}`] || '').trim().slice(0, 1000),
  }));
  await saveSettings({
    adSpendFacebookMonthly: parseFloat(req.body.ad_spend_facebook_monthly) || 0,
    templates,
  });
  res.redirect('/agent/settings?saved=1');
}));

module.exports = router;
