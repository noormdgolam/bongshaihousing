// Migration: add `bedrooms` to products.
//
// The bedroom count shown on category cards and each model's detail-page hero
// was hardcoded into ~128 dedicated .njk templates (and into the category
// landing templates), so an admin edit never reached the live page. Promoting
// it to a real products column - alongside the existing total_floor_area - lets
// the single product save propagate it to both surfaces, the same way price and
// image already flow. Nullable: not every product has a meaningful single
// bedroom number (sheds, container units), and a NULL just hides the chip.
exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('products', 'bedrooms');
  if (!hasColumn) {
    await knex.schema.alterTable('products', (table) => {
      table.integer('bedrooms').nullable().after('total_floor_area');
    });
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('products', 'bedrooms');
  if (hasColumn) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('bedrooms');
    });
  }
};
