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

function extractProjectDescription(html) {
  const m = html.match(/<h2[^>]*>Chotrogram<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  return m ? m[1].trim() : '';
}

async function verifyProjectSync() {
  console.log('====================================================');
  console.log(' Project Live Sync Verification (project-chotrogram)');
  console.log('====================================================\n');

  const originalDesc = "An elegant multi-story commercial showroom delivered in Chotrogram. Bongshai Housing provides top-tier pre-engineered building (PEB) solutions for businesses across the Chattogram district.";
  const testDesc = "An elegant multi-story commercial showroom delivered in Chotrogram. Built with high-strength structural steel and energy-efficient insulated panels by Bongshai Housing Ltd.";

  console.log('Original Description:\n"' + originalDesc + '"\n');

  // 1. Admin login
  console.log('[1] Logging into /admin/login...');
  const loginGet = await makeReq('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginRes = await makeReq('/admin/login', 'POST', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    _csrf: csrf
  });
  console.log('  Login status:', loginRes.status);

  // 2. Change description to testDesc
  console.log('\n[2] Updating project description to new text...');
  const editGet1 = await makeReq('/admin/projects/2/edit');
  const editCsrf1 = extractCsrf(editGet1.body);
  
  const t0_A = Date.now();
  const saveA = await makeReq('/admin/projects/2', 'POST', {
    _csrf: editCsrf1,
    title: 'Chotrogram',
    slug: 'project-chotrogram.html',
    location: 'Chotrogram',
    description: testDesc,
    status_label: 'Completed Project',
    published: 'on',
    sort_order: '0'
  }, {}, true);
  console.log('  Save response status:', saveA.status);

  console.log('  Waiting 3s for liveSiteSync.js to write static file...');
  await new Promise(r => setTimeout(r, 3000));
  const t_live_A = Date.now();
  const elapsed_A = ((t_live_A - t0_A) / 1000).toFixed(1);

  // 3. Curl live page
  console.log('\n[3] Fetching live https://bongshaihousing.com/project-chotrogram.html...');
  const liveResA = await makeReq(`/project-chotrogram.html?cb=${t_live_A}`);
  const liveDescA = extractProjectDescription(liveResA.body);

  console.log('\n>>> [LIVE CURL OUTPUT WITH NEW DESCRIPTION]:');
  console.log(`- Time to appear live: ${elapsed_A} seconds`);
  console.log(`- HTTP Status: ${liveResA.status}`);
  console.log(`- Paragraph Content (<p>):\n  "${liveDescA}"\n`);

  // 4. Revert description
  console.log('\n[4] Reverting description back to original...');
  const editGet2 = await makeReq('/admin/projects/2/edit');
  const editCsrf2 = extractCsrf(editGet2.body);

  const t0_B = Date.now();
  const saveB = await makeReq('/admin/projects/2', 'POST', {
    _csrf: editCsrf2,
    title: 'Chotrogram',
    slug: 'project-chotrogram.html',
    location: 'Chotrogram',
    description: originalDesc,
    status_label: 'Completed Project',
    published: 'on',
    sort_order: '0'
  }, {}, true);
  console.log('  Save response status:', saveB.status);

  console.log('  Waiting 3s for liveSiteSync.js to write static file...');
  await new Promise(r => setTimeout(r, 3000));
  const t_live_B = Date.now();
  const elapsed_B = ((t_live_B - t0_B) / 1000).toFixed(1);

  // 5. Curl live page again
  console.log('\n[5] Fetching live https://bongshaihousing.com/project-chotrogram.html...');
  const liveResB = await makeReq(`/project-chotrogram.html?cb=${t_live_B}`);
  const liveDescB = extractProjectDescription(liveResB.body);

  console.log('\n>>> [LIVE CURL OUTPUT WITH RESTORED ORIGINAL DESCRIPTION]:');
  console.log(`- Time to appear live: ${elapsed_B} seconds`);
  console.log(`- HTTP Status: ${liveResB.status}`);
  console.log(`- Paragraph Content (<p>):\n  "${liveDescB}"\n`);

  console.log('====================================================');
  console.log(' SUMMARY & VERIFICATION CONFIRMATION');
  console.log('====================================================');
  console.log(`New description verified: ${liveDescA === testDesc}`);
  console.log(`Original description restored: ${liveDescB === originalDesc}`);
  console.log('====================================================\n');
}

verifyProjectSync().catch(console.error);
