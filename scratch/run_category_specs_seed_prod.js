// Executes scratch/seed_category_specs.sql against PRODUCTION as one
// multi-statement batch (DELETE + INSERT + verification SELECT, exactly as
// authored). Confirmed safe beforehand: category IDs match between staging
// and prod (check_category_ids_prod.js), and prod currently has zero
// category_specs rows for these 9 categories, so the DELETE is a no-op.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, 'seed_category_specs.sql'), 'utf8');
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com', port: 3306, database: 'abongsha_bongshai_prod',
    user: 'abongsha_housin', password: '@Bongshai.100', connectTimeout: 25000,
    multipleStatements: true,
  });
  const [results] = await conn.query(sql);
  // results is an array of per-statement results when multipleStatements is on
  const last = Array.isArray(results) ? results[results.length - 1] : results;
  console.log('Statements executed:', Array.isArray(results) ? results.length : 1);
  if (Array.isArray(last)) {
    console.log('\nVerification (from the seed file\'s own trailing SELECT):');
    console.table(last);
  } else {
    console.log('Last result:', last);
  }
  await conn.end();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
