// Data fix: product_variants.bed is now a mirror of products.bedrooms (the
// per-variant "Bed" input was removed from the admin form - bedrooms is a
// single source of truth, shown on the hero chip + category card). The backfill
// left one row out of sync (bh-tsb-101: products.bedrooms=5, variant.bed=4),
// which is what made that model show "5 Bedrooms" on the page but "4" in the
// editor. Align every variant to its product's bedrooms.
exports.up = async function (knex) {
  const hasBedrooms = await knex.schema.hasColumn('products', 'bedrooms');
  if (!hasBedrooms) return;
  await knex.raw(`
    UPDATE product_variants v
    JOIN products p ON p.id = v.product_id
    SET v.bed = p.bedrooms
    WHERE p.bedrooms IS NOT NULL AND (v.bed IS NULL OR v.bed <> p.bedrooms)
  `);
};

exports.down = async function () {
  // no-op: this only re-syncs denormalized data, nothing to reverse
};
