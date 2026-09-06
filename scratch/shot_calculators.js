// Screenshots the built pages without a listening socket (the sandbox blocks
// binding a port): Playwright intercepts every request and fulfils it straight
// from the repo on disk, so absolute /css/... paths resolve exactly as they do
// under LiteSpeed.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT = process.argv[2] || path.join(ROOT, 'scratch', 'shots');
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

const PAGES = [
  ['calc-construction', 'https://local.test/construction-cost-calculator.html'],
  ['calc-land', 'https://local.test/land-registration-cost-calculator.html'],
  ['home', 'https://local.test/index.html'],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });

  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.hostname !== 'local.test') return route.abort();   // no third-party fetches
    let p = decodeURIComponent(u.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      return route.fulfill({ status: 404, body: 'not found' });
    }
    route.fulfill({
      status: 200,
      contentType: TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      body: fs.readFileSync(file),
    });
  });

  for (const [name, url] of PAGES) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, name + '-top.png') });
    await page.screenshot({ path: path.join(OUT, name + '-full.png'), fullPage: true });

    const m = await page.evaluate(() => {
      const app = document.querySelector('.calc-app');
      const shell = document.querySelector('.calc-shell');
      const h1 = document.querySelector('h1');
      return {
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        bodyFont: getComputedStyle(document.body).fontFamily.split(',')[0],
        appBg: app ? getComputedStyle(app).backgroundColor : null,
        appFont: app ? getComputedStyle(app).fontFamily.split(',')[0] : null,
        shellW: shell ? Math.round(shell.getBoundingClientRect().width) : null,
        h1Color: h1 ? getComputedStyle(h1).color : null,
        h1Top: h1 ? Math.round(h1.getBoundingClientRect().top) : null,
        navCards: document.querySelectorAll('.mega-card').length,
        hasFooter: !!document.querySelector('footer'),
      };
    });
    console.log(name, JSON.stringify(m), errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no js errors');
    await page.close();
  }
  await browser.close();
  console.log('shots in', OUT);
})();
