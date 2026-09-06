// Adds a "Cost Calculator" entry to the main nav through the admin dashboard.
//
// The two Bangla calculators are currently reachable only via interactive-tools.html,
// which is itself linked from a single button near the bottom of projects.html - four
// unsignposted clicks from the homepage. interactive-tools.html is a real hub page
// (its "Cost Calculators" section links both), so pointing the nav at it exposes both
// calculators with one item rather than crowding the header with two.
//
// Placed straight after Products, where someone pricing a build is already looking.
//
//   ADMIN_PASSWORD=... node scratch/admin_add_tools_nav.js [--apply]
const { chromium } = require('playwright');

const BASE = process.env.ADMIN_BASE || 'https://bongshaihousing.com';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;
const APPLY = process.argv.includes('--apply');

const NEW_ITEM = {
  label: 'Cost Calculator',
  url: 'interactive-tools.html',
  item_type: 'link',
  icon: '',
  target: '_self',
  sort_order: '3',            // after Products (2); the rest shift down visually
  visible: 'on',
  parent_id: '',
};

if (!PASS) { console.error('ADMIN_PASSWORD not set'); process.exit(1); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('input[name="email"]', { timeout: 30000 });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  if (/\/admin\/login/.test(page.url())) { console.error('login failed'); await browser.close(); process.exit(1); }
  console.log('logged in');

  await page.goto(`${BASE}/admin/nav-menu`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1000);

  const already = await page.evaluate(() => /Cost Calculator/i.test(document.body.innerText));
  if (already) { console.log('a "Cost Calculator" item already exists - nothing to do'); await browser.close(); return; }

  if (!APPLY) {
    console.log('DRY RUN - would create:', JSON.stringify(NEW_ITEM));
    console.log('re-run with --apply');
    await browser.close();
    return;
  }

  // Post from the nav-menu page so the CSRF token is the live one for this session.
  const result = await page.evaluate((item) => {
    const token = document.querySelector('input[name="_csrf"]');
    if (!token) return 'no csrf token on page';
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = '/admin/nav-menu';
    const add = (n, v) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.appendChild(i); };
    add('_csrf', token.value);
    Object.entries(item).forEach(([k, v]) => add(k, v));
    document.body.appendChild(f);
    f.submit();
    return 'submitted';
  }, NEW_ITEM);
  console.log('create:', result);
  await page.waitForTimeout(3000);

  const listed = await page.evaluate(() => /Cost Calculator/i.test(document.body.innerText));
  console.log('appears in nav list:', listed, '| url:', page.url().replace(BASE, ''));

  await browser.close();
})();
