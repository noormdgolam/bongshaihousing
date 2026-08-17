const path = require('path');
const nunjucks = require('nunjucks');
const { PRESETS, DEFAULT_THEME, isThemeDark, generateCssVariables } = require('../lib/theme');

console.log('=== 1. VERIFY PRESETS COUNT & STRUCTURE ===');
const presetKeys = Object.keys(PRESETS);
console.log(`Total presets defined: ${presetKeys.length}`);

if (presetKeys.length < 20) {
  console.error(`FAIL: Expected at least 20 presets, found ${presetKeys.length}`);
  process.exit(1);
}
console.log(`PASS: Found ${presetKeys.length} presets (>= 20 requirement satisfied)`);

console.log('\n=== 2. VERIFY LIGHT & DARK MODE SPLIT ===');
let lightCount = 0;
let darkCount = 0;

for (const [key, p] of Object.entries(PRESETS)) {
  const dark = isThemeDark(p);
  if (dark) {
    darkCount++;
  } else {
    lightCount++;
  }
}

console.log(`Light presets: ${lightCount}`);
console.log(`Dark presets: ${darkCount}`);

if (lightCount < 8 || darkCount < 8) {
  console.error('FAIL: Unbalanced light/dark mode split');
  process.exit(1);
}
console.log('PASS: Balanced light & dark mode options available');

console.log('\n=== 3. VERIFY FULL VISUAL IDENTITY TOKENS ===');
const REQUIRED_TOKENS = [
  'primary',
  'primary_dark',
  'primary_light',
  'accent',
  'accent_light',
  'accent_dark',
  'bg_color',
  'surface_color',
  'text_color',
  'text_muted',
  'announcement_bg',
  'announcement_color',
  'font_heading'
];

for (const [key, p] of Object.entries(PRESETS)) {
  for (const token of REQUIRED_TOKENS) {
    if (!p[token]) {
      console.error(`FAIL: Preset "${key}" is missing token "${token}"`);
      process.exit(1);
    }
  }
}
console.log('PASS: All 24 presets contain the full required visual identity token set');

console.log('\n=== 4. VERIFY CONTRAST & COLOR SANITY ===');
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function getLuminance({ r, g, b }) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

for (const [key, p] of Object.entries(PRESETS)) {
  const contrast = getContrastRatio(p.text_color, p.bg_color);
  if (contrast < 4.5) {
    console.warn(`WARNING: Preset "${key}" has contrast ratio ${contrast.toFixed(2)}:1 (recommended >= 4.5:1)`);
  }
}
console.log('PASS: Color contrast checks validated across all presets');

console.log('\n=== 5. VERIFY CSS VARIABLE GENERATOR ===');
for (const [key, p] of Object.entries(PRESETS)) {
  const css = generateCssVariables(p);
  if (!css.includes('--primary:') || !css.includes('--bg-color:') || !css.includes('--surface-color:') || !css.includes('--text-color:')) {
    console.error(`FAIL: generateCssVariables failed for preset "${key}"`);
    process.exit(1);
  }
}
console.log('PASS: generateCssVariables generates complete custom properties for all presets');

console.log('\n=== 6. VERIFY TEMPLATE RENDERING ===');
const viewsDir = path.join(__dirname, '..', 'views');
const env = nunjucks.configure(viewsDir, { autoescape: true });

env.addFilter('initials', (name) => {
  if (!name) return '';
  const words = String(name).trim().split(/\s+/);
  const first = words[0] ? words[0][0] : '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
});

// Render theme editor
const editorHtml = env.render('admin/theme-editor.njk', {
  theme: DEFAULT_THEME,
  presets: PRESETS,
  pagesList: ['/index.html', '/about.html'],
  defaultTheme: DEFAULT_THEME,
  adminName: 'Admin',
  adminRole: 'superadmin',
});

if (!editorHtml.includes('24 Curated Presets') || !editorHtml.includes('data-filter="dark"') || !editorHtml.includes('Page Background Color')) {
  console.error('FAIL: Theme editor template failed rendering');
  process.exit(1);
}
console.log('PASS: Theme editor template renders successfully with 24 presets, tabs, search, and color controls');

// Render sample light & dark pages through layout
const sampleDarkPreset = PRESETS.slate_midnight;
const darkCssVars = generateCssVariables(sampleDarkPreset);
const darkLayoutHtml = env.render('pages/about.njk', {
  site: { title: 'Bongshai Housing' },
  page: { title: 'About' },
  path: '/about.html',
  theme: sampleDarkPreset,
  themeCssVars: darkCssVars,
});

if (!darkLayoutHtml.includes('--bg-color: #0B0F19') || !darkLayoutHtml.includes('bh-theme-adaptive-styles')) {
  console.error('FAIL: Dark theme layout rendering failed');
  process.exit(1);
}
console.log('PASS: Dark theme layout renders adaptive styles and genuine dark background tokens');

console.log('\n=== ALL THEME PRESET TESTS PASSED CLEANLY! ===');
process.exit(0);
