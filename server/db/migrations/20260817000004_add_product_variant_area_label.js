// Not every floorData<N> tier key is a clean sqft number: Tiny House
// (bh-th-7xx) uses a range ("250-350"), and the legacy dv-110..113 family
// encodes floor count into the key itself ("650x2" = 650 sqft per floor,
// 2 floors) rather than following the standard family's separate
// Ground/First-floor row convention. area_sqft keeps a best-effort leading
// number (for sorting/filtering); area_label preserves the original
// string verbatim so nothing is silently lossy.
exports.up = function (knex) {
  return knex.schema.alterTable('product_variants', (table) => {
    table.string('area_label', 50).nullable();
    table.integer('area_sqft').nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('product_variants', (table) => {
    table.dropColumn('area_label');
    table.integer('area_sqft').notNullable().alter();
  });
};
