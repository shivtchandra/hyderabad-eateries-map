# Decisions

## Recommended list
- **Shortlist grows from data, gated by a human read.** 39 brands were added from r/hyderabad (score 9+), each checked against sample comments. Rejected:
  - places locals mostly warn about (Kritunga, Satti Babu, KS Bakers, 45th Avenue);
  - names where locals mean a different place (Harsha Mess, Sai Ram Mess, Mayur Pan House, Smokey Dockey, Rayalaseema Spice).
- **Same-name strangers are excluded** (other "Bahar" cafes, Grand 4 Seasons, Zam Zam Irani Chai). Branch lists come from the shortlist where it exists.
- **Tansen dropped:** most of its matches were about the singer.
- **Ranked places count as Recommended:** each ranking's winner, plus its top 3 with 2+ votes (`RANK_MIN_VOTES`). Watch places that get in on only 2 votes; raise the minimum if it looks too easy.
- **Visitor suggestions** become Recommended only after an admin clicks "Approve as Pick".

## Matching (scripts/lib/redditMatch.mjs)
- Count people, not comments. Bots, deleted accounts and promo text don't count.
- `NOT_NAMES` blocks Telugu/Hinglish chat words and colliding names: okati, anthe, chinna, aunty, girlfriend, bharat, chaitanya and others.
- `offTopic()` skips movie/song context ("Paradise movie") and landmarks ("Paradise circle", "near Paradise metro").

## Map UX (mobile first)
- **One filter row:** Recommended · All · Dish ▾ · categories · Filters (icon only). The user rejected a second row of mode chips.
- **Dish dropdown:** a compact 220px list anchored to the button, with counts, a check mark on the selected dish, and no emojis. The user rejected a full-screen grid and emojis.
- **Swipe-up list:** collapses to a slim 52px bar ("★ N local picks · See list"). The earlier 128px peek with a half-visible row was rejected as clutter.
- **"This week" banner:** closable per ranking, remembered per device.

## Place card (Product Hunt style)
- Upvote box (▲ N): r/hyderabad locals + site upvotes + nominations + ranking votes.
- A tagline ("Loved for biryani and pulao") and a ranked "What to order" list with a ▲ on each dish.
- An "Add a dish you loved" row and links to the place's `/ask` pages.
- No disclaimers on the card. Method details live on `/about/how-we-pick`.
- The card sits right under the place name, and the photo banner shrinks to 112px, so it's seen without scrolling.

## Community
- **People can add a must-try dish, or +1 one.** A dish goes public once **2 different browsers** add it. Before that only the person who added it sees it, marked pending.
- **Limits:** 20 adds a day and 30 a minute per browser. At most 30 dishes per place.
- **People can suggest a place** for Recommended (name, area, what to try). An admin approves it.
- **Polls on question pages:** one switchable vote per browser. Percentages show from 20 votes.

## SEO / GEO
- **Recommended only adds indexed pages, never removes them.** Spot pages are indexed if `core || recommended`. This fixed a launch bug that would have noindexed about 3,050 pages.
- **Question pages (`/ask`), about 40, evidence-gated.** All copy is templates filled with counts, with no AI text. Quotes are 160 characters or less, link to the comment, and never show a username.
- **"Right now" dish pages** carry the month in the title. Dish + area pages exist only where 3+ brands have a branch in the area.
- **No ISR or Vercel cache** (plan limits). Pages are static and refreshed by the weekly data commit's deploy. Runtime data uses in-memory memos of 60s to 5min.
- **`llms.txt` is generated** with dated, numeric, linked answers, because those are what AI engines quote.
- **Measure AI traffic:** the referrer `ai` source covers chatgpt.com, perplexity.ai, gemini, copilot and claude.ai.

## House rules (CLAUDE.md)
- No em-dashes in user-facing copy.
- No coloured side stripes on cards.
