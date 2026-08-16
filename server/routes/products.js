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

// Cheap pre-filter so the other ~210 non-product pages (category landing
// pages, about/contact/etc.) never hit the DB at all - only URLs shaped
// like a scraped product slug even attempt a lookup.
const PRODUCT_SLUG_PATTERN = /^(bh-[a-z]+-\d+|dv-\d+|lcv-\d+)\.html$/;

router.get('/:slug.html', async (req, res, next) => {
  const slug = `${req.params.slug}.html`;
  if (!PRODUCT_SLUG_PATTERN.test(slug)) return next();

  try {
    const product = await db('products').where({ slug }).first();
    if (!product) return next();

    const category = await db('categories').where({ id: product.category_id }).first();
    const specs = await db('product_specs').where({ product_id: product.id }).orderBy('sort_order');
    const variants = await db('product_variants').where({ product_id: product.id }).orderBy('sort_order');

    for (const v of variants) {
      v.rooms = await db('product_rooms').where({ product_variant_id: v.id }).orderBy('sort_order');
    }

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
    });
  } catch (err) {
    // DB hiccup: fall through to the static registry-driven page rather
    // than error the request - stale content beats no content.
    console.error(`DB product lookup failed for ${slug}, falling back to static page:`, err.message);
    next();
  }
});

module.exports = router;
