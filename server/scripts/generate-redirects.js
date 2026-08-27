#!/usr/bin/env node
/**
 * Parses .htaccess's per-path RewriteRule lines (old/broken URLs -> the
 * current canonical page) into server/redirects.json, so server.js can
 * 301 the same way Apache does. Deliberately skips the host/protocol-level
 * rules (HTTP->HTTPS, www->non-www) since those apply to bongshaihousing.com
 * itself, not this app's own subdomain, and skips patterns with regex
 * alternation/capture groups too complex to turn into one literal path.
 *
 * Re-run whenever .htaccess changes (it's actively hand-edited for Search
 * Console fixes) and re-deploy server/redirects.json alongside it.
 *
 * Usage: node server/scripts/generate-redirects.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const HTACCESS_PATH = path.join(REPO_ROOT, '.htaccess');
const OUT_PATH = path.join(__dirname, '..', 'redirects.json');

function main() {
  const text = fs.readFileSync(HTACCESS_PATH, 'utf8');
  const exact = {};
  const prefix = {};
  let skipped = 0;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('RewriteRule')) continue;

    const match = line.match(/^RewriteRule\s+\^?([^\s$]*)\$?\s+(\S+)\s+\[([^\]]*)\]/);
    if (!match) continue;
    const [, pattern, destination, flags] = match;

    // Host/protocol-level rules use backreferences (%{HTTP_HOST}, $1, %1),
    // not a literal destination path - not representable as a static
    // source->destination map entry, and not applicable to this app's own
    // subdomain anyway.
    if (destination.includes('%{') || destination.includes('%1') || pattern === '(.*)') continue;

    const destUrl = new URL(destination);
    const destPath = destUrl.pathname === '/' ? '/' : destUrl.pathname;
    const permanent = /R=301/.test(flags);

    // Prefix-match bot-trap rules, e.g. ^wp-(content|includes|login\.php|admin)(.*)$
    // or ^createpackages/(.*)$ - anything under one of these literal
    // prefixes redirects the same way, not just one exact path.
    const prefixMatch = pattern.match(/^([^()|]*)\(([^)]*)\)\(\.\*\)$/) || pattern.match(/^([^()|]*)\(\.\*\)$/);
    if (prefixMatch) {
      const [, before, altGroup] = prefixMatch;
      const alternatives = altGroup ? altGroup.split('|') : [''];
      for (const alt of alternatives) {
        const p = (before + alt).replace(/\\\./g, '.');
        if (p) prefix[p] = { to: destPath, permanent };
      }
      continue;
    }

    if (/[()|]/.test(pattern)) { skipped++; continue; }

    const source = '/' + pattern.replace(/\\\./g, '.').replace(/\/\?\$?$/, '').replace(/^\/+/, '');
    exact[source] = { to: destPath, permanent };
  }

  const out = { exact, prefix };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote ${Object.keys(exact).length} exact + ${Object.keys(prefix).length} prefix redirects to ${path.relative(REPO_ROOT, OUT_PATH)}`);
  if (skipped) console.log(`Skipped ${skipped} pattern(s) with regex alternation/groups - review manually.`);
}

main();
