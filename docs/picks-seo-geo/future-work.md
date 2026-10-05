# Future work (prioritised)

## Next up
1. **Add the missing places** from `data/reddit-missing-places.json`: Maks Kitchen (ChatGPT's #1 for "fewer bones"), Santosh Dhaba, Kakatiya Mess, Almond House, Karachi Bakery, Naani's, Kshetra, Hyde Kitchen.
2. **Review in-DB places that AI answers recommend but we don't:** Naidu Gari Kunda, Lucky, Ohri's, Et-Si, Stellar Reserve, Chickpet Donne Biryani.
3. **Ramzan haleem tracker.** Haleem searches spike in Ramzan. A "Haleem 2027 tracker" page should go live 3 weeks before: which places have started serving (visitor-reported), updated daily. Reuse the dish-add flow with a date.
4. **Monthly r/hyderabad data post:** "What r/hyderabad recommended in {month}: data from N comments", linking the dish pages. It has to be genuinely useful and follow subreddit rules. It's the highest-leverage GEO move, because models learn from Reddit.
5. **"Ranked #1 on Hyderabad Eats" badges and share cards** for winners to post on Instagram, Google listings and their websites. These earn local backlinks.

## SEO / GEO
- **Weekly AI citation tracker:** a scheduled script asks ChatGPT and Perplexity (via API) the 20 prompts in `seo-geo-findings.md` and logs whether eats.mapmyhyd.com is cited and where. Needs API keys.
- **Markdown versions of pages** (`/ask/{slug}.md`, `/picks/{dish}.md`) for live-browsing AI agents.
- **More need pages once the evidence gate passes:** late night near HITEC City/Gachibowli, date under ₹1500, breakfast by area, Irani chai by area.
- **Trend history:** store monthly snapshots so dish pages can say "new this month" and "climbing".
- **Public dataset** (`/data/hyderabad-food-picks.json`, CC-BY) with Dataset schema.
- **Head-to-head preference mining:** "X better than Y" phrases are rare. Add Telugu/Hinglish patterns ("X kanna Y better", "X > Y") and sentiment within co-mention comments.
- **Instagram:** use the exact query phrase in the caption's first line and link the matching page. Poll questions become reel hooks and poll results become follow-up reels.

## Product
- Show "what to order" chips on map pins (long-press preview).
- Let people attach a photo to a dish add (moderated).
- Notify a visitor when the dish they added goes public (needs an identity layer).
- A per-branch signal: locals sometimes name a branch ("Shah Ghouse Tolichowki"). Credit the branch instead of the whole brand.
- An admin view for dish adds and polls (spot abuse, remove junk).

## Tech debt
- Remove the em-dashes in the site footer/FAQ (house rule).
- `CuratedExplorer.jsx` is unused. Delete it or mount it.
- The spot page (`/spot/[id]`) doesn't show the place card in some cases. Investigate.
- `recommendationDishes` writes a global summary doc in each transaction. Fine at today's volume; shard it if writes exceed about 1/sec.
