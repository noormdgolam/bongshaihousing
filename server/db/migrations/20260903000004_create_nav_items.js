// Site navigation, made admin-editable. Every real nav entry - Home, the About
// dropdown's links, Our Projects, Image Gallery, Contact - becomes a row here.
// The one exception is the Products & Solutions mega-dropdown: its "children"
// are the existing categories table (already has hero_image/sort_order/name),
// not real nav_items rows, so a single item_type='category_grid' row stands in
// for the whole category grid rather than duplicating category data into this
// table. parent_id models one level of dropdown nesting, matching what the
// current hardcoded nav actually has (no deeper nesting exists today).
exports.up = async function (knex) {
  await knex.schema.createTable('nav_items', (table) => {
    table.increments('id').primary();
    table.string('label', 100).notNullable();
    table.string('url', 255).nullable();
    table.integer('parent_id').unsigned().nullable()
      .references('id').inTable('nav_items').onDelete('CASCADE');
    table.enu('item_type', ['link', 'category_grid']).notNullable().defaultTo('link');
    table.string('icon', 10).nullable();
    table.string('target', 10).notNullable().defaultTo('_self');
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('visible').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  const hasShowInNav = await knex.schema.hasColumn('categories', 'show_in_nav');
  await knex.schema.alterTable('categories', (table) => {
    if (!hasShowInNav) table.boolean('show_in_nav').notNullable().defaultTo(true);
  });
};

exports.down = async function (knex) {
  const hasShowInNav = await knex.schema.hasColumn('categories', 'show_in_nav');
  await knex.schema.alterTable('categories', (table) => {
    if (hasShowInNav) table.dropColumn('show_in_nav');
  });
  await knex.schema.dropTableIfExists('nav_items');
};
