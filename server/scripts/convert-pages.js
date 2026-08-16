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
 * architecture notes), and career.html + index.html (hand-tuned after the
 * initial auto-extraction - index.html in particular has page-specific
 * additions the generic extraction can't derive: body class, an extra
 * <head> script, a features-strip section + FTUE modal living outside
 * <main>, a stats-counter-animation script that extends rather than
 * matches the shared footer script, and a page-view-counter nested inside
 * the shared footer markup. Re-running the script for either would
 * silently wipe those out - if real content on either page changes,
 * re-apply the diff by hand rather than removing them from this list).
 *
 * Usage: node server/scripts/convert-pages.js [--dry-run] [--only=file1.html,file2.html]
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.join(__dirname, '..', '..');
const VIEWS_PAGES_DIR = path.join(__dirname, '..', 'views', 'pages');
const REGISTRY_PATH = path.join(__dirname, '..', 'page-registry.json');

const EXCLUDE = new Set(['_header.html', '_footer.html', '_mobile_drawer.html', '404.html', 'offline.html', 'index.html']);


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
  const bodyClass = attr(doc.querySelector('body'), 'class');
  // ~1/3 of pages show a "Interactive Tools > Get Quote" shortcut in the
  // mobile nav drawer (solutions.html itself and a few utility pages
  // omit it) - not a clean majority/minority split, so nav.njk renders it
  // conditionally per page rather than baking in one default for everyone.
  const showQuoteShortcut = html.includes('text-transform:uppercase;">Interactive Tools</div>');

  const ldJsonScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  // A few pages load an extra library/script in <head> beyond the standard
  // shared set (index.html's swiper-custom.min.js for the hero slider,
  // interactive-tools.html's chart.js/leaflet, service-areas.html's
  // bd-geo-data.js) - not shared boilerplate, so not in layout.njk, but
  // still needs to load in <head> (before body scripts) for these pages.
  const HEAD_SHARED_SRC_MARKERS = ['style.min.css', 'aos.js', 'aos.css', 'bangla-translation.js'];
  const extraHeadScripts = Array.from(doc.querySelectorAll('head script[src]')).filter((s) => {
    const src = s.getAttribute('src') || '';
    return !HEAD_SHARED_SRC_MARKERS.some((m) => src.includes(m));
  });
  const headExtra = [...ldJsonScripts, ...extraHeadScripts].map((s) => s.outerHTML).join('\n');

  const contentHtml = main.innerHTML.trim();

  // Most pages have nothing but the shared footer/scripts after </main>,
  // but two distinct exceptions exist and both silently lose content if
  // only main.innerHTML is captured:
  //  - 186 of 218 pages define page-specific <script>/<style> blocks after
  //    the shared footer scripts, near </body> - typically the
  //    updateSpecsXXX()/floorDataXXX room-size-switcher logic unique to
  //    each product page.
  //  - A handful of pages (index.html's features-strip section + FTUE
  //    modal, solutions.html's area-selector style/script) place real
  //    sibling-of-<main> *elements* - not just script/style - between
  //    </main> and <footer>.
  // Walk every element sibling from main onward, skip the footer itself
  // and the now-shared boilerplate baked into footer.njk/layout.njk, and
  // route whatever's left into "before the footer" (content_after block,
  // renders as a sibling of <main>) vs "after the footer" (scripts_extra,
  // renders at the end of body) depending on which side of <footer> it's on.
  const SHARED_SCRIPT_MARKERS = [
    'aos.js', '3d-tilt.js', 'page-transition.js', 'global-upgrades.min.js', 'bangla-translation.js',
  ];
  function isKnownShared(el) {
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

  const beforeFooterBlocks = [];
  const afterFooterBlocks = [];
  let sib = main.nextElementSibling;
  let passedFooter = false;
  while (sib) {
    if (sib.tagName === 'FOOTER') {
      passedFooter = true;
    } else if (!isKnownShared(sib)) {
      (passedFooter ? afterFooterBlocks : beforeFooterBlocks).push(sib.outerHTML);
    }
    sib = sib.nextElementSibling;
  }
  const contentAfter = beforeFooterBlocks.join('\n');
  const scriptsExtra = afterFooterBlocks.join('\n');

  // Guard: literal {{ or {% in extracted content would be misinterpreted
  // as Nunjucks syntax. Flag rather than silently emit a broken template.
  const suspicious = [contentHtml, headExtra, contentAfter, scriptsExtra].some((s) => /\{\{|\{%/.test(s));

  const templateName = filename.replace(/\.html$/, '');
  const njkPath = path.join(VIEWS_PAGES_DIR, `${templateName}.njk`);

  const njkContent = `{% extends "layout.njk" %}
${headExtra ? `{% block head_extra %}\n${headExtra}\n{% endblock %}\n\n` : ''}{% block content %}
${contentHtml}
{% endblock %}
${contentAfter ? `\n{% block content_after %}\n${contentAfter}\n{% endblock %}\n` : ''}${scriptsExtra ? `\n{% block scripts_extra %}\n${scriptsExtra}\n{% endblock %}\n` : ''}`;

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
      bodyClass,
      showQuoteShortcut,
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
