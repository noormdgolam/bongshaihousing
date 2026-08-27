// Distributor-application review trail. Research on channel-partner
// programs (partner recruitment best practices) is consistent on this:
// decisions should be quick and documented in the CRM, not just a bare
// status flip - reviewed_by/reviewed_at gives an audit trail for who
// approved/rejected an application and when, admin_notes lets a reviewer
// record why (same pattern already used on `leads.admin_notes`).
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('agents');
  if (!hasTable) return;
  const hasNotes = await knex.schema.hasColumn('agents', 'admin_notes');
  if (!hasNotes) {
    await knex.schema.alterTable('agents', (table) => {
      table.text('admin_notes').nullable();
      table.string('reviewed_by', 255).nullable();
      table.timestamp('reviewed_at').nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('agents');
  if (!hasTable) return;
  const hasNotes = await knex.schema.hasColumn('agents', 'admin_notes');
  if (hasNotes) {
    await knex.schema.alterTable('agents', (table) => {
      table.dropColumn('admin_notes');
      table.dropColumn('reviewed_by');
      table.dropColumn('reviewed_at');
    });
  }
};
