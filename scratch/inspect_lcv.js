const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
process.env.DB_HOST = 'bongshaihousing.com';

const knexConfig = require('../server/db/knexfile.js');
const knex = require('knex')(knexConfig);

async function inspect() {
  try {
    console.log('Connecting to DB at:', process.env.DB_HOST);
    const [r] = await knex.raw('SELECT DATABASE() AS db');
    const currentDb = r[0].db;
    console.log('Current database:', currentDb);
    
    if (currentDb !== 'abongsha_bongshai_app') {
      throw new Error(`WRONG DATABASE: Expected 'abongsha_bongshai_app' but got '${currentDb}'! Aborting.`);
    }

    // Inspect category 103
    const categories = await knex('categories').where({ id: 103 });
    console.log('\nCategory 103:', categories);

    // Inspect all categories
    const allCategories = await knex('categories').select('id', 'name', 'slug');
    console.log(`\nTotal categories count: ${allCategories.length}`);
    console.log('Categories:', allCategories);

    // Inspect products where category_id = 103
    const products = await knex('products').where({ category_id: 103 });
    console.log(`\nProducts with category_id = 103: count = ${products.length}`);
    const productIds = products.map(p => p.id);
    console.log('Product IDs:', productIds);
    console.log('Product slugs:', products.map(p => p.slug));

    // Inspect product_specs
    const specs = await knex('product_specs').whereIn('product_id', productIds);
    console.log(`\nproduct_specs count for product IDs: ${specs.length}`);

    // Inspect product_variants
    const variants = await knex('product_variants').whereIn('product_id', productIds);
    console.log(`product_variants count for product IDs: ${variants.length}`);

  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await knex.destroy();
  }
}

inspect();
