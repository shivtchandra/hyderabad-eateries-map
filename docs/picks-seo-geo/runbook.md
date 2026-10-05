# Runbook

## Launch checklist
1. Merge the branch to `master`.
2. In Vercel production, set `NEXT_PUBLIC_CURATED_RECOMMENDATIONS=1` and redeploy. It's a build-time flag.
3. Set `RECOMMENDATION_COOKIE_SECRET` in Vercel. Without it, voting falls back to the Firebase private key.
4. Set a GitHub repo **variable** (not a secret) `NEXT_PUBLIC_CURATED_RECOMMENDATIONS=1` so the weekly IndexNow step includes `/ask` and dish pages.
5. After the deploy: `node scripts/submit-indexnow.mjs --hubs` once by hand.
6. In Bing Webmaster Tools, resubmit `sitemap.xml`. Check that `/ask/*` and `/picks/*` get crawled within a week.
7. Re-run the prompt list in `seo-geo-findings.md` 2 to 4 weeks after launch, and note any citations of eats.mapmyhyd.com.

## Weekly pipeline (automatic)
`.github/workflows/reddit-picks.yml`, Monday 03:00 IST. It needs the repo secrets `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`.
- `reddit-collect.mjs` writes `data/reddit/raw.json` (gitignored).
- `reddit-picks.mjs`, `reddit-questions.mjs`, `reddit-missing-places.mjs` and `build-llms.mjs`, followed by a commit, which triggers the Vercel deploy.
- It sleeps 7 minutes, then runs `submit-indexnow.mjs --hubs`.

## Manual jobs
- Review `data/reddit-missing-places.json` monthly and add the real places through admin (Maks Kitchen, Santosh Dhaba, Kakatiya Mess…).
- Review the admin places queue for "★ Picks nomination" and use "Approve as Pick".
- When a shortlist brand looks wrong, edit `data/recommendation-shortlist.json` (set `status`, add a `note`).
- A new false-positive name goes in `NOT_NAMES` in `scripts/lib/redditMatch.mjs`, then rerun the scripts.

## Local preview
- `.claude/launch.json` has a config called `eats-curated`. It runs `next dev` on :3001 with the flag on and `NEXT_DIST_DIR=.next-curated`.
- `node --no-warnings --test tests/recommendations.test.mjs`
- Builds: `NEXT_PUBLIC_CURATED_RECOMMENDATIONS=1 NEXT_DIST_DIR=.next-check npx next build` (and again with `=0`).

## Gotchas
- The local dev server writes to **live Firestore** (dish adds, votes, polls). Don't test writes casually.
- `data/reddit/raw.json` is gitignored. Anything a page needs must be precomputed into a committed data file.
- New runtime data files must be added to `CURATED_DATA` in `next.config.mjs` (file tracing).
- The existing site footer and FAQ still contain em-dashes (pre-existing; against the house rule).
