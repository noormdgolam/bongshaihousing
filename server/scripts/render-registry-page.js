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
