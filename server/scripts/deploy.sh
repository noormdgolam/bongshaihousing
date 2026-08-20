#!/usr/bin/env bash
# Deploys given repo-relative files to staging (bongshai-node-app,
# test.bongshaihousing.com), smoke-tests staging, and only then deploys the
# same files to prod (bongshai-node-app-prod, bongshaihousing.com) and
# smoke-tests that too. Aborts before touching prod if the staging smoke
# test fails.
#
# Usage (from repo root):
#   BONGSHAI_FTP_USER=... BONGSHAI_FTP_PASS=... server/scripts/deploy.sh server/routes/admin.js server/views/pages/foo.njk
#
# Credentials are read from env vars on purpose - never hardcode them in a
# committed script.
set -e

if [ -z "$BONGSHAI_FTP_USER" ] || [ -z "$BONGSHAI_FTP_PASS" ]; then
  echo "Set BONGSHAI_FTP_USER and BONGSHAI_FTP_PASS env vars first." >&2
  exit 1
fi
if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <file1> [file2 ...]  (repo-relative paths, e.g. server/routes/admin.js)" >&2
  exit 1
fi

FTP_HOST="ftp.bongshaixpress.com"
STAGING_BASE="bongshai-node-app"
PROD_BASE="bongshai-node-app-prod"
RESTART_MARKER="$(mktemp)"
: > "$RESTART_MARKER"

upload_to() {
  local base="$1"; shift
  for f in "$@"; do
    # Remote layout is flat - server/ prefix doesn't exist on the deployed
    # app, strip it. Non-server/ paths (js/, css/, images/) go to the
    # separate static-site tree instead, not the Node app folder.
    if [[ "$f" == server/* ]]; then
      local remote="${f#server/}"
      curl --ssl-reqd -k --user "$BONGSHAI_FTP_USER:$BONGSHAI_FTP_PASS" -T "$f" "ftp://$FTP_HOST/$base/$remote" -s -w "  $f -> %{http_code}\n"
    else
      echo "  SKIPPED (not under server/, deploy static assets separately): $f"
    fi
  done
}

restart_app() {
  local base="$1"
  curl --ssl-reqd -k --user "$BONGSHAI_FTP_USER:$BONGSHAI_FTP_PASS" -T "$RESTART_MARKER" "ftp://$FTP_HOST/$base/tmp/restart.txt" -s -o /dev/null
}

# smoke-test.js hits the real remote site over the internet - an occasional
# transient network hiccup (one flaky check out of ten) is normal and isn't
# the same signal as a genuinely stale worker serving old content. Retry
# once before treating a failure as real, rather than crying wolf on every
# one-off blip.
smoke_test_with_retry() {
  local url="$1"
  if node server/scripts/smoke-test.js "$url"; then return 0; fi
  echo "First smoke-test pass failed - retrying once in case it was a transient network blip..."
  node server/scripts/smoke-test.js "$url"
}

echo "== Deploying to staging (test.bongshaihousing.com) =="
upload_to "$STAGING_BASE" "$@"
restart_app "$STAGING_BASE"
echo "Waiting ~45s for the restart to take effect..."
sleep 45

echo ""
echo "== Smoke testing staging =="
if ! smoke_test_with_retry https://test.bongshaihousing.com; then
  echo "" >&2
  echo "STAGING SMOKE TEST FAILED - not deploying to prod." >&2
  echo "If this is the known stale-worker issue (content unchanged despite" >&2
  echo "restart.txt), kill the lsnode process via cPanel Terminal and re-run" >&2
  echo "this script - no need to re-upload, just re-run to retest and continue:" >&2
  echo "  ps aux | grep 'lsnode:/home/abongsha/$STAGING_BASE' | grep -v grep | awk '{print \$2}' | xargs -r kill -9" >&2
  exit 1
fi

echo ""
echo "== Deploying to prod (bongshaihousing.com) =="
upload_to "$PROD_BASE" "$@"
restart_app "$PROD_BASE"
echo "Waiting ~45s for the restart to take effect..."
sleep 45

echo ""
echo "== Smoke testing prod =="
if ! smoke_test_with_retry https://bongshaihousing.com; then
  echo "" >&2
  echo "PROD SMOKE TEST FAILED after deploy - likely the same stale-worker" >&2
  echo "issue. Kill the lsnode process via cPanel Terminal and re-run:" >&2
  echo "  ps aux | grep 'lsnode:/home/abongsha/$PROD_BASE' | grep -v grep | awk '{print \$2}' | xargs -r kill -9" >&2
  exit 1
fi

echo ""
echo "Deployed to staging and prod, both smoke-tested clean."
