// Pushes the DB-driven nav into the static .html files in the docroot.
// Dry run by default - pass --apply to actually write.
//
//   node server/scripts/sync-nav-to-static.js                      (dry run, all files)
//   node server/scripts/sync-nav-to-static.js --only=index.html    (dry run, one file)
//   node server/scripts/sync-nav-to-static.js --apply              (write, all files)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { syncNavToStaticFiles } = require('../lib/navStaticSync');

const apply = process.argv.includes('--apply');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean) : null;

(async () => {
  console.log(`Mode: ${apply ? 'APPLY (writing files)' : 'DRY RUN (no writes)'}`);
  if (only) console.log(`Limited to: ${only.join(', ')}`);
  const r = await syncNavToStaticFiles({ apply, only });

  console.log(`\nWould change: ${r.changed.length}`);
  r.changed.slice(0, 15).forEach((f) => console.log(`  ${f}`));
  if (r.changed.length > 15) console.log(`  ...and ${r.changed.length - 15} more`);

  console.log(`\nAlready up to date: ${r.unchanged.length}`);
  console.log(`Skipped (no nav region): ${r.skipped.length}`);
  r.skipped.slice(0, 10).forEach((s) => console.log(`  ${s.file} - ${s.reason}`));
  if (r.failed.length) {
    console.log(`\nFAILED: ${r.failed.length}`);
    r.failed.forEach((f) => console.log(`  ${f.file} - ${f.error}`));
  }
  if (!apply) console.log('\nRe-run with --apply to write these changes.');
  process.exit(0);
})().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
