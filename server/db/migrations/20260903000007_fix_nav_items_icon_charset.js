// nav_items.icon stores emoji (multi-byte, outside utf8mb3's 3-byte range),
// but this whole DB's default charset is utf8mb3 (confirmed via SHOW TABLE
// STATUS - same on team_members, so this is a pre-existing DB-wide default,
// not something new to this table) - the 20260903000005 seed migration's
// emoji got silently mangled to "?" on insert as a result. Widen just this
// one column to utf8mb4 (narrow fix, not a whole-DB charset change) and
// re-set the values the seed migration meant to write.
exports.up = async function (knex) {
  await knex.raw('ALTER TABLE `nav_items` MODIFY `icon` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL');

  const FIX_BY_LABEL = {
    'Company Profile': 'ℹ️',
    'Certifications': '📜',
    'FAQ': '❓',
    'Become an Agent': '🤝',
    'Agent Login': '🔑',
    'Track My Project': '📊',
  };
  for (const [label, icon] of Object.entries(FIX_BY_LABEL)) {
    await knex('nav_items').where({ label }).update({ icon });
  }
};

exports.down = async function (knex) {
  // No-op: narrowing the column back would just re-corrupt the data.
};
