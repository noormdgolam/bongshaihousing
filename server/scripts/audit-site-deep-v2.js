const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

console.log('======================================================');
console.log('   DEEP AUDIT 2: FULL SITE COMPREHENSIVE SCAN (V2)    ');
console.log('======================================================\n');

const SERVER_DIR = path.join(__dirname, '..');
const REPO_ROOT = path.join(SERVER_DIR, '..');
const VIEWS_DIR = path.join(SERVER_DIR, 'views');
const PAGES_DIR = path.join(VIEWS_DIR, 'pages');
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

const findings = {
  missingOgTags: [],
  missingCanonical: [],
  missingAeoAnswerFirst: [],
  missingFaqSchema: [],
  brokenImageVariants: [],
  brokenHrefs: [],
  duplicateIds: [],
  unhandledTemplatePlaceholders: []
};

// Check all registered pages
for (const [url, meta] of Object.entries(registry)) {
  const tmplFile = path.join(VIEWS_DIR, meta.template);
  if (!fs.existsSync(tmplFile)) {
    findings.brokenHrefs.push({ page: url, error: `Template file ${meta.template} does not exist` });
    continue;
  }

  const rawTemplate = fs.readFileSync(tmplFile, 'utf8');

  // Check for unresolved placeholders like TODO, FIXME, PLACEHOLDER, lorem ipsum, dummy text
  if (/lorem ipsum|placeholder|todo:|fixme:|dummy text/i.test(rawTemplate) && !url.includes('test')) {
    findings.unhandledTemplatePlaceholders.push({ page: url, template: meta.template });
  }

  // Render page HTML
  let html = '';
  try {
    html = env.render(meta.template, {
      site: { title: 'Bongshai Housing' },
      page: { title: meta.title },
      path: url,
      title: meta.title,
      description: meta.description,
      canonical: meta.canonical,
      ogTitle: meta.ogTitle || meta.title,
      ogDescription: meta.ogDescription || meta.description,
      ogImage: meta.ogImage,
      dbProjects: [],
      dbServiceAreas: [],
      dbFaqs: [],
      dbTestimonials: [],
      dbTeamMembers: [],
      dbCategory: null,
      theme: {},
      themeCssVars: ''
    });
  } catch (renderErr) {
    findings.brokenHrefs.push({ page: url, error: `Render failed: ${renderErr.message}` });
    continue;
  }

  // 1. Meta / OG Check
  if (!meta.canonical) findings.missingCanonical.push(url);
  if (!meta.ogTitle || !meta.ogDescription) {
    // Check if rendered HTML has them
    if (!html.includes('property="og:title"') || !html.includes('property="og:description"')) {
      findings.missingOgTags.push(url);
    }
  }

  // 2. Duplicate DOM IDs Check
  const idMatches = html.match(/\sid=["']([^"']+)["']/gi) || [];
  const idCounts = new Map();
  for (const idAttr of idMatches) {
    const id = idAttr.replace(/\sid=["']/i, '').replace(/["']$/, '');
    if (!id || id.startsWith('{{')) continue;
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }
  for (const [id, count] of idCounts.entries()) {
    // Ignore common SVG/mask IDs or known repeater template IDs if scoped
    if (count > 1 && !id.startsWith('clip') && !id.startsWith('mask') && !id.startsWith('gradient')) {
      findings.duplicateIds.push({ page: url, id, count });
    }
  }

  // 3. AEO Answer-First Check (Core landing pages)
  const isCoreLanding = ['/index.html', '/about.html', '/contact.html', '/faq.html', '/solutions.html', '/products-and-solutions.html', '/service-areas.html', '/apartment-building.html', '/concrete-building.html', '/container-house.html', '/cottage-house.html', '/duplex-steel-building.html', '/industrial-sheds.html', '/luxury-villa.html', '/simplex-steel-building.html', '/steel-house.html', '/tiny-house.html', '/wooden-house.html', '/worker-accommodation.html'].includes(url);
  if (isCoreLanding) {
    if (!html.includes('AEO:') && !html.includes('Answer-First') && !html.includes('<strong>Bongshai Housing')) {
      findings.missingAeoAnswerFirst.push(url);
    }
  }

  // 4. Broken Image srcset / src check
  const imgTags = html.match(/<img[^>]+>/gi) || [];
  for (const imgTag of imgTags) {
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      const src = srcMatch[1];
      if (!src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('//') && !src.includes('{')) {
        const cleanSrc = src.split('?')[0].split('#')[0];
        const filePath = path.join(REPO_ROOT, cleanSrc.startsWith('/') ? cleanSrc.slice(1) : cleanSrc);
        if (!fs.existsSync(filePath)) {
          findings.brokenImageVariants.push({ page: url, image: src, expectedPath: filePath });
        }
      }
    }

    const srcsetMatch = imgTag.match(/srcset=["']([^"']+)["']/i);
    if (srcsetMatch) {
      const srcset = srcsetMatch[1];
      const items = srcset.split(',');
      for (const item of items) {
        const part = item.trim().split(/\s+/)[0];
        if (part && !part.startsWith('http') && !part.startsWith('data:') && !part.includes('{')) {
          const cleanPart = part.split('?')[0].split('#')[0];
          const filePath = path.join(REPO_ROOT, cleanPart.startsWith('/') ? cleanPart.slice(1) : cleanPart);
          if (!fs.existsSync(filePath)) {
            findings.brokenImageVariants.push({ page: url, srcsetPart: part, expectedPath: filePath });
          }
        }
      }
    }
  }
}

console.log('======================================================');
console.log('                 SCAN V2 RESULTS                      ');
console.log('======================================================');

console.log(`\n1. Broken Image Variants / Paths: ${findings.brokenImageVariants.length}`);
const uniqueBrokenImgs = new Set();
findings.brokenImageVariants.forEach(b => {
  const k = b.image || b.srcsetPart;
  if (!uniqueBrokenImgs.has(k)) {
    uniqueBrokenImgs.add(k);
    console.log(`   - Missing image: ${k} (Page: ${b.page})`);
  }
});

console.log(`\n2. Duplicate DOM IDs: ${findings.duplicateIds.length}`);
findings.duplicateIds.slice(0, 10).forEach(d => {
  console.log(`   - [${d.page}] ID "#${d.id}" appears ${d.count} times`);
});
if (findings.duplicateIds.length > 10) {
  console.log(`   ... and ${findings.duplicateIds.length - 10} more duplicate ID occurrences.`);
}

console.log(`\n3. Missing OpenGraph Meta Tags: ${findings.missingOgTags.length}`);
findings.missingOgTags.forEach(p => console.log(`   - ${p}`));

console.log(`\n4. Missing Canonical URLs: ${findings.missingCanonical.length}`);
findings.missingCanonical.forEach(p => console.log(`   - ${p}`));

console.log(`\n5. Unhandled Placeholders in Templates: ${findings.unhandledTemplatePlaceholders.length}`);
findings.unhandledTemplatePlaceholders.forEach(p => console.log(`   - [${p.page}] ${p.template}`));

fs.writeFileSync(path.join(SERVER_DIR, 'audit-v2-results.json'), JSON.stringify(findings, null, 2));
console.log('\nDetailed results saved to server/audit-v2-results.json');
process.exit(0);
