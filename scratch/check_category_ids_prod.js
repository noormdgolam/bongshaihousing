// One-off: confirm which category_id values in PRODUCTION correspond to the
// 9 category names the spec-seed SQL was written against (it hardcodes IDs
// 37,41,44,40,39,45,46,47,51 from a *staging* DB inspection - prod may have
// different auto-increment IDs for the same names, since the two DBs were
// seeded independently). Read-only, no writes.
const mysql = require('mysql2/promise');

const NAMES = [
  'Apartment Building', 'Duplex Steel Building', 'Simplex Prefab Building',
  'Cottage House', 'Container House', 'Steel House',
  'Tiny House', 'Wooden House', 'Low Cost House',
];
const STAGING_IDS = { 'Apartment Building': 37, 'Duplex Steel Building': 41, 'Simplex Prefab Building': 44,
  'Cottage House': 40, 'Container House': 39, 'Steel House': 45,
  'Tiny House': 46, 'Wooden House': 47, 'Low Cost House': 51 };

(async () => {
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com', port: 3306, database: 'abongsha_bongshai_prod',
    user: 'abongsha_housin', password: '@Bongshai.100', connectTimeout: 25000,
  });
  const [rows] = await conn.query('SELECT id, name FROM categories WHERE name IN (?)', [NAMES]);
  console.log('PRODUCTION categories table:');
  const found = {};
  for (const r of rows) { found[r.name] = r.id; console.log(`  ${r.id}\t${r.name}`); }

  console.log('\nMissing names in prod:', NAMES.filter((n) => !found[n]));

  console.log('\nID comparison (staging seed script id -> prod actual id):');
  let mismatch = false;
  for (const n of NAMES) {
    const stagingId = STAGING_IDS[n];
    const prodId = found[n];
    const flag = prodId === stagingId ? 'OK' : 'MISMATCH';
    if (flag === 'MISMATCH') mismatch = true;
    console.log(`  ${n}: staging=${stagingId} prod=${prodId ?? 'N/A'}  [${flag}]`);
  }

  if (Object.values(found).length) {
    const ids = Object.values(found);
    const [specRows] = await conn.query(
      "SELECT category_id, spec_type, COUNT(*) c FROM category_specs WHERE category_id IN (?) GROUP BY category_id, spec_type ORDER BY category_id, spec_type",
      [ids]
    );
    console.log('\nExisting category_specs rows in PRODUCTION for these categories:');
    if (!specRows.length) console.log('  (none - table has zero rows for these IDs)');
    for (const r of specRows) console.log(`  category_id=${r.category_id} ${r.spec_type}: ${r.c}`);
  }

  console.log('\nOverall:', mismatch ? 'IDs DO NOT MATCH staging - the seed SQL cannot be run as-is against prod' : 'IDs match - seed SQL is safe to run against prod as written');
  await conn.end();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
