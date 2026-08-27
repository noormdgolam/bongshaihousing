// The original column default pointed every team member without an explicit
// photo at the same AI-generated stock image - a fake photo on a real named
// person. Both write paths (seed script, admin create/update routes) now
// pass photo explicitly, so this only matters as a safety net for any future
// insert that omits the column.
exports.up = async function (knex) {
  await knex.schema.alterTable('team_members', (table) => {
    table.string('photo', 500).nullable().defaultTo(null).alter();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('team_members', (table) => {
    table.string('photo', 500).nullable().defaultTo('images/about-team.webp').alter();
  });
};
