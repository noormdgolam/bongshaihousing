const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');

const router = express.Router();

// In-memory brute-force lockout, same pattern as ai-chat.js's rate
// limiter (single-process app, no Redis needed). Real admin credentials
// were being checked with zero attempt limit - unlimited guesses against
// a known email address.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const loginAttempts = new Map(); // ip -> { count, lockedUntil }

function getAttemptState(ip) {
  const now = Date.now();
  const state = loginAttempts.get(ip);
  if (state && state.lockedUntil && now > state.lockedUntil) {
    loginAttempts.delete(ip);
    return null;
  }
  if (loginAttempts.size > 5000) {
    for (const [key, val] of loginAttempts.entries()) {
      if (val.lockedUntil && now > val.lockedUntil) loginAttempts.delete(key);
    }
  }
  return state || null;
}

router.get('/admin/login', (req, res) => {
  if (req.session && req.session.adminUserId) return res.redirect('/admin');
  res.render('admin/login.njk', { error: null });
});

router.post('/admin/login', async (req, res) => {
  const ip = req.ip;
  const existing = getAttemptState(ip);
  if (existing && existing.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((existing.lockedUntil - Date.now()) / 60000);
    return res.status(429).render('admin/login.njk', { error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` });
  }

  const { email, password } = req.body;
  const user = email ? await db('admin_users').where({ email }).first() : null;
  const valid = user && (await bcrypt.compare(password || '', user.password_hash));

  if (!valid) {
    const state = existing || { count: 0 };
    state.count += 1;
    if (state.count >= MAX_ATTEMPTS) state.lockedUntil = Date.now() + LOCKOUT_MS;
    loginAttempts.set(ip, state);
    return res.status(401).render('admin/login.njk', { error: 'Invalid email or password.' });
  }

  loginAttempts.delete(ip);
  req.session.adminUserId = user.id;
  req.session.adminName = user.name;
  req.session.adminRole = user.role;
  await db('admin_users').where({ id: user.id }).update({ last_login_at: db.fn.now() });

  res.redirect('/admin');
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;
