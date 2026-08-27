exports.up = function (knex) {
  return knex.schema.createTable('admin_users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    // Full WordPress-style CMS scope means more than one editor eventually -
    // role gates what an account can touch, not just whether it can log in.
    table.enu('role', ['admin', 'editor']).notNullable().defaultTo('editor');
    table.timestamp('last_login_at').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('admin_users');
};
