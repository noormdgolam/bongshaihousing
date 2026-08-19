// One-off backfill: every uploaded image (products/projects/team members/
// media library, all saved via lib/image-processor.js's processAndSaveImage)
// before the responsive-variant fix only ever got ONE file saved, while
// templates site-wide build a srcset assuming "-400w.webp"/"-700w.webp"
// siblings always exist. Missing variants 404 and the <img> just fails to
// render. This scans images/uploads/ for base files missing their variants
// and generates them in place from the existing full-size file - no need to
// touch the DB, every affected record already points at the base filename.
//
// Run once on the server (has real access to images/uploads/ - unlike FTP,
// which can't traverse the images/ symlink on this host):
//   cd bongshai-node-app-prod && source ../nodevenv/bongshai-node-app-prod/22/bin/activate
//   && node scripts/backfill-image-variants.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { UPLOADS_DIR } = require('../lib/image-processor');

const QUALITY = 82;

async function run() {
  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => f.toLowerCase().endsWith('.webp'));
  const baseFiles = files.filter((f) => !/-(400|700)w\.webp$/i.test(f));

  let fixed = 0;
  let alreadyOk = 0;
  let failed = 0;

  for (const file of baseFiles) {
    const withoutExt = file.slice(0, -'.webp'.length);
    const missing = [400, 700].filter((w) => !files.includes(`${withoutExt}-${w}w.webp`));
    if (!missing.length) { alreadyOk += 1; continue; }

    const sourcePath = path.join(UPLOADS_DIR, file);
    try {
      const source = sharp(sourcePath);
      for (const width of missing) {
        await source.clone()
          .resize({ width, withoutEnlargement: true, fit: 'inside' })
          .webp({ quality: QUALITY, effort: 4 })
          .toFile(path.join(UPLOADS_DIR, `${withoutExt}-${width}w.webp`));
      }
      fixed += 1;
      console.log(`fixed: ${file} (generated ${missing.join(', ')}w)`);
    } catch (err) {
      failed += 1;
      console.error(`FAILED: ${file} -> ${err.message}`);
    }
  }

  console.log(`\nDone. ${fixed} file(s) backfilled, ${alreadyOk} already had both variants, ${failed} failed.`);
}

run().catch((err) => { console.error('Backfill error:', err); process.exit(1); });
