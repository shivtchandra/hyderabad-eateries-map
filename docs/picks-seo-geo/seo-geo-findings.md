# SEO + GEO findings (October 2026)

How Google, Google AI Overviews and ChatGPT currently answer Hyderabad food questions, what they cite, and what Hyderabad Eats should build to become the cited source. Based on a manual test run on 2026-10-05 (ChatGPT with web search, Google with AI Overview, personalised to Hyderabad 500038).

## Prompts used

Head: 1 best places to eat in Hyderabad, 2 best biryani in Hyderabad right now, 3 where locals actually eat.
Dish: 4 haleem, 5 mandi, 6 dosa / South Indian breakfast, 7 Irani chai + Osmania biscuits.
Area: 8 best biryani near Gachibowli, 9 dinner in Jubilee Hills, 10 late-night food near HITEC City.
Reddit-flavoured: 11 what does Reddit recommend for biryani, 12 is Paradise overrated, 13 mutton biryani with fewer bones.
Comparisons: 14 Shah Ghouse vs Pista House, 15 Mehfil or Shadab.
Place: 16 what to order at Cafe Bahar, 17 is Shah Ghouse worth it.
Constraints: 18 date spot under Rs 1500 for two, 19 pure veg places locals love.
Brand: 20 what is Hyderabad Eats (eats.mapmyhyd.com).

Re-run the same list after each release to track progress.

## Google: "Best biryani in Hyderabad right now?"

- AI Overview names Shadab, Bawarchi, Cafe Bahar, Shah Ghouse, Meridian (with Google Maps rating cards).
- Sources cited by the Overview and the top results are weak and stale:
  - Instagram reels (5+ citations: lbb.hyderabad, ghatotkatcha, Sai Suhas Guttula and others).
  - foodaholix.in, a blog post from March 2018.
  - Travel company blogs: thehosteller.com (Jul 2026), zingbus.com (Apr 2026).
  - Swiggy and Zomato collection pages.
  - r/hyderabad threads that are 2 to 3 years old ("Best biryani right now?", 190+ comments, 2 years ago).
- Google shows "Missing: now?" under a result. Nobody answers the freshness part of the query.
- "People also search": "best biryani in hyderabad right now reddit", "best biryani in Hyderabad Hitech city", "Banjara Hills", "top 10 biryani points".

## Google: "Best biryani near Gachibowli?"

- Local pack (Maps) dominates: Naidu Gari Kunda Biryani, The Nawaab's Restaurant, Paradise Gachibowli.
- Organic: Justdial (307+ bare listings), Zomato, EazyDiner, old Reddit threads (2024, 3 years ago), Instagram reels, Biryani By Kilo store locator.
- None of these give an opinion or a reason. Bare directories win because nothing better exists.
- Related searches: "best biryani in Gachibowli reddit", "best biryani in dlf hyderabad", "Hitech city".

## ChatGPT (web search on)

- Answers are built almost entirely from r/hyderabad threads, quoted with dates ("a February 2026 thread...").
- The answer shape it builds by hand is exactly what our data can produce at scale:
  - Consensus plus disagreement ("consistency is the controversy").
  - Specific needs: "fewer bones" got the longest, most confident answer (Maks Kitchen, Nawaabs, Cafe Bahar).
  - Verdict tables for comparisons (Shah Ghouse vs Pista House: biryani, mutton, consistency, experience).
  - What to order lists (Cafe Bahar: mutton biryani, marag, starter, qubani ka meetha).
  - "Is X overrated" answered as "used to be better", with dated evidence.
- It suggested polls three separate times ("Still the GOAT / Used to be better / Completely overrated").
- Q20, "What is Hyderabad Eats": "the web index isn't currently returning the site's pages". Bing Webmaster Tools is set up, so the gap is content and crawl freshness, not setup.

## Places the AI answers recommend that we miss

- Not in our database at all: Maks Kitchen (Mehdipatnam, ChatGPT's #1 for boneless mutton), Naani's Pure Veg, Kshetra, Hyde Kitchen, Amoroso.
- In the database but not in Recommended: Naidu Gari Kunda (4 records), Lucky (7), Ohri's (10), Et-Si, Stellar Reserve, Chickpet Donne Biryani.

## Blocker found in our own code

With `NEXT_PUBLIC_CURATED_RECOMMENDATIONS=1`, `app/spot/[id]/page.jsx` noindexes every place that is not `seoEligible` (22 places). 3,075 core place pages are indexable today, so launching the flag as it was would have dropped about 3,050 pages from Google. Fixed in the SEO plan, step 1.

Also: the curated data files (`data/reddit-picks.json`, `data/recommendation-*.json`) are read with `fs` at runtime but were not in `outputFileTracingIncludes`, a production risk for `/api/recommendations`.

## What wins, in one line each

1. Freshness: answer "right now" with dated, monthly-updated data. Google flags it as missing.
2. Reddit consensus at scale: ChatGPT hand-assembles it from a few threads; we have 56,192 comments.
3. Specific needs and comparisons beat generic "best X" lists in AI answers.
4. Polls give unique, quotable numbers ("64% of 412 voters say used to be better").
5. Area pages need opinions, not listings, to beat Justdial and Zomato.
6. Instagram is heavily cited by Google AI Overviews, so reels should carry the exact query phrase and link to the matching page.

## Strategy (see the plan for details)

1. Launch blockers: indexing rule, sitemap, file tracing, IndexNow on every data refresh.
2. `data/reddit-questions.json`, a weekly precompute from raw Reddit data: per-brand praise and complaint themes, quotes, trend, co-mentioned pairs, need topics.
3. About 40 evidence-gated `/ask/[slug]` pages: what to order, is it worth it / overrated, X vs Y, need pages (fewer bones, late night near HITEC City, pure veg, date under Rs 1500, haleem outside Ramzan).
4. Live polls on every question page.
5. "Right now" dish pages (monthly title and trend) plus dish and area pages for high-demand areas.
6. GEO plumbing: generated llms.txt, a "How we pick" method page, an `ai` referral source in analytics.
7. Coverage gaps report for Reddit-recommended places missing from the database.

## Instagram (Mapping HYD reels)

- Put the exact search phrase in the caption's first line ("Best biryani in Hyderabad right now").
- Link the matching page (dish page, `/ask` page or ranking).
- Use poll questions from `/ask` pages as reel hooks, and poll results as the follow-up reel.
