// Removes the Low-Cost Villa line through the admin dashboard rather than with
// raw DB deletes, so the actions land in activity_log the way any admin's would.
// The password comes from ADMIN_PASSWORD in the environment - never hardcode it,
// never log it.
//
//   ADMIN_PASSWORD=... node scratch/admin_remove_lcv.js [--apply]
const { chromium } = require('playwright');

const BASE = process.env.ADMIN_BASE || 'https://bongshaihousing.com';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;
const APPLY = process.argv.includes('--apply');

if (!PASS) { console.error('ADMIN_PASSWORD not set'); process.exit(1); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/admin/login`, { waitUntil: 'load', timeout: 60000 });
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"], input[name="password"]', PASS);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }).catch(() => {}),
    page.click('button[type="submit"], input[type="submit"]'),
  ]);
  await page.waitForTimeout(1200);
  if (/\/admin\/login/.test(page.url())) {
    console.error('login failed, still on', page.url());
    await browser.close();
    process.exit(1);
  }
  console.log('logged in ->', page.url());

  // --- find the LCV products through the products list, as an admin would ---
  await page.goto(`${BASE}/admin/products?search=LCV&per_page=100`, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  const rows = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('tr').forEach((tr) => {
      const t = tr.innerText || '';
      if (!/LCV-1\d\d/.test(t)) return;
      const editLink = tr.querySelector('a[href*="/admin/products/"]');
      const m = editLink && editLink.getAttribute('href').match(/\/admin\/products\/(\d+)/);
      if (m) out.push({ id: m[1], label: (t.trim().split('\n')[0] || '').slice(0, 40) });
    });
    return out;
  });
  console.log(`found ${rows.length} LCV product rows:`, rows.map((r) => r.id + ':' + r.label).join(' | '));

  if (!APPLY) {
    console.log('\nDRY RUN - would delete these products, then category 103. Re-run with --apply.');
    await browser.close();
    return;
  }

  // Delete each product by submitting its delete form from the edit page, so the
  // CSRF token is the real one the server issued for this session.
  for (const r of rows) {
    await page.goto(`${BASE}/admin/products/${r.id}/edit`, { waitUntil: 'load' });
    const ok = await page.evaluate((id) => {
      const form = document.querySelector(`form[action$="/admin/products/${id}/delete"]`)
        || [...document.querySelectorAll('form')].find((f) => (f.getAttribute('action') || '').includes(`/products/${id}/delete`));
      if (!form) return false;
      form.submit();
      return true;
    }, r.id);
    if (!ok) { console.log(`  product ${r.id}: no delete form found`); continue; }
    await page.waitForTimeout(1200);
    console.log(`  deleted product ${r.id} (${r.label}) -> ${page.url().replace(BASE, '')}`);
  }

  // --- then the category itself ---
  await page.goto(`${BASE}/admin/categories/103/edit`, { waitUntil: 'load' });
  const catOk = await page.evaluate(() => {
    const form = [...document.querySelectorAll('form')].find((f) => (f.getAttribute('action') || '').includes('/categories/103/delete'));
    if (!form) return false;
    form.submit();
    return true;
  });
  await page.waitForTimeout(1500);
  console.log(catOk ? `category 103 delete submitted -> ${page.url().replace(BASE, '')}` : 'category delete form not found');

  const body = await page.evaluate(() => document.body.innerText.slice(0, 300));
  if (/Cannot delete/i.test(body)) console.log('  server refused:', body.split('\n')[0]);

  await browser.close();
})();
