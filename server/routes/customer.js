const express = require('express');
const db = require('../lib/db');
const requireCustomer = require('../middleware/requireCustomer');

const router = express.Router();

router.get('/my-project', requireCustomer, async (req, res) => {
  const milestones = await db('order_milestones')
    .where({ order_id: req.order.id })
    .orderBy('sort_order', 'asc');
  const doneCount = milestones.filter((m) => m.status === 'done').length;
  res.render('customer/dashboard.njk', {
    order: req.order,
    milestones,
    progress: milestones.length ? Math.round((doneCount / milestones.length) * 100) : 0,
  });
});

module.exports = router;
