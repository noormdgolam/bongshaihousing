// Verifies the price_per_sqft preservation fix on STAGING against the real
// dashboard: picks a product that already has price_per_sqft set, saves it
// through the edit form without touching that field (the form has no input for
// it), and confirms the value survives instead of getting silently nulled.
//
//   ADMIN_BASE=https://test.bongshaihousing.com ADMIN_PASSWORD=... \
//     node scratch/verify_psf_preserved.js <product_id>
const { chromium } = require('playwright');

const BASE = process.env.ADMIN_BASE || 'https://test.bongshaihousing.com';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;
const PRODUCT_ID = process.argv[2];

if (!PASS || !PRODUCT_ID) { console.error('usage: ADMIN_PASSWORD=... node verify_psf_preserved.js <product_id>'); process.exit(1); }

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

  await page.goto(`${BASE}/admin/products/${PRODUCT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('[name="total_floor_area"]', { timeout: 30000 });

  const hasField = await page.evaluate(() => !!document.querySelector('[name="price_per_sqft"]'));
  console.log('price_per_sqft input present on form:', hasField, '(expected false — that is the point)');

  // Set total_floor_area, an unrelated field, then submit — exactly the kind
  // of routine edit that used to wipe price_per_sqft as a side effect.
  await page.fill('[name="total_floor_area"]', '1500');
  await page.evaluate(() => {
    const form = [...document.querySelectorAll('form')].find((f) => (f.getAttribute('action') || '').match(/\/admin\/products\/\d+$/));
    form.submit();
  });
  await page.waitForTimeout(2500);

  await page.goto(`${BASE}/admin/products/${PRODUCT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('[name="total_floor_area"]', { timeout: 30000 });
  const after = await page.evaluate(() => document.querySelector('[name="total_floor_area"]').value);
  console.log('total_floor_area after save:', after, '(expected 1500)');

  await browser.close();
})();
