#!/usr/bin/env bash
# Put the build that was running before the last deploy back, in seconds.
#
#   cd /var/www/fluentlearner/app && npm run rollback
#
# Only the running build is restored. The code checkout and the database are left as they are
# (restore a database dump from ~/backups/ by hand if a release changed data).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PM2_APP="${PM2_APP:-fluentlearner}"
PORT="${PORT:-3000}"
PREVIOUS="${HOME}/backups/standalone-prev"
STANDALONE="${APP_DIR}/client/.next/standalone"

[ -f "${PREVIOUS}/client/server.cjs" ] || {
  echo "No saved build at ${PREVIOUS}" >&2
  exit 1
}
rm -rf "$STANDALONE"
cp -a "$PREVIOUS" "$STANDALONE"
pm2 restart "$PM2_APP"
curl -fsS --retry 15 --retry-delay 2 --retry-connrefused \
  "http://127.0.0.1:${PORT}/api/health" && echo && echo "✓ Previous build restored"
