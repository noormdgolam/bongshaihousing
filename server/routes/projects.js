// DB-backed project pages for any project that doesn't have its own
// dedicated .njk template - mirrors routes/products.js's generic
// product-detail.njk catch-all. Without this, a brand-new project
// created in /admin/projects/new has no live page at all: it isn't in
// page-registry.json, has no hand-authored template, and
// liveSiteSync.js's renderProjectToHtml() only knows how to render an
// EXISTING dedicated template - it returns null for a project with no
// registry entry, same as this route's absence meant a 404 for any
// slug not already baked as a static file. Existing projects (the ones
// with their own project-*.njk template) still take that path first via
// the registry-driven route in pages.js; this only catches what's left.
const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../lib/db');

const router = express.Router();

// Cheap pre-filter: any slug already in page-registry.json is either a
// dedicated-template product/project/category page or unrelated static
// content, and pagesRouter's registry loop already owns it - skip the DB
// hit here entirely rather than querying `projects` on every page view
// sitewide just to find out it's not a project.
const registryPath = path.join(__dirname, '..', 'page-registry.json');
const registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : {};

router.get('/:slug.html', async (req, res, next) => {
  const slug = `${req.params.slug}.html`;
  if (registry['/' + slug]) return next();

  try {
    if (!db) return next();
    const project = await db('projects').where({ slug, published: true }).first();
    if (!project) return next();

    const canonical = `https://bongshaihousing.com/${slug}`;
    res.render('pages/project-detail.njk', {
      title: `${project.title} | Bongshai Housing`,
      description: project.description,
      canonical,
      ogType: 'article',
      ogTitle: `${project.title} | Bongshai Housing`,
      ogDescription: project.description,
      ogImage: project.image ? `https://bongshaihousing.com/${project.image}` : undefined,
      twitterTitle: `${project.title} | Bongshai Housing`,
      twitterDescription: project.description,
      whatsappHref: 'https://wa.me/8801781636613',
      project,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
