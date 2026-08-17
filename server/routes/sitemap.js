// Dynamic sitemap.xml: products/projects are now admin-editable (title,
// slug, published) but the old sitemap.xml is a static file generated
// once from the pre-DB static site - an admin unpublishing or deleting a
// product wouldn't remove it from the sitemap, and a new product created
// in the admin panel would never appear in it at all. This route replaces
// the static file for DB-backed entries while keeping every other
// existing static URL (falls back to the static file's own entries for
// anything not sourced from the DB, so nothing regresses).
const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../lib/db');

const router = express.Router();
const STATIC_SITEMAP_PATH = path.join(__dirname, '..', '..', 'sitemap.xml');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    const staticXml = fs.readFileSync(STATIC_SITEMAP_PATH, 'utf8');
    // Every <loc> the static file already lists, so DB-sourced product/
    // project URLs can be excluded from the "keep as-is" static set and
    // regenerated fresh instead of appearing twice.
    const staticLocs = [...staticXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    const products = db ? await db('products').where({ published: true }).select('slug', 'updated_at') : [];
    const productUrls = new Set(products.map((p) => `https://bongshaihousing.com/${p.slug}`));

    const projects = db ? await db('projects').where({ published: true }).select('slug', 'updated_at') : [];
    const projectUrls = new Set(projects.map((p) => `https://bongshaihousing.com/${p.slug}`));

    const staticEntries = [];
    const staticBlocks = staticXml.match(/<url>[\s\S]*?<\/url>/g) || [];
    for (const block of staticBlocks) {
      const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
      if (loc && !productUrls.has(loc) && !projectUrls.has(loc)) {
        staticEntries.push('  ' + block.trim());
      }
    }

    const dbEntries = [
      ...products.map((p) => urlEntry(
        `https://bongshaihousing.com/${p.slug}`,
        p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : today(),
        'monthly', '0.7'
      )),
      ...projects.map((p) => urlEntry(
        `https://bongshaihousing.com/${p.slug}`,
        p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : today(),
        'monthly', '0.6'
      )),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticEntries.join('\n')}\n${dbEntries.join('\n')}\n</urlset>\n`;
    res.type('application/xml').send(xml);
  } catch (err) {
    console.error('Dynamic sitemap generation failed, serving static fallback:', err.message);
    res.sendFile(STATIC_SITEMAP_PATH);
  }
});

module.exports = router;
