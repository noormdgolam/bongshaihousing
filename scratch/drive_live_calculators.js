// Post-deploy check against production. One pass over the two pages - this
// machine's IP has been blocked for hammering the live site before, so no loops
// and no retries.
const { chromium } = require('playwright');

const BN = '০১২৩৪৫৬৭৮৯';
const toNumSrc = `((s) => Number(String(s).replace(/[০-৯]/g, (d) => '${BN}'.indexOf(d)).replace(/[^0-9.]/g, '')) || 0)`;
const BASE = 'https://bongshaihousing.com';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  let failures = 0;
  const fail = (m) => { console.log('  FAIL: ' + m); failures++; };

  // --- Construction ---
  {
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(`${BASE}/construction-cost-calculator.html`, { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(1500);

    const chrome = await p.evaluate(() => ({
      navCards: document.querySelectorAll('.mega-card').length,
      footer: !!document.querySelector('footer'),
      footerCount: document.querySelectorAll('footer').length,
      shell: !!document.querySelector('.calc-shell'),
      heroOutside: !!document.querySelector('.calc-app > .hero-box'),
      heroBg: getComputedStyle(document.querySelector('.hero-box')).backgroundImage.slice(0, 60),
      appBg: getComputedStyle(document.querySelector('.calc-app')).backgroundColor,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    console.log('construction chrome:', chrome);
    if (!chrome.shell) fail('no .calc-shell container');
    if (!chrome.heroOutside) fail('hero not hoisted out of the container');
    if (chrome.appBg !== 'rgb(248, 250, 252)') fail('calc-app ground is not the site off-white');
    if (chrome.overflow > 0) fail('horizontal overflow ' + chrome.overflow + 'px');
    if (chrome.footerCount !== 1) fail('footer landmarks: ' + chrome.footerCount);
    if (!chrome.navCards) fail('nav mega-cards missing');

    const read = () => p.textContent('#dispTotalCost');
    const before = await read();
    await p.fill('#floorAreaInput', '1500');
    await p.dispatchEvent('#floorAreaInput', 'input');
    await p.waitForTimeout(300);
    const afterArea = await read();
    (await p.$$('.floor-btn'))[3].click();
    await p.waitForTimeout(300);
    const afterFloors = await read();
    console.log('  totals:', { before, afterArea, afterFloors });
    if (new Set([before, afterArea, afterFloors]).size !== 3) fail('total did not recompute');

    const sums = await p.evaluate((src) => {
      const n = eval(src);
      const t = n(document.querySelector('#dispTotalCost').textContent);
      const parts = ['#dispStructCost', '#dispFinishCost', '#dispMepCost'].map((s) => n(document.querySelector(s).textContent));
      return { t, sum: parts.reduce((a, b) => a + b, 0) };
    }, toNumSrc);
    console.log('  breakdown:', sums);
    if (Math.abs(sums.t - sums.sum) / sums.t > 0.02) fail('breakdown does not sum to total');
    if (errs.length) fail('js errors: ' + errs.join(' | '));
    await p.close();
  }

  // --- Land registration ---
  {
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(`${BASE}/land-registration-cost-calculator.html`, { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(1500);

    const chrome = await p.evaluate(() => ({
      shell: !!document.querySelector('.calc-shell'),
      footerCount: document.querySelectorAll('footer').length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      resultBg: getComputedStyle(document.querySelector('.result-showcase')).backgroundColor,
    }));
    console.log('land chrome:', chrome);
    if (!chrome.shell) fail('no .calc-shell container');
    if (chrome.overflow > 0) fail('horizontal overflow ' + chrome.overflow + 'px');
    if (chrome.resultBg !== 'rgb(255, 255, 255)') fail('result panel is not the light card');

    const read = () => p.textContent('#dispTotalCost');
    const before = await read();
    const input = await p.$('#landValueInput, .calc-input');
    await input.fill('5000000');
    await input.dispatchEvent('input');
    await p.waitForTimeout(300);
    const after = await read();
    console.log('  totals:', { before, after });
    if (before === after) fail('total did not react to land value');

    const pct = await p.evaluate((src) => {
      const n = eval(src);
      const t = n(document.querySelector('#dispTotalCost').textContent);
      const v = n(document.querySelector('#landValueInput, .calc-input').value);
      return v ? (t / v) * 100 : null;
    }, toNumSrc);
    console.log('  fees as % of value:', pct && pct.toFixed(2) + '%');
    if (!(pct > 6 && pct < 16)) fail('fee percentage outside a plausible band');
    if (errs.length) fail('js errors: ' + errs.join(' | '));
    await p.close();
  }

  await browser.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nlive checks all passed');
  process.exit(failures ? 1 : 0);
})();
