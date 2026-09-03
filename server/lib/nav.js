// Builds the site nav as a parent->children tree from nav_items, plus the
// separate categories list the 'category_grid' item type renders instead of
// its own children (categories already has hero_image/sort_order - no need
// to duplicate that data into nav_items). One shared function so both the
// live-request middleware (server.js) and the static-page regenerator
// (liveSiteSync.js) build the exact same structure from the same source.
const fs = require('fs');
const path = require('path');
const db = require('./db');

const REPO_ROOT = path.join(__dirname, '..', '..');
const VARIANT_WIDTHS = [400, 700];
const PLACEHOLDER_IMAGE = 'images/products/coming-soon-placeholder.png';
const srcsetCache = new Map();

// The old hardcoded nav shipped a srcset of pre-generated -400w/-700w
// variants per category image. Rendering from the DB lost that, which
// matters on this site (mobile-data-constrained audience). Rebuild it by
// checking which variants actually exist on disk - never fabricate a URL for
// a file that isn't there. Cached per image path; a process restart picks up
// newly generated variants.
function buildSrcset(image, baseWidth) {
  if (!image) return null;
  const cacheKey = `${image}|${baseWidth || ''}`;
  if (srcsetCache.has(cacheKey)) return srcsetCache.get(cacheKey);

  const ext = path.extname(image);
  const base = image.slice(0, -ext.length);
  const parts = [];
  for (const w of VARIANT_WIDTHS) {
    const variant = `${base}-${w}w${ext}`;
    if (fs.existsSync(path.join(REPO_ROOT, variant))) {
      parts.push(`${encodeURI(variant)} ${w}w`);
    }
  }
  let result = null;
  if (parts.length) {
    // Descriptor for the full-size file has to be its real width, not an
    // assumed 1024 - the Apartment photo is 675 wide, and claiming 1024
    // makes the browser pick the wrong candidate.
    parts.push(`${encodeURI(image)} ${baseWidth || 1024}w`);
    result = parts.join(', ');
  }
  srcsetCache.set(cacheKey, result);
  return result;
}

// Real intrinsic dimensions for the <img width>/<height> attributes. Hardcoding
// a square 1024x1024 was wrong for images that aren't square (the Apartment
// photo is 675x720) and causes layout shift. Read once per image per process
// and cache; falls back to null (attributes omitted) if the file or sharp
// isn't available, which is still better than publishing wrong numbers.
const dimsCache = new Map();
async function imageDims(image) {
  if (!image) return null;
  if (dimsCache.has(image)) return dimsCache.get(image);
  let dims = null;
  try {
    const sharp = require('sharp');
    const meta = await sharp(path.join(REPO_ROOT, image)).metadata();
    if (meta && meta.width && meta.height) dims = { width: meta.width, height: meta.height };
  } catch (e) {
    dims = null;
  }
  dimsCache.set(image, dims);
  return dims;
}

async function getNavTree() {
  const [rows, categories] = await Promise.all([
    db('nav_items').where({ visible: true }).orderBy('sort_order'),
    db('categories').where({ show_in_nav: true }).orderBy('sort_order'),
  ]);

  const byParent = new Map();
  for (const row of rows) {
    const key = row.parent_id || 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(row);
  }

  const topLevel = byParent.get('root') || [];
  const navItems = topLevel.map((item) => ({
    ...item,
    children: byParent.get(item.id) || [],
  }));

  // Resolve against the image actually rendered - a category with no photo
  // falls back to the shared placeholder, and that still needs correct
  // dimensions so it doesn't shift layout either.
  const navCategories = await Promise.all(
    categories.map(async (c) => {
      const effective = c.hero_image || PLACEHOLDER_IMAGE;
      const dims = await imageDims(effective);
      return {
        ...c,
        hero_effective: effective,
        hero_srcset: buildSrcset(c.hero_image, dims && dims.width),
        hero_dims: dims,
      };
    })
  );

  return { navItems, navCategories };
}

module.exports = { getNavTree };
