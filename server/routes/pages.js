const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Bare status route at the app root. index.html isn't converted yet (that's
// later Phase 1 work), and cPanel's Node Selector health-checks the
// Application URL root after install/restart - without this it 404s as
// JSON, which cPanel's "check availability" step flags as a failed
// install even though npm install itself succeeded fine.
router.get('/', (req, res) => {
  res.status(200).type('html').send('<!doctype html><title>Bongshai Housing - Node app</title>Bongshai Housing Node app is running (Phase 1, staging).');
});

// Data-driven page rendering: server/scripts/convert-pages.js extracts each
// static page's head metadata + <main id="main-content"> body into a .njk
// template plus an entry here, so adding a converted page is "run the
// script" rather than hand-writing a router.get() block per page.
const registryPath = path.join(__dirname, '..', 'page-registry.json');
const registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : {};

for (const [urlPath, meta] of Object.entries(registry)) {
  router.get(urlPath, (req, res) => {
    res.render(meta.template, {
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
    });
  });
}

module.exports = router;
