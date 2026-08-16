const path = require('path');
const fs = require('fs');

exports.seed = async function (knex) {
  const dataPath = path.join(__dirname, 'data', 'service_areas.json');
  const serviceAreas = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  await knex.transaction(async (trx) => {
    await trx('service_areas').del();
    for (const area of serviceAreas) {
      await trx('service_areas').insert({
        district: area.district,
        division: area.division,
        has_dedicated_page: Boolean(area.has_dedicated_page),
        page_slug: area.page_slug || null,
      });
    }
  });

  console.log(`Seeded ${serviceAreas.length} service areas across Bangladesh.`);
};
