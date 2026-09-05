// The 2026-09-05 migration that added followup_1/2/3_at only set them going
// forward (new leads via recordLead()) - it never touched rows that already
// existed. Confirmed live: the one pre-existing production lead (created
// 2026-08-29, status নতুন) has all three columns NULL, so applyOverdueFilter()
// correctly finds nothing to flag - there's no scheduled date to have passed -
// but that also means it will never surface as needing attention anywhere,
// on either the dashboard or the weekly report, unless someone happens to
// open it manually. Backfilling from each row's own created_at puts every
// pre-existing, still-open lead onto the same schedule a new one gets.
exports.up = async function (knex) {
  const rows = await knex('leads')
    .whereNotIn('status', ['বিক্রি', 'হারানো'])
    .whereNull('followup_1_at')
    .select('id', 'created_at');

  for (const row of rows) {
    const base = new Date(row.created_at);
    const addDays = (n) => {
      const d = new Date(base);
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };
    await knex('leads').where({ id: row.id }).update({
      followup_1_at: addDays(3),
      followup_2_at: addDays(14),
      followup_3_at: addDays(45),
    });
  }
  if (rows.length) console.log(`[migration] backfilled followup dates for ${rows.length} pre-existing lead(s)`);
};

exports.down = async function (knex) {
  // Not reversible in a meaningful way (the original NULLs aren't
  // distinguishable from a legitimately-cleared date) - intentionally a no-op.
};
