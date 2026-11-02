# Eats Map: recovery and search-led ranking plan

Window: 2–30 November 2026. Reported drop: Wednesday, 28 October 2026.
Scope: eats.mapmyhyd.com. Startup Map has not been audited in this workspace.

## What the evidence establishes

- The initial 2 November public audit passed all 11 watched resources: homepage,
  rankings hub, seven dish/category ranking pages, robots.txt and sitemap.xml.
  The watched HTML pages returned 200, self-canonicals, no detected noindex,
  and sitemap membership. The sitemap contained 627 URLs.
- This establishes public crawl prerequisites, not Google's chosen canonical,
  indexing state, impressions, positions, or why traffic dropped.
- Google's Search Status Dashboard listed no incident in the displayed
  26 October–2 November interval. Smaller algorithm changes remain possible.
- A default Python HTTP client received 403 while curl received 200. Inspect
  Cloudflare security events and Search Console live URL tests for verified
  crawler denials; this observation alone does not establish a Googlebot block.
  Never trust a claimed Googlebot user agent as crawler verification.
- The newly supplied Search Console Overview screenshot shows 274 total Web
  clicks over the displayed period, a sharp late-October drop to zero, and a
  recommendation flagging 99% fewer impressions for `/picks/biryani`. The card
  does not expose its comparison window or destination-page performance, so it
  does not establish a domain penalty or quantify net migration loss.
- A direct live probe confirms `/picks/biryani` returns HTTP 308 with Location
  `/rankings/best-biryani-in-hyderabad`. Git attributes the explicit redirect
  rule to 23 October (`3f1dc0e`); repository commit time is not proof of deployment
  or Google recrawl time. URL migration is now a priority hypothesis.
- Inspect both old and new URLs in Search Console. For Web Performance, use
  an exact-URL regex filter matching both, then compare finalized pre/post
  windows and split by Pages/Queries. An old-URL decline is expected after a
  successful move; combined performance determines whether visibility was lost.
  Confirm Google indexes the destination with its self-canonical, and inspect
  last crawl dates and any indexing errors. Preserve the redirect while this
  is investigated; avoid reversing or changing URLs repeatedly.
- The monitor now explicitly verifies the legacy URL remains a direct 301/308
  to the intended destination, in addition to destination metadata checks.
- The pasted hub and ranking pages have different vote totals; these may be
  different snapshots or periods. Compare the same timestamp/period before
  calling it a bug. The live shawarma page labels a tie but also says Winner.
  Clear tie/period/freshness language is a trust improvement, not a proven cause
  of the search drop.

Initial machine-readable evidence: `.mini/seo-recovery/latest.json`.
Repeat: `node scripts/seo-recovery-audit.mjs`. A nonzero exit means a probe or
technical check needs investigation; a network failure is not proof of site failure.
The audit retains timestamped reports and replaces latest.json on each run.

## Diagnose the loss before changing more URLs

Obtain Search Console exports for daily performance, queries and pages from
7 October onward, plus Indexing, Manual Actions and Security Issues reports.
API access, if provided later, should use the read-only Search Console scope.
No authenticated Search Console or Keyword Planner data was available at setup.
Do not put credentials in reports or notes.

1. Compare 21–25 October with 28 October–1 November only once both windows are
   finalized. Until then, shorten both to the same weekdays with complete data.
   Export separate day/query/page tables rather than treating query totals as
   complete site totals. Preserve filters and reporting dates.
2. Segment Web search by page group, query cluster, country and device. Search
   Console has country filtering, not Hyderabad city targeting.
3. Impressions collapsing with lost indexed pages: inspect 10 formerly productive
   URLs in URL Inspection, Google's selected canonical, last crawl, robots and
   Cloudflare firewall events. Inspect deployment/config changes around 28 October.
4. Indexed pages stable but positions falling: compare the specific lost queries
   and pages. Improve original evidence and intent fit on those URLs first.
5. Positions stable but CTR falling: investigate result presentation and competing
   results; improve accurate titles and direct answers. Do not label this deindexing.
6. Search Console stable but analytics falling: investigate tracking/referral changes.
7. Record fixes and dates. Avoid domain moves, mass redirects, slug changes, bulk
   new pages or blanket noindex removal while the cause is unresolved.

## Recovery priorities from the supplied seven-day comparison

The follow-up screenshot/paste supplies real GSC observations, replacing a
purely hypothetical baseline. Calendar endpoints are not visible: preserve
"Last 7 days" and "Previous 7 days" labels until an export supplies dates.
The pasted Invalid Date/1970 chart text is not a reporting date.

| Metric | Previous 7 days | Last 7 days | Change |
| --- | --- | --- | --- |
| Clicks | 61 | 24 | −37 (−60.7%) |
| Impressions, rounded UI totals | 40.6K | 16.8K | about −58.6% |
| CTR calculated from rounded totals | about 0.150% | about 0.143% | roughly stable; UI 0.2%/0.1% exaggerates the apparent difference |
| Average position | 9.1 | 9.3 | +0.2; changing query mix prevents inferring stable rankings for lost queries |

This broadens the investigation beyond the biryani migration. A sudden collapse
across unrelated venue queries calls for page-indexing, crawl/security and
page-group comparisons before treating it as a content/CTR problem. The query
sample is ten rows out of 1,340, not the whole opportunity set. Some queries
still gained impressions; do not describe the domain as universally absent.

| Priority within supplied sample | Query / existing branch page | Impressions previous → current | Next action |
| --- | --- | --- | --- |
| 1 | Between Brewhouse & Kitchen, Financial District | 1,213 → 593 | Inspect index/canonical/crawl first. Preserve its existing full authored review; improve only evidenced gaps. |
| 2 | Feranoz Film Nagar reviews | 784 → 200 | Resolve Film Nagar branch specifically; check page/query match and distinguish other Feranoz branches. Add a review only from an actual visit or attributed source. |
| 3 | The KOP specialty coffee | 413 → 189 | Verify exact branch, existing sourced menu context and crawl/index status. |
| 4 | Windmills Craftworks Madhapur menu | 137 → 64 | Preserve authored review; make verified menu/ordering evidence easy to find without inventing current prices. |
| 5 | Alley 91 bowling bar reviews | 182 → 118 | Verify official booking/venue evidence and explain what is first-hand versus venue-supplied. |
| Protect | Lasthouse by the lake menu | 53 → 157 | Growing query: preserve the existing URL and inspect what is working before editing. |

These are page-recovery priorities by observed lost impressions in the supplied
sample, not search-volume estimates or forecasts. The six branch URLs have
been added to the public technical watchlist. Existing brewery/cafe boards are
natural related destinations where context fits; the venue queries do not by
themselves establish demand for a new "best brewery" or "best cafe" challenge.

Immediate queue: verify these six pages, inspect Search Console indexing/crawl
for the largest three losers plus the biryani destination, then refresh at most
two pages once a factual gap is identified. On the next run, compare newly
finalized daily data rather than recycling this screenshot as fresh telemetry.
Input snapshot: `.mini/seo-input/gsc-user-snapshot-2026-11-02.json`.

## Demand data and weekly topic selection

Search demand chooses which challenge gets featured. Only genuine community
votes determine restaurant positions. Existing evergreen rankings keep their
canonical URLs, vote history and open ballots.

Use three separate signals, always recording source, dates and geography:

| Signal | Source | Interpretation |
| --- | --- | --- |
| Monthly search estimates | Keyword Planner, Hyderabad targeting, Google network | Keyword/close-variant estimates or ranges; record historical months. Ad competition is not organic SEO difficulty. |
| Relative momentum | Google Trends, identical period/geography and shared anchor | Normalized 0–100 interest, not search counts. Use Telangana/India if city data is sparse and label the geography. |
| Existing opportunity | Search Console query/page exports | Your site's impressions, clicks, CTR and average position, not total market searches. |

Seed query groups: best biryani in Hyderabad; best mandi in Hyderabad; best
shawarma in Hyderabad; best dosa/breakfast in Hyderabad; best cafes in Hyderabad;
work friendly cafes Hyderabad; late night cafes Hyderabad; best ice cream Hyderabad;
best brewery Hyderabad. Include useful Gachibowli, Kondapur, Madhapur and Jubilee
Hills variants where a page has real branch-specific evidence. Defer haleem as a
seasonal feature unless current data supports it.

Each Monday, select one primary feature and one runner-up using this order:

1. Eligibility: existing canonical page and enough verified local coverage to
   answer the query. Keep unvoted suggestions separate from voted positions.
2. Recovery: productive pre-drop pages with the largest lost clicks and credible
   query overlap take precedence during the first two weeks.
3. Growth: among eligible topics, favour meaningful impressions at positions 5–30
   and useful intent gaps. Use impressions × positive gap to a clearly labelled
   CTR scenario as an opportunity estimate, never as a traffic forecast.
4. Break close choices using Hyderabad Keyword Planner demand, then comparable
   Trends momentum. Do not add overlapping keyword/close-variant volumes as if
   they represented unique searches.
5. If demand data is missing, keep the queue labelled provisional. Missing and
   sparse data are unknown, not zero. Do not claim a volume-based winner.

If Trends requires several comparison batches, repeat the same anchor term in
each batch. Never compare independently normalized raw scores across batches.
Use public direct sources and non-Google search providers for research; do not
scrape Google Search or use it as a research provider. Google’s own Trends,
Planner and Search Console are the requested demand sources, not SERP scraping.

## Four-week publishing and participation plan

This is a provisional editorial queue, not a measured volume ranking. Reorder
when exports arrive. Refresh at most one or two strong existing URLs weekly.

| Week | Provisional feature | Concrete deliverable |
| --- | --- | --- |
| 2–8 Nov | Biryani recovery + current shawarma race | Diagnose productive lost pages; verify branch identities, periods, tied-leader wording and data timestamps. Link the established biryani and shawarma URLs from the hub/map. |
| 9–15 Nov | Cafes / work-friendly cafes | Pick the better-supported query cluster. Add observed Wi-Fi/power/seating constraints, price context and visit dates only where evidenced. Reuse existing pages. |
| 16–22 Nov | Breakfast / dosa | Refresh the existing dosa board; add genuinely useful area/ordering context and canonical venue links. Keep a single city ranking rather than cloning weekly pages. |
| 23–29 Nov | Mandi or shawarma | Choose from measured demand and participation. Publish a factual weekly movement snapshot with sample size and a link to the same live board. |
| 30 Nov | Review | Compare complete periods; keep the strongest two clusters for December. Document whether recovery, acquisition and participation improved. |

For every feature, prepare one share card and a short caption for the owner's
channels linking to the exact ranking URL. Draft outreach to relevant venue
owners/communities for voluntary participation; do not send messages or publish
posts without explicit instructions. Avoid bought links, incentivized reviews,
vote manipulation and unsolicited community promotion.

## Make the map a source others can cite

- Put a concise, factual answer before the interactive map. Say who leads,
  whether tied, vote sample, board period and when the underlying data changed.
- Link every venue to its exact branch. Keep community vote evidence, editorial
  visit notes and Reddit mentions separately attributed.
- Add verified practical differences: what to order, observed cost/date,
  dietary options, hours/source, area and why someone would choose each place.
  Do not put another dish's recommendation on a category board as category proof.
- Maintain a public methodology and accurate visible/structured-data agreement.
  Do not fabricate AggregateRating, consensus quotes, authors or freshness dates.
- Make useful monthly vote/venue movement summaries citeable, including sample
  size and limitations. This original local dataset is a stronger reason to cite
  Eats Map than another generic listicle.
- Google AI search features use normal SEO prerequisites. Extra AI text files,
  special schema or FAQ markup do not guarantee inclusion or rich results.
  Treat old promises in `docs/seo-geo-unconventional-playbook.md` as hypotheses,
  not verified implementation requirements.

## Scheduled monitoring contract

Run Mondays and Thursdays at 09:30 Asia/Kolkata through 30 November 2026.
On each run, compare the previous timestamped technical report with a fresh audit.
Read this plan and any newly supplied exports under `.mini/seo-input/` or files
explicitly shared in this chat. Preserve the export's actual dates and filters.
Do not invent access to Search Console, Planner, analytics or rank tracking.

- Monday: recompute the primary/runner-up topic queue when fresh evidence exists,
  record reasons and prepare concrete content/distribution drafts.
- Thursday: evaluate recovery against comparable finalized weekday windows;
  record clicks, impressions, CTR and impression-weighted position, by cluster.
  Prioritize combined `/picks/biryani` plus
  `/rankings/best-biryani-in-hyderabad` performance, showing each separately too.
  Do not call an old-URL decline a net loss without destination-page evidence.
  Do not average row CTRs or query positions without their appropriate weights.
- Both: record map opens, votes and AI referral conversions only if real analytics
  are available. Otherwise label them unavailable. AI referral traffic is not a
  measure of all AI citations; Google's AI features are included in GSC Web data.
- Alert on new technical failures, a supported change in the leading opportunity,
  material performance change or user action required. For performance, use a
  20% click change with at least 20 baseline clicks over comparable windows;
  also show absolute change and sample sizes. This is an alert rule, not a
  significance test or recovery guarantee. Stay quiet for unchanged findings.
- Ask for missing exports once, retain that dependency, and continue public
  checks. Do not repeatedly ask or describe unchanged missing data as progress.
- Save dated decisions/reports under `.mini/seo-recovery/` and park resumable
  notes. Prepare publishing drafts; this monitoring setup does not itself modify
  production themes, vote counts, restaurant order or deployed source.
- Stop after the 30 November review. Local-file checks require this project and
  the desktop app to remain available. Report network/tool failures separately
  from site failures.

## Sources

- [Google: diagnosing traffic drops](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops)
- [Google Search Status Dashboard](https://status.search.google.com/)
- [Google Trends normalization](https://support.google.com/trends/answer/4365533?hl=en)
- [Keyword Planner historical metrics](https://support.google.com/google-ads/answer/3022575?hl=en)
- [Search Console API limitations and authorization](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Google AI feature prerequisites](https://developers.google.com/search/docs/appearance/ai-features)
- [OpenAI: scheduled tasks](https://learn.chatgpt.com/docs/automations?surface=app)
