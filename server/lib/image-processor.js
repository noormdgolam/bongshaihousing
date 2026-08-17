const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.warn('⚠️ [ImageProcessor] sharp module not available, falling back to raw file storage:', err.message);
  sharp = null;
}

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'images', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Sanitize filename base
 */
function sanitizeBaseName(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  const base = path.basename(filename || '', ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40);
  return base || 'upload';
}

/**
 * Process single image buffer and save as optimized WebP
 * @param {Buffer} buffer - Raw file buffer from memoryStorage
 * @param {string} originalName - Original filename
 * @param {object} options - Optional config (maxWidth, quality)
 * @returns {Promise<string>} - Relative web path (e.g. 'images/uploads/my-pic-12345.webp')
 */
async function processAndSaveImage(buffer, originalName, options = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid image buffer provided');
  }

  const base = sanitizeBaseName(originalName);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const maxWidth = options.maxWidth || 1600;
  const quality = options.quality || 82;

  const ext = path.extname(originalName || '').toLowerCase();
  const isSvg = ext === '.svg';

  if (sharp && !isSvg) {
    try {
      const outputFilename = `${base}-${unique}.webp`;
      const outputPath = path.join(UPLOADS_DIR, outputFilename);

      await sharp(buffer)
        .rotate() // auto-orient based on EXIF
        .resize({
          width: maxWidth,
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality, effort: 4 })
        .toFile(outputPath);

      return `images/uploads/${outputFilename}`;
    } catch (err) {
      console.warn('⚠️ [ImageProcessor] sharp processing failed, writing original buffer:', err.message);
    }
  }

  // Fallback: write original buffer as-is
  const fallbackFilename = `${base}-${unique}${ext || '.png'}`;
  const fallbackPath = path.join(UPLOADS_DIR, fallbackFilename);
  fs.writeFileSync(fallbackPath, buffer);
  return `images/uploads/${fallbackFilename}`;
}

module.exports = {
  processAndSaveImage,
  UPLOADS_DIR,
  isSharpAvailable: () => Boolean(sharp),
};
