exports.up = async function (knex) {
  await knex.schema.createTable('team_members', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('role', 255).notNullable();
    table.text('bio').nullable();
    table.string('photo', 500).nullable().defaultTo('images/about-team.webp');
    table.string('department', 100).notNullable().defaultTo('senior-management');
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('published').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('team_members');
};
