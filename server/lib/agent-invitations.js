const ExcelJS = require('exceljs');
const db = require('./db');
const { sendMail } = require('./mailer');

// Flexible header matching - real-world spreadsheets never use exactly one
// column name, so match against common synonyms rather than requiring an
// exact "Name"/"Phone"/"Email" header.
const HEADER_SYNONYMS = {
  name: ['name', 'full name', 'agent name', 'contact name', 'applicant name'],
  phone: ['phone', 'phone number', 'mobile', 'mobile number', 'contact number', 'cell'],
  email: ['email', 'email address', 'e-mail'],
  district: ['district', 'location', 'area', 'territory', 'city'],
};

function matchColumn(headers, synonyms) {
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toString().trim().toLowerCase();
    if (synonyms.includes(h)) return i;
  }
  return -1;
}

// Returns { rows: [{name, phone, email, district}], skipped } - skipped
// counts rows with no name and no phone (nothing usable to invite).
async function parseExcelBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('No worksheet found in this file.');

  const headerRow = sheet.getRow(1).values.slice(1); // ExcelJS rows are 1-indexed with a leading undefined
  const nameCol = matchColumn(headerRow, HEADER_SYNONYMS.name);
  const phoneCol = matchColumn(headerRow, HEADER_SYNONYMS.phone);
  const emailCol = matchColumn(headerRow, HEADER_SYNONYMS.email);
  const districtCol = matchColumn(headerRow, HEADER_SYNONYMS.district);

  if (nameCol === -1 && phoneCol === -1) {
    throw new Error('Could not find a Name or Phone column. Expected headers like "Name", "Phone", "Email" in row 1.');
  }

  const rows = [];
  let skipped = 0;
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // header row
    const values = row.values.slice(1);
    const name = nameCol >= 0 ? String(values[nameCol] || '').trim() : '';
    const phone = phoneCol >= 0 ? String(values[phoneCol] || '').trim() : '';
    const email = emailCol >= 0 ? String(values[emailCol] || '').trim() : '';
    const district = districtCol >= 0 ? String(values[districtCol] || '').trim() : '';
    if (!name && !phone) { skipped += 1; return; }
    rows.push({ name: name || phone, phone: phone || null, email: email || null, district: district || null });
  });

  return { rows, skipped };
}

function invitationEmailHtml(name) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
    <div style="background: #1E40AF; padding: 24px 28px; border-radius: 10px 10px 0 0;">
      <h1 style="color: #fff; margin: 0; font-size: 1.3rem;">Bongshai Housing &amp; Real Estate</h1>
    </div>
    <div style="background: #f8fafc; padding: 28px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
      <p>Dear ${name || 'Sir/Madam'},</p>
      <p>Bongshai Housing &amp; Real Estate, Bangladesh's premier pre-engineered steel building and prefab housing company, is inviting qualified businesses and individuals to become <strong>authorized distributors</strong> in their area.</p>
      <p>As a Bongshai distributor, you would represent our full catalog of steel buildings, duplex villas, cottages, and industrial sheds directly to customers in your territory, with full sales, marketing, and after-sales support from our head office.</p>
      <p style="margin: 24px 0; text-align: center;">
        <a href="https://bongshaihousing.com/agent/signup.html" style="background: #D4AF37; color: #1a1300; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block;">Apply for Distributorship →</a>
      </p>
      <p style="font-size: 0.85rem; color: #64748b;">The application takes about 10 minutes and requires basic business details and identification documents. Our team reviews every application personally.</p>
      <p>Warm regards,<br><strong>Bongshai Housing &amp; Real Estate</strong><br>House #18, Road #18, Sector #10, Uttara, Dhaka<br>01781-636613</p>
    </div>
  </div>`;
}

async function sendInvitation(invitation) {
  if (!invitation.email) throw new Error('No email address on file for this invitation.');
  await sendMail({
    to: invitation.email,
    subject: 'Invitation: Become a Bongshai Housing Distributor',
    text: `Dear ${invitation.name || 'Sir/Madam'},\n\nBongshai Housing & Real Estate is inviting qualified businesses to become authorized distributors. Apply at https://bongshaihousing.com/agent/signup.html\n\nBongshai Housing & Real Estate\n01781-636613`,
    html: invitationEmailHtml(invitation.name),
  });
}

// Small delay between sends - a burst of 50+ emails in one second from a
// shared-hosting SMTP mailbox reads as spam behavior to most mail
// providers' rate limiters, independent of the content being legitimate.
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function sendPendingBatch(limit = 20) {
  const candidates = await db('agent_invitations')
    .where({ status: 'pending' })
    .whereNotNull('email')
    .orderBy('created_at', 'asc')
    .limit(limit);

  let sent = 0;
  const errors = [];
  for (const inv of candidates) {
    try {
      await sendInvitation(inv);
      await db('agent_invitations').where({ id: inv.id }).update({ status: 'sent', sent_at: db.fn.now(), error_message: null });
      sent += 1;
    } catch (e) {
      await db('agent_invitations').where({ id: inv.id }).update({ status: 'failed', error_message: e.message });
      errors.push(`${inv.name}: ${e.message}`);
    }
    await delay(800);
  }
  return { processed: candidates.length, sent, errors };
}

module.exports = { parseExcelBuffer, sendInvitation, sendPendingBatch };
