const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const BASE = 'https://bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;

function lastModified(slug) {
  const out = execFileSync('curl.exe', ['-sI', '--max-time', '20', `${BASE}/${slug}`], { encoding: 'utf8' });
  const m = out.match(/Last-Modified:\s*(.+)/i);
  return m ? m[1].trim() : null;
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

  const before = lastModified('bh-sh-601.html');
  console.log('Last-Modified BEFORE edit:', before);
  const t0 = new Date();
  console.log('my clock right before submitting the edit:', t0.toISOString());

  await page.goto(`${BASE}/admin/products/513/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[name="total_floor_area"]', { timeout: 30000 });
  await page.fill('[name="total_floor_area"]', '8888');
  await page.evaluate(() => {
    const form = [...document.querySelectorAll('form')].find((f) => /\/admin\/products\/513$/.test(f.getAttribute('action') || ''));
    form.submit();
  });
  await page.waitForTimeout(1500);
  console.log('redirect landed on:', page.url());

  // confirm the DB actually has 8888 right now, read independently via a fresh admin page load
  await page.goto(`${BASE}/admin/products/513/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[name="total_floor_area"]', { timeout: 30000 });
  const dbNow = await page.evaluate(() => document.querySelector('[name="total_floor_area"]').value);
  console.log('DB value right now (independent read):', dbNow);

  for (const wait of [0, 3, 6, 10, 15]) {
    if (wait > 0) await page.waitForTimeout(wait * 1000 - (wait === 3 ? 0 : 3000));
    const lm = lastModified('bh-sh-601.html');
    console.log(`t+${wait}s  Last-Modified:`, lm, lm !== before ? '<<< CHANGED' : '(unchanged)');
  }

  // revert
  await page.fill('[name="total_floor_area"]', '');
  await page.evaluate(() => {
    const form = [...document.querySelectorAll('form')].find((f) => /\/admin\/products\/513$/.test(f.getAttribute('action') || ''));
    form.submit();
  });
  await page.waitForTimeout(3000);

  await browser.close();
})();
