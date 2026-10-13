import { getEateries, getEditorialSpotIds, spotSlug } from "./siteData.js";
import { getRedditSpotData } from "./redditThreads.js";
import { recommendationFor } from "./recommendations.js";
import { recommendationsEnabled } from "./recommendationShared.js";
import { getInspectionDrives } from "./inspectionsServer.js";
import { getAllRankingsThemes } from "./themesServer.js";

// Which spot pages are worth Google's attention. In Oct 2026, 3,346 of 3,694
// spot pages had only the basics (photo, address, hours, rating), which reads
// as thin content and drags the whole site down. A page is indexed only when
// it says something a map listing doesn't: a story or verdict, what to order,
// what locals say, a food safety record, or a place in a community vote.
// Basics-only pages stay reachable (app links, shares) but are noindexed and
// left out of the sitemap. A page "graduates" as soon as it gains content.

export function spotHasOwnContent(spot) {
  if (!spot) return false;
  if (spot.originStory?.length || spot.regularNote || spot.highlight || spot.verdict) return true;
  if (spot.signatureDish?.name || spot.mustOrder?.length) return true;
  try {
    const rd = getRedditSpotData(spot.id, spot.name, spotSlug(spot));
    if (rd?.thread || rd?.brandData?.quotes?.praise?.length) return true;
  } catch {}
  if (recommendationsEnabled()) {
    try {
      const rec = recommendationFor(spot.id);
      if (rec?.recommended) return true;
      if (rec && (rec.dishes?.length || rec.signature?.name || rec.localDishes?.length || rec.editorial)) return true;
    } catch {}
  }
  return false;
}

// Every indexable spot id, computed once per process (in-memory memo, no ISR).
let indexable = null;
export function getIndexableSpotIds() {
  if (!indexable) {
    indexable = (async () => {
      const ids = new Set(getEditorialSpotIds());
      for (const e of getEateries()) if (spotHasOwnContent(e)) ids.add(e.id);
      try {
        for (const d of await getInspectionDrives()) for (const en of d.entries || []) if (en.spotId) ids.add(en.spotId);
      } catch {}
      try {
        for (const th of await getAllRankingsThemes(50)) {
          for (const r of th.results || []) if (r.spotId && (r.count || 0) > 0) ids.add(r.spotId);
        }
      } catch {}
      return ids;
    })();
  }
  return indexable;
}
