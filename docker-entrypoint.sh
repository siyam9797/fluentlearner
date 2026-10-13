#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${PUBLIC_SITE_URL:?PUBLIC_SITE_URL is required}"

if [ "${#JWT_SECRET}" -lt 32 ]; then
  echo "JWT_SECRET must be at least 32 characters" >&2
  exit 1
fi

case "$PUBLIC_SITE_URL" in
  https://*) ;;
  *) echo "PUBLIC_SITE_URL must start with https://" >&2; exit 1 ;;
esac

exec node client/server.js
