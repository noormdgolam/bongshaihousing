const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

const viewsDir = path.join(__dirname, '..', 'views');
const env = nunjucks.configure(viewsDir, { autoescape: true });

async function runTests() {
  console.log('=== 1. TESTING SINGLE AI ASSISTANT IN TEMPLATES & SCRIPTS ===');

  // 1. Check layout template includes the modern AI Assistant widget
  const pageHtml = env.render('pages/index.njk', {
    theme: { name: 'Bongshai Royal', archetype: 'catalog-first' },
    activeTheme: { name: 'Bongshai Royal', archetype: 'catalog-first' },
    featuredProducts: [],
    recentProjects: [],
    testimonials: [],
  });

  if (!pageHtml.includes('id="bhAiChatWidget"') || !pageHtml.includes('bh-ai-toggle-btn')) {
    console.error('FAIL: Modern AI assistant missing from page');
    process.exit(1);
  }
  console.log('PASS: Modern AI Sales Assistant (bhAiChatWidget) included in template');

  // 2. Check global-upgrades.js contains guard to skip legacy chatbot
  const scriptContent = fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'global-upgrades.js'), 'utf8');
  if (!scriptContent.includes('document.getElementById(\'bhAiChatWidget\')')) {
    console.error('FAIL: global-upgrades.js does not guard against duplicate assistant');
    process.exit(1);
  }
  console.log('PASS: global-upgrades.js contains bhAiChatWidget collision guard');

  // 3. Check minified bundle has the guard
  const minScriptContent = fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'global-upgrades.min.js'), 'utf8');
  if (!minScriptContent.includes('bhAiChatWidget')) {
    console.error('FAIL: global-upgrades.min.js does not contain bhAiChatWidget collision guard');
    process.exit(1);
  }
  console.log('PASS: global-upgrades.min.js bundle compiled with collision guard');

  console.log('\n=== ALL SINGLE ASSISTANT CHECKS PASSED CLEANLY! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
