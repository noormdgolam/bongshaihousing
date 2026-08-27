// Customer-facing project tracking. An order is created by an admin from a
// converted lead (or manually) once a sale is confirmed - it gets its own
// portal login so the customer can check construction progress without
// calling in. Separate from `leads`/`agent_leads` since those are
// pre-sale pipeline records; an order is post-sale and lives much longer
// (months, across the build).
exports.up = async function (knex) {
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.integer('lead_id').unsigned().nullable()
      .references('id').inTable('leads').onDelete('SET NULL');
    table.string('customer_name', 255).notNullable();
    table.string('customer_phone', 32).notNullable();
    table.string('customer_district', 100).nullable();
    table.string('model_number', 100).nullable();
    table.string('floor_area', 100).nullable();
    table.decimal('total_price', 14, 2).nullable();
    table.string('password_hash', 255).notNullable();
    table.string('status', 20).notNullable().defaultTo('active'); // active, completed, cancelled
    table.timestamps(true, true);
  });

  await knex.schema.createTable('order_milestones', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable()
      .references('id').inTable('orders').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.string('status', 20).notNullable().defaultTo('pending'); // pending, in_progress, done
    table.integer('sort_order').notNullable().defaultTo(0);
    table.text('note').nullable();
    table.timestamp('completed_at').nullable();
    table.timestamps(true, true);
  });

  // This host has silently defaulted new tables to MyISAM before (see
  // 20260817000005), which drops FK enforcement with no error - forcing
  // InnoDB explicitly, same reasoning as agent_leads.
  await knex.raw('ALTER TABLE `orders` ENGINE=InnoDB');
  await knex.raw('ALTER TABLE `order_milestones` ENGINE=InnoDB');
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('order_milestones');
  await knex.schema.dropTableIfExists('orders');
};
