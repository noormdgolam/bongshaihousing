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

  // What a customer actually pays: the fixed package prices, low to high.
  // This replaces the per-sqft range that used to head the page - that
  // number is how we estimate an unbuilt size, not something we charge.
  const fixed = products.map((p) => Number(p.fixed_price)).filter((v) => v > 0);
  const priceRange = fixed.length
    ? { min: taka(Math.min(...fixed)), max: taka(Math.max(...fixed)) }
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

  // 17 of the 18 project rows store the same string in title and location, so
  // the card would print its own name twice. Row 19 differs only by a double
  // space inside the string, which a trim does not catch - hence collapsing
  // whitespace before deciding whether the second line says anything new.
  const flat = (v) => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const projectRows = projects.map((pr) => ({
    ...pr,
    subtitle: flat(pr.location) && flat(pr.location) !== flat(pr.title) ? pr.location : null,
  }));

  res.render('mobile/home.njk', {
    featured,
    categories: categories.filter((c) => c.landing_page_slug),
    projects: projectRows,
    rateRange,
    priceRange,
    calcRates,
    catalogue,
    filters,
    modelCount: products.length,
    projectCount: projects.length,
  });
});

// Everything the desktop product page shows, for one model, so the app never
// has to send the customer out to a full-width page. Read-only, published
// products only.
router.get('/api/m/model/:slug', async (req, res) => {
  const slug = String(req.params.slug || '').replace(/[^a-z0-9.-]/gi, '').slice(0, 80);
  if (!slug) return res.status(400).json({ error: 'bad slug' });

  try {
    if (!db) return res.status(503).json({ error: 'no database' });

    const product = await db('products').where({ slug, published: true }).first();
    if (!product) return res.status(404).json({ error: 'not found' });

    const [category, variants, specs] = await Promise.all([
      product.category_id
        ? db('categories').where({ id: product.category_id }).first()
        : Promise.resolve(null),
      optional('product_variants', () => db('product_variants')
        .where({ product_id: product.id })
        .select('id', 'area_sqft', 'area_label', 'bed', 'bath', 'kitchen', 'living', 'drawing', 'dining')
        .orderBy('sort_order')),
      optional('product_specs', () => db('product_specs')
        .where({ product_id: product.id })
        .select('spec_type', 'spec_key', 'spec_value')
        .orderBy('sort_order')),
    ]);

    // Room layouts hang off a variant, not the product. is_total_row marks a
    // summary line the admin table renders separately - it is not a room, so
    // it must not be listed as one.
    const variantIds = variants.map((v) => v.id);
    const rooms = variantIds.length
      ? await optional('product_rooms', () => db('product_rooms')
        .whereIn('product_variant_id', variantIds)
        .select('product_variant_id', 'floor_label', 'section', 'area_sqft', 'length_ft', 'width_ft', 'is_total_row')
        .orderBy('sort_order'))
      : [];

    const byVariant = new Map(variantIds.map((id) => [id, []]));
    rooms.filter((r) => !r.is_total_row).forEach((r) => {
      (byVariant.get(r.product_variant_id) || []).push({
        floor: r.floor_label || '',
        name: r.section || '',
        area: r.area_sqft != null ? Number(r.area_sqft) : null,
        length: r.length_ft != null ? Number(r.length_ft) : null,
        width: r.width_ft != null ? Number(r.width_ft) : null,
      });
    });

    res.json({
      model: product.model_number,
      slug: product.slug,
      category: category ? category.name : null,
      description: product.description || null,
      images: [product.main_image, product.image_2, product.image_3].filter(Boolean),
      alt: product.main_image_alt || null,
      price: taka(product.fixed_price),
      area: product.total_floor_area || null,
      bedrooms: product.bedrooms || null,
      bathrooms: product.bathrooms || null,
      kitchens: product.kitchens || null,
      variants: variants.map((v) => ({
        id: v.id,
        label: v.area_label || (v.area_sqft ? v.area_sqft + ' sq.ft' : ''),
        area: v.area_sqft != null ? Number(v.area_sqft) : null,
        bed: v.bed, bath: v.bath, kitchen: v.kitchen,
        living: v.living, drawing: v.drawing, dining: v.dining,
        rooms: byVariant.get(v.id) || [],
      })),
      specs: specs.map((x) => ({ group: x.spec_type, key: x.spec_key, value: x.spec_value })),
    });
  } catch (err) {
    console.error('[mobile] model detail failed:', err.message);
    res.status(500).json({ error: 'failed' });
  }
});

// ---------------------------------------------------------------------------
// Content pages, rendered inside the app instead of sending the customer out
// to a desktop page.
const PAGES = {
  about: { file: 'about.njk', title: 'About Bongshai Housing' },
  certifications: { file: 'certifications.njk', title: 'Certifications' },
  contact: { file: 'contact.njk', title: 'Contact' },
  gallery: { file: 'gallery.njk', title: 'Gallery' },
  privacy: { file: 'privacy-policy.njk', title: 'Privacy Policy' },
  terms: { file: 'terms.njk', title: 'Terms & Conditions' },
};

// Lift the readable content out of a rendered page: headings, paragraphs, list
// items, and for the gallery its images and captions. Chrome (header, nav,
// footer, scripts, the chat widget) is dropped.
function extractContent(html, wantImages) {
  // No DOM parser here on purpose: jsdom is a devDependency and the host
  // installs production dependencies only. This scans markup we author
  // ourselves, and its output is checked against jsdom page by page in
  // scratch/test_extract_parity.js.
  const decode = (t) => t
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)));
  // An inline tag sits inside a sentence and adds no whitespace; a block tag
  // does. Treating them alike put a space before the comma in
  // "...bongshaihousing.com/ , one of our main priorities".
  const INLINE = /<\/?(?:a|b|strong|em|i|u|span|small|sup|sub|code|abbr|mark|time|label)\b[^>]*>/gi;
  const strip = (t) => decode(t.replace(INLINE, '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ').replace(/\s+([,.;:!?)])/g, '$1').trim();

  // Drop anything that is not readable content, and the page chrome.
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');

  const mainMatch = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(body);
  if (mainMatch) body = mainMatch[1];

  const blocks = [];

  if (wantImages) {
    const itemRe = /<(div|figure|a)[^>]*class="[^"]*gallery-item[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi;
    let it;
    while ((it = itemRe.exec(body)) !== null) {
      const chunk = it[2];
      const img = /<img[^>]*>/i.exec(chunk);
      if (!img) continue;
      const src = (/\ssrc="([^"]+)"/i.exec(img[0]) || [])[1] || '';
      const alt = (/\salt="([^"]*)"/i.exec(img[0]) || [])[1] || '';
      const cap = /class="[^"]*gallery-caption[^"]*"[^>]*>([\s\S]*?)<\//i.exec(chunk);
      blocks.push({ type: 'image', src: src.replace(/^\//, ''), text: strip(cap ? cap[1] : alt) });
    }
    if (blocks.length) return blocks;
  }

  const seen = new Set();
  const tagRe = /<(h1|h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = tagRe.exec(body)) !== null) {
    const tag = m[1].toLowerCase();
    const text = strip(m[2]);
    if (!text || text.length < 2) continue;
    const type = tag === 'li' ? 'li' : (tag === 'p' ? 'p' : 'h');
    const key = type + '|' + text;
    if (seen.has(key)) continue;   // the same heading often repeats in hero + section
    seen.add(key);
    blocks.push({ type, text });
  }
  return blocks;
}

router.get('/api/m/page/:name', async (req, res) => {
  const name = String(req.params.name || '').replace(/[^a-z-]/g, '');

  // FAQ has its own table - use the record, not the rendered page.
  if (name === 'faq') {
    try {
      const rows = await optional('faqs', () => db('faqs')
        .select('question', 'answer', 'category').orderBy('id'));
      return res.json({
        title: 'Frequently Asked Questions',
        faqs: rows.map((f) => ({
          q: f.question,
          a: String(f.answer || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
          group: f.category || null,
        })),
      });
    } catch (err) {
      console.error('[mobile] faq failed:', err.message);
      return res.status(500).json({ error: 'failed' });
    }
  }

  const page = PAGES[name];
  if (!page) return res.status(404).json({ error: 'unknown page' });

  try {
    const html = req.app.render
      ? await new Promise((resolve, reject) => {
        req.app.render('pages/' + page.file, { ...(res.locals || {}) }, (err, out) => (err ? reject(err) : resolve(out)));
      })
      : null;
    if (!html) return res.status(503).json({ error: 'cannot render' });
    return res.json({ title: page.title, blocks: extractContent(html, name === 'gallery') });
  } catch (err) {
    console.error('[mobile] page ' + name + ' failed:', err.message);
    return res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;
