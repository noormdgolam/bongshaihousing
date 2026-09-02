const https = require('https');
const querystring = require('querystring');
const mysql = require('mysql2/promise');

const BASE_URL = 'https://bongshaihousing.com';
const ADMIN_EMAIL = 'admin@bongshaihousing.com';
const ADMIN_PASS = 'zk2bGgqB_+a8Zk8T98Un';

let cookies = [];

function makeReq(urlPath, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const reqHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', ...headers };
    if (cookies.length) reqHeaders['Cookie'] = cookies.join('; ');

    let postBody = '';
    if (data) {
      postBody = typeof data === 'object' ? querystring.stringify(data) : data;
      reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      reqHeaders['Content-Length'] = Buffer.byteLength(postBody);
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

function extractHeroImage(html, modelNumber) {
  const m = html.match(/<div class=["']reveal-left["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i) ||
            html.match(new RegExp(`<img[^>]+alt=["'][^"']*${modelNumber}[^"']*["'][^>]*src=["']([^"']+)["']`, 'i')) ||
            html.match(/<img[^>]+src=["']([^"']+)["'][^>]*title=["'][^"']*Exterior View["']/i);
  return m ? m[1] : '';
}

function extractCardImage(html, modelNumber) {
  const m = html.match(new RegExp(`alt=["'][^"']*${modelNumber}[^"']*["'][^>]*src=["']([^"']+)["']`, 'i')) ||
            html.match(new RegExp(`src=["']([^"']+)["'][^>]*alt=["'][^"']*${modelNumber}[^"']*["']`, 'i')) ||
            html.match(new RegExp(`${modelNumber}[\\s\\S]*?<img[^>]+src=["']([^"']+)["']`, 'i'));
  return m ? m[1] : '';
}

async function verifyCategoryDualSync() {
  console.log('====================================================');
  console.log(' Dual Category & Product Image Live Sync Verification');
  console.log(' Model: BH-SH-601 -> steel-house.html');
  console.log('====================================================\n');

  // 1. Get BH-SH-601 from DB
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com',
    user: 'abongsha_bongshai_prod',
    password: '@Noldair_9361#',
    database: 'abongsha_bongshai_prod'
  });
  const [rows] = await conn.query("SELECT id, model_number, title, slug, main_image, category_id FROM products WHERE model_number = 'BH-SH-601'");
  const prod = rows[0];
  const [catRows] = await conn.query("SELECT id, name, slug FROM categories WHERE id = " + prod.category_id);
  const cat = catRows[0];
  const originalImage = prod.main_image || 'images/products/Model No-BH-SH-601.webp';
  const prodSlug = prod.slug.endsWith('.html') ? prod.slug : `${prod.slug}.html`;
  const catSlug = cat.slug.endsWith('.html') ? cat.slug : `${cat.slug}.html`;

  console.log(`Product: ${prod.model_number} (ID: ${prod.id}, Page: ${prodSlug})`);
  console.log(`Category: ${cat.name} (Page: ${catSlug})`);
  console.log(`Original main_image in DB: ${originalImage}\n`);
  await conn.end();

  // 2. Login to admin
  console.log('[1] Authenticating at /admin/login...');
  const loginGet = await makeReq('/admin/login');
  const loginCsrf = extractCsrf(loginGet.body);
  const loginRes = await makeReq('/admin/login', 'POST', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    _csrf: loginCsrf
  });
  console.log(`  Login status: ${loginRes.status}\n`);

  async function updateImageAndCheck(newImage, label) {
    console.log(`----------------------------------------------------`);
    console.log(`[${label}] Setting ${prod.model_number} main_image to: ${newImage}...`);
    console.log(`----------------------------------------------------`);

    const editGet = await makeReq(`/admin/products/${prod.id}/edit`);
    const editCsrf = extractCsrf(editGet.body);
    const formFields = extractFormFields(editGet.body);

    const postPayload = {
      ...formFields,
      _csrf: editCsrf,
      main_image: newImage,
      published: 'on'
    };

    const t0 = Date.now();
    const saveRes = await makeReq(`/admin/products/${prod.id}`, 'POST', postPayload);
    console.log(`  Save response status: ${saveRes.status}`);

    console.log('  Waiting 3s for liveSiteSync.js to write both product and category static files...');
    await new Promise(r => setTimeout(r, 3000));
    const cb = Date.now();
    const elapsed = ((cb - t0) / 1000).toFixed(1);

    // Fetch Product page
    const prodRes = await makeReq(`/${prodSlug}?cb=${cb}`);
    const heroSrc = extractHeroImage(prodRes.body, prod.model_number);

    // Fetch Category landing page
    const catRes = await makeReq(`/${catSlug}?cb=${cb}`);
    const cardSrc = extractCardImage(catRes.body, prod.model_number);

    console.log(`\n>>> [${label} LIVE CURL OUTPUT at timestamp ${cb} (${elapsed}s)]:`);
    console.log(`  - Product Page (https://bongshaihousing.com/${prodSlug}):`);
    console.log(`    src="${heroSrc}"`);
    console.log(`  - Category Page (https://bongshaihousing.com/${catSlug}):`);
    console.log(`    src="${cardSrc}"\n`);

    return { heroSrc, cardSrc, elapsed };
  }

  // STEP 1 & 2: Update to test image
  const testImage = 'images/projects/completed/asulia-dhaka.webp';
  const resTest = await updateImageAndCheck(testImage, 'TEST IMAGE');

  // STEP 3: Restore original image
  const resRestore = await updateImageAndCheck(originalImage, 'RESTORE ORIGINAL IMAGE');

  console.log('====================================================');
  console.log(' VERIFICATION SUMMARY');
  console.log('====================================================');
  console.log(`Test Image on Product Page (${prodSlug}): ${resTest.heroSrc === testImage} ("${resTest.heroSrc}")`);
  console.log(`Test Image on Category Page (${catSlug}): ${resTest.cardSrc === testImage} ("${resTest.cardSrc}")`);
  console.log(`Both pages updated simultaneously: ${resTest.heroSrc === testImage && resTest.cardSrc === testImage} (in ${resTest.elapsed}s)`);
  console.log(`Restored Image on Product Page: ${resRestore.heroSrc === originalImage}`);
  console.log(`Restored Image on Category Page: ${resRestore.cardSrc === originalImage}`);
  console.log('====================================================\n');
}

verifyCategoryDualSync().catch(console.error);
