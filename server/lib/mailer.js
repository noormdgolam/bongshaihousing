const nodemailer = require('nodemailer');

// PHP's mail() rode free on the shared host's local exim/MTA. Nodemailer
// needs an explicit SMTP transport - confirm with the host (Phase 0) that
// outbound SMTP from application code is actually permitted on this plan.
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'SMTP_HOST/SMTP_USER/SMTP_PASS are not set. Copy server/.env.example to .env and fill in a real cPanel mailbox or SMTP credential.'
    );
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

/**
 * @param {object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} [opts.text]
 * @param {string} [opts.html]
 * @param {string} [opts.replyTo]
 * @param {Array<{filename: string, content: Buffer, contentType: string}>} [opts.attachments]
 */
async function sendMail({ to, subject, text, html, replyTo, attachments }) {
  const from = process.env.MAIL_FROM || 'no-reply@bongshaihousing.com';
  await getTransporter().sendMail({ from, to, subject, text, html, replyTo, attachments });
}

module.exports = { sendMail };
