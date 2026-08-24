// Editable invitation email content, single row (id=1 always) - the admin
// composer edits subject/body/from_address here instead of requiring a code
// deploy. The branded header/CTA button/footer stay hardcoded in
// agent-invitations.js (not stored here) so an admin can't break the email's
// HTML structure - only the actual pitch text is editable.
exports.up = async function (knex) {
  await knex.schema.createTable('agent_invitation_template', (table) => {
    table.increments('id').primary();
    table.string('subject', 255).notNullable();
    table.text('body').notNullable(); // plain text, blank-line-separated paragraphs, supports {{name}}
    table.string('from_address', 255).notNullable();
    table.timestamps(true, true);
  });
  await knex.raw('ALTER TABLE `agent_invitation_template` ENGINE=InnoDB');

  await knex('agent_invitation_template').insert({
    id: 1,
    subject: 'Invitation: Become a Bongshai Housing Agent',
    body: [
      'Dear {{name}},',
      "Bongshai Housing & Real Estate, Bangladesh's premier pre-engineered steel building and prefab housing company, is inviting qualified businesses and individuals to become authorized agents in their area.",
      'As a Bongshai agent, you would represent our full catalog of steel buildings, duplex villas, cottages, and industrial sheds directly to customers in your territory, with full sales, marketing, and after-sales support from our head office.',
    ].join('\n\n'),
    from_address: 'no-reply@bongshaihousing.com',
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('agent_invitation_template');
};
