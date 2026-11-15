#!/usr/bin/env bash
# Deploy the latest main to this server (PM2 + Next.js standalone).
#
#   cd /var/www/fluentlearner/app && git pull --ff-only origin main && npm run deploy
#
# What it does, stopping at the first error:
#   1. backs up the running build and the database to ~/backups/
#   2. installs packages and builds
#   3. prepares the standalone folder PM2 runs (server.cjs, static files, public/)
#   4. restarts only the PM2 app (default "fluentlearner"; other apps are untouched)
#   5. checks /api/health, and puts the previous build back automatically if it fails
#
# Settings (optional, as environment variables):
#   PM2_APP   PM2 app name            (default: fluentlearner)
#   PORT      port the app listens on (default: 3000)
#   SKIP_DB_BACKUP=1  skip the database dump
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PM2_APP="${PM2_APP:-fluentlearner}"
PORT="${PORT:-3000}"
BACKUP_DIR="${HOME}/backups"
STANDALONE="${APP_DIR}/client/.next/standalone"
PREVIOUS="${BACKUP_DIR}/standalone-prev"
STAMP="$(date +%F-%H%M)"

step() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

cd "$APP_DIR"
command -v pm2 >/dev/null || fail "pm2 is not installed"
[ -f .env ] || fail ".env is missing in ${APP_DIR}"
mkdir -p "$BACKUP_DIR"

step "Deploying $(git log --oneline -1)"

step "1/5 Backing up the running build and the database"
if [ -f "${STANDALONE}/client/server.cjs" ]; then
  rm -rf "$PREVIOUS"
  cp -a "$STANDALONE" "$PREVIOUS"
  echo "Build saved to ${PREVIOUS}"
else
  echo "No previous build found; skipping (first deploy?)"
fi
if [ "${SKIP_DB_BACKUP:-0}" != "1" ]; then
  # Read user, password, host, port and database from DATABASE_URL in .env.
  eval "$(node -e '
    const line = require("fs").readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m);
    if (!line) process.exit(1);
    const url = new URL(line[1].trim().replace(/^["\x27]|["\x27]$/g, ""));
    const q = s => "\x27" + decodeURIComponent(s).replace(/\x27/g, "\x27\\\x27\x27") + "\x27";
    console.log(`DB_USER=${q(url.username)} DB_PASS=${q(url.password)} DB_HOST=${q(url.hostname)} DB_PORT=${url.port || 3306} DB_NAME=${q(url.pathname.slice(1))}`);
  ')" || fail "Could not read DATABASE_URL from .env"
  DUMP="${BACKUP_DIR}/db-${STAMP}.sql"
  MYSQL_PWD="$DB_PASS" mysqldump --no-tablespaces -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" > "$DUMP"
  tail -1 "$DUMP" | grep -q "Dump completed" || fail "Database backup looks incomplete: ${DUMP}"
  echo "Database saved to ${DUMP} ($(du -h "$DUMP" | cut -f1))"
  # Keep the 10 newest dumps.
  ls -1t "${BACKUP_DIR}"/db-*.sql 2>/dev/null | tail -n +11 | xargs -r rm --
fi

step "2/5 Installing packages and building"
npm ci
npm run build

step "3/5 Preparing the standalone folder"
cd "${STANDALONE}/client"
# PM2 runs server.cjs: the project is "type": "module", so server.js would load as ESM.
cp server.js server.cjs
mkdir -p .next
rm -rf .next/static public
cp -r ../../static .next/static
# Uploads are served from UPLOAD_DIR, not from here, so they aren't copied.
mkdir -p public
find ../../../public -mindepth 1 -maxdepth 1 ! -name uploads -exec cp -r {} public/ \;
cd "$APP_DIR"

step "4/5 Restarting ${PM2_APP}"
pm2 restart "$PM2_APP"

step "5/5 Checking the site"
if curl -fsS --retry 15 --retry-delay 2 --retry-connrefused \
    "http://127.0.0.1:${PORT}/api/health" >/dev/null; then
  pm2 ls
  printf '\n\033[32m✓ Deployed %s\033[0m\n' "$(git log --oneline -1)"
else
  echo "Health check failed. Recent logs:"
  pm2 logs "$PM2_APP" --lines 30 --nostream || true
  if [ -d "$PREVIOUS" ]; then
    echo "Restoring the previous build…"
    rm -rf "$STANDALONE"
    cp -a "$PREVIOUS" "$STANDALONE"
    pm2 restart "$PM2_APP"
    fail "Deploy failed; the previous build is running again. Fix the problem, then deploy again."
  fi
  fail "Deploy failed and there was no previous build to restore."
fi
