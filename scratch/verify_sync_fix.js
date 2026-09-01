const https = require('https');
const querystring = require('querystring');

if (!process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD env var not set - never hardcode the live admin password in a committed script.');
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

async function verifySyncFix() {
  console.log('====================================================');
  console.log(' liveSiteSync Dedicated Template Fix Verification');
  console.log('====================================================\n');

  // 1. Login to Admin
  console.log('[1] Authenticating at /admin/login...');
  const loginGet = await makeRequest('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginPost = await makeRequest('/admin/login', 'POST', {
    email: 'admin@bongshaihousing.com',
    password: process.env.DB_PASSWORD,
    _csrf: csrf
  });
  console.log(`  Login status: ${loginPost.statusCode}\n`);

  // Helper to test a product save & curl
  async function testProductSave(productId, expectedSlug, modelName) {
    console.log(`----------------------------------------------------`);
    console.log(`Testing Re-save on ${modelName} (ID ${productId})...`);
    console.log(`----------------------------------------------------`);
    
    // GET edit form
    const editPage = await makeRequest(`/admin/products/${productId}/edit`);
    const editCsrf = extractCsrf(editPage.body);
    const formFields = extractFormFields(editPage.body);

    const postData = {
      ...formFields,
      _csrf: editCsrf,
    };

    console.log(`  Submitting product save for ${modelName}...`);
    const saveRes = await makeRequest(`/admin/products/${productId}`, 'POST', postData);
    console.log(`  Save HTTP status: ${saveRes.statusCode} -> ${saveRes.headers.location || 'done'}`);

    console.log(`  Waiting 3 seconds for in-process liveSiteSync.js snapshot...`);
    await new Promise(r => setTimeout(r, 3000));

    const timestamp = Date.now();
    const liveUrl = `/${expectedSlug}?cb=${timestamp}`;
    console.log(`  Curling ${BASE_URL}${liveUrl}...`);
    const liveRes = await makeRequest(liveUrl);

    const titleMatch = liveRes.body.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'NONE';
    const hasCatSidebar = liveRes.body.includes('cat-sidebar');
    const hasRoomTable = liveRes.body.includes('modern-table') || liveRes.body.includes('Floor Layout');
    const isGenericProductDetail = liveRes.body.includes('pd-sticky-cta') && !hasCatSidebar;
    const bodyLength = liveRes.body.length;

    console.log(`\n  [CURL RESULT for ${modelName} at timestamp ${timestamp}]:`);
    console.log(`  - HTTP Status: ${liveRes.statusCode}`);
    console.log(`  - Page <title>: "${title}"`);
    console.log(`  - Contains "cat-sidebar": ${hasCatSidebar} (MUST BE TRUE)`);
    console.log(`  - Contains room/floor layout table: ${hasRoomTable}`);
    console.log(`  - Corrupted to generic shell: ${isGenericProductDetail} (MUST BE FALSE)`);
    console.log(`  - Total Page Bytes: ${bodyLength}`);

    if (!hasCatSidebar) {
      console.error(`\n  CRITICAL FAILURE: cat-sidebar missing on ${modelName}!`);
      return false;
    }
    return true;
  }

  // Test 1: Low Cost House product BH-LCH-1001 (ID 590)
  const lchOk = await testProductSave(590, 'bh-lch-1001.html', 'BH-LCH-1001');

  // Test 2: Simplex / Duplex product BH-SB-301 or BH-DV-202
  // Let's find product ID for BH-SB-301 or BH-DV-202
  const prodList = await makeRequest('/admin/products?q=BH-DV-202');
  const dvMatch = prodList.body.match(/\/admin\/products\/(\d+)\/edit/);
  const dvId = dvMatch ? dvMatch[1] : 433;

  const dvOk = await testProductSave(dvId, 'bh-dv-202.html', 'BH-DV-202');

  console.log('\n====================================================');
  if (lchOk && dvOk) {
    console.log('>>> VERIFICATION PASSED: Dedicated templates preserved on admin save! <<<');
  } else {
    console.log('>>> VERIFICATION FAILED! <<<');
  }
  console.log('====================================================\n');
}

verifySyncFix().catch(console.error);
