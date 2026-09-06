const { chromium } = require('playwright');
const BASE = 'https://bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;

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

  await page.goto(`${BASE}/admin/products/541/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[name="main_image"]', { timeout: 30000 });
  const before = await page.evaluate(() => document.querySelector('[name="main_image"]').value);
  console.log('before:', before);

  await page.fill('[name="main_image"]', 'images/products/Model No-BH-TB-105.webp');
  const submitted = await page.evaluate(() => {
    const form = [...document.querySelectorAll('form')].find((f) => {
      const a = f.getAttribute('action') || '';
      return /\/admin\/products\/541$/.test(a);
    });
    if (!form) return false;
    form.submit();
    return true;
  });
  console.log('form submitted:', submitted);
  await page.waitForTimeout(3000);

  const after = await page.evaluate(() => document.querySelector('[name="main_image"]').value);
  console.log('after:', after);

  const liveHtml = await page.evaluate(async () => {
    const r = await fetch(location.origin + '/bh-tsb-105.html?cb=' + Date.now());
    return r.text();
  });
  console.log('live page has new webp path:', liveHtml.includes('Model No-BH-TB-105.webp'));
  console.log('live page still has old jfif:', liveHtml.includes('.jfif'));

  await browser.close();
})();
