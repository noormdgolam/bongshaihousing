// server/scripts/extract-page-content.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../lib/db');
const registryPath = path.join(__dirname, '../page-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

async function extract() {
  const hasTable = await db.schema.hasTable('page_content');
  if (!hasTable) {
    console.error('page_content table does not exist. Run create-page-content-table.js first.');
    process.exit(1);
  }

  let count = 0;
  for (const [urlPath, meta] of Object.entries(registry)) {
    const templatePath = path.join(__dirname, '../views', meta.template);
    if (fs.existsSync(templatePath)) {
      const content = fs.readFileSync(templatePath, 'utf8');
      const match = content.match(/{% block content %}([\s\S]*?){% endblock %}/);
      if (match && match[1]) {
        const extractedHtml = match[1].trim();
        
        // Ensure we don't insert the fallback block if we're running this multiple times
        if (extractedHtml.includes('{{ pageContent | safe }}')) {
          console.log(`Skipping ${urlPath} as it already contains the dynamic fallback wrapper.`);
          continue;
        }

        await db('page_content')
          .insert({
            url_path: urlPath,
            title: meta.title,
            content_html: extractedHtml
          })
          .onConflict('url_path')
          .merge();
        count++;
        console.log(`Extracted content for ${urlPath}`);
      }
    }
  }
  console.log(`Successfully extracted ${count} pages into the database.`);
  process.exit(0);
}

extract().catch((err) => {
  console.error(err);
  process.exit(1);
});
