const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { formatTaka } = require('./format');
const { getAgentReferralCode } = require('./agent-settings');

/**
 * Generates an executive co-branded single-page PDF brochure for an agent and product model.
 */
function generateBrochurePdf({ product, agent, specs = [], res }) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `${product.title || product.model_number} - Specification Sheet`,
      Author: 'Bongshai Housing Limited',
      Subject: 'Prefabricated Steel Building Specifications',
    },
  });

  doc.pipe(res);

  // --- Header Banner ---
  doc.rect(0, 0, 595.28, 90).fill('#1E40AF');

  // Title
  doc.fillColor('#FFFFFF')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('BONGSHAI HOUSING LIMITED', 40, 26);

  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#93C5FD')
    .text('Prefabricated Steel Buildings & Engineering Solutions | Dhaka, Bangladesh', 40, 50);

  // Agent Pill top right
  const agentRef = agent ? getAgentReferralCode(agent) : 'PARTNER';
  doc.rect(410, 24, 145, 42).fillAndStroke('#1E3A8A', '#3B82F6');
  doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('AUTHORIZED PARTNER', 418, 30);
  doc.fillColor('#FDE047').fontSize(9).font('Helvetica-Bold').text((agent?.name || 'Agent Partner').slice(0, 22), 418, 42);
  doc.fillColor('#E2E8F0').fontSize(8).font('Helvetica').text(`Ref: ${agentRef}`, 418, 54);

  // --- Product Title & Metadata ---
  doc.fillColor('#0F172A').fontSize(16).font('Helvetica-Bold').text(product.title || product.model_number, 40, 110);

  const priceText = product.fixed_price
    ? `Estimated Price: BDT ${formatTaka(product.fixed_price)}`
    : (product.price_per_sqft ? `Rate: BDT ${product.price_per_sqft}/sq.ft` : 'Price: Available on consultation');

  doc.fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#1E40AF')
    .text(`Model: ${product.model_number || 'N/A'}  |  ${priceText}  |  Area: ${product.total_floor_area || 'Custom'} sq.ft`, 40, 132);

  // Divider
  doc.moveTo(40, 150).lineTo(555, 150).strokeColor('#E2E8F0').lineWidth(1).stroke();

  // --- Product Description / Overview ---
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text('Architecture & Engineering Overview', 40, 162);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    (product.description || 'Modern pre-engineered steel structure designed for seismic resilience, rapid 45-60 day installation, and superior thermal efficiency across Bangladesh.').slice(0, 320),
    40,
    178,
    { width: 515, align: 'justify', lineGap: 3 }
  );

  // --- Specifications Table ---
  let y = 235;
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text('Technical & Material Specifications', 40, y);
  y += 18;

  // Table header
  doc.rect(40, y, 515, 22).fill('#F1F5F9');
  doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold');
  doc.text('ITEM / COMPONENT', 50, y + 6);
  doc.text('ENGINEERING SPECIFICATION', 210, y + 6);
  y += 22;

  const defaultSpecs = [
    { key: 'Primary Structure', value: 'Hot-rolled / Built-up high tensile steel frame (ASTM A572 Grade 50)' },
    { key: 'Wall Cladding', value: '2.5 inch insulated precast sandwich panel / EPS thermal wall' },
    { key: 'Roofing System', value: '0.47mm Color-coated Galvalume corrugated profile with heat insulation' },
    { key: 'Erection Time', value: '45 to 60 Days guaranteed timeline on prepared foundation' },
    { key: 'Seismic & Wind Code', value: 'BNBC Compliant, Zone 2/3 Earthquake resistant, 150+ km/h wind rating' },
    { key: 'Foundation Type', value: 'RC Strip / Pad foundation designed by certified structural engineers' },
  ];

  const tableRows = specs.length > 0
    ? specs.map((s) => ({ key: s.spec_key, value: s.spec_value }))
    : defaultSpecs;

  doc.font('Helvetica').fontSize(9);
  tableRows.slice(0, 8).forEach((row, idx) => {
    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc.rect(40, y, 515, 20).fill(rowBg);
    doc.fillColor('#0F172A').font('Helvetica-Bold').text(row.key, 50, y + 5, { width: 150 });
    doc.fillColor('#334155').font('Helvetica').text(row.value, 210, y + 5, { width: 335 });
    y += 20;
  });

  // --- Key Advantages Grid ---
  y += 15;
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text('Why Choose Bongshai Housing', 40, y);
  y += 18;

  const boxW = 165;
  const boxH = 50;

  const advantages = [
    { title: '⚡ 70% Faster Delivery', desc: 'Factory fabrication cuts construction time to 45-60 days.' },
    { title: '🛡️ 50-Year Structural Lifespan', desc: 'Heavy anti-corrosion primer with galvanized protection.' },
    { title: '💰 30% Cost Savings', desc: 'Lightweight foundation & minimal on-site material waste.' },
  ];

  advantages.forEach((adv, i) => {
    const bx = 40 + i * (boxW + 10);
    doc.rect(bx, y, boxW, boxH).fillAndStroke('#F8FAFC', '#E2E8F0');
    doc.fillColor('#1E40AF').fontSize(8.5).font('Helvetica-Bold').text(adv.title, bx + 8, y + 8, { width: boxW - 16 });
    doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(adv.desc, bx + 8, y + 24, { width: boxW - 16 });
  });

  // --- Partner Footer / Direct Contact ---
  const footerY = 745;
  doc.rect(40, footerY, 515, 60).fillAndStroke('#EFF6FF', '#BFDBFE');

  doc.fillColor('#1E3A8A').fontSize(9.5).font('Helvetica-Bold').text('CONNECT WITH YOUR REGIONAL BONGSHAI REPRESENTATIVE', 52, footerY + 10);

  const phone = agent?.phone || '+8801711200241';
  const email = agent?.email || 'info@bongshaihousing.com';
  const district = agent?.district ? ` | District: ${agent.district}` : '';

  doc.fillColor('#0F172A').fontSize(9).font('Helvetica')
    .text(`Representative: ${agent?.name || 'Authorized Partner'}  |  Phone / WhatsApp: ${phone}${district}`, 52, footerY + 26);

  doc.fillColor('#2563EB').fontSize(8.5).font('Helvetica-Bold')
    .text(`Quote Code: ${agentRef}  |  Official Portal: https://bongshaihousing.com/?ref=${agentRef}`, 52, footerY + 42);

  doc.end();
}

module.exports = { generateBrochurePdf };
