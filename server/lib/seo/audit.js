const fs = require('fs');
const path = require('path');
const db = require('../db');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');

// Pure detection, no AI - cheap to run often and safe to run
// automatically, since it only flags issues rather than writing content.
async function runTechnicalAudit() {
  const products = await db('products').where({ published: true });
  const issues = [];

  for (const p of products) {
    const label = `${p.model_number} - ${p.title}`;
    if (!p.meta_title) {
      issues.push({ issue_type: 'missing_meta_title', target_type: 'product', target_id: p.id, target_label: label, detail: 'No SEO title set - page falls back to the raw product title.' });
    }
    if (!p.meta_description) {
      issues.push({ issue_type: 'missing_meta_description', target_type: 'product', target_id: p.id, target_label: label, detail: 'No SEO meta description set - search results will show a truncated fallback.' });
    }
    if (!p.main_image) {
      issues.push({ issue_type: 'missing_image', target_type: 'product', target_id: p.id, target_label: label, detail: 'No main image set for this product.' });
    } else {
      const imgPath = path.join(REPO_ROOT, p.main_image.replace(/^\//, ''));
      if (!fs.existsSync(imgPath)) {
        issues.push({ issue_type: 'broken_image', target_type: 'product', target_id: p.id, target_label: label, detail: `main_image path does not resolve on disk: ${p.main_image}` });
      } else if (!p.main_image_alt) {
        issues.push({ issue_type: 'missing_alt_text', target_type: 'product', target_id: p.id, target_label: label, detail: 'Main image has no alt text.' });
      }
    }
    if (!p.description || p.description.trim().length < 80) {
      issues.push({ issue_type: 'thin_content', target_type: 'product', target_id: p.id, target_label: label, detail: 'Product description is missing or under 80 characters.' });
    }
  }

  await db('seo_audit_issues').where({ status: 'open' }).update({ status: 'resolved', updated_at: db.fn.now() });
  if (issues.length) {
    await db('seo_audit_issues').insert(issues.map((i) => ({ ...i, status: 'open' })));
  }
  return issues.length;
}

module.exports = { runTechnicalAudit };
