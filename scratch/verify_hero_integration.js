const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1000 } });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(1200);
  const closeBtn = await page.$('[class*="modal"] button, .modal-close, [aria-label="Close"]');
  if (closeBtn) { await closeBtn.click().catch(() => {}); await page.waitForTimeout(300); }
  await page.evaluate(() => {
    document.querySelectorAll('.hero-bg img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
  });
  await page.waitForTimeout(500);

  for (let i = 0; i < 5; i++) {
    await page.screenshot({ path: path.resolve(__dirname, 'banner-output', `integrated-slide-${i}.png`) });
    console.log('captured slide', i);
    await page.click('.category-swiper .swiper-button-next').catch(() => {});
    await page.waitForTimeout(900);
  }

  await browser.close();
})();
