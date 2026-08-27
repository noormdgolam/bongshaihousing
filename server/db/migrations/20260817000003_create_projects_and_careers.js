exports.up = async function (knex) {
  await knex.schema.createTable('projects', (table) => {
    table.increments('id').primary();
    table.string('slug', 255).notNullable().unique(); // e.g. project-bodorgonj-rangpur.html
    table.string('title', 255).notNullable(); // e.g. "Bodorgonj, Rangpur"
    table.string('location', 255).nullable();
    table.text('description').nullable();
    table.string('image', 500).nullable();
    // "Completed Project" badge text today; kept free-text since a
    // WordPress-style dashboard should let an editor phrase this per
    // project (e.g. "In Progress"), not lock it to an enum.
    table.string('status_label', 100).notNullable().defaultTo('Completed Project');
    table.boolean('published').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('career_listings', (table) => {
    table.increments('id').primary();
    // Matches apply_career.php's / server/lib/pdf.js's POSITION_NAMES
    // slugs (dgm, pm, architect, marketing, qc, tender, site-eng,
    // foreman, other) so existing application-form <option value>s keep
    // working without a migration on that side.
    table.string('slug', 100).notNullable().unique();
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.string('department', 255).nullable();
    table.string('location', 255).nullable().defaultTo('Uttara, Dhaka');
    table.boolean('open').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('service_areas', (table) => {
    table.increments('id').primary();
    table.string('district', 100).notNullable().unique();
    table.string('division', 100).notNullable(); // Bangladesh's 8 administrative divisions
    table.boolean('has_dedicated_page').notNullable().defaultTo(false);
    table.string('page_slug', 255).nullable(); // e.g. steel-building-dhaka.html, where one exists
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('service_areas');
  await knex.schema.dropTableIfExists('career_listings');
  await knex.schema.dropTableIfExists('projects');
};
