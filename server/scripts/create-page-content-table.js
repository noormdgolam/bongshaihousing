// server/scripts/create-page-content-table.js
require('dotenv').config();
const db = require('../lib/db');

async function main() {
  const hasTable = await db.schema.hasTable('page_content');
  if (!hasTable) {
    await db.schema.createTable('page_content', (table) => {
      table.string('url_path', 255).primary().notNullable();
      table.string('title', 255).nullable();
      table.json('content_json').nullable();
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('Created page_content table.');
  } else {
    console.log('page_content table already exists.');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
