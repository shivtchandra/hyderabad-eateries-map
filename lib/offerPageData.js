import fs from "node:fs";
import path from "node:path";
import { buildDealWeek, mealPeriod } from "./offerIntelligence.js";
import { spotSlug } from "./siteData.js";

export const OFFER_VIEWS = {
  today: {
    title: "Restaurant Deals in Hyderabad Today",
    seoTitle: "Restaurant Offers in Hyderabad Today: Swiggy vs District",
    description: "Compare verified restaurant offers in Hyderabad today on Swiggy Dineout and District, including exact branches, booking terms and estimated savings.",
    keywords: ["restaurant offers in Hyderabad today", "restaurant deals Hyderabad today", "Swiggy Dineout offers Hyderabad today", "District offers Hyderabad today"],
    date: "today", filter: "all",
  },
  lunch: {
    title: "Lunch Deals in Hyderabad",
    seoTitle: "Lunch Offers in Hyderabad: Swiggy Dineout vs District",
    description: "Compare verified lunch offers in Hyderabad on Swiggy Dineout and District by exact branch, afternoon timing, booking terms and estimated savings.",
    keywords: ["lunch offers Hyderabad", "restaurant lunch deals Hyderabad", "Swiggy Dineout lunch offers Hyderabad", "District lunch offers Hyderabad"],
    date: "all", filter: "lunch",
  },
  dinner: {
    title: "Dinner Deals in Hyderabad",
    seoTitle: "Dinner Offers in Hyderabad: Swiggy Dineout vs District",
    description: "Compare verified dinner offers in Hyderabad on Swiggy Dineout and District by exact branch, evening timing, booking terms and estimated savings.",
    keywords: ["dinner offers Hyderabad", "restaurant dinner deals Hyderabad", "Swiggy Dineout dinner offers Hyderabad", "District dinner offers Hyderabad"],
    date: "all", filter: "dinner",
  },
  weekend: {
    title: "Weekend Restaurant Deals in Hyderabad",
    seoTitle: "Weekend Restaurant Offers in Hyderabad",
    description: "See confirmed weekend restaurant offers and clearly labelled recent deal patterns across Hyderabad on Swiggy Dineout and District.",
    keywords: ["weekend restaurant offers Hyderabad", "weekend dining deals Hyderabad", "Swiggy Dineout weekend offers", "District weekend offers Hyderabad"],
    date: "weekend", filter: "all",
  },
};

export const offerAreaSlug = (area) => String(area || "")
  .toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function loadOfferPageData() {
  const root = process.cwd();
  const offersPath = path.join(root, "data", "curated-offers.json");
  const eateriesPath = path.join(root, "data", "eateries.json");
  const historyPath = path.join(root, "data", "offer-history.json");
  if (!fs.existsSync(offersPath)) return { spotsList: [], history: { spots: {} }, updatedAt: null };
  const offers = JSON.parse(fs.readFileSync(offersPath, "utf8"));
  const eateries = fs.existsSync(eateriesPath) ? JSON.parse(fs.readFileSync(eateriesPath, "utf8")) : [];
  const history = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, "utf8")) : { spots: {} };
  const byId = new Map(eateries.map((eatery) => [eatery.id, eatery]));
  const reference = Date.parse(offers.updatedAt) || Date.now();
  const fresh = (source) => {
    const fetchedAt = Date.parse(source?.fetchedAt || "");
    return Boolean(source?.hasOffers && fetchedAt && reference - fetchedAt <= 72 * 60 * 60 * 1000);
  };
  const spotsList = Object.entries(offers.spots || {}).flatMap(([spotId, entry]) => {
    const district = fresh(entry.district) ? entry.district : null;
    const swiggy = fresh(entry.swiggy) ? entry.swiggy : null;
    if (!district && !swiggy) return [];
    const eatery = byId.get(spotId);
    return [{
      spotId, name: eatery?.name || entry.name || "Restaurant",
      area: eatery?.area || eatery?.discoveredIn || entry.area || "Hyderabad",
      category: eatery?.category || entry.category || "dining",
      rating: eatery?.rating || null, ratingCount: eatery?.ratingCount || null,
      photo: eatery?.photos?.[0] || eatery?.image || null,
      slug: eatery ? spotSlug(eatery) : null, district, swiggy,
    }];
  });
  return { spotsList, history, updatedAt: offers.updatedAt || null };
}

export function spotsForOfferView(view, data = loadOfferPageData()) {
  if (view === "today") return data.spotsList.filter((spot) => buildDealWeek(spot, data.history)[0]?.state === "confirmed");
  if (view === "weekend") return data.spotsList.filter((spot) => buildDealWeek(spot, data.history).some((day) => ["Sat", "Sun"].includes(day.day) && day.state !== "none"));
  if (view === "lunch" || view === "dinner") {
    const target = view === "lunch" ? "afternoon" : "evening";
    return data.spotsList.filter((spot) =>
      (spot.district?.match?.status === "verified" && (spot.district?.deals || []).some((deal) => mealPeriod(deal.when?.from ?? deal.when?.to) === target))
      || (spot.swiggy?.match?.status === "verified" && spot.swiggy?.deal?.allDay));
  }
  return [];
}

export function qualifiedOfferViews(data = loadOfferPageData()) {
  return Object.keys(OFFER_VIEWS).filter((view) => spotsForOfferView(view, data).length >= 15);
}

export function qualifiedOfferAreas(data = loadOfferPageData()) {
  const counts = new Map();
  for (const spot of data.spotsList) {
    if (spot.district?.match?.status !== "verified" && spot.swiggy?.match?.status !== "verified") continue;
    counts.set(spot.area, (counts.get(spot.area) || 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count >= 15).map(([area, count]) => ({ area, slug: offerAreaSlug(area), count }));
}
