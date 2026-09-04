// Renders a registry-backed page to its static .html in the docroot, using the
// same Nunjucks env + locals the live app uses (theme, nav tree). Needed for
// pages whose static file must be regenerated from a template - LiteSpeed
// serves the static copy ahead of the Node route, so a template-only change is
// invisible until the .html is rebuilt.
//
//   node server/scripts/render-registry-page.js construction-cost-calculator.html [...]
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

const { getNavTree } = require('../lib/nav');
const { getThemeSettings, generateCssVariables } = require('../lib/theme');
const { formatTaka, formatTakaAscii } = require('../lib/format');

const VIEWS_DIR = path.join(__dirname, '..', 'views');
const REPO_ROOT = path.join(__dirname, '..', '..');
const registry = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'page-registry.json'), 'utf8'));

const env = nunjucks.configure(VIEWS_DIR, { autoescape: true, noCache: true });
env.addGlobal('currentYear', new Date().getFullYear());
env.addFilter('initials', (name) => {
  if (!name) return '';
  const w = String(name).trim().split(/\s+/);
  return ((w[0] ? w[0][0] : '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
});
env.addFilter('date', (v) => {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
});
env.addFilter('taka', (v) => (v === null || v === undefined || v === '' ? 'N/A' : formatTaka(Number(v))));
env.addFilter('formatTaka', (v) => (v === null || v === undefined || v === '' ? '' : formatTaka(Number(v))));
env.addFilter('formatTakaAscii', (v) => (v === null || v === undefined || v === '' ? '' : formatTakaAscii(Number(v))));

(async () => {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Usage: node server/scripts/render-registry-page.js <file.html> [...]');
    process.exit(1);
  }

  let theme = {}, themeCssVars = '';
  try {
    theme = await getThemeSettings();
    themeCssVars = generateCssVariables(theme);
  } catch (e) { /* fall through with defaults */ }

  let navItems = [], navCategories = [];
  try { ({ navItems, navCategories } = await getNavTree()); } catch (e) { /* empty nav is still better than a crash */ }

  // The nav gets baked into the output, so rendering against the wrong database
  // silently ships a wrong menu. That has happened: the remote MySQL this script
  // reaches with DB_HOST=bongshaihousing.com is NOT the database production runs
  // on - it is a parallel copy, and it carried a "Low-Cost Villa" category
  // production has never had plus a Low Cost House row with an empty
  // landing_page_slug (whose card fell back to a 404). Both went live.
  //
  // So compare this database's categories against production's actual rendered
  // nav before writing anything, and refuse on a mismatch. --skip-nav-check is
  // the escape hatch for deliberate divergence or when offline.
  if (!process.argv.includes('--skip-nav-check')) {
    const live = await fetch('https://bongshaihousing.com/index.html', { redirect: 'follow' })
      .then((r) => r.text())
      .catch((e) => { console.warn(`[warn] could not fetch production nav (${e.message}); rendering unverified`); return null; });

    if (live) {
      // href and class appear in either order in the rendered markup, so match
      // the whole tag first and pull the href out of it.
      const liveSlugs = [...live.matchAll(/<a\b[^>]*class="mega-card"[^>]*>/g)]
        .map((m) => (m[0].match(/href="([^"]+)"/) || [])[1])
        .filter(Boolean);
      const mineSlugs = navCategories.map((c) => String(c.landing_page_slug || c.slug || '').replace(/^\//, ''));
      const missing = liveSlugs.filter((s) => !mineSlugs.includes(s));
      const extra = mineSlugs.filter((s) => !liveSlugs.includes(s));
      if (missing.length || extra.length) {
        console.error('\nAborting: this database does not match production.');
        console.error(`  production nav has ${liveSlugs.length} categories, this DB has ${mineSlugs.length}`);
        if (extra.length) console.error(`  in this DB but not production: ${extra.join(', ')}`);
        if (missing.length) console.error(`  in production but not this DB: ${missing.join(', ')}`);
        console.error('\nRendering would bake the wrong menu into every page written.');
        console.error('Fix the database, or pass --skip-nav-check and run the admin');
        console.error('Nav Menu -> Sync Nav to Live Site afterwards to repair the output.\n');
        process.exit(1);
      }
      console.log(`[nav] verified against production (${liveSlugs.length} categories)`);
    }
  }

  for (const file of files) {
    const meta = registry['/' + file];
    if (!meta || !meta.template) { console.error(`[skip] ${file}: no registry entry or template`); continue; }
    const html = env.render(meta.template, { ...meta, theme, themeCssVars, navItems, navCategories });
    const out = path.join(REPO_ROOT, file);
    fs.writeFileSync(out, html, 'utf8');
    console.log(`[ok] ${file} -> ${html.length} bytes`);
  }
  process.exit(0);
})().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
