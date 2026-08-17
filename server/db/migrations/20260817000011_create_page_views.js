// Lightweight page-view log backing the admin Analytics dashboard - which
// public pages/products actually get traffic, so "add more dashboard
// options" isn't just CRUD row-counts. No UA/bot filtering, no per-visitor
// dedup - a simple hit log is enough signal for a small business site and
// keeps the write path a single fire-and-forget insert per request.
exports.up = async function (knex) {
  await knex.schema.createTable('page_views', (table) => {
    table.increments('id').primary();
    table.string('path', 500).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['path']);
    table.index(['created_at']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('page_views');
};
