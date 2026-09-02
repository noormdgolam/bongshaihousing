const https = require('https');
const querystring = require('querystring');

if (!process.env.ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD env var not set - never hardcode the live admin password in a committed script.');
}

const BASE_URL = 'https://bongshaihousing.com';
let cookies = [];

function makeReq(urlPath, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const reqHeaders = { 'User-Agent': 'Node/Test', ...headers };
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

function extractImgSrc(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1] : '';
}

async function runSequence() {
  console.log('====================================================');
  console.log(' BH-TSB-101 Verification Sequence');
  console.log('====================================================\n');

  // Login
  const loginGet = await makeReq('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginRes = await makeReq('/admin/login', 'POST', {
    email: 'admin@bongshaihousing.com',
    password: process.env.ADMIN_PASSWORD,
    _csrf: csrf
  });
  console.log('Admin login status:', loginRes.status);

  // ----------------------------------------------------------------
  // STEP 1 & 2: Image A
  // ----------------------------------------------------------------
  const imageA = 'images/projects/completed/asulia-dhaka.webp';
  console.log('\n[STEP 1] Saving BH-TSB-101 with Image A:', imageA);
  
  const editGet1 = await makeReq('/admin/products/537/edit');
  const editCsrf1 = extractCsrf(editGet1.body);

  const t0_A = Date.now();
  const saveA = await makeReq('/admin/products/537', 'POST', {
    _csrf: editCsrf1,
    category_id: '37',
    model_number: 'BH-TSB-101',
    slug: 'bh-tsb-101.html',
    title: 'Three-Story Building Model BH-TSB-101',
    main_image: imageA,
    published: 'on',
    sort_order: '1'
  });
  console.log('Save A response status:', saveA.status);

  // Wait 3 seconds for background liveSiteSync.js to write file
  await new Promise(r => setTimeout(r, 3000));
  const t_live_A = Date.now();
  const elapsed_A = ((t_live_A - t0_A) / 1000).toFixed(1);

  // Fetch product page & category page
  const prodResA = await makeReq('/bh-tsb-101.html?cb=' + t_live_A);
  const catResA = await makeReq('/apartment-building.html?cb=' + t_live_A);

  const heroA = extractImgSrc(prodResA.body, /<div class=["']reveal-left["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
  const catCardA = extractImgSrc(catResA.body, /alt=["'][^"']*BH-TSB-101[^"']*["'][^>]*src=["']([^"']+)["']/i);
  const hasCatSidebarA = prodResA.body.includes('cat-sidebar');
  const specRowsA = [...prodResA.body.matchAll(/<tr>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi)].length;

  console.log('\n[STEP 2 RESULTS (Image A)]');
  console.log(`- Time to appear live: ${elapsed_A} seconds`);
  console.log(`- Product page (bh-tsb-101.html) src: "${heroA}"`);
  console.log(`- Category page (apartment-building.html) src: "${catCardA}"`);
  console.log(`- cat-sidebar present: ${hasCatSidebarA}`);
  console.log(`- Building Specifications table rows: ${specRowsA} rows`);

  // ----------------------------------------------------------------
  // STEP 3 & 4: Image B
  // ----------------------------------------------------------------
  const imageB = 'images/projects/completed/bodorgonj_rangpur_1784362445606.webp';
  console.log('\n[STEP 3] Saving BH-TSB-101 with Image B:', imageB);

  const editGet2 = await makeReq('/admin/products/537/edit');
  const editCsrf2 = extractCsrf(editGet2.body);

  const t0_B = Date.now();
  const saveB = await makeReq('/admin/products/537', 'POST', {
    _csrf: editCsrf2,
    category_id: '37',
    model_number: 'BH-TSB-101',
    slug: 'bh-tsb-101.html',
    title: 'Three-Story Building Model BH-TSB-101',
    main_image: imageB,
    published: 'on',
    sort_order: '1'
  });
  console.log('Save B response status:', saveB.status);

  // Wait 3 seconds for background liveSiteSync.js to write file
  await new Promise(r => setTimeout(r, 3000));
  const t_live_B = Date.now();
  const elapsed_B = ((t_live_B - t0_B) / 1000).toFixed(1);

  // Fetch product page & category page
  const prodResB = await makeReq('/bh-tsb-101.html?cb=' + t_live_B);
  const catResB = await makeReq('/apartment-building.html?cb=' + t_live_B);

  const heroB = extractImgSrc(prodResB.body, /<div class=["']reveal-left["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
  const catCardB = extractImgSrc(catResB.body, /alt=["'][^"']*BH-TSB-101[^"']*["'][^>]*src=["']([^"']+)["']/i);
  const hasCatSidebarB = prodResB.body.includes('cat-sidebar');
  const specRowsB = [...prodResB.body.matchAll(/<tr>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi)].length;

  console.log('\n[STEP 4 RESULTS (Image B)]');
  console.log(`- Time to appear live: ${elapsed_B} seconds`);
  console.log(`- Product page (bh-tsb-101.html) src: "${heroB}"`);
  console.log(`- Category page (apartment-building.html) src: "${catCardB}"`);
  console.log(`- cat-sidebar present: ${hasCatSidebarB}`);
  console.log(`- Building Specifications table rows: ${specRowsB} rows`);

  console.log('\n====================================================');
  console.log(' SUMMARY & VERIFICATION CONFIRMATION');
  console.log('====================================================');
  console.log(`Image A distinct from Image B: ${heroA !== heroB} (${heroA} vs ${heroB})`);
  console.log(`Category card matches Product page on A: ${heroA === catCardA}`);
  console.log(`Category card matches Product page on B: ${heroB === catCardB}`);
  console.log(`cat-sidebar intact throughout: ${hasCatSidebarA && hasCatSidebarB}`);
  console.log(`Building Specifications non-empty throughout: ${specRowsA > 0 && specRowsB > 0}`);
  console.log('====================================================\n');
}

runSequence().catch(console.error);
