// One-off: revert product id=537 (BH-TSB-101) main_image back to its
// pre-edit value on PRODUCTION, via the real admin UI, not a direct DB write.
const { chromium } = require('playwright');

const BASE = 'https://bongshaihousing.com';
const ADMIN_EMAIL = process.env.BONGSHAI_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.BONGSHAI_ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('BONGSHAI_ADMIN_EMAIL / BONGSHAI_ADMIN_PASSWORD env vars not set.');
}
const ORIGINAL_IMAGE = 'images/products/Model No-BH-TB-101.webp';
const PRODUCT_ID = 537;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE}/admin/login`);
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
  if (page.url().includes('/admin/login')) throw new Error('Login failed');
  console.log('[login] OK');

  const editUrl = `${BASE}/admin/products/${PRODUCT_ID}/edit`;
  await page.goto(editUrl);
  const before = await page.locator('#main_image').inputValue();
  console.log('current main_image before revert:', JSON.stringify(before));

  await page.fill('#main_image', ORIGINAL_IMAGE);
  await page.locator('button[type="submit"]:has-text("Save")').first().click();
  await page.waitForLoadState('networkidle');
  console.log('saved, now at:', page.url());

  await page.goto(editUrl);
  const after = await page.locator('#main_image').inputValue();
  console.log('main_image after revert:', JSON.stringify(after));
  console.log('REVERT OK:', after === ORIGINAL_IMAGE);

  await browser.close();
})().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
