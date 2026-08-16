const PDFDocument = require('pdfkit');

function docToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

function drawHeader(doc, subtitle) {
  doc.font('Helvetica-Bold').fontSize(24).fillColor('#1E40AF')
    .text('BONGSHAI HOUSING', { align: 'center' });
  doc.font('Helvetica-Oblique').fontSize(14).fillColor('#646464')
    .text(subtitle, { align: 'center' });
  doc.moveDown(0.5);
  doc.strokeColor('#c8c8c8').lineWidth(1)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(1);
}

function sectionTitle(doc, title) {
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#000000').text(title);
  doc.moveDown(0.3);
}

function labelValue(doc, label, value) {
  const labelWidth = 130;
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#323232')
    .text(label, doc.page.margins.left, y, { width: labelWidth, continued: false });
  doc.font('Helvetica').fontSize(12).fillColor('#323232')
    .text(String(value ?? ''), doc.page.margins.left + labelWidth, y);
  doc.moveDown(0.2);
}

/** Mirrors send_email.php's FPDF "Internal Quote Request details" document. */
async function buildQuotePdf({ name, email, phone, district, upazila, model, floorArea, bedrooms, message }) {
  const doc = new PDFDocument({ margin: 40 });
  drawHeader(doc, 'Internal Quote Request details');

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
  doc.moveDown(0.8);

  sectionTitle(doc, 'Additional Notes');
  doc.font('Helvetica').fontSize(12).fillColor('#323232')
    .text(message || 'No additional notes.', { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });

  return docToBuffer(doc);
}

module.exports = { buildQuotePdf };
