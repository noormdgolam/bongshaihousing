// Regenerates one static page snapshot after an admin save, so products
// that still have a static .html file in the docroot (LiteSpeed serves
// those ahead of the Node app - see project docs) actually reflect an
// edit without a full site deploy.
//
// Pure in-process Nunjucks template rendering + local filesystem write.
// No Python, no curl, no external HTTP socket dependencies, no FTP,
// no dependency on test.bongshaihousing.com.
//
// Direct in-process rendering queries the active MySQL database and renders
// the exact Nunjucks templates directly, then atomically writes the output
// to the sibling static docroot directory (bongshaihousing.com/).

const fs = require('fs');
const path = require('path');
const fsp = fs.promises;
const nunjucks = require('nunjucks');

let db;
try {
  db = require('./db');
} catch (e) {
  db = null;
}

const { formatTaka, formatTakaAscii } = require('./format');
const { getThemeSettings, generateCssVariables } = require('./theme');

const DOCROOT = process.env.STATIC_DOCROOT || path.join(__dirname, '..', '..', 'bongshaihousing.com');
const VIEWS_DIR = path.join(__dirname, '..', 'views');

const registryPath = path.join(__dirname, '..', 'page-registry.json');
const registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : {};

function renderVars(meta, extra) {
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    category: meta.category,
    canonical: meta.canonical,
    ogType: meta.ogType,
    ogTitle: meta.ogTitle,
    ogDescription: meta.ogDescription,
    ogImage: meta.ogImage,
    ogImageWidth: meta.ogImageWidth,
    ogImageHeight: meta.ogImageHeight,
    twitterTitle: meta.twitterTitle,
    twitterDescription: meta.twitterDescription,
    whatsappHref: meta.whatsappHref,
    bodyClass: meta.bodyClass,
    showQuoteShortcut: meta.showQuoteShortcut,
    ...extra,
  };
}

// Configure dedicated Nunjucks environment for offline / background page generation
const nunjucksEnv = nunjucks.configure(VIEWS_DIR, {
  autoescape: true,
  noCache: true,
});

// Register standard template filters & globals
nunjucksEnv.addFilter('initials', (name) => {
  if (!name) return '';
  const words = String(name).trim().split(/\s+/);
  const first = words[0] ? words[0][0] : '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
});

nunjucksEnv.addFilter('date', (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
});

nunjucksEnv.addFilter('taka', (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  return Number.isFinite(n) ? formatTaka(n) : String(value);
});

nunjucksEnv.addFilter('formatTaka', (value) => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? formatTaka(n) : String(value);
});

nunjucksEnv.addFilter('formatTakaAscii', (value) => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? formatTakaAscii(n) : String(value);
});

nunjucksEnv.addGlobal('currentYear', new Date().getFullYear());

function groupRoomsByFloor(rooms) {
  const groups = [];
  let current = { label: null, rows: [], total: null };
  let explicitBuildingTotal = null;
  for (const r of rooms) {
    const text = (r.section || '').trim();
    const hasArea = r.area_sqft !== null && r.area_sqft !== undefined && r.area_sqft !== '';
    if (r.is_total_row && !hasArea) {
      if (current.label !== null || current.rows.length) groups.push(current);
      current = { label: text, rows: [], total: null };
    } else if (r.is_total_row && hasArea && /building/i.test(text)) {
      explicitBuildingTotal = r.area_sqft;
    } else if (r.is_total_row && hasArea) {
      current.total = r.area_sqft;
    } else {
      current.rows.push(r);
    }
  }
  groups.push(current);
  for (const g of groups) {
    if (g.total == null) {
      const sum = g.rows.reduce((s, r) => s + (Number(r.area_sqft) || 0), 0);
      g.total = sum || null;
    }
  }
  const buildingTotal = explicitBuildingTotal != null
    ? explicitBuildingTotal
    : groups.length > 1
      ? groups.reduce((s, g) => s + (Number(g.total) || 0), 0)
      : (groups[0] && groups[0].total) || null;
  return { groups, buildingTotal };
}

function roomIcon(section) {
  const s = (section || '').toLowerCase();
  if (/wall|stair/.test(s)) return '';
  if (/bath|toilet|washroom/.test(s)) return '🚿';
  if (/kitchen/.test(s)) return '🍳';
  if (/bed/.test(s)) return '🛏️';
  if (/living|drawing|dining|family/.test(s)) return '🛋️';
  if (/veranda|varanda|porch|balcony/.test(s)) return '🌤️';
  if (/store|storage/.test(s)) return '📦';
  if (/garage|parking/.test(s)) return '🚗';
  return '🏠';
}

function formatProductTitle(product, category) {
  const model = product.model_number || '';
  const catName = (category && category.name) ? category.name : '';
  if (product.meta_title && product.meta_title.trim()) {
    return product.meta_title.trim();
  }
  if (model && catName) {
    return `${catName} in Bangladesh | ${model}`;
  }
  return `Pre-Engineered Steel Building Bangladesh | ${model || 'View Details'}`;
}

/**
 * Directly renders a product detail page to HTML string using Nunjucks & DB
 */
async function renderProductToHtml(slug) {
  if (!db) throw new Error('Database connection not available');

  const file = slug.endsWith('.html') ? slug : `${slug}.html`;

  // Most product pages on this site have their OWN dedicated, hand-authored
  // .njk template (bh-lch-1001.njk, bh-sb-301.njk, etc.) - page-registry.json
  // records exactly which template + meta each URL uses, the same source
  // renderCategoryToHtml() below already trusts. Only a small minority of
  // DB-only products (e.g. the Cottage House models) have no registry entry
  // and truly rely on the generic product-detail.njk render further down.
  // Rendering every product through the generic template unconditionally
  // was the bug: it silently overwrote a product's real page (cat-sidebar,
  // model showcase, room/floor tables) with a stripped-down generic shell
  // any time syncPageToLive() fired for it, while still LOOKING right in
  // the <head> (title/description/canonical came from the DB row too) -
  // making the corruption easy to miss without comparing full page content.
  const regMeta = registry['/' + file];
  if (regMeta && regMeta.template && regMeta.template !== 'pages/product-detail.njk') {
    let dedicatedTheme = {};
    let dedicatedThemeCssVars = '';
    try {
      dedicatedTheme = await getThemeSettings();
      dedicatedThemeCssVars = generateCssVariables(dedicatedTheme);
    } catch (e) {
      dedicatedTheme = {};
      dedicatedThemeCssVars = '';
    }
    // Dedicated templates' "Building Specifications" table loops over `specs`
    // (product_specs rows), and their own hero image looks itself up in
    // dbProductsByModel (same override pattern every OTHER product's card
    // already used on category pages) - so admin edits to either actually
    // reach the live page instead of being stuck on whatever was hardcoded
    // at authoring time.
    let dedicatedSpecs = [];
    let dedicatedProductsByModel = {};
    try {
      const dedicatedProduct = await db('products').where({ slug: file }).first();
      if (dedicatedProduct) {
        dedicatedSpecs = await db('product_specs').where({ product_id: dedicatedProduct.id }).orderBy('sort_order');
        dedicatedProductsByModel[dedicatedProduct.model_number] = dedicatedProduct;
      }
    } catch (e) {
      dedicatedSpecs = [];
      dedicatedProductsByModel = {};
    }
    return nunjucksEnv.render(regMeta.template, renderVars(regMeta, { specs: dedicatedSpecs, dbProductsByModel: dedicatedProductsByModel, theme: dedicatedTheme, themeCssVars: dedicatedThemeCssVars }));
  }

  const product = await db('products').where({ slug: file }).first();
  if (!product) return null;

  const category = await db('categories').where({ id: product.category_id }).first();
  const specs = await db('product_specs').where({ product_id: product.id }).orderBy('sort_order');
  const variants = await db('product_variants').where({ product_id: product.id }).orderBy('sort_order');

  if (variants.length) {
    const allRooms = await db('product_rooms')
      .whereIn('product_variant_id', variants.map((v) => v.id))
      .orderBy('sort_order');
    const roomsByVariant = new Map();
    for (const room of allRooms) {
      if (!roomsByVariant.has(room.product_variant_id)) roomsByVariant.set(room.product_variant_id, []);
      roomsByVariant.get(room.product_variant_id).push(room);
    }
    for (const v of variants) {
      v.rooms = roomsByVariant.get(v.id) || [];
      const { groups, buildingTotal } = groupRoomsByFloor(v.rooms);
      v.roomGroups = groups.map((g) => ({
        label: g.label,
        total: g.total,
        rows: g.rows.map((r) => ({
          ...r,
          icon: roomIcon(r.section),
          barPct: g.total ? Math.min(100, Math.round(((Number(r.area_sqft) || 0) / g.total) * 100)) : 0,
        })),
      }));
      v.roomGroupsBuildingTotal = buildingTotal;
      const totalRow = v.rooms.find((r) => r.section && /total building area/i.test(r.section));
      v.totalArea = (totalRow && totalRow.area_sqft) || v.area_sqft;
      v.estimatedPrice = product.fixed_price || (product.price_per_sqft ? Math.round(v.totalArea * product.price_per_sqft) : null);
      v.estimatedPriceFormatted = v.estimatedPrice ? formatTaka(v.estimatedPrice) : null;
    }
  }

  if (product.fixed_price) {
    product.fixedPriceFormatted = formatTaka(product.fixed_price);
  }
  const waPriceText = product.fixedPriceFormatted ? ` (${product.fixedPriceFormatted})` : '';
  const waMsg = `Hello, I am interested in Model ${product.model_number || ''}${waPriceText}.`;
  product.whatsAppUrl = `https://wa.me/8801781636613?text=${encodeURIComponent(waMsg)}`;

  let relatedProducts = [];
  try {
    relatedProducts = await db('products')
      .where({ category_id: product.category_id, published: true })
      .whereNot({ id: product.id })
      .orderBy('sort_order')
      .limit(4);
  } catch (e) {
    relatedProducts = [];
  }

  const pageTitle = formatProductTitle(product, category);

  let theme = {};
  let themeCssVars = '';
  try {
    theme = await getThemeSettings();
    themeCssVars = generateCssVariables(theme);
  } catch (e) {
    theme = {};
    themeCssVars = '';
  }

  const renderData = {
    title: pageTitle,
    description: product.meta_description || product.description,
    canonical: `https://bongshaihousing.com/${product.slug}`,
    ogTitle: pageTitle,
    ogDescription: product.meta_description || product.description,
    ogImage: product.main_image ? `https://bongshaihousing.com/${product.main_image}` : undefined,
    category: category || { name: '' },
    product,
    specs,
    variants,
    relatedProducts,
    theme,
    themeCssVars,
  };

  return nunjucksEnv.render('pages/product-detail.njk', renderData);
}

/**
 * Directly renders a category landing page (e.g. duplex-steel-building.html)
 * to HTML string using Nunjucks & DB - the exact same dbCategory/
 * dbProductsByModel fetch server/routes/pages.js's CATEGORY_LANDING_PAGES
 * handler does for a live request, just without needing a req/res. This is
 * the render path a product-image upload actually needs: syncPageToLive()
 * is called with the category's landing_page_slug after every product
 * save, and until this existed that call fell all the way through to
 * renderProductToHtml() (which only matches product slugs, so always
 * returned null for a category) and then the fragile self-fetch fallback -
 * meaning the category grid's thumbnail silently kept showing the old image
 * whenever that fallback didn't fire (Passenger loopback fetches are not
 * reliable - see project-node-hosting-quirks). This path never depends on
 * a self-fetch at all.
 */
async function renderCategoryToHtml(pageFile) {
  if (!db) throw new Error('Database connection not available');

  const meta = registry['/' + pageFile];
  if (!meta || !meta.template) return null;

  let dbCategory = null;
  const dbProductsByModel = {};

  const pageSlug = pageFile.replace(/\.html$/, '');
  dbCategory = await db('categories')
    .where({ landing_page_slug: pageFile })
    .orWhere({ slug: pageSlug })
    .orWhere({ landing_page_slug: pageSlug })
    .first();

  if (!dbCategory) return null; // not actually a category page - let the caller try something else

  const products = await db('products')
    .where({ category_id: dbCategory.id, published: true })
    .select('id', 'model_number', 'title', 'slug', 'fixed_price', 'price_per_sqft', 'total_floor_area', 'main_image')
    .orderBy('sort_order', 'asc');

  const productIds = products.map((p) => p.id);
  let allSpecs = [];
  if (productIds.length > 0) {
    allSpecs = await db('product_specs').whereIn('product_id', productIds).orderBy('sort_order', 'asc');
  }
  const specsByProductId = {};
  allSpecs.forEach((spec) => {
    if (!specsByProductId[spec.product_id]) specsByProductId[spec.product_id] = [];
    specsByProductId[spec.product_id].push(spec);
  });
  products.forEach((p) => {
    p.specs = specsByProductId[p.id] || [];
    dbProductsByModel[p.model_number] = p;
  });
  dbProductsByModel._list = products;

  let theme = {};
  let themeCssVars = '';
  try {
    theme = await getThemeSettings();
    themeCssVars = generateCssVariables(theme);
  } catch (e) {
    theme = {};
    themeCssVars = '';
  }

  return nunjucksEnv.render(meta.template, renderVars(meta, { dbCategory, dbProductsByModel, theme, themeCssVars }));
}

/**
 * Regenerates and writes the static HTML file directly to DOCROOT
 */
async function syncPageToLive(slug) {
  if (!slug) return false;
  const file = slug.endsWith('.html') ? slug : `${slug}.html`;

  try {
    // 1. Direct in-process Nunjucks rendering - try a product page first,
    // then a category landing page (a category's landing_page_slug is
    // passed through this same function after every product save).
    let html = null;
    try {
      html = await renderProductToHtml(file);
    } catch (renderErr) {
      console.warn(`[liveSiteSync] In-process product render missed for ${file}:`, renderErr.message);
    }
    if (!html) {
      try {
        html = await renderCategoryToHtml(file);
      } catch (renderErr) {
        console.warn(`[liveSiteSync] In-process category render missed for ${file}:`, renderErr.message);
      }
    }

    // 2. If neither in-process render matched, attempt loopback self-fetch
    if (!html) {
      const port = process.env.PORT || 3000;
      try {
        const res = await fetch(`http://127.0.0.1:${port}/${file}`);
        if (res.ok) {
          html = await res.text();
        }
      } catch (fetchErr) {
        // Socket/port not available under Passenger
      }
    }

    if (!html) {
      console.error(`[liveSiteSync] Failed to render HTML for ${file}`);
      return false;
    }

    // Write generated HTML to sibling static docroot
    const targetPath = path.join(DOCROOT, file);
    await fsp.writeFile(targetPath, html, 'utf8');
    console.log(`[liveSiteSync] Succeeded for ${file} -> wrote ${html.length} bytes to ${targetPath}`);
    return true;
  } catch (err) {
    console.error(`[liveSiteSync] Error syncing ${file}:`, err.message);
    return false;
  }
}

module.exports = { syncPageToLive, renderProductToHtml, renderCategoryToHtml };
