const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

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

// ── Generic registry loop (static pages) ──────────────────────────────────
// /projects.html is already registered above with a dynamic handler,
// so Express will match it first and never reach that entry here.
for (const [urlPath, meta] of Object.entries(registry)) {
  router.get(urlPath, (req, res) => {
    res.render(meta.template, renderVars(meta));
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
  router.get('/', (req, res) => {
    res.render(homeMeta.template, renderVars(homeMeta));
  });
} else {
  router.get('/', (req, res) => {
    res.status(200).type('html').send('<!doctype html><title>Bongshai Housing - Node app</title>Bongshai Housing Node app is running (Phase 1, staging).');
  });
}

module.exports = router;

