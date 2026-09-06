// Single-pass HEAD check of every unique product/category image URL referenced
// in the production DB. Modest concurrency (6 in flight), not a tight loop -
// this machine has had its IP blocked from the live site before for aggressive
// probing, so this stays polite even though the user asked for a full check.
const fs = require('fs');
const https = require('https');

const BASE = 'https://bongshaihousing.com/';
const urls = fs.readFileSync('scratch/img-urls.txt', 'utf8').split('\n').filter(Boolean);

function head(path) {
  return new Promise((resolve) => {
    const url = BASE + path.split('/').map(encodeURIComponent).join('/');
    const req = https.request(url, { method: 'HEAD', timeout: 20000 }, (res) => {
      resolve({ path, status: res.statusCode, len: res.headers['content-length'] });
      res.resume();
    });
    req.on('error', (e) => resolve({ path, status: 'ERR', err: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ path, status: 'TIMEOUT' }); });
    req.end();
  });
}

(async () => {
  const results = [];
  const CONC = 6;
  for (let i = 0; i < urls.length; i += CONC) {
    const batch = urls.slice(i, i + CONC);
    const r = await Promise.all(batch.map(head));
    results.push(...r);
    await new Promise((res) => setTimeout(res, 150));
  }
  const bad = results.filter((r) => r.status !== 200);
  console.log(`checked ${results.length} unique image URLs`);
  console.log(`bad: ${bad.length}`);
  bad.forEach((r) => console.log('  ', r.status, r.path, r.err || ''));
  fs.writeFileSync('scratch/img-check-results.json', JSON.stringify(results, null, 1));
})();
