// DB-backed product pages: takes priority over the static registry-driven
// route for the ~145 product URLs whose slug exists in the `products`
// table, so editing a product in /admin actually changes what's served
// live. Everything else (category landing pages, non-product content)
// still falls through to pagesRouter's static-registry rendering -
// products.json's scrape only covers individual model pages, not the 12
// category landing pages, which stay on the old path for now.
const express = require('express');
const db = require('../lib/db');
const { formatTaka } = require('../lib/format');

const router = express.Router();

// Cheap pre-filter so non-product pages never hit the DB unnecessarily
// while supporting all standard and custom product slugs created in admin panel
const PRODUCT_SLUG_PATTERN = /^(bh-[a-z0-9-]+|dv-[a-z0-9-]+|lcv-[a-z0-9-]+)\.html$/;

// Groups a variant's flat product_rooms list into floor sections for
// display. The seed data marks both bold floor-name headers ("Ground
// Floor") and total rows ("Total Floor Area" / "Total (Ground Floor)" /
// "Total Building Area") with the same is_total_row flag - the only way
// to tell them apart is whether a real area value is attached. A header
// has none; a total always does. Single-floor products have exactly one
// total row and no header row at all, so they naturally collapse to one
// unlabeled group.
function groupRoomsByFloor(rooms) {
  const groups = [];
  let current = { label: null, rows: [], total: null };
  let explicitBuildingTotal = null;
  for (const r of rooms) {
    const text = (r.section || '').trim();
    const hasArea = r.area_sqft !== null && r.area_sqft !== undefined && r.area_sqft !== '';
    if (r.is_total_row && !hasArea) {
      // Floor-name header (e.g. "Ground Floor") - starts a new group.
      if (current.label !== null || current.rows.length) groups.push(current);
      current = { label: text, rows: [], total: null };
    } else if (r.is_total_row && hasArea && /building/i.test(text)) {
      // "Total Building Area" is the whole-house figure, never a single
      // floor's subtotal - kept separate so it can't clobber the current
      // group's own total when both appear back-to-back in the data.
      explicitBuildingTotal = r.area_sqft;
    } else if (r.is_total_row && hasArea) {
      current.total = r.area_sqft;
    } else {
      current.rows.push(r);
    }
  }
  groups.push(current);
  for (const g of groups) {
    if (g.total == null) {
      const sum = g.rows.reduce((s, r) => s + (Number(r.area_sqft) || 0), 0);
      g.total = sum || null;
    }
  }
  // Single-floor products have exactly one (unlabeled) group and no
  // explicit building-total row - its own total IS the building total,
  // and needs to surface here since the template only prints a group's
  // total next to a floor-name header, which this group doesn't have.
  const buildingTotal = explicitBuildingTotal != null
    ? explicitBuildingTotal
    : groups.length > 1
      ? groups.reduce((s, g) => s + (Number(g.total) || 0), 0)
      : (groups[0] && groups[0].total) || null;
  return { groups, buildingTotal };
}

// Emoji glyph for a room's icon column, matched by keyword against its
// name. Structural/circulation rows (walls, stairs) get no icon so they
// visually recede rather than competing with actual rooms for attention.
function roomIcon(section) {
  const s = (section || '').toLowerCase();
  if (/wall|stair/.test(s)) return '';
  if (/bath|toilet|washroom/.test(s)) return '🚿';
  if (/kitchen/.test(s)) return '🍳';
  if (/bed/.test(s)) return '🛏️';
  if (/living|drawing|dining|family/.test(s)) return '🛋️';
  if (/veranda|varanda|porch|balcony/.test(s)) return '🌤️';
  if (/store|storage/.test(s)) return '📦';
  if (/garage|parking/.test(s)) return '🚗';
  return '🏠';
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
        const { groups, buildingTotal } = groupRoomsByFloor(v.rooms);
        v.roomGroups = groups.map((g) => ({
          label: g.label,
          total: g.total,
          rows: g.rows.map((r) => ({
            ...r,
            icon: roomIcon(r.section),
            barPct: g.total ? Math.min(100, Math.round(((Number(r.area_sqft) || 0) / g.total) * 100)) : 0,
          })),
        }));
        v.roomGroupsBuildingTotal = buildingTotal;
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

    // Cheapest variant's true total area per related product, so their
    // cards can show a real "From ৳X" price instead of the same static
    // "Contact for Quote" this page just stopped showing for the main
    // product - keeping the two inconsistent would look like a bug. Uses
    // the same "Total Building Area" room-row logic as the main product
    // above: a naive area_sqft (the per-floor tier key) would understate
    // 2-floor families by roughly half, the same bug already fixed there.
    if (relatedProducts.length) {
      const relatedIds = relatedProducts.map((p) => p.id);
      const relatedVariants = await db('product_variants').whereIn('product_id', relatedIds);
      if (relatedVariants.length) {
        const relatedRooms = await db('product_rooms')
          .whereIn('product_variant_id', relatedVariants.map((v) => v.id))
          .where('section', 'like', '%Total Building Area%');
        const totalRowByVariant = new Map(relatedRooms.map((r) => [r.product_variant_id, r.area_sqft]));
        const minTotalAreaByProduct = new Map();
        for (const v of relatedVariants) {
          const totalArea = totalRowByVariant.get(v.id) || v.area_sqft;
          const current = minTotalAreaByProduct.get(v.product_id);
          if (current === undefined || totalArea < current) {
            minTotalAreaByProduct.set(v.product_id, totalArea);
          }
        }
        for (const rp of relatedProducts) {
          const minTotalArea = minTotalAreaByProduct.get(rp.id);
          rp.fromPriceFormatted = (minTotalArea && rp.price_per_sqft)
            ? formatTaka(minTotalArea * rp.price_per_sqft)
            : null;
        }
      }
    }

    res.render('pages/product-detail.njk', {
      title: product.meta_title || product.title,
      description: product.meta_description || product.description,
      canonical: `https://bongshaihousing.com/${product.slug}`,
      ogTitle: product.meta_title || product.title,
      ogDescription: product.meta_description || product.description,
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
