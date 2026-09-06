// Repairs the nav on the two calculator pages through the admin dashboard.
//
// They were rendered locally against the remote MySQL database, which turns out
// NOT to be the one production runs on - it's a stale parallel copy carrying a
// "Low-Cost Villa" category that production has never had, and a Low Cost House
// row whose landing_page_slug is empty (so its card fell back to lch-1301.html,
// a 404). Both leaked into the two pages' baked-in nav.
//
// The fix is to let the production app re-render the nav from its own database
// via /admin/nav-menu/sync-static, scoped with `only` to just these two files.
//
//   ADMIN_PASSWORD=... node scratch/admin_sync_calc_nav.js
const { chromium } = require('playwright');

const BASE = process.env.ADMIN_BASE || 'https://bongshaihousing.com';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;
const ONLY = 'construction-cost-calculator.html,land-registration-cost-calculator.html';

if (!PASS) { console.error('ADMIN_PASSWORD not set'); process.exit(1); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/admin/login`, { waitUntil: 'load', timeout: 60000 });
  await page.fill('input[name="email"], input[type="email"]', EMAIL);
  await page.fill('input[name="password"], input[type="password"]', PASS);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }).catch(() => {}),
    page.click('button[type="submit"], input[type="submit"]'),
  ]);
  if (/\/admin\/login/.test(page.url())) { console.error('login failed'); await browser.close(); process.exit(1); }
  console.log('logged in');

  // Post the sync from the nav-menu page itself so the CSRF token is the live one.
  await page.goto(`${BASE}/admin/nav-menu`, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  const submitted = await page.evaluate((only) => {
    const token = document.querySelector('input[name="_csrf"]');
    if (!token) return 'no csrf token on page';
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = '/admin/nav-menu/sync-static';
    const add = (n, v) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.appendChild(i); };
    add('_csrf', token.value);
    add('only', only);
    document.body.appendChild(f);
    f.submit();
    return 'submitted';
  }, ONLY);
  console.log('sync:', submitted);

  await page.waitForTimeout(4000);
  console.log('landed on:', page.url().replace(BASE, ''));

  await browser.close();
})();
