exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('admin_users');
  if (!hasTable) return;
  const has2FA = await knex.schema.hasColumn('admin_users', 'two_factor_enabled');
  if (!has2FA) {
    await knex.schema.alterTable('admin_users', (table) => {
      table.boolean('two_factor_enabled').notNullable().defaultTo(false);
      table.string('two_factor_secret', 255).nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('admin_users');
  if (!hasTable) return;
  const has2FA = await knex.schema.hasColumn('admin_users', 'two_factor_enabled');
  if (has2FA) {
    await knex.schema.alterTable('admin_users', (table) => {
      table.dropColumn('two_factor_enabled');
      table.dropColumn('two_factor_secret');
    });
  }
};
