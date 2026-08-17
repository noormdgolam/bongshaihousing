// DB-backed product pages: takes priority over the static registry-driven
// route for the ~145 product URLs whose slug exists in the `products`
// table, so editing a product in /admin actually changes what's served
// live. Everything else (category landing pages, non-product content)
// still falls through to pagesRouter's static-registry rendering -
// products.json's scrape only covers individual model pages, not the 12
// category landing pages, which stay on the old path for now.
const express = require('express');
const db = require('../lib/db');

const router = express.Router();

// Cheap pre-filter so non-product pages never hit the DB unnecessarily
// while supporting all standard and custom product slugs created in admin panel
const PRODUCT_SLUG_PATTERN = /^(bh-[a-z0-9-]+|dv-[a-z0-9-]+|lcv-[a-z0-9-]+)\.html$/;

// Bangladeshi Lakh/Crore comma grouping (e.g. 3500000 -> "35,00,000"),
// plain digits since product pages are English-only.
function formatTaka(n) {
  let s = Math.round(n).toString();
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest !== '') {
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    s = rest + ',' + last3;
  } else {
    s = last3;
  }
  return '৳' + s;
}

router.get('/:slug.html', async (req, res, next) => {
  const slug = `${req.params.slug}.html`;
  if (!PRODUCT_SLUG_PATTERN.test(slug)) return next();

  try {
    const product = await db('products').where({ slug }).first();
    if (!product) return next();

    const category = await db('categories').where({ id: product.category_id }).first();
    const specs = await db('product_specs').where({ product_id: product.id }).orderBy('sort_order');
    const variants = await db('product_variants').where({ product_id: product.id }).orderBy('sort_order');

    // One batched query instead of one per variant (some models have 3+
    // tiers) - a real difference under this host's small connection pool
    // (see [[project-node-hosting-quirks]]).
    if (variants.length) {
      const allRooms = await db('product_rooms')
        .whereIn('product_variant_id', variants.map((v) => v.id))
        .orderBy('sort_order');
      const roomsByVariant = new Map();
      for (const room of allRooms) {
        if (!roomsByVariant.has(room.product_variant_id)) roomsByVariant.set(room.product_variant_id, []);
        roomsByVariant.get(room.product_variant_id).push(room);
      }
      for (const v of variants) {
        v.rooms = roomsByVariant.get(v.id) || [];
        // v.area_sqft is the tier key, which for 2-floor families (Ground
        // Floor + First floor) is the PER-FLOOR area, not the whole
        // building - using it directly would price a duplex at half its
        // real size. The seed data already computes the true total into a
        // "Total Building Area" row for those families; single-floor
        // families don't have that row, so v.area_sqft is already correct
        // for them.
        const totalRow = v.rooms.find((r) => r.section && /total building area/i.test(r.section));
        v.totalArea = (totalRow && totalRow.area_sqft) || v.area_sqft;
        v.estimatedPrice = product.price_per_sqft ? Math.round(v.totalArea * product.price_per_sqft) : null;
        v.estimatedPriceFormatted = v.estimatedPrice ? formatTaka(v.estimatedPrice) : null;
      }
    }

    const relatedProducts = await db('products')
      .where({ category_id: product.category_id, published: true })
      .whereNot({ id: product.id })
      .orderBy('sort_order')
      .limit(4);

    res.render('pages/product-detail.njk', {
      title: product.title,
      description: product.description,
      canonical: `https://bongshaihousing.com/${product.slug}`,
      ogTitle: product.title,
      ogDescription: product.description,
      ogImage: product.main_image ? `https://bongshaihousing.com/${product.main_image}` : undefined,
      category: category || { name: '' },
      product,
      specs,
      variants,
      relatedProducts,
    });
  } catch (err) {
    // DB hiccup: fall through to the static registry-driven page rather
    // than error the request - stale content beats no content.
    console.error(`DB product lookup failed for ${slug}, falling back to static page:`, err.message);
    next();
  }
});

module.exports = router;
