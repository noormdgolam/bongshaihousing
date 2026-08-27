const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

const SERVER_DIR = path.join(__dirname, '..');
const registry = JSON.parse(fs.readFileSync(path.join(SERVER_DIR, 'page-registry.json'), 'utf8'));
const env = nunjucks.configure(path.join(SERVER_DIR, 'views'), { autoescape: true });
env.addFilter('initials', () => '');
env.addFilter('date', () => '');
env.addGlobal('currentYear', 2026);

const categoryPages = [
  'apartment-building.njk', 'concrete-building.njk', 'container-house.njk',
  'cottage-house.njk', 'duplex-steel-building.njk', 'industrial-sheds.njk',
  'luxury-villa.njk', 'simplex-steel-building.njk', 'steel-house.njk',
  'tiny-house.njk', 'wooden-house.njk', 'worker-accommodation.njk',
  'multi-story-homes.njk', 'other-residential.njk', 'products-and-solutions.njk'
];

// Individual model links (bh-xx-###.html, dv-###.html, lcv-###.html) are NOT in
// page-registry.json - most of them are DB-driven products served through
// routes/products.js's generic '/:slug.html' catch-all + product-detail.njk,
// with no static file or per-model .njk template of their own (e.g. the 5
// Cottage models BH-CH-413..417). So a model link is only really broken if its
// slug is neither a registry page, a real static file, nor a DB product.
const REPO_ROOT = path.join(SERVER_DIR, '..');
const productsSeedPath = path.join(SERVER_DIR, 'db', 'seeds', 'data', 'products.json');
const dbProductSlugs = new Set(
  fs.existsSync(productsSeedPath)
    ? JSON.parse(fs.readFileSync(productsSeedPath, 'utf8')).map((p) => p.slug).filter(Boolean)
    : []
);

const brokenModelLinks = [];
for (const cp of categoryPages) {
  const html = env.render('pages/' + cp, {
    site: { title: 'Bongshai' }, page: {}, path: '/' + cp.replace('.njk', '.html'),
    title: 'Test', canonical: 'https://bongshaihousing.com', dbCategory: null
  });
  const modelLinkMatches = html.match(/href=["'](bh-[a-z0-9-]+|dv-[a-z0-9-]+|lcv-[a-z0-9-]+)\.html["']/gi) || [];
  for (const m of modelLinkMatches) {
    const slug = m.replace(/href=["']/i, '').replace(/["']/, '');
    const url = '/' + slug;
    const existsAsStaticFile = fs.existsSync(path.join(REPO_ROOT, slug));
    if (!registry[url] && !dbProductSlugs.has(slug) && !existsAsStaticFile) {
      brokenModelLinks.push({ page: cp, brokenModelUrl: url });
    }
  }
}
console.log('Broken Model Links from Category Pages:', JSON.stringify(brokenModelLinks, null, 2));
process.exit(0);
