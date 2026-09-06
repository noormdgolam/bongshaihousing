const { chromium } = require('playwright');
const path = require('path');

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'mobile-landscape', width: 812, height: 375 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1000 },
];

(async () => {
  const browser = await chromium.launch();

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
    await page.waitForTimeout(1200);
    const closeBtn = await page.$('[class*="modal"] button, .modal-close, [aria-label="Close"]');
    if (closeBtn) { await closeBtn.click().catch(() => {}); await page.waitForTimeout(300); }
    await page.evaluate(() => {
      document.querySelectorAll('.hero-bg img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
    });
    await page.waitForTimeout(500);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`${vp.name} (${vp.width}x${vp.height}): horizontal overflow = ${overflow}`);

    await page.screenshot({ path: path.resolve(__dirname, 'banner-output', `responsive-${vp.name}.png`) });
    await page.close();
  }

  await browser.close();
})();
