// Testimonials: the homepage hardcodes 3 client reviews (both in visible
// HTML and JSON-LD structured data) - and per a direct web-search pass on
// the company's actual reputation, there's essentially no independent
// third-party review presence (no ratings on business-listing sites, no
// Google Business showing up) - the company's only real social proof is
// what it curates itself, so this needs to be editable, not baked into a
// template.
//
// Activity log: now that /admin/users supports multiple accounts, "who
// changed what" stops being a rhetorical question - logs the consequential
// actions (deletes, status changes, role/user changes), not every read or
// routine save, to stay a useful audit trail instead of noise.
exports.up = async function (knex) {
  await knex.schema.createTable('testimonials', (table) => {
    table.increments('id').primary();
    table.string('author_name', 255).notNullable();
    table.string('author_title', 255).nullable(); // e.g. "Factory Owner, Gazipur"
    table.integer('rating').notNullable().defaultTo(5);
    table.text('review_text').notNullable();
    table.boolean('published').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('activity_log', (table) => {
    table.increments('id').primary();
    table.integer('admin_user_id').unsigned().nullable()
      .references('id').inTable('admin_users').onDelete('SET NULL');
    table.string('admin_name', 255).nullable(); // denormalized snapshot - survives the user being deleted later
    table.string('action', 50).notNullable(); // 'create' | 'update' | 'delete' | 'status_change'
    table.string('entity_type', 50).notNullable(); // 'product' | 'lead' | 'user' | ...
    table.integer('entity_id').nullable();
    table.string('summary', 500).nullable(); // human-readable one-liner, e.g. "Deleted product BH-SB-301"
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('activity_log');
  await knex.schema.dropTableIfExists('testimonials');
};
