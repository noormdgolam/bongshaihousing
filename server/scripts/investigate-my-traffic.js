// One-off investigation (read-only, deletes nothing) to identify exactly
// which page_views rows came from this session's own tool-driven testing
// (curl, Playwright) vs real visitors, before any deletion happens. Run via
// cPanel Terminal from the app root:
//   node scripts/investigate-my-traffic.js
const db = require('../lib/db');

async function run() {
  const [{ total }] = await db('page_views').count({ total: '*' });
  console.log(`Total page_views rows: ${total}\n`);

  console.log('=== Grouped by user_agent (top 40, truncated to 90 chars) ===');
  const byUa = await db('page_views')
    .select(db.raw('LEFT(user_agent, 90) as ua'))
    .count({ count: '*' })
    .groupBy('ua')
    .orderBy('count', 'desc')
    .limit(40);
  for (const row of byUa) console.log(`${row.count}\t${row.ua}`);

  console.log('\n=== Distinct IPs with counts (top 20) ===');
  const byIp = await db('page_views')
    .select('ip', 'country', 'city')
    .count({ count: '*' })
    .groupBy('ip', 'country', 'city')
    .orderBy('count', 'desc')
    .limit(20);
  for (const row of byIp) console.log(`${row.count}\t${row.ip}\t${row.country || ''}\t${row.city || ''}`);

  console.log('\n=== Rows with unambiguous non-browser user_agent (curl/wget/python/node/postman) ===');
  const nonBrowser = await db('page_views')
    .where((b) => {
      b.where('user_agent', 'like', '%curl/%')
        .orWhere('user_agent', 'like', '%wget%')
        .orWhere('user_agent', 'like', '%python%')
        .orWhere('user_agent', 'like', '%node-fetch%')
        .orWhere('user_agent', 'like', '%axios%')
        .orWhere('user_agent', 'like', '%postman%')
        .orWhereNull('user_agent')
        .orWhere('user_agent', '');
    })
    .count({ count: '*' });
  console.log(`Count: ${nonBrowser[0].count}`);

  console.log('\n=== Oldest and newest row timestamps ===');
  const oldest = await db('page_views').orderBy('created_at', 'asc').first('created_at');
  const newest = await db('page_views').orderBy('created_at', 'desc').first('created_at');
  console.log(`Oldest: ${oldest && oldest.created_at}`);
  console.log(`Newest: ${newest && newest.created_at}`);

  await db.destroy();
}

run().catch((e) => { console.error('Investigation error:', e); process.exit(1); });
