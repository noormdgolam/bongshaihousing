const nunjucks = require('nunjucks');
const path = require('path');
const fs = require('fs');

const viewsDir = path.join(__dirname, '..', 'views');
const env = nunjucks.configure(viewsDir, { autoescape: true });

// Test 1: Static fallback render
const staticHtml = env.render('pages/faq.njk', {
  site: { title: 'Bongshai Housing' },
  page: { title: 'FAQ' },
  path: '/faq.html',
});

if (!staticHtml.includes('Frequently Asked Questions') || !staticHtml.includes('What is Bongshai Housing?')) {
  console.error('FAIL: Static fallback render failed');
  process.exit(1);
}
console.log('PASS: Static fallback render verified');

// Test 2: Dynamic DB render
const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db', 'seeds', 'data', 'faqs.json'), 'utf8'));
const groupMap = new Map();
for (const f of rawData) {
  const cat = f.category || 'General';
  if (!groupMap.has(cat)) groupMap.set(cat, []);
  groupMap.get(cat).push(f);
}
const faqCategories = Array.from(groupMap.entries()).map(([name, items]) => ({
  name,
  items,
}));

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'dateModified': '2026-08-17',
  'mainEntity': rawData.map(f => ({
    '@type': 'Question',
    'name': f.question,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': f.answer.replace(/<[^>]+>/g, '').trim(),
    },
  })),
};

const dynamicHtml = env.render('pages/faq.njk', {
  site: { title: 'Bongshai Housing' },
  page: { title: 'FAQ' },
  path: '/faq.html',
  dbFaqs: rawData,
  faqCategories,
  faqJsonLd,
});

if (!dynamicHtml.includes('https://schema.org') || !dynamicHtml.includes('FAQPage') || !dynamicHtml.includes('General')) {
  console.error('FAIL: Dynamic render failed');
  process.exit(1);
}
console.log(`PASS: Dynamic render verified with ${faqCategories.length} categories and ${rawData.length} items`);

// Test 3: Admin Views
const adminListHtml = env.render('admin/faqs/list.njk', {
  faqs: rawData.map((f, idx) => ({ ...f, id: idx + 1 })),
  categories: Array.from(groupMap.keys()),
  totalCount: rawData.length,
  publishedCount: rawData.length,
  categoryFilter: 'all',
  statusFilter: 'all',
  search: '',
  adminName: 'Admin',
  adminRole: 'superadmin',
});

if (!adminListHtml.includes('FAQs Management') || !adminListHtml.includes('Add New FAQ')) {
  console.error('FAIL: Admin list view render failed');
  process.exit(1);
}
console.log('PASS: Admin list view render verified');

const adminFormHtml = env.render('admin/faqs/form.njk', {
  faq: { ...rawData[0], id: 1 },
  categories: Array.from(groupMap.keys()),
  adminName: 'Admin',
  adminRole: 'superadmin',
});

if (!adminFormHtml.includes('Question (Natural Language Query)') || !adminFormHtml.includes('Delete FAQ')) {
  console.error('FAIL: Admin form view render failed');
  process.exit(1);
}
console.log('PASS: Admin form view render verified');

console.log('ALL FAQ TESTS PASSED!');
process.exit(0);
