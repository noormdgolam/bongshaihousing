#!/usr/bin/env node
// Standalone cron entry point - NOT an in-process scheduler (no node-cron
// dependency added; this host is cPanel shared hosting, and a plain script
// invoked by a cPanel Cron Job is the established pattern here, matching
// "small and boring, no new framework"). See README.md for the exact cron
// line to add.
//
// Reads the `leads` table read-only, builds the weekly summary, and sends it
// via WhatsApp if configured (see lib/whatsapp.js's sendWhatsAppText - this
// needs its OWN approved single-variable template, separate from the lead-
// alert one), falling back to email otherwise. Never writes anything.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { buildWeeklyReport, formatMessage } = require('../lib/lead-report');
const { sendWhatsAppText } = require('../lib/whatsapp');
const { sendMail } = require('../lib/mailer');

(async () => {
  const report = await buildWeeklyReport();
  const message = formatMessage(report);

  console.log(`[weekly-lead-report] ${report.from} to ${report.to}: ${report.newThisWeek} new, ${report.overdueCount} overdue`);

  let sent = false;
  try {
    sent = await sendWhatsAppText(message);
  } catch (e) {
    console.error('[weekly-lead-report] WhatsApp send failed:', e.message);
  }

  if (!sent) {
    try {
      await sendMail({
        to: process.env.OWNER_NOTIFY_EMAIL || process.env.MAIL_TO_SALES || 'sales@bongshai.com',
        subject: `সাপ্তাহিক লিড রিপোর্ট (${report.from} - ${report.to})`,
        text: message,
      });
      console.log('[weekly-lead-report] sent via email');
    } catch (e) {
      console.error('[weekly-lead-report] email send ALSO failed - report was only logged above:', e.message);
      process.exitCode = 1;
    }
  } else {
    console.log('[weekly-lead-report] sent via WhatsApp');
  }

  process.exit(process.exitCode || 0);
})().catch((e) => {
  console.error('[weekly-lead-report] fatal:', e.message);
  process.exit(1);
});
