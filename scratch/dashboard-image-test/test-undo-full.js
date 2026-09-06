const { chromium } = require('playwright');
const BASE = 'http://localhost:3001';
const EDIT = '/admin/products/1062/edit';
const CLEAN_TITLE = 'BH-TSB-101 | Apartment Building | Bongshai Housing';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  p.setDefaultTimeout(30000);
  p.setDefaultNavigationTimeout(30000);

  await p.goto(`${BASE}/admin/login`);
  await p.fill('#email', process.env.BONGSHAI_ADMIN_EMAIL);
  await p.fill('#password', process.env.BONGSHAI_ADMIN_PASSWORD);
  await Promise.all([p.waitForNavigation(), p.click('button[type="submit"]')]);
  if (p.url().includes('/admin/login')) throw new Error('login failed');
  console.log('[login] OK');

  async function save(title) {
    await p.goto(`${BASE}${EDIT}`, { waitUntil: 'domcontentloaded' });
    await p.fill('input[name="title"]', title);
    await p.locator('button[type="submit"]:has-text("Save")').first().click();
    await p.waitForLoadState('domcontentloaded');
  }

  // Baseline: set clean title (edit #1)
  await save(CLEAN_TITLE);
  console.log('[setup] saved clean title');

  // Edit #2 - the "mistake" we will undo
  await save(CLEAN_TITLE + ' MISTAKE');
  console.log('[edit] saved MISTAKE version');

  await p.goto(`${BASE}${EDIT}`, { waitUntil: 'domcontentloaded' });
  const beforeUndo = await p.locator('input[name="title"]').inputValue();
  console.log('[state] title before undo:', beforeUndo);

  const undo = p.locator('button:has-text("Undo Last Change")');
  const undoCount = await undo.count();
  console.log('[ui] Undo button present:', undoCount > 0);
  const histRows = await p.locator('h3:has-text("Version History")').locator('xpath=../..').locator('tbody tr').count();
  console.log('[ui] history rows listed:', histRows);

  if (undoCount > 0) {
    p.once('dialog', d => d.accept());
    await undo.click();
    await p.waitForLoadState('domcontentloaded');
  }

  await p.goto(`${BASE}${EDIT}`, { waitUntil: 'domcontentloaded' });
  const afterUndo = await p.locator('input[name="title"]').inputValue();
  console.log('[result] title after undo:', afterUndo);
  console.log('[result] UNDO WORKED:', afterUndo === CLEAN_TITLE);

  // Redo: restore the version we just moved away from (still in the list)
  const restoreBtns = p.locator('button:has-text("Restore")');
  const restoreCount = await restoreBtns.count();
  console.log('[ui] Restore buttons available (redo path):', restoreCount);

  await b.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
