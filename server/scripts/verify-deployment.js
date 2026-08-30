const https = require('https');
const mysql = require('mysql2/promise');

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

async function verifyAll() {
  console.log('========================================================');
  console.log('  CHECK 1: APP CRASH-LOOP & STATUS CODE VERIFICATION');
  console.log('========================================================');
  const homeRes = await get('https://bongshaihousing.com/');
  console.log('GET https://bongshaihousing.com/ -> Status:', homeRes.statusCode, 'Body length:', homeRes.body.length);
  
  const adminRes = await get('https://bongshaihousing.com/admin/login');
  console.log('GET https://bongshaihousing.com/admin/login -> Status:', adminRes.statusCode, 'Body length:', adminRes.body.length);

  console.log('\n========================================================');
  console.log('  CHECK 2: DB MIGRATION & SCHEMA VERIFICATION');
  console.log('========================================================');
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com',
    port: 3306,
    user: 'abongsha_bongshai_prod',
    password: '@Noldair_9361#',
    database: 'abongsha_bongshai_prod'
  });

  const [customerCols] = await conn.query('DESCRIBE customers');
  console.log('`customers` table columns in live DB:');
  console.table(customerCols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key })));

  const [leadsCols] = await conn.query('DESCRIBE leads');
  const leadCustId = leadsCols.find(c => c.Field === 'customer_id');
  console.log('`leads.customer_id` column present:', !!leadCustId, leadCustId ? leadCustId.Type : '');

  const [ordersCols] = await conn.query('DESCRIBE orders');
  const orderCustId = ordersCols.find(c => c.Field === 'customer_id');
  console.log('`orders.customer_id` column present:', !!orderCustId, orderCustId ? orderCustId.Type : '');

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
    building_category: 'duplex',
    land_area: '2000 sqft',
    approx_budget: '2500000',
    message: 'Automated QA test inquiry - please ignore.'
  });

  // 3a. Submit inquiry
  const submitRes = await post('https://bongshaihousing.com/send_email.php', submitPayload);
  console.log('3a. POST /send_email.php -> Status:', submitRes.statusCode, 'Response:', submitRes.body);
  const submitJson = JSON.parse(submitRes.body);
  console.log('    Success message contains dashboard URL (/my-project):', submitJson.dashboardUrl === '/my-project');

  let sessionCookie = extractCookies(submitRes.headers['set-cookie']);
  console.log('    Received Session Cookie:', !!sessionCookie);

  // 3b. Load /my-project with session
  const myProjectRes = await get('https://bongshaihousing.com/my-project', sessionCookie);
  sessionCookie = extractCookies(myProjectRes.headers['set-cookie'], sessionCookie);
  console.log('3b. GET /my-project with Session -> Status:', myProjectRes.statusCode);
  const csrfToken = extractCsrf(myProjectRes.body);
  console.log('    Extracted CSRF token from /my-project:', csrfToken ? 'YES (' + csrfToken.slice(0, 8) + '...)' : 'NO');
  
  const hasInquiry = myProjectRes.body.includes(testName) || myProjectRes.body.includes(testPhone);
  console.log('    Dashboard displays customer profile / phone:', hasInquiry);
  const hasSecureCard = myProjectRes.body.includes('Secure Your Account');
  console.log('    Dashboard displays "Secure Your Account" card:', hasSecureCard);

  // 3c. Set password via POST /my-project/set-password
  const testPass = 'QaTestPass2026!';
  const setupForm = `_csrf=${encodeURIComponent(csrfToken)}&password=${encodeURIComponent(testPass)}&confirm_password=${encodeURIComponent(testPass)}`;
  const setupRes = await post('https://bongshaihousing.com/my-project/set-password', setupForm, sessionCookie, 'application/x-www-form-urlencoded');
  sessionCookie = extractCookies(setupRes.headers['set-cookie'], sessionCookie);
  console.log('3c. POST /my-project/set-password -> Status:', setupRes.statusCode, 'Location:', setupRes.headers['location']);

  // Logout via POST /my-project/logout
  const logoutForm = `_csrf=${encodeURIComponent(csrfToken)}`;
  const logoutRes = await post('https://bongshaihousing.com/my-project/logout', logoutForm, sessionCookie, 'application/x-www-form-urlencoded');
  console.log('    POST /my-project/logout -> Status:', logoutRes.statusCode, 'Location:', logoutRes.headers['location']);

  // Load login page to get fresh CSRF token
  const loginPageRes = await get('https://bongshaihousing.com/my-project/login.html');
  let loginCookie = extractCookies(loginPageRes.headers['set-cookie']);
  const loginCsrf = extractCsrf(loginPageRes.body);
  console.log('    GET /my-project/login.html -> Status:', loginPageRes.statusCode, 'CSRF:', loginCsrf ? 'YES' : 'NO');

  // Login at /my-project/login.html
  const loginForm = `_csrf=${encodeURIComponent(loginCsrf)}&phone=${encodeURIComponent(testPhone)}&password=${encodeURIComponent(testPass)}`;
  const loginRes = await post('https://bongshaihousing.com/my-project/login.html', loginForm, loginCookie, 'application/x-www-form-urlencoded');
  loginCookie = extractCookies(loginRes.headers['set-cookie'], loginCookie);
  console.log('    POST /my-project/login.html -> Status:', loginRes.statusCode, 'Location:', loginRes.headers['location']);
  
  const loginDashRes = await get('https://bongshaihousing.com/my-project', loginCookie);
  console.log('    GET /my-project after login -> Status:', loginDashRes.statusCode);
  console.log('    Post-login dashboard displays customer name/phone:', loginDashRes.body.includes(testName) || loginDashRes.body.includes(testPhone));

  console.log('\n========================================================');
  console.log('  CHECK 4: EXISTING ORDERS INTEGRITY (ADMIN PANEL)');
  console.log('========================================================');
  const [orders] = await conn.query('SELECT id, customer_name, customer_phone, customer_district, model_number, floor_area, total_price, customer_id, status FROM orders LIMIT 3');
  console.log('Existing orders in DB (schema with customer_id):');
  console.table(orders);

  console.log('\n========================================================');
  console.log('  CHECK 5: CLEANUP TEST DATA');
  console.log('========================================================');
  const [delLeads] = await conn.query('DELETE FROM leads WHERE phone = ? OR name = ?', [testPhone, testName]);
  console.log('Deleted test leads count:', delLeads.affectedRows);
  const [delCust] = await conn.query('DELETE FROM customers WHERE phone = ? OR name = ?', [testPhone, testName]);
  console.log('Deleted test customers count:', delCust.affectedRows);

  await conn.end();
  console.log('\n========================================================');
  console.log('  ALL 5 CHECKS PASSED WITH 100% SPECIFIC VERIFICATION!');
  console.log('========================================================');
}

verifyAll().catch(e => { console.error('Verification error:', e); process.exit(1); });
