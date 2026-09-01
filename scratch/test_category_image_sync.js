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

async function testCategoryLiveSync() {
  console.log('====================================================');
  console.log(' End-to-End Image Sync Test (Commit 22a633c1)');
  console.log('====================================================');

  console.log('\n[1] Logging into /admin/login...');
  const loginGet = await makeRequest('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginPost = await makeRequest('/admin/login', 'POST', {
    email: 'admin@bongshaihousing.com',
    password: '@Noldair_9361#',
    _csrf: csrf
  });
  console.log(`  Login status: ${loginPost.statusCode}`);

  console.log('\n[2] Locating BH-SB-301 in admin products...');
  const searchRes = await makeRequest('/admin/products?q=BH-SB-301');
  const editMatch = searchRes.body.match(/\/admin\/products\/(\d+)\/edit/);
  if (!editMatch) throw new Error('BH-SB-301 not found');
  const productId = editMatch[1];
  console.log(`  Product BH-SB-301 ID: ${productId}`);

  console.log('\n[3] Reading current product data...');
  const editPage = await makeRequest(`/admin/products/${productId}/edit`);
  const formCsrf = extractCsrf(editPage.body);

  function getVal(name) {
    const m = editPage.body.match(new RegExp(`name=["']${name}["'][^>]*value=["']([^"']*)["']`, 'i'));
    return m ? m[1] : '';
  }
  function getText(name) {
    const m = editPage.body.match(new RegExp(`<textarea[^>]*name=["']${name}["'][^>]*>([\\s\\S]*?)<\\/textarea>`, 'i'));
    return m ? m[1].trim() : '';
  }
  function getSelect(name) {
    const m = editPage.body.match(new RegExp(`<select[^>]*name=["']${name}["'][\\s\\S]*?<option[^>]*value=["']([^"']*)["'][^>]*selected`, 'i'));
    return m ? m[1] : '';
  }

  const categoryId = getSelect('category_id');
  const modelNumber = getVal('model_number');
  const slug = getVal('slug');
  const originalMainImage = getVal('main_image');
  const title = getVal('title');
  const description = getText('description');
  const pricePerSqft = getVal('price_per_sqft');
  const fixedPrice = getVal('fixed_price');
  const totalFloorArea = getVal('total_floor_area');

  console.log(`  Current main_image: ${originalMainImage}`);

  const testImageVal = 'images/products/Model No-BH-SB-301-live-sync-test.webp';
  console.log(`\n[4] Updating main_image to: ${testImageVal}...`);
  const updatePayload = {
    _csrf: formCsrf,
    category_id: categoryId,
    model_number: modelNumber,
    slug: slug,
    title: title,
    description: description,
    price_per_sqft: pricePerSqft,
    fixed_price: fixedPrice,
    total_floor_area: totalFloorArea,
    main_image: testImageVal,
    published: 'on'
  };

  const updateRes = await makeRequest(`/admin/products/${productId}`, 'POST', updatePayload);
  console.log(`  Update POST status: ${updateRes.statusCode} -> ${updateRes.headers.location}`);

  console.log('  Waiting 4 seconds for liveSiteSync.js to write category page snapshot...');
  await new Promise(r => setTimeout(r, 4000));

  console.log('\n[5] Fetching Category Page https://bongshaihousing.com/simplex-steel-building.html...');
  const catRes = await makeRequest(`/simplex-steel-building.html?cb=${Date.now()}`);
  const testImgFound = catRes.body.includes(testImageVal);
  console.log(`  Result: Image "${testImageVal}" found on live category page: ${testImgFound}`);

  console.log('\n[6] Reverting main_image back to original...');
  const editPage2 = await makeRequest(`/admin/products/${productId}/edit`);
  const formCsrf2 = extractCsrf(editPage2.body);
  const revertPayload = {
    ...updatePayload,
    _csrf: formCsrf2,
    main_image: originalMainImage
  };
  await makeRequest(`/admin/products/${productId}`, 'POST', revertPayload);
  await new Promise(r => setTimeout(r, 4000));

  const catRes2 = await makeRequest(`/simplex-steel-building.html?cb=${Date.now()}`);
  const revertedFound = catRes2.body.includes(originalMainImage);
  console.log(`  Revert confirmed on live category page: ${revertedFound}`);

  if (testImgFound && revertedFound) {
    console.log('\n>>> LIVE SITE SYNC END-TO-END IMAGE TEST: SUCCESSFUL! <<<');
  } else {
    console.log('\n>>> LIVE SITE SYNC TEST FAILED! <<<');
  }
}

testCategoryLiveSync().catch(console.error);
