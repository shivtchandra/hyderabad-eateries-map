# Hyderabad Eats — SEO, GEO & Recommendation Update Checklist

Use this template whenever a restaurant opinion, dish suggestion, weekly ranking, food-safety inspection, or new local guide is added.

## Update record

- [ ] Date: `YYYY-MM-DD`
- [ ] Venue / guide / ranking: `[name]`
- [ ] Correct branch and locality: `[branch, area, Hyderabad]`
- [ ] Update type: `restaurant note / recommendation / ranking / inspection / GEO guide / broken link`
- [ ] Source: `[first-hand visit / weekly voting / TG SAFE / other]`
- [ ] Source URL or evidence saved: `[URL or file]`
- [ ] Writer / reviewer: `[name]`

## 1. Turn the raw note into useful content

- [ ] Preserve the original opinion and do not exaggerate it.
- [ ] Name the exact dishes or drinks tried.
- [ ] Mark each item clearly as recommended, average, disappointing, or not recommended.
- [ ] Include practical ordering advice when relevant.
- [ ] Mention ambience, view, value, service, portion, spice, ice, milk, or other useful context.
- [ ] Use natural Hyderabad search language without keyword stuffing.
- [ ] Separate personal/editorial experience from community ranking data and official inspection facts.

### Copy block

**Short answer:** `[Venue] in [Area], Hyderabad is a [strong / mixed / weak] pick for [cuisine or dish]. [Best concise recommendation or warning].`

**What to order:** `[dish 1], [dish 2]`

**What to know:** `[ordering tip, caveat, ambience or view note]`

**Editorial note:** `[polished version of the first-hand experience]`

## 2. Venue page

- [ ] Reuse the existing venue record; do not create a duplicate branch.
- [ ] Confirm the canonical venue slug works.
- [ ] Add the editorial recommendation to the correct branch page.
- [ ] Add dish-level keywords and Hyderabad/locality context to visible copy.
- [ ] Add or update title, description, canonical URL and social metadata.
- [ ] Add structured data only for facts supported by the page.
- [ ] Link to relevant rankings, dish guides, area guides and the recommendation map.
- [ ] Ensure old or alternate slugs redirect to the canonical page.

## 3. Recommendation map

- [ ] Add the venue to recommendations only when there is a genuinely positive recommendation.
- [ ] Do not label average or bad items as recommendations; retain them as useful venue-page notes.
- [ ] Match the recommendation to a known venue ID and correct coordinates.
- [ ] Add the right cuisine, dish and locality filters.
- [ ] Verify the marker/card opens the canonical venue page rather than a 404.
- [ ] Deduplicate alternate spellings and branches.
- [ ] Confirm map search can find the venue and recommended dish.

## 4. Weekly rankings → recommendations automation

- [ ] Every venue holding a weekly ranking position automatically receives a recommended-map spot.
- [ ] Show what it is ranked for: `[biryani / cafe / ice cream / etc.]`.
- [ ] Show its current position: `#[rank]`.
- [ ] Show vote count or vote share when available.
- [ ] Refresh recommendation labels when the weekly order changes.
- [ ] Remove stale ranking labels without deleting independent editorial recommendations.
- [ ] Resolve the ranked entry to the correct venue and branch.
- [ ] Test at least one winner, one lower-ranked venue and one venue with an alias.

## 5. SEO and GEO guide coverage

- [ ] Identify the real query: `best [dish/cuisine] in Hyderabad`.
- [ ] Add useful area variants where evidence supports them: `in Jubilee Hills`, `Banjara Hills`, `Gachibowli`, etc.
- [ ] Start with a direct answer suitable for search snippets and AI answers.
- [ ] Name the recommended venues, dishes, localities and important caveats in the visible answer.
- [ ] Link each venue name to its canonical page.
- [ ] Link the guide to the live map and the relevant ranking.
- [ ] Add FAQ answers for natural follow-up questions.
- [ ] Include Hyderabad, Telangana geographic entities in structured data.
- [ ] Add an updated date and keep it accurate.
- [ ] Add the guide to navigation, sitemap and machine-readable discovery files.
- [ ] Cross-link related guides so search engines and answer engines understand the topic cluster.

## 6. Ranking-page GEO requirements

- [ ] Give a direct answer naming the current #1 venue.
- [ ] Include ranking category, position, local vote count/share and runner-ups.
- [ ] If voting has not started, clearly label the list as an editorial shortlist.
- [ ] Show freshness date and `Hyderabad, Telangana` context.
- [ ] Use `ItemList` with ranked `FoodEstablishment` entities.
- [ ] Include geographic coverage and date-modified structured fields.
- [ ] Add FAQ answers such as “Who is #1?” and “How current is this ranking?”.
- [ ] Link rankings to relevant GEO guides, venue pages and the recommendation map.

## 7. Food-safety inspection updates

- [ ] Use the official authority/source and record the inspection date.
- [ ] Enter every establishment and the correct locality.
- [ ] Distinguish `inspected`, `licence suspended`, and `show-cause notice proposed` accurately.
- [ ] Do not present a proposed notice as a final violation or suspension.
- [ ] Add the inspection to the food-safety inspection page.
- [ ] Add every mapped establishment to the main map’s Food Safety filter.
- [ ] Link the establishment to the inspection record where possible.
- [ ] Add source attribution and official wording without copying excessive text.

## 8. Link and indexability checks

- [ ] Canonical venue, guide and ranking URLs return `200`.
- [ ] Legacy URLs redirect to the correct canonical destination.
- [ ] No internal link points to a 404.
- [ ] Duplicate area/branch links are removed.
- [ ] Pages appear in the XML sitemap.
- [ ] Robots directives permit indexing where intended.
- [ ] Canonical tags point to the public production URL.
- [ ] Structured data parses and describes the visible page.

## 9. Verification

- [ ] Run focused content/data tests.
- [ ] Run the production build.
- [ ] Confirm generated pages and routes exist.
- [ ] Verify recommendation mapping and ranking automation with a data/state check.
- [ ] Check representative live URLs after deployment.
- [ ] Confirm direct-answer copy, FAQ, `ItemList`, `FoodEstablishment` and geographic schema are present.
- [ ] Use a browser screenshot only when visual layout itself changed.

## 10. Release

- [ ] Review the diff for unrelated changes.
- [ ] Commit with a clear message.
- [ ] Push/merge to `master` when authorized.
- [ ] Confirm static-site and worker deployments pass.
- [ ] Record commit ID: `[commit]`.
- [ ] Record live URLs checked: `[URLs]`.
- [ ] Record any follow-up item: `[item or none]`.

---

## Completed examples from the October 2026 update

- [x] Added dessert and cafe notes for Baskin-Robbins, Glen’s Bakehouse, Van Lavino/Vindor, Misty, Wool Cup, Huber & Holly and Ca Phe Bistro.
- [x] Added Kadali paneer biryani guidance: average/bland unless extra masala is requested.
- [x] Added YouMee as a strong East Asian recommendation, including peanut noodles, cheese dim sum and chicken bao.
- [x] Added the October TG SAFE inspection drive to inspection data and the Food Safety map filter.
- [x] Automatically mapped ranked visitor suggestions to known venues.
- [x] Made weekly ranking pages GEO-friendly with direct answers, vote context, freshness and structured data.
- [x] Added local GEO guides for East Asian/Japanese-related searches, desserts, hot chocolate, cakes, French toast, brownies, cafes with views, date cafes and vegetarian biryani ordering.
- [x] Fixed broken/legacy dish and venue links and added canonical redirects.
- [x] Production build, focused tests, Cloudflare deployment and representative live-page checks passed.
