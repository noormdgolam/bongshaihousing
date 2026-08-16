#!/bin/bash
# Keeps only the newest lsnode process for this app, force-kills older
# duplicates left behind by repeated restarts (cPanel Node Selector's
# restart.txt convention starts a new worker but doesn't always reap the
# old one, which eventually exhausts the account's process-count limit).
# Run via cPanel Cron Jobs every 15 min: bash cleanup_orphans.sh -f
# Without -f it only reports what it would kill (dry run).

APP_PATTERN="lsnode:/home/abongsha/bongshai-node-app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/cleanup_orphans.log"
FORCE=0
[ "$1" = "-f" ] && FORCE=1

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# oldest-first PID list for matching processes, keyed by process start time
PIDS=$(pgrep -f "$APP_PATTERN" | while read -r pid; do
  etime=$(ps -o lstart= -p "$pid" 2>/dev/null)
  [ -n "$etime" ] && echo "$(date -d "$etime" +%s 2>/dev/null) $pid"
done | sort -n | awk '{print $2}')

COUNT=$(echo "$PIDS" | grep -c . || true)

if [ "$COUNT" -le 1 ]; then
  log "OK: $COUNT matching process(es), nothing to clean up."
  exit 0
fi

NEWEST_PID=$(echo "$PIDS" | tail -n 1)
OLD_PIDS=$(echo "$PIDS" | grep -v "^${NEWEST_PID}$")

log "Found $COUNT processes matching '$APP_PATTERN'. Keeping newest PID $NEWEST_PID."
for pid in $OLD_PIDS; do
  if [ "$FORCE" -eq 1 ]; then
    kill -9 "$pid" 2>/dev/null && log "Killed orphan PID $pid" || log "Failed to kill PID $pid (already gone?)"
  else
    log "DRY RUN: would kill orphan PID $pid"
  fi
done
