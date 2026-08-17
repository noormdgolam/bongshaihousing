// Dynamic search-index.json: products, categories, and projects are admin-editable
// in the database. This route generates an up-to-date search index by merging
// live DB entries with the static search-index.json baseline, falling back
// to the static file if the database is unreachable.
const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../lib/db');

const router = express.Router();
const STATIC_SEARCH_INDEX_PATH = path.join(__dirname, '..', '..', 'search-index.json');

function normalizeUrl(rawUrl) {
  if (!rawUrl) return '';
  let u = rawUrl.trim().replace(/^\/+/, '');
  if (!u.endsWith('.html') && !u.includes('.')) {
    u += '.html';
  }
  return u;
}

router.get('/search-index.json', async (req, res) => {
  try {
    const staticData = fs.existsSync(STATIC_SEARCH_INDEX_PATH)
      ? JSON.parse(fs.readFileSync(STATIC_SEARCH_INDEX_PATH, 'utf8'))
      : [];

    if (!db) {
      return res.json(staticData);
    }

    // Fetch published products, categories, and projects from DB
    const products = await db('products')
      .where({ published: true })
      .select('slug', 'title', 'meta_title', 'meta_desc', 'tagline', 'description');

    const categories = await db('categories')
      .select('slug', 'title', 'description');

    const projects = await db('projects')
      .where({ published: true })
      .select('slug', 'title', 'location', 'description');

    const dbUrls = new Set();

    // Map DB entries
    const dbEntries = [];

    for (const p of products) {
      const url = normalizeUrl(p.slug);
      dbUrls.add(url);
      dbEntries.push({
        title: p.title || p.meta_title || 'Steel Building Model',
        desc: p.meta_desc || p.tagline || (p.description ? p.description.slice(0, 160) : ''),
        url,
      });
    }

    for (const c of categories) {
      const url = normalizeUrl(c.slug);
      dbUrls.add(url);
      dbEntries.push({
        title: `${c.title} | Pre-Engineered Steel Building Bangladesh`,
        desc: c.description ? c.description.slice(0, 160) : '',
        url,
      });
    }

    for (const pr of projects) {
      const url = normalizeUrl(pr.slug);
      dbUrls.add(url);
      dbEntries.push({
        title: `${pr.title} | Completed Project | Bongshai Housing`,
        desc: pr.description || `Completed steel building project in ${pr.location || 'Bangladesh'}`,
        url,
      });
    }

    const hasServiceAreas = await db.schema.hasTable('service_areas');
    if (hasServiceAreas) {
      const areas = await db('service_areas').where({ has_dedicated_page: true }).select('district', 'division', 'page_slug');
      for (const a of areas) {
        const url = normalizeUrl(a.page_slug || `steel-building-${a.district.toLowerCase()}`);
        if (!dbUrls.has(url)) {
          dbUrls.add(url);
          dbEntries.push({
            title: `Pre-Engineered Steel Building in ${a.district}, ${a.division} | Bongshai Housing`,
            desc: `Leading steel building manufacturer and EPC contractor in ${a.district} district, ${a.division} division. Factory sheds, duplex villas, and warehouse construction.`,
            url,
          });
        }
      }
    }

    // Keep static entries that are not replaced by DB entries
    const staticEntries = staticData.filter((item) => {
      const u = normalizeUrl(item.url);
      return !dbUrls.has(u);
    });

    const merged = [...staticEntries, ...dbEntries];
    res.json(merged);
  } catch (err) {
    console.error('Dynamic search-index generation failed, serving static fallback:', err.message);
    if (fs.existsSync(STATIC_SEARCH_INDEX_PATH)) {
      res.sendFile(STATIC_SEARCH_INDEX_PATH);
    } else {
      res.json([]);
    }
  }
});

module.exports = router;
