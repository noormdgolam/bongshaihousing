exports.up = function (knex) {
  return knex.schema.createTable('agents', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    // Phone, not email, is the identifier field agents actually have and
    // check - matches the WhatsApp-first contact pattern already used
    // everywhere else on the site.
    table.string('phone', 32).notNullable().unique();
    table.string('email', 255).nullable();
    table.string('district', 100).notNullable();
    table.string('password_hash', 255).notNullable();
    // New signups start pending - no self-serve path to submitting leads
    // until an admin reviews and approves the account.
    table.enu('status', ['pending', 'active', 'rejected']).notNullable().defaultTo('pending');
    table.timestamp('last_login_at').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('agents');
};
