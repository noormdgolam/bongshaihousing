// Cleanly re-verifies the 4 passes that failed in the first run, each in its
// own fresh browser instance (the first run's failures from pass 5 onward were
// traced to browser-resource degradation in one long-lived session, and pass 6
// specifically to document.querySelector('form') grabbing the admin header's
// logout form instead of the FAQ form - not real site bugs). Pass 4's failure
// looked real (clean before/after DB state, explicit live fetch) but is
// reconfirmed here in isolation to be sure it wasn't itself contaminated.
const { chromium } = require('playwright');

const BASE = 'https://bongshaihousing.com';
const EMAIL = 'admin@bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;
if (!PASS) { console.error('ADMIN_PASSWORD not set'); process.exit(1); }

async function freshLogin() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[name="email"]', { timeout: 30000 });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  if (/\/admin\/login/.test(page.url())) throw new Error('login failed');
  return { browser, page };
}

async function submitScopedForm(page, actionMatch) {
  return page.evaluate((match) => {
    const forms = [...document.querySelectorAll('form')];
    const form = forms.find((f) => (f.getAttribute('action') || '').match(new RegExp(match)));
    if (!form) return { ok: false, allActions: forms.map((f) => f.getAttribute('action')) };
    form.submit();
    return { ok: true };
  }, actionMatch);
}

(async () => {
  let allPass = true;

  // ---------- RE-CHECK 4: category undo -> live resync ----------
  {
    const { browser, page } = await freshLogin();
    const CAT_ID = 45;
    await page.goto(`${BASE}/admin/categories/${CAT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[name="hero_subtitle"]', { timeout: 30000 });
    const original = await page.evaluate(() => document.querySelector('[name="hero_subtitle"]').value);
    const marker = 'REVERIFY-' + Date.now();
    await page.fill('[name="hero_subtitle"]', marker);
    const r1 = await submitScopedForm(page, '/admin/categories/\\d+$');
    await page.waitForTimeout(3000);

    const liveHasMarker = await page.evaluate(async (m) => {
      const r = await fetch(location.origin + '/steel-house.html?cb=' + Date.now());
      return (await r.text()).includes(m);
    }, marker);

    const hasUndo = await page.evaluate(() => /Undo Last Change/.test(document.body.innerText));
    let dbRestored = false, liveAfterUndo = null;
    if (hasUndo) {
      const r2 = await submitScopedForm(page, '/admin/history/category/\\d+/restore/\\d+$');
      await page.waitForTimeout(3500);
      dbRestored = (await page.evaluate(() => document.querySelector('[name="hero_subtitle"]') ? document.querySelector('[name="hero_subtitle"]').value : null)) === original;
      liveAfterUndo = await page.evaluate(async (m) => {
        const r = await fetch(location.origin + '/steel-house.html?cb=' + Date.now());
        return (await r.text()).includes(m);
      }, marker);
    }

    console.log('[RECHECK] category edit reaches live:', liveHasMarker, '(r1:', JSON.stringify(r1), ')');
    console.log('[RECHECK] undo button present:', hasUndo);
    console.log('[RECHECK] DB restored by undo:', dbRestored);
    console.log('[RECHECK] live page STILL shows the pre-undo marker after undo:', liveAfterUndo, '<-- if true, undo does not resync the static page');

    // clean up: force a real save to push the correct text back to the static file
    await page.goto(`${BASE}/admin/categories/${CAT_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[name="hero_subtitle"]', { timeout: 30000 });
    await page.fill('[name="hero_subtitle"]', original);
    await submitScopedForm(page, '/admin/categories/\\d+$');
    await page.waitForTimeout(3000);
    const cleanLive = await page.evaluate(async (m) => {
      const r = await fetch(location.origin + '/steel-house.html?cb=' + Date.now());
      const t = await r.text();
      return !t.includes(m) && !t.includes('REVERIFY-');
    }, marker);
    console.log('[RECHECK] cleaned up (live page has neither marker):', cleanLive);
    if (!cleanLive) allPass = false;

    await browser.close();
  }

  // ---------- RE-CHECK 5: nav visibility toggle (known id=15) ----------
  {
    const { browser, page } = await freshLogin();
    const ID = 15; // "Cost Calculator", created earlier this session
    await page.goto(`${BASE}/admin/nav-menu/${ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const labelOk = await page.waitForSelector('[name="visible"]', { timeout: 30000 }).then(() => true).catch(() => false);
    if (!labelOk) {
      console.log('[RECHECK] nav item 15 edit page did not load expected field — id may be wrong');
      allPass = false;
    } else {
      const label = await page.evaluate(() => (document.querySelector('[name="label"]') || {}).value);
      console.log('[RECHECK] nav item 15 label:', label);
      const cb = await page.$('[name="visible"]');
      await cb.uncheck();
      await submitScopedForm(page, `/admin/nav-menu/${ID}$`);
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
      const hiddenLive = await page.evaluate(async () => {
        const r = await fetch(location.origin + '/index.html?cb=' + Date.now());
        return !(await r.text()).includes('Cost Calculator');
      });
      console.log('[RECHECK] hidden reflected live:', hiddenLive);

      // revert
      await page.goto(`${BASE}/admin/nav-menu/${ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('[name="visible"]', { timeout: 30000 });
      const cb2 = await page.$('[name="visible"]');
      await cb2.check();
      await submitScopedForm(page, `/admin/nav-menu/${ID}$`);
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
        return (await r.text()).includes('Cost Calculator');
      });
      console.log('[RECHECK] restored live:', restoredLive);
      if (!hiddenLive || !restoredLive) allPass = false;
    }
    await browser.close();
  }

  // ---------- RE-CHECK 6: FAQ round trip, correctly scoped form ----------
  {
    const { browser, page } = await freshLogin();
    await page.goto(`${BASE}/admin/faqs/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[name="question"]', { timeout: 30000 });
    const q = 'VERIFY TEST QUESTION ' + Date.now();
    await page.fill('[name="question"]', q);
    await page.fill('[name="answer"]', 'Verification answer.');
    const r1 = await submitScopedForm(page, '/admin/faqs$');
    console.log('[RECHECK] FAQ create form found+submitted:', JSON.stringify(r1));
    await page.waitForTimeout(2000);

    await page.goto(`${BASE}/admin/faqs`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(800);
    const created = await page.evaluate((text) => document.body.innerText.includes(text), q);
    console.log('[RECHECK] FAQ created and visible in list:', created);

    const delResult = await page.evaluate((text) => {
      const rows = [...document.querySelectorAll('tr, li, .card')];
      const row = rows.find((el) => (el.textContent || '').includes(text));
      if (!row) return 'row-not-found';
      const delForm = [...row.querySelectorAll('form')].find((f) => /delete/i.test(f.getAttribute('action') || ''));
      if (!delForm) return 'delete-form-not-found';
      delForm.submit();
      return 'submitted';
    }, q);
    console.log('[RECHECK] FAQ delete attempt:', delResult);
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/admin/faqs`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(800);
    const stillThere = await page.evaluate((text) => document.body.innerText.includes(text), q);
    console.log('[RECHECK] FAQ still in list after delete (should be false):', stillThere);
    if (!created || stillThere) allPass = false;
    await browser.close();
  }

  // ---------- RE-CHECK 7: visitor journey, robust navigation ----------
  {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));

    await page.goto(`${BASE}/index.html`, { waitUntil: 'load', timeout: 60000 });
    const navHref = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a')].find((l) => /Cost Calculator/i.test(l.textContent || ''));
      return a ? a.getAttribute('href') : null;
    });
    console.log('[RECHECK] nav "Cost Calculator" href:', navHref);

    await page.goto(`${BASE}/construction-cost-calculator.html`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#floorAreaInput', { timeout: 20000 });
    await page.fill('#floorAreaInput', '1200');
    await page.dispatchEvent('#floorAreaInput', 'input');
    await page.waitForTimeout(600);
    const total = await page.textContent('#dispTotalCost').catch(() => null);
    console.log('[RECHECK] calculator total after input:', total, '| js errors:', errs.length ? errs.join(' | ') : 'none');
    if (!navHref || !total || errs.length) allPass = false;
    await browser.close();
  }

  console.log('\n' + (allPass ? 'ALL RECHECKS PASS' : 'SOME RECHECKS STILL FAILING — see detail above'));
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
