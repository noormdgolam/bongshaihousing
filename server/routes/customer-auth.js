const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const requireCustomer = require('../middleware/requireCustomer');
const { normalizePhone } = require('../lib/customer-identity');

const router = express.Router();

// Same in-memory brute-force lockout as admin-auth.js/agent-auth.js.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

function getAttemptState(key) {
  const now = Date.now();
  const state = loginAttempts.get(key);
  if (state && state.lockedUntil && now > state.lockedUntil) {
    loginAttempts.delete(key);
    return null;
  }
  if (loginAttempts.size > 5000) {
    for (const [k, v] of loginAttempts.entries()) {
      if (v.lockedUntil && now > v.lockedUntil) loginAttempts.delete(k);
    }
  }
  return state || null;
}

router.get(['/my-project/login', '/my-project/login.html'], (req, res) => {
  if (req.session && req.session.customerId) return res.redirect('/my-project');
  res.render('customer/login.njk', { error: null });
});

router.post(['/my-project/login', '/my-project/login.html'], async (req, res) => {
  const ip = req.ip;
  const existing = getAttemptState(ip);
  if (existing && existing.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((existing.lockedUntil - Date.now()) / 60000);
    return res.status(429).render('customer/login.njk', { error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` });
  }

  const phoneKey = normalizePhone(req.body.phone);
  const { password } = req.body;
  const customer = phoneKey ? await db('customers').where({ phone_key: phoneKey }).first() : null;

  // A customer auto-created from an inquiry has no password_hash yet -
  // bcrypt.compare against null/undefined would throw, and letting them
  // in without one would mean anyone who knows the phone number gets in.
  const valid = customer && customer.password_hash
    && (await bcrypt.compare(password || '', customer.password_hash));

  if (!valid) {
    const state = existing || { count: 0 };
    state.count += 1;
    if (state.count >= MAX_ATTEMPTS) state.lockedUntil = Date.now() + LOCKOUT_MS;
    loginAttempts.set(ip, state);
    const message = customer && !customer.password_hash
      ? 'No password set on this account yet. Submit a new inquiry to get back into your dashboard, or set a password from there first.'
      : 'Invalid phone number or password.';
    return res.status(401).render('customer/login.njk', { error: message });
  }

  loginAttempts.delete(ip);

  req.session.regenerate((err) => {
    if (err) {
      console.error('Customer session regenerate failed:', err.message);
      return res.status(500).render('customer/login.njk', { error: 'Login failed, please try again.' });
    }
    req.session.customerId = customer.id;
    req.session.save((saveErr) => {
      if (saveErr) console.error('Customer session save failed:', saveErr.message);
      res.redirect('/my-project');
    });
  });
});

router.post(['/my-project/logout', '/my-project/logout.html'], (req, res) => {
  req.session.destroy(() => res.redirect('/my-project/login.html'));
});

// Set (first-time) or change (already has one) the portal password.
// Deliberately lightweight - no old-password check when password_hash is
// still null, since there's nothing to verify yet; once one exists this
// same form requires it, so a hijacked browser session alone can't lock
// the real owner out by silently overwriting their password.
router.post('/my-project/set-password', requireCustomer, async (req, res) => {
  const { current_password, password, confirm_password } = req.body;
  const back = (error) => res.redirect('/my-project?pw_error=' + encodeURIComponent(error));

  if (req.customer.password_hash) {
    const currentValid = await bcrypt.compare(current_password || '', req.customer.password_hash);
    if (!currentValid) return back('Current password is incorrect.');
  }
  if (!password || password.length < 6) return back('New password must be at least 6 characters.');
  if (password !== confirm_password) return back('New passwords do not match.');

  const password_hash = await bcrypt.hash(password, 10);
  await db('customers').where({ id: req.customer.id }).update({ password_hash });
  res.redirect('/my-project?pw_success=1');
});

module.exports = router;
