const { chromium } = require('playwright');
const BASE = 'https://test.bongshaihousing.com';
const PHONE = '+8801781636613';
const PASS = process.env.AGENT_PASSWORD;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  console.log('--- submit a new lead via POST /api/leads ---');
  const testPhone = '013' + Math.floor(10000000 + Math.random() * 89999999);
  const apiResp = await page.request.post(`${BASE}/api/leads`, {
    data: { name: 'Test Lead E2E', phone: testPhone, district: 'Dhaka', source: 'facebook', product: 'Duplex Steel Building', sft: '1200', budget: '2000000', message: 'e2e test', site: 'bongshaihousing.com' },
  });
  console.log('POST /api/leads status:', apiResp.status(), JSON.stringify(await apiResp.json()));

  console.log('\n--- duplicate check: same phone again within 24h ---');
  const dupResp = await page.request.post(`${BASE}/api/leads`, {
    data: { name: 'Test Lead E2E', phone: testPhone, district: 'Dhaka', source: 'facebook', site: 'bongshaihousing.com' },
  });
  console.log('duplicate POST status:', dupResp.status(), JSON.stringify(await dupResp.json()));

  console.log('\n--- invalid phone rejected ---');
  const badResp = await page.request.post(`${BASE}/api/leads`, {
    data: { name: 'Bad Phone', phone: '12345', site: 'bongshaihousing.com' },
  });
  console.log('invalid phone POST status:', badResp.status(), JSON.stringify(await badResp.json()));

  console.log('\n--- login as admin agent ---');
  await page.goto(`${BASE}/agent/login.html`, { waitUntil: 'load', timeout: 60000 });
  const csrf = await page.$eval('input[name="_csrf"]', (el) => el.value);
  await page.request.post(`${BASE}/agent/login`, { form: { phone: PHONE, password: PASS, _csrf: csrf }, maxRedirects: 0, timeout: 30000 });

  console.log('\n--- find the new lead on /agent/all-leads ---');
  await page.goto(`${BASE}/agent/all-leads?q=${testPhone}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  const found = await page.evaluate(() => {
    const row = document.querySelector('tbody tr');
    return row ? row.innerText.replace(/\s+/g, ' ').trim() : null;
  });
  console.log('row found:', found);

  console.log('\n--- log a touch on it (via /agent/today, since it should be a fresh uncontacted lead) ---');
  await page.goto(`${BASE}/agent/today`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  const rowsBefore = await page.evaluate(() => document.querySelectorAll('.today-row').length);
  console.log('rows on today screen before touch:', rowsBefore);

  const touchForm = await page.$('.touch-form');
  if (touchForm) {
    const action = await touchForm.getAttribute('action');
    console.log('found a touch form for:', action);
    const noteInput = await touchForm.$('input[name="note"]');
    if (noteInput) {
      await noteInput.fill('e2e touch test');
      await Promise.all([page.waitForNavigation({ timeout: 30000 }), touchForm.evaluate((f) => f.querySelector('button[type="submit"]').click())]);
      console.log('after touch, landed on:', page.url());
    }
  } else {
    console.log('no touch form found on today screen (lead may not be in today\'s queue yet)');
  }

  console.log('\n--- change status to কোটেশন দেওয়া and verify followup dates reset ---');
  await page.goto(`${BASE}/agent/all-leads?q=${testPhone}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(800);
  const statusFormExists = await page.$('form[action*="/status"]');
  if (statusFormExists) {
    await page.selectOption('form[action*="/status"] select[name="status"]', 'কোটেশন দেওয়া');
    await page.evaluate(() => {
      const el = document.querySelector('form[action*="/status"] input[name="quote_amount"]');
      if (el) { el.closest('span').hidden = false; el.value = '3500000'; }
    });
    await Promise.all([
      page.waitForNavigation({ timeout: 30000 }),
      page.click('form[action*="/status"] button[type="submit"]'),
    ]);
    console.log('after status change, landed on:', page.url());
  }

  await browser.close();
})();
