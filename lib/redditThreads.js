/**
 * Verified r/hyderabad community threads run by u/EveningTarget3419
 * Used across guides, race pages, and spot reviews to ground recommendations
 * in authentic local discussions and avoid generic AI tone.
 */

export const REDDIT_COMMUNITY_THREADS = [
  {
    id: "breweries-2026",
    category: "breweries",
    title: "This week we're ranking the best breweries in Hyderabad. Current standings inside.",
    shortTitle: "Best Breweries Race",
    subreddit: "r/hyderabad",
    author: "u/EveningTarget3419",
    url: "https://www.reddit.com/r/hyderabad/comments/1whsnai/this_week_were_ranking_the_best_breweries_in/",
    shareUrl: "https://www.reddit.com/r/hyderabad/s/NKWK4NttSL",
    postDate: "2026-10",
    summary: "Trying to settle Hyderabad's microbrewery debate with an actual city vote instead of stale listicles.",
    standings: [
      { rank: 1, name: "Broadway The Brewery", area: "Jubilee Hills", votes: 19, spotId: "broadway-the-brewery" },
      { rank: 2, name: "Onegolf Brewery", area: "Financial District", votes: 4, spotId: "onegolf-brewery-financial-district" },
      { rank: 3, name: "Prost Brewpub", area: "Jubilee Hills", votes: 3, spotId: "prost-jubilee-hills" }
    ],
    highlights: [
      {
        user: "blunt-dagger",
        score: 4,
        comment: "Zero40"
      },
      {
        user: "EveningTarget3419 (OP)",
        score: 2,
        comment: "Fair point. 28 votes is a tiny sample size, so the list is kinda biased right now."
      },
      {
        user: "blunt-dagger",
        score: 1,
        comment: "Zero 40, Broadway, Forge."
      },
      {
        user: "EveningTarget3419 (OP)",
        score: 2,
        comment: "Didn't try Zero 40 but liked the other two in same order; should try Zero 40 😊"
      }
    ],
    spotIds: [
      "broadway-the-brewery",
      "prost-jubilee-hills",
      "zero40-brewing-jubilee-hills",
      "forge-breu-hous-jubilee-hills",
      "onegolf-brewery-financial-district"
    ],
    guideSlug: "/guides/best-breweries-in-hyderabad"
  },
  {
    id: "pizza-2026",
    category: "pizza",
    title: "This week we're ranking the best chicken pizza in Hyderabad. Current standings inside.",
    shortTitle: "Best Chicken Pizza Race",
    subreddit: "r/hyderabad",
    author: "u/EveningTarget3419",
    url: "https://www.reddit.com/r/hyderabad/comments/1wouygj/this_week_were_ranking_the_best_chicken_pizza_in/",
    shareUrl: "https://www.reddit.com/r/hyderabad/s/IAPBNm8RuT",
    postDate: "2026-10",
    summary: "Weekly food race pitting coffee houses, dedicated pizzerias, and cloud kitchens head-to-head.",
    standings: [
      { rank: 1, name: "Kissa Coffee House", area: "Jubilee Hills", votes: 4 },
      { rank: 2, name: "CoalSpark Multi Cuisine", area: "Mehdipatnam", votes: 1 },
      { rank: 3, name: "Broadway The Brewery", area: "Jubilee Hills", votes: 1 }
    ],
    highlights: [
      {
        user: "Conscious_Mammoth_17",
        score: 1,
        comment: "Scuzi can't be added"
      },
      {
        user: "EveningTarget3419 (OP)",
        score: 1,
        comment: "I have added to the list man, U can now vote for it. Missed it initially as it was a cloud kitchen"
      },
      {
        user: "SyedAbrarUddin",
        score: 1,
        comment: "What even does chicken pizza even mean? You should go for something that every pizza place usually makes like Margherita..."
      }
    ],
    spotIds: [
      "kissa-coffee-house",
      "broadway-the-brewery",
      "coalspark"
    ],
    guideSlug: "/race/this-week"
  },
  {
    id: "mandi-2026",
    category: "mandi",
    title: "Best Mandi in Hyderabad?",
    shortTitle: "Best Mandi Race",
    subreddit: "r/hyderabad",
    author: "u/EveningTarget3419",
    url: "https://www.reddit.com/r/hyderabad/comments/1wd7xmi/best_mandi_in_hyderabad/",
    shareUrl: "https://www.reddit.com/r/hyderabad/s/dgIlMopzHW",
    postDate: "2026-10",
    summary: "Weekly city vote for authentic Yemeni vs Hyderabadi mandi spots across Hitech City, Barkas, and LB Nagar.",
    standings: [
      { rank: 1, name: "Big Plate Mandi", area: "Hitech City", votes: 22 },
      { rank: 2, name: "Mandi Kebab Biryani", area: "LB Nagar", votes: 4 },
      { rank: 3, name: "Girlfriend Mandi", area: "Gachibowli", votes: 4 }
    ],
    highlights: [
      {
        user: "the_nerd233",
        score: 5,
        comment: "Girl friend got closed right due to hygiene issues?"
      },
      {
        user: "EveningTarget3419 (OP)",
        score: 1,
        comment: "That was jubilee hills branch."
      },
      {
        user: "General_Coyote_496",
        score: 1,
        comment: "When?"
      },
      {
        user: "EveningTarget3419 (OP)",
        score: 1,
        comment: "Yday or day bfr yday ig."
      }
    ],
    spotIds: [
      "big-plate-mandi",
      "girlfriend-mandi-gachibowli"
    ],
    guideSlug: "/race/this-week"
  }
];

export function getThreadForCategory(cat) {
  return REDDIT_COMMUNITY_THREADS.find((t) => t.category === cat) || null;
}

import fs from "fs";
import path from "path";

export function getThreadForSpot(spotSlugOrId, spotName = "") {
  if (!spotSlugOrId && !spotName) return null;
  const s = String(spotSlugOrId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const n = String(spotName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return REDDIT_COMMUNITY_THREADS.find((t) =>
    t.spotIds?.some((id) => {
      const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, "");
      return s.includes(cleanId) || cleanId.includes(s) || n.includes(cleanId) || (cleanId.length >= 5 && n.includes(cleanId));
    })
  ) || null;
}

let _redditPicks = null;
let _redditQuestions = null;

function loadRedditData() {
  if (!_redditPicks) {
    try {
      const picksPath = path.join(process.cwd(), "data", "reddit-picks.json");
      _redditPicks = JSON.parse(fs.readFileSync(picksPath, "utf-8"));
    } catch {
      _redditPicks = { spots: {} };
    }
  }
  if (!_redditQuestions) {
    try {
      const qPath = path.join(process.cwd(), "data", "reddit-questions.json");
      _redditQuestions = JSON.parse(fs.readFileSync(qPath, "utf-8"));
    } catch {
      _redditQuestions = { brands: {} };
    }
  }
}

export function getRedditSpotData(spotId, spotName = "", spotSlugStr = "") {
  loadRedditData();
  const thread = getThreadForSpot(spotSlugStr || spotId, spotName);
  const pick = _redditPicks.spots?.[spotId] || null;

  let brandData = null;
  const nClean = (spotName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [brand, data] of Object.entries(_redditQuestions.brands || {})) {
    const bClean = brand.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (data.ids?.includes(spotId) || (bClean.length >= 4 && nClean.includes(bClean))) {
      brandData = data;
      break;
    }
  }

  return {
    thread,
    pick,
    brandData,
  };
}

