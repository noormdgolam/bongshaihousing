// server/scripts/run-production-migrations.js
require('dotenv').config();
const db = require('../lib/db');

async function main() {
  console.log('Checking database migrations...\n');
  
  try {
    const hasKnexMigrations = await db.schema.hasTable('knex_migrations');
    if (!hasKnexMigrations) {
      console.log('knex_migrations table NOT FOUND. It will be created automatically.');
    } else {
      console.log('knex_migrations table exists.');
    }
    
    // knex.migrate.latest() will run all pending migrations and return what was applied
    const [batchNo, log] = await db.migrate.latest();
    
    if (log.length === 0) {
      console.log('\nResult: Already up to date. No pending migrations.');
    } else {
      console.log(`\nResult: Successfully ran ${log.length} pending migrations (Batch ${batchNo}):`);
      log.forEach(mig => console.log(` - ${mig}`));
    }
  } catch (err) {
    console.error('\nMigration failed:', err);
  } finally {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
