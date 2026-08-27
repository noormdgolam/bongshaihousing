const db = require('./db');

/** Fire-and-forget - a logging failure should never break the action it's logging. */
async function logActivity(req, { action, entityType, entityId, summary }) {
  try {
    await db('activity_log').insert({
      admin_user_id: req.session.adminUserId || null,
      admin_name: req.session.adminName || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      summary,
    });
  } catch (err) {
    console.error('Activity log write failed:', err.message);
  }
}

module.exports = { logActivity };
