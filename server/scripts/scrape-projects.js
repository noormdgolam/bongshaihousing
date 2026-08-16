#!/usr/bin/env node
/**
 * Extracts project-*.html pages into server/db/seeds/data/projects.json,
 * mirroring scrape-products.js's pattern (scrape to JSON first, review by
 * eye, seed separately).
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.join(__dirname, '..', '..');
const OUT_PATH = path.join(__dirname, '..', 'db', 'seeds', 'data', 'projects.json');

function main() {
  const files = fs.readdirSync(REPO_ROOT).filter((f) => /^project-.*\.html$/.test(f));
  const results = [];

  for (const filename of files) {
    const html = fs.readFileSync(path.join(REPO_ROOT, filename), 'utf8');
    const doc = new JSDOM(html).window.document;

    const title = (doc.querySelector('h1.page-hero-title') || {}).textContent || null;
    const img = doc.querySelector('main img, #main-content img');
    const statusLabel = (doc.querySelector('.property-type') || {}).textContent || 'Completed Project';
    const descP = doc.querySelector('main p, #main-content p');

    results.push({
      slug: filename,
      title: title ? title.trim() : filename.replace(/^project-/, '').replace(/\.html$/, ''),
      location: title ? title.trim() : null,
      description: descP ? descP.textContent.trim() : null,
      image: img ? img.getAttribute('src') : null,
      statusLabel: statusLabel.trim(),
    });
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  console.log(`Scraped ${results.length} projects -> ${path.relative(REPO_ROOT, OUT_PATH)}`);
}

main();
