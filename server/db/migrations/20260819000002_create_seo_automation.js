// SEO automation: AI-drafted meta titles/descriptions/alt text/copy
// suggestions land in a review queue (seo_suggestions) - nothing an AI
// writes ever touches a live page until an admin approves it, given this
// catalog has already had real price/spec accuracy bugs this project
// (see the tier-rebuild work) that came from bad source data, not bad
// intent. A pure-logic technical audit (seo_audit_issues) runs alongside
// with no AI involved - missing meta fields, missing images, etc.
exports.up = async function (knex) {
  await knex.schema.createTable('seo_settings', (table) => {
    table.increments('id').primary();
    table.string('setting_key', 100).notNullable().unique();
    table.text('setting_value').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('seo_suggestions', (table) => {
    table.increments('id').primary();
    table.string('suggestion_type', 30).notNullable(); // meta_title, meta_description, alt_text, content_copy
    table.string('target_type', 30).notNullable(); // product, page
    table.integer('target_id').unsigned().nullable(); // products.id when target_type = product
    table.string('target_path', 255).nullable(); // static page slug when target_type = page
    table.string('target_label', 255).notNullable(); // human-readable, e.g. "DV-201 - Duplex Villa"
    table.string('field_name', 100).notNullable(); // exact column/field this suggestion targets
    table.text('current_value').nullable();
    table.text('suggested_value').notNullable();
    table.text('reasoning').nullable();
    table.string('status', 20).notNullable().defaultTo('pending'); // pending, approved, rejected
    table.integer('reviewed_by').unsigned().nullable()
      .references('id').inTable('admin_users').onDelete('SET NULL');
    table.timestamp('reviewed_at').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('seo_audit_issues', (table) => {
    table.increments('id').primary();
    table.string('issue_type', 50).notNullable(); // missing_meta_title, missing_meta_description, missing_alt_text, broken_image, thin_content
    table.string('target_type', 30).notNullable();
    table.integer('target_id').unsigned().nullable();
    table.string('target_path', 255).nullable();
    table.string('target_label', 255).notNullable();
    table.text('detail').nullable();
    table.string('status', 20).notNullable().defaultTo('open'); // open, resolved, ignored
    table.timestamps(true, true);
  });

  await knex.raw('ALTER TABLE `seo_settings` ENGINE=InnoDB');
  await knex.raw('ALTER TABLE `seo_suggestions` ENGINE=InnoDB');
  await knex.raw('ALTER TABLE `seo_audit_issues` ENGINE=InnoDB');

  const hasMetaTitle = await knex.schema.hasColumn('products', 'meta_title');
  if (!hasMetaTitle) {
    await knex.schema.alterTable('products', (table) => {
      table.string('meta_title', 255).nullable();
      table.string('meta_description', 500).nullable();
      table.string('main_image_alt', 255).nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasMetaTitle = await knex.schema.hasColumn('products', 'meta_title');
  if (hasMetaTitle) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('meta_title');
      table.dropColumn('meta_description');
      table.dropColumn('main_image_alt');
    });
  }
  await knex.schema.dropTableIfExists('seo_audit_issues');
  await knex.schema.dropTableIfExists('seo_suggestions');
  await knex.schema.dropTableIfExists('seo_settings');
};
