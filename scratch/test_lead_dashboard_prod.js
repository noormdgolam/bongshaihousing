const { chromium } = require('playwright');
const BASE = 'https://bongshaihousing.com';
const PHONE = '+8801781636613';
const PASS = process.env.AGENT_PASSWORD;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // mobile-first, as spec'd
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  console.log('--- login ---');
  await page.goto(`${BASE}/agent/login.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[name="phone"], input[type="tel"]', { timeout: 30000 });
  const phoneField = await page.$('input[name="phone"]') || await page.$('input[type="tel"]');
  await phoneField.fill(PHONE);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  console.log('landed on:', page.url());
  if (!/\/agent\/today/.test(page.url())) { console.log('LOGIN/REDIRECT FAILED'); await browser.close(); process.exit(1); }

  console.log('\n--- আজকের কাজ screen ---');
  const todayInfo = await page.evaluate(() => ({
    title: document.title,
    hasStatsRow: !!document.querySelector('.agent-stats-row'),
    rowCount: document.querySelectorAll('.today-row').length,
    hasEmptyState: !!document.querySelector('.empty-state'),
  }));
  console.log(JSON.stringify(todayInfo));

  console.log('\n--- all leads screen ---');
  await page.goto(`${BASE}/agent/all-leads`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  const allInfo = await page.evaluate(() => ({
    title: document.title,
    filterBar: !!document.querySelector('.filter-bar'),
    tableRows: document.querySelectorAll('tbody tr').length,
    hasImportBox: !!document.querySelector('.import-box'),
  }));
  console.log(JSON.stringify(allInfo));

  console.log('\n--- settings screen (admin only) ---');
  await page.goto(`${BASE}/agent/settings`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(800);
  const settingsInfo = await page.evaluate(() => ({
    status: document.title,
    hasAdSpendField: !!document.querySelector('#ad_spend'),
    templateCount: document.querySelectorAll('textarea[name^="text_"]').length,
    agentRows: document.querySelectorAll('tbody tr').length,
  }));
  console.log(JSON.stringify(settingsInfo));

  console.log('\n--- CSV export ---');
  const csvResp = await page.request.get(`${BASE}/agent/all-leads/export.csv`);
  const csvText = await csvResp.text();
  console.log('status:', csvResp.status(), '| starts with BOM+header:', csvText.slice(0, 3).charCodeAt(0) === 0xFEFF, '| first line:', csvText.split('\n')[0].slice(0, 80));

  console.log('\n--- js errors so far ---');
  console.log(errs.length ? errs.join(' | ') : 'none');

  await browser.close();
})();
