const path = require('path');
const fs = require('fs');

exports.seed = async function (knex) {
  const dataPath = path.join(__dirname, 'data', 'team_members.json');
  const members = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  await knex.transaction(async (trx) => {
    await trx('team_members').del();
    for (const [i, m] of members.entries()) {
      await trx('team_members').insert({
        name: m.name,
        role: m.role,
        bio: m.bio || '',
        photo: m.photo || null,
        department: m.department || 'senior-management',
        sort_order: typeof m.sort_order === 'number' ? m.sort_order : i,
        published: typeof m.published === 'boolean' ? m.published : true,
      });
    }
  });

  console.log(`Seeded ${members.length} team members across ${new Set(members.map(m => m.department)).size} departments.`);
};
