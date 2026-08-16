#!/usr/bin/env node
/**
 * Bulk-converts remaining static HTML pages into Nunjucks templates +
 * route registry entries, following the exact pattern hand-built for
 * career.html: shared nav/footer/layout stay in layout.njk, each page's
 * <main id="main-content"> content and head metadata get extracted
 * verbatim into server/views/pages/<name>.njk, and a data-driven route
 * table (server/page-registry.json) lets pages.js render them generically
 * instead of hand-writing 200+ router.get() blocks.
 *
 * Deliberately excludes: dead fragments (_header/_footer/_mobile_drawer),
 * 404.html and offline.html (stay static/Apache's job - see server.js's
 * architecture notes), and career.html (already hand-converted).
 *
 * Usage: node server/scripts/convert-pages.js [--dry-run] [--only=file1.html,file2.html]
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.join(__dirname, '..', '..');
const VIEWS_PAGES_DIR = path.join(__dirname, '..', 'views', 'pages');
const REGISTRY_PATH = path.join(__dirname, '..', 'page-registry.json');

const EXCLUDE = new Set(['_header.html', '_footer.html', '_mobile_drawer.html', '404.html', 'offline.html', 'career.html']);

function text(el) {
  return el ? el.textContent.trim() : null;
}
function attr(el, name) {
  return el ? el.getAttribute(name) : null;
}

function convertOne(filename) {
  const filePath = path.join(REPO_ROOT, filename);
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const main = doc.getElementById('main-content');
  if (!main) {
    return { filename, error: 'no #main-content found' };
  }

  const title = text(doc.querySelector('title'));
  const description = attr(doc.querySelector('meta[name="description"]'), 'content');
  const keywords = attr(doc.querySelector('meta[name="keywords"]'), 'content');
  const category = attr(doc.querySelector('meta[name="category"]'), 'content');
  const canonical = attr(doc.querySelector('link[rel="canonical"]'), 'href');
  const ogType = attr(doc.querySelector('meta[property="og:type"]'), 'content');
  const ogTitle = attr(doc.querySelector('meta[property="og:title"]'), 'content');
  const ogDescription = attr(doc.querySelector('meta[property="og:description"]'), 'content');
  const ogImage = attr(doc.querySelector('meta[property="og:image"]'), 'content');
  const ogImageWidth = attr(doc.querySelector('meta[property="og:image:width"]'), 'content');
  const ogImageHeight = attr(doc.querySelector('meta[property="og:image:height"]'), 'content');
  const twitterTitle = attr(doc.querySelector('meta[name="twitter:title"]'), 'content');
  const twitterDescription = attr(doc.querySelector('meta[name="twitter:description"]'), 'content');
  const whatsappHref = attr(doc.querySelector('a.whatsapp-float'), 'href');

  const ldJsonScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  const headExtra = ldJsonScripts.map((s) => s.outerHTML).join('\n');

  const contentHtml = main.innerHTML.trim();

  // 186 of 218 pages define page-specific <script>/<style> blocks after
  // </main> (some between </main> and <footer>, most after the shared
  // footer scripts, near </body>) - typically the updateSpecsXXX()/
  // floorDataXXX room-size-switcher logic unique to each product page.
  // main.innerHTML alone silently drops all of it. Walk every element
  // sibling from main onward and keep anything that isn't the footer
  // itself or one of the now-shared boilerplate scripts/links baked into
  // footer.njk/layout.njk.
  const SHARED_SCRIPT_MARKERS = [
    'aos.js', '3d-tilt.js', 'page-transition.js', 'global-upgrades.min.js', 'bangla-translation.js',
  ];
  function isKnownShared(el) {
    if (el.tagName === 'FOOTER') return true;
    if (el.tagName === 'A' && el.classList.contains('whatsapp-float')) return true;
    if (el.tagName === 'SCRIPT') {
      const src = el.getAttribute('src') || '';
      if (SHARED_SCRIPT_MARKERS.some((m) => src.includes(m))) return true;
      const body = el.textContent || '';
      if (body.includes('AOS.init(')) return true;
      if (body.includes('serviceWorker')) return true;
      if (body.includes("getElementById('year')") && body.includes('mainNav') && body.includes('hamburgerBtn')) return true;
    }
    return false;
  }

  const trailingBlocks = [];
  let sib = main.nextElementSibling;
  while (sib) {
    if (!isKnownShared(sib) && (sib.tagName === 'SCRIPT' || sib.tagName === 'STYLE')) {
      trailingBlocks.push(sib.outerHTML);
    }
    sib = sib.nextElementSibling;
  }
  const scriptsExtra = trailingBlocks.join('\n');

  // Guard: literal {{ or {% in extracted content would be misinterpreted
  // as Nunjucks syntax. Flag rather than silently emit a broken template.
  const suspicious = /\{\{|\{%/.test(contentHtml) || /\{\{|\{%/.test(headExtra) || /\{\{|\{%/.test(scriptsExtra);

  const templateName = filename.replace(/\.html$/, '');
  const njkPath = path.join(VIEWS_PAGES_DIR, `${templateName}.njk`);

  const njkContent = `{% extends "layout.njk" %}
${headExtra ? `{% block head_extra %}\n${headExtra}\n{% endblock %}\n\n` : ''}{% block content %}
${contentHtml}
{% endblock %}
${scriptsExtra ? `\n{% block scripts_extra %}\n${scriptsExtra}\n{% endblock %}\n` : ''}`;

  return {
    filename,
    templateName,
    njkPath,
    njkContent,
    suspicious,
    meta: {
      urlPath: `/${filename}`,
      title,
      description,
      keywords,
      category,
      canonical,
      ogType,
      ogTitle,
      ogDescription,
      ogImage,
      ogImageWidth,
      ogImageHeight,
      twitterTitle,
      twitterDescription,
      whatsappHref,
      template: `pages/${templateName}.njk`,
    },
  };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.slice('--only='.length).split(',') : null;

  const allHtmlFiles = fs
    .readdirSync(REPO_ROOT)
    .filter((f) => f.endsWith('.html') && !EXCLUDE.has(f));

  const targets = only ? allHtmlFiles.filter((f) => only.includes(f)) : allHtmlFiles;

  fs.mkdirSync(VIEWS_PAGES_DIR, { recursive: true });

  const registry = fs.existsSync(REGISTRY_PATH) ? JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')) : {};
  const results = { ok: 0, errors: [], suspicious: [] };

  for (const filename of targets) {
    const result = convertOne(filename);
    if (result.error) {
      results.errors.push(result);
      continue;
    }
    if (result.suspicious) {
      results.suspicious.push(result.filename);
    }
    if (!dryRun) {
      fs.writeFileSync(result.njkPath, result.njkContent);
      registry[result.meta.urlPath] = result.meta;
    }
    results.ok++;
  }

  if (!dryRun) {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  }

  console.log(`Converted: ${results.ok}${dryRun ? ' (dry run, nothing written)' : ''}`);
  if (results.errors.length) {
    console.log(`Errors (${results.errors.length}):`);
    results.errors.forEach((e) => console.log(`  ${e.filename}: ${e.error}`));
  }
  if (results.suspicious.length) {
    console.log(`Suspicious (contains {{ or {% - review manually) (${results.suspicious.length}):`);
    results.suspicious.forEach((f) => console.log(`  ${f}`));
  }
}

main();
