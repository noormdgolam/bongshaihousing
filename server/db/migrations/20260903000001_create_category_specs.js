// Category-level spec table, same key/value shape as product_specs
// (see 20260817000002's reasoning: vocabulary differs per family, so a
// fixed-column table can't hold it cleanly) - but scoped to categories
// instead of individual products, and split into two spec_type buckets
// (building vs technical) so a category can hold both without the two
// getting mixed together in one list.
exports.up = async function (knex) {
  await knex.schema.createTable('category_specs', (table) => {
    table.increments('id').primary();
    table.integer('category_id').unsigned().notNullable()
      .references('id').inTable('categories').onDelete('CASCADE');
    table.enu('spec_type', ['building', 'technical']).notNullable().defaultTo('building');
    table.string('spec_key', 255).notNullable();
    table.text('spec_value').notNullable();
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('category_specs');
};
