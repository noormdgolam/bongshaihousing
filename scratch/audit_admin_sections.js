require('dotenv').config();
const https = require('https');
const querystring = require('querystring');

if (!process.env.ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD env var not set - never hardcode the live admin/DB password in a committed script (this repo has leaked it 3 times already this way). Set it in .env or pass it inline: ADMIN_PASSWORD=... node audit_admin_sections.js');
}

const BASE_URL = 'https://bongshaihousing.com';
let cookies = [];

function makeRequest(urlPath, method = 'GET', data = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...customHeaders
    };

    if (cookies.length > 0) {
      headers['Cookie'] = cookies.join('; ');
    }

    let postBody = '';
    if (data) {
      if (typeof data === 'object' && !headers['Content-Type']) {
        postBody = querystring.stringify(data);
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        headers['Content-Length'] = Buffer.byteLength(postBody);
      } else if (typeof data === 'string') {
        postBody = data;
        headers['Content-Length'] = Buffer.byteLength(postBody);
      }
    }

    const req = https.request(url, {
      method,
      headers,
      rejectUnauthorized: false
    }, (res) => {
      const setCookies = res.headers['set-cookie'];
      if (setCookies) {
        setCookies.forEach(sc => {
          const cookiePart = sc.split(';')[0];
          const name = cookiePart.split('=')[0];
          cookies = cookies.filter(c => !c.startsWith(name + '='));
          cookies.push(cookiePart);
        });
      }

      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', reject);
    if (postBody) req.write(postBody);
    req.end();
  });
}

function extractCsrf(html) {
  const match = html.match(/name=["']_csrf["']\s+value=["']([^"']+)["']/i) ||
                html.match(/value=["']([^"']+)["']\s+name=["']_csrf["']/i) ||
                html.match(/meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

function checkForErrors(html) {
  const issues = [];
  if (/class=["'][^"']*(alert-danger|flash-error|error-banner)[^"']*["']/i.test(html)) {
    const alertMatch = html.match(/<div[^>]*class=["'][^"']*(alert-danger|flash-error|error-banner)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    issues.push(`Error banner: ${alertMatch ? alertMatch[2].replace(/<[^>]+>/g, '').trim() : 'alert-danger'}`);
  }
  if (/ReferenceError:|TypeError:|SyntaxError:|UnhandledPromiseRejection|at\s+[\w.<>]+\s+\([\w/\\:.-]+:\d+:\d+\)/i.test(html)) {
    issues.push('Runtime error / Stack trace');
  }
  if (/500 Internal Server Error|502 Bad Gateway|Cannot GET/i.test(html)) {
    issues.push('Server error status in body');
  }
  return issues;
}

async function auditAdmin() {
  console.log('====================================================');
  console.log(' Admin Panel Complete Section & Feature Audit');
  console.log(' Target: ' + BASE_URL);
  console.log('====================================================\n');

  // Step 1: Login
  const loginGet = await makeRequest('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginPost = await makeRequest('/admin/login', 'POST', {
    email: process.env.ADMIN_EMAIL || 'admin@bongshaihousing.com',
    password: process.env.ADMIN_PASSWORD,
    _csrf: csrf
  });
  if (loginPost.statusCode !== 302 && loginPost.statusCode !== 303) {
    throw new Error(`Authentication failed with HTTP ${loginPost.statusCode}`);
  }
  console.log('✔ Authenticated successfully at /admin/login\n');

  // Step 2: Test every list page
  const sections = [
    { name: 'activity', path: '/admin/activity' },
    { name: 'agents', path: '/admin/agents' },
    { name: 'agent-leads', path: '/admin/agent-leads' },
    { name: 'analytics', path: '/admin/analytics' },
    { name: 'categories', path: '/admin/categories' },
    { name: 'faqs', path: '/admin/faqs' },
    { name: 'leads', path: '/admin/leads' },
    { name: 'media', path: '/admin/media' },
    { name: 'orders', path: '/admin/orders' },
    { name: 'pages', path: '/admin/pages' },
    { name: 'products', path: '/admin/products' },
    { name: 'projects', path: '/admin/projects' },
    { name: 'seo', path: '/admin/seo' },
    { name: 'service-areas', path: '/admin/service-areas' },
    { name: 'team-members', path: '/admin/team-members' },
    { name: 'testimonials', path: '/admin/testimonials' },
    { name: 'theme-editor', path: '/admin/theme-editor' },
    { name: 'themes', path: '/admin/themes' },
    { name: 'users', path: '/admin/users' },
  ];

  const failedSections = [];

  console.log('--- 1. Section List Pages Audit ---');
  for (const sec of sections) {
    let res = await makeRequest(sec.path);
    if (res.statusCode === 404 && sec.name === 'activity') {
      res = await makeRequest('/admin/activity-logs');
    }
    const errors = checkForErrors(res.body);
    const isClean = res.statusCode === 200 && errors.length === 0;

    if (!isClean) {
      failedSections.push({ name: sec.name, statusCode: res.statusCode, errors });
    }
    console.log(`  [${isClean ? 'OK 200' : 'FAIL ' + res.statusCode}] ${sec.name.padEnd(16)} (${res.body.length} bytes)${errors.length ? ' - ' + errors.join(', ') : ''}`);
  }

  // Step 3: Categories Dead Lines Check
  console.log('\n--- 2. /admin/categories Dead Lines Check ---');
  const catRes = await makeRequest('/admin/categories');
  const hasIndustrial = /industrial-steel-sheds|Industrial Steel Sheds/i.test(catRes.body);
  const hasWorker = /worker-accommodation|Worker Accommodation/i.test(catRes.body);
  console.log(`  Industrial Steel Sheds listed: ${hasIndustrial} (Expected: false)`);
  console.log(`  Worker Accommodation listed: ${hasWorker} (Expected: false)`);

  // Step 4: /admin/products Category Filtering
  console.log('\n--- 3. /admin/products Category Filtering ---');
  const prodPage = await makeRequest('/admin/products');
  const categoryOptionMatches = [...prodPage.body.matchAll(/<option[^>]*value=["'](\d+)["'][^>]*>([^<]+)<\/option>/g)];
  const categories = categoryOptionMatches.map(m => ({ id: m[1], name: m[2].trim() })).filter(c => c.id !== '' && c.name.toLowerCase() !== 'all categories');
  
  console.log(`  Testing ${categories.length} category filters:`);
  let prodFilterFails = 0;
  for (const cat of categories) {
    const filterRes = await makeRequest(`/admin/products?category_id=${cat.id}`);
    const filterErrors = checkForErrors(filterRes.body);
    const filterClean = filterRes.statusCode === 200 && filterErrors.length === 0;
    if (!filterClean) {
      prodFilterFails++;
      console.log(`    [FAIL] Category: ${cat.name} (ID: ${cat.id}) -> HTTP ${filterRes.statusCode}`);
    } else {
      console.log(`    [OK] Category: ${cat.name.padEnd(24)} (ID ${cat.id}) -> HTTP 200 Clean`);
    }
  }

  // Step 5: Exercising Media, Theme Editor, Users
  console.log('\n--- 4. Interactive Section Actions ---');
  
  // 5a. Media
  const mediaRes = await makeRequest('/admin/media');
  const mediaHasGrid = /media-item|media-grid|<input[^>]*type=["']file["']/i.test(mediaRes.body);
  console.log(`  Media manager (/admin/media): HTTP ${mediaRes.statusCode}, UI/Upload grid rendered: ${mediaHasGrid}`);

  // 5b. Theme Editor
  const themeRes = await makeRequest('/admin/theme-editor');
  const themeHasControls = /name=["']primary["']|preset-card|theme-form/i.test(themeRes.body);
  console.log(`  Theme Editor (/admin/theme-editor): HTTP ${themeRes.statusCode}, Real tokens/presets rendered: ${themeHasControls}`);

  // 5c. Users Form
  const usersRes = await makeRequest('/admin/users');
  const userEditMatch = usersRes.body.match(/\/admin\/users\/(\d+)\/edit/);
  const userEditUrl = userEditMatch ? userEditMatch[0] : '/admin/users/new';
  const userFormRes = await makeRequest(userEditUrl);
  const userFormRendered = /name=["']name["']|name=["']email["']/i.test(userFormRes.body);
  console.log(`  Users Form (${userEditUrl}): HTTP ${userFormRes.statusCode}, Edit fields with real data rendered: ${userFormRendered}`);

  console.log('\n====================================================');
  console.log(` SUMMARY: ${failedSections.length === 0 && !hasIndustrial && !hasWorker && prodFilterFails === 0 ? 'ALL SECTIONS 100% CLEAN' : 'ISSUES DETECTED'}`);
  console.log('====================================================\n');
}

auditAdmin().catch(console.error);
