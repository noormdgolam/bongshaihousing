exports.up = async function (knex) {
  await knex.schema.createTable('faqs', (table) => {
    table.increments('id').primary();
    table.text('question').notNullable();
    table.text('answer').notNullable();
    table.string('category', 100).nullable().defaultTo('General');
    table.boolean('published').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('faqs');
};
