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
  // Re-verify tonight's two div-balance fixes (commits 12298816, 48e825c2,
  // 7cb473f4) actually render correctly across all three viewports. Note:
  // this hits the LIVE site, which reflects whatever was last deployed via
  // the separate FTP/cPanel deploy process, not necessarily this repo's
  // current git state - a clean result here does not by itself confirm
  // tonight's local-repo fixes are live, and a failure here does not mean
  // the local fix was wrong.
  { path: '/simplex-steel-building.html', label: 'simplex-steel-building' },
  { path: '/contact.html', label: 'contact-recheck' },
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

    // The site's service-worker registration self-reloads the page once on
    // 'controllerchange' (js/global-upgrades.js) - on a fresh Playwright
    // profile this can fire just after networkidle, destroying the execution
    // context mid-evaluate() and crashing the rest of this page's checks with
    // a misleading "Execution context was destroyed" error. Give it a beat to
    // settle before running any evaluate()/interaction below.
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(600);

    record(`${label}: no console errors`, consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

    const overflow = await page.evaluate(() => document.body.scrollWidth - window.innerWidth);
    record(`${label}: no horizontal overflow`, overflow <= 4, `scrollWidth exceeds viewport by ${overflow}px`);

    // Scroll through the full page first so native loading="lazy" images below
    // the fold actually get triggered - otherwise they read naturalWidth===0
    // (never loaded, not broken) and produce false "broken image" positives.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      const max = document.body.scrollHeight;
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);

    const imageCheck = await page.evaluate(() => {
      const all = Array.from(document.images);
      // #imgLightboxImg (js/global-upgrades.js) is a deliberate empty-src
      // placeholder - it only gets a real src when a gallery thumbnail is
      // clicked to open the lightbox, and stays hidden (display:none) until
      // then. Only flag an empty src on an image that's actually visible.
      const isVisible = (img) => {
        const r = img.getBoundingClientRect();
        const style = getComputedStyle(img);
        return r.width > 0 && r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const emptySrc = all.filter((img) => !img.getAttribute('src') && isVisible(img)).map((img) => img.outerHTML.slice(0, 80));
      const broken = all.filter((img) => img.getAttribute('src') && img.complete && img.naturalWidth === 0).map((img) => img.src);
      return { broken, emptySrc };
    });
    record(`${label}: no broken <img>`, imageCheck.broken.length === 0, imageCheck.broken.slice(0, 3).join(', '));
    if (imageCheck.emptySrc.length) {
      record(`${label}: no <img> with empty src attribute`, false, imageCheck.emptySrc.slice(0, 2).join(' | '));
    }

    // Hero CTA buttons should be visible and big enough to tap/click - checks the
    // first couple of .btn-primary/.btn-lg/.hero-actions buttons in the hero area.
    const ctaCheck = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll('.hero-actions a, .hero-actions button, .btn-lg')).slice(0, 4);
      if (ctas.length === 0) return { found: false };
      const bad = ctas
        .map((el) => {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return { rect: r, visible: style.visibility !== 'hidden' && style.display !== 'none' && r.width > 0 && r.height > 0, text: (el.textContent || '').trim().slice(0, 30) };
        })
        .filter((c) => !c.visible || c.rect.height < 32);
      return { found: true, total: ctas.length, bad };
    });
    if (ctaCheck.found) {
      record(`${label}: hero CTA buttons visible & tappable (>=32px tall)`, ctaCheck.bad.length === 0,
        ctaCheck.bad.map((b) => `"${b.text}" ${Math.round(b.rect.height)}px`).join(', '));
    }

    // Form fields shouldn't visually overlap each other (a common responsive-layout
    // symptom of a broken flex/grid container or unbalanced div nesting).
    const overlapCheck = await page.evaluate(() => {
      const fields = Array.from(document.querySelectorAll('form input, form select, form textarea, form button'))
        .filter((el) => el.offsetParent !== null);
      const rects = fields.map((el) => ({ el, r: el.getBoundingClientRect() }));
      const overlaps = [];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i].r;
          const b = rects[j].r;
          const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          const overlapArea = ix * iy;
          const smallerArea = Math.min(a.width * a.height, b.width * b.height);
          if (smallerArea > 0 && overlapArea / smallerArea > 0.4) {
            overlaps.push(`${rects[i].el.name || rects[i].el.id || rects[i].el.tagName} <-> ${rects[j].el.name || rects[j].el.id || rects[j].el.tagName}`);
          }
        }
      }
      return { fieldCount: fields.length, overlaps };
    });
    if (overlapCheck.fieldCount > 0) {
      record(`${label}: form fields not overlapping/clipped`, overlapCheck.overlaps.length === 0, overlapCheck.overlaps.slice(0, 3).join(', '));
    }

    if (viewport.name === 'mobile') {
      // The real markup (server/views/layout.njk) is #hamburgerBtn toggling an
      // 'open' class on #mobileDrawer - try that exact pair first (it's what's
      // actually shipped sitewide), falling back to generic selectors for
      // resilience if a page uses different markup.
      const specificToggle = page.locator('#hamburgerBtn');
      const specificDrawer = page.locator('#mobileDrawer');
      const hasSpecific = (await specificToggle.count()) && (await specificDrawer.count());
      const toggle = hasSpecific ? specificToggle : page.locator('.mobile-menu-toggle, .nav-toggle, [aria-label*="menu" i]').first();
      const drawer = hasSpecific ? specificDrawer : page.locator('.mobile-nav, .nav-drawer, .mobile-drawer, [class*="mobile-menu"]').first();
      if (await toggle.count()) {
        await toggle.click().catch(() => {});
        await page.waitForTimeout(300);
        const opened = hasSpecific
          ? await drawer.evaluate((el) => el.classList.contains('open')).catch(() => false)
          : await drawer.isVisible().catch(() => false);
        record(`${label}: mobile menu toggle opens nav`, opened, opened ? '' : 'toggle clicked but drawer did not open (checked #mobileDrawer.open class)');
      } else {
        record(`${label}: mobile menu toggle present`, false, 'no element matched #hamburgerBtn or common mobile-toggle selectors - selector may need adjusting, not necessarily a real bug');
      }
    }
  } catch (e) {
    const msg = e.message.split('\n')[0];
    const isSwReloadRace = /Execution context was destroyed/.test(msg);
    record(`${label} (crashed)`, false, isSwReloadRace
      ? `${msg} - likely the site's service-worker self-reload race (see comment above), not a content bug; re-run to confirm`
      : msg);
  }
  await page.close();
}

// Deliberately does NOT click the submit button or call form.submit() anywhere
// in this function - that would create a real lead/notification on a live
// production site. This only verifies fields are present, fillable, and that
// the division -> district -> thana cascade populates correctly via real
// click/select events. A true end-to-end submission test needs the user
// present to confirm the resulting lead/email and then delete the test data.
async function checkContactFormFillableAndCascade(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await page.goto(`${BASE_URL}/contact.html`, { waitUntil: 'networkidle' });
    // The full-name field's id is "fname" (its name attribute is "name") - server/views/pages/contact.njk:131
    await page.fill('#fname', 'SITE AUDIT TEST - please delete');
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

  await checkContactFormFillableAndCascade(browser);

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length} checks, ${failed.length} failed.`);
  if (failed.length) {
    console.log('\nFailed checks:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
  }
}

run().catch((e) => { console.error('Site audit crashed:', e.message); process.exit(1); });
