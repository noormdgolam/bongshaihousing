const mysql = require('mysql2/promise');
if (!process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD env var not set - never hardcode the live DB password in a committed script.');
}

async function cleanDb() {
  for (const dbName of ['abongsha_bongshai_prod', 'abongsha_bongshai_app']) {
    console.log('\n========================================================');
    console.log('   INSPECTING & CLEANING DATABASE:', dbName);
    console.log('========================================================');
    const conn = await mysql.createConnection({
      host: 'bongshaihousing.com',
      port: 3306,
      user: dbName,
      password: process.env.DB_PASSWORD,
      database: dbName
    });

    const [cats] = await conn.query("SELECT id, name, slug FROM categories WHERE slug IN ('industrial-steel-sheds', 'worker-accommodation')");
    console.log('Categories found:', cats);
    const catIds = cats.map(c => c.id);

    if (catIds.length > 0) {
      const [prods] = await conn.query('SELECT id, model_number, category_id FROM products WHERE category_id IN (?)', [catIds]);
      console.log('Products found count:', prods.length);
      const prodIds = prods.map(p => p.id);

      if (prodIds.length > 0) {
        // Find variant IDs first
        const [variants] = await conn.query('SELECT id FROM product_variants WHERE product_id IN (?)', [prodIds]);
        const variantIds = variants.map(v => v.id);

        if (variantIds.length > 0) {
          const [delRooms] = await conn.query('DELETE FROM product_rooms WHERE product_variant_id IN (?)', [variantIds]);
          console.log('Deleted product_rooms:', delRooms.affectedRows);

          const [delVariants] = await conn.query('DELETE FROM product_variants WHERE id IN (?)', [variantIds]);
          console.log('Deleted product_variants:', delVariants.affectedRows);
        }

        const [delSpecs] = await conn.query('DELETE FROM product_specs WHERE product_id IN (?)', [prodIds]);
        console.log('Deleted product_specs:', delSpecs.affectedRows);

        // Delete from products
        const [delProds] = await conn.query('DELETE FROM products WHERE id IN (?)', [prodIds]);
        console.log('Deleted products:', delProds.affectedRows);
      }

      // Delete categories
      const [delCats] = await conn.query('DELETE FROM categories WHERE id IN (?)', [catIds]);
      console.log('Deleted categories:', delCats.affectedRows);
    } else {
      console.log('No matching categories found to delete in', dbName);
    }

    await conn.end();
  }
  console.log('\nDB CLEANUP COMPLETE FOR ALL ENVIRONMENTS!');
}

cleanDb().catch(e => { console.error('DB cleanup error:', e); process.exit(1); });
