// Bulk distributor-invitation list, imported from an admin-uploaded Excel
// file. Deliberately its own table, separate from `agents` - these are
// prospects who haven't applied yet, not real agent accounts.
exports.up = async function (knex) {
  await knex.schema.createTable('agent_invitations', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('phone', 32).nullable();
    table.string('email', 255).nullable();
    table.string('district', 100).nullable();
    table.string('status', 20).notNullable().defaultTo('pending'); // pending, sent, failed
    table.text('error_message').nullable();
    table.timestamp('sent_at').nullable();
    table.string('source', 50).notNullable().defaultTo('excel_import');
    table.timestamps(true, true);
  });
  await knex.raw('ALTER TABLE `agent_invitations` ENGINE=InnoDB');
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('agent_invitations');
};
