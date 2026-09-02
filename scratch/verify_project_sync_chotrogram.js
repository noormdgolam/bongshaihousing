const https = require('https');
const mysql = require('mysql2/promise');

const BASE_URL = 'https://bongshaihousing.com';
const ADMIN_EMAIL = 'admin@bongshaihousing.com';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'zk2bGgqB_+a8Zk8T98Un';

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
    const querystring = require('querystring');
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
  const m = html.match(/name=["']_csrf["']\s+value=["']([^"']+)["']/i) ||
            html.match(/value=["']([^"']+)["']\s+name=["']_csrf["']/i) ||
            html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

function extractFormFields(html) {
  const fields = {};
  const inputMatches = [...html.matchAll(/<input[^>]+name=["']([^"']+)["'][^>]*value=["']([^"']*)["'][^>]*>/gi)];
  for (const m of inputMatches) {
    fields[m[1]] = m[2];
  }
  const textareaMatches = [...html.matchAll(/<textarea[^>]+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/textarea>/gi)];
  for (const m of textareaMatches) {
    fields[m[1]] = m[2];
  }
  const selectMatches = [...html.matchAll(/<select[^>]+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi)];
  for (const m of selectMatches) {
    const selOpt = m[2].match(/<option[^>]+value=["']([^"']*)["'][^>]*selected[^>]*>/i);
    if (selOpt) fields[m[1]] = selOpt[1];
  }
  return fields;
}

function extractProjectDescription(html) {
  const m = html.match(/<div class=["']project-intro["'][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i) ||
            html.match(/<section[^>]*class=["'][^"']*project[^"']*["'][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i) ||
            html.match(/<div style=["'][^"']*margin-bottom:\s*var\(--space-6\);[^"']*["']>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i) ||
            html.match(/<main[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  return m ? m[1].trim() : '';
}

async function verifyProjectSync() {
  console.log('====================================================');
  console.log(' Project Live Sync Verification (project-chotrogram)');
  console.log('====================================================\n');

  // 1. Get project info from DB
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com',
    user: 'abongsha_bongshai_prod',
    password: process.env.DB_PASSWORD || '@Noldair_9361#',
    database: 'abongsha_bongshai_prod'
  });
  const [rows] = await conn.query("SELECT id, title, slug, description FROM projects WHERE slug = 'project-chotrogram.html'");
  const proj = rows[0];
  if (!proj) throw new Error('Project chotrogram not found in DB');
  const originalDesc = proj.description;
  console.log(`Found Project: "${proj.title}" (ID: ${proj.id}, Slug: ${proj.slug})`);
  console.log(`Original DB Description:\n"${originalDesc}"\n`);
  await conn.end();

  // 2. Authenticate admin
  console.log('[Admin Auth] Logging in...');
  const loginGet = await makeReq('/admin/login');
  const loginCsrf = extractCsrf(loginGet.body);
  const loginRes = await makeReq('/admin/login', 'POST', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    _csrf: loginCsrf
  });
  console.log(`Login status: ${loginRes.status}\n`);

  async function updateDescAndCheck(newDescription, label) {
    console.log(`----------------------------------------------------`);
    console.log(`[${label}] Updating description...`);
    console.log(`----------------------------------------------------`);

    const editGet = await makeReq(`/admin/projects/${proj.id}/edit`);
    const editCsrf = extractCsrf(editGet.body);
    const formFields = extractFormFields(editGet.body);

    const postPayload = {
      ...formFields,
      _csrf: editCsrf,
      description: newDescription,
      published: 'on'
    };

    const t0 = Date.now();
    const saveRes = await makeReq(`/admin/projects/${proj.id}`, 'POST', postPayload, {}, true);
    console.log(`Save response status: ${saveRes.status}`);

    console.log('Waiting 3 seconds for background liveSiteSync.js to write file...');
    await new Promise(r => setTimeout(r, 3000));
    const cb = Date.now();
    const elapsed = ((cb - t0) / 1000).toFixed(1);

    const liveRes = await makeReq(`/${proj.slug}?cb=${cb}`);
    const liveDesc = extractProjectDescription(liveRes.body);

    console.log(`\n>>> [${label} LIVE CURL OUTPUT at timestamp ${cb} (${elapsed}s)]:`);
    console.log(`  - HTTP Status: ${liveRes.status}`);
    console.log(`  - Live Description on /${proj.slug}:`);
    console.log(`    "${liveDesc}"\n`);

    return { liveDesc, elapsed };
  }

  // STEP 1 & 2: Test Description
  const testDesc = "A modern multi-story commercial showroom delivered in Chotrogram. Built with high-strength structural steel and energy-efficient insulated panels by Bongshai Housing Ltd.";
  const resTest = await updateDescAndCheck(testDesc, 'TEST DESCRIPTION');

  // STEP 3: Restore Original Description
  const resRestore = await updateDescAndCheck(originalDesc, 'RESTORE ORIGINAL DESCRIPTION');

  console.log('====================================================');
  console.log(' VERIFICATION SUMMARY');
  console.log('====================================================');
  console.log(`Test Description reflected live: ${resTest.liveDesc === testDesc} (${resTest.elapsed}s)`);
  console.log(`Original Description restored: ${resRestore.liveDesc === originalDesc} (${resRestore.elapsed}s)`);
  console.log('====================================================\n');
}

verifyProjectSync().catch(console.error);
