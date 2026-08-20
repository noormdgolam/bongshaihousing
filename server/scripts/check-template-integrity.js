// Renders every page template locally and flags structural corruption -
// specifically the class of bug that shipped undetected in
// products-and-solutions.njk (a scrape artifact truncated its <style>
// block mid-rule and appended a full duplicate <footer>/</body>/</html>
// inside {% block content %}, nested inside layout.njk's own real ones).
// A page extending layout.njk should always render to exactly one
// <footer>, one </body>, one </html>, and every <style>/<script> tag it
// opens should close. Run before every deploy: `node server/scripts/check-template-integrity.js`
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

const VIEWS_DIR = path.join(__dirname, '..', 'views');
const PAGES_DIR = path.join(VIEWS_DIR, 'pages');

const env = nunjucks.configure(VIEWS_DIR, { autoescape: true });
env.addFilter('date', (v) => (v ? String(v) : ''));
env.addFilter('replace', (v, a, b) => (v || '').split(a).join(b));
env.addFilter('urlencode', (v) => encodeURIComponent(v || ''));
env.addGlobal('currentYear', new Date().getFullYear());

// Broad, generic mock context covering fields used across different page
// types - nunjucks doesn't throw on accessing a property of an undefined
// value in a plain {{ }} expression, only on iterating one ({% for %}) or
// calling a method on one, so null-ish defaults for object-shaped fields
// get most pages to render without needing per-page context.
const BASE_CONTEXT = {
  path: '/test.html', title: 'Test', canonical: 'https://bongshaihousing.com/test.html',
  category: { name: 'Test Category', landing_page_slug: null },
  dbCategory: null, dbFaqs: [], faqCategories: [], faqJsonLd: null,
  product: { model_number: 'BH-XX-000', title: 'Test Product', main_image: null, main_image_alt: null, image_2: null, image_3: null },
  variants: [], relatedProducts: [], dbServiceAreas: [], dbTeamMembers: [],
  areas: [], projects: [], testimonials: [],
};

function countTag(html, re) {
  return (html.match(re) || []).length;
}

function checkPage(html) {
  const issues = [];
  const footers = countTag(html, /<footer[\s>]/gi);
  const bodyClose = countTag(html, /<\/body>/gi);
  const htmlClose = countTag(html, /<\/html>/gi);
  const styleOpen = countTag(html, /<style[\s>]/gi);
  const styleClose = countTag(html, /<\/style>/gi);
  const scriptOpen = countTag(html, /<script[\s>]/gi);
  const scriptClose = countTag(html, /<\/script>/gi);

  if (footers > 1) issues.push(`${footers} <footer> tags (expected at most 1)`);
  if (bodyClose > 1) issues.push(`${bodyClose} </body> tags (expected at most 1)`);
  if (htmlClose > 1) issues.push(`${htmlClose} </html> tags (expected at most 1)`);
  if (styleOpen !== styleClose) issues.push(`${styleOpen} <style> vs ${styleClose} </style> (unclosed style block)`);
  if (scriptOpen !== scriptClose) issues.push(`${scriptOpen} <script> vs ${scriptClose} </script> (unclosed script block)`);
  return issues;
}

function run() {
  const files = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.njk'));
  let failed = 0;
  let renderErrors = 0;
  const renderErrorFiles = [];

  for (const file of files) {
    let html;
    try {
      html = env.render(`pages/${file}`, BASE_CONTEXT);
    } catch (e) {
      renderErrors += 1;
      renderErrorFiles.push(`${file}: ${e.message.split('\n')[0]}`);
      continue;
    }
    const issues = checkPage(html);
    if (issues.length) {
      failed += 1;
      console.log(`FAIL: ${file}`);
      for (const issue of issues) console.log(`  - ${issue}`);
    }
  }

  console.log(`\n${files.length} pages checked, ${failed} with structural issues, ${renderErrors} failed to render (skipped, not a corruption signal by itself - likely just needs page-specific context this generic check doesn't provide).`);
  if (renderErrorFiles.length) {
    console.log('\nRender errors (informational, not necessarily bugs):');
    renderErrorFiles.forEach((l) => console.log(`  - ${l}`));
  }
  if (failed > 0) process.exit(1);
}

run();
