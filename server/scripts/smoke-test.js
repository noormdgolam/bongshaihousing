// Drives the real site with a headless browser and checks the failure
// classes that actually shipped undetected this session: a broken hero
// image, a gallery click that silently navigates away instead of opening
// the lightbox, and basic admin-login reachability. Run against staging
// before promoting the same files to prod:
//   node server/scripts/smoke-test.js https://test.bongshaihousing.com
// Defaults to production if no URL is given.
const { chromium } = require('playwright');

const BASE_URL = (process.argv[2] || 'https://bongshaihousing.com').replace(/\/$/, '');
const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' - ' + detail : ''}`);
}

async function checkHomepage(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const res = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  record('homepage loads', res.ok(), `HTTP ${res.status()}`);

  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  record('homepage CSS loaded', bg !== 'rgba(0, 0, 0, 0)' && bg !== '', `body background-color: ${bg}`);

  // Images with no src attribute at all (lightbox/modal placeholders that
  // only get a real src on click) resolve to the page's own URL per an
  // HTML quirk and always report naturalWidth 0 - that's by design, not
  // broken. Only flag <img> tags that were actually given a real path.
  const brokenImages = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.getAttribute('src') && img.complete && img.naturalWidth === 0)
      .map((img) => img.src)
  );
  record('homepage has no broken <img>', brokenImages.length === 0, brokenImages.length ? brokenImages.slice(0, 3).join(', ') : '');
  await page.close();
}

async function checkProductGallery(browser, slug) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const res = await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'networkidle' });
  if (!res.ok()) { record(`${slug} loads`, false, `HTTP ${res.status()}`); return page.close(); }
  record(`${slug} loads`, true);

  const mainImg = page.locator('#pdMainImage');
  if (!(await mainImg.count())) { record(`${slug} has a gallery`, false, 'no #pdMainImage - not a DB product page, skipping gallery checks'); return page.close(); }

  const naturalWidth = await mainImg.evaluate((img) => img.naturalWidth);
  record(`${slug} main image actually loads`, naturalWidth > 0, `naturalWidth=${naturalWidth}`);

  await mainImg.click();
  await page.waitForTimeout(500);
  const stayedOnPage = page.url() === `${BASE_URL}/${slug}`;
  const lightboxOpen = stayedOnPage && (await page.locator('#pdLightbox').isVisible().catch(() => false));
  record(`${slug} gallery click opens lightbox (not a navigation)`, stayedOnPage && lightboxOpen, `url=${page.url()}`);
  await page.close();
}

async function checkAdminLogin(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const res = await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
  record('admin login page loads', res.ok(), `HTTP ${res.status()}`);
  const hasForm = await page.locator('input[name="email"]').count();
  record('admin login form present', hasForm > 0);
  await page.close();
}

async function checkContactForm(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const res = await page.goto(`${BASE_URL}/contact.html`, { waitUntil: 'networkidle' });
  record('contact page loads', res.ok(), `HTTP ${res.status()}`);
  const hasForm = await page.locator('form').count();
  record('contact page has a form', hasForm > 0);
  await page.close();
}

async function run() {
  console.log(`Smoke testing ${BASE_URL}\n`);
  const browser = await chromium.launch();

  // Fresh page per check - reusing one page across unrelated navigations
  // risks cross-check interference (a lingering background request from
  // the previous page aborting the next navigation), seen directly while
  // building this script.
  for (const [label, fn] of [
    ['homepage', () => checkHomepage(browser)],
    ['product gallery', () => checkProductGallery(browser, 'bh-dv-202.html')],
    ['admin login', () => checkAdminLogin(browser)],
    ['contact form', () => checkContactForm(browser)],
  ]) {
    try {
      await fn();
    } catch (e) {
      record(`${label} (crashed)`, false, e.message.split('\n')[0]);
    }
  }

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length} checks, ${failed.length} failed.`);
  if (failed.length) process.exit(1);
}

run().catch((e) => { console.error('Smoke test crashed:', e.message); process.exit(1); });
