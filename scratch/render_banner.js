const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.resolve(__dirname, 'banner-template.html'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.resolve(__dirname, 'banner-output', 'apartment-building-banner.png') });
  console.log('rendered');
  await browser.close();
})();
