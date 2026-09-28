import fs from "fs";
import path from "path";
import { getAllRankingsThemes } from "../lib/themesServer.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../lib/rankings.js";
import { allAreaPages, allCategoryPages, getEditorialSpotIds, spotSlug, getEateryById, getEateries } from "../lib/siteData.js";
import { getSiteUrl } from "../lib/site.js";

export const dynamic = "force-dynamic";

// Source folders are not in the Vercel function bundle, so reading app/guides at runtime
// returned [] and every guide was missing from the live sitemap. Keep the list explicit
// (add new guides here); the fs read only adds any extra folder found in local builds.
const GUIDE_SLUGS = [
  "best-biryani-hyderabad-reddit",
  "best-cafes-hyderabad-reddit",
  "best-ice-cream-desserts-hyderabad",
  "best-tiffins-hyderabad-reddit",
  "late-night-food-hyderabad-reddit",
  "restaurants-in-sattva-knowledge-city-hyderabad",
];
function getGuideSlugs() {
  let found = [];
  try {
    const guidesDir = path.join(process.cwd(), "app", "guides");
    found = fs.readdirSync(guidesDir).filter((f) => fs.statSync(path.join(guidesDir, f)).isDirectory());
  } catch {}
  return [...new Set([...GUIDE_SLUGS, ...found])];
}

// Spot pages are where most impressions come from (people searching a restaurant by name).
// List editorial spots plus the curated core list; non-core spot pages are noindexed.

/**
 * Hub-first sitemap: hubs, rankings, guides, areas, categories, then editorial and core spots.
 */
export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const MONEY_RANKINGS = new Set([
    "best-buffet-in-hyderabad",
    "best-fine-dining-in-hyderabad",
    "best-biryani-in-hyderabad",
    "best-mandi-in-hyderabad",
    "best-haleem-in-hyderabad",
    "best-cafe-in-hyderabad",
    "best-breakfast-places-in-hyderabad",
    "best-irani-cafe-in-hyderabad",
  ]);
  const MONEY_AREAS = new Set([
    "jubilee-hills",
    "gachibowli",
    "kondapur",
    "madhapur-hitec",
    "banjara-hills",
    "secunderabad",
  ]);

  const staticUrls = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/rankings`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${siteUrl}/rankings/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteUrl}/stories`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/food-safety`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/offers`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/explore`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/areas`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...getGuideSlugs().map((slug) => ({
      url: `${siteUrl}/guides/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    })),
    ...SEO_THEME_PICKS.map((p) => {
      const slug = slugFromTitle(p.title);
      return {
        url: `${siteUrl}/rankings/${slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: MONEY_RANKINGS.has(slug) ? 0.95 : 0.8,
      };
    }),
  ];

  let themes = [];
  let exploreUrls = [];
  let areaUrls = [];
  let spotUrls = [];

  try {
    themes = await getAllRankingsThemes(50);
  } catch {}
  try {
    exploreUrls = allCategoryPages().map((c) => ({
      url: `${siteUrl}/explore/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {}
  try {
    areaUrls = allAreaPages().map((a) => ({
      url: `${siteUrl}/areas/${a.slug}`,
      lastModified: now,
      changeFrequency: MONEY_AREAS.has(a.slug) ? "weekly" : "monthly",
      priority: MONEY_AREAS.has(a.slug) ? 0.9 : 0.75,
    }));
  } catch {}
  try {
    const editorial = getEditorialSpotIds().map((id) => getEateryById(id)).filter(Boolean);
    const popular = getEateries().filter((e) => e.core); // curated core list (lib/coreSpots.js)
    spotUrls = [
      ...editorial.map((e) => ({ url: `${siteUrl}/spot/${spotSlug(e)}`, lastModified: now, changeFrequency: "weekly", priority: 0.85 })),
      ...popular.map((e) => ({ url: `${siteUrl}/spot/${spotSlug(e)}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 })),
    ];
  } catch {}

  const themeSlugs = new Set(themes.map((t) => t.slug));
  const themeUrls = themes.map((t) => ({
    url: `${siteUrl}/rankings/${t.slug}`,
    lastModified: t.createdAt ? new Date(t.createdAt) : now,
    changeFrequency: t.active ? "daily" : "weekly",
    priority: MONEY_RANKINGS.has(t.slug) ? 0.95 : t.active ? 0.9 : 0.75,
  }));

  const seen = new Set();
  return [
    ...staticUrls.filter((u) => !themeSlugs.has(u.url.split("/rankings/")[1])),
    ...themeUrls,
    ...exploreUrls,
    ...areaUrls,
    ...spotUrls,
  ].filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}
