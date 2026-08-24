const express = require('express');
const db = require('../lib/db');
const requireAgent = require('../middleware/requireAgent');
const { sendMail } = require('../lib/mailer');
const { sendTelegramAlert } = require('../lib/telegram');

const router = express.Router();

async function leadStats(agentId) {
  const leads = await db('agent_leads').where({ agent_id: agentId }).orderBy('created_at', 'desc');
  const stats = { total: leads.length, new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
  for (const l of leads) stats[l.status] = (stats[l.status] || 0) + 1;
  return { leads, stats };
}

router.get('/agent/dashboard.html', requireAgent, async (req, res) => {
  const { leads, stats } = await leadStats(req.agent.id);
  res.render('agent/dashboard.njk', { agent: req.agent, leads, stats, error: null });
});

router.post('/agent/leads', requireAgent, async (req, res) => {
  const { customer_name, customer_phone, customer_district, product_interest, notes } = req.body;

  if (!customer_name || !customer_phone) {
    const { leads, stats } = await leadStats(req.agent.id);
    return res.status(400).render('agent/dashboard.njk', {
      agent: req.agent, leads, stats, error: 'Customer name and phone number are required.',
    });
  }

  await db('agent_leads').insert({
    agent_id: req.agent.id, customer_name, customer_phone,
    customer_district: customer_district || null,
    product_interest: product_interest || null,
    notes: notes || null,
  });

  try {
    const text = `New Lead Submitted by Agent:
Name: ${req.agent.name || 'N/A'}
Business: ${req.agent.business_name || 'N/A'}
Phone: ${req.agent.phone || 'N/A'}
Email: ${req.agent.email || 'N/A'}
District: ${req.agent.district || 'N/A'}

Customer Details:
Name: ${customer_name}
Phone: ${customer_phone}
District: ${customer_district || 'N/A'}
Interest: ${product_interest || 'N/A'}
Notes: ${notes || 'N/A'}
`;
    await sendMail({
      to: process.env.MAIL_TO_SALES || 'sales@bongshai.com',
      subject: `New Agent Lead from ${req.agent.business_name || req.agent.name || 'Agent'}`,
      replyTo: req.agent.email || undefined,
      text
    });
  } catch (err) {
    console.error('Failed to send agent lead notification email:', err);
  }

  sendTelegramAlert(
    `🔔 New Agent Lead from ${req.agent.business_name || req.agent.name}:\n👤 ${customer_name}\n📞 ${customer_phone}\n📍 ${customer_district || 'N/A'}\n🏠 ${product_interest || 'N/A'}`
  );

  res.redirect('/agent/dashboard.html');
});

module.exports = router;
