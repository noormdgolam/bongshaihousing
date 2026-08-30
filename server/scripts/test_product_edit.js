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

function extractFormFields(html) {
  const fields = {};
  // match all <input name="..." value="...">
  const inputRegex = /<input[^>]+name=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = inputRegex.exec(html)) !== null) {
    const tag = match[0];
    const name = match[1];
    const valMatch = tag.match(/value=["']([^"']*)["']/i);
    const checked = /checked/i.test(tag);
    const typeMatch = tag.match(/type=["']([^"']+)["']/i);
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'text';
    if (type === 'checkbox') {
      if (checked) fields[name] = 'on';
    } else {
      fields[name] = valMatch ? valMatch[1] : '';
    }
  }

  // match <textarea name="...">value</textarea>
  const textRegex = /<textarea[^>]+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/textarea>/gi;
  while ((match = textRegex.exec(html)) !== null) {
    fields[match[1]] = match[2];
  }

  // match <select name="...">selected option</select>
  const selectRegex = /<select[^>]+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi;
  while ((match = selectRegex.exec(html)) !== null) {
    const name = match[1];
    const optionsHtml = match[2];
    const optMatch = optionsHtml.match(/<option[^>]+value=["']([^"']*)["'][^>]*selected/i) ||
                     optionsHtml.match(/<option[^>]+selected[^>]*value=["']([^"']*)["']/i) ||
                     optionsHtml.match(/<option[^>]+value=["']([^"']*)["']/i);
    fields[name] = optMatch ? optMatch[1] : '';
  }

  return fields;
}

async function run() {
  console.log('Logging in to Admin...');
  const loginGet = await makeRequest('/admin/login');
  const csrf = extractCsrf(loginGet.body);
  await makeRequest('/admin/login', 'POST', {
    email: 'admin@bongshaihousing.com',
    password: '@Noldair_9361#',
    _csrf: csrf
  });

  console.log('Fetching Product #582 (BH-CH-413) edit form...');
  const editPage = await makeRequest('/admin/products/582/edit');
  const formFields = extractFormFields(editPage.body);
  console.log('Current form fields:', {
    title: formFields.title,
    model_number: formFields.model_number,
    category_id: formFields.category_id,
    slug: formFields.slug,
    price_per_sqft: formFields.price_per_sqft
  });

  const originalTitle = formFields.title;
  const testToken = ' [Live Sync Verified ' + Date.now() + ']';
  const newTitle = originalTitle.replace(/\s*\[Live Sync Verified \d+\]/, '') + testToken;
  formFields.title = newTitle;
  formFields._csrf = extractCsrf(editPage.body);

  console.log(`Submitting update with title: "${newTitle}"...`);
  const postRes = await makeRequest('/admin/products/582', 'POST', formFields);
  console.log(`POST /admin/products/582 -> HTTP ${postRes.statusCode} (Redirect: ${postRes.headers.location || 'none'})`);

  // Check public page
  const publicSlug = formFields.slug || 'bh-ch-413.html';
  const publicUrl = `/${publicSlug}?cb=${Date.now()}`;
  console.log(`Checking public page: ${publicUrl}...`);
  const publicRes = await makeRequest(publicUrl);
  console.log(`GET ${publicUrl} -> HTTP ${publicRes.statusCode}`);

  const hasToken = publicRes.body.includes(testToken);
  console.log(`\n========================================`);
  console.log(`Live reflection result: ${hasToken ? '✅ SUCCESS! Product changes reflect IMMEDIATELY on live site!' : '❌ FAILED to reflect'}`);
  console.log(`========================================\n`);

  if (!hasToken) {
    console.log('Snippet of public page title area:');
    const titleSnippet = publicRes.body.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
    console.log(titleSnippet ? titleSnippet[0] : 'No <h1> found');
  }

  // Revert back
  console.log('Reverting title back to original...');
  formFields.title = originalTitle.replace(/\s*\[Live Sync Verified \d+\]/, '');
  const revertGet = await makeRequest('/admin/products/582/edit');
  formFields._csrf = extractCsrf(revertGet.body);
  await makeRequest('/admin/products/582', 'POST', formFields);
  
  const finalCheck = await makeRequest(`/${publicSlug}?cb=${Date.now()}`);
  const clean = !finalCheck.body.includes(testToken);
  console.log(`Reversion verified: ${clean ? '✅ Cleaned up successfully' : '❌ Still has token'}`);
}

run().catch(console.error);
