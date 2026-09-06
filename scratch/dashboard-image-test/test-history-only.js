const { chromium } = require('playwright');

const BASE = 'http://localhost:3001';
const ADMIN_EMAIL = process.env.BONGSHAI_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.BONGSHAI_ADMIN_PASSWORD;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  await page.goto(`${BASE}/admin/login`);
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
  console.log('[login] OK, at', page.url());

  const resp = await page.goto(`${BASE}/admin/products`, { waitUntil: 'domcontentloaded' });
  console.log('[products list] status:', resp.status());
  const prodEditHref = await page.locator('a[href^="/admin/products/"][href$="/edit"]').first().getAttribute('href');
  console.log('[products list] first edit href:', prodEditHref);

  await page.goto(`${BASE}${prodEditHref}`, { waitUntil: 'domcontentloaded' });
  const originalTitle = await page.locator('input[name="title"]').inputValue();
  console.log('[product edit] original title:', originalTitle);

  await page.fill('input[name="title"]', originalTitle + ' TESTEDIT');
  await page.locator('button[type="submit"]:has-text("Save")').first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.goto(`${BASE}${prodEditHref}`, { waitUntil: 'domcontentloaded' });

  const hasHistoryPanel = await page.locator('text=Version History').count();
  console.log('[product edit] Version History panel present:', hasHistoryPanel > 0);
  const hasUndo = await page.locator('button:has-text("Undo Last Change")').count();
  console.log('[product edit] Undo button present:', hasUndo > 0);

  if (hasUndo > 0) {
    await page.locator('button:has-text("Undo Last Change")').click();
    await page.waitForLoadState('domcontentloaded');
  }
  await page.goto(`${BASE}${prodEditHref}`, { waitUntil: 'domcontentloaded' });
  const restoredTitle = await page.locator('input[name="title"]').inputValue();
  console.log('[product edit] title after undo:', restoredTitle, '-- UNDO WORKED:', restoredTitle === originalTitle);

  const historyRowCount = await page.locator('table tr').count();
  console.log('[product edit] history table row count (post-undo, should be 3+: current + edit + undo-restore):', historyRowCount);

  await browser.close();
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
