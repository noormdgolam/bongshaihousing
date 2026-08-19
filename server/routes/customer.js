const express = require('express');
const db = require('../lib/db');
const requireCustomer = require('../middleware/requireCustomer');
const { documentPathIn } = require('../lib/document-uploader');

const router = express.Router();

// Uptime-monitor target (UptimeRobot etc.) - checks the DB connection, not
// just "did the process respond to HTTP", since a hung/unreachable MySQL
// connection is a real failure mode a plain 200-from-anything check would
// miss. No auth. Deliberately placed in an already-mounted router file
// rather than as a fresh top-level app.get() in server.js - a brand-new
// route added directly in server.js has 404'd on restart twice tonight
// (the seo-cron saga) while every addition to an already-required router
// file (this one, admin.js) has reliably taken effect after every deploy.
router.get('/uptime-check-bh2026', async (req, res) => {
  if (!db) return res.status(503).json({ status: 'error', db: 'unavailable' });
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', db: 'unreachable', message: e.message });
  }
});

router.get('/my-project', requireCustomer, async (req, res) => {
  const milestones = await db('order_milestones')
    .where({ order_id: req.order.id })
    .orderBy('sort_order', 'asc');
  const documents = await db('order_documents')
    .where({ order_id: req.order.id })
    .orderBy('created_at', 'desc');
  const doneCount = milestones.filter((m) => m.status === 'done').length;
  res.render('customer/dashboard.njk', {
    order: req.order,
    milestones,
    documents,
    progress: milestones.length ? Math.round((doneCount / milestones.length) * 100) : 0,
  });
});

router.get('/my-project/documents/:docId', requireCustomer, async (req, res) => {
  // Scoped to req.order.id (the currently logged-in customer's own order,
  // set by requireCustomer) - not just :id from the URL - so one customer
  // can never fetch another's document by guessing an ID.
  const doc = await db('order_documents').where({ id: req.params.docId, order_id: req.order.id }).first();
  if (!doc) return res.status(404).send('Document not found');
  res.sendFile(documentPathIn('order-docs', doc.file_path), (err) => {
    if (err && !res.headersSent) res.status(404).send('Document file not found on disk');
  });
});

module.exports = router;
