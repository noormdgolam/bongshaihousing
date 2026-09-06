// Migration: Add spec_type enum ('building', 'technical') to product_specs table
// Same design as category_specs (see 20260903000001_create_category_specs.js)
exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('product_specs', 'spec_type');
  if (!hasColumn) {
    await knex.schema.alterTable('product_specs', (table) => {
      table.enu('spec_type', ['building', 'technical']).notNullable().defaultTo('building').after('product_id');
    });
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('product_specs', 'spec_type');
  if (hasColumn) {
    await knex.schema.alterTable('product_specs', (table) => {
      table.dropColumn('spec_type');
    });
  }
};
