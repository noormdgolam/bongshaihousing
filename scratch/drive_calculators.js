// Drives both calculators as a user would: change inputs, confirm the total
// actually recomputes. A retheme shouldn't touch behaviour, but the conversion
// has broken the JS before (a duplicated <script> redeclaring BD_GEO), so this
// checks the maths still runs rather than assuming.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

// Figures render in Bengali numerals, so a plain [^0-9] strip yields 0.
const BN = '০১২৩৪৫৬৭৮৯';
const toNum = (s) => Number(String(s).replace(/[০-৯]/g, (d) => BN.indexOf(d))
                                     .replace(/[^0-9.]/g, '')) || 0;
const toNumSrc = toNum.toString().replace('BN.indexOf(d)', `'০১২৩৪৫৬৭৮৯'.indexOf(d)`);


async function ctx(browser, width) {
  const c = await browser.newContext({ viewport: { width, height: 900 } });
  await c.route('**/*', (r) => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'local.test') return r.abort();
    const f = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, body: fs.readFileSync(f) });
  });
  return c;
}

(async () => {
  const browser = await chromium.launch();
  const c = await ctx(browser, 1440);
  let failures = 0;

  // --- Construction calculator ---
  {
    const p = await c.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('https://local.test/construction-cost-calculator.html', { waitUntil: 'load' });
    await p.waitForTimeout(400);

    const read = () => p.textContent('#dispTotalCost');
    const before = await read();

    await p.fill('#floorAreaInput', '1500');
    await p.dispatchEvent('#floorAreaInput', 'input');
    await p.waitForTimeout(250);
    const afterArea = await read();

    const floorBtns = await p.$$('.floor-btn');
    await floorBtns[3].click();               // 4 floors
    await p.waitForTimeout(250);
    const afterFloors = await read();

    const finish = await p.$$('.finish-card');
    await finish[2].click();                  // premium
    await p.waitForTimeout(250);
    const afterFinish = await read();

    console.log('construction totals:', { before, afterArea, afterFloors, afterFinish });
    const uniq = new Set([before, afterArea, afterFloors, afterFinish]);
    if (uniq.size !== 4) { console.log('  FAIL: total did not change on every input'); failures++; }
    if (errs.length) { console.log('  FAIL: js errors', errs); failures++; }

    // the breakdown must sum back to the total
    const sane = await p.evaluate((src) => {
      const toNum = eval(src);
      const t = toNum(document.querySelector('#dispTotalCost').textContent);
      const parts = ['#dispStructCost', '#dispFinishCost', '#dispMepCost']
        .map((s) => toNum(document.querySelector(s).textContent));
      return { t, sum: parts.reduce((a, b) => a + b, 0), parts };
    }, toNumSrc);
    const drift = Math.abs(sane.t - sane.sum) / sane.t;
    console.log('  breakdown sum check:', sane, 'drift', (drift * 100).toFixed(2) + '%');
    if (!(drift < 0.02)) { console.log('  FAIL: breakdown does not sum to total'); failures++; }
    await p.close();
  }

  // --- Land registration calculator ---
  {
    const p = await c.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('https://local.test/land-registration-cost-calculator.html', { waitUntil: 'load' });
    await p.waitForTimeout(400);

    const read = () => p.textContent('#dispTotalCost');
    const before = await read();

    const input = await p.$('#landValueInput, .calc-input');
    await input.fill('5000000');
    await input.dispatchEvent('input');
    await p.waitForTimeout(250);
    const afterValue = await read();

    const areaBtns = await p.$$('.area-type-card, .area-card, .tier-tab-btn');
    if (areaBtns.length > 1) { await areaBtns[1].click(); await p.waitForTimeout(250); }
    const afterArea = await read();

    console.log('land totals:', { before, afterValue, afterArea });
    if (before === afterValue) { console.log('  FAIL: total did not react to land value'); failures++; }
    if (errs.length) { console.log('  FAIL: js errors', errs); failures++; }

    // government fees should land in the documented 8.5-14% band
    const pct = await p.evaluate((src) => {
      const toNum = eval(src);
      const t = toNum(document.querySelector('#dispTotalCost').textContent);
      const v = toNum(document.querySelector('#landValueInput, .calc-input').value);
      return v ? (t / v) * 100 : null;
    }, toNumSrc);
    console.log('  fees as % of land value:', pct && pct.toFixed(2) + '%');
    if (!(pct > 6 && pct < 16)) { console.log('  FAIL: fee percentage outside a plausible band'); failures++; }
    await p.close();
  }

  await browser.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nall interaction checks passed');
  process.exit(failures ? 1 : 0);
})();
