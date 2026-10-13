# Mapping HYD Eats: design direction v1

Read this before any UI work. It sets the look, the spacing, the components and
every loading/empty/error state. House rules in `CLAUDE.md` still apply (no
em-dashes in copy, no coloured side stripes on cards).

---

## 0. Why the app loses today (audit, Oct 2026)

Checked live at 375px on eats.mapmyhyd.com and in the code.

**First screen**
- A modal ("1 of 3, Explore 3,400+ spots") covers a dimmed grey map on first
  visit. The first thing a new visitor sees is a tutorial, not food.
- Five chrome layers stack on one phone screen: top bar, chip row, theme
  banner, map buttons, bottom sheet peek, 6-icon bottom nav. No single focal point.
- No food photo above the fold, even though we have hundreds in `public/photos`.
- Three different counts on one screen: "269 spots" (header), "3,400+ spots"
  (modal), "141 local picks" (sheet). Feels unreliable.
- Bottom nav is 6 unlabeled icons. Nobody knows what the passport or book icon does.

**Brand**
- Violet `#7c3aed` is the brand and people like it, but it sits next to five
  other accents, so it never owns a screen.
- The reels already have an approved, distinctive look (teal illustrated map,
  ticket cards, stickers). The app looks nothing like the reels, so a viewer
  who taps "link in bio" lands somewhere that feels like a different product.
- Palette sprawl: navy ink + blue + violet + orange + forest + 6 category colours.
- Map is the stock OSM raster (`tile.openstreetmap.org`), grey and busy. That
  server's usage policy also discourages production apps.

**Craft**
- 440+ `style={{}}` blocks in the top 10 components (DetailSheet 97,
  ThemeVoting 83, LeaderboardPanel 63, PassportPanel 46...). Tokens exist in
  `globals.css` but most radii/spacing are hardcoded (14px, 18px, 9px, 6px...).
- No spacing scale, no type scale. Every screen invents its own gaps.

**Loading / errors**
- Zero `loading.jsx` and zero `error.jsx` in `app/`. Tapping into a spot, area,
  ranking or offers page (all dynamic) freezes the old page until the server
  answers. On 4G that reads as "broken".
- In-app loading is the word "Loading…" in a few places.
- `app/not-found.jsx` renders **unstyled** (raw blue links): it uses `.site-*`
  classes but `site.css` is only imported by section layouts, not the root.
  Every stale Google link to a removed spot lands on this page.
- A spot id in `public/featured.json` (`ChIJVy0-aGiXyzsRWMiIWZ1fC30`) 404s on live.

**What the food-safety site got right:** one job, one screen, instantly clear,
easy to share. Clarity beat features. That is the bar for every screen below.

---

## 1. Direction: "Hyderabad Food Atlas"

**The app shares the reels' language** (illustrated map, tickets, stickers,
area tags) in a light, purple-led palette. The map is warm and light in the app;
the dark teal map stays for reels and share cards.

- **Structure (atlas):** the map and localities are the product. Selecting an
  area shows its food scene, counts and best picks, not a name-only popup.
- **Character (zine):** content pages (spot, area, rankings, stories) use one
  big real photo, a huge Bricolage headline, and a deliberately uneven layout.
- **Calm controls:** search, filters, vote and save stay boring, predictable
  and always in the same place. Expression lives in the content, not the controls.

What we do NOT do: bordered card grids, gradients, Japanese
motifs as decoration, fake data, 3D maps, scroll-triggered fade-ins on everything.

---

## 2. Tokens

Add to `:root` in `app/globals.css`. Violet stays the brand (users like it).
Old names stay as aliases during migration so nothing breaks.

### Colour

```css
/* App map: warm light. Chosen over teal because purple UI, category pins and
   daylight readability all win on a light ground. Same MapLibre layers as the
   reels (mapping-hyd-reels/src/PizzaMap.tsx), recoloured. */
--map-ground: #efe8dc;
--map-park:   #dfe5cc;
--map-water:  #cfe3ea;
--map-road:   #ffffff;
--map-label:  #7d7366;

/* Reels / share cards only (dark teal, approved for reels) */
--atlas:      #1d4744;

/* Surfaces */
--paper:    #f4f2ee;   /* page background */
--white:    #ffffff;   /* cards, sheets, nav */
--skeleton: #e7e3da;
--line:     #e3dfd6;   /* hairlines between rows */

/* Ink */
--ink:      #141414;
--ink-soft: #5a5a5a;   /* 6:1 on paper */

/* Brand + one accent */
--violet:      #7c3aed;  /* brand: the one button you press, active tab, vote. White text 5.7:1 */
--violet-deep: #5b21b6;  /* violet text on light backgrounds */
--violet-wash: #ede9fe;  /* chips, small arrow tiles */
--yellow:      #f5c84c;  /* celebration (colour v3). Ink text only */
```

Rules:
- Violet is for things you press and the active tab. Nothing else gets colour, except yellow.
- Colour v3, "fun with rules": yellow celebrates and ink is its partner.
  - Yellow: #1 / winner tickets (`.ticket`), the highlighter on vote headlines (`.hl`),
    sticker tiles (`.sticker-tile--sun`), the Rankings guide tile, arrow tiles on violet
    cards (vote card, passport), empty-state sticker tiles.
  - Ink: chips (`.ink-chip`: CROWNED, OPENING SOON), arrow tiles on yellow tickets, the
    Areas guide tile. **Never yellow text on black**: black carries white text, yellow carries black text.
  - Never yellow for warnings: food safety stays neutral (Notice is warm grey `#78716c`).
    Never yellow for plain utility (filter counts, retry buttons, focus rings).
- Violet gets big moments: full colour blocks (live vote card, passport), not just thin outlines.
- Category colours (`--cafe`, `--bakery`...) only on map pins and small badges. Never section backgrounds.
- A screen has at most one big colour block (violet or yellow).

### Type

Keep the fonts we already load (`app/fonts.js`), give each one job:

| Role | Font | Use |
|---|---|---|
| Display | Bricolage Grotesque 800 | titles, spot names, big numbers, logo. Tight: -0.04em, line-height 0.9 |
| UI / body | Space Grotesk | everything else: lists, labels, buttons, vote counts |

Replaces Fraunces, Outfit and Bagel in `app/fonts.js` (load both via `next/font/google`).

```css
--t-xs:  12px/16px;   /* meta, tags (uppercase, +0.06em) */
--t-sm:  14px/20px;   /* secondary text, chips */
--t-md:  16px/24px;   /* body. Never smaller for paragraphs */
--t-lg:  20px/26px;   /* card titles */
--t-xl:  28px/1;      /* section titles */
--t-2xl: 52px/0.9;    /* page title, mobile */
--t-3xl: clamp(52px, 7vw, 96px)/0.9;  /* hero title, desktop */
```
Vote counts and ranks: `font-variant-numeric: tabular-nums`.

### Space (4px base)

```css
--s1: 4px;  --s2: 8px;  --s3: 12px; --s4: 16px;
--s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px; --s9: 96px;
--gutter: 20px;          /* 32px >= 768px, 56px >= 1200px */
--section: var(--s7);    /* gap between sections: 48 mobile, 80 desktop */
--tap: 44px;             /* minimum touch target */
```
Rules: only these values for margin, padding and gap. Inside a card `--s4`.
Between related items `--s2`/`--s3`. Between sections `--section`. More white
space between groups than within them, always.

### Shape and depth

```css
--r-chip: 999px;  /* chips, tags, search */
--r-btn: 18px;    /* buttons, arrow tiles, thumbnails */
--r-card: 24px;   /* cards, photos, colour blocks */
--r-sheet: 28px;  /* sheets, big blocks */
```
Retire `--r-xs`, `--r-lg`, `--r-xl` and every hardcoded radius.
- On the map: floating things use `--e2` shadow.
- On pages: no borders round cards. White or colour blocks on paper, 1px
  hairlines between list rows. Space does the grouping.
- Tickets get a perforated notch instead of a bigger radius.

### Motion

```css
--dur-1: 120ms;  /* press feedback */
--dur-2: 200ms;  /* chips, toggles, fades */
--dur-3: 320ms;  /* sheets, panels */
--ease-out: cubic-bezier(.2, .8, .2, 1);
```
Animate relationships only: sheet opening from the pin you tapped, ticket
dropping in when a rank is revealed, vote count ticking up. Everything respects
`prefers-reduced-motion` (swap movement for a 120ms fade).

---

## 3. Signature components

Build these once in `app/components/atlas/` and reuse. They are the brand.

1. **Ticket** (from the reels). Yellow block for #1, white for the rest, rank
   and vote count in big Bricolage, real dish photo, spot name, area tag. Used in
   rankings, race, map selection peek, spot page rank, share cards.
2. **Area tag.** Pill with a 1.5px ink outline, uppercase `--t-xs` text with
   wide spacing: `JUBILEE HILLS`. Every locality mention uses it.
2b. **Arrow-tile button.** A label button plus a separate square arrow tile
   (white on violet, violet-wash on paper). Used for "open this" actions.
   The one yellow tile is the vote card's arrow, because it opens a vote.
3. **Sticker.** Die-cut category stickers (chai glass, biryani handi, coffee
   cup, beer mug, ice cream, cake). Used for: top-pick map pins, empty states,
   error states. Not as random decoration.
4. **Vote meter.** Count, gap to #1, and the debate line ("4 votes flips the
   crown"). Tabular numbers. Uses real data only.
5. **Atlas map.** MapLibre base restyled exactly like the reels (OpenFreeMap
   liberty, recoloured with the `--map-*` tokens). Pins: category-colour dot with a
   white ring; top 3 of
   the live theme render as mini tickets.

---

## 4a. One home for every option (the core fix)

Today the phone home has 28 tappable things and 18 sheets behind them, with
the same feature in up to three places. New rule: **every option lives in
exactly one place.** First screen drops to 14 taps.

| Tab | Job | What lives here |
|---|---|---|
| Map | find somewhere to eat | search (dish, place, area), Filters sheet, 5 chips (Local, Restaurants, Cafes, Bars, Desserts), Find me, this-week vote card in the sheet, local favourites strip |
| Vote | pick this week's best | this week's vote, last week's winner + results, past winners, suggest a theme |
| Guides | read before you go | dish guides (best biryani, cafes...), areas, dining deals, food safety, stories |
| You | your stuff | Saved / Passport / Route switcher at the top (route planner lives here), sticker book, leaderboard, add a place, get the app |

Inside the spot sheet: Directions (primary), Save, Share, I ate here, Add a dish.

Removed or merged:
- First-visit pop-up (the hook moves into the sheet)
- Vote banner over the map (becomes the card in the sheet)
- Trophy in the top bar (Vote tab), Race tab (renamed Vote)
- Recommended / All / Local Eats chips (map shows local favourites first, no toggle)
- Dish menu chip + "Dish guides" link (dishes go in search, guides in Guides)
- Bakery + Ice Cream chips (merged into Desserts)
- Route tab (now You > Route; Directions stays on every spot), Stories tab (Guides)
- Install prompt on first visit (show from 2nd visit, also in You)
- Desktop header: 13 links become Map · Vote · Guides · You + search. SEO
  links stay in the footer crawl nav.

Rules: one purple button per screen, max 5 chips, every tab labelled, anything
game-like lives in You.

## 4. Screens

### Home / map, mobile (the first impression)
- **No onboarding modal.** The hook goes in the sheet instead (same as the reel
  opening): "This week: Best ice cream in Hyderabad · 26 votes · Vote".
- **Three layers max:** one top row (logo mark + search pill + filter button),
  the atlas map, one bottom sheet. Chips move inside search/filter. Theme banner
  moves into the sheet.
- **Sheet peek** shows a horizontal strip of real food photos (local picks),
  not just a count.
- **Bottom nav: 4 labeled tabs:** Map · Vote · Guides · You. Route planner
  moves into the spot sheet as "Directions". Full map of where every option
  goes is in section 4a.
- **One count, one source.** Header, sheet and copy read the same number.

### Home / map, desktop (>= 1024px)
Map left, 420px context panel right. Panel shows the selected area or spot, or
the live vote when nothing is selected. Not a stretched phone layout.

### Spot page (`/spot/[id]`, where Google traffic lands)
Full-bleed 4:3 real photo, name in `--t-2xl` Bricolage, area tag, ticket
if it ranks in any theme, "Must order" list, mini atlas map, community votes.
Sticky bottom bar: `Directions` (violet) + Save + Share. One focal point: the photo.

### Area page (`/areas/[slug]`)
Atlas band header with the locality highlighted, real counts ("86 spots ·
12 cafes · 9 biryani"). Then an uneven strip: 1 large pick + 2 small. Then
category lists. This is the Go-KINJO idea: the neighbourhood is the interface.

### Rankings / race
Ticket stack: #1 large yellow block with photo, #2 to #10 compact tickets.
Live vote meter at top. Share button on each ticket.

### Food safety
Atlas map of inspected spots with stamp-style status (inspected date, action
taken), list below linking into spot pages. Same one-job clarity as the site
that beat us, plus the link into our food data.

---

## 5. Loading, empty and error states

### Principles
1. **Never blank, never a spinner for page loads.** Skeletons match the final
   layout box for box, so nothing jumps when data arrives (CLS < 0.05).
2. **Don't flash.** Skeletons fade in after 150ms. Fast loads show nothing.
3. **Show what you already know.** If the URL has the area or dish name, render
   the real heading instantly and skeleton only the data.
4. **Shimmer is quiet.** One soft light sweep on `--paper`, 1.6s. Off under
   reduced motion (static blocks).
5. **Optimistic actions.** Vote and save update instantly; roll back with a
   toast if the request fails.

### Skeleton primitives (`app/components/Skeleton.jsx` + `globals.css`)

```jsx
<Sk.Block ratio="4/3" />   // photo
<Sk.Line w="60%" size="2xl" />  // heading at the real type size
<Sk.Line w="40%" />
<Sk.Tag />                 // area tag
<Sk.Ticket big />          // ranking ticket
<Sk.Row />                 // list row: thumb + 2 lines
```

```css
.sk { background: var(--skeleton); border-radius: var(--r-card); position: relative;
      overflow: hidden; opacity: 0; animation: sk-in var(--dur-2) var(--ease-out) 150ms forwards; }
.sk::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
      animation: sk-sweep 1.6s ease-in-out infinite; }
@keyframes sk-in { to { opacity: 1; } }
@keyframes sk-sweep { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .sk::after { display: none; } }
```

### Route `loading.jsx` files to add

| Route | Skeleton |
|---|---|
| `spot/[id]` | 4:3 photo, title line, tag, ticket, 3 rows, map block |
| `areas/[slug]` | atlas band with real area name from slug, count row, 1 big + 2 small blocks |
| `areas/[slug]/[category]` | real heading, 6 rows |
| `rankings`, `rankings/[slug]` | meter line, big ticket, 4 compact tickets |
| `race/this-week` | same as rankings |
| `offers` | 6 rows with thumbs |
| `food-safety` | map block, 6 rows |
| `picks/[dish]`, `picks/[dish]/[area]`, `explore/[category]`, `ask/[slug]` | real heading, 1 big block, 5 rows |

### Route `error.jsx` files to add
Same routes. White card, a sticker (spilled chai), "Couldn't load this right
now." and a `Try again` button wired to `reset()`. Plus a link back to the map.

### `not-found.jsx`
Import `site.css` so it is styled. Sticker + "This spot moved or closed." +
search box + 4 tickets of popular spots. Treat it as a landing page, because
Google sends people there.

### In-app states (map and sheets)
- **Map cold start:** container background is `--map-ground`, so first paint is
  the map colour, never grey. Two white clouds part when the map `load` event
  fires (the reel hook). Max 700ms, first visit per session only, skipped under
  reduced motion. Never blocks interaction.
- **Tiles fail:** keep the map ground, show a small card "Map is offline. Your
  saved spots still work." with retry. (Hook into existing `errorRef` in `MapCanvas`.)
- **Detail sheet loading:** sheet opens instantly with name + photo from the
  pin data already in memory; skeleton only the details. Replace "Loading…".
- **Search:** results skeleton rows after 150ms; no-result state suggests the
  nearest area or dish match.
- **Photos:** fixed aspect-ratio box on `--paper`, fade to the image on load
  (200ms). No layout shift.
- **Vote:** count +1 instantly, ticket gets a "VOTED" rubber-stamp (rotate -6deg,
  scale 1.15 to 1, 200ms). Roll back + toast on failure.
- **Empty states** (saved, passport, search): sticker + one sentence + one
  button. Example: "Nothing saved yet. Tap the bookmark on any spot." `Open map`.

---

## 6. Rollout (in order, each phase ships on its own)

**Phase 0, fixes (half a day).** Style `not-found.jsx`. One spot count from one
source. Remove the first-visit modal, move the hook into the sheet. Check the
404ing `featured.json` id.

**Phase 1, tokens + fonts (1 day).** Add the tokens above. Swap fonts to
Bricolage Grotesque + Space Grotesk, ink to #141414, page to #f4f2ee. Violet
stays. Instant new feel with no layout risk.

**Phase 2, loading system (1 day).** `Skeleton.jsx`, all `loading.jsx` and
`error.jsx` files, photo placeholders, optimistic vote.

**Phase 3, atlas map (2 days).** MapLibre restyle via
`@maplibre/maplibre-gl-leaflet` (already a dependency) so Leaflet markers and
clusters keep working. Fallback to raster if WebGL fails. Test on a mid-range
Android before shipping. New pins. First-screen layout (3 layers, 4-tab nav).

**Phase 4, signature components (2 days).** Ticket, area tag, arrow-tile button, sticker,
vote meter. Apply to rankings and race first, then the map peek.

**Phase 5, editorial pages (2 to 3 days).** Spot page, area page, desktop
split layout.

**Phase 6, ongoing.** Move inline styles to classes in files as they get
touched (DetailSheet, ThemeVoting, LeaderboardPanel first). No big-bang rewrite.

### Done means
- Before/after screenshots at 375px and 1280px for every changed screen.
- One focal point per viewport; nothing smaller than 16px for body text; every
  tap target >= 44px; visible focus ring; reduced motion respected.
- No fake data, no invented counts, no em-dashes in copy.
- Existing routes, votes, saves, filters and SEO pages still work.

---

## 7. Status (branch `redesign-atlas`, Oct 2026)

Done:
- Tokens, Bricolage Grotesque + Space Grotesk (local woff2), violet kept, film grain removed.
- First-visit Onboarding and ThemeIntro pop-ups removed; root 404 styled.
- Skeleton `loading.jsx` on every dynamic site route; root `error.jsx` card.
- Bottom nav Map / Vote / Guides / You; search-first top bar; site header Map / Vote / Guides; `/guides` hub.
- Chips: Local, Restaurants, Cafes, Bars, Desserts (bakery + ice cream). Nearby, dish, open now, vibes, every-spot toggle live in Filters.
- Live vote card (purple, question hook, yellow arrow tile).
- Light vector basemap via MapLibre inside Leaflet. MapLibre 6 needs its worker served from
  `public/vendor/maplibre/<version>/` (copy `maplibre-gl-worker.mjs` + `maplibre-gl-shared.mjs`
  from node_modules on upgrade). Falls back to OSM raster. First-open clouds part on load.
- Site pages: borderless white cards, big display titles, 52px buttons, #1 ranking as the yellow ticket.
- Spot page order (CSS only): consensus first, review + photos, "Ate here? Claim" last.
- Map spot sheet: "I ate here" is the one purple button.
- Share cards use the new fonts and palette (CI redraws them on deploy).
- Optimistic theme vote with a stamp press; Saved empty state (sticker, sentence, Open the map).

Also done (second pass):
- Spot page JSX: photo first, Directions / Share / Open on map, consensus, review, claim card last.
- You tab: one row Saved / Passport / Stickers / Route (no tabs inside tabs); Saved list and Passport restyled.
- DetailSheet, ThemeVoting, LeaderboardPanel and the other components on tokens; secondaryBtn is `.sheet-btn`.
- Desktop (>= 1024px): left nav rail, capped search bar; site pages rely on the header nav.
- Area pages: count chips and a 1 big + 2 small photo strip.
- Em-dashes removed from our own copy (share titles, verdicts, placeholders). Quoted Reddit text is left as written.

Third pass (mockup match):
- Map tab: E tile, search pill, sliders Filters and white chips float over the map; search only on Map.
- Site pages: light header with big black titles; You hub page; Vote tab and /rankings rebuilt around an every-ranking index with live #1, votes and a Vote state; debate line.
- Spot sheet: Directions + Save + Share footer, I ate here as a quiet row.
- Live vote top 3 as tickets on the map; Map is offline card; soft photo placeholders.

Still to do:
- Measure MapLibre on a real mid-range Android phone (bundle loads lazily after the map shell; 8s raster fallback).
- Remaining one-off inline layout styles in the big components can move to classes as those files are touched.

---

## 8. Sticker art (isometric, die-cut)

Files go in `public/stickers/<name>.webp` (512x512, transparent; .png also works).
After adding a file, add its key to `STICKER_KEYS` in `lib/stickerArt.js` so the
Vote tab, the map vote card and /rankings can use it (Guides checks the disk).
AI exports often bake a fake grey checkerboard in; it has to be cut out first.
Any card with a matching file shows it on the next build; without one it
falls back to a soft tinted card with the dish word.

**Master prompt** (replace {SUBJECT}; keep everything else identical):

> Isometric 3D sticker illustration of {SUBJECT}. Soft clay-like 3D render,
> rounded chunky shapes, 30-degree isometric angle, centred, one object group,
> thick clean white die-cut border around the silhouette, soft drop shadow,
> transparent background. Warm light from top-left. Appetising natural food
> colours with small accents of violet #7C3AED and saffron yellow #F5C84C,
> cream #F4F2EE highlights, minimal dark outlines. No text, no letters, no
> logos, no people, no background scene. Square 1:1, 1024x1024 PNG.

Make the first one, keep it as the style reference, and generate the rest
against it so all stickers match.

| File | Subject |
|---|---|
| biryani.png | a copper handi of Hyderabadi dum biryani, lid half open with its dough seal, saffron and white rice, a piece of mutton on top, steam swirls |
| haleem.png | a clay bowl of Hyderabadi haleem topped with fried onions, mint leaves and a lemon wedge |
| irani-chai.png | a small glass of Irani chai on a saucer with two Osmania biscuits |
| dosa.png | a crisp golden ghee dosa rolled on a steel plate with coconut chutney and a cup of sambar |
| mandi.png | a mandi platter, a mound of rice with a roast chicken quarter and a small bowl of salan |
| shawarma.png | a chicken shawarma roll in paper, cut open to show the filling |
| coffee.png | a ceramic latte cup with heart latte art on a saucer, a few coffee beans |
| bakery.png | a stack of Karachi-style fruit biscuits next to a flaky puff and a small cake slice |
| ice-cream.png | a waffle cone with two scoops and a stick of kulfi beside it |
| beer.png | a frothy pint of craft beer with a small bowl of masala peanuts |
| street-food.png | a plate of pani puri with a small cup of spiced water |
| fine-dining.png | a silver cloche lifted over a plated dish with a sprig of garnish |
| thali.png | a round steel thali with small bowls of dal, curry, rice, roti and a sweet |
| breakfast.png | a steel plate of idli and medu vada with two chutneys |
| late-night.png | a crescent moon resting on a plate of biryani beside a small steaming tea glass |
| lunchbox.png | a stacked steel tiffin carrier (dabba) with a spoon |
| trophy.png | a small golden trophy cup tied with a violet ribbon |
| map-pin.png | a violet map pin standing on a tiny isometric street block |
| deals.png | a violet coupon ticket with a perforated edge and a yellow badge showing a percent symbol |
| food-safety.png | a white plate with a green shield and check mark rising above it |
| stories.png | an open old book with a small Irani chai glass resting on it |
| area-jubilee-hills.png | a rocky hill with a peacock and a small cafe table |
| area-banjara-hills.png | Deccan granite boulders balanced on each other with a rooftop cafe umbrella |
| area-kukatpally.png | an elevated metro train on a pillar over a busy street |
| area-gachibowli.png | two glass IT towers with a small stadium bowl beside them |
| area-begumpet.png | a vintage propeller airplane on a short runway |
| area-kompally.png | a roadside food court by a lake |
| area-himayatnagar.png | a busy market street corner with a tea stall and shop awnings |
| area-madhapur-hitec.png | the Cyber Towers dome building of HITEC City |

## 9. Page template (colour v3), Oct 2026

Pages, ranked by how often people land on them, and what each uses:

1. **Spot pages**: ticket (`.sp-ticket`, yellow for #1), stat tiles (1st yellow, 2nd ink), facts list, map, sticky action bar.
2. **Long-form guides** (`/guides/best-*`): `GuideSpotCard` (#1 yellow rank tile + yellow ring, others ink tiles with yellow numbers; tag as `.ink-chip`; "Must order" highlighted; quote on ink with a yellow quote mark; `.link-chip` to the map). Byline: ink chip + link chip. Quick picks: 1st tile yellow, 2nd ink, rest white.
3. **Ranking pages**: question headline with `.hl`, yellow `.ticket` for #1, numbered photo rows, ballot grid apart.
4. **Area pages**: ink chip for the selected filter, yellow vote badges.
5. **Food safety**: ink only (tracker label, drive dates, headline stat). No yellow anywhere: warnings are not celebrations.
6. **Stories**: white featured card, ink `FEATURED` chip with yellow text, highlighted "Order the …".
7. **Hubs** (Guides, Rankings, Areas, Deals): answer-first subtitle, stat chips (yellow, ink, violet).

Shared rules:
- Every page below a tab has the round back button (`backFallback`).
- No underlined links: inline links are bold violet, standalone ones `.link-chip`.
- Cards are white on cream, never the grey `--paper` well.
