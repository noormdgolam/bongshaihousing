// Phase 2 (DB + admin dashboard) connection config. MySQL only - cPanel
// bundles it free on this hosting plan, and Knex's migration files give a
// reviewable audit trail for schema changes appropriate for a small team,
// without the native-binary/platform-target headaches a full ORM
// (Prisma's query engine) would add on top of this shared host's own
// constraints (see [[project-node-hosting-quirks]]).
// knex's CLI changes the working directory to this file's own folder
// before running migrate/seed commands, so a bare dotenv.config() (which
// defaults to reading .env from process.cwd()) silently misses the real
// .env one level up - load it by explicit path instead.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const connection = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // The first handshake to the remote MySQL host from outside the server
  // (i.e. local dev / any script pointed at DB_HOST=bongshaihousing.com)
  // routinely takes ~15-20s, which blows past mysql2's 10s default and
  // surfaces as a misleading `connect ETIMEDOUT` even though the connection
  // is perfectly fine on a longer leash. In production this is a no-op -
  // the app connects to localhost and completes instantly.
  connectTimeout: 25000,
  // Without this, mysql2 converts a SQL DATE column into a JS Date object at
  // midnight in the *connection's* timezone, then serializes it back to UTC -
  // on this UTC+6 server that silently shifts every plain calendar date back
  // by a day the moment anything touches .toISOString()/JSON.stringify()
  // (a CSV export, a template render, a log line). Confirmed live: a followup
  // date correctly written as the string '2026-09-06' read back as
  // "2026-09-05T18:00:00.000Z". Scoped to the SQL type DATE only (an array,
  // not `true`) so DATETIME/TIMESTAMP columns everywhere else in this app
  // keep returning real Date objects exactly as before - zero behavior change
  // for anything that isn't a plain date.
  dateStrings: ['DATE'],
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
  pool: {
    min: 0,
    max: 5,
    // The DB's default charset is utf8mb3 (3-byte), which silently mangles
    // 4-byte characters like most emoji into "?" on insert - Bengali text is
    // unaffected (its Unicode block fits in 3 bytes), but anything storing
    // emoji needs the session charset forced up. mysql2's `charset`
    // connection option was tried first and did NOT work - verified live
    // that character_set_client stayed utf8mb3 regardless of that option -
    // an explicit `SET NAMES` on every new pooled connection is what
    // actually flips the session's character_set_client/connection/results.
    afterCreate: (conn, done) => {
      conn.query('SET NAMES utf8mb4', (err) => done(err, conn));
    },
  },
};
