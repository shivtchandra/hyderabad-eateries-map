# What shipped

Everything below is behind `NEXT_PUBLIC_CURATED_RECOMMENDATIONS=1`. With the flag off the site behaves as before.

## Map (app/page.jsx)
- `FilterChips.jsx`: Recommended / All, the Dish dropdown, categories, and Filters (icon only).
- `PicksSheet.jsx`: the swipe-up list, one row per brand (nearest branch when location is known).
  - Each row shows the locals count or ranking badge, "Try: …" and a **+** button.
  - The last row is "Suggest a place".
- `AddDishSheet.jsx`: the "What's good here?" sheet: tap to agree, or type a new dish.
- `RecommendationPanel.jsx`: the place card (upvote box, What to order, add-dish row, `/ask` links).
- `ThemeNudge.jsx`: the closable weekly vote banner.

## Pages
- `/ask` and `/ask/[slug]`: question pages (what-to-order, worth-it / overrated, vs, need) with a live poll.
- `/picks/[dish]`: "Best {dish} in Hyderabad right now ({Month})". `/picks/[dish]/[area]` for the 6 money areas.
- `/about/how-we-pick`: the method page.
- Spot pages are indexed when `core || recommended`. The sitemap includes `/ask`, dish and area pages and the method page.

## APIs
- `GET /api/recommendations`: the list model, plus public community dishes, approved community picks and ranked places.
- `GET /api/recommendations?spot=`: votes and the place's `/ask` links. `POST`: place up/down vote.
- `GET/POST /api/recommendations/dishes`: dish adds (2-person threshold).
- `GET/POST /api/polls`: poll votes.
- `POST /api/spots/suggest` with `{ forPicks, dish }`: a nomination for Recommended.
- `POST /api/admin/places` with `{ action: "approve", pick: true }`: Approve as Pick.

## Firestore collections (new)
- `recommendation_dishes/{placeId}`, `recommendation_dish_adds/{voter_place}`, `recommendation_dish_voters/{voter}`, `recommendation_dishes_public/summary`
- `polls/{hash}`, `poll_votes/{voter_poll}`, `poll_voters/{voter}`
- `eateries/{user-…}.pickNomination` and `.pick`

## Data and scripts
- `scripts/lib/redditMatch.mjs`: the shared matcher (aliases, `NOT_NAMES`, `offTopic`).
- `scripts/reddit-picks.mjs` writes `data/reddit-picks.json` and `public/locals-picks.json`.
- `scripts/reddit-questions.mjs` writes `data/reddit-questions.json`: per-brand themes, quotes, trend, pairs, needs and gated pages.
- `scripts/reddit-missing-places.mjs` writes `data/reddit-missing-places.json`, a report only: Reddit-recommended places that aren't on the map.
- `scripts/build-llms.mjs` regenerates the block between markers in `public/llms.txt` and `public/llms-full.txt`.
- `scripts/submit-indexnow.mjs --hubs [--dry-run]`.
- `.github/workflows/reddit-picks.yml` runs weekly (Monday 03:00 IST): collect, picks, questions, missing places, llms, commit, wait for the deploy, then IndexNow.

## Libraries
- `lib/recommendations.js`: the model, `dishLeaders`, `dishPage` and `dishAreaPages`.
- `lib/recommendationShared.js`: `mustTry`, `servesDish`, `dishMentions`, `dishPageEligible`.
- `lib/recommendationDishes.js`, `lib/polls.js`, `lib/recommendationPicks.js` (community and ranked picks), `lib/askPages.js`, `lib/dishPageView.js`.

## Tests
`node --no-warnings --test tests/recommendations.test.mjs`, 18 tests. They cover:
- the dish gate;
- matcher false positives;
- dish-add threshold, dedupe and limits;
- polls;
- the evidence gates on question pages.
