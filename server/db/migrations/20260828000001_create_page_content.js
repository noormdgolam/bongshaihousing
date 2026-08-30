// Marketing-pages CMS content store (server/routes/admin.js '/admin/pages' +
// server/routes/pages.js page-content lookup). This table previously existed
// only via a one-off manual script (server/scripts/create-page-content-table.js,
// run by hand against the live DB) with no formal migration behind it - a fresh
// database built from `knex migrate:latest` alone would be missing it, and the
// admin/public routes that query it would fail (routes/admin.js already has a
// fallback error message for exactly this: "Table not initialized. Please run
// the extraction script on the server."). Schema matches that script exactly,
// so this migration is a safe no-op on any environment where it was already
// run by hand.
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('page_content');
  if (hasTable) return;

  await knex.schema.createTable('page_content', (table) => {
    table.string('url_path', 255).primary().notNullable();
    table.string('title', 255).nullable();
    table.json('content_json').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
  await knex.raw('ALTER TABLE `page_content` ENGINE=InnoDB');
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('page_content');
};
