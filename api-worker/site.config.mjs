// Per-site settings for the API Worker build (build.mjs) and router (src/index.js).
export default {
  // app/api routes NOT served by the Worker: static files (scripts/build-static.sh),
  // dropped (og image, analytics events), GitHub-run cron, or too costly per call.
  skip: [/^og$/, /^events$/, /^cron\//, /^picks$/, /^inspections$/, /^spots\/added$/, /^eateries\/\[id\]$/, /^eateries$/],
  // Browser writes are accepted only from these origins.
  origins: ["https://eats.mapmyhyd.com", "https://mapmyhyd-eats.pages.dev", "http://localhost:3000"],
  // Public GETs: edge cache seconds, shared (Firestore) cache seconds, tags that
  // revalidateTag() clears, and query params that make the answer per-visitor.
  cache: {
    "theme/current": { edge: 60, shared: 600, tags: ["themes", "votes"] },
    "theme/history": { edge: 300, shared: 3600, tags: ["themes"] },
    "votes": { edge: 60, shared: 900, tags: ["votes"] },
    "leaderboard": { edge: 60, shared: 900, tags: ["leaderboard"], privateParams: ["uid"] },
    "rankings": { edge: 300, shared: 1800, tags: ["themes", "votes"] },
  },
  // data/*.json files the libs read with fs, and how to trim them.
  data: {
    exclude: ["zomato-index.json", "reddit-missing-places.json"],
    trim: {
      "eateries.json": ["id", "name", "status", "lat", "lng", "tier", "category", "discoveredIn", "tags", "rating", "ratingCount", "area", "slug"],
    },
  },
};
