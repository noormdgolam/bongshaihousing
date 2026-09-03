// Version history for admin CRUD edits. Every save appends a new snapshot
// row to edit_history (see 20260903000003_create_edit_history.js) rather
// than maintaining an undo/redo pointer - nothing is ever deleted, so
// "redo" is just restoring the version you moved away from, which is still
// sitting right there in the list. One implementation, reused by every
// entity type's admin route rather than rewritten per-entity.
const db = require('./db');

// entity_type -> { table, key } - `key` is the column identifying a row for
// that entity. Almost everything is 'id', but page_content is keyed by its
// URL path, not a numeric id.
const ENTITY_MAP = {
  product: { table: 'products', key: 'id' },
  category: { table: 'categories', key: 'id' },
  project: { table: 'projects', key: 'id' },
  team_member: { table: 'team_members', key: 'id' },
  testimonial: { table: 'testimonials', key: 'id' },
  faq: { table: 'faqs', key: 'id' },
  service_area: { table: 'service_areas', key: 'id' },
  user: { table: 'admin_users', key: 'id' },
  page_content: { table: 'page_content', key: 'url_path' },
};

// Route handlers build their "after" row by spreading the same field object
// they just handed to knex - which contains `updated_at: db.fn.now()`, a Knex
// Raw whose internals reference the client/pool/timers and blow up
// JSON.stringify with "Converting circular structure to JSON". Snapshots are
// plain data, so coerce every value down to something JSON-safe and drop
// anything that isn't (Raw objects, functions, nested client refs).
function toJsonSafe(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return value;
  return undefined; // Knex Raw, functions, anything else non-primitive
}

function snapshotRow(entityType, row) {
  if (!row) return null;
  const clone = {};
  for (const [key, value] of Object.entries(row)) {
    if (entityType === 'user' && key === 'password_hash') continue; // never snapshot or restore credentials
    const safe = toJsonSafe(value);
    if (safe !== undefined) clone[key] = safe;
  }
  return clone;
}

async function recordHistory(req, entityType, entityId, beforeRow, afterRow) {
  await db('edit_history').insert({
    entity_type: entityType,
    entity_id: String(entityId),
    before_snapshot: JSON.stringify(snapshotRow(entityType, beforeRow)),
    after_snapshot: JSON.stringify(snapshotRow(entityType, afterRow)),
    admin_user_id: req.session?.adminUserId || null,
    admin_name: req.session?.adminName || 'Admin',
  });
}

async function getHistory(entityType, entityId) {
  const rows = await db('edit_history')
    .where({ entity_type: entityType, entity_id: String(entityId) })
    .orderBy('created_at', 'desc')
    .select('id', 'before_snapshot', 'after_snapshot', 'admin_name', 'created_at');
  return rows.map((r) => {
    const before = typeof r.before_snapshot === 'string' ? JSON.parse(r.before_snapshot) : r.before_snapshot;
    const after = typeof r.after_snapshot === 'string' ? JSON.parse(r.after_snapshot) : r.after_snapshot;
    const changedFields = Object.keys(after || {}).filter((k) => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]));
    return { id: r.id, adminName: r.admin_name, createdAt: r.created_at, changedFields, before, after };
  });
}

// Restores a past version onto the live row, then records the restore
// itself as a new history entry (so it's reachable/undoable later too -
// nothing about restoring is special-cased out of the normal history flow).
async function restoreVersion(req, entityType, entityId, historyId) {
  const entity = ENTITY_MAP[entityType];
  if (!entity) throw new Error(`Unknown entity type for history restore: ${entityType}`);

  const historyRow = await db('edit_history').where({ id: historyId, entity_type: entityType, entity_id: String(entityId) }).first();
  if (!historyRow) throw new Error('History entry not found');

  const targetSnapshot = typeof historyRow.after_snapshot === 'string' ? JSON.parse(historyRow.after_snapshot) : historyRow.after_snapshot;
  const currentRow = await db(entity.table).where({ [entity.key]: entityId }).first();
  if (!currentRow) throw new Error(`${entity.table} row not found for restore`);

  const restoreFields = { ...targetSnapshot };
  delete restoreFields[entity.key]; // never overwrite the identifying key itself
  delete restoreFields.created_at;
  delete restoreFields.updated_at; // a restore is a new edit - don't resurrect the old timestamp
  if (entityType === 'user') delete restoreFields.password_hash; // never restore credentials from a snapshot

  await db(entity.table).where({ [entity.key]: entityId }).update(restoreFields);
  const afterRestore = { ...currentRow, ...restoreFields };
  await recordHistory(req, entityType, entityId, currentRow, afterRestore);
  return afterRestore;
}

module.exports = { ENTITY_MAP, snapshotRow, recordHistory, getHistory, restoreVersion };
