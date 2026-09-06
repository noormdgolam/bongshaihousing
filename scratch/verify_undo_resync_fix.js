// The definitive test of the fix: edit a product's title, confirm the change
// is live (already known-good), click Undo, and this time check the LIVE
// STATIC PAGE - not just the form's DB-backed value - to confirm the fix
// actually closes the gap the first two rounds of testing found.
const { chromium } = require('playwright');
const BASE = 'https://bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;

async function submitScoped(page, actionMatch) {
  return page.evaluate((match) => {
    const form = [...document.querySelectorAll('form')].find((f) => (f.getAttribute('action') || '').match(new RegExp(match)));
    if (!form) return false;
    form.submit();
    return true;
  }, actionMatch);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[name="email"]', { timeout: 30000 });
  await page.fill('input[name="email"]', 'admin@bongshaihousing.com');
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  const PRODUCT_ID = 441; // BH-CB-901, has a static page override
  await page.goto(`${BASE}/admin/products/${PRODUCT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[name="title"]', { timeout: 30000 });
  const originalTitle = await page.evaluate(() => document.querySelector('[name="title"]').value);
  const marker = originalTitle + ' [RESYNC-TEST]';
  await page.fill('[name="title"]', marker);
  await submitScoped(page, `/admin/products/${PRODUCT_ID}$`);
  await page.waitForTimeout(3000);

  const liveHasMarkerAfterEdit = await page.evaluate(async () => {
    const r = await fetch(location.origin + '/bh-cb-901.html?cb=' + Date.now());
    return (await r.text()).includes('[RESYNC-TEST]');
  });
  console.log('after edit: live page shows the marker:', liveHasMarkerAfterEdit);

  const hasUndo = await page.evaluate(() => /Undo Last Change/.test(document.body.innerText));
  console.log('undo button present:', hasUndo);
  if (hasUndo) {
    await submitScoped(page, `/admin/history/product/${PRODUCT_ID}/restore/\\d+$`);
    await page.waitForTimeout(4000);
  }

  const dbRestored = (await page.evaluate(() => document.querySelector('[name="title"]') ? document.querySelector('[name="title"]').value : null)) === originalTitle;
  console.log('DB title restored:', dbRestored);

  const liveClearedAfterUndo = await page.evaluate(async () => {
    const r = await fetch(location.origin + '/bh-cb-901.html?cb=' + Date.now());
    return !(await r.text()).includes('[RESYNC-TEST]');
  });
  console.log('THE FIX: live page no longer shows the marker after Undo:', liveClearedAfterUndo);

  console.log('\n' + (liveHasMarkerAfterEdit && hasUndo && dbRestored && liveClearedAfterUndo
    ? 'CONFIRMED FIXED end-to-end' : 'STILL BROKEN or inconclusive'));

  await browser.close();
})();
