// Schema informed by a direct markup survey across all bh-* families plus
// the 12 category-landing pages and the two orphan families that don't
// follow the bh-* prefix (dv-110..113, lcv-101..109) - see
// [[project-node-conversion-plan]] for the full findings. Key decisions
// that came out of that survey, not guessed up front:
//  - JSON-LD `name`/category is sometimes wrong (copy-paste placeholder
//    errors, one page mislabeling itself as a different family) - category
//    membership is asserted by this schema's own foreign keys, not trusted
//    from scraped JSON-LD at read time.
//  - The visible "price" box is always a static "Contact for Quote" CTA;
//    the only real number is JSON-LD's per-sqft rate (`offers.price`),
//    absent entirely on custom-quote category pages - price_per_sqft is
//    nullable.
//  - Each product page offers multiple floor-area tiers (a `floorData{N}`
//    JS object per tier) with their own bed/bath/kitchen counts and room
//    breakdown - that's product_variants + product_rooms, not columns on
//    products itself.
//  - Building Specifications rows (FOOTING/WALL/DOOR/... for most
//    families, Structure/Clear Height/Access for Industrial Sheds) use a
//    different vocabulary per family - a fixed-column table can't hold
//    both without a pile of always-null columns, so product_specs is
//    key/value.
exports.up = async function (knex) {
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    // Filename prefix (bh-sb, bh-cb, bh-ch-4, bh-ch-5, dv-legacy, lcv, ...)
    // rather than anything scraped from JSON-LD, since that's what's
    // actually reliable across the family.
    table.string('slug', 50).notNullable().unique();
    table.string('name', 255).notNullable();
    // The static landing page this family variants back to
    // (isVariantOf.url in JSON-LD, e.g. simplex-steel-building.html) -
    // nullable because the two orphan families don't have their own
    // dedicated landing page today.
    table.string('landing_page_slug', 255).nullable();
    table.text('description').nullable();
    table.string('hero_image', 500).nullable();
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.integer('category_id').unsigned().notNullable()
      .references('id').inTable('categories').onDelete('RESTRICT');
    table.string('model_number', 50).notNullable().unique(); // e.g. BH-SB-302
    table.string('slug', 255).notNullable().unique(); // e.g. bh-sb-302.html
    table.string('title', 500).notNullable();
    table.text('description').nullable();
    table.decimal('price_per_sqft', 10, 2).nullable();
    table.string('price_currency', 10).notNullable().defaultTo('BDT');
    table.string('main_image', 500).nullable();
    table.boolean('published').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('product_variants', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable()
      .references('id').inTable('products').onDelete('CASCADE');
    table.integer('area_sqft').notNullable(); // the floor-area tier key
    table.integer('bed').nullable();
    table.integer('bath').nullable();
    table.integer('kitchen').nullable();
    table.integer('living').nullable();
    table.string('drawing', 50).nullable(); // often "N/A" - kept as text, not a count
    table.string('dining', 50).nullable();
    table.integer('sort_order').notNullable().defaultTo(0);
    table.unique(['product_id', 'area_sqft']);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('product_rooms', (table) => {
    table.increments('id').primary();
    table.integer('product_variant_id').unsigned().notNullable()
      .references('id').inTable('product_variants').onDelete('CASCADE');
    // "Ground Floor" / "First floor" header for 2-floor families
    // (bh-cb-9xx, bh-dv-2xx, bh-sh-6xx, bh-tsb-1xx); null for single-floor
    // families.
    table.string('floor_label', 100).nullable();
    table.string('section', 255).notNullable(); // e.g. "Master Bedroom", or a "Total" row
    table.decimal('area_sqft', 10, 2).nullable();
    table.decimal('length_ft', 10, 2).nullable();
    table.decimal('width_ft', 10, 2).nullable();
    table.boolean('is_total_row').notNullable().defaultTo(false);
    table.integer('sort_order').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('product_specs', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable()
      .references('id').inTable('products').onDelete('CASCADE');
    table.string('spec_key', 255).notNullable(); // "FOOTING", "Clear Height", ...
    table.text('spec_value').notNullable();
    table.integer('sort_order').notNullable().defaultTo(0);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product_specs');
  await knex.schema.dropTableIfExists('product_rooms');
  await knex.schema.dropTableIfExists('product_variants');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('categories');
};
