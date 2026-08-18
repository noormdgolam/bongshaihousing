const express = require('express');
const db = require('../lib/db');
const requireAgent = require('../middleware/requireAgent');

const router = express.Router();

router.get('/agent/dashboard.html', requireAgent, async (req, res) => {
  const leads = await db('agent_leads')
    .where({ agent_id: req.agent.id })
    .orderBy('created_at', 'desc');
  res.render('agent/dashboard.njk', { agent: req.agent, leads, error: null });
});

router.post('/agent/leads', requireAgent, async (req, res) => {
  const { customer_name, customer_phone, customer_district, product_interest, notes } = req.body;

  if (!customer_name || !customer_phone) {
    const leads = await db('agent_leads').where({ agent_id: req.agent.id }).orderBy('created_at', 'desc');
    return res.status(400).render('agent/dashboard.njk', {
      agent: req.agent, leads, error: 'Customer name and phone number are required.',
    });
  }

  await db('agent_leads').insert({
    agent_id: req.agent.id, customer_name, customer_phone,
    customer_district: customer_district || null,
    product_interest: product_interest || null,
    notes: notes || null,
  });

  res.redirect('/agent/dashboard.html');
});

module.exports = router;
