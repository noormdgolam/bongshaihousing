// Pushes the DB-driven nav (partials/nav.njk + nav_items/categories) into the
// ~208 pre-baked static .html files in the docroot.
//
// Why this is needed at all: LiteSpeed serves those static files directly,
// ahead of the Node app, so a nav edit made in /admin/nav-menu shows up
// instantly on server-rendered routes but stays invisible on every static
// page until their copy-pasted nav markup is rewritten. Same static-vs-
// template split that liveSiteSync.js already deals with per-page.
//
// Deliberately a *surgical splice*, not a full page re-render: most of these
// 208 pages have hand-authored content this module has no way to reproduce,
// so it swaps only the two nav regions and leaves every other byte alone.
const fs = require('fs');
const path = require('path');
const fsp = fs.promises;
const nunjucks = require('nunjucks');

const { getNavTree } = require('./nav');
const { getThemeSettings, generateCssVariables } = require('./theme');

const VIEWS_DIR = path.join(__dirname, '..', 'views');
const registryPath = path.join(__dirname, '..', 'page-registry.json');
const registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : {};

const navEnv = nunjucks.configure(VIEWS_DIR, { autoescape: true, noCache: true });
navEnv.addGlobal('currentYear', new Date().getFullYear());

function getDocroots() {
  if (process.env.STATIC_DOCROOT) return [process.env.STATIC_DOCROOT];
  const candidates = [
    path.join(__dirname, '..', '..', 'public_html'),
    path.join(__dirname, '..', '..', 'bongshaihousing.com'),
    path.join(__dirname, '..', '..'),
  ];
  const valid = candidates.filter((p) => fs.existsSync(p));
  return valid.length > 0 ? valid : [candidates[0]];
}

// Finds a well-formed element region starting at `startIdx` (which must point
// at the element's opening '<'), by counting nested open/close tags of the
// same name. Returns [startIdx, endIdxExclusive] or null.
function findElementRegion(html, startIdx, tagName) {
  const openRe = new RegExp(`<${tagName}\\b`, 'gi');
  const closeRe = new RegExp(`</${tagName}\\s*>`, 'gi');
  let depth = 0;
  let i = startIdx;
  while (i < html.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const nextOpen = openRe.exec(html);
    const nextClose = closeRe.exec(html);
    if (!nextClose) return null; // unbalanced - refuse rather than guess
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      i = nextOpen.index + nextOpen[0].length;
    } else {
      depth--;
      i = nextClose.index + nextClose[0].length;
      if (depth === 0) return [startIdx, i];
    }
  }
  return null;
}

function locateNavRegions(html) {
  const navStart = html.search(/<nav\b[^>]*id=["']mainNav["'][^>]*>/i);
  if (navStart === -1) return null;
  const navRegion = findElementRegion(html, navStart, 'nav');
  if (!navRegion) return null;

  const drawerStart = html.search(/<div\b[^>]*id=["']mobileDrawer["'][^>]*>/i);
  if (drawerStart === -1) return null;
  const drawerRegion = findElementRegion(html, drawerStart, 'div');
  if (!drawerRegion) return null;

  if (drawerRegion[0] < navRegion[1]) return null; // drawer must follow the nav, not nest inside it
  return { navRegion, drawerRegion };
}

// Renders nav.njk for one page, then splits its output into the same two
// regions so each can be spliced into the matching spot in the static file.
function renderNavParts(navItems, navCategories, theme, themeCssVars, showQuoteShortcut) {
  const rendered = navEnv.render('partials/nav.njk', {
    navItems,
    navCategories,
    theme,
    themeCssVars,
    showQuoteShortcut: Boolean(showQuoteShortcut),
  });
  const regions = locateNavRegions(rendered);
  if (!regions) throw new Error('Could not locate nav/mobileDrawer regions in freshly rendered nav.njk');
  return {
    nav: rendered.slice(regions.navRegion[0], regions.navRegion[1]),
    drawer: rendered.slice(regions.drawerRegion[0], regions.drawerRegion[1]),
  };
}

/**
 * @param {object} opts
 * @param {boolean} opts.apply  false (default) = dry run, report only
 * @param {string[]} [opts.only] limit to these filenames (e.g. ['index.html'])
 */
async function syncNavToStaticFiles({ apply = false, only = null } = {}) {
  const { navItems, navCategories } = await getNavTree();
  let theme = {};
  let themeCssVars = '';
  try {
    theme = await getThemeSettings();
    themeCssVars = generateCssVariables(theme);
  } catch (e) {
    theme = {};
    themeCssVars = '';
  }

  const docroots = getDocroots();
  const results = { changed: [], unchanged: [], skipped: [], failed: [] };

  for (const docroot of docroots) {
    let files;
    try {
      files = (await fsp.readdir(docroot)).filter((f) => f.endsWith('.html'));
    } catch (e) {
      continue;
    }
    if (only && only.length) files = files.filter((f) => only.includes(f));

    for (const file of files) {
      const full = path.join(docroot, file);
      try {
        const html = await fsp.readFile(full, 'utf8');
        const regions = locateNavRegions(html);
        if (!regions) {
          results.skipped.push({ file: `${path.basename(docroot)}/${file}`, reason: 'no nav/mobileDrawer region found' });
          continue;
        }

        const meta = registry['/' + file] || {};
        const parts = renderNavParts(navItems, navCategories, theme, themeCssVars, meta.showQuoteShortcut);

        // Splice the later region first so the earlier region's indices stay valid.
        let out = html.slice(0, regions.drawerRegion[0]) + parts.drawer + html.slice(regions.drawerRegion[1]);
        out = out.slice(0, regions.navRegion[0]) + parts.nav + out.slice(regions.navRegion[1]);

        if (out === html) {
          results.unchanged.push(`${path.basename(docroot)}/${file}`);
          continue;
        }
        if (apply) await fsp.writeFile(full, out, 'utf8');
        results.changed.push(`${path.basename(docroot)}/${file}`);
      } catch (e) {
        results.failed.push({ file: `${path.basename(docroot)}/${file}`, error: e.message });
      }
    }
    // No break: getDocroots() returns several candidate paths and which one
    // is the real served tree differs per environment (locally it's the repo
    // root, on the host it's bongshaihousing.com/ while a stale public_html/
    // may also exist). liveSiteSync writes to all of them for the same
    // reason - stopping at the first match silently syncs the wrong tree.
  }

  return results;
}

module.exports = { syncNavToStaticFiles, locateNavRegions };
