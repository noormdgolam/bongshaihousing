exports.up = async function (knex) {
  await knex.schema.createTable('theme_settings', (table) => {
    table.increments('id').primary();
    table.string('key', 100).notNullable().unique(); // e.g. 'active_theme'
    table.text('data', 'longtext').notNullable(); // JSON payload of all tokens & customizer settings
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('theme_settings');
};
