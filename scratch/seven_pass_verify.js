// Seven independent verification passes against PRODUCTION, driven entirely
// through the real admin dashboard (not direct DB writes), plus a sequential
// crawl of representative live pages for JS errors / broken images / missing
// chrome. One Playwright session, one page navigation at a time - a real
// browser session behaves nothing like the raw concurrent HTTP flood that
// produced false "404"s and (separately) the leftover FTP ban earlier today,
// so this stays well clear of the WAF/bot-detection.
//
// Every pass that changes live data reverts itself before moving on.
const { chromium } = require('playwright');

const BASE = 'https://bongshaihousing.com';
const EMAIL = 'admin@bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;
if (!PASS) { console.error('ADMIN_PASSWORD not set'); process.exit(1); }

let pass = 0;
const results = [];
function report(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`\n[PASS ${++pass}] ${name}: ${ok ? 'PASS' : 'FAIL'}${detail ? ' — ' + detail : ''}`);
}

async function submitForm(page, actionMatch) {
  return page.evaluate((match) => {
    const form = [...document.querySelectorAll('form')].find((f) => (f.getAttribute('action') || '').match(new RegExp(match)));
    if (!form) return false;
    form.submit();
    return true;
  }, actionMatch);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  // --- login ---
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('input[name="email"]', { timeout: 30000 });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  if (/\/admin\/login/.test(page.url())) { console.error('LOGIN FAILED — aborting'); await browser.close(); process.exit(1); }

  // ---------------------------------------------------------------
  // PASS 1: category edit -> DB -> static regeneration -> live page
  // ---------------------------------------------------------------
  {
    const CAT_ID = 45; // Steel House
    await page.goto(`${BASE}/admin/categories/${CAT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[name="hero_subtitle"]', { timeout: 30000 });
    const original = await page.evaluate(() => document.querySelector('[name="hero_subtitle"]').value);
    const marker = 'VERIFY-MARKER-' + Date.now();
    await page.fill('[name="hero_subtitle"]', marker);
    await submitForm(page, '/admin/categories/\\d+$');
    await page.waitForTimeout(3500);

    const liveHas = await page.evaluate(async (m) => {
      const r = await fetch(location.origin + '/steel-house.html?cb=' + Date.now());
      const t = await r.text();
      return t.includes(m);
    }, marker);

    // revert
    await page.goto(`${BASE}/admin/categories/${CAT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[name="hero_subtitle"]', { timeout: 30000 });
    await page.fill('[name="hero_subtitle"]', original);
    await submitForm(page, '/admin/categories/\\d+$');
    await page.waitForTimeout(3500);
    const revertOk = await page.evaluate(() => document.querySelector('[name="hero_subtitle"]').value) === original;

    report('Category edit reaches the live static page', liveHas && revertOk,
      `marker found live: ${liveHas}, reverted cleanly: ${revertOk}`);
  }

  // ---------------------------------------------------------------
  // PASS 2: product edit — total_floor_area with price_per_sqft NULL
  // (the null-safe path the earlier fix's auto-calc branch must not choke on)
  // ---------------------------------------------------------------
  {
    const PRODUCT_ID = 513; // BH-SH-601, price_per_sqft is NULL
    await page.goto(`${BASE}/admin/products/${PRODUCT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[name="total_floor_area"]', { timeout: 30000 });
    const originalArea = await page.evaluate(() => document.querySelector('[name="total_floor_area"]').value);
    const originalFixed = await page.evaluate(() => document.querySelector('[name="fixed_price"]').value);
    await page.fill('[name="total_floor_area"]', '999');
    await submitForm(page, '/admin/products/\\d+$');
    await page.waitForTimeout(2500);
    const afterArea = await page.evaluate(() => document.querySelector('[name="total_floor_area"]').value);
    const afterFixed = await page.evaluate(() => document.querySelector('[name="fixed_price"]').value);
    const noCrash = afterArea === '999';
    const fixedUntouched = afterFixed === originalFixed; // price_per_sqft is null, so no auto-calc should fire

    // revert
    await page.fill('[name="total_floor_area"]', originalArea || '');
    await submitForm(page, '/admin/products/\\d+$');
    await page.waitForTimeout(2000);

    report('Product edit with price_per_sqft=NULL does not crash or fabricate a price', noCrash && fixedUntouched,
      `area saved: ${afterArea}, fixed_price unchanged: ${fixedUntouched} (${originalFixed} -> ${afterFixed})`);
  }

  // ---------------------------------------------------------------
  // PASS 3: product history + undo round trip
  // ---------------------------------------------------------------
  {
    const PRODUCT_ID = 513;
    await page.goto(`${BASE}/admin/products/${PRODUCT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[name="title"]', { timeout: 30000 });
    const originalTitle = await page.evaluate(() => document.querySelector('[name="title"]').value);
    await page.fill('[name="title"]', originalTitle + ' [TEST]');
    await submitForm(page, '/admin/products/\\d+$');
    await page.waitForTimeout(2500);

    const hasHistory = await page.evaluate(() => /Version History/.test(document.body.innerText));
    const hasUndo = await page.evaluate(() => /Undo Last Change/.test(document.body.innerText));
    if (hasUndo) {
      await submitForm(page, '/admin/history/product/\\d+/restore/\\d+$');
      await page.waitForTimeout(2500);
    }
    const restoredTitle = await page.evaluate(() => document.querySelector('[name="title"]').value);
    const restoredOk = restoredTitle === originalTitle;

    report('Product history panel + Undo Last Change round trip', hasHistory && hasUndo && restoredOk,
      `history panel: ${hasHistory}, undo button: ${hasUndo}, title restored: ${restoredOk}`);
  }

  // ---------------------------------------------------------------
  // PASS 4: category history + undo round trip (different entity type)
  // ---------------------------------------------------------------
  {
    const CAT_ID = 45;
    await page.goto(`${BASE}/admin/categories/${CAT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[name="hero_subtitle"]', { timeout: 30000 });
    const original = await page.evaluate(() => document.querySelector('[name="hero_subtitle"]').value);
    await page.fill('[name="hero_subtitle"]', original + ' [TEST]');
    await submitForm(page, '/admin/categories/\\d+$');
    await page.waitForTimeout(2500);

    const hasHistory = await page.evaluate(() => /Version History/.test(document.body.innerText));
    const hasUndo = await page.evaluate(() => /Undo Last Change/.test(document.body.innerText));
    if (hasUndo) {
      await submitForm(page, '/admin/history/category/\\d+/restore/\\d+$');
      await page.waitForTimeout(3500);
    }
    const restored = await page.evaluate(() => document.querySelector('[name="hero_subtitle"]').value);
    const restoredOk = restored === original;
    const liveReverted = await page.evaluate(async () => {
      const r = await fetch(location.origin + '/steel-house.html?cb=' + Date.now());
      const t = await r.text();
      return !t.includes('[TEST]');
    });

    report('Category history + Undo (and static re-sync on restore)', hasHistory && hasUndo && restoredOk && liveReverted,
      `history: ${hasHistory}, undo: ${hasUndo}, DB restored: ${restoredOk}, live page clean: ${liveReverted}`);
  }

  // ---------------------------------------------------------------
  // PASS 5: nav item visibility toggle -> sync-static -> live check
  // ---------------------------------------------------------------
  {
    await page.goto(`${BASE}/admin/nav-menu`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(800);
    // find the "Cost Calculator" item id
    const id = await page.evaluate(() => {
      const row = [...document.querySelectorAll('tr, li, div')].find((el) => /Cost Calculator/.test(el.textContent || ''));
      const link = row && row.querySelector && [...row.querySelectorAll('a')].find((a) => /edit/i.test(a.getAttribute('href') || ''));
      const m = link && link.getAttribute('href').match(/nav-menu\/(\d+)/);
      return m ? m[1] : null;
    });
    if (!id) {
      report('Nav item visibility toggle + sync', false, 'could not locate the Cost Calculator nav item id');
    } else {
      await page.goto(`${BASE}/admin/nav-menu/${id}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('[name="visible"]', { timeout: 30000 });
      // uncheck visible, save
      const cb = await page.$('[name="visible"]');
      if (await cb.isChecked()) await cb.uncheck();
      await submitForm(page, `/admin/nav-menu/${id}$`);
      await page.waitForTimeout(2000);

      // sync just index.html to check quickly
      await page.goto(`${BASE}/admin/nav-menu`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        const t = document.querySelector('input[name="_csrf"]');
        const f = document.createElement('form'); f.method = 'POST'; f.action = '/admin/nav-menu/sync-static';
        const add = (n, v) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.appendChild(i); };
        add('_csrf', t.value); add('only', 'index.html'); document.body.appendChild(f); f.submit();
      });
      await page.waitForTimeout(3000);
      const hiddenLive = await page.evaluate(async () => {
        const r = await fetch(location.origin + '/index.html?cb=' + Date.now());
        const t = await r.text();
        return !t.includes('Cost Calculator');
      });

      // revert: re-check visible, save, re-sync
      await page.goto(`${BASE}/admin/nav-menu/${id}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('[name="visible"]', { timeout: 30000 });
      const cb2 = await page.$('[name="visible"]');
      if (!(await cb2.isChecked())) await cb2.check();
      await submitForm(page, `/admin/nav-menu/${id}$`);
      await page.waitForTimeout(2000);
      await page.goto(`${BASE}/admin/nav-menu`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        const t = document.querySelector('input[name="_csrf"]');
        const f = document.createElement('form'); f.method = 'POST'; f.action = '/admin/nav-menu/sync-static';
        const add = (n, v) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.appendChild(i); };
        add('_csrf', t.value); add('only', 'index.html'); document.body.appendChild(f); f.submit();
      });
      await page.waitForTimeout(3000);
      const restoredLive = await page.evaluate(async () => {
        const r = await fetch(location.origin + '/index.html?cb=' + Date.now());
        const t = await r.text();
        return t.includes('Cost Calculator');
      });

      report('Nav item visibility toggle + sync (hide, verify, restore)', hiddenLive && restoredLive,
        `hidden reflected live: ${hiddenLive}, restored live: ${restoredLive}`);
    }
  }

  // ---------------------------------------------------------------
  // PASS 6: a different entity type entirely — FAQ create/edit/delete
  // ---------------------------------------------------------------
  {
    await page.goto(`${BASE}/admin/faqs/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('form', { timeout: 30000 });
    const q = 'VERIFY TEST QUESTION ' + Date.now();
    const fields = await page.evaluate(() => [...document.querySelectorAll('input[name],textarea[name],select[name]')].map((e) => e.name));
    const qField = fields.find((f) => /question/i.test(f)) || 'question';
    const aField = fields.find((f) => /answer/i.test(f)) || 'answer';
    await page.fill(`[name="${qField}"]`, q).catch(() => {});
    await page.fill(`[name="${aField}"]`, 'Verification answer.').catch(() => {});
    await page.evaluate(() => { const f = document.querySelector('form'); if (f) f.submit(); });
    await page.waitForTimeout(2000);

    await page.goto(`${BASE}/admin/faqs`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(800);
    const created = await page.evaluate((text) => document.body.innerText.includes(text), q);

    // find and delete it
    const deleted = await page.evaluate((text) => {
      const row = [...document.querySelectorAll('tr, li')].find((el) => (el.textContent || '').includes(text));
      if (!row) return 'not-found';
      const form = row.querySelector('form[action*="/delete"]') || [...row.querySelectorAll('form')].find((f) => /delete/i.test(f.getAttribute('action') || ''));
      if (!form) return 'no-delete-form';
      form.submit();
      return 'submitted';
    }, q);
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/admin/faqs`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(800);
    const goneAfterDelete = await page.evaluate((text) => !document.body.innerText.includes(text), q);

    report('FAQ create -> list -> delete round trip (separate entity type)', created && goneAfterDelete,
      `created visible: ${created}, delete: ${deleted}, cleaned up: ${goneAfterDelete}`);
  }

  // ---------------------------------------------------------------
  // PASS 7: full visitor journey — home -> Cost Calculator -> compute -> no errors
  // ---------------------------------------------------------------
  {
    const errs = [];
    const journeyPage = await ctx.newPage();
    journeyPage.on('pageerror', (e) => errs.push(e.message));
    await journeyPage.goto(`${BASE}/index.html`, { waitUntil: 'load', timeout: 60000 });
    const navLink = await journeyPage.$('a:has-text("Cost Calculator")');
    const navFound = !!navLink;
    if (navLink) {
      await Promise.all([journeyPage.waitForLoadState('load'), navLink.click()]);
      await journeyPage.waitForTimeout(1000);
      const calcLink = await journeyPage.$('a[href*="construction-cost-calculator"]');
      if (calcLink) {
        await Promise.all([journeyPage.waitForLoadState('load'), calcLink.click()]);
        await journeyPage.waitForTimeout(1000);
        await journeyPage.fill('#floorAreaInput', '1200').catch(() => {});
        await journeyPage.dispatchEvent('#floorAreaInput', 'input').catch(() => {});
        await journeyPage.waitForTimeout(500);
      }
    }
    const total = await journeyPage.textContent('#dispTotalCost').catch(() => null);
    await journeyPage.close();

    report('Full visitor journey: home -> nav -> calculator -> compute, no JS errors',
      navFound && !!total && errs.length === 0,
      `nav link found: ${navFound}, total computed: ${total}, js errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  }

  // ---------------------------------------------------------------
  // Site-wide crawl (separate from the 7 passes): representative pages,
  // sequential single-page navigations, checking console errors + broken
  // <img> tags (naturalWidth === 0 after load) + nav/footer presence.
  // ---------------------------------------------------------------
  const CRAWL_PAGES = [
    'index.html', 'about.html', 'faq.html', 'contact.html', 'service-areas.html',
    'projects.html', 'gallery.html', 'products-and-solutions.html',
    'apartment-building.html', 'duplex-steel-building.html', 'simplex-steel-building.html',
    'cottage-house.html', 'container-house.html', 'steel-house.html', 'tiny-house.html',
    'wooden-house.html', 'low-cost-house.html', 'concrete-building.html', 'luxury-villa.html',
    'construction-cost-calculator.html', 'land-registration-cost-calculator.html',
    'interactive-tools.html', 'certifications.html', 'steel-vs-concrete-comparison.html',
    'bh-ch-413.html', 'bh-cb-901.html', 'bh-tsb-101.html',
  ];
  console.log(`\n--- SITE CRAWL: ${CRAWL_PAGES.length} pages, sequential ---`);
  const crawlIssues = [];
  for (const p of CRAWL_PAGES) {
    const cp = await ctx.newPage();
    const errs = [];
    cp.on('pageerror', (e) => errs.push(e.message));
    let status = null;
    cp.on('response', (r) => { if (r.url().endsWith('/' + p)) status = r.status(); });
    try {
      await cp.goto(`${BASE}/${p}`, { waitUntil: 'load', timeout: 45000 });
      await cp.waitForTimeout(600);
      const check = await cp.evaluate(() => {
        const broken = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && i.src);
        return {
          nav: !!document.querySelector('nav, #mainNav'),
          footer: document.querySelectorAll('footer').length,
          brokenImgs: broken.map((i) => i.src),
        };
      });
      const bad = errs.length || !check.nav || check.footer !== 1 || check.brokenImgs.length;
      if (bad) {
        crawlIssues.push({ page: p, status, errs, ...check });
        console.log(`  ISSUE ${p}: status=${status} nav=${check.nav} footer=${check.footer} brokenImgs=${check.brokenImgs.length} jsErrs=${errs.length}`);
        if (check.brokenImgs.length) check.brokenImgs.forEach((src) => console.log('      broken img:', src));
        if (errs.length) errs.forEach((e) => console.log('      js error:', e));
      } else {
        console.log(`  ok      ${p}`);
      }
    } catch (e) {
      crawlIssues.push({ page: p, error: e.message });
      console.log(`  FAILED  ${p}: ${e.message}`);
    }
    await cp.close();
  }

  console.log(`\n\n========== SUMMARY ==========`);
  results.forEach((r, i) => console.log(`  ${i + 1}. ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`));
  console.log(`\ncrawl: ${CRAWL_PAGES.length - crawlIssues.length}/${CRAWL_PAGES.length} clean, ${crawlIssues.length} with issues`);

  await browser.close();
})();
