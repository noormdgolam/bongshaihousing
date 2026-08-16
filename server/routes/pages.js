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

function renderVars(meta) {
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
  };
}

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
