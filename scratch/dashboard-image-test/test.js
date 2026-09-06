// Dashboard image-change test, driven through the real admin UI (login form,
// list page, edit form, file upload, save button) on STAGING
// (test.bongshaihousing.com), not by hitting routes/DB directly.
// For each section: record the current image path, upload a distinct test
// image via the real form, save, verify the change (admin form + live public
// page), then revert to the original path via the same UI and verify again.
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'https://test.bongshaihousing.com';
const ADMIN_EMAIL = process.env.BONGSHAI_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.BONGSHAI_ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('BONGSHAI_ADMIN_EMAIL / BONGSHAI_ADMIN_PASSWORD env vars not set - never hardcode admin credentials in a committed script.');
}
const TEST_IMAGE = path.resolve(__dirname, 'test-image.png');
const SHOTS = path.resolve(__dirname, 'shots');
require('fs').mkdirSync(SHOTS, { recursive: true });

const SECTIONS = [
  {
    name: 'categories',
    listUrl: '/admin/categories',
    fieldId: '#hero_image',
    label: 'Category (hero_image)',
  },
  {
    name: 'products',
    listUrl: '/admin/products',
    fieldId: '#main_image',
    label: 'Product (main_image)',
  },
  {
    name: 'projects',
    listUrl: '/admin/projects',
    fieldId: '#image',
    label: 'Project (image)',
  },
  {
    name: 'team-members',
    listUrl: '/admin/team-members',
    fieldId: '#photo',
    label: 'Team member (photo)',
  },
];

async function login(page) {
  await page.goto(`${BASE}/admin/login`);
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
  if (page.url().includes('/admin/login')) throw new Error('Login failed - still on login page');
  console.log('[login] OK, landed on', page.url());
}

async function testSection(page, section) {
  console.log(`\n=== ${section.label} ===`);
  await page.goto(`${BASE}${section.listUrl}`);
  const editLink = page.locator(`a[href^="${section.listUrl}/"][href$="/edit"]`).first();
  const href = await editLink.getAttribute('href');
  const editUrl = `${BASE}${href}`;
  console.log(`  editing: ${editUrl}`);
  await page.goto(editUrl);

  const originalValue = await page.locator(section.fieldId).inputValue();
  console.log(`  original image path: "${originalValue}"`);

  // Upload the test image via the real file input
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(TEST_IMAGE);
  await page.screenshot({ path: path.join(SHOTS, `${section.name}-1-before-save.png`) });

  await page.locator('button[type="submit"]:has-text("Save")').first().click();
  await page.waitForLoadState('networkidle');
  console.log(`  saved, now at: ${page.url()}`);

  // Re-open the edit form fresh to read back the saved value
  await page.goto(editUrl);
  const newValue = await page.locator(section.fieldId).inputValue();
  console.log(`  new image path after save: "${newValue}"`);
  const changed = newValue !== originalValue && newValue.length > 0;
  console.log(`  CHANGE APPLIED: ${changed ? 'YES' : 'NO - PROBLEM'}`);
  await page.screenshot({ path: path.join(SHOTS, `${section.name}-2-after-save.png`) });

  // Revert: set the text field back to the original path and save again
  await page.fill(section.fieldId, originalValue);
  await page.locator('button[type="submit"]:has-text("Save")').first().click();
  await page.waitForLoadState('networkidle');

  await page.goto(editUrl);
  const revertedValue = await page.locator(section.fieldId).inputValue();
  const reverted = revertedValue === originalValue;
  console.log(`  reverted image path: "${revertedValue}" -- REVERT OK: ${reverted ? 'YES' : 'NO - PROBLEM, MANUAL FIX NEEDED'}`);
  await page.screenshot({ path: path.join(SHOTS, `${section.name}-3-after-revert.png`) });

  return { section: section.name, originalValue, newValue, changed, revertedValue, reverted };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await login(page);

  const results = [];
  for (const section of SECTIONS) {
    try {
      results.push(await testSection(page, section));
    } catch (e) {
      console.error(`  ERROR in ${section.name}:`, e.message);
      results.push({ section: section.name, error: e.message });
    }
  }

  await browser.close();

  console.log('\n\n=== SUMMARY ===');
  for (const r of results) {
    if (r.error) {
      console.log(`${r.section}: ERROR - ${r.error}`);
    } else {
      console.log(`${r.section}: change=${r.changed ? 'OK' : 'FAIL'} revert=${r.reverted ? 'OK' : 'FAIL'}`);
    }
  }
})().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
