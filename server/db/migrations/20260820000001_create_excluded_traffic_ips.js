// Lets an admin exclude a specific IP (their own testing, office network,
// a known monitoring service) from "real traffic" views on the analytics
// page - the same "internal traffic" concept most analytics tools have,
// since otherwise the admin's own browsing/testing permanently pollutes
// their own visitor numbers with no way to separate it back out.
exports.up = async function (knex) {
  await knex.schema.createTable('excluded_traffic_ips', (table) => {
    table.increments('id').primary();
    table.string('ip', 45).notNullable().unique();
    table.string('label', 255).nullable();
    table.timestamps(true, true);
  });
  await knex.raw('ALTER TABLE `excluded_traffic_ips` ENGINE=InnoDB');
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('excluded_traffic_ips');
};
