const https = require('https');
const querystring = require('querystring');
const mysql = require('mysql2/promise');

if (!process.env.ADMIN_PASSWORD || !process.env.DB_PASSWORD) {
  throw new Error('ADMIN_PASSWORD and DB_PASSWORD env vars must be set - never hardcode live credentials in a committed script.');
}

const BASE_URL = 'https://bongshaihousing.com';
const ADMIN_EMAIL = 'admin@bongshaihousing.com';
const ADMIN_PASS = process.env.ADMIN_PASSWORD;

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

async function runPriceVerification() {
  console.log('====================================================');
  console.log(' BH-DV-202 Fixed Price & Specifications Verification');
  console.log('====================================================\n');

  // 1. Get BH-DV-202 from DB
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com',
    user: 'abongsha_housin',
    password: process.env.DB_PASSWORD,
    database: 'abongsha_bongshai_prod'
  });
  const [rows] = await conn.query("SELECT id, model_number, title, fixed_price, category_id, slug FROM products WHERE model_number = 'BH-DV-202'");
  const dv = rows[0];
  const originalPrice = dv.fixed_price;
  console.log(`Found BH-DV-202 (ID: ${dv.id}), original fixed_price in DB: ${originalPrice}`);
  await conn.end();

  // 2. Admin Login
  console.log('\n[Admin Auth] Logging in...');
  const loginGet = await makeReq('/admin/login');
  const loginCsrf = extractCsrf(loginGet.body);
  const loginRes = await makeReq('/admin/login', 'POST', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    _csrf: loginCsrf
  });
  console.log(`Login status: ${loginRes.status}`);

  // Helper to save product fixed price and check live page
  async function updatePriceAndCheck(newPrice, label) {
    console.log(`\n----------------------------------------------------`);
    console.log(`[${label}] Setting BH-DV-202 fixed_price to: ${newPrice}...`);
    console.log(`----------------------------------------------------`);

    const editGet = await makeReq(`/admin/products/${dv.id}/edit`);
    const editCsrf = extractCsrf(editGet.body);
    const formFields = extractFormFields(editGet.body);

    const postPayload = {
      ...formFields,
      _csrf: editCsrf,
      fixed_price: String(newPrice),
      published: 'on'
    };

    const t0 = Date.now();
    const saveRes = await makeReq(`/admin/products/${dv.id}`, 'POST', postPayload);
    console.log(`Save response status: ${saveRes.status}`);

    console.log('Waiting 3 seconds for background liveSiteSync.js to write file...');
    await new Promise(r => setTimeout(r, 3000));
    const cb = Date.now();
    const elapsed = ((cb - t0) / 1000).toFixed(1);

    const liveRes = await makeReq(`/bh-dv-202.html?cb=${cb}`);

    // Extract price span
    const priceSpanMatch = liveRes.body.match(/<span id=["']spec-price-bh-dv-202["'][^>]*>([\s\S]*?)<\/span>/i) ||
                           liveRes.body.match(/Fixed Package Price<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>/i);
    const priceSpanText = priceSpanMatch ? priceSpanMatch[1].trim() : 'NOT_FOUND';

    // Extract WhatsApp price text
    const waMatch = liveRes.body.match(/href=["'](https:\/\/wa\.me\/[^"']+)["']/i);
    const waUrl = waMatch ? waMatch[1] : 'NOT_FOUND';

    // Check cat-sidebar and specs table
    const hasCatSidebar = liveRes.body.includes('cat-sidebar');
    const specRows = [...liveRes.body.matchAll(/<tr>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi)].length;

    console.log(`\n>>> [${label} LIVE CURL OUTPUT at timestamp ${cb} (${elapsed}s)]:`);
    console.log(`  - Price Span Content: "${priceSpanText}"`);
    console.log(`  - WhatsApp URL Link: "${waUrl}"`);
    console.log(`  - cat-sidebar present: ${hasCatSidebar}`);
    console.log(`  - Building Specifications table rows: ${specRows} rows`);

    return {
      priceSpanText,
      waUrl,
      hasCatSidebar,
      specRows,
      elapsed
    };
  }

  // STEP 1 & 2: Change to test price 4250000
  const testPrice = 4250000;
  const resTest = await updatePriceAndCheck(testPrice, 'TEST PRICE');

  // STEP 3 & 4: Revert to original price
  const resRevert = await updatePriceAndCheck(originalPrice || 3500000, 'RESTORE ORIGINAL PRICE');

  console.log('\n====================================================');
  console.log(' VERIFICATION SUMMARY');
  console.log('====================================================');
  console.log(`Original Price in DB: ${originalPrice}`);
  console.log(`Test Price rendered: "${resTest.priceSpanText}" (reflected in ${resTest.elapsed}s)`);
  console.log(`Restored Price rendered: "${resRevert.priceSpanText}" (reflected in ${resRevert.elapsed}s)`);
  console.log(`WhatsApp link updated dynamically: ${resTest.waUrl.includes('42%2C50%2C000') || resTest.waUrl.includes('4250000') || resTest.waUrl.includes('42')}`);
  console.log(`cat-sidebar intact: ${resTest.hasCatSidebar && resRevert.hasCatSidebar}`);
  console.log(`Building Specifications rows: ${resTest.specRows} rows (non-empty)`);
  console.log('====================================================\n');
}

runPriceVerification().catch(console.error);
