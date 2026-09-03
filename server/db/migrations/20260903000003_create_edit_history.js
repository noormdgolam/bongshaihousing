// Version history for admin CRUD edits, across every real editable record type
// (products, categories, projects, team members, testimonials, FAQs, service
// areas, users, pages). Nothing here is a linear undo/redo stack with a
// pointer - every save (including a restore) appends a new snapshot row and
// nothing is ever deleted, so "redo" is just picking the version you just
// moved away from back out of the list. entity_id is a string, not an int
// FK, because page_content is keyed by a URL path, not a numeric id, and a
// single polymorphic column has to cover both - same tradeoff activity_log
// already made for entity_type/entity_id.
exports.up = async function (knex) {
  await knex.schema.createTable('edit_history', (table) => {
    table.increments('id').primary();
    table.string('entity_type', 50).notNullable();
    table.string('entity_id', 100).notNullable();
    table.json('before_snapshot').notNullable();
    table.json('after_snapshot').notNullable();
    table.integer('admin_user_id').unsigned().nullable()
      .references('id').inTable('admin_users').onDelete('SET NULL');
    table.string('admin_name', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['entity_type', 'entity_id', 'created_at'], 'edit_history_entity_idx');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('edit_history');
};
