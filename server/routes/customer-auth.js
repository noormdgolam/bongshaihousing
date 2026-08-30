const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');

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
  if (req.session && req.session.orderId) return res.redirect('/my-project');
  res.render('customer/login.njk', { error: null });
});

router.post(['/my-project/login', '/my-project/login.html'], async (req, res) => {
  const ip = req.ip;
  const existing = getAttemptState(ip);
  if (existing && existing.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((existing.lockedUntil - Date.now()) / 60000);
    return res.status(429).render('customer/login.njk', { error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` });
  }

  const { phone, password } = req.body;
  const order = phone ? await db('orders').where({ customer_phone: phone }).orderBy('created_at', 'desc').first() : null;
  const valid = order && (await bcrypt.compare(password || '', order.password_hash));

  if (!valid) {
    const state = existing || { count: 0 };
    state.count += 1;
    if (state.count >= MAX_ATTEMPTS) state.lockedUntil = Date.now() + LOCKOUT_MS;
    loginAttempts.set(ip, state);
    return res.status(401).render('customer/login.njk', { error: 'Invalid phone number or password.' });
  }

  loginAttempts.delete(ip);

  req.session.regenerate((err) => {
    if (err) {
      console.error('Customer session regenerate failed:', err.message);
      return res.status(500).render('customer/login.njk', { error: 'Login failed, please try again.' });
    }
    req.session.orderId = order.id;
    req.session.save((saveErr) => {
      if (saveErr) console.error('Customer session save failed:', saveErr.message);
      res.redirect('/my-project');
    });
  });
});

router.post(['/my-project/logout', '/my-project/logout.html'], (req, res) => {
  req.session.destroy(() => res.redirect('/my-project/login.html'));
});

module.exports = router;
