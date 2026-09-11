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
const { getNavTree } = require('./nav');
const { decorateVariants } = require('./roomLayout');

// Fetch a product's variants + all their rooms and decorate them (roomGroups,
// auto-summed totals) so both the dedicated-template and generic render paths
// hand templates the exact same `variants` shape.
async function loadDecoratedVariants(product) {
  const variants = await db('product_variants').where({ product_id: product.id }).orderBy('sort_order');
  if (!variants.length) return [];
  const rooms = await db('product_rooms')
    .whereIn('product_variant_id', variants.map((v) => v.id))
    .orderBy('sort_order');
  decorateVariants(variants, rooms, product);
  for (const v of variants) {
    if (v.estimatedPrice) v.estimatedPriceFormatted = formatTaka(v.estimatedPrice);
  }
  return variants;
}

// partials/nav.njk renders from navItems/navCategories, which the live app
// injects via res.locals middleware (server.js). This module renders offline
// with no req/res, so it has to fetch that data itself - without it the nav
// loop iterates nothing and every regenerated page ships with an empty menu.
async function navLocals() {
  try {
    return await getNavTree();
  } catch (e) {
    console.warn('[liveSiteSync] nav data fetch failed, page will render with an empty nav:', e.message);
    return { navItems: [], navCategories: [] };
  }
}

function getDocroots() {
  if (process.env.STATIC_DOCROOT) return [process.env.STATIC_DOCROOT];
  const candidates = [
    path.join(__dirname, '..', '..', 'public_html'),
    path.join(__dirname, '..', '..', 'bongshaihousing.com'),
    path.join(__dirname, '..', '..'),
  ];
  const valid = candidates.filter(p => fs.existsSync(p));
  return valid.length > 0 ? valid : [candidates[0]];
}
const VIEWS_DIR = path.join(__dirname, '..', 'views');

const registryPath = path.join(__dirname, '..', 'page-registry.json');
const registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : {};

// Overlay a product's own DB SEO fields on top of its page-registry.json meta.
// The ~128 dedicated bh-*.njk pages take title/description/OG tags from the
// registry (authoring-time snapshot); this lets the admin "Title" / "SEO Title"
// / "SEO Meta Description" / "Description" fields actually reach the live page.
// meta_title/meta_description win; then the plain title/description; then the
// registry value stays.
function metaWithProduct(regMeta, product) {
  if (!product) return regMeta;
  const m = { ...regMeta };
  const t = (product.meta_title && product.meta_title.trim()) || (product.title && product.title.trim());
  if (t) { m.title = t; m.ogTitle = t; m.twitterTitle = t; }
  const d = (product.meta_description && product.meta_description.trim()) || (product.description && product.description.trim());
  if (d) { m.description = d; m.ogDescription = d; m.twitterDescription = d; }
  return m;
}

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

nunjucksEnv.addFilter('filterSpecs', (specs, type) => (specs || []).filter((s) => s.spec_type === type));
nunjucksEnv.addFilter('comma', (value) => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : String(value);
});

nunjucksEnv.addGlobal('currentYear', new Date().getFullYear());



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
    let dedicatedProduct = null;
    let dedicatedVariants = [];
    try {
      dedicatedProduct = await db('products').where({ slug: file }).first();
      if (dedicatedProduct) {
        dedicatedSpecs = await db('product_specs').where({ product_id: dedicatedProduct.id }).orderBy('sort_order');
        dedicatedProductsByModel[dedicatedProduct.model_number] = dedicatedProduct;
        if (dedicatedProduct.fixed_price) dedicatedProduct.fixedPriceFormatted = formatTaka(dedicatedProduct.fixed_price);
        dedicatedVariants = await loadDecoratedVariants(dedicatedProduct);
      }
    } catch (e) {
      dedicatedSpecs = [];
      dedicatedProductsByModel = {};
      dedicatedProduct = null;
      dedicatedVariants = [];
    }

    // Category landing pages (apartment-building.html etc.) ALSO have a
    // registry entry with their own non-generic template, so they match
    // the branch condition above too - but they're not a product slug, so
    // dedicatedProduct never resolves. Rendering anyway with empty specs/
    // dbProductsByModel silently "succeeded" (non-null return), which
    // meant syncPageToLive() never fell through to renderCategoryToHtml()
    // at all - every category page's image-sync trigger was a no-op site-
    // wide. Bail out here instead, so the real category renderer gets a
    // chance. The 16 orphan product pages (Container House etc., no DB
    // row either) hit this same null return, which is fine - nothing in
    // the admin UI can ever target their slug for a sync in the first
    // place, since no product row exists to edit.
    if (!dedicatedProduct) return null;

    // og:image/twitter:image (layout.njk uses the same `ogImage` var for
    // both) default to whatever was in the registry at authoring time -
    // override with the product's current DB photo when it has one, so a
    // social-share preview doesn't keep showing an old uploaded photo.
    const dedicatedOgImage = dedicatedProduct && dedicatedProduct.main_image
      ? `https://bongshaihousing.com/${dedicatedProduct.main_image}`
      : undefined;
    const dedicatedTechSpecs = dedicatedSpecs.filter((s) => s.spec_type === 'technical');
    const dedicatedBuildingSpecs = dedicatedSpecs.filter((s) => s.spec_type === 'building');
    return nunjucksEnv.render(regMeta.template, renderVars(metaWithProduct(regMeta, dedicatedProduct), {
      specs: dedicatedSpecs,
      techSpecs: dedicatedTechSpecs,
      buildingSpecs: dedicatedBuildingSpecs,
      materialSpecs: dedicatedBuildingSpecs,
      dbProductsByModel: dedicatedProductsByModel,
      product: dedicatedProduct,
      variants: dedicatedVariants,
      theme: dedicatedTheme,
      themeCssVars: dedicatedThemeCssVars,
      ...(await navLocals()),
      ...(dedicatedOgImage ? { ogImage: dedicatedOgImage } : {}),
    }));
  }

  const product = await db('products').where({ slug: file }).first();
  if (!product) return null;

  const category = await db('categories').where({ id: product.category_id }).first();
  const specs = await db('product_specs').where({ product_id: product.id }).orderBy('sort_order');
  const variants = await loadDecoratedVariants(product);

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

  const techSpecs = specs.filter((s) => s.spec_type === 'technical');
  const buildingSpecs = specs.filter((s) => s.spec_type === 'building');
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
    techSpecs,
    buildingSpecs,
    materialSpecs: buildingSpecs,
    variants,
    relatedProducts,
    theme,
    themeCssVars,
    ...(await navLocals()),
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
    .select('id', 'model_number', 'title', 'slug', 'fixed_price', 'price_per_sqft', 'total_floor_area', 'bedrooms', 'bathrooms', 'main_image')
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

  return nunjucksEnv.render(meta.template, renderVars(meta, { dbCategory, dbProductsByModel, theme, themeCssVars, ...(await navLocals()) }));
}

/**
 * Renders one of the "content" registry pages (FAQ, service areas, projects
 * index, the six team department pages, homepage) from the DB, mirroring the
 * exact data each one's route in server/routes/pages.js fetches.
 *
 * These pages are served from static .html in the docroot, so without this an
 * admin edit to a FAQ / team member / project / testimonial saved to the DB
 * and never appeared on the site. Returns null for any other slug so
 * syncPageToLive() falls through to its other renderers.
 */
const TEAM_DEPTS = {
  'team-senior-management.html': 'senior-management',
  'team-engineering.html': 'engineering',
  'team-marketing-sales.html': 'marketing-sales',
  'team-quality-control.html': 'quality-control',
  'team-skilled-workers.html': 'skilled-workers',
  'team-client-service.html': 'client-service',
};

async function renderContentPageToHtml(pageFile) {
  if (!db) throw new Error('Database connection not available');
  const file = pageFile.endsWith('.html') ? pageFile : `${pageFile}.html`;
  const meta = registry['/' + file];
  if (!meta || !meta.template) return null;

  const extra = {};
  if (file === 'faq.html') {
    const dbFaqs = await db('faqs').where({ published: true }).orderBy('category', 'asc').orderBy('sort_order', 'asc');
    const groupMap = new Map();
    for (const f of dbFaqs) {
      const cat = f.category || 'General';
      if (!groupMap.has(cat)) groupMap.set(cat, []);
      groupMap.get(cat).push(f);
    }
    extra.dbFaqs = dbFaqs;
    extra.faqCategories = Array.from(groupMap.entries()).map(([name, items]) => ({ name, items }));
  } else if (file === 'service-areas.html') {
    extra.dbServiceAreas = await db('service_areas').orderBy('division', 'asc').orderBy('district', 'asc');
  } else if (file === 'projects.html') {
    extra.dbProjects = await db('projects').where({ published: true }).orderBy('sort_order')
      .select('id', 'slug', 'title', 'location', 'description', 'image', 'status_label');
  } else if (TEAM_DEPTS[file]) {
    const rows = await db('team_members').where({ department: TEAM_DEPTS[file], published: true }).orderBy('sort_order', 'asc');
    extra.dbTeamMembers = rows.map((m) => ({
      ...m,
      initials: String(m.name || '').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
    }));
    extra.teamDepartment = TEAM_DEPTS[file];
  } else if (file === 'index.html') {
    extra.dbTestimonials = await db('testimonials').where({ published: true }).orderBy('sort_order');
  } else {
    // Any other registry page (about, contact, terms, calculators, the
    // district landing pages...). These carry no extra DB data - they still
    // need re-rendering so a Theme Editor change reaches their baked-in
    // <style id="bh-theme-custom-vars"> block. page_content supplies optional
    // per-URL overrides when a row exists.
    // Guard: a category landing page or a project page must be rendered by its
    // own renderer (which supplies dbProductsByModel / project). If one of those
    // threw, falling through to here would render the template's hardcoded
    // fallbacks and silently overwrite live DB-driven values - fail loudly instead.
    const ownedByCategory = await db('categories').where({ landing_page_slug: file }).first();
    if (ownedByCategory) throw new Error(`${file} is a category landing page; category render must succeed first`);
    const ownedByProject = await db('projects').where({ slug: file }).first();
    if (ownedByProject) throw new Error(`${file} is a project page; project render must succeed first`);

    try {
      const row = await db('page_content').where({ url_path: '/' + file }).first();
      if (row) {
        if (row.title) extra.title = row.title;
        if (row.content_json) {
          extra.pc = typeof row.content_json === 'string' ? JSON.parse(row.content_json) : row.content_json;
        }
      }
    } catch (e) { /* table may not exist; meta + theme is enough */ }
    if (!extra.pc) extra.pc = {};
  }

  let theme = {};
  let themeCssVars = '';
  try {
    theme = await getThemeSettings();
    themeCssVars = generateCssVariables(theme);
  } catch (e) { theme = {}; themeCssVars = ''; }

  return nunjucksEnv.render(meta.template, renderVars(meta, {
    ...extra, theme, themeCssVars, ...(await navLocals()),
  }));
}

/**
 * Directly renders a project detail page (project-bodorgonj-rangpur.html
 * etc.) to HTML string using Nunjucks & DB. Same shape as renderProductToHtml's
 * dedicated-template branch: each project has its own hand-authored .njk
 * template with a hardcoded description/image, but /admin/projects/:id has
 * a working edit form with no live-sync path at all until this - editing a
 * project updated the DB row and nothing else.
 */
async function renderProjectToHtml(pageFile) {
  if (!db) throw new Error('Database connection not available');

  const file = pageFile.endsWith('.html') ? pageFile : `${pageFile}.html`;
  const baseName = file.replace(/\.html$/, '');
  const dedicatedTemplatePath = `pages/${baseName}.njk`;
  const dedicatedTemplateFullPath = path.join(__dirname, '..', 'views', dedicatedTemplatePath);
  const hasDedicatedTemplate = fs.existsSync(dedicatedTemplateFullPath);

  const project = await db('projects').where({ slug: file }).first();
  if (!project) return null; // not actually a project page - let the caller try something else

  // A brand-new project (created via /admin/projects/new) has no
  // page-registry.json entry and no hand-authored template - only a DB
  // row. Falls back to the generic pages/project-detail.njk (same idea
  // as product-detail.njk for DB-only products) built straight from the
  // DB fields, instead of returning null and leaving the project with no
  // live page at all.
  let meta = registry['/' + file];
  if (!meta) {
    meta = {
      title: `${project.title} | Bongshai Housing`,
      description: project.description,
      canonical: `https://bongshaihousing.com/${file}`,
      ogType: 'article',
      ogTitle: `${project.title} | Bongshai Housing`,
      ogDescription: project.description,
      ogImage: project.image ? `https://bongshaihousing.com/${project.image}` : undefined,
      whatsappHref: 'https://wa.me/8801781636613',
      template: hasDedicatedTemplate ? dedicatedTemplatePath : 'pages/project-detail.njk',
    };
  } else if (!meta.template) {
    meta.template = hasDedicatedTemplate ? dedicatedTemplatePath : 'pages/project-detail.njk';
  }

  let theme = {};
  let themeCssVars = '';
  try {
    theme = await getThemeSettings();
    themeCssVars = generateCssVariables(theme);
  } catch (e) {
    theme = {};
    themeCssVars = '';
  }

  return nunjucksEnv.render(meta.template, renderVars(meta, { project, theme, themeCssVars, ...(await navLocals()) }));
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
    if (!html) {
      try {
        html = await renderProjectToHtml(file);
      } catch (renderErr) {
        console.warn(`[liveSiteSync] In-process project render missed for ${file}:`, renderErr.message);
      }
    }
    if (!html) {
      try {
        html = await renderContentPageToHtml(file);
      } catch (renderErr) {
        console.warn(`[liveSiteSync] In-process content render missed for ${file}:`, renderErr.message);
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

    // Write generated HTML to sibling static docroot(s)
    const docroots = getDocroots();
    let written = false;
    for (const d of docroots) {
      const targetPath = path.join(d, file);
      try {
        await fsp.writeFile(targetPath, html, 'utf8');
        console.log(`[liveSiteSync] Succeeded for ${file} -> wrote ${html.length} bytes to ${targetPath}`);
        written = true;
      } catch (writeErr) {
        console.warn(`[liveSiteSync] Write missed for ${targetPath}:`, writeErr.message);
      }
    }
    return written;
  } catch (err) {
    console.error(`[liveSiteSync] Error syncing ${file}:`, err.message);
    return false;
  }
}

module.exports = { syncPageToLive, renderProductToHtml, renderCategoryToHtml, renderProjectToHtml, renderContentPageToHtml };
