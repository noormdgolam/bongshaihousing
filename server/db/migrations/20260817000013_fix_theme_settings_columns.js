// theme.js has always queried theme_settings as a wide key/value table
// (setting_key, setting_value - one row per named setting), but the
// original migration created it as a narrow single-JSON-blob table
// (key, data). Every read/write in theme.js throws "Unknown column
// 'setting_key'" against the real schema, silently caught and falling
// back to the static theme-settings.json file - meaning the admin theme
// editor's database persistence has never actually worked since it was
// built. Renaming the columns to match what the application code expects,
// rather than rewriting theme.js's already-working key/value logic.
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('theme_settings');
  if (!hasTable) return;

  const hasOldKey = await knex.schema.hasColumn('theme_settings', 'key');
  const hasOldData = await knex.schema.hasColumn('theme_settings', 'data');
  const hasNewKey = await knex.schema.hasColumn('theme_settings', 'setting_key');
  const hasNewValue = await knex.schema.hasColumn('theme_settings', 'setting_value');

  await knex.schema.alterTable('theme_settings', (table) => {
    if (hasOldKey && !hasNewKey) table.renameColumn('key', 'setting_key');
    if (hasOldData && !hasNewValue) table.renameColumn('data', 'setting_value');
  });
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('theme_settings');
  if (!hasTable) return;

  await knex.schema.alterTable('theme_settings', (table) => {
    table.renameColumn('setting_key', 'key');
    table.renameColumn('setting_value', 'data');
  });
};
