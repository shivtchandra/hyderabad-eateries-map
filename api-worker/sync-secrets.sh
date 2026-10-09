#!/usr/bin/env bash
# One-time: copies the API secrets into this repo's GitHub secrets, which
# .github/workflows/api-worker.yml pushes to the Worker. Reads .env.local
# first, then the Vercel project (Vercel won't export "Sensitive" values; those
# come back as "[SENSITIVE]" and are skipped). Values are never printed.
set -uo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
vercel -Q "$HOME/.vercel-shiva" env pull "$tmp" --environment production --scope shivas-projects-aabdc406 --yes >/dev/null 2>&1 || true

read_var() { # file name
  grep "^$2=" "$1" 2>/dev/null | head -1 | cut -d= -f2- | sed "s/^['\"]//; s/['\"]\$//"
}

for name in ADMIN_SECRET RECOMMENDATION_COOKIE_SECRET OLA_MAPS_API_KEY GOOGLE_MAPS_API_KEY RACE_TEST_UIDS RACE_REQUIRE_GPS; do
  value=$(read_var .env.local "$name")
  if [ -z "$value" ]; then value=$(read_var "$tmp" "$name"); fi
  if [ "$value" = "[SENSITIVE]" ]; then value=""; fi
  # Only signs the anonymous voter cookie: a fresh one just means voters get a new cookie.
  if [ -z "$value" ] && [ "$name" = "RECOMMENDATION_COOKIE_SECRET" ]; then value=$(openssl rand -hex 32); fi
  if [ -n "$value" ]; then
    printf '%s' "$value" | gh secret set "$name" >/dev/null && echo "set $name"
  else
    echo "missing $name (skipped)"
  fi
done
gh workflow run api-worker.yml >/dev/null && echo "redeploying the API worker"
