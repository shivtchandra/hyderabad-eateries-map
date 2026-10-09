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

# Read-only endpoints whose answer is the same for every visitor are exported
# as static files at their usual /api URL (out/_routes.json keeps the proxy
# function off them). Everything else under app/api is removed.
STATIC_API=("picks" "inspections" "spots/added" "eateries/[id]")
keep=$(mktemp -d)
for r in "${STATIC_API[@]}"; do mkdir -p "$keep/$r" && cp "app/api/$r/route.js" "$keep/$r/route.js"; done
# The recommendations list is static too, but /api/recommendations also takes
# ?spot= and POST (served by the API worker), so the list lives at
# /data/recommendations.json instead.
mkdir -p "$keep/data-recommendations" && cp app/api/recommendations/route.js "$keep/data-recommendations/route.js"
rm -rf app/api out
mkdir -p "app/data/recommendations.json" && cp "$keep/data-recommendations/route.js" "app/data/recommendations.json/route.js"
perl -pi -e 's/export const dynamic = "force-dynamic";/export const dynamic = "force-static";/' "app/data/recommendations.json/route.js"
perl -0pi -e 's/\nexport async function POST\b/\nasync function POST/g' "app/data/recommendations.json/route.js"
for r in "${STATIC_API[@]}"; do
  f="app/api/$r/route.js"
  mkdir -p "app/api/$r" && cp "$keep/$r/route.js" "$f"
  if grep -q 'export const dynamic = ' "$f"; then
    perl -pi -e 's/export const dynamic = "force-dynamic";/export const dynamic = "force-static";/' "$f"
  else
    printf '\nexport const dynamic = "force-static";\n' >> "$f"
  fi
  # A static file can only answer GET.
  perl -0pi -e 's/\nexport async function (POST|PUT|PATCH|DELETE)\b/\nasync function $1/g' "$f"
done
rm -rf "${keep:?}"
printf '\n%s\n' 'export function generateStaticParams() {
  return Object.keys(getDetails()).map((id) => ({ id }));
}' >> "app/api/eateries/[id]/route.js"

for f in "app/race/this-week/page.jsx" "app/rankings/page.jsx" "app/rankings/[slug]/page.jsx" "app/sitemap.js"; do
  grep -q 'export const dynamic = "force-dynamic";' "$f" || { echo "expected force-dynamic in $f" >&2; exit 1; }
  perl -pi -e 's/export const dynamic = "force-dynamic";/export const dynamic = "force-static";/' "$f"
done

node scripts/build-static.mjs
HYD_STATIC_EXPORT=1 npx next build
node scripts/static-redirects.mjs > out/_redirects
node -e '
  const files = process.argv.slice(1).map((r) => "/api/" + r.replace("[id]", "*"));
  console.log(JSON.stringify({ version: 1, include: ["/api/*"], exclude: files }));
' "${STATIC_API[@]}" > out/_routes.json

files=$(find out -type f | wc -l | tr -d ' ')
echo "static export: ${files} files, $(du -sh out | cut -f1)"
# Cloudflare Pages allows 20,000 files per deployment.
if [ "$files" -gt 19500 ]; then
  echo "Too close to Cloudflare Pages' 20,000-file limit." >&2
  exit 1
fi
