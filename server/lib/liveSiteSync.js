// Regenerates one static page snapshot after an admin save, so products
// that still have a static .html file in the docroot (LiteSpeed serves
// those ahead of the Node app - see project docs) actually reflect an
// edit without a full site deploy.
//
// Pure in-process HTTP + local filesystem write. No Python, no curl, no
// FTP, no dependency on test.bongshaihousing.com or any second app - the
// Node app and the static docroot are sibling directories on the same
// server, under the same account, so this just self-fetches the page it
// already knows how to render and writes the result next door.
//
// Replaces the old server/scripts/deploy_single_page.py, which shelled
// out to a literal `python` binary (not present on this host's PATH) and
// a literal `curl.exe` (a Windows binary name, wrong on this Linux
// server), and fetched from test.bongshaihousing.com instead of
// rendering locally - three independent ways it could never have worked
// here, on top of the staging dependency this was meant to remove.

const fs = require('fs');
const path = require('path');
const fsp = fs.promises;

// bongshai-node-app-prod/ (this app, deployed flat - this file lands at
// .../bongshai-node-app-prod/lib/liveSiteSync.js) and bongshaihousing.com/
// (the static docroot) are sibling directories under the same cPanel
// account home. Override via env if a setup ever differs.
const DOCROOT = process.env.STATIC_DOCROOT || path.join(__dirname, '..', '..', 'bongshaihousing.com');

async function syncPageToLive(slug) {
  if (!slug) return false;
  const file = slug.endsWith('.html') ? slug : `${slug}.html`;
  const port = process.env.PORT || 3000;
  const url = `http://127.0.0.1:${port}/${file}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Live site sync failed for ${file}: self-fetch returned HTTP ${res.status}`);
      return false;
    }
    const html = await res.text();
    await fsp.writeFile(path.join(DOCROOT, file), html, 'utf8');
    console.log(`Live site sync succeeded for ${file}`);
    return true;
  } catch (err) {
    console.error(`Live site sync failed for ${file}:`, err.message);
    return false;
  }
}

module.exports = { syncPageToLive };
