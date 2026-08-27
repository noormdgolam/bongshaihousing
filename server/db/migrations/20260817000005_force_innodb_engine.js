// Shared-hosting MySQL sometimes defaults new tables to MyISAM, which
// silently ignores foreign-key constraints entirely (no error at CREATE
// TABLE time, no error on a delete that should have been blocked - just
// referential integrity quietly not happening). That's what let the first
// seed attempt's crash leave 85 orphaned product rows behind: categories.del()
// "succeeded" against still-referenced rows because MyISAM was never
// enforcing the ON DELETE RESTRICT/CASCADE this schema declares. Force
// InnoDB explicitly on every table this app owns rather than trusting the
// host's default.
const TABLES = [
  'admin_users',
  'categories',
  'products',
  'product_variants',
  'product_rooms',
  'product_specs',
  'projects',
  'career_listings',
  'service_areas',
];

exports.up = async function (knex) {
  for (const table of TABLES) {
    const exists = await knex.schema.hasTable(table);
    if (exists) {
      await knex.raw(`ALTER TABLE \`${table}\` ENGINE=InnoDB`);
    }
  }
};

exports.down = async function () {
  // Not reversible in any meaningful sense - InnoDB is what every other
  // migration already assumes for FK support.
};
