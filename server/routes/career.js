const express = require('express');
const multer = require('multer');
const path = require('path');
const { stripTags, singleLine, sanitizeEmail } = require('../lib/sanitize');
const { buildApplicationSummaryPdf, POSITION_NAMES } = require('../lib/pdf');
const { sendMail } = require('../lib/mailer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Mirrors apply_career.php, wired to career.html's #careerForm (multipart/form-data with a CV file).
router.post('/apply_career.php', upload.single('cv'), async (req, res) => {
  const body = req.body || {};

  const fname = singleLine(body.fname);
  const lname = singleLine(body.lname);
  const email = sanitizeEmail(body.email);
  const phone = stripTags(body.phone);
  const position = singleLine(body.position);
  const experience = stripTags(body.experience);
  const cover = stripTags(body.cover) || 'N/A';

  if (!fname || !lname || !email || !phone || !position) {
    return res.status(400).json({ status: 'error', message: 'Please fill in all required fields.' });
  }

  const cv = req.file;
  const ext = cv ? path.extname(cv.originalname).toLowerCase() : '';
  // PHP validated the real uploaded content via mime_content_type(), not just
  // the client-declared Content-Type header - check the PDF magic bytes too.
  const looksLikePdf = cv && cv.buffer.slice(0, 5).toString('latin1') === '%PDF-';
  if (!cv || ext !== '.pdf' || !looksLikePdf) {
    return res.status(400).json({ status: 'error', message: 'Please upload a valid CV.' });
  }

  const safeName = cv.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const positionName = POSITION_NAMES[position] || position;

  let summaryPdf;
  try {
    summaryPdf = await buildApplicationSummaryPdf({ fname, lname, email, phone, position, experience, cover });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to generate summary PDF.' });
  }

  try {
    await sendMail({
      to: process.env.MAIL_TO_JOBS || 'jobs@bongshai.com',
      subject: `New Job Application: ${fname} ${lname} - ${positionName}`,
      replyTo: email,
      text:
        'A new job application has been submitted via Bongshai Housing website.\n\n' +
        `Name: ${fname} ${lname}\nEmail: ${email}\nPhone: ${phone}\nPosition: ${positionName}\nExperience: ${experience} Years\n\n` +
        "Please find the application summary and the applicant's CV attached.\n",
      attachments: [
        { filename: `Application_Summary_${fname}.pdf`, content: summaryPdf, contentType: 'application/pdf' },
        { filename: safeName, content: cv.buffer, contentType: 'application/pdf' },
      ],
    });
    return res.status(200).json({ status: 'success', message: 'Application submitted successfully.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Email could not be sent. Please check server configuration.' });
  }
});

module.exports = router;
