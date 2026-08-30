const path = require('path');
const fs = require('fs');
const { stripTags } = require('../../lib/sanitize');

/** A plain number stays as-is; an HTML-wrapped numeric string (e.g. total-row
 * areas like "<span style='...'>600</span>") is stripped and parsed; empty/
 * missing values (header rows with no area) become null rather than 0. */
function numericFromMaybeHtml(value) {
  if (typeof value === 'number') return value;
  const stripped = stripTags(String(value || ''));
  if (stripped === '') return null;
  const n = Number(stripped);
  return Number.isFinite(n) ? n : null;
}

// Landing-page slug doesn't always match the category name's own slugified
// form - "Low-Cost Villa" -> luxury-villa.html (the lcv-10x family
// variants back to the luxury-villa landing page, not a page of its own -
// see [[project-node-conversion-plan]]).
const LANDING_PAGE_BY_CATEGORY_SLUG = {
  'concrete-building': 'concrete-building.html',
  'cottage-house': 'cottage-house.html',
  'container-house': 'container-house.html',
  'duplex-steel-building': 'duplex-steel-building.html',
  'simplex-steel-building': 'simplex-steel-building.html',
  'steel-house': 'steel-house.html',
  'tiny-house': 'tiny-house.html',
  'apartment-building': 'apartment-building.html',
  'wooden-house': 'wooden-house.html',
  'low-cost-villa': 'luxury-villa.html',
};

exports.seed = async function (knex) {
  const dataPath = path.join(__dirname, 'data', 'products.json');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Wrapped in one transaction so a crash partway through (a real failure
  // mode hit while building this - a bad floorData key threw mid-insert)
  // can't leave orphaned rows behind for the next run to collide with.
  // Tables cleared explicitly and in FK-dependency order rather than
  // relying on ON DELETE CASCADE cascading from categories.del() - some
  // shared-hosting MySQL configs default new tables to MyISAM, which
  // silently ignores FK constraints (no error, no enforcement) instead of
  // failing loudly, so cascade-on-delete can't be trusted without
  // explicitly forcing InnoDB (see migration 20260817000005).
  await knex.transaction(async (trx) => {
    await trx('product_rooms').del();
    await trx('product_variants').del();
    await trx('product_specs').del();
    await trx('products').del();
    await trx('categories').del();

    await seedInto(trx, products);
  });
};

async function seedInto(knex, products) {
  const categoryNames = [...new Set(products.map((p) => p.categoryName))].sort();
  const categoryIdBySlug = {};
  for (const [i, name] of categoryNames.entries()) {
    const slug = products.find((p) => p.categoryName === name).categorySlug;
    const [id] = await knex('categories').insert({
      slug,
      name,
      landing_page_slug: LANDING_PAGE_BY_CATEGORY_SLUG[slug] || null,
      sort_order: i,
    });
    categoryIdBySlug[slug] = id;
  }

  let inserted = 0;
  for (const p of products) {
    const categoryId = categoryIdBySlug[p.categorySlug];
    if (!categoryId) {
      console.log(`Skipping ${p.filename}: no category for slug "${p.categorySlug}"`);
      continue;
    }

    const [productId] = await knex('products').insert({
      category_id: categoryId,
      model_number: p.modelNumber || p.filename,
      slug: p.filename,
      title: p.title,
      description: p.description,
      meta_title: (p.metaTitle || `${p.categoryName} in Bangladesh | ${p.modelNumber || p.filename}`),
      meta_description: p.metaDescription || p.description,
      fixed_price: p.fixedPrice || null,
      total_floor_area: p.totalFloorArea || null,
      price_per_sqft: p.pricePerSqft,
      price_currency: p.priceCurrency || 'BDT',
      main_image: p.mainImage,
    });
    inserted++;

    if (p.buildingSpecs && p.buildingSpecs.length) {
      await knex('product_specs').insert(
        p.buildingSpecs.map((s) => ({ product_id: productId, ...s }))
      );
    }

    if (p.floorData && !p.floorData.__error) {
      let variantSort = 0;
      for (const [areaKey, tier] of Object.entries(p.floorData)) {
        // Most tier keys are a plain sqft number; a few aren't (Tiny
        // House's "250-350" range, dv-110..113's "650x2" floor-count
        // shorthand) - area_sqft keeps a best-effort leading number,
        // area_label keeps the original string so nothing's lost.
        const cleanNumber = Number(areaKey);
        const areaSqft = Number.isFinite(cleanNumber) ? cleanNumber : (parseInt(areaKey, 10) || null);
        const [variantId] = await knex('product_variants').insert({
          product_id: productId,
          area_sqft: areaSqft,
          area_label: areaKey,
          bed: tier.bed ? parseInt(tier.bed, 10) || null : null,
          bath: tier.bath ? parseInt(tier.bath, 10) || null : null,
          kitchen: tier.kitchen ? parseInt(tier.kitchen, 10) || null : null,
          living: tier.living ? parseInt(tier.living, 10) || null : null,
          drawing: tier.drawing || null,
          dining: tier.dining || null,
          sort_order: variantSort++,
        });

        if (Array.isArray(tier.rooms)) {
          await knex('product_rooms').insert(
            // The scraped `section`/`area` text carries raw <b>/<span>
            // markup from the original static pages (bold floor headers
            // like "Ground Floor" and colored "Total (...)" rows, whose
            // area value is wrapped the same way, e.g. "<span
            // style='...'>600</span>"). Stripped here rather than stored
            // as-is: the template renders `section` through Nunjucks'
            // default auto-escaping and would otherwise print the literal
            // tags, and the wrapped area string failed the old numeric
            // check and silently became null. `is_total_row` (already used
            // by the template for bold styling) picks up both real total
            // rows and the bold floor-header rows, so the intended
            // emphasis survives the markup strip instead of being lost
            // with it.
            tier.rooms.map((room, i) => {
              const rawSection = room.section || '';
              return {
                product_variant_id: variantId,
                floor_label: room.floor || null,
                section: stripTags(rawSection),
                area_sqft: numericFromMaybeHtml(room.area),
                length_ft: typeof room.length === 'number' ? room.length : null,
                width_ft: typeof room.width === 'number' ? room.width : null,
                is_total_row: /total/i.test(rawSection) || /<b>|font-weight:\s*700/i.test(rawSection),
                sort_order: i,
              };
            })
          );
        }
      }
    }
  }

  console.log(`Seeded ${categoryNames.length} categories, ${inserted} products.`);
};
