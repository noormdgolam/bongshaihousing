const https = require('https');
if (!process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD env var not set - never hardcode the live DB password in a committed script.');
}
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

async function run() {
  console.log('====================================================');
  console.log(' Bongshai Housing - Live Site Sync Functional Test');
  console.log(' Target Product: BH-CB-901 (bh-cb-901.html)');
  console.log('====================================================');

  console.log('\n[1] Authenticating at /admin/login...');
  const loginGet = await makeRequest('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginPost = await makeRequest('/admin/login', 'POST', {
    email: 'admin@bongshaihousing.com',
    password: process.env.DB_PASSWORD,
    _csrf: csrf
  });
  console.log(`  Login HTTP ${loginPost.statusCode} -> ${loginPost.headers.location || 'none'}`);

  if (loginPost.statusCode !== 302 && loginPost.statusCode !== 303) {
    throw new Error('Failed to authenticate');
  }

  console.log('\n[2] Searching for BH-CB-901 in /admin/products?q=BH-CB-901...');
  const searchRes = await makeRequest('/admin/products?q=BH-CB-901');
  
  // Find table row with BH-CB-901
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  let matchRow;
  let targetEditUrl = null;
  let productId = null;

  while ((matchRow = rowRegex.exec(searchRes.body)) !== null) {
    const rowHtml = matchRow[1];
    if (rowHtml.includes('BH-CB-901') || rowHtml.includes('bh-cb-901')) {
      const editMatch = rowHtml.match(/\/admin\/products\/(\d+)\/edit/);
      if (editMatch) {
        productId = editMatch[1];
        targetEditUrl = `/admin/products/${productId}/edit`;
        break;
      }
    }
  }

  if (!productId) {
    throw new Error('Could not locate BH-CB-901 in admin products list');
  }

  console.log(`  Found Product BH-CB-901 ID: ${productId} (${targetEditUrl})`);

  console.log('\n[3] Fetching edit form data...');
  const editPage = await makeRequest(targetEditUrl);
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

  const categoryId = getSelect('category_id') || '1';
  const modelNumber = getVal('model_number') || 'BH-CB-901';
  const slug = getVal('slug') || 'bh-cb-901.html';
  const originalTitle = getVal('title') || 'BH-CB-901 | Concrete Building | Bongshai Housing';
  const originalDescription = getText('description');
  const pricePerSqft = getVal('price_per_sqft') || '2500';
  const fixedPrice = getVal('fixed_price') || '9600000';
  const totalFloorArea = getVal('total_floor_area') || '2500';
  const bedrooms = getVal('bedrooms') || '5';
  const bathrooms = getVal('bathrooms') || '4';
  const floors = getVal('floors') || '2';
  const originalMetaTitle = getVal('meta_title');
  const originalMetaDescription = getText('meta_description');

  console.log(`  Model: ${modelNumber}`);
  console.log(`  Slug: ${slug}`);
  console.log(`  Original Title: ${originalTitle}`);
  console.log(`  Original Meta Description: ${originalMetaDescription}`);

  console.log('\n[4] Checking Public Page https://bongshaihousing.com/bh-cb-901.html BEFORE edit...');
  const beforeHead = await makeRequest('/bh-cb-901.html', 'HEAD');
  console.log(`  Before Last-Modified Header: ${beforeHead.headers['last-modified']}`);

  const uniqueStamp = `[LiveSync Verified: ${new Date().toISOString()}]`;
  const modifiedTitle = `${uniqueStamp} BH-CB-901 | Concrete Building`;
  const modifiedMetaDescription = `${uniqueStamp} ${originalMetaDescription || originalDescription}`;

  console.log('\n[5] Updating Product Title & Meta Description via POST /admin/products/' + productId + '...');
  const updatePayload = {
    _csrf: formCsrf,
    category_id: categoryId,
    model_number: modelNumber,
    slug: slug,
    title: modifiedTitle,
    description: originalDescription,
    price_per_sqft: pricePerSqft,
    fixed_price: fixedPrice,
    total_floor_area: totalFloorArea,
    bedrooms: bedrooms,
    bathrooms: bathrooms,
    floors: floors,
    meta_title: modifiedTitle,
    meta_description: modifiedMetaDescription,
    published: 'on'
  };

  const updateRes = await makeRequest(`/admin/products/${productId}`, 'POST', updatePayload);
  console.log(`  Update POST Response: HTTP ${updateRes.statusCode} -> ${updateRes.headers.location || 'none'}`);

  console.log('  Waiting 3 seconds for in-process liveSiteSync.js to write snapshot to disk...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n[6] Inspecting Public Page https://bongshaihousing.com/bh-cb-901.html AFTER edit...');
  const afterHead = await makeRequest(`/bh-cb-901.html?cb=${Date.now()}`, 'HEAD');
  console.log(`  After Last-Modified Header: ${afterHead.headers['last-modified']}`);

  const afterBody = await makeRequest(`/bh-cb-901.html?cb=${Date.now()}`, 'GET');
  const markerFoundInHtml = afterBody.body.includes(uniqueStamp);
  console.log(`  Found new timestamp "${uniqueStamp}" in live HTML body: ${markerFoundInHtml}`);

  console.log('\n[7] Cleanly Reverting Title & Meta Description back to original...');
  const editPage2 = await makeRequest(targetEditUrl);
  const formCsrf2 = extractCsrf(editPage2.body);

  const revertPayload = {
    _csrf: formCsrf2,
    category_id: categoryId,
    model_number: modelNumber,
    slug: slug,
    title: originalTitle,
    description: originalDescription,
    price_per_sqft: pricePerSqft,
    fixed_price: fixedPrice,
    total_floor_area: totalFloorArea,
    bedrooms: bedrooms,
    bathrooms: bathrooms,
    floors: floors,
    meta_title: originalMetaTitle,
    meta_description: originalMetaDescription,
    published: 'on'
  };

  const revertRes = await makeRequest(`/admin/products/${productId}`, 'POST', revertPayload);
  console.log(`  Revert POST Response: HTTP ${revertRes.statusCode}`);

  await new Promise(r => setTimeout(r, 3000));

  const revertedBody = await makeRequest(`/bh-cb-901.html?cb=${Date.now()}`, 'GET');
  const markerCleaned = !revertedBody.body.includes(uniqueStamp);
  console.log(`  Confirmed marker removed from live HTML body after revert: ${markerCleaned}`);

  console.log('\n====================================================');
  console.log(' FINAL RESULT SUMMARY');
  console.log('====================================================');
  if (markerFoundInHtml && markerCleaned) {
    console.log(' STATUS: PASS (100% REAL-TIME LIVE SYNC VERIFIED)');
    console.log(` BEFORE LAST-MODIFIED : ${beforeHead.headers['last-modified']}`);
    console.log(` AFTER LAST-MODIFIED  : ${afterHead.headers['last-modified']}`);
    console.log(` BEFORE TITLE         : "${originalTitle}"`);
    console.log(` MODIFIED TITLE       : "${modifiedTitle}"`);
    console.log(` REVERTED TITLE       : "${originalTitle}"`);
    console.log(` BEFORE META DESC     : "${originalMetaDescription.substring(0, 100)}..."`);
    console.log(` MODIFIED META DESC   : "${modifiedMetaDescription.substring(0, 100)}..."`);
    console.log(` REVERTED META DESC   : "${originalMetaDescription.substring(0, 100)}..."`);
  } else {
    console.log(' STATUS: FAIL');
    console.log(` Marker Found on Edit: ${markerFoundInHtml}, Marker Cleaned on Revert: ${markerCleaned}`);
  }
  console.log('====================================================');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
