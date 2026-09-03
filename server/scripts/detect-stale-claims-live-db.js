// Read-only discovery: finds live DB rows still containing stale marketing-claim text
// (500+, ISO 9001, ISO certified, 64 districts) so they can be fixed via a targeted migration.
// Never writes. Run against both staging and prod before writing the fix migration.
const mysql = require('mysql2/promise');
if (!process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD env var not set - never hardcode the live DB password in a committed script.');
}

const STALE_PATTERNS = ['%500+%', '%ISO 9001%', '%ISO certified%', '%64 districts%', '%OHSAS%'];

const TARGETS = [
  { table: 'products', cols: ['description', 'meta_description'], key: 'model_number' },
  { table: 'categories', cols: ['description'], key: 'slug' },
  { table: 'faqs', cols: ['question', 'answer'], key: 'id' },
  { table: 'team_members', cols: ['bio', 'role'], key: 'name' },
  { table: 'projects', cols: ['description'], key: 'slug' },
];

async function scanDb(dbName) {
  console.log(`\n========================================================`);
  console.log(`   SCANNING DATABASE: ${dbName}`);
  console.log(`========================================================`);
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com',
    port: 3306,
    user: dbName,
    password: process.env.DB_PASSWORD,
    database: dbName,
  });

  for (const target of TARGETS) {
    const [tableCheck] = await conn.query(
      `SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
      [dbName, target.table]
    );
    if (tableCheck[0].c === 0) {
      console.log(`  [skip] table ${target.table} does not exist in ${dbName}`);
      continue;
    }
    for (const col of target.cols) {
      const whereClauses = STALE_PATTERNS.map(() => `${col} LIKE ?`).join(' OR ');
      const [rows] = await conn.query(
        `SELECT id, ${target.key === 'id' ? '' : target.key + ','} ${col} FROM ${target.table} WHERE ${whereClauses}`,
        STALE_PATTERNS
      );
      if (rows.length > 0) {
        console.log(`\n  --- ${target.table}.${col}: ${rows.length} stale row(s) ---`);
        rows.forEach((r) => {
          const keyVal = target.key === 'id' ? r.id : r[target.key];
          const text = r[col];
          const preview = text && text.length > 160 ? text.slice(0, 160) + '...' : text;
          console.log(`    [id=${r.id}${target.key !== 'id' ? ` ${target.key}=${keyVal}` : ''}] ${preview}`);
        });
      } else {
        console.log(`  [clean] ${target.table}.${col}: 0 stale rows`);
      }
    }
  }

  await conn.end();
}

(async () => {
  for (const dbName of ['abongsha_bongshai_app', 'abongsha_bongshai_prod']) {
    await scanDb(dbName);
  }
  console.log('\nDiscovery complete. This script wrote nothing — review the rows above before writing a fix migration.');
})().catch((e) => {
  console.error('Discovery error:', e);
  process.exit(1);
});
