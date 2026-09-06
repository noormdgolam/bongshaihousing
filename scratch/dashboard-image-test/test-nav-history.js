const { chromium } = require('playwright');

const BASE = 'http://localhost:3001';
const ADMIN_EMAIL = process.env.BONGSHAI_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.BONGSHAI_ADMIN_PASSWORD;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto(`${BASE}/admin/login`);
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
  if (page.url().includes('/admin/login')) throw new Error('Login failed');
  console.log('[login] OK');

  // --- Nav menu editor test ---
  await page.goto(`${BASE}/admin/nav-menu`);
  const navTitle = await page.locator('h1').textContent();
  console.log('[nav-menu list] title:', navTitle.trim());
  const rowCount = await page.locator('table tbody tr').count();
  console.log('[nav-menu list] row count:', rowCount);

  const editLink = page.locator('a[href*="/admin/nav-menu/"][href$="/edit"]').first();
  const editHref = await editLink.getAttribute('href');
  await page.goto(`${BASE}${editHref}`);
  const originalLabel = await page.locator('input[name="label"]').inputValue();
  console.log('[nav-menu edit] original label:', originalLabel);

  await page.fill('input[name="label"]', originalLabel + ' (TEST)');
  await page.locator('button[type="submit"]:has-text("Save")').click();
  await page.waitForLoadState('networkidle');
  await page.goto(`${BASE}${editHref}`);
  const changedLabel = await page.locator('input[name="label"]').inputValue();
  console.log('[nav-menu edit] after save:', changedLabel, '-- CHANGED:', changedLabel !== originalLabel);

  // Verify it shows on the live nav
  await page.goto(`${BASE}/about.html`);
  const navHtml = await page.content();
  console.log('[live check] test label appears on live nav:', navHtml.includes(originalLabel + ' (TEST)'));

  // Revert
  await page.goto(`${BASE}${editHref}`);
  await page.fill('input[name="label"]', originalLabel);
  await page.locator('button[type="submit"]:has-text("Save")').click();
  await page.waitForLoadState('networkidle');
  await page.goto(`${BASE}${editHref}`);
  const revertedLabel = await page.locator('input[name="label"]').inputValue();
  console.log('[nav-menu edit] reverted:', revertedLabel, '-- REVERT OK:', revertedLabel === originalLabel);

  // --- History/undo test on a product ---
  await page.goto(`${BASE}/admin/products`);
  const prodEditLink = page.locator('a[href^="/admin/products/"][href$="/edit"]').first();
  const prodEditHref = await prodEditLink.getAttribute('href');
  await page.goto(`${BASE}${prodEditHref}`);
  const originalTitle = await page.locator('#title, input[name="title"]').first().inputValue();
  console.log('[product edit] original title:', originalTitle);

  await page.fill('input[name="title"]', originalTitle + ' TESTEDIT');
  await page.locator('button[type="submit"]:has-text("Save")').first().click();
  await page.waitForLoadState('networkidle');
  await page.goto(`${BASE}${prodEditHref}`);
  const historyRows = await page.locator('text=Version History').count();
  console.log('[product edit] Version History panel present:', historyRows > 0);
  const undoBtn = page.locator('button:has-text("Undo Last Change")');
  const hasUndo = await undoBtn.count();
  console.log('[product edit] Undo button present:', hasUndo > 0);
  if (hasUndo > 0) {
    await undoBtn.click();
    await page.waitForLoadState('networkidle');
  }
  await page.goto(`${BASE}${prodEditHref}`);
  const restoredTitle = await page.locator('input[name="title"]').inputValue();
  console.log('[product edit] title after undo:', restoredTitle, '-- UNDO WORKED:', restoredTitle === originalTitle);

  await browser.close();
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
