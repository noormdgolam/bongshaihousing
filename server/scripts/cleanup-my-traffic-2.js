// Phase 2: every curl/8.21.0 row's path was manually cross-checked against
// this session's own verification history (the /health + /uptime-check-bh2026
// polling bursts, the exact bot-scan URLs from the analytics investigation,
// the cottage-model-link false-positive check, the image-pipeline fix
// verification, the deliberate 20x burst sent to test rate-based bot
// detection) - a 100% match, confirmed before deleting.
const db = require('../lib/db');

async function run() {
  const before = await db('page_views').where('user_agent', 'like', '%curl/8.21.0%').count({ count: '*' });
  console.log(`curl/8.21.0 rows found: ${before[0].count}`);

  const deleted = await db('page_views').where('user_agent', 'like', '%curl/8.21.0%').del();
  console.log(`Deleted: ${deleted}`);

  const [{ total }] = await db('page_views').count({ total: '*' });
  console.log(`\nRemaining total page_views rows: ${total}`);

  await db.destroy();
}

run().catch((e) => { console.error('Cleanup error:', e); process.exit(1); });
