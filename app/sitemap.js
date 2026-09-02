import { getAllRankingsThemes } from "../lib/themesServer.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../lib/rankings.js";
import { allAreaPages, allCategoryPages, getEateries } from "../lib/siteData.js";
import { getSiteUrl } from "../lib/site.js";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticUrls = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/rankings`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${siteUrl}/rankings/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteUrl}/explore`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/areas`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...SEO_THEME_PICKS.map((p) => ({
      url: `${siteUrl}/rankings/${slugFromTitle(p.title)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  ];

  let themes = [];
  let exploreUrls = [];
  let areaUrls = [];
  let spotUrls = [];

  try { themes = await getAllRankingsThemes(50); } catch {}
  try { exploreUrls = allCategoryPages().map((c) => ({ url: `${siteUrl}/explore/${c.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 })); } catch {}
  try {
    const HIGH_PRIORITY_AREAS = ["gachibowli", "jubilee-hills", "banjara-hills", "madhapur-hitec"];
    areaUrls = allAreaPages().map((a) => ({
      url: `${siteUrl}/areas/${a.slug}`,
      lastModified: now,
      changeFrequency: HIGH_PRIORITY_AREAS.includes(a.slug) ? "weekly" : "monthly",
      priority: HIGH_PRIORITY_AREAS.includes(a.slug) ? 0.85 : 0.75,
    }));
  } catch {}
  try {
    spotUrls = getEateries()
      .filter((e) => (e.ratingCount || 0) >= 100)
      .map((e) => ({ url: `${siteUrl}/spot/${e.id}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 }));
  } catch {}

  const themeSlugs = new Set(themes.map((t) => t.slug));
  const themeUrls = themes.map((t) => ({
    url: `${siteUrl}/rankings/${t.slug}`,
    lastModified: t.createdAt ? new Date(t.createdAt) : now,
    changeFrequency: t.active ? "daily" : "weekly",
    priority: t.active ? 0.9 : 0.75,
  }));

  return [
    ...staticUrls.filter((u) => !themeSlugs.has(u.url.split("/rankings/")[1])),
    ...themeUrls,
    ...exploreUrls,
    ...areaUrls,
    ...spotUrls,
  ];
}
