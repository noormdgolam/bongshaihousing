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

const { cacheMiddleware } = require('../lib/pageCache');

const fs = require('fs');
const path = require('path');

const PRODUCTS_JSON_PATH = path.join(__dirname, '..', 'db', 'seeds', 'data', 'products.json');
let cachedProductsJson = null;
function getProductsFromJson() {
  if (!cachedProductsJson && fs.existsSync(PRODUCTS_JSON_PATH)) {
    try {
      cachedProductsJson = JSON.parse(fs.readFileSync(PRODUCTS_JSON_PATH, 'utf8'));
    } catch (e) {
      console.error('Failed to read products.json fallback:', e.message);
    }
  }
  return cachedProductsJson || [];
}

router.get('/:slug.html', cacheMiddleware, async (req, res, next) => {
  const slug = `${req.params.slug}.html`;
  if (!PRODUCT_SLUG_PATTERN.test(slug)) return next();

  try {
    let product = null;
    let category = null;
    let specs = [];
    let variants = [];

    if (db) {
      try {
        product = await db('products').where({ slug }).first();
        if (product) {
          category = await db('categories').where({ id: product.category_id }).first();
          specs = await db('product_specs').where({ product_id: product.id }).orderBy('sort_order');
          variants = await db('product_variants').where({ product_id: product.id }).orderBy('sort_order');

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
              const totalRow = v.rooms.find((r) => r.section && /total building area/i.test(r.section));
              v.totalArea = (totalRow && totalRow.area_sqft) || v.area_sqft;
              v.estimatedPrice = product.fixed_price || (product.price_per_sqft ? Math.round(v.totalArea * product.price_per_sqft) : null);
              v.estimatedPriceFormatted = v.estimatedPrice ? formatTaka(v.estimatedPrice) : null;
            }
          }
        }
      } catch (dbErr) {
        console.warn(`Database query failed for ${slug}, checking products.json fallback:`, dbErr.message);
        product = null;
      }
    }

    // JSON fallback if DB returned null or is unavailable
    if (!product) {
      const allJsonProducts = getProductsFromJson();
      const pData = allJsonProducts.find((p) => p.filename === slug || p.slug === slug);
      if (!pData) return next();

      product = {
        id: pData.modelNumber,
        model_number: pData.modelNumber,
        slug: pData.filename,
        title: pData.title,
        description: pData.description,
        fixed_price: pData.fixedPrice || null,
        total_floor_area: pData.totalFloorArea || null,
        price_per_sqft: pData.pricePerSqft || null,
        price_currency: pData.priceCurrency || 'BDT',
        main_image: pData.mainImage || null,
      };

      category = {
        name: pData.categoryName || 'Bongshai Housing',
        slug: pData.categorySlug || '',
      };

      specs = (pData.buildingSpecs || []).map((s, i) => ({
        spec_key: s.spec_key,
        spec_value: s.spec_value,
        sort_order: i,
      }));

      if (pData.floorData && !pData.floorData.__error) {
        variants = Object.entries(pData.floorData).map(([areaKey, tier], vIdx) => {
          const areaSqft = parseInt(areaKey, 10) || pData.totalFloorArea || 0;
          const rooms = (tier.rooms || []).map((r, rIdx) => ({
            product_variant_id: vIdx,
            section: (r.section || '').replace(/<[^>]*>/g, ''),
            area_sqft: typeof r.area === 'number' ? r.area : (parseFloat(String(r.area || '').replace(/<[^>]*>/g, '')) || null),
            length_ft: r.length || null,
            width_ft: r.width || null,
            is_total_row: /total/i.test(r.section || '') || /<b>/i.test(r.section || ''),
            sort_order: rIdx,
          }));

          const { groups, buildingTotal } = groupRoomsByFloor(rooms);
          const roomGroups = groups.map((g) => ({
            label: g.label,
            total: g.total,
            rows: g.rows.map((r) => ({
              ...r,
              icon: roomIcon(r.section),
              barPct: g.total ? Math.min(100, Math.round(((Number(r.area_sqft) || 0) / g.total) * 100)) : 0,
            })),
          }));

          const price = pData.fixedPrice || (pData.pricePerSqft ? Math.round(areaSqft * pData.pricePerSqft) : null);

          return {
            id: vIdx + 1,
            area_sqft: areaSqft,
            area_label: areaKey,
            bed: tier.bed ? parseInt(tier.bed, 10) || null : null,
            bath: tier.bath ? parseInt(tier.bath, 10) || null : null,
            kitchen: tier.kitchen ? parseInt(tier.kitchen, 10) || null : null,
            living: tier.living ? parseInt(tier.living, 10) || null : null,
            drawing: tier.drawing || null,
            dining: tier.dining || null,
            rooms,
            roomGroups,
            roomGroupsBuildingTotal: buildingTotal || areaSqft,
            totalArea: pData.totalFloorArea || areaSqft,
            estimatedPrice: price,
            estimatedPriceFormatted: price ? formatTaka(price) : null,
          };
        });
      }
    }

    if (product.fixed_price) {
      product.fixedPriceFormatted = formatTaka(product.fixed_price);
    }

    let relatedProducts = [];
    if (db) {
      try {
        relatedProducts = await db('products')
          .where({ category_id: product.category_id, published: true })
          .whereNot({ id: product.id })
          .orderBy('sort_order')
          .limit(4);
      } catch (e) {
        relatedProducts = [];
      }
    }

    if (!relatedProducts.length) {
      const allJson = getProductsFromJson();
      relatedProducts = allJson
        .filter((p) => (p.categorySlug === category.slug || p.categoryName === category.name) && p.filename !== product.slug)
        .slice(0, 4)
        .map((rp) => ({
          model_number: rp.modelNumber,
          slug: rp.filename,
          main_image: rp.mainImage,
          fixed_price: rp.fixedPrice || null,
          fromPriceFormatted: rp.fixedPrice ? formatTaka(rp.fixedPrice) : (rp.pricePerSqft && rp.totalFloorArea ? formatTaka(rp.pricePerSqft * rp.totalFloorArea) : null),
        }));
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
    console.error(`Product route execution failed for ${slug}:`, err.message);
    next();
  }
});

module.exports = router;
