exports.up = async function (knex) {
  await knex.schema.createTable('leads', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 100).notNullable();
    table.string('district', 100).nullable();
    table.string('upazila', 100).nullable();
    table.string('model', 100).nullable();
    table.string('floor_area', 100).nullable();
    table.string('bedrooms', 50).nullable();
    table.text('message').nullable();
    table.string('status', 50).notNullable().defaultTo('new'); // new, contacted, in_negotiation, closed
    table.string('source', 50).notNullable().defaultTo('contact_form');
    table.text('admin_notes').nullable();
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('leads');
};
