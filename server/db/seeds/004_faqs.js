const path = require('path');
const fs = require('fs');

exports.seed = async function (knex) {
  const dataPath = path.join(__dirname, 'data', 'faqs.json');
  const faqs = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  await knex.transaction(async (trx) => {
    await trx('faqs').del();
    for (const [i, f] of faqs.entries()) {
      await trx('faqs').insert({
        question: f.question,
        answer: f.answer,
        category: f.category || 'General',
        published: typeof f.published === 'boolean' ? f.published : true,
        sort_order: typeof f.sort_order === 'number' ? f.sort_order : i,
      });
    }
  });

  console.log(`Seeded ${faqs.length} FAQs across ${new Set(faqs.map(f => f.category)).size} categories.`);
};
