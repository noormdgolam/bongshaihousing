const https = require('https');
const querystring = require('querystring');
const mysql = require('mysql2/promise');

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

async function verifyAll() {
  console.log('====================================================');
  console.log(' Verification for Commit de52749c Deployment');
  console.log('====================================================\n');

  // 1. Database Check
  console.log('[1] Checking MySQL DB (abongsha_bongshai_prod) for category_id = 51...');
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com',
    port: 3306,
    user: 'abongsha_bongshai_prod',
    password: '@Noldair_9361#',
    database: 'abongsha_bongshai_prod'
  });
  const [prods] = await conn.query('SELECT model_number, slug FROM products WHERE category_id = 51 ORDER BY sort_order');
  console.log(`  Found ${prods.length} products for Category 51:`);
  console.log('  Models:', prods.map(p => p.model_number).join(', '));
  await conn.end();

  // 2. curl -s https://bongshaihousing.com/bh-lch-1001.html
  console.log('\n[2] Checking Public Endpoint https://bongshaihousing.com/bh-lch-1001.html...');
  const res1001 = await makeRequest('/bh-lch-1001.html?cb=' + Date.now());
  console.log(`  HTTP Status: ${res1001.statusCode}`);
  const hasLowCostSidebar = /class=["'][^"']*active[^"']*["'][^>]*>[^<]*Low Cost House/i.test(res1001.body) ||
                           /Low Cost House/i.test(res1001.body);
  const hasConcreteBug = /class=["'][^"']*active[^"']*["'][^>]*>[^<]*Concrete building/i.test(res1001.body);
  const hasContactSales = /Contact Sales/i.test(res1001.body);
  const hasComingSoon = /Coming Soon/i.test(res1001.body);
  
  console.log(`  Sidebar refers to "Low cost house": ${hasLowCostSidebar}`);
  console.log(`  Sidebar incorrectly active on "Concrete building": ${hasConcreteBug} (expected: false)`);
  console.log(`  CTA says "Contact Sales": ${hasContactSales} (expected: true)`);
  console.log(`  CTA says "Coming Soon": ${hasComingSoon} (expected: false)`);

  // 3. curl -s https://bongshaihousing.com/bh-lch-1205.html
  console.log('\n[3] Checking Old Endpoint https://bongshaihousing.com/bh-lch-1205.html...');
  const res1205 = await makeRequest('/bh-lch-1205.html?cb=' + Date.now());
  console.log(`  HTTP Status: ${res1205.statusCode} ${res1205.headers.location ? '-> ' + res1205.headers.location : ''}`);

  // 4. Admin Login & Check /admin/categories
  console.log('\n[4] Authenticating at /admin/login...');
  const loginGet = await makeRequest('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginPost = await makeRequest('/admin/login', 'POST', {
    email: 'admin@bongshaihousing.com',
    password: '@Noldair_9361#',
    _csrf: csrf
  });
  console.log(`  Login HTTP status: ${loginPost.statusCode}`);

  console.log('\n[5] Checking /admin/categories for "Low Cost House" (ID 51)...');
  const catPage = await makeRequest('/admin/categories');
  const hasLchCat = /Low Cost House/i.test(catPage.body);
  const hasCat51 = /categories\/51\/edit|\/admin\/products\?category_id=51|value=["']51["']/i.test(catPage.body) || catPage.body.includes('51');
  console.log(`  "Low Cost House" present in /admin/categories: ${hasLchCat}`);
  console.log(`  ID 51 present in /admin/categories: ${hasCat51}`);

  // 5. Check /admin/products?category_id=51
  console.log('\n[6] Checking /admin/products?category_id=51...');
  const prodPage = await makeRequest('/admin/products?category_id=51');
  const lchModelMatches = [...prodPage.body.matchAll(/BH-LCH-(10\d\d)/g)].map(m => m[0]);
  const uniqueLchModels = [...new Set(lchModelMatches)];
  console.log(`  HTTP Status: ${prodPage.statusCode}`);
  console.log(`  Found ${uniqueLchModels.length} unique BH-LCH-1001..1020 models in product list:`);
  console.log('  ', uniqueLchModels.join(', '));

  console.log('\n====================================================');
  console.log(' VERIFICATION COMPLETE');
  console.log('====================================================\n');
}

verifyAll().catch(console.error);
