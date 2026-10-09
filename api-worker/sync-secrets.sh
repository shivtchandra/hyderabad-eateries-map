#!/usr/bin/env bash
# One-time: copies the API secrets from the (paused) Vercel project into this
# repo's GitHub secrets, which .github/workflows/api-worker.yml pushes to the
# Worker. Values are never printed.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
vercel -Q "$HOME/.vercel-shiva" env pull "$tmp" --environment production --scope shivas-projects-aabdc406 --yes >/dev/null
for name in ADMIN_SECRET RECOMMENDATION_COOKIE_SECRET OLA_MAPS_API_KEY GOOGLE_MAPS_API_KEY RACE_TEST_UIDS RACE_REQUIRE_GPS; do
  value=$(grep "^${name}=" "$tmp" | head -1 | cut -d= -f2- | sed 's/^"//; s/"$//')
  [ -z "$value" ] && value=$(grep "^${name}=" .env.local 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^"//; s/"$//') || true
  if [ -n "$value" ]; then printf '%s' "$value" | gh secret set "$name" >/dev/null && echo "set $name"; else echo "missing $name (skipped)"; fi
done
