// Phase 2 (DB + admin dashboard) connection config. MySQL only - cPanel
// bundles it free on this hosting plan, and Knex's migration files give a
// reviewable audit trail for schema changes appropriate for a small team,
// without the native-binary/platform-target headaches a full ORM
// (Prisma's query engine) would add on top of this shared host's own
// constraints (see [[project-node-hosting-quirks]]).
require('dotenv').config();

const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

module.exports = {
  client: 'mysql2',
  connection,
  migrations: {
    directory: __dirname + '/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: __dirname + '/seeds',
  },
  pool: { min: 0, max: 5 },
};
