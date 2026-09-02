const https = require('https');
const querystring = require('querystring');
const mysql = require('mysql2/promise');

const BASE_URL = 'https://bongshaihousing.com';
const ADMIN_EMAIL = 'admin@bongshaihousing.com';
const ADMIN_PASS = 'zk2bGgqB_+a8Zk8T98Un';

let cookies = [];

function buildMultipart(fields, boundary) {
  const parts = [];
  for (const [key, val] of Object.entries(fields)) {
    if (val === undefined || val === null) continue;
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`);
  }
  parts.push(`--${boundary}--\r\n`);
  return Buffer.from(parts.join(''), 'utf-8');
}

function makeReq(urlPath, method = 'GET', data = null, headers = {}, isMultipart = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const reqHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', ...headers };
    if (cookies.length) reqHeaders['Cookie'] = cookies.join('; ');

    let postBody = null;
    if (data) {
      if (isMultipart) {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        postBody = buildMultipart(data, boundary);
        reqHeaders['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
        reqHeaders['Content-Length'] = postBody.length;
      } else {
        postBody = typeof data === 'object' ? querystring.stringify(data) : data;
        reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        reqHeaders['Content-Length'] = Buffer.byteLength(postBody);
      }
    }

    const req = https.request(url, { method, headers: reqHeaders, rejectUnauthorized: false }, (res) => {
      if (res.headers['set-cookie']) {
        res.headers['set-cookie'].forEach(sc => {
          const cp = sc.split(';')[0];
          const name = cp.split('=')[0];
          cookies = cookies.filter(c => !c.startsWith(name + '='));
          cookies.push(cp);
        });
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (postBody) req.write(postBody);
    req.end();
  });
}

function extractCsrf(html) {
  const m = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i) ||
            html.match(/name=["']_csrf["']\s+value=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

async function verifyNewProjectCreation() {
  console.log('====================================================');
  console.log(' Generic New Project Live Sync Verification');
  console.log('====================================================\n');

  // 1. Admin login
  console.log('[1] Logging in to /admin/login...');
  const loginGet = await makeReq('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginRes = await makeReq('/admin/login', 'POST', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    _csrf: csrf
  });
  console.log('  Login status:', loginRes.status);

  // 2. Fetch new project form
  console.log('\n[2] Fetching /admin/projects/new form...');
  const newGet = await makeReq('/admin/projects/new');
  const newCsrf = extractCsrf(newGet.body);
  console.log('  New project form CSRF token:', newCsrf ? 'Extracted' : 'Missing');

  const ts = Date.now();
  const testSlug = `test-generic-project-${ts}.html`;
  const testTitle = `Gazipur High-Tech Factory Facility ${ts}`;
  const testLocation = `Gazipur Industrial Zone, Bangladesh`;
  const testDesc = `State-of-the-art industrial PEB factory building constructed with heavy-duty structural steel frames and insulated PU panels for maximum thermal efficiency.`;
  const testImage = `images/projects/completed/asulia-dhaka.webp`;

  console.log('\n[3] Submitting brand-new project creation form:');
  console.log(`  - Title: "${testTitle}"`);
  console.log(`  - Slug: "${testSlug}"`);
  console.log(`  - Location: "${testLocation}"`);
  console.log(`  - Description: "${testDesc}"`);
  console.log(`  - Image: "${testImage}"`);

  const t0 = Date.now();
  const createRes = await makeReq('/admin/projects', 'POST', {
    _csrf: newCsrf,
    title: testTitle,
    slug: testSlug,
    location: testLocation,
    description: testDesc,
    image: testImage,
    status_label: 'Completed Project',
    published: 'on',
    sort_order: '99'
  }, {}, true);
  console.log(`  Create response status: ${createRes.status} -> Location: ${createRes.headers.location || 'None'}`);

  console.log('\n  Waiting 3s for liveSiteSync.js to render generic template to static docroot...');
  await new Promise(r => setTimeout(r, 3000));
  const t_live = Date.now();
  const elapsed = ((t_live - t0) / 1000).toFixed(1);

  // 4. Curl live URL
  console.log(`\n[4] Curled live page: https://bongshaihousing.com/${testSlug}?cb=${t_live}`);
  const liveRes = await makeReq(`/${testSlug}?cb=${t_live}`);

  const hasTitle = liveRes.body.includes(testTitle);
  const hasDesc = liveRes.body.includes(testDesc);
  const hasImage = liveRes.body.includes(testImage);
  const hasLocation = liveRes.body.includes(testLocation);

  console.log('\n>>> [LIVE CURL OUTPUT FOR BRAND-NEW PROJECT]:');
  console.log(`- Time to appear live: ${elapsed} seconds`);
  console.log(`- HTTP Status: ${liveRes.status} (Expected: 200, Not 404)`);
  console.log(`- Contains Title: ${hasTitle}`);
  console.log(`- Contains Description: ${hasDesc}`);
  console.log(`- Contains Image: ${hasImage}`);
  console.log(`- Contains Location: ${hasLocation}\n`);

  // Snippet preview
  const snippetIdx = liveRes.body.indexOf('<main');
  if (snippetIdx !== -1) {
    console.log('Page Body Snippet:');
    console.log(liveRes.body.substring(snippetIdx, snippetIdx + 600) + '\n...\n');
  }

  // 5. Clean up - delete test project from DB and static docroots
  console.log('[5] Cleaning up test project...');
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com',
    user: 'abongsha_bongshai_prod',
    password: '@Noldair_9361#',
    database: 'abongsha_bongshai_prod'
  });
  const [delRes] = await conn.query('DELETE FROM projects WHERE slug = ?', [testSlug]);
  console.log(`  Deleted ${delRes.affectedRows} row(s) from database.`);
  await conn.end();

  // Also remove static file from docroot if created
  const fsp = require('fs/promises');
  const path = require('path');
  const docroots = [
    path.join(__dirname, '..', '..', 'public_html'),
    path.join(__dirname, '..', '..', 'bongshaihousing.com')
  ];
  for (const d of docroots) {
    try {
      await fsp.unlink(path.join(d, testSlug));
      console.log(`  Removed static file from ${d}/${testSlug}`);
    } catch (e) {}
  }

  console.log('\n====================================================');
  console.log(' VERIFICATION SUMMARY');
  console.log('====================================================');
  console.log(`HTTP 200 Confirmed: ${liveRes.status === 200}`);
  console.log(`Title Verified: ${hasTitle}`);
  console.log(`Description Verified: ${hasDesc}`);
  console.log(`Image Verified: ${hasImage}`);
  console.log(`Cleaned up from DB: ${delRes.affectedRows > 0}`);
  console.log('====================================================\n');
}

verifyNewProjectCreation().catch(console.error);
