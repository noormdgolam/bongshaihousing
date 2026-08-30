// Unifies the customer portal identity. Until now, portal login lived
// entirely on `orders` (password_hash + customer_phone directly on the
// row) and only existed post-sale, once an admin manually converted a
// lead. That's too late - a visitor should be able to track their own
// inquiry the moment they submit it, long before it becomes an order.
// `customers` is the new identity anchor, keyed on the normalized phone
// number (see lib/customer-identity.js); `leads` and `orders` both link
// to it so one login later sees everything - open inquiries and, once
// one exists, real order/build-progress tracking - without duplicating
// auth logic across two tables.
exports.up = async function (knex) {
  await knex.schema.createTable('customers', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('phone_key', 32).notNullable().unique(); // normalized lookup key
    table.string('phone', 32).notNullable(); // original, as the customer typed it
    table.string('email', 255).nullable();
    table.string('password_hash', 255).nullable(); // null until they set one
    table.timestamps(true, true);
  });
  // Same MyISAM-default trap as every other table added on this host
  // (see 20260819000001) - force InnoDB so the FKs below actually enforce.
  await knex.raw('ALTER TABLE `customers` ENGINE=InnoDB');

  await knex.schema.table('leads', (table) => {
    table.integer('customer_id').unsigned().nullable()
      .references('id').inTable('customers').onDelete('SET NULL');
  });

  await knex.schema.table('orders', (table) => {
    table.integer('customer_id').unsigned().nullable()
      .references('id').inTable('customers').onDelete('SET NULL');
  });

  // Backfill: one customers row per distinct phone already in orders, so
  // every existing portal login keeps working unchanged (same phone +
  // password they already have) - it's just backed by the new table now.
  const { normalizePhone } = require('../../lib/customer-identity');
  const existingOrders = await knex('orders')
    .select('id', 'customer_name', 'customer_phone', 'password_hash')
    .orderBy('created_at', 'asc');

  const phoneToCustomerId = new Map();
  for (const order of existingOrders) {
    const key = normalizePhone(order.customer_phone);
    if (!key) continue; // don't fabricate an identity for unparseable data
    let customerId = phoneToCustomerId.get(key);
    if (!customerId) {
      [customerId] = await knex('customers').insert({
        name: order.customer_name,
        phone_key: key,
        phone: order.customer_phone,
        password_hash: order.password_hash,
      });
      phoneToCustomerId.set(key, customerId);
    }
    await knex('orders').where({ id: order.id }).update({ customer_id: customerId });
  }
};

exports.down = async function (knex) {
  await knex.schema.table('orders', (table) => table.dropColumn('customer_id'));
  await knex.schema.table('leads', (table) => table.dropColumn('customer_id'));
  await knex.schema.dropTableIfExists('customers');
};
