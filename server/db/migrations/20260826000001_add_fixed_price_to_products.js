// Add fixed_price and total_floor_area to products table
// Enables direct querying and display of official fixed pricing and designated floor area
exports.up = async function (knex) {
  const hasFixedPrice = await knex.schema.hasColumn('products', 'fixed_price');
  const hasTotalFloorArea = await knex.schema.hasColumn('products', 'total_floor_area');
  await knex.schema.alterTable('products', (table) => {
    if (!hasFixedPrice) table.decimal('fixed_price', 12, 2).nullable();
    if (!hasTotalFloorArea) table.integer('total_floor_area').nullable();
  });
};

exports.down = async function (knex) {
  const hasFixedPrice = await knex.schema.hasColumn('products', 'fixed_price');
  const hasTotalFloorArea = await knex.schema.hasColumn('products', 'total_floor_area');
  await knex.schema.alterTable('products', (table) => {
    if (hasFixedPrice) table.dropColumn('fixed_price');
    if (hasTotalFloorArea) table.dropColumn('total_floor_area');
  });
};
