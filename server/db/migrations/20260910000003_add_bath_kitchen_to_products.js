// Single source of truth for the "quick facts" a product shows on BOTH its
// detail-page hero chip AND its category card. bedrooms already lives on
// products (20260910000001); bathrooms + kitchens were still per-variant, so
// the hero (variant) and the category card (hardcoded) could drift. Promote
// them, backfill from the canonical variant, and align total_floor_area to the
// summed room areas so every surface reads one number.
exports.up = async function (knex) {
  const hasBath = await knex.schema.hasColumn('products', 'bathrooms');
  if (!hasBath) {
    await knex.schema.alterTable('products', (t) => {
      t.integer('bathrooms').nullable().after('bedrooms');
      t.integer('kitchens').nullable().after('bathrooms');
    });
  }
  // backfill from variant sort_order=0
  await knex.raw(`
    UPDATE products p
    JOIN product_variants v ON v.product_id = p.id AND v.sort_order = 0
    SET p.bathrooms = COALESCE(p.bathrooms, v.bath),
        p.kitchens  = COALESCE(p.kitchens, v.kitchen)
    WHERE p.slug LIKE 'bh-%'
  `);
  // total_floor_area := summed room areas of the canonical variant (they are
  // already equal for the 2026-09-10 backfill; this makes the rule explicit and
  // repairs any that drifted)
  await knex.raw(`
    UPDATE products p
    SET p.total_floor_area = (
      SELECT SUM(r.area_sqft)
      FROM product_rooms r
      JOIN product_variants v ON v.id = r.product_variant_id
      WHERE v.product_id = p.id AND v.sort_order = 0
    )
    WHERE p.slug LIKE 'bh-%'
      AND (SELECT SUM(r.area_sqft) FROM product_rooms r JOIN product_variants v ON v.id = r.product_variant_id WHERE v.product_id = p.id AND v.sort_order = 0) IS NOT NULL
  `);
};

exports.down = async function (knex) {
  const hasBath = await knex.schema.hasColumn('products', 'bathrooms');
  if (hasBath) {
    await knex.schema.alterTable('products', (t) => {
      t.dropColumn('bathrooms');
      t.dropColumn('kitchens');
    });
  }
};
