const { chromium } = require('playwright');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS = path.resolve(__dirname, 'banner-assets');

const slides = [
  { id: 'apartment-building', images: ['apt-1.jpeg', 'apt-2.jpeg', 'apt-3.jpeg'], title: 'Apartment Building' },
  { id: 'duplex-steel-building', images: ['dv-1.webp', 'dv-2.webp', 'dv-3.webp'], title: 'Duplex Steel Building' },
  { id: 'simplex-prefab-building', images: ['simplex-1.webp', 'simplex-2.webp', 'simplex-3.webp'], title: 'Single Story Prefab Building' },
  { id: 'cottage-house', images: ['cottage-1.webp', 'cottage-2.webp', 'cottage-3.webp'], title: 'Luxurious Cottage' },
  { id: 'container-house', images: ['container-1.webp', 'container-2.webp', 'container-3.webp'], title: 'Container House' },
  { id: 'steel-structure-house', images: ['steel-1.webp', 'steel-2.webp', 'steel-3.webp'], title: 'Steel Structure Building' },
];

// [canvasW, canvasH, titleBandH, footerH, gap, sidePad, outDir, outSuffix]
const SIZES = [
  { w: 1920, h: 1080, titleH: 280, footerH: 170, gap: 10, pad: 14, suffix: 'v2', titleFont: 64 },
  { w: 1080, h: 1350, titleH: 220, footerH: 230, gap: 10, pad: 16, suffix: 'tablet', titleFont: 54 },
  { w: 1080, h: 2338, titleH: 320, footerH: 338, gap: 10, pad: 16, suffix: 'mobile', titleFont: 62 },
];

async function getAspectRatios(images) {
  const ratios = [];
  for (const img of images) {
    const meta = await sharp(path.join(ASSETS, img)).metadata();
    ratios.push(meta.width / meta.height);
  }
  return ratios;
}

function justifiedWidths(ratios, containerWidth, gap) {
  const n = ratios.length;
  const usableWidth = containerWidth - gap * (n - 1);
  const sumRatios = ratios.reduce((a, b) => a + b, 0);
  const rowHeight = usableWidth / sumRatios;
  const widths = ratios.map(r => r * rowHeight);
  return { rowHeight, widths };
}

(async () => {
  const browser = await chromium.launch();

  for (const slide of slides) {
    const ratios = await getAspectRatios(slide.images);

    for (const size of SIZES) {
      const photoAreaW = size.w - size.pad * 2;
      const photoAreaH = size.h - size.titleH - size.footerH;
      let { rowHeight, widths } = justifiedWidths(ratios, photoAreaW, size.gap);

      // Cap row height so tall/narrow photo sets don't overflow the vertical budget
      if (rowHeight > photoAreaH) {
        const scale = photoAreaH / rowHeight;
        rowHeight = photoAreaH;
        widths = widths.map(w => w * scale);
      }

      const cellsHtml = slide.images.map((img, i) => `
        <div style="width:${widths[i].toFixed(1)}px; height:${rowHeight.toFixed(1)}px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.18);">
          <img src="banner-assets/${img}" style="width:100%; height:100%; object-fit:cover; display:block;">
        </div>`).join('');

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        * { margin:0; padding:0; box-sizing:border-box; }
        html, body { width:${size.w}px; height:${size.h}px; overflow:hidden; font-family: Georgia, 'Times New Roman', serif; }
        .banner { width:${size.w}px; height:${size.h}px; background:#0f172a; }
        .title-band { height:${size.titleH}px; display:flex; align-items:flex-end; justify-content:center; padding:0 60px ${Math.round(size.titleH*0.11)}px; border-bottom:3px solid #EAB308; }
        .title-band h1 { font-size:${size.titleFont}px; font-weight:700; letter-spacing:0.01em; color:#FDE047; text-transform:uppercase; text-align:center; line-height:1.15; }
        .photo-row { height:${photoAreaH}px; display:flex; align-items:center; justify-content:center; gap:${size.gap}px; padding:0 ${size.pad}px; }
        .button-footer { height:${size.footerH}px; }
      </style></head><body>
        <div class="banner">
          <div class="title-band"><h1>${slide.title}</h1></div>
          <div class="photo-row">${cellsHtml}</div>
          <div class="button-footer"></div>
        </div>
      </body></html>`;

      const tmpFile = path.resolve(__dirname, `_tmp_j_${slide.id}_${size.suffix}.html`);
      fs.writeFileSync(tmpFile, html);

      const page = await browser.newPage({ viewport: { width: size.w, height: size.h } });
      await page.goto('file://' + tmpFile);
      await page.waitForTimeout(250);
      const outName = size.suffix === 'v2' ? `${slide.id}-v2-banner.png` : `${slide.id}-${size.suffix}-banner.png`;
      await page.screenshot({ path: path.resolve(__dirname, 'banner-output', outName) });
      await page.close();
      fs.unlinkSync(tmpFile);
    }
    console.log('rendered', slide.id);
  }

  await browser.close();
})();
