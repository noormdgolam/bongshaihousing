// Migration: Add detailed visitor tracking columns to page_views table
// Allows tracking of IP address, country, city, device type, browser, OS, and referrer
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('page_views');
  if (hasTable) {
    await knex.schema.alterTable('page_views', (table) => {
      table.string('ip', 45).nullable().index();
      table.string('country', 100).nullable();
      table.string('country_code', 10).nullable().index();
      table.string('city', 100).nullable();
      table.string('user_agent', 500).nullable();
      table.string('device_type', 50).nullable().index(); // 'Desktop', 'Mobile', 'Tablet', 'Bot'
      table.string('browser', 50).nullable();              // 'Chrome', 'Safari', 'Firefox', 'Edge', etc.
      table.string('os', 50).nullable();                   // 'Windows', 'Android', 'iOS', 'macOS', 'Linux'
      table.string('referrer', 500).nullable();            // 'Direct', 'Google', 'Facebook', etc.
    });
  } else {
    await knex.schema.createTable('page_views', (table) => {
      table.increments('id').primary();
      table.string('path', 500).notNullable().index();
      table.string('ip', 45).nullable().index();
      table.string('country', 100).nullable();
      table.string('country_code', 10).nullable().index();
      table.string('city', 100).nullable();
      table.string('user_agent', 500).nullable();
      table.string('device_type', 50).nullable().index();
      table.string('browser', 50).nullable();
      table.string('os', 50).nullable();
      table.string('referrer', 500).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).index();
    });
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('page_views');
  if (hasTable) {
    await knex.schema.alterTable('page_views', (table) => {
      table.dropColumn('ip');
      table.dropColumn('country');
      table.dropColumn('country_code');
      table.dropColumn('city');
      table.dropColumn('user_agent');
      table.dropColumn('device_type');
      table.dropColumn('browser');
      table.dropColumn('os');
      table.dropColumn('referrer');
    });
  }
};
