const path = require('path');
const PDFDocument = require('pdfkit');

const LOGO_PATH = path.join(__dirname, 'assets', 'logo.png');

function docToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

const LEFT = 40; // matches the { margin: 40 } page setting below

function drawHeader(doc, subtitle, leadId) {
  try {
    doc.image(LOGO_PATH, LEFT, doc.y, { width: 40 });
  } catch (e) {
    // Missing/unreadable logo file shouldn't block the whole PDF from
    // generating - this document exists to get a phone number in front
    // of a sales rep, not to look perfect.
  }
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#1E40AF')
    .text('BONGSHAI HOUSING', LEFT + 52, doc.y + 2);
  doc.font('Helvetica-Oblique').fontSize(12).fillColor('#646464')
    .text(subtitle, LEFT + 52, doc.y);

  if (leadId) {
    doc.font('Helvetica').fontSize(10).fillColor('#646464')
      .text(`Ref: LEAD-${leadId}`, 0, LEFT, { align: 'right', width: doc.page.width - LEFT });
  }

  doc.x = LEFT;
  doc.y = 95;
  doc.strokeColor('#1E40AF').lineWidth(2)
    .moveTo(LEFT, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(1);
}

// The one thing a sales rep actually needs at a glance: who to call and
// when this came in. Everything else in the document is detail they read
// after they've already dialed.
function drawQuickActionBox(doc, name, phone, submittedAt) {
  const boxTop = doc.y;
  const boxWidth = doc.page.width - LEFT - doc.page.margins.right;
  doc.rect(LEFT, boxTop, boxWidth, 54).fill('#EFF6FF');
  doc.fillColor('#1E40AF').font('Helvetica-Bold').fontSize(16)
    .text(name, LEFT + 14, boxTop + 10);
  doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(14)
    .text(phone, LEFT + 14, boxTop + 30);
  doc.fillColor('#64748b').font('Helvetica').fontSize(9)
    .text(`Submitted ${submittedAt}`, LEFT + 14, boxTop + 30, { align: 'right', width: boxWidth - 28 });
  doc.y = boxTop + 54;
  doc.x = LEFT;
  doc.moveDown(1);
}

function sectionTitle(doc, title) {
  doc.x = LEFT;
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111111').text(title, LEFT);
  doc.moveDown(0.3);
}

function labelValue(doc, label, value) {
  const labelWidth = 130;
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#323232')
    .text(label, LEFT, y, { width: labelWidth, continued: false });
  doc.font('Helvetica').fontSize(11).fillColor('#323232')
    .text(String(value ?? ''), LEFT + labelWidth, y, { width: doc.page.width - doc.page.margins.right - (LEFT + labelWidth) });
  doc.x = LEFT;
  doc.moveDown(0.2);
}

// Free-text block (the customer's own message) - explicitly reset to the
// left margin first. Without this, doc.x is left wherever the previous
// labelValue() call's value column started (well right of the margin),
// so the effective text box runs past the page's right edge and the
// content silently gets cut off mid-sentence instead of wrapping.
function paragraph(doc, text) {
  doc.x = LEFT;
  doc.font('Helvetica').fontSize(11).fillColor('#323232')
    .text(text, LEFT, doc.y, { width: doc.page.width - LEFT - doc.page.margins.right });
}

// Positioned with real clearance above the bottom margin - too close and
// PDFKit's own "does this fit" check decides it doesn't, silently pushing
// the footer onto a spurious mostly-blank second page instead of drawing
// it here.
function drawFooter(doc) {
  const y = doc.page.height - 78;
  doc.strokeColor('#e2e8f0').lineWidth(1)
    .moveTo(LEFT, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
  doc.font('Helvetica').fontSize(9).fillColor('#94a3b8')
    .text('Bongshai Housing  ·  WhatsApp +880 1781-636613  ·  sales@bongshai.com',
      LEFT, y + 10, { width: doc.page.width - LEFT - doc.page.margins.right, align: 'center' });
  doc.font('Helvetica-Oblique').fontSize(8).fillColor('#94a3b8')
    .text('Internal document - not for customer distribution',
      LEFT, y + 24, { width: doc.page.width - LEFT - doc.page.margins.right, align: 'center' });
}

/** Mirrors send_email.php's FPDF "Internal Quote Request details" document. */
async function buildQuotePdf({ name, email, phone, district, upazila, model, floorArea, bedrooms, message, leadId, estimatedPrice }) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const submittedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  drawHeader(doc, 'Internal Quote Request Details', leadId);
  drawQuickActionBox(doc, name, phone, submittedAt);

  sectionTitle(doc, 'Customer Information');
  labelValue(doc, 'Name:', name);
  labelValue(doc, 'Email:', email);
  labelValue(doc, 'Phone:', phone);
  labelValue(doc, 'Location:', `${upazila || 'N/A'}, ${district || 'N/A'}`);
  doc.moveDown(0.8);

  sectionTitle(doc, 'Product Details');
  labelValue(doc, 'Model:', model || 'N/A');
  labelValue(doc, 'Floor Area:', floorArea && floorArea !== 'N/A' ? `${floorArea} Sq.Ft` : 'N/A');
  labelValue(doc, 'Bedrooms:', bedrooms || 'N/A');
  if (estimatedPrice) {
    labelValue(doc, 'Est. Price:', `${estimatedPrice} (ballpark, based on model rate × stated floor area)`);
  }
  doc.moveDown(0.8);

  sectionTitle(doc, 'Additional Notes');
  paragraph(doc, message || 'No additional notes.');

  drawFooter(doc);

  return docToBuffer(doc);
}

module.exports = { buildQuotePdf };
