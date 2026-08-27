const fs = require('fs');
const path = require('path');
const registry = require('../page-registry.json');
const contentRegistry = require('../lib/page-content-registry');
let db;
try {
  db = require('../lib/db');
} catch (e) {
  console.error('Failed to load database. Are BONGSHAI_DB_* environment variables set?');
  process.exit(1);
}

const VIEWS_DIR = path.join(__dirname, '..', 'views', 'pages');

async function extractContent() {
  const hasTable = await db.schema.hasTable('page_content');
  if (!hasTable) {
    console.error('Table page_content does not exist. Run create-page-content-table.js first.');
    process.exit(1);
  }

  let extractedCount = 0;

  for (const [urlPath, meta] of Object.entries(registry)) {
    const templatePath = path.join(VIEWS_DIR, meta.template);
    if (!fs.existsSync(templatePath)) continue;

    const fileContent = fs.readFileSync(templatePath, 'utf8');
    
    // Look up the structured fields for this URL
    const fields = contentRegistry[urlPath] || [];
    
    // If there are no fields defined yet, skip
    if (fields.length === 0) continue;

    const pageData = {};

    for (const field of fields) {
      // Regex to find: {{ pc.KEY or "FALLBACK" }} or {{ (pc.KEY or "FALLBACK") | safe }}
      // Note: Supports both single and double quotes around the fallback, and optional () | safe wrappers
      const regex = new RegExp(`\\{\\{\\s*(?:\\(\\s*)?pc\\.${field.key}\\s*or\\s*(['"])([\\s\\S]*?)\\1\\s*(?:\\)\\s*\\|\\s*safe)?\\s*\\}\\}`);
      const match = fileContent.match(regex);
      
      if (match) {
        pageData[field.key] = match[2];
      } else {
        pageData[field.key] = ''; // Empty string if we couldn't extract a fallback
      }
    }

    const title = meta.title || '';

    // Upsert into database
    await db('page_content').insert({
      url_path: urlPath,
      title: title,
      content_json: JSON.stringify(pageData),
      updated_at: db.fn.now()
    }).onConflict('url_path').merge({
      title: title,
      // Only merge content_json if you want to overwrite existing DB edits with template fallbacks.
      // In a real app, you might NOT want to overwrite if it already exists, but for this migration script we will.
      content_json: JSON.stringify(pageData),
      updated_at: db.fn.now()
    });

    console.log(`Extracted JSON content for ${urlPath}`);
    extractedCount++;
  }

  console.log(`Extraction complete. Updated ${extractedCount} pages.`);
  process.exit(0);
}

extractContent().catch(err => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
