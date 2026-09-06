const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
process.env.DB_HOST = 'bongshaihousing.com';

const knexConfig = require('../server/db/knexfile.js');
const knex = require('knex')(knexConfig);

async function main() {
  try {
    console.log('Connecting to DB at:', process.env.DB_HOST);
    // Step 0: Assert on staging
    const [r] = await knex.raw('SELECT DATABASE() AS db');
    const currentDb = r[0].db;
    console.log('Current database:', currentDb);
    if (currentDb !== 'abongsha_bongshai_app') {
      throw new Error('wrong DB: ' + currentDb);
    }

    // Step 1: Re-derive the product ids from DB
    const categoryRows = await knex('categories').where({ id: 103 });
    if (categoryRows.length !== 1) {
      throw new Error(`Expected 1 category with id=103, found ${categoryRows.length}`);
    }
    const category = categoryRows[0];
    console.log('Category to delete:', category);

    const products = await knex('products').where({ category_id: 103 });
    console.log(`Found ${products.length} products with category_id = 103`);
    if (products.length !== 9) {
      throw new Error(`Product count is ${products.length}, expected 9! Stopping without modifying anything.`);
    }
    const productIds = products.map(p => p.id).sort((a, b) => a - b);
    console.log('Product IDs:', productIds);

    // Fetch dependent rows
    const specs = await knex('product_specs').whereIn('product_id', productIds);
    console.log(`Found ${specs.length} product_specs rows (expected 126)`);
    if (specs.length !== 126) {
      throw new Error(`product_specs count is ${specs.length}, expected 126! Stopping.`);
    }

    const variants = await knex('product_variants').whereIn('product_id', productIds);
    console.log(`Found ${variants.length} product_variants rows (expected 54)`);
    if (variants.length !== 54) {
      throw new Error(`product_variants count is ${variants.length}, expected 54! Stopping.`);
    }

    // Step 2: Write a JSON backup before any delete
    const backupData = {
      timestamp: new Date().toISOString(),
      database: currentDb,
      category_id: 103,
      counts: {
        categories: categoryRows.length,
        products: products.length,
        product_variants: variants.length,
        product_specs: specs.length
      },
      categories: categoryRows,
      products: products,
      product_variants: variants,
      product_specs: specs
    };

    const backupPath = path.join(__dirname, 'lcv-staging-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`\nBackup successfully written to ${backupPath} (${fs.statSync(backupPath).size} bytes)`);

    // Step 3: Run deletes in one single transaction
    console.log('\nBeginning deletion transaction...');
    const result = await knex.transaction(async (trx) => {
      // 1. product_specs
      const delSpecs = await trx('product_specs').whereIn('product_id', productIds).del();
      console.log(`Deleted ${delSpecs} rows from product_specs`);

      // 2. product_variants
      const delVariants = await trx('product_variants').whereIn('product_id', productIds).del();
      console.log(`Deleted ${delVariants} rows from product_variants`);

      // 3. products
      const delProducts = await trx('products').where({ category_id: 103 }).del();
      console.log(`Deleted ${delProducts} rows from products`);

      // 4. categories
      const delCategories = await trx('categories').where({ id: 103 }).del();
      console.log(`Deleted ${delCategories} rows from categories`);

      return { delSpecs, delVariants, delProducts, delCategories };
    });

    console.log('\nTransaction committed successfully!');
    console.log('Deleted rows summary:', result);

    // Step 4: Verify afterwards
    console.log('\nVerifying post-deletion state...');
    
    // (a) SELECT COUNT(*) FROM categories -> 10
    const [catCountResult] = await knex('categories').count('* as count');
    const catCount = Number(catCountResult.count);
    console.log(`Categories count: ${catCount} (expected: 10)`);
    if (catCount !== 10) {
      console.error(`WARNING: Categories count is ${catCount}, expected 10!`);
    }

    // (b) No category named like '%Low-Cost Villa%'
    const lcvCategories = await knex('categories').whereILike('name', '%Low-Cost Villa%');
    console.log(`Categories matching '%Low-Cost Villa%': ${lcvCategories.length} (expected: 0)`);

    // (c) SELECT COUNT(*) FROM products WHERE category_id = 103 -> 0
    const [prodCountResult] = await knex('products').where({ category_id: 103 }).count('* as count');
    const prodCount = Number(prodCountResult.count);
    console.log(`Products with category_id = 103: ${prodCount} (expected: 0)`);

    // (d) No orphaned product_specs / product_variants for ids 1098-1106
    const [orphanSpecs] = await knex('product_specs').whereIn('product_id', productIds).count('* as count');
    const [orphanVariants] = await knex('product_variants').whereIn('product_id', productIds).count('* as count');
    console.log(`Orphaned product_specs for deleted product IDs: ${orphanSpecs.count} (expected: 0)`);
    console.log(`Orphaned product_variants for deleted product IDs: ${orphanVariants.count} (expected: 0)`);

    // List remaining categories
    const remainingCats = await knex('categories').select('id', 'name', 'slug').orderBy('id', 'asc');
    console.log('\nRemaining 10 categories in staging:');
    remainingCats.forEach(c => console.log(`  [${c.id}] ${c.name} (${c.slug})`));

  } catch (err) {
    console.error('\nEXECUTION FAILED:', err);
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

main();
