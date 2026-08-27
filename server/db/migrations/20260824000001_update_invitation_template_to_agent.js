exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('agent_invitation_template');
  if (hasTable) {
    await knex('agent_invitation_template')
      .where({ id: 1 })
      .update({
        subject: 'Invitation: Become a Bongshai Housing Agent',
        body: [
          'Dear {{name}},',
          "Bongshai Housing & Real Estate, Bangladesh's premier pre-engineered steel building and prefab housing company, is inviting qualified businesses and individuals to become authorized agents in their area.",
          'As a Bongshai agent, you would represent our full catalog of steel buildings, duplex villas, cottages, and industrial sheds directly to customers in your territory, with full sales, marketing, and after-sales support from our head office.',
        ].join('\n\n'),
      });
  }
};

exports.down = async function () {};
