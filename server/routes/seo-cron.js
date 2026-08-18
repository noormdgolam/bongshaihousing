const express = require('express');
const db = require('../lib/db');
const { generateBatch } = require('../lib/seo/generate');

const router = express.Router();

// Deliberately outside /admin (and therefore outside requireAdmin) so a
// cPanel cron job can hit it with a plain curl call - auth is the random
// token itself, not a session. Never publishes anything; only drafts
// suggestions into the review queue, same as the manual "Generate Now"
// button in the admin dashboard.
router.get('/seo-cron/generate', async (req, res) => {
  const secretRow = await db('seo_settings').where({ setting_key: 'cron_secret' }).first();
  const secret = secretRow ? secretRow.setting_value : null;
  if (!secret || req.query.token !== secret) {
    return res.status(403).json({ success: false, error: 'Invalid or missing token' });
  }
  try {
    const result = await generateBatch(10);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
