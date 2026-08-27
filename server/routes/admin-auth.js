const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const { verifyTotp } = require('../lib/totp');

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

router.get(['/admin/login', '/admin/login.html'], (req, res) => {
  if (req.session && req.session.adminUserId) return res.redirect('/admin');
  res.render('admin/login.njk', { error: null });
});

router.post(['/admin/login', '/admin/login.html'], async (req, res) => {
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

  // If 2FA is active on the account, intercept with 2FA challenge before creating full session
  if (user.two_factor_enabled && user.two_factor_secret) {
    req.session.pending2faUserId = user.id;
    return req.session.save((err) => {
      if (err) console.error('Session save failed:', err.message);
      res.redirect('/admin/2fa-verify');
    });
  }

  await db('admin_users').where({ id: user.id }).update({ last_login_at: db.fn.now() });

  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regenerate failed:', err.message);
      return res.status(500).render('admin/login.njk', { error: 'Login failed, please try again.' });
    }
    req.session.adminUserId = user.id;
    req.session.adminName = user.name;
    req.session.adminRole = user.role;
    req.session.save((saveErr) => {
      if (saveErr) console.error('Session save failed:', saveErr.message);
      res.redirect('/admin');
    });
  });
});

router.get('/admin/2fa-verify', (req, res) => {
  if (req.session && req.session.adminUserId) return res.redirect('/admin');
  if (!req.session || !req.session.pending2faUserId) return res.redirect('/admin/login');
  res.render('admin/2fa-verify.njk', { error: null });
});

router.post('/admin/2fa-verify', async (req, res) => {
  if (!req.session || !req.session.pending2faUserId) return res.redirect('/admin/login');

  const userId = req.session.pending2faUserId;
  const user = await db('admin_users').where({ id: userId }).first();

  if (!user || !user.two_factor_secret) {
    delete req.session.pending2faUserId;
    return res.redirect('/admin/login');
  }

  const { code } = req.body;
  const isValid = verifyTotp(code, user.two_factor_secret);

  if (!isValid) {
    return res.status(401).render('admin/2fa-verify.njk', { error: 'Invalid 6-digit authentication code. Please try again.' });
  }

  delete req.session.pending2faUserId;
  await db('admin_users').where({ id: user.id }).update({ last_login_at: db.fn.now() });

  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regenerate failed:', err.message);
      return res.status(500).render('admin/2fa-verify.njk', { error: 'Login failed, please try again.' });
    }
    req.session.adminUserId = user.id;
    req.session.adminName = user.name;
    req.session.adminRole = user.role;
    req.session.save((saveErr) => {
      if (saveErr) console.error('Session save failed:', saveErr.message);
      res.redirect('/admin');
    });
  });
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;

