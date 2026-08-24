const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

console.log('====================================================');
console.log('   BONGSHAI HOUSING - COMPREHENSIVE SITE AUDIT     ');
console.log('====================================================\n');

const SERVER_DIR = path.join(__dirname, '..');
const REPO_ROOT = path.join(SERVER_DIR, '..');
const VIEWS_DIR = path.join(SERVER_DIR, 'views');
const PAGES_DIR = path.join(VIEWS_DIR, 'pages');
const REGISTRY_PATH = path.join(SERVER_DIR, 'page-registry.json');
const REDIRECTS_PATH = path.join(SERVER_DIR, 'redirects.json');

const findings = {
  templateErrors: [],
  registryErrors: [],
  brokenAssets: [],
  brokenLinks: [],
  jsonLdErrors: [],
  csrfErrors: [],
  routeWarnings: [],
  jsErrors: [],
  warnings: []
};

// Setup Nunjucks Environment with all custom filters & globals
const env = nunjucks.configure(VIEWS_DIR, {
  autoescape: true,
  noCache: true
});

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
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
});

env.addGlobal('currentYear', new Date().getFullYear());

// Helper to recursively get files
function getAllFiles(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, ext));
    } else if (!ext || file.endsWith(ext)) {
      results.push(filePath);
    }
  }
  return results;
}

// ----------------------------------------------------
// 1. AUDIT ALL NUNJUCKS TEMPLATES (ALL PAGES + ADMIN + AGENT + CUSTOMER)
// ----------------------------------------------------
console.log('>>> [1/7] Testing ALL Nunjucks templates for compilation and rendering...');
const allTemplates = getAllFiles(VIEWS_DIR, '.njk');
console.log(`Found ${allTemplates.length} .njk templates to audit.`);

const mockContext = {
  site: { title: 'Bongshai Housing' },
  page: { title: 'Test Page' },
  path: '/test.html',
  title: 'Test Title',
  description: 'Test description for Bongshai Housing steel building',
  canonical: 'https://bongshaihousing.com/test.html',
  csrfToken: 'test-csrf-token-12345',
  adminName: 'Super Admin',
  adminRole: 'superadmin',
  adminEmail: 'admin@bongshaihousing.com',
  agent: { id: 1, full_name: 'Agent Name', agent_code: 'AGT001', email: 'agent@test.com', status: 'approved', company_name: 'Test Co' },
  customer: { id: 1, full_name: 'Customer Name', email: 'customer@test.com', phone: '01700000000' },
  order: { id: 1, order_number: 'ORD-2026-001', project_title: 'Duplex Villa', status: 'in_progress', total_amount: 5000000, current_phase: 'Fabrication' },
  orders: [],
  milestones: [],
  documents: [],
  leads: [],
  lead: { id: 1, name: 'Lead Name', email: 'lead@test.com', phone: '01711111111', project_type: 'duplex', created_at: new Date() },
  products: [],
  product: { id: 1, slug: 'bh-sb-301', title: 'BH-SB 301', description: 'Test Product', category_id: 1, base_price_bdt: 1500, price_sqft_min: 1500, price_sqft_max: 2200 },
  categories: [],
  category: { id: 1, name: 'Simplex Steel Building', slug: 'simplex-steel-building', landing_page_slug: 'simplex-steel-building.html' },
  projects: [],
  project: { id: 1, title: 'Project Kokomo', slug: 'project-kokomo-sunset-resort', location: 'Dhaka', status_label: 'Completed' },
  faqs: [],
  faqCategories: [],
  faqJsonLd: null,
  dbFaqs: [],
  dbProjects: [],
  dbServiceAreas: [],
  dbTeamMembers: [],
  dbTestimonials: [],
  dbCategory: null,
  theme: {},
  themeCssVars: ':root { --primary-color: #0d6efd; }',
  stats: { totalLeads: 10, totalOrders: 5, totalRevenue: 1000000, activeProjects: 3 },
  members: [],
  member: { id: 1, name: 'SMA AWAL', designation: 'Chief Engineer', department: 'engineering' },
  departments: [{ slug: 'engineering', label: 'Engineering' }],
  pagination: { page: 1, totalPages: 1, total: 10, limit: 10 },
  invitations: [],
  invitation: { id: 1, token: 'abc-123', email: 'invite@test.com', status: 'pending' },
  visitors: [],
  visitor: {},
  settings: {},
  messages: { success: [], error: [], info: [] }
};

let templateSuccessCount = 0;
for (const tmplPath of allTemplates) {
  const relativeTmpl = path.relative(VIEWS_DIR, tmplPath).replace(/\\/g, '/');
  try {
    const rendered = env.render(relativeTmpl, mockContext);
    templateSuccessCount++;
    if (!rendered || rendered.trim().length === 0) {
      findings.templateErrors.push({
        template: relativeTmpl,
        error: 'Rendered empty content'
      });
    }
  } catch (err) {
    findings.templateErrors.push({
      template: relativeTmpl,
      error: err.message,
      stack: err.stack
    });
  }
}
console.log(`Rendered ${templateSuccessCount}/${allTemplates.length} templates successfully.`);

// ----------------------------------------------------
// 2. AUDIT PAGE REGISTRY
// ----------------------------------------------------
console.log('\n>>> [2/7] Auditing page-registry.json...');
if (!fs.existsSync(REGISTRY_PATH)) {
  findings.registryErrors.push('page-registry.json does NOT exist!');
} else {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const registryKeys = Object.keys(registry);
  console.log(`Registry contains ${registryKeys.length} registered URLs.`);

  for (const [url, meta] of Object.entries(registry)) {
    if (!meta.template) {
      findings.registryErrors.push({ url, error: 'Missing template property' });
      continue;
    }
    const templateFullPath = path.join(VIEWS_DIR, meta.template);
    if (!fs.existsSync(templateFullPath)) {
      findings.registryErrors.push({ url, template: meta.template, error: 'Referenced template file does not exist' });
    }
    if (!meta.title) {
      findings.registryErrors.push({ url, error: 'Missing title tag in registry' });
    }
    if (!meta.canonical) {
      findings.registryErrors.push({ url, error: 'Missing canonical URL in registry' });
    }
  }
}

// ----------------------------------------------------
// 3. AUDIT ASSETS & LINKS (IMAGES, CSS, JS, ANCHORS)
// ----------------------------------------------------
console.log('\n>>> [3/7] Auditing internal assets & links referenced across all pages...');
const assetRegex = /(?:src|href)=["']([^"']+)["']/gi;
const imageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
const cssRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;

const checkedAssets = new Set();
const checkedLinks = new Set();

for (const tmplPath of allTemplates) {
  const relativeTmpl = path.relative(VIEWS_DIR, tmplPath).replace(/\\/g, '/');
  // Only check public pages and layout
  if (!relativeTmpl.startsWith('pages/') && relativeTmpl !== 'layout.njk') continue;

  try {
    const rendered = env.render(relativeTmpl, mockContext);

    // Check images
    let match;
    const imgMatcher = /<img[^>]+src=["']([^"']+)["']/gi;
    while ((match = imgMatcher.exec(rendered)) !== null) {
      let src = match[1];
      if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) continue;
      if (src.startsWith('{{') || src.includes('{')) continue; // template variables

      const cleanSrc = src.split('?')[0].split('#')[0];
      if (checkedAssets.has(cleanSrc)) continue;
      checkedAssets.add(cleanSrc);

      const localPath = path.join(REPO_ROOT, cleanSrc.startsWith('/') ? cleanSrc.slice(1) : cleanSrc);
      if (!fs.existsSync(localPath)) {
        findings.brokenAssets.push({
          template: relativeTmpl,
          src,
          expectedPath: localPath
        });
      }
    }

    // Check CSS stylesheets
    const cssMatcher = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/gi;
    while ((match = cssMatcher.exec(rendered)) !== null) {
      let href = match[1];
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) continue;
      if (href.startsWith('{{') || href.includes('{')) continue;

      const cleanHref = href.split('?')[0].split('#')[0];
      if (checkedAssets.has(cleanHref)) continue;
      checkedAssets.add(cleanHref);

      const localPath = path.join(REPO_ROOT, cleanHref.startsWith('/') ? cleanHref.slice(1) : cleanHref);
      if (!fs.existsSync(localPath)) {
        findings.brokenAssets.push({
          template: relativeTmpl,
          cssHref: href,
          expectedPath: localPath
        });
      }
    }

    // Check Script tags
    const scriptMatcher = /<script[^>]+src=["']([^"']+)["']/gi;
    while ((match = scriptMatcher.exec(rendered)) !== null) {
      let src = match[1];
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) continue;
      if (src.startsWith('{{') || src.includes('{')) continue;

      const cleanSrc = src.split('?')[0].split('#')[0];
      if (checkedAssets.has(cleanSrc)) continue;
      checkedAssets.add(cleanSrc);

      const localPath = path.join(REPO_ROOT, cleanSrc.startsWith('/') ? cleanSrc.slice(1) : cleanSrc);
      if (!fs.existsSync(localPath)) {
        findings.brokenAssets.push({
          template: relativeTmpl,
          scriptSrc: src,
          expectedPath: localPath
        });
      }
    }
  } catch (e) {
    // Ignore render error here as it was caught in Test 1
  }
}
console.log(`Checked ${checkedAssets.size} unique static asset references.`);

// ----------------------------------------------------
// 4. AUDIT JSON-LD STRUCTURED DATA ACROSS ALL PAGES
// ----------------------------------------------------
console.log('\n>>> [4/7] Auditing JSON-LD Structured Data on all pages...');
const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

let jsonLdCount = 0;
for (const tmplPath of allTemplates) {
  const relativeTmpl = path.relative(VIEWS_DIR, tmplPath).replace(/\\/g, '/');
  if (!relativeTmpl.startsWith('pages/') && relativeTmpl !== 'layout.njk') continue;

  try {
    const rendered = env.render(relativeTmpl, mockContext);
    let match;
    while ((match = jsonLdRegex.exec(rendered)) !== null) {
      jsonLdCount++;
      const jsonContent = match[1].trim();
      try {
        const parsed = JSON.parse(jsonContent);
        if (!parsed['@context']) {
          findings.jsonLdErrors.push({ template: relativeTmpl, error: 'Missing @context in JSON-LD', snippet: jsonContent.slice(0, 100) });
        }
        if (!parsed['@type'] && !parsed['@graph']) {
          findings.jsonLdErrors.push({ template: relativeTmpl, error: 'Missing @type or @graph in JSON-LD', snippet: jsonContent.slice(0, 100) });
        }
      } catch (jsonErr) {
        findings.jsonLdErrors.push({
          template: relativeTmpl,
          error: `JSON-LD Parse Error: ${jsonErr.message}`,
          snippet: jsonContent.slice(0, 200)
        });
      }
    }
  } catch (e) {}
}
console.log(`Validated ${jsonLdCount} JSON-LD blocks across all templates.`);

// ----------------------------------------------------
// 5. AUDIT ROUTE FILES & ERROR HANDLING
// ----------------------------------------------------
console.log('\n>>> [5/7] Auditing server route files and controllers...');
const routeFiles = getAllFiles(path.join(SERVER_DIR, 'routes'), '.js');
for (const rf of routeFiles) {
  const relRf = path.relative(SERVER_DIR, rf);
  console.log(`Checking route file: ${relRf}`);
  try {
    const requiredModule = require(rf);
    if (!requiredModule) {
      findings.routeWarnings.push({ file: relRf, error: 'Module exported empty or undefined' });
    }
  } catch (err) {
    findings.routeWarnings.push({ file: relRf, error: `Failed to require route module: ${err.message}` });
  }

  // Static checks on route code
  const code = fs.readFileSync(rf, 'utf8');
}


// ----------------------------------------------------
// 6. AUDIT CLIENT JAVASCRIPT FILES FOR SYNTAX ERRORS
// ----------------------------------------------------
console.log('\n>>> [6/7] Auditing client-side JavaScript files in js/ and server/lib/ for syntax errors...');
const clientJsFiles = getAllFiles(path.join(REPO_ROOT, 'js'), '.js');
const serverLibFiles = getAllFiles(path.join(SERVER_DIR, 'lib'), '.js');
const allJsFiles = [...clientJsFiles, ...serverLibFiles];

for (const jsFile of allJsFiles) {
  const relPath = path.relative(REPO_ROOT, jsFile);
  try {
    const code = fs.readFileSync(jsFile, 'utf8');
    new Function(code); // Quick syntax check
  } catch (err) {
    findings.jsErrors.push({
      file: relPath,
      error: err.message
    });
  }
}
console.log(`Audited ${allJsFiles.length} JavaScript files for syntax validity.`);

// ----------------------------------------------------
// 7. AUDIT FORMS & CSRF PROTECTION
// ----------------------------------------------------
console.log('\n>>> [7/7] Auditing forms and CSRF protection...');
const formPostRegex = /<form[^>]+method=["']post["'][^>]*>([\s\S]*?)<\/form>/gi;
for (const tmplPath of allTemplates) {
  const relativeTmpl = path.relative(VIEWS_DIR, tmplPath).replace(/\\/g, '/');
  try {
    const rendered = env.render(relativeTmpl, mockContext);
    let match;
    while ((match = formPostRegex.exec(rendered)) !== null) {
      const formBody = match[1];
      const hasCsrfInput = formBody.includes('name="_csrf"') || formBody.includes('csrfToken');
      // Admin/Agent/Customer forms MUST have CSRF
      if ((relativeTmpl.startsWith('admin/') || relativeTmpl.startsWith('agent/') || relativeTmpl.startsWith('customer/')) && !hasCsrfInput) {
        findings.csrfErrors.push({
          template: relativeTmpl,
          warning: 'POST form missing _csrf hidden input field'
        });
      }
    }
  } catch (e) {}
}

// ----------------------------------------------------
// SUMMARY REPORT
// ----------------------------------------------------
console.log('\n====================================================');
console.log('                 AUDIT SUMMARY REPORT               ');
console.log('====================================================');

console.log(`\n1. Template Errors: ${findings.templateErrors.length}`);
findings.templateErrors.forEach(e => console.log(`   - [${e.template}]: ${e.error}`));

console.log(`\n2. Registry Errors: ${findings.registryErrors.length}`);
findings.registryErrors.forEach(e => console.log(`   - ${JSON.stringify(e)}`));

console.log(`\n3. Broken Assets (Images/CSS/JS): ${findings.brokenAssets.length}`);
findings.brokenAssets.forEach(e => console.log(`   - [${e.template}] missing asset: ${e.src || e.cssHref || e.scriptSrc} (Expected: ${e.expectedPath})`));

console.log(`\n4. JSON-LD Structured Data Errors: ${findings.jsonLdErrors.length}`);
findings.jsonLdErrors.forEach(e => console.log(`   - [${e.template}] ${e.error}`));

console.log(`\n5. Route / Controller Warnings: ${findings.routeWarnings.length}`);
findings.routeWarnings.forEach(e => console.log(`   - [${e.file}] ${e.error}`));

console.log(`\n6. JavaScript Syntax Errors: ${findings.jsErrors.length}`);
findings.jsErrors.forEach(e => console.log(`   - [${e.file}] ${e.error}`));

console.log(`\n7. CSRF Form Warnings: ${findings.csrfErrors.length}`);
findings.csrfErrors.forEach(e => console.log(`   - [${e.template}] ${e.warning}`));

// Save detailed findings to scratch file for deep analysis
fs.writeFileSync(path.join(SERVER_DIR, 'audit-results.json'), JSON.stringify(findings, null, 2));
console.log('\nDetailed audit results saved to server/audit-results.json');

try {
  const db = require('../lib/db');
  if (db && db.destroy) {
    db.destroy().then(() => process.exit(0)).catch(() => process.exit(0));
  } else {
    process.exit(0);
  }
} catch (e) {
  process.exit(0);
}

