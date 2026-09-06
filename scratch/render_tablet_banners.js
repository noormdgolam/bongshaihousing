const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const template = fs.readFileSync(path.resolve(__dirname, 'banner-template-tablet.html'), 'utf8');

const slides = [
  { id: 'apartment-building', image: 'apt-2.jpeg', title: 'Apartment Building' },
  { id: 'duplex-steel-building', image: 'dv-2.webp', title: 'Duplex Steel Building' },
  { id: 'simplex-prefab-building', image: 'simplex-2.webp', title: 'Single Story Prefab Building' },
  { id: 'cottage-house', image: 'cottage-1.webp', title: 'Luxurious Cottage' },
  { id: 'container-house', image: 'container-2.webp', title: 'Container House' },
  { id: 'steel-structure-house', image: 'steel-2.webp', title: 'Steel Structure Building' },
  { id: 'tiny-house', image: 'tiny-1.webp', title: 'Tiny House' },
  { id: 'wooden-house', image: 'wooden-1.webp', title: 'Wooden House' },
];

(async () => {
  const browser = await chromium.launch();

  for (const slide of slides) {
    let html = template;
    html = html.replace('banner-assets/apt-1.jpeg', 'banner-assets/' + slide.image);
    html = html.replace('Apartment Building', slide.title);

    const tmpFile = path.resolve(__dirname, `_tmp_tab_${slide.id}.html`);
    fs.writeFileSync(tmpFile, html);

    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
    await page.goto('file://' + tmpFile);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.resolve(__dirname, 'banner-output', `${slide.id}-tablet-banner.png`) });
    await page.close();
    fs.unlinkSync(tmpFile);
    console.log('rendered', slide.id);
  }

  await browser.close();
})();
