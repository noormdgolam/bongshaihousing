#!/usr/bin/env node
/**
 * Extracts product/category data out of the static HTML pages into a JSON
 * file (server/db/seeds/data/products.json) ready for a later seed script
 * to insert - kept as a separate step so the scraped data can be read and
 * corrected by eye before anything touches a real database.
 *
 * What's actually reliable per a direct markup survey (see
 * [[project-node-conversion-plan]]): the <title> tag's middle segment
 * ("BH-SB-301 | Simplex Steel Building | Bongshai Housing") for the
 * category name - NOT JSON-LD's `name`/`isVariantOf`, which has real
 * copy-paste errors on some pages (e.g. bh-ch-501 mislabeling itself as
 * "Cottage House" under a title that correctly says "Container House").
 * The per-tier bed/bath/room breakdown lives in an inline
 * `const floorData<N> = {...}` object literal (not JSON - unquoted keys),
 * evaluated here via Node's vm module rather than regex-parsed by hand.
 *
 * Usage: node server/scripts/scrape-products.js [--only=bh-sb-301.html,...]
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(__dirname, '..', 'db', 'seeds', 'data');
const OUT_PATH = path.join(OUT_DIR, 'products.json');

// Legacy numbered families that don't share a bh-* prefix.
const LEGACY_NUMBERED_PATTERNS = [/^dv-\d+\.html$/, /^lcv-\d+\.html$/];

function isNumberedProductPage(filename) {
  if (/^bh-[a-z]+-\d+\.html$/.test(filename)) return true;
  return LEGACY_NUMBERED_PATTERNS.some((re) => re.test(filename));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractTitleParts(doc) {
  const raw = (doc.querySelector('title') || {}).textContent || '';
  const parts = raw.split('|').map((s) => s.trim());
  return { modelSegment: parts[0] || null, categoryName: parts[1] || null };
}

function extractRealProductJsonLd(doc) {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  let best = null;
  for (const s of scripts) {
    let data;
    try {
      data = JSON.parse(s.textContent);
    } catch {
      continue;
    }
    if (data['@type'] !== 'Product') continue;
    // The placeholder block (present on every page, sometimes copy-pasted
    // wrong) lacks isVariantOf; the real per-model block has it.
    if (data.isVariantOf) return data;
    best = best || data;
  }
  return best;
}

function extractFloorData(html) {
  // The variable's numeric suffix is meant to match the page's own model
  // number but doesn't always (e.g. dv-110.html's script literally defines
  // `floorData101`, a copy-paste artifact from whatever page it was cloned
  // from) - match generically rather than requiring filename digits to
  // agree with the in-page variable name.
  const re = /const\s+floorData\d+\s*=\s*(\{[\s\S]*?\n\s*\};)/;
  const match = html.match(re);
  if (!match) return null;
  const objLiteral = match[1].replace(/;\s*$/, '');
  try {
    const sandbox = {};
    vm.createContext(sandbox);
    return vm.runInContext(`(${objLiteral})`, sandbox, { timeout: 1000 });
  } catch (err) {
    return { __error: err.message };
  }
}

function extractBuildingSpecs(doc) {
  const tables = Array.from(doc.querySelectorAll('table.modern-table'));
  // Room-sizes table's <tbody> has an id="room-sizes-table-body-N" and no
  // static rows; Building Specifications table has real <tr>s in markup
  // and no such id - pick whichever actually has row content.
  const specsTable = tables.find((t) => {
    const tbody = t.querySelector('tbody');
    return tbody && !/room-sizes-table-body/.test(tbody.id || '') && tbody.querySelectorAll('tr').length > 0;
  });
  if (!specsTable) return [];
  return Array.from(specsTable.querySelectorAll('tbody tr')).map((tr, i) => {
    const cells = tr.querySelectorAll('td');
    return {
      spec_key: (cells[0] && cells[0].textContent.trim()) || '',
      spec_value: (cells[1] && cells[1].textContent.trim()) || '',
      sort_order: i,
    };
  }).filter((row) => row.spec_key);
}

function extractMainImage(doc, productJsonLd) {
  if (productJsonLd && productJsonLd.image) {
    return Array.isArray(productJsonLd.image) ? productJsonLd.image[0] : productJsonLd.image;
  }
  const heroImg = doc.querySelector('main img');
  return heroImg ? heroImg.getAttribute('src') : null;
}

function convertOneProduct(filename) {
  const filePath = path.join(REPO_ROOT, filename);
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const { modelSegment, categoryName } = extractTitleParts(doc);
  const modelNumber = modelSegment; // e.g. "BH-SB-301"

  const productJsonLd = extractRealProductJsonLd(doc);
  const priceRaw = productJsonLd && productJsonLd.offers && productJsonLd.offers.price;
  const pricePerSqft = priceRaw ? Number(priceRaw) : null;

  const description = doc.querySelector('meta[name="description"]');

  const floorData = extractFloorData(html);
  const buildingSpecs = extractBuildingSpecs(doc);
  const mainImage = extractMainImage(doc, productJsonLd);

  return {
    filename,
    modelNumber,
    categoryName,
    categorySlug: categoryName ? slugify(categoryName) : null,
    slug: filename,
    title: doc.querySelector('title') ? doc.querySelector('title').textContent : null,
    description: description ? description.getAttribute('content') : null,
    pricePerSqft,
    priceCurrency: (productJsonLd && productJsonLd.offers && productJsonLd.offers.priceCurrency) || 'BDT',
    mainImage,
    floorData,
    buildingSpecs,
  };
}

function main() {
  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.slice('--only='.length).split(',') : null;

  const allFiles = fs.readdirSync(REPO_ROOT).filter((f) => f.endsWith('.html'));
  const productFiles = (only || allFiles).filter(isNumberedProductPage);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  const errors = [];
  for (const filename of productFiles) {
    try {
      results.push(convertOneProduct(filename));
    } catch (err) {
      errors.push({ filename, error: err.message });
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  console.log(`Scraped ${results.length} product pages -> ${path.relative(REPO_ROOT, OUT_PATH)}`);
  if (errors.length) {
    console.log(`Errors (${errors.length}):`);
    errors.forEach((e) => console.log(`  ${e.filename}: ${e.error}`));
  }
  const missingFloorData = results.filter((r) => !r.floorData || r.floorData.__error);
  if (missingFloorData.length) {
    console.log(`Missing/failed floorData extraction (${missingFloorData.length}):`);
    missingFloorData.forEach((r) => console.log(`  ${r.filename}${r.floorData && r.floorData.__error ? ': ' + r.floorData.__error : ''}`));
  }
}

main();
