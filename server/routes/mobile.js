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
    optional('projects', () => db('projects').where({ published: true })
      .select('title', 'location', 'image', 'slug', 'status_label')
      .orderBy('sort_order').limit(4)),
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
      rate: p.price_per_sqft ? taka(p.price_per_sqft) : null,
    }));

  // Rate range read off the catalogue instead of asserted. The mock-up quoted
  // 1,500-2,500 while real models run to 3,000+, which is exactly the kind of
  // number that goes stale the moment someone edits a product.
  const rates = products.map((p) => Number(p.price_per_sqft)).filter((n) => Number.isFinite(n) && n > 0);
  const rateRange = rates.length
    ? { min: taka(Math.min(...rates)), max: taka(Math.max(...rates)) }
    : null;

  // Calculator rates, per category, from the same column.
  const calcRates = categories.map((c) => {
    const inCat = products.filter((p) => p.category_id === c.id && Number(p.price_per_sqft) > 0);
    if (!inCat.length) return null;
    const vals = inCat.map((p) => Number(p.price_per_sqft));
    return {
      id: c.id,
      name: c.name,
      min: Math.min(...vals),
      max: Math.max(...vals),
    };
  }).filter(Boolean);

  res.render('mobile/home.njk', {
    featured,
    categories: categories.filter((c) => c.landing_page_slug),
    projects,
    rateRange,
    calcRates,
    modelCount: products.length,
    projectCount: projects.length,
  });
});

module.exports = router;
