const path = require('path');
const nunjucks = require('nunjucks');
const { PRESETS, DEFAULT_THEME, isThemeDark, generateCssVariables } = require('../lib/theme');

const viewsDir = path.join(__dirname, '..', 'views');
const env = nunjucks.configure(viewsDir, { autoescape: true });

env.addFilter('initials', (name) => {
  if (!name) return '';
  const words = String(name).trim().split(/\s+/);
  const first = words[0] ? words[0][0] : '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
});

console.log('=== 1. TESTING WORDPRESS-STYLE THEMES DIRECTORY ===');

const themesHtml = env.render('admin/themes/index.njk', {
  adminName: 'Noor Md Golam',
  adminRole: 'superadmin',
  currentTheme: {
    ...DEFAULT_THEME,
    name: 'Slate Midnight',
    is_dark: true,
  },
  presets: PRESETS,
  activated: true,
  activatedThemeName: 'Slate Midnight',
});

const themeDirectoryChecks = [
  { test: themesHtml.includes('Themes Directory'), name: 'Themes Directory Title' },
  { test: themesHtml.includes('ACTIVE THEME'), name: 'Active Theme Spotlight' },
  { test: themesHtml.includes('Slate Midnight'), name: 'Active Theme Name' },
  { test: themesHtml.includes('Customize in Elementor Studio Pro'), name: 'Elementor Pro Jump Button' },
  { test: themesHtml.includes('data-filter="industrial"'), name: 'Industrial Category Tab' },
  { test: themesHtml.includes('data-filter="residential"'), name: 'Residential Category Tab' },
  { test: themesHtml.includes('data-filter="hightech"'), name: 'High-Tech Category Tab' },
  { test: themesHtml.includes('action="/admin/themes/activate/'), name: 'Theme Activation Form Actions' },
];

for (const check of themeDirectoryChecks) {
  if (!check.test) {
    console.error(`FAIL: Theme directory check "${check.name}" failed`);
    process.exit(1);
  }
  console.log(`PASS: ${check.name}`);
}

console.log('\n=== 2. TESTING ELEMENTOR PRO THEME STUDIO ===');

const studioHtml = env.render('admin/theme-editor.njk', {
  adminName: 'Noor Md Golam',
  adminRole: 'superadmin',
  theme: DEFAULT_THEME,
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

console.log('\n=== 3. TESTING LAYOUT POSTMESSAGE & INSPECTOR BRIDGE ===');

const layoutHtml = env.render('pages/about.njk', {
  site: { title: 'Bongshai Housing' },
  page: { title: 'About' },
  path: '/about.html',
  theme: DEFAULT_THEME,
  themeCssVars: generateCssVariables(DEFAULT_THEME),
});

const layoutChecks = [
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
