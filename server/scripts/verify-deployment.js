// One-off (but reusable) live-site verification for the customer-portal
// deploy: crash-loop check, DB schema check, and a full functional pass
// through submit-inquiry -> auto-login -> dashboard -> set-password ->
// logout -> login. Uses the app's own shared db connection (server/lib/db)
// instead of a hand-rolled mysql2 client, so there is nothing here to
// hardcode - it reads the same DB credentials the live app already uses
// from its own environment.
const https = require('https');
const db = require('../lib/db');

function extractCookies(setCookieHeaders, existingCookies = '') {
  const cookieMap = {};
  if (existingCookies) {
    existingCookies.split(';').forEach(c => {
      const [k, ...v] = c.trim().split('=');
      if (k) cookieMap[k] = v.join('=');
    });
  }
  if (setCookieHeaders) {
    const list = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    list.forEach(c => {
      const part = c.split(';')[0].trim();
      const [k, ...v] = part.split('=');
      if (k) cookieMap[k] = v.join('=');
    });
  }
  return Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');
}

function get(url, cookies = '') {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ...(cookies ? { 'Cookie': cookies } : {})
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

function post(url, postData, cookies = '', contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ...(cookies ? { 'Cookie': cookies } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function extractCsrf(html) {
  const match = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

const SITE = process.env.VERIFY_BASE_URL || 'https://bongshaihousing.com';

async function verifyAll() {
  console.log('========================================================');
  console.log('  CHECK 1: APP CRASH-LOOP & STATUS CODE VERIFICATION');
  console.log('========================================================');
  const homeRes = await get(`${SITE}/`);
  console.log(`GET ${SITE}/ -> Status:`, homeRes.statusCode, 'Body length:', homeRes.body.length);

  const adminRes = await get(`${SITE}/admin/login`);
  console.log(`GET ${SITE}/admin/login -> Status:`, adminRes.statusCode, 'Body length:', adminRes.body.length);

  console.log('\n========================================================');
  console.log('  CHECK 2: DB MIGRATION & SCHEMA VERIFICATION');
  console.log('========================================================');
  const customerCols = await db('customers').columnInfo();
  console.log('`customers` table columns in live DB:', Object.keys(customerCols));

  const leadsCols = await db('leads').columnInfo();
  console.log('`leads.customer_id` column present:', 'customer_id' in leadsCols);

  const ordersCols = await db('orders').columnInfo();
  console.log('`orders.customer_id` column present:', 'customer_id' in ordersCols);

  console.log('\n========================================================');
  console.log('  CHECK 3: FUNCTIONAL TEST (LIVE CONTACT & CUSTOMER PORTAL)');
  console.log('========================================================');
  const testTimestamp = Date.now();
  const testName = 'QA Test ' + testTimestamp;
  const testPhone = '01700000000';
  const testEmail = 'qa.test.' + testTimestamp + '@example.com';

  const submitPayload = JSON.stringify({
    name: testName,
    phone: testPhone,
    email: testEmail,
    district: 'Dhaka',
    model: 'General Inquiry',
    floor_area: '2000',
    message: 'Automated QA test inquiry - please ignore.',
  });

  const submitRes = await post(`${SITE}/send_email.php`, submitPayload);
  console.log('3a. POST /send_email.php -> Status:', submitRes.statusCode, 'Response:', submitRes.body);
  const submitJson = JSON.parse(submitRes.body);
  console.log('    Response has dashboardUrl (/my-project):', submitJson.dashboardUrl === '/my-project');

  let sessionCookie = extractCookies(submitRes.headers['set-cookie']);
  console.log('    Received session cookie:', !!sessionCookie);

  const myProjectRes = await get(`${SITE}/my-project`, sessionCookie);
  sessionCookie = extractCookies(myProjectRes.headers['set-cookie'], sessionCookie);
  console.log('3b. GET /my-project with session -> Status:', myProjectRes.statusCode);
  const csrfToken = extractCsrf(myProjectRes.body);
  console.log('    Dashboard shows the submitted inquiry:', myProjectRes.body.includes(testName) || myProjectRes.body.includes(testPhone));
  console.log('    Dashboard shows "Secure Your Account" card:', myProjectRes.body.includes('Secure Your Account'));

  const testPass = 'QaTestPass2026!';
  const setupForm = `_csrf=${encodeURIComponent(csrfToken)}&password=${encodeURIComponent(testPass)}&confirm_password=${encodeURIComponent(testPass)}`;
  const setupRes = await post(`${SITE}/my-project/set-password`, setupForm, sessionCookie, 'application/x-www-form-urlencoded');
  console.log('3c. POST /my-project/set-password -> Status:', setupRes.statusCode, 'Location:', setupRes.headers['location']);

  const logoutForm = `_csrf=${encodeURIComponent(csrfToken)}`;
  await post(`${SITE}/my-project/logout`, logoutForm, sessionCookie, 'application/x-www-form-urlencoded');

  const loginPageRes = await get(`${SITE}/my-project/login.html`);
  let loginCookie = extractCookies(loginPageRes.headers['set-cookie']);
  const loginCsrf = extractCsrf(loginPageRes.body);

  const loginForm = `_csrf=${encodeURIComponent(loginCsrf)}&phone=${encodeURIComponent(testPhone)}&password=${encodeURIComponent(testPass)}`;
  const loginRes = await post(`${SITE}/my-project/login.html`, loginForm, loginCookie, 'application/x-www-form-urlencoded');
  loginCookie = extractCookies(loginRes.headers['set-cookie'], loginCookie);
  console.log('    POST /my-project/login.html -> Status:', loginRes.statusCode, 'Location:', loginRes.headers['location']);

  const loginDashRes = await get(`${SITE}/my-project`, loginCookie);
  console.log('    GET /my-project after re-login -> Status:', loginDashRes.statusCode);
  console.log('    Re-login dashboard shows customer name/phone:', loginDashRes.body.includes(testName) || loginDashRes.body.includes(testPhone));

  console.log('\n========================================================');
  console.log('  CHECK 4: EXISTING ORDERS INTEGRITY');
  console.log('========================================================');
  const orders = await db('orders').select('id', 'customer_name', 'customer_phone', 'customer_id', 'status').limit(3);
  console.table(orders);

  console.log('\n========================================================');
  console.log('  CHECK 5: CLEANUP TEST DATA');
  console.log('========================================================');
  const delLeads = await db('leads').where({ phone: testPhone }).orWhere({ name: testName }).del();
  console.log('Deleted test leads:', delLeads);
  const delCust = await db('customers').where({ phone: testPhone }).orWhere({ name: testName }).del();
  console.log('Deleted test customers:', delCust);

  await db.destroy();
  console.log('\nVerification pass complete.');
}

verifyAll().catch((e) => { console.error('Verification error:', e); process.exit(1); });
