const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { cacheMiddleware } = require('../lib/pageCache');

router.use(cacheMiddleware);

// Data-driven page rendering: server/scripts/convert-pages.js extracts each
// static page's head metadata + <main id="main-content"> body into a .njk
// template plus an entry here, so adding a converted page is "run the
// script" rather than hand-writing a router.get() block per page.
const registryPath = path.join(__dirname, '..', 'page-registry.json');
const registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : {};

// DB is optional on this router — if it's not available (local dev without
// MySQL, or a transient hiccup), these pages still render from their static
// template content rather than returning a 500.
let db;
try {
  db = require('../lib/db');
} catch (e) {
  db = null;
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




// ── /projects.html — DB-driven project grid ───────────────────────────────
// Same pattern: fetches published projects and passes as `dbProjects`.
// Falls back to [] if DB is unavailable; projects.njk uses the existing
// static content when dbProjects is empty.
if (registry['/projects.html']) {
  const projectsMeta = registry['/projects.html'];
  router.get('/projects.html', async (req, res) => {
    let dbProjects = [];
    if (db) {
      try {
        dbProjects = await db('projects')
          .where({ published: true })
          .orderBy('sort_order')
          .select('id', 'slug', 'title', 'location', 'description', 'image', 'status_label');
      } catch (err) {
        console.error('projects DB fetch failed, rendering static fallback:', err.message);
      }
    }
    res.render(projectsMeta.template, renderVars(projectsMeta, { dbProjects }));
  });
}

// ── /service-areas.html — DB-driven nationwide service areas ──────────────
// Pulls the active 64 districts & dedicated page mapping from the database,
// falling back to bdGeoData in the template if DB is empty or offline.
if (registry['/service-areas.html']) {
  const serviceAreasMeta = registry['/service-areas.html'];
  router.get('/service-areas.html', async (req, res) => {
    let dbServiceAreas = [];
    if (db) {
      try {
        dbServiceAreas = await db('service_areas')
          .orderBy('division', 'asc')
          .orderBy('district', 'asc');
      } catch (err) {
        console.error('service_areas DB fetch failed, rendering static fallback:', err.message);
      }
    }
    res.render(serviceAreasMeta.template, renderVars(serviceAreasMeta, { dbServiceAreas }));
  });
}

// ── /faq.html — DB-driven Frequently Asked Questions & Schema.org JSON-LD ──
// Pulls published FAQs grouped by category from DB, dynamically regenerates
// valid FAQPage JSON-LD schema, falling back to static markup if DB is empty or offline.
if (registry['/faq.html']) {
  const faqMeta = registry['/faq.html'];
  router.get('/faq.html', async (req, res) => {
    let dbFaqs = [];
    let faqCategories = [];
    let faqJsonLd = null;

    if (db) {
      try {
        dbFaqs = await db('faqs')
          .where({ published: true })
          .orderBy('category', 'asc')
          .orderBy('sort_order', 'asc');

        if (dbFaqs.length > 0) {
          // Group by category maintaining order
          const groupMap = new Map();
          for (const f of dbFaqs) {
            const cat = f.category || 'General';
            if (!groupMap.has(cat)) groupMap.set(cat, []);
            groupMap.get(cat).push(f);
          }
          faqCategories = Array.from(groupMap.entries()).map(([name, items]) => ({
            name,
            items,
          }));

          // Generate dynamic Schema.org FAQPage JSON-LD
          faqJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'dateModified': '2026-08-17',
            'speakable': {
              '@type': 'SpeakableSpecification',
              'cssSelector': ['.faq-answer', '.faq-question'],
            },
            'author': {
              '@type': 'Person',
              'name': 'SMA AWAL',
              'jobTitle': 'Chief Engineer',
              'worksFor': {
                '@type': 'Organization',
                'name': 'Bongshai Housing Ltd.',
                'foundingDate': '2008',
                'url': 'https://bongshaihousing.com',
              },
            },
            'mainEntity': dbFaqs.map(f => ({
              '@type': 'Question',
              'name': f.question,
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': f.answer.replace(/<[^>]+>/g, '').trim(),
              },
            })),
          };
        }
      } catch (err) {
        console.error('faqs DB fetch failed, rendering static fallback:', err.message);
      }
    }

    res.render(faqMeta.template, renderVars(faqMeta, { dbFaqs, faqCategories, faqJsonLd }));
  });
}

// ── Category landing pages — DB-driven hero / description / card-image override
// Pulls hero image/description from the DB category row when present, and
// each product card's main_image from the products table (keyed by
// model_number - see partials/product-card-image.njk), falling back to the
// template's static content wherever DB is empty, offline, or a given
// product simply isn't in it. This is what keeps a card in sync after an
// admin edits that product's image in the dashboard - previously these
// cards were 100% hardcoded HTML with no DB connection at all.
const CATEGORY_LANDING_PAGES = [
  'apartment-building.html',
  'concrete-building.html',
  'container-house.html',
  'cottage-house.html',
  'duplex-steel-building.html',
  'industrial-sheds.html',
  'luxury-villa.html',
  'simplex-steel-building.html',
  'steel-house.html',
  'tiny-house.html',
  'wooden-house.html',
  'worker-accommodation.html',
];

for (const pageFile of CATEGORY_LANDING_PAGES) {
  const urlPath = `/${pageFile}`;
  if (registry[urlPath]) {
    const meta = registry[urlPath];
    router.get(urlPath, async (req, res) => {
      let dbCategory = null;
      let dbProductsByModel = {};
      if (db) {
        try {
          const pageSlug = pageFile.replace(/\.html$/, '');
          dbCategory = await db('categories')
            .where({ landing_page_slug: pageFile })
            .orWhere({ slug: pageSlug })
            .orWhere({ landing_page_slug: pageSlug })
            .first();

          if (dbCategory) {
            const products = await db('products')
              .where({ category_id: dbCategory.id, published: true })
              .select('model_number', 'main_image');
            dbProductsByModel = Object.fromEntries(products.map((p) => [
              p.model_number,
              {
                main_image: p.main_image,
                // Only claim a responsive srcset when the image is actually
                // a .webp - a handful of legacy cards use raw external URLs
                // or non-webp files with no -400w/-700w siblings to exist.
                srcset: p.main_image && p.main_image.endsWith('.webp')
                  ? `${p.main_image.replace('.webp', '-400w.webp')} 400w, ${p.main_image.replace('.webp', '-700w.webp')} 700w, ${p.main_image} 1024w`
                  : null,
              },
            ]));
          }
        } catch (err) {
          console.error(`category DB fetch failed for ${pageFile}, rendering static fallback:`, err.message);
        }
      }
      res.render(meta.template, renderVars(meta, { dbCategory, dbProductsByModel }));
    });
  }
}

// ── Team Department pages — DB-driven team members & leadership ──────────
const TEAM_PAGES = [
  { file: 'team-senior-management.html', dept: 'senior-management' },
  { file: 'team-engineering.html', dept: 'engineering' },
  { file: 'team-marketing-sales.html', dept: 'marketing-sales' },
  { file: 'team-quality-control.html', dept: 'quality-control' },
  { file: 'team-skilled-workers.html', dept: 'skilled-workers' },
  { file: 'team-client-service.html', dept: 'client-service' },
];

for (const { file, dept } of TEAM_PAGES) {
  const urlPath = `/${file}`;
  if (registry[urlPath]) {
    const meta = registry[urlPath];
    router.get(urlPath, async (req, res) => {
      let dbTeamMembers = [];
      if (db) {
        try {
          const rows = await db('team_members')
            .where({ department: dept, published: true })
            .orderBy('sort_order', 'asc');
          // No stock "team photo" fallback - an unset photo renders as an
          // initials avatar instead, since a fake photo on a real named
          // person misrepresents who they are.
          dbTeamMembers = rows.map((m) => ({
            ...m,
            initials: m.name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
          }));
        } catch (err) {
          console.error(`team_members DB fetch failed for ${dept}, rendering static fallback:`, err.message);
        }
      }
      res.render(meta.template, renderVars(meta, { dbTeamMembers, teamDepartment: dept }));
    });
  }
}

// ── Generic registry loop (static pages) ──────────────────────────────────
// /projects.html and category landing pages are already registered above with
// dynamic handlers, so Express will match them first and never reach them here.
for (const [urlPath, meta] of Object.entries(registry)) {
  router.get(urlPath, async (req, res, next) => {
    try {
      let pc = {};
      let pageTitle = meta.title;

      if (db) {
        try {
          const row = await db('page_content').where({ url_path: urlPath }).first();
          if (row) {
            if (row.title) pageTitle = row.title;
            if (row.content_json) {
              pc = typeof row.content_json === 'string' ? JSON.parse(row.content_json) : row.content_json;
            }
          }
        } catch (dbErr) {
          // Ignore if table doesn't exist yet or local DB is offline
        }
      }

      const vars = renderVars({ ...meta, title: pageTitle, pc });

      res.render(meta.template, vars, (err, html) => {
        if (err) {
          if (err.message && err.message.includes('template not found')) {
            return next();
          }
          return next(err);
        }
        res.send(html);
      });
    } catch (err) {
      next(err);
    }
  });
}

// index.html's real URL is the bare root - the redirect middleware in
// server.js (server/redirects.json) 301s /index.html -> / to match
// .htaccess, so this is the only route that ever actually serves this
// content. cPanel's Node Selector health-checks this path after
// install/restart, so it needs to resolve to something real rather than
// 404 as JSON, which cPanel's "check availability" step misreads as a
// failed install even when npm install actually succeeded fine.
if (registry['/index.html']) {
  const homeMeta = registry['/index.html'];
  router.get('/', async (req, res) => {
    let dbTestimonials = [];
    if (db) {
      try {
        dbTestimonials = await db('testimonials').where({ published: true }).orderBy('sort_order');
      } catch (err) {
        console.error('testimonials DB fetch failed, rendering static fallback:', err.message);
      }
    }
    res.render(homeMeta.template, renderVars(homeMeta, { dbTestimonials }));
  });
} else {
  router.get('/', (req, res) => {
    res.status(200).type('html').send('<!doctype html><title>Bongshai Housing - Node app</title>Bongshai Housing Node app is running (Phase 1, staging).');
  });
}

module.exports = router;

