const express = require('express');
const db = require('../lib/db');
const requireCustomer = require('../middleware/requireCustomer');
const { documentPathIn } = require('../lib/document-uploader');

const router = express.Router();

router.get(['/my-project', '/my-project/dashboard', '/my-project/dashboard.html'], requireCustomer, async (req, res) => {
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
