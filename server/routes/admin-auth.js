const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');

const router = express.Router();

router.get('/admin/login', (req, res) => {
  if (req.session && req.session.adminUserId) return res.redirect('/admin');
  res.render('admin/login.njk', { error: null });
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const user = email ? await db('admin_users').where({ email }).first() : null;
  const valid = user && (await bcrypt.compare(password || '', user.password_hash));

  if (!valid) {
    return res.status(401).render('admin/login.njk', { error: 'Invalid email or password.' });
  }

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
