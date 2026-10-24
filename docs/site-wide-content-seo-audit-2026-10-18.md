# Mapping HYD Eats — Whole-Site Content, Ranking, SEO & GEO Audit

**Audit date:** 18 October 2026  
**Status:** Code, template and local-data audit completed; this is not a live external crawl of every generated URL.  
**Primary question:** Does each page clearly separate Mapping HYD's opinion, community rankings, Reddit evidence, Google facts and restaurant-supplied facts?

## Executive verdict

The earlier work fixed the main ranking model on the directly targeted pages, but the full-site audit found that several older templates and datasets still contradict that model.

The most serious problems are not ordinary keyword issues. They are trust and provenance problems:

1. **29 curated pages can falsely display “Shiva · Mapping HYD” even though no author is stored.**
2. **Any venue-content record is currently treated as an editorial recommendation unless explicitly rejected.** This even promotes three negative-only reviews as approved editor picks.
3. **Raw Reddit matches can appear as “Locals' pick” without human approval.** Broad name matching also reuses branch or brand evidence on unrelated pages.
4. **Google review volume still determines several surfaces labelled “Top.”** It is acceptable as a labelled fallback, not as Mapping HYD's owned ranking.
5. **The food-safety module implies absence of notices on thousands of pages even though only seven venue IDs are linked to the local tracker.**
6. **The new `/picks` and `/ask` URLs can be linked or redirected to while the feature flag makes them return 404.**

The site should not be pushed as an authority or GEO source until the P0 release gates below are resolved.

## Remediation pass completed after this audit

The first release-blocking implementation pass was completed on 18 October 2026:

- Removed the personal “Shiva” fallback. Records without a stored author now use an organization-level “Mapping HYD · Editorial note/Visit notes” label.
- Changed editorial recommendations to explicit opt-in. A content record is no longer an endorsement by default; Big Plate Mandi is explicitly `recommended`, while negative/factual notes are not promoted.
- Removed shortlisted research branches from the recommended set.
- Gated raw Reddit picks and brand quotes to reviewed branch associations. The post-fix whole-dataset check returns three approved picks and three approved brand records instead of hundreds of unreviewed matches.
- Made static thread matching exact instead of substring/fuzzy. Six exact thread matches remain across the dataset.
- Made owned community standings lead the map rail and Ask ordering. Google remains only a fallback/tie-break where there is no owned signal.
- Changed zero-vote ballot candidates from numbered ranks to `?` and alphabetized them instead of sorting by Google review volume.
- Renamed category lists to “Most reviewed … on Google,” removed fake numbered positions, and labelled Google stars/review counts in the map rail and detail sheet.
- Replaced “No notices on record” with an explicit incomplete-coverage warning.
- Made biryani redirects and internal `/picks` links respect the recommendation feature flag, falling back to the always-available community ranking.
- Added a regression test proving editorial content needs explicit recommendation status.

Post-fix verification: **28/28 tests passed**, production build passed, JSON parsed and `git diff --check` passed. The build still tolerated the previously documented Firestore DNS failures; the second pass below adds an opt-in production release gate.

### Second remediation pass — 19 October 2026

- Venue-content sources now render visibly on both review and standard venue layouts, with an explicit warning that external links support venue/menu facts rather than personal scores.
- Must Order was renamed to “What to order,” and the false shared “From locals and r/hyderabad” label was replaced with per-item provenance.
- Custom timing FAQs are stripped and rebuilt from canonical venue hours, resolving the seven known hours contradictions.
- Unsupported generic FAQ claims such as “popular” and “quality food” were removed.
- Windmills is now the second explicit editorial recommendation because it has a named guest reviewer, dated publication, verdict and source links. The recommendation surface now contains two explicit editorial picks plus three entity-reviewed Reddit branches.
- Niloufer's comparison note, both duplicated Dumont records and Wool Cup Financial District now declare whether their content is branch-comparison or brand-level.
- The static map export now uses the same explicit recommendation gate instead of treating every story, seed dish or shortlist row as a recommendation.
- A `REQUIRE_LIVE_RANKINGS=1` release gate now makes production/CI fail when Firestore ranking data cannot be loaded or is unexpectedly empty. Local development can remain fail-soft.
- Curated `/picks` and `/ask` stay disabled by default because the stricter evidence model currently produces no publishable citywide dish guides. Generic biryani URLs always fall back to the live community ranking, and disabled routes are removed from generated LLM/GEO blocks.
- Empty ranking topics are `noindex`; the duplicate plural brewery ranking redirects to the singular canonical topic.
- Hyderabad hours calculations now use `Asia/Kolkata` on server and client.
- `/admin` now has `noindex,nofollow,nocache` metadata.
- Restaurant JSON-LD omits `image` when no real venue image exists.
- Duplicate Place IDs now prefer the newest `detailsUpdatedAt` row, using review volume only as a tie-break.
- Area metadata titles were shortened.

Post-second-pass verification: **30/30 tests pass**, generated LLM files contain no disabled `/picks` or `/ask` links, production build passes, and `git diff --check` passes. Production must set `REQUIRE_LIVE_RANKINGS=1`; without that environment variable, local builds intentionally continue with warnings when Firestore is unavailable.

### GSC correction — preserve `/picks/biryani`

Search Console data received on 19 October 2026 showed that `/picks/biryani` earned **4,912 impressions from 8–14 October**, compared with zero in the previous seven-day period. `/explore/biryani-and-local` received 23 impressions. This overrides the earlier plan to let the feature gate remove every `/picks` page.

The exact high-impression URL is now permanently preserved without restoring unsafe recommendations:

- `/picks/biryani` is always generated and indexable even when the broader curated recommendation feature is disabled.
- It answers the query using only Mapping HYD community votes; Google stars, Google volume, editorial stories and Reddit mentions do not add votes.
- Real vote rows receive numbered positions. Candidate suggestions stay in a separate unranked list.
- The page has a self-canonical, direct-answer copy, Article/Breadcrumb schema and ItemList schema only when real votes exist.
- Generic biryani redirects point to this URL.
- The voting interface at `/rankings/best-biryani-in-hyderabad` canonicals to `/picks/biryani`, consolidating the overlapping search intent while remaining available for voting.
- The URL has high sitemap priority, internal links from category/ranking/404 surfaces and a generated LLM/GEO reference.
- Other `/picks` and `/ask` pages remain evidence-gated and disabled until they qualify.

Verification after the GSC correction: **30/30 tests pass**, production build passes and `/picks/biryani` appears as the sole generated dish-guide route.

## What was audited

| Surface | Measured scope |
|---|---:|
| Approved/merged venue pages | 3,695 |
| Page templates | 32 |
| API route handlers | 32 |
| Area pages | 16 |
| Area-category pages | 107 |
| Explore/category pages | 7 |
| Dish/editorial guides | 9 |
| Venue-content records | 35 |
| GSC/OpenSEO profiles | 16 |
| Directly targeted search URLs | 17 |
| Explicit target query variants | 54 |

This was a template-and-data audit across the whole generated site. It does **not** mean 3,695 restaurants were individually visited or researched.

## Exactly what the previous work changed

### Directly targeted pages

**17 URLs were directly targeted:** 16 restaurant pages plus `/picks/biryani`.

The restaurant pages were:

1. Between Brewhouse & Kitchen
2. The KOP Specialty Coffee
3. Amritsar Haveli Abids & Samroze Coffee
4. Enugu Cafe
5. Alley 91 Bowling Bar
6. Tori's Speciality Coffee
7. Parampara
8. Windmills Madhapur
9. Arabian Affairs
10. Hyderabad Spicy Kitchen & Bar
11. Big Plate Mandi
12. AK Tea Point
13. Biryani Katha
14. Accha Telugu Kitchen
15. Chittor Naidu Drive-In
16. Mirthy Cafe

The 16 venue profiles contain 16 primary and 38 secondary queries. Twelve have direct-answer copy, five contain a source link and four contain supporting fact lists.

### Ranking and intent corrections already made

- Separated four competing biryani intents:
  - `/picks/biryani` — evidence-led recommendation guide.
  - `/rankings/best-biryani-in-hyderabad` — live community ballot.
  - `/explore/biryani-and-local` — geographic discovery map.
  - `/guides/best-biryani-hyderabad-reddit` — discussion-led editorial article.
- Redirected generic biryani search URLs toward the intended evidence page.
- Required real votes before displaying a numbered community rank.
- Changed zero-vote entries from ranked restaurants to unranked ballot candidates.
- Kept Reddit-account counts separate from editorial evidence; editorial choices no longer inflate the displayed Reddit number.
- Reframed area pages as area discovery guides instead of fabricated “top-rated” lists.
- Put community standings first where they exist and label Google sorting explicitly.
- Labelled Google ratings as third-party Google facts rather than Mapping HYD verdicts.
- Removed third-party Google stars from Mapping HYD's owned `AggregateRating` schema.
- Added query-aligned titles, direct answers and entity clarification to the 16 search-opportunity pages.
- Kept thin venue pages `noindex`; the researched opportunity IDs were added to the indexable set.
- Removed fake sitemap freshness dates.
- Removed crawler-only hidden navigation.
- Allowed OAI-SearchBot for AI/GEO discovery.
- Tightened brewery and biryani category filters.
- Removed invented-looking quotations and guaranteed batch-time claims from the Reddit biryani article.
- Added a five-minute lifetime to the ranking/indexability cache and filtered closed ballots.

### Mirthy correction already made

The contradiction on the Mirthy page was real. The page mixed a 4.6 Google score with a negative Mapping HYD visit and still presented positive dishes as recommendations.

It now:

- uses `contentMode: "visit-note"`;
- uses `recommendationStatus: "not-recommended"`;
- retains only the three items actually tried: Hot Chocolate, Brownie and The Pistachio;
- shows the Mapping HYD 4.5/10 visit separately from Google's 4.6 rating;
- removes unsupported signature and must-order dishes;
- suppresses the Reddit match belonging to another Mirthy location;
- cannot become an editor pick or SEO dish recommendation;
- has a regression test.

### Big Plate Mandi correction already made

The user's first-hand opinion was added as owned content:

- author: Shiva Chandra;
- visit date: 27 September 2025;
- Apollo Fish Starter marked excellent;
- Juicy Chicken Mandi marked the clear favourite;
- static Mandi community result linked to the real venue ID;
- search-opportunity profile and featured entry added;
- review schema uses the owned author/date, not Google's rating.

### How many pages were “updated”?

There are three different honest counts:

| Meaning | Count |
|---|---:|
| URLs directly targeted from Search Console/OpenSEO | 17 |
| Venue-content records currently in the editorial dataset | 35 |
| Generated pages potentially affected by shared template/data changes | Thousands, including 3,695 venue pages |

The template reach must not be described as thousands of individually researched or rewritten pages.

## Personal-opinion inventory

There is no single safe number unless “personal opinion” is defined:

| Definition | Count |
|---|---:|
| Recent user-opinion batch | 7 venue pages across 6 brands |
| Records with first-person wording anywhere | 12 venue pages |
| Records with a formally named author | 2 |
| Records with `reviewedAt` | 1 |
| Records with a numeric overall verdict | 7 |
| Broad review-like venue-content records | 35 |

The recent batch covers Mirthy, Glen's, Vindour, Huber & Holly Banjara Hills, Huber & Holly Himayat Nagar, Ca Phe Bistro and Big Plate Mandi.

Only these authors are currently stored:

- Piyush Bhuyan — Windmills.
- Shiva Chandra — Big Plate Mandi.

Therefore, the site must not attach Shiva's name to the other records without confirmation.

## Decision framework established

These rules should govern every page and future import:

1. **Google is a labelled third-party fact, never Mapping HYD's verdict.**
2. **A numbered rank requires real votes or a clearly defined evidence count.**
3. **Zero votes means candidate, not rank.**
4. **Reddit counts represent distinct accounts in the analysed evidence; editorial judgement never increases that count.**
5. **First-hand reviews require an explicit author and should include a visit date.**
6. **Menu facts, venue facts, personal opinion, community vote and external evidence are separate data types and separate UI blocks.**
7. **One primary landing page owns each search intent.**
8. **Schema mirrors visible, owned and supportable content; it does not manufacture ratings, hours, menus or authors.**
9. **Pages without unique owned value remain `noindex`.**
10. **A GEO answer directly answers the area query and names the signal used.**
11. **Having an editorial record does not automatically mean the restaurant is recommended.**
12. **Branch-level claims need branch-level evidence; otherwise they must be labelled brand-level.**
13. **Owned ranks and votes lead; Google can be a labelled fallback or tie-break only.**

## P0 — release blockers

### P0.1 False author attribution on 29 pages

Only 2 of 35 venue-content records contain an author, yet the venue template falls back to “Shiva · Mapping HYD.” The result is a visible personal byline on 29 pages without supporting data. Twelve records use first-person language and ten of those have no named author.

**Required fix:** Remove the author fallback. Show a person only when stored. Otherwise label the block “Mapping HYD editorial note” or “Mapping HYD visit notes,” depending on verified provenance.

### P0.2 Content is incorrectly treated as endorsement

Every venue ID in `venue-content.json` becomes editorial unless explicitly marked `not-recommended`. Three negative-only entries therefore resolve to `recommended: true`, `editorial: true`, `approved`:

- Huber & Holly Banjara Hills.
- Huber & Holly Himayat Nagar.
- Ca Phe Bistro.

**Required fix:** Make recommendation status explicit and default-deny. Suggested values: `recommended`, `conditional`, `not-recommended`, `factual-only`.

### P0.3 Unreviewed Reddit evidence reaches users and indexing

- 344 venue pages can visibly show a “Locals' pick” from raw Reddit matching.
- Only three branch associations are human-approved in the reviewed association file.
- 370 pages can qualify as having unique/index-worthy content solely through raw Reddit evidence.
- Ninety-nine pages receive brand evidence; 42 of those joins are inferred by name rather than an explicit ID.

The broad matcher reuses just 18 first-praise quotes across 99 pages, with one quote reaching 33 branches. Known bad cases include an Ishtaa shawarma quote on vegetarian/tiffin context, negative Shadab and Taaza comments classified as praise, and a Paradise memory reused on unrelated names.

The numbered thread-standing matcher has a second branch problem: ten pages receive hard-coded thread standings through fuzzy name/slug matching. Confirmed false cases include Broadway Gachibowli inheriting a Jubilee Hills brewery rank and two Gachibowli Coalspark entities inheriting a Mehdipatnam standing. It can also use the full Reddit post title as the ranking label instead of a clean topic name.

**Required fix:** Only render and index from reviewed entity associations. Store evidence scope as `venue`, `branch`, or `brand` and display that scope.

### P0.4 Google still acts as an unlabeled Mapping HYD rank

- The seven `/explore/[category]` pages number a “Top … in Hyderabad” list sorted by Google review volume.
- The Ask engine gives owned ranking candidates priority bands but then sorts within a band using Google rating × review volume. This can place a lower Mapping HYD rank above a higher one.
- Area tiles use Google review count to choose “top” names, while “most popular” is effectively the first hard-coded area rather than a measured popularity result.
- The main map spotlight/rail is ordered largely by Google rating × log(review volume), and its cards show stars without naming Google.
- The detail sheet presents imported Google values as generic primary “Rating / Reviews” stats instead of labelling the source.
- The main voting component sorts zero-vote suggested candidates by Google review count and displays `#1`, `#2`, and so on, although no community standing exists. The dedicated ranking page already handles this correctly as unranked.

**Required fix:** Owned rank/votes determine order. If no owned evidence exists, say “Most reviewed on Google” rather than “Top.”

### P0.5 Food-safety absence is overstated

The local tracker contains 77 inspection entries, but only seven unique venue IDs are linked. Approximately 3,688 venue pages therefore have no matched local record, yet the UI can say “No notices on record.”

**Required fix:** Hide the module on unmatched pages or say: “No matched TG SAFE record in our current tracker. Coverage is incomplete.”

### P0.6 Feature-gated URLs can receive unconditional links and redirects

`/picks` and `/ask` return `notFound()` unless `NEXT_PUBLIC_CURATED_RECOMMENDATIONS=1`; `.env.example` defaults it to `0`. Three redirects and multiple site links still point to `/picks/biryani` unconditionally.

**Required fix:** Confirm the production flag as a release gate, or remove the gate/fallback safely. Never ship redirects to a possible 404.

### P0.7 Critical work is untracked

These runtime/test files are currently untracked and would be missed by `git add -u`:

- `lib/searchOpportunities.js`
- `tests/schema.test.mjs`

They must be included in the intended commit. Unrelated screenshot/image artifacts must remain excluded.

## P1 — high priority

### P1.1 “What locals say” can contain Mapping HYD's own opinion

All 31 signature-dish pages can trigger this heading, while 17 have no Reddit evidence at all. Rename the section according to the actual evidence: “Mapping HYD's take,” “Community vote,” “Reddit mentions,” or “Restaurant/menu fact.”

### P1.2 Must-order attribution is false

The UI says “From locals and r/hyderabad,” but the seed dataset contains 340 editor items and only 43 Reddit items. Seventy-three visible blocks contain editor-only seeds.

Render claim-level provenance, not one shared community heading.

### P1.3 Sources exist but are invisible

Sixteen of 35 venue-content records contain a source array, but the page does not render it. Nineteen records have no sources at all. A restaurant homepage may support its address or menu, but cannot prove Mapping HYD's score or a first-hand service observation.

### P1.4 Branch-level evidence is reused as if it were branch-specific

- Brand dish rules apply across 27 branch pages without a branch-scope notice.
- 194 of 353 raw Reddit spot records share evidence with another branch.
- Dumont content is duplicated across two branches.
- Wool Cup Financial District repeats Film Nagar scores and service claims.
- Cafe Niloufer Lakdikapul recommends an item based on Jubilee Hills.

The existing brand-level notice constant is not used.

### P1.5 Search-intent pages lack the content the query expects

Of nine profiles targeting review intent, five have no real review content: Amritsar, Alley 91, Arabian Affairs, Hyderabad Spicy Kitchen and Accha Telugu.

There are 11 menu-intent profiles, but no normalized venue has a `menuUrl`. Only Parampara and Windmills contain curated signature/must-order material. A title containing “menu” does not satisfy menu intent.

### P1.6 Generic FAQs manufacture quality claims

About 3,660 pages without a custom FAQ can state that a venue is “popular” and serves “quality food and local favorites.” That unsupported text is also eligible for FAQ JSON-LD.

Remove opinion adjectives. Generate only verifiable facts or omit the FAQ.

### P1.7 Custom FAQ hours conflict with canonical data

Seven direct contradictions were found: Nimrah, Manam, Fursat, Shanbhag's, Conçu Kondapur, Air Live Jubilee Hills and Dumont Himayat Nagar.

Hours copy should be generated from one canonical normalized field rather than duplicated prose.

### P1.8 Structured-data coverage is thin

Across 3,695 normalized venues:

| Field | Present |
|---|---:|
| Address | 3,695 |
| Google rating | 3,694 |
| Raw hours | 3,138 |
| Phone | 2,835 |
| Website | 1,293 |
| Cost for two | 240 |
| `openingHoursSpecification` | 0 |
| `menuUrl` | 0 |
| Cuisine field | 0 |

Preserve the good rule of not publishing third-party `AggregateRating`. Add opening hours, menu and cuisine only after explicit normalized data and validation exist.

### P1.9 Four indexable ranking pages have no candidates

- Best Veg Biryani.
- Best New Cafe.
- Best Late Night Cafe.
- New Restaurants.

Populate them, redirect them, or make them `noindex` until evidence exists.

### P1.10 Duplicate brewery intent

“Best Brewery in Hyderabad” and “Best Breweries in Hyderabad” resolve to the same venue set. Pick one canonical topic and redirect the other.

### P1.11 Ranking badge omits the ranking context

Area-category cards show only “Mapping HYD #N.” Those numbers can come from different ballot themes and are not comparable. Add the ballot/ranking name to every badge.

### P1.12 GEO/LLM files amplify unresolved claims

`public/llms.txt` and related generated files link to feature-gated `/picks` and `/ask` routes. Their header also implies counts combine Reddit accounts with ranking votes, although the current recommendation payload does not attach live votes. Static “verified entities” include recommendations/hours whose provenance has not been fully reviewed.

Regenerate these files only after provenance and feature-flag checks pass.

### P1.13 Ranking data can disappear silently during builds

The production build passed while reporting nine Firestore DNS failures. Fail-soft behavior can create a successful static build with missing live ranking context.

Add a release check or fixture that fails when expected ranking topics are unexpectedly empty.

### P1.14 Hyderabad time is not consistently used

“Open today” uses the server's weekday and live open-state code can use the visitor's local timezone. Around midnight, a Hyderabad venue can display the wrong day or open status.

Use `Asia/Kolkata` for both server and client calculations.

### P1.15 Policy copy contradicts implementation

- One page says “one live vote per person per dish”; implementation is one vote per browser.
- “No AI writes or scores anything” is too broad for an AI-assisted editorial workflow.

Make the wording exact and auditable.

### P1.16 Hub links concentrate crawl equity on thin pages

The 16 area, 107 area-category and seven explore pages contain 4,925 venue links pointing to 1,831 unique venues. In the local build baseline, 1,554 of those destinations — **84.9%** — have no local indexability signal. Runtime ranking data may rescue a small subset, but the architecture still sends most hub links toward `noindex` utility pages.

Keep map utility access, but concentrate prominent editorial links on pages with verified original content. Do not make thin pages indexable merely to fix this ratio.

## P2 — cleanup and data health

- The admin page inherits public root metadata; add explicit `noindex,nofollow` and an authentication/canonical boundary.
- The core-spot threshold comment does not match the constants.
- Raw eateries contain 24 duplicate Google Place IDs. The merge chooses the greater review count rather than the newest data and selects an older record for seven IDs.
- 3,694 rated rows lack an explicit `ratingSource` field even though the UI correctly labels Google.
- 247 places lack `detailsUpdatedAt`.
- 180 website fields point to social, directory or preview domains; five point to `preview.emergentagent.com` and need manual verification.
- Only five of 16 search-opportunity profiles contain a source link.
- Eight duplicate spot-title groups affect 19 prerendered pages; four indexable pages are involved. The title builder can remove the area name while shortening otherwise identical branch names.
- Thirty-six indexable titles exceed 70 visible characters: 32 area pages and four guides.
- Restaurant JSON-LD can use the generic Mapping HYD home artwork as a restaurant image. Omit `image` when there is no real venue photo.

## Recommended implementation order

### Phase 1 — trust model and release gates

1. Remove the Shiva author fallback.
2. Make recommendation status explicit and default to `factual-only`.
3. Block unreviewed Reddit associations from UI, indexing and GEO exports.
4. Change Google-derived “Top” labels and Ask ordering.
5. Correct food-safety absence wording.
6. Resolve the `/picks` and `/ask` feature-flag state.
7. Track the two critical new files.

### Phase 2 — claim-level provenance

1. Add a normalized source type to every claim: first-hand, community vote, Reddit, menu/official, Google, or editorial synthesis.
2. Render sources and branch/brand scope visibly.
3. Rename “What locals say” and Must Order headings dynamically.
4. Replace duplicated hours FAQs with canonical generated facts.
5. Audit every Reddit entity join and every duplicated branch record.

### Phase 3 — SEO/GEO completion

1. Write genuinely useful review content for the five review-intent gaps.
2. Add verified menu URLs or stop targeting “menu” where no menu exists.
3. Populate or `noindex` empty ranking topics.
4. Consolidate duplicate ranking intents.
5. Regenerate `llms.txt` only from reviewed, visible claims.
6. Add build-time provenance, entity-join and ranking-availability checks.

## Release checklist

- [ ] No person is credited without an explicit stored author.
- [ ] Negative/factual records cannot become recommendations by default.
- [ ] No raw Reddit association reaches UI/indexing without review.
- [ ] Every numbered rank names its evidence source and has non-zero evidence.
- [ ] Google-derived lists say “Google” or “most reviewed,” not Mapping HYD “Top.”
- [ ] Food-safety wording acknowledges incomplete tracker coverage.
- [ ] `/picks` and `/ask` resolve in the production configuration.
- [ ] Empty ranking pages are populated, redirected or `noindex`.
- [ ] Feature-gated URLs are absent from GEO exports when disabled.
- [ ] Hyderabad time is used for hours.
- [ ] The two new runtime/test files are tracked.
- [ ] Tests, build and structured-data checks pass.
- [ ] The 17 target URLs are checked live after deployment.
- [ ] Sitemap is resubmitted only after the live URLs and canonicals are verified.

## Verification status at audit time

- Recommendation/schema test suite: **30/30 passing**.
- Production build: **passed**.
- Diff whitespace check: **passed**.
- Built-page snapshot: **388 HTML files; every file has title, description and canonical metadata**.
- Structured-data parse: **1,389/1,389 JSON-LD blocks valid**.
- Open Graph/canonical mismatch check: **zero mismatches**, excluding expected feature-gated 404 routes.
- Build reliability warning: **nine Firestore DNS failures were tolerated**, so the build result alone does not prove that live ranking data was present.

## Bottom line

The strategic direction is correct: Mapping HYD should rank places using its own declared evidence, publish clearly attributed first-hand notes, and treat Google as a labelled supporting fact. The current patch made that model visible on the directly targeted pages. The next pass must enforce the same model at the data and template boundary so older records, raw Reddit joins and Google-volume fallbacks cannot silently contradict it.
