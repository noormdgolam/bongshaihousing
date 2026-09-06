const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
process.env.DB_HOST = 'bongshaihousing.com';
const knexConfig = require('../server/db/knexfile.js');
const knex = require('knex')(knexConfig);

async function checkFKs() {
  try {
    const pids = [1098, 1099, 1100, 1101, 1102, 1103, 1104, 1105, 1106];
    
    // Check if agent_leads references these product_ids
    const leads = await knex('agent_leads').whereIn('product_id', pids).catch(() => []);
    console.log('agent_leads referencing these products:', leads.length);

    // Check all tables with product_id or category_id in the DB
    const [cols] = await knex.raw(`
      SELECT TABLE_NAME, COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'abongsha_bongshai_app' 
        AND COLUMN_NAME IN ('product_id', 'category_id')
    `);
    console.log('Columns referencing product_id or category_id:');
    for (const c of cols) {
      console.log(` - ${c.TABLE_NAME}.${c.COLUMN_NAME}`);
      if (c.COLUMN_NAME === 'product_id' && c.TABLE_NAME !== 'product_specs' && c.TABLE_NAME !== 'product_variants') {
        const rows = await knex(c.TABLE_NAME).whereIn('product_id', pids).catch(() => []);
        console.log(`   -> rows matching pids: ${rows.length}`);
      }
      if (c.COLUMN_NAME === 'category_id' && c.TABLE_NAME !== 'products') {
        const rows = await knex(c.TABLE_NAME).where({ category_id: 103 }).catch(() => []);
        console.log(`   -> rows matching category_id 103: ${rows.length}`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await knex.destroy();
  }
}

checkFKs();
