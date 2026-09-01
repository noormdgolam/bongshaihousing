const https = require('https');
const querystring = require('querystring');

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

async function verifyBulkEdit() {
  console.log('====================================================');
  console.log(' Bulk Edit Description Verification (Commit f492636b)');
  console.log('====================================================\n');

  // 1. Login
  console.log('[1] Logging into /admin/login...');
  const loginGet = await makeRequest('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginPost = await makeRequest('/admin/login', 'POST', {
    email: 'admin@bongshaihousing.com',
    password: '@Noldair_9361#',
    _csrf: csrf
  });
  console.log(`  Login status: ${loginPost.statusCode}`);

  // 2. Check /admin/products for button
  console.log('\n[2] Checking /admin/products for Bulk Edit Description button...');
  const prodListRes = await makeRequest('/admin/products');
  const hasBulkButton = /Bulk Edit Description/i.test(prodListRes.body);
  const bulkUrlMatch = prodListRes.body.match(/\/admin\/products\/bulk-edit-description/i);
  console.log(`  "Bulk Edit Description" button present: ${hasBulkButton} (${bulkUrlMatch ? bulkUrlMatch[0] : 'not found'})`);

  // 3. Open Bulk Edit Form for Low Cost House (Category 51)
  console.log('\n[3] Opening /admin/products/bulk-edit-description?category=51...');
  const bulkFormRes = await makeRequest('/admin/products/bulk-edit-description?category=51');
  console.log(`  HTTP Status: ${bulkFormRes.statusCode}`);
  const modelCheckboxes = [...bulkFormRes.body.matchAll(/name=["']product_ids["'][^>]*value=["'](\d+)["'][^>]*checked/g)];
  console.log(`  Found ${modelCheckboxes.length} checked model checkboxes by default for Category 51.`);
  
  const bulkCsrf = extractCsrf(bulkFormRes.body);

  // Extract all product IDs listed
  const allProductIds = [...bulkFormRes.body.matchAll(/name=["']product_ids["'][^>]*value=["'](\d+)["']/g)].map(m => m[1]);
  console.log(`  Total product IDs in category: ${allProductIds.length}`);

  if (allProductIds.length < 2) {
    throw new Error('Need at least 2 products to test checked vs unchecked');
  }

  // Choose to uncheck the last product (e.g. allProductIds[allProductIds.length - 1])
  const uncheckedId = allProductIds[allProductIds.length - 1];
  const checkedIds = allProductIds.slice(0, allProductIds.length - 1);
  const testDescription = `Premium quality prefabricated low cost steel home in Bangladesh. [Bulk-Edit Verified: ${Date.now()}]`;

  console.log(`\n[4] Submitting bulk edit with ${checkedIds.length} checked models and 1 unchecked model (ID: ${uncheckedId})...`);
  
  // Format form post data with multiple product_ids
  const postParams = new URLSearchParams();
  postParams.append('_csrf', bulkCsrf);
  postParams.append('category_id', '51');
  postParams.append('description', testDescription);
  postParams.append('update_meta_description', '1');
  for (const pid of checkedIds) {
    postParams.append('product_ids', pid);
  }

  const postRes = await makeRequest('/admin/products/bulk-edit-description', 'POST', postParams.toString(), {
    'Content-Type': 'application/x-www-form-urlencoded'
  });
  console.log(`  Submit response: HTTP ${postRes.statusCode} -> ${postRes.headers.location || 'none'}`);

  // 4. Spot check checked model vs unchecked model
  console.log('\n[5] Spot-checking edited products in Admin...');
  const checkedSampleId = checkedIds[0];
  const checkedEditRes = await makeRequest(`/admin/products/${checkedSampleId}/edit`);
  const uncheckedEditRes = await makeRequest(`/admin/products/${uncheckedId}/edit`);

  const checkedHasNewDesc = checkedEditRes.body.includes(testDescription);
  const uncheckedHasNewDesc = uncheckedEditRes.body.includes(testDescription);

  console.log(`  Checked Model (ID ${checkedSampleId}) description updated: ${checkedHasNewDesc}`);
  console.log(`  Unchecked Model (ID ${uncheckedId}) description untouched: ${!uncheckedHasNewDesc} (has new desc: ${uncheckedHasNewDesc})`);

  // 5. Live site sync check on landing page
  console.log('\n[6] Checking live category landing page https://bongshaihousing.com/low-cost-house.html...');
  console.log('  Waiting 4 seconds for liveSiteSync.js snapshot...');
  await new Promise(r => setTimeout(r, 4000));

  const catLiveRes = await makeRequest('/low-cost-house.html?cb=' + Date.now());
  const catHasNewDesc = catLiveRes.body.includes(testDescription);
  console.log(`  New description reflected on live category page: ${catHasNewDesc}`);

  console.log('\n====================================================');
  if (hasBulkButton && checkedHasNewDesc && !uncheckedHasNewDesc && catHasNewDesc) {
    console.log('>>> BULK EDIT & LIVE SITE SYNC VERIFICATION: 100% SUCCESSFUL! <<<');
  } else {
    console.log('>>> VERIFICATION COMPLETED WITH SOME WARNINGS <<<');
  }
  console.log('====================================================\n');
}

verifyBulkEdit().catch(console.error);
