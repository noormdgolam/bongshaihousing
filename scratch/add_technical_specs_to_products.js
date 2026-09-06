// Adds the missing "TECHNICAL SPECIFICATION" section (BNBC compliance,
// earthquake/wind rating, cement/steel grade) to every product's
// product_specs - the table product-detail.njk actually renders, unlike
// category_specs which nothing on the customer-facing site reads.
//
// Source of truth: category_specs.spec_type='technical', already seeded
// from "Tecnical Spec 1 2 3/4 5 6/7 8 9.docx" (verified word-for-word
// against the docx text before running this) and identical to what's
// already live in the admin category-specs form.
//
// Purely additive: appends a new numbered section after whatever's
// already in product_specs for each product (never touches/removes
// existing rows), so it's trivially reversible.
const mysql = require('mysql2/promise');

const HEADER = '5. TECHNICAL SPECIFICATION & CODES';
const CATEGORY_IDS = [37, 41, 44, 40, 39, 45, 46, 47, 51];

(async () => {
  const conn = await mysql.createConnection({
    host: 'bongshaihousing.com', port: 3306, database: 'abongsha_bongshai_prod',
    user: 'abongsha_housin', password: '@Bongshai.100', connectTimeout: 25000,
  });

  const dryRun = process.argv.includes('--dry-run');
  let totalProducts = 0, totalSkippedAlready = 0, totalInserted = 0;

  for (const categoryId of CATEGORY_IDS) {
    const [techRows] = await conn.query(
      "SELECT spec_key, spec_value FROM category_specs WHERE category_id=? AND spec_type='technical' ORDER BY sort_order",
      [categoryId]
    );
    if (techRows.length !== 6) {
      console.error(`ABORT: category ${categoryId} has ${techRows.length} technical rows, expected 6 - not touching this category.`);
      continue;
    }

    const [products] = await conn.query(
      "SELECT id, slug FROM products WHERE category_id=? AND slug REGEXP '^[a-z0-9-]+\\\\.html$'",
      [categoryId]
    );

    for (const p of products) {
      totalProducts++;
      const [[already]] = await conn.query(
        'SELECT COUNT(*) c FROM product_specs WHERE product_id=? AND spec_key=?',
        [p.id, HEADER]
      );
      if (already.c > 0) { totalSkippedAlready++; continue; }

      const [[{ maxSort }]] = await conn.query(
        'SELECT COALESCE(MAX(sort_order), -1) maxSort FROM product_specs WHERE product_id=?',
        [p.id]
      );
      let sort = maxSort + 1;
      const rows = [[p.id, HEADER, '', sort++]];
      for (const t of techRows) rows.push([p.id, t.spec_key, t.spec_value, sort++]);

      totalInserted += rows.length;
      if (!dryRun) {
        await conn.query(
          'INSERT INTO product_specs (product_id, spec_key, spec_value, sort_order) VALUES ?',
          [rows]
        );
      }
      console.log(`${dryRun ? '[dry-run] would add' : 'added'} ${rows.length} rows to product ${p.id} (${p.slug}, category ${categoryId})`);
    }
  }

  console.log(`\nProducts scanned: ${totalProducts}, already had section (skipped): ${totalSkippedAlready}, rows ${dryRun ? 'would be' : ''} inserted: ${totalInserted}`);
  await conn.end();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
