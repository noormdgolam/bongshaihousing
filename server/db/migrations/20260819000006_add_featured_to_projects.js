// Adds a 'featured' boolean flag to the projects table, default false,
// backing the admin dashboard KPI query and homepage/catalog featured highlights.
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('projects');
  if (hasTable) {
    const hasCol = await knex.schema.hasColumn('projects', 'featured');
    if (!hasCol) {
      await knex.schema.alterTable('projects', (table) => {
        table.boolean('featured').notNullable().defaultTo(false);
      });
    }
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('projects');
  if (hasTable) {
    const hasCol = await knex.schema.hasColumn('projects', 'featured');
    if (hasCol) {
      await knex.schema.alterTable('projects', (table) => {
        table.dropColumn('featured');
      });
    }
  }
};
