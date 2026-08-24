// Multi-viewport functional/responsive audit, built on smoke-test.js's
// established pattern (record()/fresh-page-per-check/try-catch-per-check).
// smoke-test.js only ever ran at one desktop viewport and checked 4 things;
// this checks representative pages (one per template family, not all 200+)
// across mobile/tablet/desktop for the responsive-layout bugs a
// status-code-only check can never catch.
//   node server/scripts/site-audit.js [base_url]
const { chromium } = require('playwright');

const BASE_URL = (process.argv[2] || 'https://bongshaihousing.com').replace(/\/$/, '');
const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' - ' + detail : ''}`);
}

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

// One representative page per template family - not all 200+ pages, since a
// structural/responsive bug in a shared template affects every instance of
// that family identically.
const PAGES = [
  { path: '/', label: 'homepage' },
  { path: '/bh-dv-202.html', label: 'product-detail' },
  { path: '/apartment-building.html', label: 'category-landing' },
  { path: '/steel-building-dhaka.html', label: 'district-page' },
  { path: '/about.html', label: 'about' },
  { path: '/contact.html', label: 'contact' },
  { path: '/faq.html', label: 'faq' },
  { path: '/service-areas.html', label: 'service-areas' },
  { path: '/projects.html', label: 'projects' },
  { path: '/team-senior-management.html', label: 'team-page' },
];

async function checkPageAtViewport(browser, pageSpec, viewport) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const label = `${pageSpec.label} @ ${viewport.name}`;
  try {
    const res = await page.goto(`${BASE_URL}${pageSpec.path}`, { waitUntil: 'networkidle', timeout: 20000 });
    record(`${label}: loads`, res && res.ok(), `HTTP ${res ? res.status() : 'no response'}`);
    if (!res || !res.ok()) { await page.close(); return; }

    record(`${label}: no console errors`, consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

    const overflow = await page.evaluate(() => document.body.scrollWidth - window.innerWidth);
    record(`${label}: no horizontal overflow`, overflow <= 4, `scrollWidth exceeds viewport by ${overflow}px`);

    const brokenImages = await page.evaluate(() =>
      Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src)
    );
    record(`${label}: no broken <img>`, brokenImages.length === 0, brokenImages.slice(0, 3).join(', '));

    if (viewport.name === 'mobile') {
      const toggle = page.locator('.mobile-menu-toggle, .nav-toggle, [aria-label*="menu" i]').first();
      if (await toggle.count()) {
        await toggle.click().catch(() => {});
        await page.waitForTimeout(300);
        const menuVisible = await page.locator('.mobile-nav, .nav-drawer, [class*="mobile-menu"]').first().isVisible().catch(() => false);
        record(`${label}: mobile menu toggle opens nav`, menuVisible, menuVisible ? '' : 'toggle clicked but no nav drawer became visible');
      } else {
        record(`${label}: mobile menu toggle present`, false, 'no element matched common mobile-toggle selectors - selector may need adjusting, not necessarily a real bug');
      }
    }
  } catch (e) {
    record(`${label} (crashed)`, false, e.message.split('\n')[0]);
  }
  await page.close();
}

async function checkContactFormSubmission(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await page.goto(`${BASE_URL}/contact.html`, { waitUntil: 'networkidle' });
    await page.fill('#name', 'SITE AUDIT TEST - please delete');
    await page.fill('#email', 'site-audit-test@example.com');
    const phoneInput = page.locator('input[name="phone"]');
    if (await phoneInput.count()) await phoneInput.fill('1700000099');

    const divisionSelect = page.locator('#division');
    if (await divisionSelect.count()) {
      const divisionOptions = await divisionSelect.locator('option').all();
      if (divisionOptions.length > 1) {
        const val = await divisionOptions[1].getAttribute('value');
        await divisionSelect.selectOption(val);
        await page.waitForTimeout(200);
        const districtSelect = page.locator('#district');
        const districtEnabled = !(await districtSelect.isDisabled());
        record('contact form: district enables after division select', districtEnabled);
        if (districtEnabled) {
          const districtOptions = await districtSelect.locator('option').all();
          if (districtOptions.length > 1) {
            const dVal = await districtOptions[1].getAttribute('value');
            await districtSelect.selectOption(dVal);
            await page.waitForTimeout(200);
            const upazilaSelect = page.locator('#upazila');
            const upazilaEnabled = !(await upazilaSelect.isDisabled());
            record('contact form: upazila/thana enables after district select', upazilaEnabled);
            if (upazilaEnabled) {
              const upazilaOptions = await upazilaSelect.locator('option').all();
              record('contact form: upazila has real options populated', upazilaOptions.length > 1, `${upazilaOptions.length} options`);
              if (upazilaOptions.length > 1) await upazilaSelect.selectOption({ index: 1 });
            }
          }
        }
      }
    } else {
      record('contact form: division/district/thana cascade present', false, 'no #division select found on page');
    }
  } catch (e) {
    record('contact form cascade test (crashed)', false, e.message.split('\n')[0]);
  }
  await page.close();
}

async function run() {
  console.log(`Site audit: ${BASE_URL}\n`);
  const browser = await chromium.launch();

  for (const pageSpec of PAGES) {
    for (const viewport of VIEWPORTS) {
      await checkPageAtViewport(browser, pageSpec, viewport);
    }
  }

  await checkContactFormSubmission(browser);

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length} checks, ${failed.length} failed.`);
  if (failed.length) {
    console.log('\nFailed checks:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
  }
}

run().catch((e) => { console.error('Site audit crashed:', e.message); process.exit(1); });
