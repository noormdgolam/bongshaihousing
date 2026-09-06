// Fixes the Low Cost House category's page copy through the dashboard, and in
// doing so exercises the whole round-trip the new fields were built for:
// save -> DB -> syncPageToLive regenerates the static .html -> LiteSpeed serves it.
//
// Both fields were copy-paste contaminated from Apartment Building. The intro was
// Apartment Building's verbatim ("multi-story steel-composite apartment buildings"),
// and the hero's tail after the em dash was pasted from it too, leaving "durable"
// twice in one sentence.
//
// Replacement copy states only what the data supports: 20 published models in this
// category, and pricing not yet published (every model page currently reads
// "Coming Soon" / "TBA"). No floor areas, prices or specs are invented.
//
//   ADMIN_PASSWORD=... node scratch/admin_fix_lch_copy.js [--apply]
const { chromium } = require('playwright');

const BASE = process.env.ADMIN_BASE || 'https://bongshaihousing.com';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@bongshaihousing.com';
const PASS = process.env.ADMIN_PASSWORD;
const APPLY = process.argv.includes('--apply');
const CATEGORY_ID = 51;

const HERO = 'Affordable, durable low cost housing built for families across Bangladesh.';
const INTRO = 'Bongshai Housing’s low cost house range covers compact, affordable home '
  + 'designs for families across Bangladesh. Twenty model layouts are currently listed, '
  + 'with pricing for each published on its model page as it is finalised.';

if (!PASS) { console.error('ADMIN_PASSWORD not set'); process.exit(1); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('input[name="email"]', { timeout: 30000 });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  if (/\/admin\/login/.test(page.url())) { console.error('login failed'); await browser.close(); process.exit(1); }

  await page.goto(`${BASE}/admin/categories/${CATEGORY_ID}/edit`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('[name="hero_subtitle"]', { timeout: 30000 });

  const before = await page.evaluate(() => ({
    hero: document.querySelector('[name="hero_subtitle"]').value,
    intro: document.querySelector('[name="intro_paragraph"]').value,
  }));
  console.log('BEFORE hero :', before.hero);
  console.log('BEFORE intro:', before.intro.slice(0, 80) + '…');
  console.log('\nAFTER  hero :', HERO);
  console.log('AFTER  intro:', INTRO.slice(0, 80) + '…');

  if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); await browser.close(); return; }

  await page.fill('[name="hero_subtitle"]', HERO);
  await page.fill('[name="intro_paragraph"]', INTRO);
  await page.evaluate(() => {
    const form = [...document.querySelectorAll('form')].find((f) => (f.getAttribute('action') || '').match(/\/admin\/categories\/\d+$/));
    form.submit();
  });
  // the save also triggers syncPageToLive, which re-renders the static page
  await page.waitForTimeout(6000);

  const after = await page.evaluate(() => ({
    hero: document.querySelector('[name="hero_subtitle"]') ? document.querySelector('[name="hero_subtitle"]').value : null,
    intro: document.querySelector('[name="intro_paragraph"]') ? document.querySelector('[name="intro_paragraph"]').value : null,
    historyPanel: /Version History/.test(document.body.innerText),
  }));
  console.log('\nsaved hero matches :', after.hero === HERO);
  console.log('saved intro matches:', after.intro === INTRO);
  console.log('version history panel now present:', after.historyPanel);

  await browser.close();
})();
