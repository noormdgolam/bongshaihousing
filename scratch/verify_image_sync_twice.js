const fs = require('fs');
const path = require('path');
const https = require('https');
const mysql = require('mysql2/promise');

if (!process.env.ADMIN_PASSWORD || !process.env.DB_PASSWORD) {
  throw new Error('ADMIN_PASSWORD and DB_PASSWORD env vars must be set - never hardcode live credentials in a committed script.');
}

const BASE_URL = 'https://bongshaihousing.com';
const ADMIN_EMAIL = 'admin@bongshaihousing.com';
const ADMIN_PASS = process.env.ADMIN_PASSWORD;

let cookies = [];

function makeHttpRequest(urlPath, options = {}, postBody = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...(options.headers || {})
    };

    if (cookies.length > 0) {
      headers['Cookie'] = cookies.join('; ');
    }

    if (postBody && !headers['Content-Length']) {
      headers['Content-Length'] = Buffer.isBuffer(postBody) ? postBody.length : Buffer.byteLength(postBody);
    }

    const req = https.request(url, {
      method: options.method || 'GET',
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

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
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

function buildMultipartFormData(fields, fileField) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const CRLF = '\r\n';
  const parts = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    parts.push(Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}` +
      `${value}${CRLF}`
    ));
  }

  if (fileField) {
    const { name, filename, contentType, data } = fileField;
    parts.push(Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${name}"; filename="${filename}"${CRLF}` +
      `Content-Type: ${contentType}${CRLF}${CRLF}`
    ));
    parts.push(data);
    parts.push(Buffer.from(CRLF));
  }

  parts.push(Buffer.from(`--${boundary}--${CRLF}`));
  const body = Buffer.concat(parts);

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body
  };
}

async function runVerification() {
  console.log('====================================================');
  console.log(' BH-TSB-101 Live Image Sync & Specifications Audit');
  console.log('====================================================\n');

  // 1. Get BH-TSB-101 ID from DB
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com',
    user: 'abongsha_housin',
    password: process.env.DB_PASSWORD,
    database: 'abongsha_bongshai_prod'
  });
  const [rows] = await conn.query("SELECT id, model_number, title, main_image, category_id, description FROM products WHERE model_number = 'BH-TSB-101'");
  const tsb = rows[0];
  console.log(`Found product ${tsb.model_number} (ID: ${tsb.id}), current main_image: ${tsb.main_image}`);
  await conn.end();

  // 2. Log in
  console.log('\n[Admin Auth] Logging in as admin...');
  const loginGet = await makeHttpRequest('/admin/login');
  const loginCsrf = extractCsrf(loginGet.body);
  const loginPost = await makeHttpRequest('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, `email=${encodeURIComponent(ADMIN_EMAIL)}&password=${encodeURIComponent(ADMIN_PASS)}&_csrf=${encodeURIComponent(loginCsrf)}`);
  console.log(`Login status: ${loginPost.statusCode} (Redirect: ${loginPost.headers.location || 'none'})`);

  // Prepare 2 distinct test images
  const samplePathA = path.join(__dirname, '..', 'images', 'projects', 'completed', 'asulia-dhaka.webp');
  const samplePathB = path.join(__dirname, '..', 'images', 'projects', 'completed', 'bodorgonj_rangpur_1784362445606.webp');
  
  const imgDataA = fs.readFileSync(samplePathA);
  const imgDataB = fs.readFileSync(samplePathB);

  // Helper to test an image upload and live check
  async function uploadAndVerify(stepNum, imgLabel, fileData, filename) {
    console.log(`\n====================================================`);
    console.log(`STEP ${stepNum}: Uploading ${imgLabel} (${filename})...`);
    console.log(`====================================================`);

    const editPage = await makeHttpRequest(`/admin/products/${tsb.id}/edit`);
    const editCsrf = extractCsrf(editPage.body);

    const formData = buildMultipartFormData({
      _csrf: editCsrf,
      model_number: tsb.model_number,
      title: tsb.title || 'Three-Story Building Model BH-TSB-101',
      category_id: String(tsb.category_id),
      published: '1',
      sort_order: '1',
    }, {
      name: 'main_image_file',
      filename,
      contentType: 'image/webp',
      data: fileData
    });

    const saveStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Sending POST /admin/products/${tsb.id}...`);
    const saveRes = await makeHttpRequest(`/admin/products/${tsb.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': formData.contentType
      }
    }, formData.body);
    console.log(`Save HTTP Status: ${saveRes.statusCode} -> ${saveRes.headers.location}`);

    // Poll live site every 1 second until new image appears (or 10s max)
    let productSrc = '';
    let categoryCardSrc = '';
    let secondsElapsed = 0;
    let hasCatSidebar = false;
    let specTableRowsCount = 0;

    for (let sec = 1; sec <= 10; sec++) {
      await new Promise(r => setTimeout(r, 1000));
      secondsElapsed = sec;
      const cb = Date.now();

      // Check product page
      const prodRes = await makeHttpRequest(`/bh-tsb-101.html?cb=${cb}`);
      hasCatSidebar = prodRes.body.includes('cat-sidebar');
      
      // Match hero image src
      const heroMatch = prodRes.body.match(/<img[^>]+alt=["'][^"']*BH-TSB-101[^"']*["'][^>]*src=["']([^"']+)["']/i) ||
                        prodRes.body.match(/<div class=["']reveal-left["'][^>]*>\s*<img[^>]+src=["']([^"']+)["']/i) ||
                        prodRes.body.match(/src=["'](uploads\/products\/[^"']+|images\/products\/[^"']+)["']/i);
      productSrc = heroMatch ? heroMatch[1] : '';

      // Match spec table rows
      const specRows = [...prodRes.body.matchAll(/<tr>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi)];
      specTableRowsCount = specRows.length;

      // Check category page (apartment-building.html)
      const catRes = await makeHttpRequest(`/apartment-building.html?cb=${cb}`);
      const cardMatch = catRes.body.match(/cardImage\([^)]*BH-TSB-101[^)]*\)|<img[^>]+alt=["'][^"']*BH-TSB-101[^"']*["'][^>]*src=["']([^"']+)["']/i) ||
                        catRes.body.match(/Model No-BH-TSB-101[\s\S]{0,500}?<img[^>]+src=["']([^"']+)["']/i);
      
      // Look for the product card containing BH-TSB-101
      const tsbCard = catRes.body.split('Model No-BH-TSB-101')[0];
      const lastImgInPrev = tsbCard ? tsbCard.match(/<img[^>]+src=["']([^"']+)["'][^>]*>$/i) || tsbCard.match(/<img[^>]+src=["']([^"']+)["']/g) : null;
      const tsbCardAfter = catRes.body.split('Model No-BH-TSB-101')[1];
      const afterMatch = tsbCardAfter ? tsbCardAfter.match(/src=["']([^"']+)["']/i) : null;
      
      const directCardImg = catRes.body.match(/BH-TSB-101[\s\S]*?src=["']([^"']+)["']/i) ||
                            catRes.body.match(/src=["']([^"']+)["'][^>]*alt=["'][^"']*BH-TSB-101/i);
      
      categoryCardSrc = directCardImg ? directCardImg[1] : (heroMatch ? heroMatch[1] : '');

      if (productSrc && !productSrc.includes('old_val_placeholder')) {
        break;
      }
    }

    console.log(`\n>>> STEP ${stepNum} RESULTS (${imgLabel}):`);
    console.log(`  - Time to reflect live: ${secondsElapsed} second(s)`);
    console.log(`  - Product page (bh-tsb-101.html) <img> src: "${productSrc}"`);
    console.log(`  - Category page (apartment-building.html) card src: "${categoryCardSrc}"`);
    console.log(`  - Contains "cat-sidebar": ${hasCatSidebar}`);
    console.log(`  - Building Specifications Table Rows: ${specTableRowsCount} rows found`);

    return {
      productSrc,
      categoryCardSrc,
      secondsElapsed,
      hasCatSidebar,
      specTableRowsCount
    };
  }

  // Run Step 1 & 2: Upload Image A
  const resA = await uploadAndVerify(1, 'Image A', imgDataA, 'test_image_a_asulia.webp');

  // Run Step 3 & 4: Upload Image B
  const resB = await uploadAndVerify(2, 'Image B', imgDataB, 'test_image_b_wave.webp');

  console.log('\n====================================================');
  console.log(' FINAL AUDIT SUMMARY');
  console.log('====================================================');
  console.log(`Image A src: ${resA.productSrc} (${resA.secondsElapsed}s)`);
  console.log(`Image B src: ${resB.productSrc} (${resB.secondsElapsed}s)`);
  console.log(`Distinct image sources: ${resA.productSrc !== resB.productSrc}`);
  console.log(`Cat-sidebar intact: ${resA.hasCatSidebar && resB.hasCatSidebar}`);
  console.log(`Spec table rows: Step 1 = ${resA.specTableRowsCount}, Step 2 = ${resB.specTableRowsCount}`);
  console.log('====================================================\n');
}

runVerification().catch(console.error);
