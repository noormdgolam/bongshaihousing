const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const { saveDocument } = require('../lib/document-uploader');

const router = express.Router();

const DOCUMENT_FIELDS = ['doc_application_letter', 'doc_passport_photo', 'doc_trade_license', 'doc_tin_certificate', 'doc_nid_copy'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, WebP, or PDF files are accepted.'), ok);
  },
});
const documentUpload = upload.fields(DOCUMENT_FIELDS.map((name) => ({ name, maxCount: 1 })));

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

router.post('/agent/signup', function (req, res, next) {
  documentUpload(req, res, (err) => {
    if (err) {
      return res.status(400).render('agent/signup.njk', { error: err.message, districts: BANGLADESH_DISTRICTS, values: req.body || {} });
    }
    next();
  });
}, async (req, res) => {
  const b = req.body;
  const values = { ...b };
  const fail = (error) => res.status(400).render('agent/signup.njk', { error, districts: BANGLADESH_DISTRICTS, values });

  // multipart bodies skip the global CSRF middleware's check (req.body
  // isn't parsed yet at that point) - verified here instead, now that
  // multer has populated it.
  const { verifyCsrfToken, sendCsrfError } = require('../middleware/csrf');
  if (!verifyCsrfToken(req)) return sendCsrfError(req, res);

  const required = {
    'Business/establishment name': b.business_name,
    'Owner/applicant name': b.name,
    'Contact address': b.contact_address,
    'Mobile number': b.phone,
    'National ID (NID) number': b.nid_number,
    'Permanent address': b.permanent_address,
    'District': b.district,
    'Thana': b.thana,
    'Password': b.password,
  };
  for (const [label, val] of Object.entries(required)) {
    if (!val || !String(val).trim()) return fail(`${label} is required.`);
  }
  if (b.password.length < 8) return fail('Password must be at least 8 characters.');
  if (b.password !== b.confirm_password) return fail('Passwords do not match.');
  if (b.certification_agreed !== 'on') return fail('You must certify that the information provided is correct.');

  const existing = await db('agents').where({ phone: b.phone }).first();
  if (existing) return fail('An account with this phone number already exists.');

  const files = req.files || {};
  const docPaths = {};
  try {
    for (const field of DOCUMENT_FIELDS) {
      const f = files[field] && files[field][0];
      docPaths[field] = f ? saveDocument(f.buffer, f.mimetype) : null;
    }
  } catch (docErr) {
    return fail(docErr.message);
  }

  const businessTypes = [b.business_type_1, b.business_type_2, b.business_type_3]
    .map((t) => (t || '').trim()).filter(Boolean).join(', ') || null;

  const password_hash = await bcrypt.hash(b.password, 10);
  await db('agents').insert({
    name: b.name,
    phone: b.phone,
    email: b.email || null,
    district: b.district,
    thana: b.thana,
    password_hash,
    status: 'pending',
    business_name: b.business_name,
    contact_address: b.contact_address,
    landline_phone: b.landline_phone || null,
    nid_number: b.nid_number,
    current_business_types: businessTypes,
    current_business_address: b.current_business_address || null,
    permanent_address: b.permanent_address,
    tin_number: b.tin_number || null,
    trade_license_number: b.trade_license_number || null,
    funding_own_fund: b.funding_own_fund || null,
    funding_bank: b.funding_bank || null,
    doc_application_letter: docPaths.doc_application_letter,
    doc_passport_photo: docPaths.doc_passport_photo,
    doc_trade_license: docPaths.doc_trade_license,
    doc_tin_certificate: docPaths.doc_tin_certificate,
    doc_nid_copy: docPaths.doc_nid_copy,
    certification_agreed: true,
  });

  res.render('agent/signup-pending.njk', { name: b.name });
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
    return res.status(403).render('agent/login.njk', { error: 'Your application is still under review. We\'ll notify you once it\'s approved.' });
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
