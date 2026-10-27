import fs from "fs";
import path from "path";
import { getAllRankingsThemes, qualifiedAreaRankings } from "../lib/themesServer.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../lib/rankings.js";
import { getIndexableSpotIds } from "../lib/spotContent.js";
import { allAreaPages, allCategoryPages, allAreaCategoryCombinations, getEditorialSpotIds, spotSlug, getEateryById, getEateries } from "../lib/siteData.js";
import { getSiteUrl } from "../lib/site.js";
import { askPages } from "../lib/askPages.js";
import { recommendationsEnabled } from "../lib/recommendationShared.js";
import { GEO_GUIDE_SLUGS } from "../lib/geoGuides.js";
import { qualifiedOfferAreas, qualifiedOfferViews } from "../lib/offerPageData.js";

export const dynamic = "force-dynamic";

// Source folders are not in the Vercel function bundle, so reading app/guides at runtime
// returned [] and every guide was missing from the live sitemap. Keep the list explicit
// (add new guides here); the fs read only adds any extra folder found in local builds.
const GUIDE_SLUGS = [
  "best-breweries-in-hyderabad",
  "best-biryani-hyderabad-reddit",
  "best-cafes-hyderabad-reddit",
  "best-ice-cream-desserts-hyderabad",
  "best-tiffins-hyderabad-reddit",
  "late-night-food-hyderabad-reddit",
  "restaurants-in-sattva-knowledge-city-hyderabad",
  "dishes", // dish guides hub
  ...GEO_GUIDE_SLUGS,
];
function getGuideSlugs() {
  let found = [];
  try {
    const guidesDir = path.join(process.cwd(), "app", "guides");
    found = fs.readdirSync(guidesDir).filter((f) => !f.startsWith("[") && fs.statSync(path.join(guidesDir, f)).isDirectory());
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

  const MONEY_RANKINGS = new Set([
    "best-brewery-in-hyderabad",
    "best-breweries-in-hyderabad",
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
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/rankings`, changeFrequency: "daily", priority: 0.95 },
    { url: `${siteUrl}/rankings/how-it-works`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteUrl}/stories`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/food-safety`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/offers`, changeFrequency: "daily", priority: 0.9 },
    ...qualifiedOfferViews().map((view) => ({ url: `${siteUrl}/offers/${view}`, changeFrequency: "daily", priority: 0.85 })),
    ...qualifiedOfferAreas().map(({ slug }) => ({ url: `${siteUrl}/offers/in/${slug}`, changeFrequency: "daily", priority: 0.8 })),
    { url: `${siteUrl}/about`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/explore`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/guides`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/areas`, changeFrequency: "weekly", priority: 0.9 },
    ...getGuideSlugs().map((slug) => ({
      url: `${siteUrl}/guides/${slug}`,
      changeFrequency: "monthly",
      priority: 0.85,
    })),
    ...SEO_THEME_PICKS.map((p) => {
      const slug = slugFromTitle(p.title);
      return {
        url: `${siteUrl}/rankings/${slug}`,
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
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {}
  let areaCategoryUrls = [];
  try {
    areaCategoryUrls = allAreaCategoryCombinations().map((c) => ({
      url: `${siteUrl}/areas/${c.areaSlug}/${c.categorySlug}`,
      changeFrequency: "weekly",
      priority: 0.85,
    }));
  } catch {}
  try {
    areaUrls = allAreaPages().map((a) => ({
      url: `${siteUrl}/areas/${a.slug}`,
      changeFrequency: MONEY_AREAS.has(a.slug) ? "weekly" : "monthly",
      priority: MONEY_AREAS.has(a.slug) ? 0.9 : 0.75,
    }));
  } catch {}
  try {
    const editorial = getEditorialSpotIds().map((id) => getEateryById(id)).filter(Boolean);
    // Only spots with something real to say (lib/spotContent.js); basics-only
    // pages are noindexed, so listing them here would just waste crawl budget.
    const indexable = await getIndexableSpotIds();
    const editorialIds = new Set(editorial.map((e) => e.id));
    const popular = getEateries().filter((e) => indexable.has(e.id) && !editorialIds.has(e.id));
    spotUrls = [
      ...editorial.map((e) => ({ url: `${siteUrl}/spot/${spotSlug(e)}`, changeFrequency: "weekly", priority: 0.85 })),
      ...popular.map((e) => ({ url: `${siteUrl}/spot/${spotSlug(e)}`, changeFrequency: "monthly", priority: 0.6 })),
    ];
  } catch {}

  const themeSlugs = new Set(themes.map((t) => t.slug));
  const themeUrls = themes.map((t) => ({
    url: `${siteUrl}/rankings/${t.slug}`,
    ...((t.updatedAt || t.createdAt) ? { lastModified: new Date(t.updatedAt || t.createdAt) } : {}),
    changeFrequency: t.active ? "daily" : "weekly",
    priority: MONEY_RANKINGS.has(t.slug) ? 0.95 : t.active ? 0.9 : 0.75,
  }));
  const areaRankingUrls = qualifiedAreaRankings(themes).map((item) => ({
    url: `${siteUrl}/rankings/${item.slug}/in/${item.areaSlug}`,
    changeFrequency: "weekly",
    priority: MONEY_RANKINGS.has(item.slug) ? 0.9 : 0.8,
  }));

  const seen = new Set();
  return [
    ...staticUrls.filter((u) => !themeSlugs.has(u.url.split("/rankings/")[1])),
    ...themeUrls,
    ...areaRankingUrls,
    ...exploreUrls,
    ...areaUrls,
    ...areaCategoryUrls,
    ...spotUrls,
    ...(recommendationsEnabled() ? [
      { url: `${siteUrl}/ask`, changeFrequency: "weekly", priority: 0.85 },
      ...askPages().map((p) => ({ url: `${siteUrl}/ask/${p.slug}`, changeFrequency: "weekly", priority: 0.85 })),
      { url: `${siteUrl}/about/how-we-pick`, changeFrequency: "monthly", priority: 0.6 },
    ] : []),
  ].filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}
