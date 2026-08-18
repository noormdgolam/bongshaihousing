exports.up = async function (knex) {
  await knex.schema.createTable('agent_leads', (table) => {
    table.increments('id').primary();
    table.integer('agent_id').unsigned().notNullable()
      .references('id').inTable('agents').onDelete('CASCADE');
    table.string('customer_name', 255).notNullable();
    table.string('customer_phone', 32).notNullable();
    table.string('customer_district', 100).nullable();
    table.string('product_interest', 255).nullable();
    table.text('notes').nullable();
    table.enu('status', ['new', 'contacted', 'quoted', 'won', 'lost']).notNullable().defaultTo('new');
    table.timestamps(true, true);
  });
  // This host has silently defaulted new tables to MyISAM before (see
  // 20260817000005), which drops FK enforcement with no error - forcing
  // InnoDB explicitly rather than trusting the default, since agent_leads
  // has a real FK to agents.id.
  await knex.raw('ALTER TABLE `agents` ENGINE=InnoDB');
  await knex.raw('ALTER TABLE `agent_leads` ENGINE=InnoDB');
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('agent_leads');
};
