# Curated recommendations

## Preview and rollout

The feature is off by default. Set `NEXT_PUBLIC_CURATED_RECOMMENDATIONS=1` at build time to enable the map, `/picks` routes, place recommendation panels, sitemap eligibility and voting API together. Build again with `0` to roll back. Existing weekly/stamp votes remain separate. No deployment is part of this change.

For an isolated preview: `NEXT_PUBLIC_CURATED_RECOMMENDATIONS=1 NEXT_DIST_DIR=.next-curated npm run build`, then `NEXT_PUBLIC_CURATED_RECOMMENDATIONS=1 NEXT_DIST_DIR=.next-curated npm start -- -p 3001`.

Voting uses the existing Firebase Admin configuration. Signed anonymous cookies use `RECOMMENDATION_COOKIE_SECRET`, falling back to the server-only Firebase private key. Without signing material or Firestore, production voting is unavailable, while all evidence and browsing still work. Each browser can hold one vote per place/dish target, with 30 changes per minute. Cookie resets can create a new identity; these are votes, not verified people. No existing votes are migrated.

## Evidence review

Recommended starts with the 19 existing editorial records and three individually reviewed Reddit additions. The broad existing core filter covers over 3,000 places and is intentionally not used as endorsement evidence. All places still exposes the wider directory.

`data/recommendation-reviews.json` is the publication gate. Every Reddit brand needs the existing candidate threshold, approved branch records, and three reviewed comments from different accounts per published dish association. Counts describe the reviewed sample, not all historical mentions. Evidence is stored once per brand. Additional branches require their own identity/status review; they do not inherit approval automatically.

The first review covers Shadab biryani, Subhan Osmania biscuits, and Panchakattu dosa. Stored approved branch records and coordinates were inspected, including their recorded operating hours and original August 2026 verification dates. These checks are not live confirmation of current hours. Shadab and Subhan official sites were also inspected; Subhan's store-locator page contains unfinished template content and was not used as address proof. No new restaurant record was invented.

Taaza Kitchen/Taaza Tiffins collisions, broad Sushi/Japanese associations and other unreviewed candidates remain pending. Sushi, haleem, mandi, shawarma, pizza, ice cream and Irani chai guides stay unpublished until their evidence meets the three-distinct-brands gate. The current qualified pages are biryani, dosa, tiffins, Osmania biscuits and coffee. Do not pad this set to hit a page-count target.

Existing biryani and tiffin guides contain additional narrative, broader selections and context. Retain their distinct URLs; link them to the reviewed dish guides. No equivalent page was identified for redirect.

## Checks

Run `node --no-warnings --test tests/recommendations.test.mjs` and the production build with the feature both on and off. Tests include review gates, source-account validation when the private raw dataset exists, map/list filtering, URL state, vote switches, duplicate/concurrent submissions, rate limits, cookie signatures and analytics privacy. The transactional store test double serializes transactions; production Firestore connectivity needs the configured environment and is not simulated as a successful user vote.

## Moderated study protocol

Recruit 6–8 Hyderabad residents across familiar and unfamiliar neighbourhoods. Recruitment and scheduling are human steps. Use the enabled preview and ask participants to think aloud without teaching them the controls.

1. Choose somewhere nearby for a meal today. Observe whether the participant chooses location, dish or a pin first.
2. Find a place for a specific dish, inspect why it is recommended, and open directions.
3. Choose somewhere to meet a friend, compare two branches, save/share one, then return to the shortlist.
4. Give or change a dish vote. Ask what the Reddit count and site vote totals mean.

Record task success, time to selection, wrong turns, backtracking, comprehension and whether location denial prevents progress. Alternate map-first and list-expanded starts. Do not infer a universal winning design from 6–8 participants.

The existing engagement collection receives a bounded recommendation journey (maximum 80 events per 30-minute session), recording mode, dish, coarse view, impressions and vote outcomes. Search text, map coordinates and visitor coordinates are excluded. Directions are an intent signal, not a confirmed visit. Compare organic entrances and subsequent saves/directions by dish; do not call low-volume changes statistically significant. Use controlled page cohorts for later SEO experiments when sample size permits.
