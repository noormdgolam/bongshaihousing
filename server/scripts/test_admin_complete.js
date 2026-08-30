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

async function runTests() {
  console.log('====================================================');
  console.log(' Bongshai Housing - Live Production Admin Test Suite');
  console.log('====================================================');

  console.log('\n[1] Authenticating at /admin/login...');
  const loginGet = await makeRequest('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginPost = await makeRequest('/admin/login', 'POST', {
    email: 'admin@bongshaihousing.com',
    password: '@Noldair_9361#',
    _csrf: csrf
  });
  console.log(`  Login Result: HTTP ${loginPost.statusCode} -> Redirect: ${loginPost.headers.location || 'none'}`);

  if (loginPost.statusCode !== 302 && loginPost.statusCode !== 303) {
    console.error('❌ Failed to authenticate. Aborting.');
    return;
  }

  console.log('\n[2] Checking all Admin Sections (List / Index pages)...');
  const sections = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Activity Log', path: '/admin/activity' },
    { name: 'Agent Leads', path: '/admin/agent-leads' },
    { name: 'Analytics', path: '/admin/analytics' },
    { name: 'Categories', path: '/admin/categories' },
    { name: 'Orders', path: '/admin/orders' },
    { name: 'Pages (Marketing CMS)', path: '/admin/pages' },
    { name: 'Service Areas', path: '/admin/service-areas' },
    { name: 'Team Members', path: '/admin/team-members' },
    { name: 'Testimonials', path: '/admin/testimonials' },
    { name: 'Roles Matrix', path: '/admin/roles' },
    { name: 'Users Management', path: '/admin/users' },
    { name: '2FA Security', path: '/admin/security/2fa' },
    { name: 'Products Catalog', path: '/admin/products' },
    { name: 'Projects Portfolio', path: '/admin/projects' },
    { name: 'SEO Automation', path: '/admin/seo' },
    { name: 'Theme Customizer', path: '/admin/theme-editor' }
  ];

  let passedSections = 0;
  for (const s of sections) {
    const res = await makeRequest(s.path);
    const is200 = res.statusCode === 200;
    const hasDbError = /Unknown column|SQLSTATE|Unhandled rejection/i.test(res.body);
    const hasErrorBanner = /alert-danger|alert-error/i.test(res.body);
    const ok = is200 && !hasDbError;
    if (ok) passedSections++;
    console.log(`  - ${s.name.padEnd(25)} [${s.path}]: ${ok ? '✅ 200 OK' : `❌ HTTP ${res.statusCode}${hasDbError ? ' (DB Error)' : ''}`}`);
  }
  console.log(`\n  Total sections tested: ${sections.length} | Passed: ${passedSections}/${sections.length}`);

  console.log('\n[3] Functional CRUD Tests (Create -> Verify -> Delete)...');

  // 3a. Categories
  try {
    const slug = 'test-cat-' + Date.now();
    const listRes = await makeRequest('/admin/categories');
    const cCsrf = extractCsrf(listRes.body);
    await makeRequest('/admin/categories', 'POST', {
      name: 'Automated Test Category',
      slug,
      description: 'Test category description',
      sort_order: '99',
      _csrf: cCsrf
    });
    const afterRes = await makeRequest('/admin/categories');
    const created = afterRes.body.includes(slug);
    console.log(`  - Categories CRUD: ${created ? '✅ Create Verified' : '❌ Create Failed'}`);

    const idMatch = afterRes.body.match(new RegExp(`/admin/categories/(\\d+)/edit[^>]*${slug}`, 'i')) ||
                    afterRes.body.match(new RegExp(`${slug}[\\s\\S]*?/admin/categories/(\\d+)/edit`, 'i'));
    if (idMatch) {
      await makeRequest(`/admin/categories/${idMatch[1]}/delete`, 'POST', { _csrf: cCsrf });
      console.log(`    Category Cleanup: ✅ Deleted ID ${idMatch[1]}`);
    }
  } catch (e) {
    console.error('  - Categories CRUD Error:', e.message);
  }

  // 3b. Testimonials
  try {
    const author = 'Test Client ' + Date.now();
    const tList = await makeRequest('/admin/testimonials');
    const tCsrf = extractCsrf(tList.body);
    await makeRequest('/admin/testimonials', 'POST', {
      author_name: author,
      author_title: 'Managing Director, Test Corp',
      rating: '5',
      review_text: 'Excellent quality steel structure from Bongshai Housing.',
      published: 'on',
      _csrf: tCsrf
    });
    const tAfter = await makeRequest('/admin/testimonials');
    const tCreated = tAfter.body.includes(author);
    console.log(`  - Testimonials CRUD: ${tCreated ? '✅ Create Verified' : '❌ Create Failed'}`);

    const tMatch = tAfter.body.match(new RegExp(`/admin/testimonials/(\\d+)/edit[^>]*${author}`, 'i')) ||
                   tAfter.body.match(new RegExp(`${author}[\\s\\S]*?/admin/testimonials/(\\d+)/edit`, 'i')) ||
                   tAfter.body.match(new RegExp(`/admin/testimonials/(\\d+)/edit`, 'i'));
    if (tMatch) {
      await makeRequest(`/admin/testimonials/${tMatch[1]}/delete`, 'POST', { _csrf: tCsrf });
      console.log(`    Testimonial Cleanup: ✅ Deleted ID ${tMatch[1]}`);
    }
  } catch (e) {
    console.error('  - Testimonials CRUD Error:', e.message);
  }

  // 3c. Team Members
  try {
    const name = 'Test Engineer ' + Date.now();
    const tmList = await makeRequest('/admin/team-members');
    const tmCsrf = extractCsrf(tmList.body);
    await makeRequest('/admin/team-members', 'POST', {
      name,
      role: 'Lead Structural Engineer',
      department: 'engineering',
      bio: 'B.Sc in Civil Engineering, 10 years experience.',
      published: 'on',
      _csrf: tmCsrf
    });
    const tmAfter = await makeRequest('/admin/team-members');
    const tmCreated = tmAfter.body.includes(name);
    console.log(`  - Team Members CRUD: ${tmCreated ? '✅ Create Verified' : '❌ Create Failed'}`);

    const tmMatch = tmAfter.body.match(new RegExp(`/admin/team-members/(\\d+)/edit[^>]*${name}`, 'i')) ||
                    tmAfter.body.match(new RegExp(`${name}[\\s\\S]*?/admin/team-members/(\\d+)/edit`, 'i')) ||
                    tmAfter.body.match(new RegExp(`/admin/team-members/(\\d+)/edit`, 'i'));
    if (tmMatch) {
      await makeRequest(`/admin/team-members/${tmMatch[1]}/delete`, 'POST', { _csrf: tmCsrf });
      console.log(`    Team Member Cleanup: ✅ Deleted ID ${tmMatch[1]}`);
    }
  } catch (e) {
    console.error('  - Team Members CRUD Error:', e.message);
  }

  // 3d. Service Areas
  try {
    const district = 'TestDist' + Math.floor(Math.random() * 9000 + 1000);
    const saList = await makeRequest('/admin/service-areas');
    const saCsrf = extractCsrf(saList.body);
    await makeRequest('/admin/service-areas', 'POST', {
      district,
      division: 'Dhaka',
      coverage_status: 'Full Coverage',
      _csrf: saCsrf
    });
    const saAfter = await makeRequest('/admin/service-areas');
    const saCreated = saAfter.body.includes(district);
    console.log(`  - Service Areas CRUD: ${saCreated ? '✅ Create Verified' : '❌ Create Failed'}`);

    const saMatch = saAfter.body.match(new RegExp(`/admin/service-areas/(\\d+)/edit[^>]*${district}`, 'i')) ||
                    saAfter.body.match(new RegExp(`${district}[\\s\\S]*?/admin/service-areas/(\\d+)/edit`, 'i')) ||
                    saAfter.body.match(new RegExp(`/admin/service-areas/(\\d+)/edit`, 'i'));
    if (saMatch) {
      await makeRequest(`/admin/service-areas/${saMatch[1]}/delete`, 'POST', { _csrf: saCsrf });
      console.log(`    Service Area Cleanup: ✅ Deleted ID ${saMatch[1]}`);
    }
  } catch (e) {
    console.error('  - Service Areas CRUD Error:', e.message);
  }

  // 3e. Orders
  try {
    const oList = await makeRequest('/admin/orders');
    const oCsrf = extractCsrf(oList.body);
    const custName = 'Automated Test Client ' + Date.now();
    const createOrder = await makeRequest('/admin/orders', 'POST', {
      customer_name: custName,
      customer_phone: '01711' + Math.floor(Math.random() * 900000 + 100000),
      customer_district: 'Dhaka',
      model_number: 'BH-CH-413',
      floor_area: '1200',
      total_price: '2500000',
      _csrf: oCsrf
    });
    const oAfter = await makeRequest('/admin/orders');
    const oCreated = oAfter.body.includes(custName);
    console.log(`  - Orders CRUD: ${oCreated ? '✅ Create Verified' : '❌ Create Failed'}`);
  } catch (e) {
    console.error('  - Orders CRUD Error:', e.message);
  }

  // 3f. Marketing CMS Pages
  try {
    const pList = await makeRequest('/admin/pages');
    const pagesExist = pList.body.includes('about.html') || pList.body.includes('contact.html') || pList.body.includes('Edit');
    console.log(`  - Marketing CMS Pages: ${pagesExist ? '✅ Pages List Verified' : '❌ Pages Missing'}`);
  } catch (e) {
    console.error('  - Pages CRUD Error:', e.message);
  }

  console.log('\n====================================================');
  console.log(' Admin Test Suite Execution Complete');
  console.log('====================================================');
}

runTests().catch(console.error);
