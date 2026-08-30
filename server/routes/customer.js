const express = require('express');
const db = require('../lib/db');
const requireCustomer = require('../middleware/requireCustomer');
const { documentPathIn } = require('../lib/document-uploader');

const router = express.Router();

// Customer-facing labels for the internal lead pipeline status - the raw
// enum (new/contacted/in_negotiation/closed) is written for the sales
// team, not the person who submitted the inquiry.
const LEAD_STATUS_LABEL = {
  new: 'Received',
  contacted: 'Our team has contacted you',
  in_negotiation: 'Discussing your requirements',
  closed: 'Closed',
};

router.get(['/my-project', '/my-project/dashboard', '/my-project/dashboard.html'], requireCustomer, async (req, res) => {
  const order = await db('orders').where({ customer_id: req.customer.id }).orderBy('created_at', 'desc').first();
  const leadsRaw = await db('leads').where({ customer_id: req.customer.id }).orderBy('created_at', 'desc');
  const leads = leadsRaw.map((l) => ({
    ...l,
    status_label: LEAD_STATUS_LABEL[l.status] || 'Received',
  }));

  let milestones = [];
  let documents = [];
  let progress = 0;
  if (order) {
    milestones = await db('order_milestones').where({ order_id: order.id }).orderBy('sort_order', 'asc');
    documents = await db('order_documents').where({ order_id: order.id }).orderBy('created_at', 'desc');
    const doneCount = milestones.filter((m) => m.status === 'done').length;
    progress = milestones.length ? Math.round((doneCount / milestones.length) * 100) : 0;
  }

  res.render('customer/dashboard.njk', {
    customer: req.customer,
    hasPassword: !!req.customer.password_hash,
    order,
    leads,
    milestones,
    documents,
    progress,
    pwError: req.query.pw_error || null,
    pwSuccess: req.query.pw_success === '1',
  });
});

router.get('/my-project/documents/:docId', requireCustomer, async (req, res) => {
  // Scoped to the logged-in customer's own order (loaded fresh below,
  // not trusted from anywhere earlier) - not just :id from the URL - so
  // one customer can never fetch another's document by guessing an ID.
  const order = await db('orders').where({ customer_id: req.customer.id }).first();
  if (!order) return res.status(404).send('Document not found');
  const doc = await db('order_documents').where({ id: req.params.docId, order_id: order.id }).first();
  if (!doc) return res.status(404).send('Document not found');
  res.sendFile(documentPathIn('order-docs', doc.file_path), (err) => {
    if (err && !res.headersSent) res.status(404).send('Document file not found on disk');
  });
});

module.exports = router;
