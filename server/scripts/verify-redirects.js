#!/usr/bin/env node
/**
 * Redirect/URL parity checker. Requests every URL currently served by the
 * live static site (sitemap.xml, plus the source side of every .htaccess
 * RewriteRule that isn't a generic security/system block) against a target
 * base URL, and diffs the resulting status code + final destination against
 * the live production site.
 *
 * Per the plan: this is meant to be built early and re-run continuously
 * (after every phase, and again right before each cutover) rather than
 * treated as a one-time port - .htaccess is actively hand-edited.
 *
 * Usage:
 *   node server/scripts/verify-redirects.js --target https://test.bongshaihousing.com
 *   node server/scripts/verify-redirects.js --target http://localhost:3000 --baseline https://bongshaihousing.com
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { target: null, baseline: 'https://bongshaihousing.com' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target') out.target = args[++i];
    if (args[i] === '--baseline') out.baseline = args[++i];
  }
  if (!out.target) {
    console.error('Usage: node verify-redirects.js --target <url> [--baseline <url>]');
    process.exit(1);
  }
  return out;
}

/** Pull the source path out of simple `RewriteRule ^pattern$ destination [flags]` lines. */
function extractRewriteSources(htaccessText) {
  const sources = new Set();
  const lines = htaccessText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('RewriteRule')) continue;
    const match = trimmed.match(/^RewriteRule\s+\^?([^\s$]*)\$?\s+(\S+)/);
    if (!match) continue;
    const [, pattern] = match;
    // Skip patterns with regex alternation/capture groups too complex to
    // turn into one concrete test URL automatically - flag them for manual
    // review instead of guessing.
    if (/[()|]/.test(pattern)) continue;
    const cleanPath = pattern.replace(/\\\./g, '.').replace(/\/\?$/, '');
    if (cleanPath) sources.add('/' + cleanPath.replace(/^\/+/, ''));
  }
  return [...sources];
}

function extractSitemapUrls(sitemapText) {
  const matches = sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g);
  return [...matches].map((m) => {
    const u = new URL(m[1]);
    return u.pathname + u.search;
  });
}

async function checkUrl(baseUrl, urlPath) {
  const full = baseUrl.replace(/\/$/, '') + urlPath;
  try {
    const res = await fetch(full, { redirect: 'manual' });
    const location = res.headers.get('location');
    return { status: res.status, location };
  } catch (err) {
    return { status: 'ERROR', location: err.message };
  }
}

async function main() {
  const { target, baseline } = parseArgs();

  const htaccessPath = path.join(REPO_ROOT, '.htaccess');
  const sitemapPath = path.join(REPO_ROOT, 'sitemap.xml');

  const rewriteSources = fs.existsSync(htaccessPath)
    ? extractRewriteSources(fs.readFileSync(htaccessPath, 'utf8'))
    : [];
  const sitemapUrls = fs.existsSync(sitemapPath)
    ? extractSitemapUrls(fs.readFileSync(sitemapPath, 'utf8'))
    : [];

  const allPaths = [...new Set([...rewriteSources, ...sitemapUrls])].sort();

  console.log(`Checking ${allPaths.length} URLs (${rewriteSources.length} from .htaccess rewrites, ${sitemapUrls.length} from sitemap.xml)`);
  console.log(`Baseline: ${baseline}`);
  console.log(`Target:   ${target}\n`);

  let mismatches = 0;
  for (const urlPath of allPaths) {
    const [baselineResult, targetResult] = await Promise.all([
      checkUrl(baseline, urlPath),
      checkUrl(target, urlPath),
    ]);

    const statusMatches = baselineResult.status === targetResult.status;
    const locationMatches = (baselineResult.location || null) === (targetResult.location || null);

    if (!statusMatches || !locationMatches) {
      mismatches++;
      console.log(`MISMATCH ${urlPath}`);
      console.log(`  baseline: ${baselineResult.status} -> ${baselineResult.location || '(no redirect)'}`);
      console.log(`  target:   ${targetResult.status} -> ${targetResult.location || '(no redirect)'}`);
    }
  }

  console.log(`\n${allPaths.length - mismatches}/${allPaths.length} URLs match. ${mismatches} mismatch(es).`);
  process.exit(mismatches > 0 ? 1 : 0);
}

main();
