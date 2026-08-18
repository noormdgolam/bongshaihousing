const db = require('../db');

// Key-value store, same pattern as lib/theme.js's theme_settings - but
// deliberately DB-only, no JSON file fallback. A secret API key sitting in
// a plaintext file on the server tree is a real leak risk that a theme
// color palette isn't; if the DB is unavailable, settings are simply
// unavailable rather than silently reading from disk.
const KEYS = ['anthropic_api_key', 'claude_model', 'automation_enabled'];
const DEFAULTS = { anthropic_api_key: '', claude_model: 'claude-haiku-4-5-20251001', automation_enabled: 'false' };

async function getSeoSettings() {
  const hasTable = await db.schema.hasTable('seo_settings');
  if (!hasTable) return { ...DEFAULTS };
  const rows = await db('seo_settings').select('setting_key', 'setting_value');
  const settings = { ...DEFAULTS };
  for (const r of rows) settings[r.setting_key] = r.setting_value;
  return settings;
}

async function saveSeoSettings(updates) {
  for (const key of KEYS) {
    if (!(key in updates)) continue;
    const value = updates[key];
    const existing = await db('seo_settings').where({ setting_key: key }).first();
    if (existing) {
      await db('seo_settings').where({ setting_key: key }).update({ setting_value: value, updated_at: db.fn.now() });
    } else {
      await db('seo_settings').insert({ setting_key: key, setting_value: value });
    }
  }
}

// Never echo the real key back to a template - only enough to confirm
// which key is saved without re-displaying the secret.
function maskKey(key) {
  if (!key || key.length < 8) return key ? '••••••••' : '';
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

module.exports = { getSeoSettings, saveSeoSettings, maskKey };
