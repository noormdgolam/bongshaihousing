// Renumbers the top-level nav so "Cost Calculator" sits directly after Products
// instead of tying with "Our Projects" on sort_order 3. A tie leaves the order up
// to the DB's tiebreak, which is not something to leave to chance in a menu.
//
// Each item is saved through its own edit form so the POST carries every field the
// route expects and the change is recorded like any admin edit.
//
//   ADMIN_PASSWORD=... node scratch/admin_fix_nav_order.js [--apply]
const { chromium } = require('playwright');

const BASE = process.env.ADMIN_BASE || 'https://bongshaihousing.com';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;
const APPLY = process.argv.includes('--apply');

// id -> intended sort_order
const ORDER = { 1: 0, 2: 1, 3: 2, 15: 3, 4: 4, 5: 5, 6: 6 };

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

  for (const [id, want] of Object.entries(ORDER)) {
    await page.goto(`${BASE}/admin/nav-menu/${id}/edit`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(600);

    const current = await page.evaluate(() => {
      const v = (n) => { const el = document.querySelector(`[name="${n}"]`); return el ? (el.type === 'checkbox' ? el.checked : el.value) : null; };
      return { label: v('label'), sort_order: v('sort_order') };
    });
    if (String(current.sort_order) === String(want)) {
      console.log(`  ${id} ${current.label}: already ${want}`);
      continue;
    }
    if (!APPLY) {
      console.log(`  ${id} ${current.label}: ${current.sort_order} -> ${want} (dry run)`);
      continue;
    }
    await page.fill('[name="sort_order"]', String(want));
    await page.evaluate(() => {
      const form = [...document.querySelectorAll('form')].find((f) => (f.getAttribute('action') || '').match(/\/admin\/nav-menu\/\d+$/));
      if (form) form.submit();
    });
    await page.waitForTimeout(1500);
    console.log(`  ${id} ${current.label}: ${current.sort_order} -> ${want}`);
  }

  await browser.close();
})();
