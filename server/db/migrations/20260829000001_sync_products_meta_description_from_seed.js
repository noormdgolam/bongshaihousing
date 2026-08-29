// Syncs products.json's accurate SEO description field into the products table's
// meta_description column, matching by model_number.
// This prevents admin edits from regressing to old boilerplate meta descriptions.

const fs = require('fs');
const path = require('path');

exports.up = async function (knex) {
  const jsonPath = path.join(__dirname, '..', 'seeds', 'data', 'products.json');
  if (!fs.existsSync(jsonPath)) {
    console.warn('[Migration] products.json not found at:', jsonPath);
    return;
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const products = JSON.parse(raw);

  for (const p of products) {
    if (!p.modelNumber || !p.description) continue;
    const desc = p.description.trim();
    if (!desc) continue;

    await knex('products')
      .where({ model_number: p.modelNumber })
      .update({
        meta_description: desc
      });
  }
};

exports.down = async function (knex) {
  // No-op rollback: keeping accurate meta_descriptions is non-destructive
};
