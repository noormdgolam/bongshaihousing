const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

console.log('====================================================');
console.log('   AUDITING HTML STRUCTURE & LINKS ON EVERY PAGE    ');
console.log('====================================================\n');

const SERVER_DIR = path.join(__dirname, '..');
const REPO_ROOT = path.join(SERVER_DIR, '..');
const VIEWS_DIR = path.join(SERVER_DIR, 'views');
const REGISTRY_PATH = path.join(SERVER_DIR, 'page-registry.json');
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

const env = nunjucks.configure(VIEWS_DIR, { autoescape: true, noCache: true });
env.addFilter('initials', (name) => {
  if (!name) return '';
  const words = String(name).trim().split(/\s+/);
  const first = words[0] ? words[0][0] : '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
});
env.addFilter('date', (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
});
env.addGlobal('currentYear', new Date().getFullYear());

const knownRoutes = new Set([
  '/', '/index.html', '/about.html', '/contact.html', '/faq.html', '/gallery.html',
  '/projects.html', '/solutions.html', '/products-and-solutions.html', '/service-areas.html',
  '/privacy-policy.html', '/terms.html', '/interactive-tools.html', '/certifications.html',
  '/iso-9001-certification.html', '/material-testing-certification.html', '/ohsas-safety-certification.html',
  '/steel-vs-concrete-comparison.html', '/multi-story-homes.html', '/other-residential.html',
  '/agent/signup.html', '/agent/login.html', '/agent/dashboard.html',
  '/my-project', '/my-project/login.html',
  '/admin', '/admin/login', '/admin/leads', '/admin/orders', '/admin/agents',
  ...Object.keys(registry)
]);

// Add product routes and district routes
const pagesDir = path.join(VIEWS_DIR, 'pages');
const allPageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.njk'));
for (const pf of allPageFiles) {
  knownRoutes.add('/' + pf.replace('.njk', '.html'));
  knownRoutes.add(pf.replace('.njk', '.html'));
}

const errors = [];
const linkErrors = [];
const unclosedTagErrors = [];

for (const [url, meta] of Object.entries(registry)) {
  try {
    const html = env.render(meta.template, {
      site: { title: 'Bongshai Housing' },
      page: { title: meta.title },
      path: url,
      title: meta.title,
      description: meta.description,
      canonical: meta.canonical,
      dbProjects: [],
      dbServiceAreas: [],
      dbFaqs: [],
      dbTestimonials: [],
      dbTeamMembers: [],
      dbCategory: null,
      theme: {},
      themeCssVars: ''
    });

    // 1. Tag balance check for key structural tags
    const tagsToCheck = ['main', 'section', 'article', 'nav', 'header', 'footer', 'style', 'script', 'form', 'table'];
    for (const tag of tagsToCheck) {
      const openMatches = html.match(new RegExp(`<${tag}(\\s+[^>]*)?>`, 'gi')) || [];
      const closeMatches = html.match(new RegExp(`</${tag}>`, 'gi')) || [];
      if (openMatches.length !== closeMatches.length) {
        unclosedTagErrors.push({
          page: url,
          template: meta.template,
          tag,
          open: openMatches.length,
          closed: closeMatches.length
        });
      }
    }

    // 2. Check internal anchor links
    const linkRegex = /href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1].trim();
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//') || href.startsWith('data:')) {
        continue;
      }
      // Remove query/hash
      const cleanHref = href.split('?')[0].split('#')[0];
      if (!cleanHref) continue;

      const normalizedHref = cleanHref.startsWith('/') ? cleanHref : '/' + cleanHref;

      if (!knownRoutes.has(cleanHref) && !knownRoutes.has(normalizedHref)) {
        // Check if file exists in repo root (e.g. css, js, images, pdf, sitemap.xml)
        const localFilePath = path.join(REPO_ROOT, cleanHref.startsWith('/') ? cleanHref.slice(1) : cleanHref);
        if (!fs.existsSync(localFilePath)) {
          linkErrors.push({
            page: url,
            template: meta.template,
            href,
            cleanHref
          });
        }
      }
    }
  } catch (err) {
    errors.push({ page: url, template: meta.template, error: err.message });
  }
}

console.log(`Render errors: ${errors.length}`);
errors.forEach(e => console.log(` - [${e.page}]: ${e.error}`));

console.log(`\nUnclosed Tag Mismatches: ${unclosedTagErrors.length}`);
unclosedTagErrors.forEach(e => console.log(` - [${e.page}] <${e.tag}> opened ${e.open} times but closed ${e.closed} times`));

console.log(`\nBroken Internal Links: ${linkErrors.length}`);
const uniqueBrokenLinks = new Map();
linkErrors.forEach(e => {
  const key = `${e.href}`;
  if (!uniqueBrokenLinks.has(key)) uniqueBrokenLinks.set(key, []);
  uniqueBrokenLinks.get(key).push(e.page);
});
for (const [link, pages] of uniqueBrokenLinks.entries()) {
  console.log(` - Broken link "${link}" found on ${pages.length} page(s): e.g. ${pages.slice(0, 3).join(', ')}`);
}

fs.writeFileSync(path.join(SERVER_DIR, 'html-audit-results.json'), JSON.stringify({ errors, unclosedTagErrors, linkErrors }, null, 2));
console.log('\nResults saved to server/html-audit-results.json');
process.exit(0);
