const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1490, height: 900 } });
  await page.goto('https://bongshaihousing.com/bh-sb-301.html?cb=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: process.argv[2], fullPage: true });
  await browser.close();
})();
