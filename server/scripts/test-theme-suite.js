const path = require('path');
const nunjucks = require('nunjucks');
const { PRESETS, DEFAULT_THEME, ARCHETYPES, isThemeDark, generateCssVariables } = require('../lib/theme');

const viewsDir = path.join(__dirname, '..', 'views');
const env = nunjucks.configure(viewsDir, { autoescape: true });

env.addFilter('initials', (name) => {
  if (!name) return '';
  const words = String(name).trim().split(/\s+/);
  const first = words[0] ? words[0][0] : '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
});

console.log('=== 1. TESTING STRUCTURAL ARCHETYPES & PRESETS METADATA ===');

const expectedArchetypes = ['catalog-first', 'trust-first', 'story-process', 'broken-grid', 'stats-minimal', 'mobile-priority'];

for (const key of expectedArchetypes) {
  if (!ARCHETYPES[key]) {
    console.error(`FAIL: Missing archetype definition for "${key}"`);
    process.exit(1);
  }
  console.log(`PASS: Archetype "${key}" defined -> ${ARCHETYPES[key].name}`);
}

const presetKeys = Object.keys(PRESETS);
if (presetKeys.length !== 24) {
  console.error(`FAIL: Expected 24 presets, got ${presetKeys.length}`);
  process.exit(1);
}
console.log(`PASS: Verified exactly 24 presets in PRESETS catalogue`);

for (const [slug, p] of Object.entries(PRESETS)) {
  if (!p.archetype || !ARCHETYPES[p.archetype]) {
    console.error(`FAIL: Preset "${slug}" has invalid archetype "${p.archetype}"`);
    process.exit(1);
  }
}
console.log(`PASS: All 24 presets have valid structural archetype bindings`);

console.log('\n=== 2. TESTING WORDPRESS-STYLE THEMES DIRECTORY ===');

const themesHtml = env.render('admin/themes/index.njk', {
  adminName: 'Noor Md Golam',
  adminRole: 'superadmin',
  currentTheme: {
    ...DEFAULT_THEME,
    name: 'Slate Midnight',
    archetype: 'stats-minimal',
    is_dark: true,
  },
  presets: PRESETS,
  activated: true,
  activatedThemeName: 'Slate Midnight',
});

const themeDirectoryChecks = [
  { test: themesHtml.includes('Themes') && themesHtml.includes('btn-wp-add'), name: 'WordPress Themes Header & Add Button' },
  { test: themesHtml.includes('Active: Slate Midnight'), name: 'Active Theme Blue Label' },
  { test: themesHtml.includes('wp-btn-customize'), name: 'Customize Button in Active Footer' },
  { test: themesHtml.includes('wp-add-theme-card'), name: 'Add Theme Dashed Card' },
  { test: themesHtml.includes('data-filter="catalog-first"'), name: 'Catalog-First Filter Tab' },
  { test: themesHtml.includes('data-filter="trust-first"'), name: 'Trust-First Filter Tab' },
  { test: themesHtml.includes('data-filter="story-process"'), name: 'Story-Process Filter Tab' },
  { test: themesHtml.includes('data-filter="broken-grid"'), name: 'Broken-Grid Filter Tab' },
  { test: themesHtml.includes('data-filter="stats-minimal"'), name: 'Stats-Led Filter Tab' },
  { test: themesHtml.includes('action="/admin/themes/activate/'), name: 'Theme Activation Form Actions' },
];

for (const check of themeDirectoryChecks) {
  if (!check.test) {
    console.error(`FAIL: Theme directory check "${check.name}" failed`);
    process.exit(1);
  }
  console.log(`PASS: ${check.name}`);
}

console.log('\n=== 3. TESTING ELEMENTOR PRO THEME STUDIO WITH ARCHETYPE SWITCHER ===');

const studioHtml = env.render('admin/theme-editor.njk', {
  adminName: 'Noor Md Golam',
  adminRole: 'superadmin',
  theme: {
    ...DEFAULT_THEME,
    archetype: 'broken-grid',
  },
  presets: PRESETS,
  pagesList: ['/index.html', '/about.html', '/projects.html'],
  defaultTheme: DEFAULT_THEME,
});

const studioChecks = [
  { test: studioHtml.includes('Bongshai Studio'), name: 'Studio Pro Header' },
  { test: studioHtml.includes('data-mode="desktop"'), name: 'Desktop Viewport Button' },
  { test: studioHtml.includes('data-mode="mobile"'), name: 'Mobile Viewport Button' },
  { test: studioHtml.includes('id="inspectorBtn"'), name: 'Inspector Mode Button' },
  { test: studioHtml.includes('id="undoBtn"'), name: 'Undo History Button' },
  { test: studioHtml.includes('id="redoBtn"'), name: 'Redo History Button' },
  { test: studioHtml.includes('data-tab="style"'), name: 'Style Tab' },
  { test: studioHtml.includes('data-tab="typography"'), name: 'Typography Tab' },
  { test: studioHtml.includes('data-tab="layout"'), name: 'Layout Tab' },
  { test: studioHtml.includes('data-archetype="catalog-first"'), name: 'Catalog-First Card in Layout Tab' },
  { test: studioHtml.includes('data-archetype="broken-grid"'), name: 'Broken-Grid Card in Layout Tab' },
  { test: studioHtml.includes('data-archetype="stats-minimal"'), name: 'Stats-Minimal Card in Layout Tab' },
  { test: studioHtml.includes('id="themeArchetype"'), name: 'Hidden Archetype Input' },
  { test: studioHtml.includes('data-tab="components"'), name: 'Components Tab' },
  { test: studioHtml.includes('data-tab="motion"'), name: 'Motion Tab' },
  { test: studioHtml.includes('data-tab="presets"'), name: '24 Presets Tab' },
  { test: studioHtml.includes('data-tab="code"'), name: 'CSS/JS Code Tab' },
  { test: studioHtml.includes('data-tab="navigator"'), name: 'DOM Tree Navigator Tab' },
  { test: studioHtml.includes('id="previewIframe"'), name: 'Live Preview Canvas iFrame' },
];

for (const check of studioChecks) {
  if (!check.test) {
    console.error(`FAIL: Studio check "${check.name}" failed`);
    process.exit(1);
  }
  console.log(`PASS: ${check.name}`);
}

console.log('\n=== 4. TESTING LAYOUT POSTMESSAGE & INSPECTOR BRIDGE ===');

const layoutHtml = env.render('pages/about.njk', {
  site: { title: 'Bongshai Housing' },
  page: { title: 'About' },
  path: '/about.html',
  theme: {
    ...DEFAULT_THEME,
    archetype: 'broken-grid',
  },
  themeCssVars: generateCssVariables(DEFAULT_THEME),
});

const layoutChecks = [
  { test: layoutHtml.includes('data-archetype="broken-grid"'), name: 'Body data-archetype Attribute' },
  { test: layoutHtml.includes('archetype-broken-grid'), name: 'Body Archetype CSS Class' },
  { test: layoutHtml.includes('BH_SET_INSPECTOR_MODE'), name: 'Inspector Mode Toggle in Layout' },
  { test: layoutHtml.includes('BH_INSPECTOR_SELECT'), name: 'Inspector Element Selection Bridge' },
  { test: layoutHtml.includes('BH_THEME_UPDATE'), name: 'Theme Update Live Receiver' },
  { test: layoutHtml.includes('--container-max'), name: 'Container Width CSS Variable' },
];

for (const check of layoutChecks) {
  if (!check.test) {
    console.error(`FAIL: Layout check "${check.name}" failed`);
    process.exit(1);
  }
  console.log(`PASS: ${check.name}`);
}

console.log('\n=== ALL THEME SUITE TESTS PASSED CLEANLY! ===');
process.exit(0);
