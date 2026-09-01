const https = require('https');
if (!process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD env var not set - never hardcode the live DB password in a committed script.');
}
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

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

async function run() {
  console.log('================================================================');
  console.log(' Syncing products.json descriptions -> Live DB & Static Files');
  console.log('================================================================');

  // Step 1: Login to admin
  console.log('\n[1] Authenticating at /admin/login...');
  const loginGet = await makeRequest('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginPost = await makeRequest('/admin/login', 'POST', {
    email: 'admin@bongshaihousing.com',
    password: process.env.DB_PASSWORD,
    _csrf: csrf
  });
  console.log(`  Login Result: HTTP ${loginPost.statusCode} -> ${loginPost.headers.location || 'none'}`);

  if (loginPost.statusCode !== 302 && loginPost.statusCode !== 303) {
    throw new Error('Authentication failed at /admin/login');
  }

  // Step 2: Fetch authenticated admin page to get fresh session CSRF token
  console.log('\n[2] Fetching /admin/products for session CSRF token...');
  const productsGet = await makeRequest('/admin/products');
  const authCsrf = extractCsrf(productsGet.body);
  console.log(`  Session CSRF Token acquired: ${!!authCsrf}`);

  // Step 3: Call sync endpoint with sync_files: true
  console.log('\n[3] Triggering POST /admin/products/sync-meta-descriptions (with liveSiteSync)...');
  const syncRes = await makeRequest('/admin/products/sync-meta-descriptions', 'POST', {
    _csrf: authCsrf,
    sync_files: 'true'
  });

  console.log(`  Sync Endpoint Response HTTP ${syncRes.statusCode}`);
  let data;
  try {
    data = JSON.parse(syncRes.body);
  } catch (e) {
    console.error('Raw response:', syncRes.body);
    throw new Error('Failed to parse sync endpoint JSON response');
  }

  console.log('\n================================================================');
  console.log(` Total Seed Products Scanned : ${data.totalCount}`);
  console.log(` Products Updated in Live DB : ${data.updatedCount}`);
  console.log(` Products Already Up-to-date : ${data.unchangedCount}`);
  console.log(` Static Files Synced to Disk : ${data.filesSynced}`);
  console.log('================================================================');

  // Step 4: Verification of a handful of live public pages
  console.log('\n[4] Verifying live public pages for synced meta descriptions...');
  const sampleSlugs = [
    'bh-cb-901.html',
    'bh-tsb-101.html',
    'bh-ch-413.html',
    'bh-lch-1001.html',
    'bh-sb-301.html',
    'bh-wh-801.html',
    'bh-th-701.html'
  ];
  
  const jsonPath = path.join(__dirname, '..', 'db', 'seeds', 'data', 'products.json');
  const seedItems = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let verifiedCount = 0;
  for (const slug of sampleSlugs) {
    const seed = seedItems.find(i => i.filename === slug || i.slug === slug);
    if (!seed) continue;

    const pageRes = await makeRequest(`/${slug}?cb=${Date.now()}`, 'GET');
    const metaMatch = pageRes.body.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const liveMeta = metaMatch ? metaMatch[1] : '';

    console.log(`\nChecking ${slug}:`);
    console.log(`  Expected (from products.json) : "${seed.description}"`);
    console.log(`  Live Meta Tag in Page HTML   : "${liveMeta}"`);
    if (liveMeta === seed.description || (liveMeta && seed.description && liveMeta.trim() === seed.description.trim())) {
      console.log(`  ✓ PERFECT MATCH / VERIFIED`);
      verifiedCount++;
    } else {
      console.log(`  ⚠ Discrepancy detected`);
    }
  }

  console.log(`\n================================================================`);
  console.log(` Sample Verification Result: ${verifiedCount}/${sampleSlugs.length} verified perfectly`);
  console.log('================================================================');
}

run().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
