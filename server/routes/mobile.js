// Mobile app shell (/m).
//
// A phone-first view of the catalogue, built as a normal server-rendered route
// so it shares one source of truth with the rest of the site: the same
// database, the same theme tokens, the same claims. Nothing here is hardcoded
// copy - the rates, models, projects and figures all come from the records the
// admin already edits, which is the whole point of the DB-driven work.
//
// It is deliberately a web page rather than a native shell. The stated goal is
// Android and iOS later; a PWA reaches phones today and is what Capacitor
// wraps when that time comes, so this is the same codebase either way.
const express = require('express');

const router = express.Router();

let db;
try {
  db = require('../lib/db');
} catch (e) {
  db = null;
}

const taka = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  // Bangladeshi grouping: 45,00,000 rather than 4,500,000.
  const s = Math.round(v).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
};


// A model's real per-square-foot rate is its committed package price over its
// floor area. products.price_per_sqft is not that number - it disagrees with
// the package price on 106 of 113 published models - so it is not used here.
const derivedRate = (p) => {
  const price = Number(p.fixed_price);
  const area = Number(p.total_floor_area);
  if (!Number.isFinite(price) || !Number.isFinite(area) || price <= 0 || area <= 0) return null;
  return price / area;
};

// One absent table must not blank the whole page.
const optional = async (table, build, fallback = []) => {
  try {
    if (!db || !(await db.schema.hasTable(table))) return fallback;
    return await build();
  } catch (e) {
    console.warn(`[mobile] skipping ${table}:`, e.message);
    return fallback;
  }
};

router.get(['/m', '/m.html', '/mobile', '/mobile.html'], async (req, res) => {
  const [categories, products, projects] = await Promise.all([
    optional('categories', () => db('categories')
      .where(function () { this.where('show_in_nav', true).orWhereNull('show_in_nav'); })
      .select('id', 'name', 'landing_page_slug', 'hero_image', 'sort_order')
      .orderBy('sort_order')),
    optional('products', () => db('products').where({ published: true })
      .select('id', 'model_number', 'slug', 'title', 'main_image', 'main_image_alt',
        'fixed_price', 'price_per_sqft', 'total_floor_area', 'bedrooms', 'bathrooms', 'category_id')
      .orderBy('sort_order')),
    // All of them: the Projects tab is a view inside the shell now, not a
    // 4-item teaser that sent the reader off to /projects.html.
    optional('projects', () => db('projects').where({ published: true })
      .select('title', 'location', 'image', 'slug', 'status_label')
      .orderBy('sort_order')),
  ]);

  const catById = new Map(categories.map((c) => [c.id, c]));

  // Featured: one real model per category, cheapest first, so the strip shows
  // the actual range of what is offered rather than a hand-picked few.
  const seen = new Set();
  const featured = products
    .filter((p) => p.main_image && p.category_id && !seen.has(p.category_id) && seen.add(p.category_id))
    .slice(0, 8)
    .map((p) => ({
      model: p.model_number,
      slug: p.slug,
      image: p.main_image,
      alt: p.main_image_alt || `${p.model_number} - ${p.title || ''}`.trim(),
      category: (catById.get(p.category_id) || {}).name || '',
      area: p.total_floor_area || null,
      beds: p.bedrooms || null,
      baths: p.bathrooms || null,
      price: taka(p.fixed_price),
      rate: derivedRate(p) ? taka(derivedRate(p)) : null,
    }));

  // Rate range read off the catalogue instead of asserted, and derived rather
  // than taken from products.price_per_sqft: 106 of 113 models disagree with
  // their own package price there (BH-CB-902 states 2,750 while its fixed price
  // over its floor area is 938). The package price and the area are the numbers
  // the business actually commits to, so the rate is computed from them.
  const rates = products.map(derivedRate).filter(Boolean);
  const rateRange = rates.length
    ? { min: taka(Math.min(...rates)), max: taka(Math.max(...rates)) }
    : null;

  // Estimator rates per category, from the same derivation. Every model has its
  // own rate, so a category carries a range rather than one figure.
  const calcRates = categories.map((c) => {
    const vals = products.filter((p) => p.category_id === c.id).map(derivedRate).filter(Boolean);
    if (!vals.length) return null;
    return {
      id: c.id,
      name: c.name,
      min: Math.round(Math.min(...vals)),
      max: Math.round(Math.max(...vals)),
    };
  }).filter(Boolean);

  // The whole catalogue for the Models tab. These rows are already in hand -
  // the featured strip above filters this same array down to one per category -
  // so the in-shell Models view costs no extra query. All 133 models come to
  // ~15KB of list fields, small enough to ship in the document and switch to
  // instantly, which is what makes the tab feel like an app rather than a link.
  const catalogue = products
    .filter((p) => p.slug)
    .map((p) => ({
      model: p.model_number,
      slug: p.slug,
      image: p.main_image,
      alt: p.main_image_alt || `${p.model_number} - ${p.title || ''}`.trim(),
      categoryId: p.category_id || 0,
      category: (catById.get(p.category_id) || {}).name || 'Other',
      area: p.total_floor_area || null,
      beds: p.bedrooms || null,
      baths: p.bathrooms || null,
      price: taka(p.fixed_price),
      rate: derivedRate(p) ? taka(derivedRate(p)) : null,
    }));

  // Only categories that actually have a model, so no filter chip leads to an
  // empty list.
  const withModels = new Set(catalogue.map((p) => p.categoryId));
  const filters = categories
    .filter((c) => withModels.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, n: catalogue.filter((p) => p.categoryId === c.id).length }));

  res.render('mobile/home.njk', {
    featured,
    categories: categories.filter((c) => c.landing_page_slug),
    projects,
    rateRange,
    calcRates,
    catalogue,
    filters,
    modelCount: products.length,
    projectCount: projects.length,
  });
});

module.exports = router;
