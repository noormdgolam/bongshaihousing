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

// Minimal RFC4180 CSV tokenizer - handles quoted fields (embedded commas,
// escaped "" quotes). No external dependency needed for this one bounded job.
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\r') {
      // skip - the following \n closes the row
    } else if (c === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Same header-synonym matching and row shape as parseExcelBuffer, just fed
// from a hand-rolled CSV tokenizer instead of ExcelJS.
async function parseCsvBuffer(buffer) {
  let text = buffer.toString('utf8');
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip UTF-8 BOM
  const table = parseCsvRows(text).filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
  if (!table.length) throw new Error('No rows found in this file.');

  const headerRow = table[0];
  const nameCol = matchColumn(headerRow, HEADER_SYNONYMS.name);
  const phoneCol = matchColumn(headerRow, HEADER_SYNONYMS.phone);
  const emailCol = matchColumn(headerRow, HEADER_SYNONYMS.email);
  const districtCol = matchColumn(headerRow, HEADER_SYNONYMS.district);

  if (nameCol === -1 && phoneCol === -1) {
    throw new Error('Could not find a Name or Phone column. Expected headers like "Name", "Phone", "Email" in row 1.');
  }

  const rows = [];
  let skipped = 0;
  for (let i = 1; i < table.length; i++) {
    const values = table[i];
    const name = nameCol >= 0 ? String(values[nameCol] || '').trim() : '';
    const phone = phoneCol >= 0 ? String(values[phoneCol] || '').trim() : '';
    const email = emailCol >= 0 ? String(values[emailCol] || '').trim() : '';
    const district = districtCol >= 0 ? String(values[districtCol] || '').trim() : '';
    if (!name && !phone) { skipped += 1; continue; }
    rows.push({ name: name || phone, phone: phone || null, email: email || null, district: district || null });
  }
  return { rows, skipped };
}

// Mailboxes actually configured on this cPanel account (confirmed via the
// host's mail/ directory) - the only valid From-address choices in the
// composer. All authenticate through the same SMTP_USER login underneath;
// this only changes the visible From/Reply-To header, which is safe since
// SPF/DKIM are scoped to the whole bongshaihousing.com domain, not a
// specific mailbox.
const FROM_ADDRESS_OPTIONS = [
  { value: 'no-reply@bongshaihousing.com', label: 'no-reply@bongshaihousing.com (default, unmonitored)' },
  { value: 'info@bongshaihousing.com', label: 'info@bongshaihousing.com' },
  { value: 'admin@bongshaihousing.com', label: 'admin@bongshaihousing.com' },
];

const DEFAULT_TEMPLATE = {
  subject: 'Invitation: Become a Bongshai Housing Distributor',
  body: [
    'Dear {{name}},',
    "Bongshai Housing & Real Estate, Bangladesh's premier pre-engineered steel building and prefab housing company, is inviting qualified businesses and individuals to become authorized distributors in their area.",
    'As a Bongshai distributor, you would represent our full catalog of steel buildings, duplex villas, cottages, and industrial sheds directly to customers in your territory, with full sales, marketing, and after-sales support from our head office.',
  ].join('\n\n'),
  from_address: 'no-reply@bongshaihousing.com',
};

async function getInvitationTemplate() {
  if (!db) return DEFAULT_TEMPLATE;
  const hasTable = await db.schema.hasTable('agent_invitation_template');
  if (!hasTable) return DEFAULT_TEMPLATE;
  const row = await db('agent_invitation_template').where({ id: 1 }).first();
  return row || DEFAULT_TEMPLATE;
}

async function saveInvitationTemplate({ subject, body, from_address }) {
  if (!subject || !subject.trim()) throw new Error('Subject cannot be empty.');
  if (!body || !body.trim()) throw new Error('Body cannot be empty.');
  if (!FROM_ADDRESS_OPTIONS.some((o) => o.value === from_address)) {
    throw new Error('Choose a valid From address.');
  }
  await db('agent_invitation_template')
    .insert({ id: 1, subject: subject.trim(), body: body.trim(), from_address })
    .onConflict('id')
    .merge();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Body is admin-entered plain text - blank line splits paragraphs, {{name}}
// gets substituted. Escaped before insertion since it lands inside HTML,
// even though only trusted admins can edit it (defense in depth, not just
// trust).
function renderBodyParagraphs(body, name) {
  const withName = body.replace(/\{\{\s*name\s*\}\}/gi, name || 'Sir/Madam');
  return withName
    .split(/\n\s*\n/)
    .map((para) => `<p>${escapeHtml(para.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('\n      ');
}

// Header banner, CTA button, and footer signature stay hardcoded (not part
// of the editable template) - keeps a non-technical admin from breaking the
// email's HTML structure while still giving full control over the pitch text.
function invitationEmailHtml(name, template) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
    <div style="background: #1E40AF; padding: 24px 28px; border-radius: 10px 10px 0 0;">
      <h1 style="color: #fff; margin: 0; font-size: 1.3rem;">Bongshai Housing &amp; Real Estate</h1>
    </div>
    <div style="background: #f8fafc; padding: 28px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
      ${renderBodyParagraphs(template.body, name)}
      <p style="margin: 24px 0; text-align: center;">
        <a href="https://bongshaihousing.com/agent/signup.html" style="background: #D4AF37; color: #1a1300; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block;">Apply for Distributorship →</a>
      </p>
      <p style="font-size: 0.85rem; color: #64748b;">The application takes about 10 minutes and requires basic business details and identification documents. Our team reviews every application personally.</p>
      <p>Warm regards,<br><strong>Bongshai Housing &amp; Real Estate</strong><br>House #18, Road #18, Sector #10, Uttara, Dhaka<br>01781-636613</p>
    </div>
  </div>`;
}

function invitationEmailText(name, template) {
  const withName = template.body.replace(/\{\{\s*name\s*\}\}/gi, name || 'Sir/Madam');
  return `${withName}\n\nApply at https://bongshaihousing.com/agent/signup.html\n\nBongshai Housing & Real Estate\nHouse #18, Road #18, Sector #10, Uttara, Dhaka\n01781-636613`;
}

async function sendInvitation(invitation, template) {
  if (!invitation.email) throw new Error('No email address on file for this invitation.');
  const t = template || (await getInvitationTemplate());
  await sendMail({
    to: invitation.email,
    subject: t.subject,
    text: invitationEmailText(invitation.name, t),
    html: invitationEmailHtml(invitation.name, t),
    from: t.from_address,
    replyTo: t.from_address,
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

  const template = await getInvitationTemplate();

  let sent = 0;
  const errors = [];
  for (const inv of candidates) {
    try {
      await sendInvitation(inv, template);
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

module.exports = {
  parseExcelBuffer,
  parseCsvBuffer,
  sendInvitation,
  sendPendingBatch,
  getInvitationTemplate,
  saveInvitationTemplate,
  invitationEmailHtml,
  FROM_ADDRESS_OPTIONS,
};
