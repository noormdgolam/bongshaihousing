// Backfill meta_title and meta_description for existing product rows.
// meta_title uses intent-first format: Category in Bangladesh | MODEL
// meta_description reuses the existing description (already includes sq.ft, BDT price, Bangladesh context)
exports.up = async function (knex) {
  // MySQL syntax: JOIN in UPDATE
  await knex.raw(`
    UPDATE products p
    JOIN categories c ON p.category_id = c.id
    SET p.meta_title = CONCAT(c.name, ' in Bangladesh | ', p.model_number),
        p.meta_description = p.description
    WHERE p.meta_title IS NULL AND p.description IS NOT NULL
  `);
  await knex.raw(`
    UPDATE products p
    JOIN categories c ON p.category_id = c.id
    SET p.meta_title = CONCAT(c.name, ' in Bangladesh | ', p.model_number)
    WHERE p.meta_title IS NULL
  `);
};

exports.down = async function (knex) {
  await knex('products').whereNotNull('meta_title').update({ meta_title: null });
  await knex('products').whereNotNull('meta_description').update({ meta_description: null });
};
