// Run by a cPanel Cron Job directly (not over HTTP) - see
// server/views/admin/seo/cron-url.njk for the exact command. This sidesteps
// an unresolved routing mystery where a dedicated /internal/seo-refresh
// endpoint consistently 404'd on the public domain despite verifying
// correct end-to-end (confirmed via a direct port-level curl bypassing the
// public proxy - though that test later turned out to have hit an
// unrelated app sharing the assumed port, so the mystery was never
// actually solved, just avoided). A cron-invoked script needs no public
// network exposure at all for something this sensitive (it can trigger
// paid API calls), which is arguably the better design regardless.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { generateBatch } = require('../lib/seo/generate');

generateBatch(10)
  .then((result) => {
    console.log(JSON.stringify(result));
    process.exit(0);
  })
  .catch((err) => {
    console.error('SEO cron generate failed:', err.message);
    process.exit(1);
  });
