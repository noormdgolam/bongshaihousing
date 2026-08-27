// Phase 1: deletes page_views rows unambiguously attributable to this
// session's own Playwright testing (HeadlessChrome on Windows - Claude
// Code's tool calls run on the user's own machine, and chromium.launch()
// with no UA override always identifies itself this way). Then lists the
// curl/8.21.0 rows' paths+timestamps for manual review before a second,
// separate deletion pass - curl volume could include other tool-driven
// testing on the same machine, not just this session's, so it isn't
// deleted automatically here.
const db = require('../lib/db');

async function run() {
  const headless = await db('page_views').where('user_agent', 'like', 'Mozilla/5.0 (Windows NT%HeadlessChrome%').count({ count: '*' });
  console.log(`HeadlessChrome/Windows rows found: ${headless[0].count}`);

  const deleted = await db('page_views').where('user_agent', 'like', 'Mozilla/5.0 (Windows NT%HeadlessChrome%').del();
  console.log(`Deleted: ${deleted}\n`);

  console.log('=== curl/8.21.0 rows - path + timestamp (for manual review, NOT deleted yet) ===');
  const curlRows = await db('page_views')
    .where('user_agent', 'like', '%curl/8.21.0%')
    .select('path', 'created_at')
    .orderBy('created_at', 'asc');
  for (const row of curlRows) console.log(`${row.created_at}\t${row.path}`);
  console.log(`\nTotal curl rows: ${curlRows.length}`);

  const [{ total }] = await db('page_views').count({ total: '*' });
  console.log(`\nRemaining total page_views rows: ${total}`);

  await db.destroy();
}

run().catch((e) => { console.error('Cleanup error:', e); process.exit(1); });
