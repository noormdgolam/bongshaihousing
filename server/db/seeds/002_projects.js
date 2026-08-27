const path = require('path');
const fs = require('fs');

exports.seed = async function (knex) {
  const dataPath = path.join(__dirname, 'data', 'projects.json');
  const projects = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  await knex.transaction(async (trx) => {
    await trx('projects').del();
    for (const [i, p] of projects.entries()) {
      await trx('projects').insert({
        slug: p.slug,
        title: p.title,
        location: p.location,
        description: p.description,
        image: p.image,
        status_label: p.statusLabel || 'Completed Project',
        sort_order: i,
      });
    }
  });

  console.log(`Seeded ${projects.length} projects.`);
};
