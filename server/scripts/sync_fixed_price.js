const fs = require('fs');
const path = require('path');
const db = require('../lib/db');

async function syncFixedPrice() {
  console.log('Syncing fixedPrice from products.json to DB...');
  const jsonPath = path.join(__dirname, '..', 'db', 'seeds', 'data', 'products.json');
  const seedProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let updated = 0;
  for (const p of seedProducts) {
    if (p.fixedPrice) {
      await db('products').where({ model_number: p.modelNumber }).update({
        fixed_price: p.fixedPrice
      });
      updated++;
    }
  }
  console.log(`Updated ${updated} products with fixed_price.`);
  
  // Re-generate all static pages to reflect the correct fixed_price
  console.log('Regenerating all static pages to bake in the fixed price...');
  const { syncPageToLive } = require('../lib/liveSiteSync');
  
  for (const p of seedProducts) {
    if (p.slug || p.filename) {
      const slug = p.slug || p.filename;
      try {
        await syncPageToLive(slug);
        console.log(`Synced ${slug}`);
      } catch(e) {
        console.error(`Failed to sync ${slug}:`, e.message);
      }
    }
  }
  console.log('Done!');
  process.exit(0);
}

syncFixedPrice().catch(e => {
  console.error(e);
  process.exit(1);
});
