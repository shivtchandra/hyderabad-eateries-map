#!/usr/bin/env bash
# Builds the whole site as static files in out/ for Cloudflare Pages.
#
# Run on a throwaway checkout (CI): it deletes app/api (served by the API
# worker, reached through functions/api) and flips the force-dynamic routes to
# force-static so every page is prebuilt.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${CI:-}" != "true" ] && [ "${ALLOW_DESTRUCTIVE_LOCAL:-}" != "1" ]; then
  echo "Refusing to run outside CI: this deletes app/api from the checkout." >&2
  exit 1
fi

rm -rf app/api out

for f in "app/race/this-week/page.jsx" "app/rankings/page.jsx" "app/rankings/[slug]/page.jsx" "app/sitemap.js"; do
  grep -q 'export const dynamic = "force-dynamic";' "$f" || { echo "expected force-dynamic in $f" >&2; exit 1; }
  perl -pi -e 's/export const dynamic = "force-dynamic";/export const dynamic = "force-static";/' "$f"
done

node scripts/build-static.mjs
HYD_STATIC_EXPORT=1 npx next build
node scripts/static-redirects.mjs > out/_redirects

files=$(find out -type f | wc -l | tr -d ' ')
echo "static export: ${files} files, $(du -sh out | cut -f1)"
# Cloudflare Pages allows 20,000 files per deployment.
if [ "$files" -gt 19500 ]; then
  echo "Too close to Cloudflare Pages' 20,000-file limit." >&2
  exit 1
fi
