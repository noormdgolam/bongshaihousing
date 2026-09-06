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
  await page.waitForSelector('[name="title"]', { timeout: 30000 });
  const originalTitle = await page.evaluate(() => document.querySelector('[name="title"]').value);
  const marker = 'RESYNCTEST' + Date.now();
  console.log('original title:', originalTitle);
  console.log('marker:', marker);

  await page.fill('[name="title"]', originalTitle + ' ' + marker);
  await submitScoped(page, `/admin/products/${PRODUCT_ID}$`);
  await page.waitForTimeout(4000);

  console.log('curl check right after edit — has marker:', curlHasMarker(marker));

  const hasUndo = await page.evaluate(() => /Undo Last Change/.test(document.body.innerText));
  console.log('undo button present:', hasUndo);
  if (hasUndo) {
    await submitScoped(page, `/admin/history/product/${PRODUCT_ID}/restore/\\d+$`);
    await page.waitForTimeout(4000);
  }

  const dbTitle = await page.evaluate(() => document.querySelector('[name="title"]') ? document.querySelector('[name="title"]').value : null);
  console.log('DB title after undo:', dbTitle, '| restored:', dbTitle === originalTitle);
  console.log('curl check after undo — still has marker (should be FALSE if fix works):', curlHasMarker(marker));

  await browser.close();
})();
