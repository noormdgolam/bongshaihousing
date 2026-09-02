const https = require('https');
const querystring = require('querystring');

const BASE_URL = 'https://bongshaihousing.com';
const ADMIN_EMAIL = 'admin@bongshaihousing.com';
const ADMIN_PASS = 'zk2bGgqB_+a8Zk8T98Un';

let cookies = [];

function buildMultipart(fields, boundary) {
  const parts = [];
  for (const [key, val] of Object.entries(fields)) {
    if (val === undefined || val === null) continue;
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`);
  }
  parts.push(`--${boundary}--\r\n`);
  return Buffer.from(parts.join(''), 'utf-8');
}

function makeReq(urlPath, method = 'GET', data = null, headers = {}, isMultipart = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const reqHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', ...headers };
    if (cookies.length) reqHeaders['Cookie'] = cookies.join('; ');

    let postBody = null;
    if (data) {
      if (isMultipart) {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        postBody = buildMultipart(data, boundary);
        reqHeaders['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
        reqHeaders['Content-Length'] = postBody.length;
      } else {
        postBody = typeof data === 'object' ? querystring.stringify(data) : data;
        reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        reqHeaders['Content-Length'] = Buffer.byteLength(postBody);
      }
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
  const m = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i) ||
            html.match(/name=["']_csrf["']\s+value=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

async function testProjectSave() {
  console.log('1. Logging in...');
  const loginGet = await makeReq('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  const loginRes = await makeReq('/admin/login', 'POST', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    _csrf: csrf
  });
  console.log('Login status:', loginRes.status);

  console.log('2. GET edit page...');
  const editGet = await makeReq('/admin/projects/2/edit');
  const editCsrf = extractCsrf(editGet.body);
  console.log('Edit CSRF:', editCsrf);

  console.log('3. Submitting edit...');
  const newDesc = "Test description updated at " + Date.now();
  const saveRes = await makeReq('/admin/projects/2', 'POST', {
    _csrf: editCsrf,
    title: 'Chotrogram',
    slug: 'project-chotrogram.html',
    location: 'Chotrogram',
    description: newDesc,
    status_label: 'Completed Project',
    published: 'on',
    sort_order: '0'
  }, {}, true);
  console.log('Save response:', saveRes.status, saveRes.headers.location);

  console.log('4. Waiting 3s...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('5. Curled live page:');
  const liveRes = await makeReq('/project-chotrogram.html?cb=' + Date.now());
  const idx = liveRes.body.indexOf('Chotrogram</h2>');
  console.log(liveRes.body.substring(idx, idx + 300));
}

testProjectSave().catch(console.error);
