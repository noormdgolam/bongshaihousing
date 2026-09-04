// POST /api/leads - the shared ingest endpoint the spec asks for, used by
// entry points that don't already have their own richer intake handler (agent
// signup, the chatbot's contact recommendation, and any future form on this
// site or a sister site). The contact form and both cost calculators already
// go through server/routes/contact.js's /send_email.php, which has its own
// agent-referral attribution and PDF-quote generation on top of the same
// lib/leads.js recordLead() logic - this route is the minimal path for
// everything else, not a replacement for that one.
//
// Public and cross-origin by necessity: sister sites (bongshaisteel.com,
// bongshaiengineering.com, bongshai.com) are meant to POST here too, so this
// can't be gated by the admin session/CSRF middleware every other write route
// in this app uses. Protected instead by: a fixed origin allowlist (not `*` -
// this writes real customer PII), a rate limit per IP, and strict phone
// validation.
const express = require('express');
const router = express.Router();
const { recordLead, KNOWN_SITES } = require('../lib/leads');

const ALLOWED_ORIGINS = KNOWN_SITES.flatMap((d) => [`https://${d}`, `https://www.${d}`]);

const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateState = new Map(); // ip -> { count, windowStart } - in-memory by design,
// same house-style tradeoff as lib/pageCache.js: no Redis to provision on
// shared hosting, resets on restart, good enough for "stop obvious abuse."

function isRateLimited(ip) {
  const now = Date.now();
  const state = rateState.get(ip);
  if (!state || now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateState.set(ip, { count: 1, windowStart: now });
    return false;
  }
  state.count += 1;
  return state.count > RATE_LIMIT_MAX;
}

router.options('/api/leads', (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  res.sendStatus(204);
});

router.post('/api/leads', express.json(), async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (isRateLimited(req.ip)) {
    return res.status(429).json({ status: 'error', message: 'Too many requests. Please try again shortly.' });
  }

  const body = req.body || {};
  const { name, phone, district, source, product, sft, budget, message, site } = body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ status: 'error', message: 'name is required' });
  }

  const result = await recordLead({ name, phone, district, source, product, sft, budget, message, site });

  if (!result.leadId && !result.deduped && result.reason === 'invalid Bangladesh mobile number') {
    return res.status(400).json({ status: 'error', message: 'phone must be a valid Bangladesh mobile number (01XXXXXXXXX)' });
  }

  // A DB/fallback-log failure still returns 200: the *visitor's* submission
  // succeeded from their point of view (the fallback log + notify both fired),
  // and the spec is explicit that no lead should ever look lost to the caller
  // just because the write path degraded server-side.
  return res.status(200).json({
    status: 'success',
    deduped: result.deduped,
  });
});

module.exports = router;
