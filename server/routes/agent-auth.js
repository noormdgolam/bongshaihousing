const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');

const router = express.Router();

// Same in-memory brute-force lockout as admin-auth.js - one process, no
// Redis needed, and login is checked against a phone number an attacker
// could otherwise guess-and-check without limit.
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

const BANGLADESH_DISTRICTS = [
  'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur',
  'Chattogram', 'Chuadanga', 'Cox\'s Bazar', 'Cumilla', 'Dhaka', 'Dinajpur', 'Faridpur', 'Feni',
  'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokati', 'Jhenaidah',
  'Joypurhat', 'Khagrachari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 'Lakshmipur', 'Lalmonirhat',
  'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon',
  'Narail', 'Narayanganj', 'Narsingdi', 'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna',
  'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur', 'Satkhira',
  'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon',
];

router.get('/agent/signup.html', (req, res) => {
  if (req.session && req.session.agentId) return res.redirect('/agent/dashboard.html');
  res.render('agent/signup.njk', { error: null, districts: BANGLADESH_DISTRICTS, values: {} });
});

router.post('/agent/signup', async (req, res) => {
  const { name, phone, email, district, password, confirm_password } = req.body;
  const values = { name, phone, email, district };

  if (!name || !phone || !district || !password) {
    return res.status(400).render('agent/signup.njk', { error: 'Name, phone, district, and password are required.', districts: BANGLADESH_DISTRICTS, values });
  }
  if (password.length < 8) {
    return res.status(400).render('agent/signup.njk', { error: 'Password must be at least 8 characters.', districts: BANGLADESH_DISTRICTS, values });
  }
  if (password !== confirm_password) {
    return res.status(400).render('agent/signup.njk', { error: 'Passwords do not match.', districts: BANGLADESH_DISTRICTS, values });
  }

  const existing = await db('agents').where({ phone }).first();
  if (existing) {
    return res.status(400).render('agent/signup.njk', { error: 'An account with this phone number already exists.', districts: BANGLADESH_DISTRICTS, values });
  }

  const password_hash = await bcrypt.hash(password, 10);
  await db('agents').insert({
    name, phone, email: email || null, district, password_hash, status: 'pending',
  });

  res.render('agent/signup-pending.njk', { name });
});

router.get('/agent/login.html', (req, res) => {
  if (req.session && req.session.agentId) return res.redirect('/agent/dashboard.html');
  res.render('agent/login.njk', { error: null });
});

router.post('/agent/login', async (req, res) => {
  const ip = req.ip;
  const existing = getAttemptState(ip);
  if (existing && existing.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((existing.lockedUntil - Date.now()) / 60000);
    return res.status(429).render('agent/login.njk', { error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` });
  }

  const { phone, password } = req.body;
  const agent = phone ? await db('agents').where({ phone }).first() : null;
  const valid = agent && (await bcrypt.compare(password || '', agent.password_hash));

  if (!valid) {
    const state = existing || { count: 0 };
    state.count += 1;
    if (state.count >= MAX_ATTEMPTS) state.lockedUntil = Date.now() + LOCKOUT_MS;
    loginAttempts.set(ip, state);
    return res.status(401).render('agent/login.njk', { error: 'Invalid phone number or password.' });
  }

  if (agent.status === 'pending') {
    return res.status(403).render('agent/login.njk', { error: 'Your account is still awaiting approval. We\'ll notify you once it\'s active.' });
  }
  if (agent.status === 'rejected') {
    return res.status(403).render('agent/login.njk', { error: 'This account is not active. Contact Bongshai Housing for details.' });
  }

  loginAttempts.delete(ip);
  await db('agents').where({ id: agent.id }).update({ last_login_at: db.fn.now() });

  // Session regeneration on login, same anti-fixation reasoning as
  // admin-auth.js.
  req.session.regenerate((err) => {
    if (err) {
      console.error('Agent session regenerate failed:', err.message);
      return res.status(500).render('agent/login.njk', { error: 'Login failed, please try again.' });
    }
    req.session.agentId = agent.id;
    req.session.agentName = agent.name;
    req.session.save((saveErr) => {
      if (saveErr) console.error('Agent session save failed:', saveErr.message);
      res.redirect('/agent/dashboard.html');
    });
  });
});

router.post('/agent/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/agent/login.html'));
});

module.exports = router;
