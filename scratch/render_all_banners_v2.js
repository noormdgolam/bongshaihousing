const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const template = fs.readFileSync(path.resolve(__dirname, 'banner-template-v2.html'), 'utf8');

const slides = [
  { id: 'apartment-building', images: ['apt-1.jpeg', 'apt-2.jpeg', 'apt-3.jpeg'], title: 'Apartment Building', band: '#FFEB3B', titleColor: '#111111' },
  { id: 'duplex-steel-building', images: ['dv-1.webp', 'dv-2.webp', 'dv-3.webp'], title: 'Duplex Steel Building', band: '#8BC34A', titleColor: '#7B1FA2' },
  { id: 'simplex-prefab-building', images: ['simplex-1.webp', 'simplex-2.webp', 'simplex-3.webp'], title: 'Single Story Prefab Building', band: '#FFEB3B', titleColor: '#5C2D91' },
  { id: 'cottage-house', images: ['cottage-1.webp', 'cottage-2.webp', 'cottage-3.webp'], title: 'Luxurious Cottage', band: '#F48FB1', titleColor: '#6A1B9A' },
  { id: 'container-house', images: ['container-1.webp', 'container-2.webp', 'container-3.webp'], title: 'Container House', band: '#8BC34A', titleColor: '#1565C0' },
  { id: 'steel-structure-house', images: ['steel-1.webp', 'steel-2.webp', 'steel-3.webp'], title: 'Steel Structure Building', band: '#A5D6A7', titleColor: '#D84315' },
  { id: 'tiny-house', images: ['tiny-1.webp', 'tiny-2.webp', 'tiny-3.webp'], title: 'Tiny House', band: '#D6D6D6', titleColor: '#C62828' },
  { id: 'wooden-house', images: ['wooden-1.webp', 'wooden-2.webp', 'wooden-3.webp'], title: 'Wooden House', band: '#F8BBD0', titleColor: '#4E342E' },
];

(async () => {
  const browser = await chromium.launch();

  for (const slide of slides) {
    let html = template;
    html = html.replace('banner-assets/apt-1.jpeg', 'banner-assets/' + slide.images[0]);
    html = html.replace('banner-assets/apt-2.jpeg', 'banner-assets/' + slide.images[1]);
    html = html.replace('banner-assets/apt-3.jpeg', 'banner-assets/' + slide.images[2]);
    html = html.replace('--band-color: #FFEB3B; --title-color: #111111;', `--band-color: ${slide.band}; --title-color: ${slide.titleColor};`);
    html = html.replace('Apartment Building', slide.title);

    const tmpFile = path.resolve(__dirname, `_tmp_v2_${slide.id}.html`);
    fs.writeFileSync(tmpFile, html);

    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('file://' + tmpFile);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.resolve(__dirname, 'banner-output', `${slide.id}-v2-banner.png`) });
    await page.close();
    fs.unlinkSync(tmpFile);
    console.log('rendered', slide.id);
  }

  await browser.close();
})();
