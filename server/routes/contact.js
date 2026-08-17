const express = require('express');
const { stripTags, singleLine, sanitizeEmail, safeFilenamePart } = require('../lib/sanitize');
const { buildQuotePdf } = require('../lib/pdf');
const { sendMail } = require('../lib/mailer');
let db;
try {
  db = require('../lib/db');
} catch (e) {
  db = null;
}

const router = express.Router();

// Mirrors send_email.php, wired to contact.html's #contactForm (submits JSON).
router.post('/send_email.php', async (req, res) => {
  const body = req.body || {};

  // Honeypot: legitimate visitors never see or fill this field (hidden via
  // CSS + aria-hidden in contact.html), so a non-empty value means a bot.
  // Return success without sending mail so bots don't learn to look elsewhere.
  if (body.website_url) {
    return res.status(200).json({ status: 'success', message: 'Message sent successfully.' });
  }

  const name = singleLine(body.name);
  const email = sanitizeEmail(body.email);
  const countryCode = stripTags(body.country_code);
  const phoneRaw = stripTags(body.phone);
  const phone = countryCode ? `${countryCode} ${phoneRaw}` : phoneRaw;
  const district = stripTags(body.district) || 'N/A';
  const upazila = stripTags(body.upazila) || 'N/A';
  const model = stripTags(body.model) || 'N/A';
  const floorArea = stripTags(body.floor_area) || 'N/A';
  const bedrooms = stripTags(body.bedrooms) || 'N/A';
  const message = stripTags(body.message) || 'No additional notes.';

  if (!name || !email || !phoneRaw) {
    return res.status(400).json({ status: 'error', message: 'Please fill in all required fields.' });
  }

  // Save to database leads table if DB is available
  if (db) {
    try {
      const [leadId] = await db('leads').insert({
        name,
        email,
        phone,
        district: district !== 'N/A' ? district : null,
        upazila: upazila !== 'N/A' ? upazila : null,
        model: model !== 'N/A' ? model : null,
        floor_area: floorArea !== 'N/A' ? floorArea : null,
        bedrooms: bedrooms !== 'N/A' ? bedrooms : null,
        message: message !== 'No additional notes.' ? message : null,
        status: 'new',
        source: 'contact_form',
      });

      const hasActivity = await db.schema.hasTable('activity_log');
      if (hasActivity) {
        await db('activity_log').insert({
          admin_name: 'Website Lead Capture',
          action: 'create',
          entity_type: 'lead',
          entity_id: leadId || null,
          summary: `New quote inquiry from ${name} (${district}) for ${model}`,
        });
      }
    } catch (dbErr) {
      console.error('Failed to save lead to database:', dbErr.message);
    }
  }

  const filename = `${safeFilenamePart(name)}_${safeFilenamePart(model)}.pdf`;

  let pdfBuffer;
  try {
    pdfBuffer = await buildQuotePdf({ name, email, phone, district, upazila, model, floorArea, bedrooms, message });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: `Failed to generate PDF. Error: ${err.message}` });
  }

  try {
    await sendMail({
      to: process.env.MAIL_TO_SALES || 'sales@bongshai.com',
      subject: `New Quote Request from ${name}`,
      replyTo: email,
      text:
        'You have received a new inquiry from your website contact form. Please find the detailed Quote Request attached as a PDF.\n\n' +
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nModel: ${model}\n`,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });
    return res.status(200).json({ status: 'success', message: 'Message sent successfully.' });
  } catch (err) {
    console.error('send_email.php mail failure:', err);
    return res.status(500).json({ status: 'error', message: 'Message could not be sent. Please check your mail server configuration.' });
  }
});

module.exports = router;
