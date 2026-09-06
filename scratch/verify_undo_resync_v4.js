// Same test as before, but the "is it live" check is a real curl subprocess
// call, not window.fetch() from inside the page - eliminates any doubt about
// same-origin fetch behaving differently from a genuine external request.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const BASE = 'https://bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;
const PRODUCT_ID = 513;
const SLUG = 'bh-sh-601.html';

function curlHasMarker(marker) {
  const out = execFileSync('curl.exe', ['-s', '--max-time', '25', `${BASE}/${SLUG}`], { encoding: 'utf8' });
  return out.includes(marker);
}

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

  await page.goto(`${BASE}/admin/products/${PRODUCT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[name="total_floor_area"]', { timeout: 30000 });
  const originalArea = await page.evaluate(() => document.querySelector('[name="total_floor_area"]').value);
  const testArea = '7777';
  console.log('original total_floor_area:', originalArea);
  await page.fill('[name="total_floor_area"]', testArea);
  await submitScoped(page, `/admin/products/${PRODUCT_ID}$`);
  await page.waitForTimeout(4000);

  await new Promise(r=>setTimeout(r,6000));
  console.log('curl check right after edit (long wait) — page shows 7777 sqft:', curlHasMarker('7777'));

  const hasUndo = await page.evaluate(() => /Undo Last Change/.test(document.body.innerText));
  console.log('undo button present:', hasUndo);
  if (hasUndo) {
    await submitScoped(page, `/admin/history/product/${PRODUCT_ID}/restore/\\d+$`);
    await page.waitForTimeout(4000);
  }

  const dbArea = await page.evaluate(() => document.querySelector('[name="total_floor_area"]') ? document.querySelector('[name="total_floor_area"]').value : null);
  console.log('DB total_floor_area after undo:', dbArea, '| restored:', dbArea === originalArea);
  await new Promise(r=>setTimeout(r,6000));
  console.log('curl check after undo (long wait) — page STILL shows 7777 sqft (should be FALSE if fix works):', curlHasMarker('7777'));
  console.log('curl check after undo — page shows original', originalArea, 'sqft:', curlHasMarker(originalArea + ' sqft'));

  await browser.close();
})();
