const fs = require('fs');
const path = require('path');
const { processAndSaveImage, isSharpAvailable, UPLOADS_DIR } = require('../lib/image-processor');

async function runTests() {
  console.log('=== 1. TESTING SHARP IMAGE PROCESSING PIPELINE ===');

  const sharpLoaded = isSharpAvailable();
  console.log(`PASS: sharp availability check -> ${sharpLoaded ? 'Loaded' : 'Fallback mode'}`);

  if (!sharpLoaded) {
    console.error('FAIL: Expected sharp to be available');
    process.exit(1);
  }

  // Create a 100x100 PNG buffer using sharp
  const sharp = require('sharp');
  const testPngBuffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 30, g: 64, b: 175, alpha: 1 },
    },
  }).png().toBuffer();

  const savedRelPath = await processAndSaveImage(testPngBuffer, 'sample-factory-shed.png', { maxWidth: 1200, quality: 80 });
  console.log(`PASS: Processed test image -> ${savedRelPath}`);

  if (!savedRelPath.endsWith('.webp')) {
    console.error(`FAIL: Expected output to end with .webp, got ${savedRelPath}`);
    process.exit(1);
  }

  const absoluteSavedPath = path.join(__dirname, '..', '..', savedRelPath);
  if (!fs.existsSync(absoluteSavedPath)) {
    console.error(`FAIL: File does not exist on disk at ${absoluteSavedPath}`);
    process.exit(1);
  }

  const meta = await sharp(absoluteSavedPath).metadata();
  console.log(`PASS: Output image metadata: format=${meta.format}, width=${meta.width}px, height=${meta.height}px`);

  if (meta.format !== 'webp' || meta.width !== 100 || meta.height !== 100) {
    console.error('FAIL: Output metadata mismatch');
    process.exit(1);
  }

  // Clean up test file
  try {
    fs.unlinkSync(absoluteSavedPath);
    console.log('PASS: Cleaned up temporary test file');
  } catch (err) {}

  console.log('\n=== ALL IMAGE PIPELINE TESTS PASSED CLEANLY! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
