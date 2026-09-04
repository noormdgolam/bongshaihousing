// Dedup is scoped "same phone + same site within 24h" (the pipeline is meant to
// be shared across bongshaihousing.com and its sister sites), but the previous
// migration didn't add a column for which site a lead came from - this repo only
// serves one site today, so it was easy to miss. Existing rows backfill to
// bongshaihousing.com since that's the only site this repo has ever served.
exports.up = async function (knex) {
  await knex.schema.alterTable('leads', (table) => {
    table.string('site', 100).notNullable().defaultTo('bongshaihousing.com');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('leads', (table) => {
    table.dropColumn('site');
  });
};
