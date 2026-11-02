import { rankingStandings } from "./rankings.js";

// Reader guidance for existing canonical rankings, not synthetic search-volume data.
const groups = [
  {
    topics: ["biryani", "chicken-biryani", "veg-biryani"],
    heading: "Choose your biryani stop",
    intro: "Start with the style you want, then compare the branch, neighbourhood and budget. The live board records local preferences; it is not a verdict on every dish a restaurant serves.",
    checks: ["Compare chicken, mutton and vegetarian options on the branch menu.", "Choose the outlet you will actually visit; a brand's branches can differ.", "Use recent votes alongside the all-time board when planning your next meal."],
    faqs: [{ q: "Does the biryani ranking distinguish chicken and vegetarian options?", a: "There are separate chicken-biryani and vegetarian-biryani ballots linked below. Use those when the type matters, and check the exact branch menu before ordering. A vote in the overall biryani ranking is not a vote for every variant." }],
    related: ["biryani", "chicken-biryani", "veg-biryani", "mandi"],
    guides: ["best-biryani-hyderabad-reddit", "vegetarian-biryani-in-hyderabad-order-guide"],
  },
  {
    topics: ["cafe", "new-cafe", "late-night-cafe", "work-friendly-cafes", "irani-cafe"],
    heading: "Find a cafe for your kind of day",
    intro: "A coffee stop, a work session and a late-night catch-up need different things. Compare the branch and budget first, then use the relevant ballot or guide for your plans.",
    checks: ["For working, confirm Wi-Fi, power sockets and laptop policies directly.", "For an evening visit, confirm kitchen hours as well as closing time.", "For dates or a view, use the specific guides rather than assuming a high vote count proves the ambience."],
    faqs: [{ q: "Are the top cafes also suitable for working or late-night visits?", a: "A general cafe vote does not verify Wi-Fi, sockets, laptop rules or late-night kitchen hours. Compare the work-friendly and late-night cafe ballots, then confirm those facilities and hours with the branch." }],
    related: ["cafe", "work-friendly-cafes", "late-night-cafe", "new-cafe", "irani-cafe"],
    guides: ["best-cafes-hyderabad-reddit", "best-cafes-for-dates-in-hyderabad", "cafes-with-best-views-in-hyderabad"],
  },
  {
    topics: ["brewery", "restro-bar"],
    heading: "Plan a brewery visit",
    intro: "Compare the actual outlet, travel distance and budget for your group. Brewery votes describe local preferences; tap lists, food menus and event arrangements can change.",
    checks: ["Confirm the current tap list if you are visiting for a particular beer.", "Check cover charges, reservations and event rules with the venue.", "Treat the budget for two as a guide; drinks and group orders change the bill."],
    faqs: [{ q: "Does a brewery's ranking include its current beers and cover charges?", a: "No. The board records community preferences, not a live tap list or booking quote. Open the branch page for available visit notes and official links, then confirm today's beers, cover charges and reservations with the venue." }],
    related: ["brewery", "restro-bar", "rooftop-restaurants", "dinner-restaurants"],
    guides: ["best-breweries-in-hyderabad"],
  },
  {
    topics: ["dosa", "breakfast-places"],
    heading: "Plan your breakfast stop",
    intro: "Compare neighbourhoods before choosing a breakfast spot. The most-voted place across the city may be less useful than a nearby branch that serves what you want at the right time.",
    checks: ["Check breakfast service hours and the exact outlet.", "Compare the dosa style, fillings and accompaniments on the menu.", "Use the venue page for directions and any available visit notes."],
    faqs: [{ q: "Is the dosa ranking the same as the best-breakfast ranking?", a: "No. Dosa is a dish-specific ballot; the breakfast ballot covers a wider meal. Compare both below, and confirm breakfast service hours before travelling." }],
    related: ["dosa", "breakfast-places", "irani-cafe", "street-food"],
    guides: ["best-tiffins-hyderabad-reddit"],
  },
  {
    topics: ["ice-cream", "bakery"],
    heading: "Choose your dessert stop",
    intro: "Use the board to find community favourites, then narrow the choice to the dessert you actually want. A bakery vote is not a separate rating for its cakes, brownies or drinks.",
    checks: ["Check whether your preferred flavour or bake is available at that branch.", "Confirm eggless and dietary requirements directly; do not infer them from a venue name.", "For a celebration cake, confirm size, lead time and price before ordering."],
    faqs: [{ q: "Can I use this ranking to choose cakes, brownies or hot chocolate?", a: "Use the linked dish guides for those specific choices. General bakery or ice-cream votes show broader preferences and do not establish a winner for every dessert." }],
    related: ["ice-cream", "bakery", "cafe"],
    guides: ["best-ice-cream-desserts-hyderabad", "best-dessert-places-in-hyderabad", "best-cakes-and-cupcakes-in-hyderabad"],
  },
  {
    topics: ["mandi"],
    heading: "Choose mandi for your group",
    intro: "Compare the branch, meat choices and platter size before choosing a mandi spot. A budget for two is a venue estimate, not a quote for a particular platter or group.",
    checks: ["Confirm the meat, portion size and number of people a platter serves.", "Check seating and reservations for larger groups.", "Compare the exact branch rather than treating all outlets as interchangeable."],
    faqs: [{ q: "How should I compare mandi prices for a group?", a: "Check the current platter size, meat options and stated serving size with the branch. The venue budgets below are estimates for two, so they should not be multiplied into a group-platter quote." }],
    related: ["mandi", "biryani", "shawarma", "dinner-restaurants"],
    guides: ["best-biryani-hyderabad-reddit"],
  },
  {
    topics: ["shawarma", "street-food"],
    heading: "Find your next street-food stop",
    intro: "Choose a nearby branch and check what it serves before setting off. A short menu and a small bill do not replace checking the exact outlet and current service hours.",
    checks: ["Confirm the filling, bread, sauces and portion you want.", "Check service hours directly when planning a late-night stop.", "Treat inspection records as dated records, not a current safety guarantee."],
    faqs: [{ q: "Can I use these votes to find late-night food in Hyderabad?", a: "The votes show preferences, not live opening status. Use the late-night food guide and restaurant ballot below, then confirm the branch's current service hours before travelling." }],
    related: ["shawarma", "street-food", "late-night-restaurants", "mandi"],
    guides: ["late-night-food-hyderabad-reddit"],
  },
  {
    topics: ["haleem"],
    heading: "Check the branch and the season",
    intro: "Haleem availability can be seasonal. Use the board to compare local preferences, then confirm that your chosen branch is serving it on the day you plan to visit.",
    checks: ["Confirm today's availability and serving hours directly.", "Check the meat, portion and takeaway options before ordering.", "A past vote does not establish current availability."],
    faqs: [{ q: "Do these haleem rankings mean every listed place serves it all year?", a: "No. The ranking records local votes and can include seasonal choices. Confirm current availability and serving times with the exact branch." }],
    related: ["haleem", "biryani", "street-food"],
    guides: ["best-biryani-hyderabad-reddit"],
  },
  {
    topics: ["restaurants", "new-restaurants", "dinner-restaurants", "late-night-restaurants", "rooftop-restaurants", "buffet", "fine-dining"],
    heading: "Choose a restaurant for the occasion",
    intro: "Compare the neighbourhood, budget and meal format before choosing a restaurant. A community vote can narrow the shortlist; the current menu and booking conditions decide whether it fits your plans.",
    checks: ["For buffets, confirm the service, inclusions and current per-person price.", "For rooftop dining, confirm seating availability and weather arrangements.", "For late dinners, check kitchen closing time rather than only venue hours."],
    faqs: [{ q: "Are the listed budgets buffet prices or fixed dining packages?", a: "No. Budgets for two are indicative venue estimates. Buffet prices, alcohol, taxes, service charges and event packages may differ; confirm the current offer and inclusions with the restaurant." }],
    related: ["restaurants", "dinner-restaurants", "buffet", "fine-dining", "rooftop-restaurants", "late-night-restaurants"],
    guides: ["restaurants-in-sattva-knowledge-city-hyderabad", "late-night-food-hyderabad-reddit"],
  },
  {
    topics: ["burger", "chicken-pizza", "momos"],
    heading: "Choose the order, then the outlet",
    intro: "Compare the branch and budget before ordering. The board captures local preferences for this food; it does not turn every item on a restaurant menu into a recommendation.",
    checks: ["Confirm the filling, toppings and portion size on the branch menu.", "Check dietary requirements and availability directly.", "Compare the current-week board with all-time preferences for a recent signal."],
    faqs: [{ q: "Does a vote recommend everything on the menu?", a: "No. This ballot is for the food named in the ranking. Use the branch page for available visit notes, and check the specific item and dietary requirements with the venue." }],
    related: ["street-food", "cafe", "late-night-restaurants"],
    guides: ["late-night-food-hyderabad-reddit"],
  },
];

const rankingSlug = (topic) => topic === "new-restaurants" ? "new-restaurants-in-hyderabad" : `best-${topic}-in-hyderabad`;

export const RANKING_GUIDE_TITLES = {
  "best-biryani-hyderabad-reddit": "Hyderabad biryani: the local recommendation guide",
  "vegetarian-biryani-in-hyderabad-order-guide": "Vegetarian biryani: what to order",
  "best-cafes-hyderabad-reddit": "Hyderabad cafes for work, coffee and dates",
  "best-cafes-for-dates-in-hyderabad": "Cafes for dates in Hyderabad",
  "cafes-with-best-views-in-hyderabad": "Hyderabad cafes with a view",
  "best-breweries-in-hyderabad": "Hyderabad brewery guide",
  "best-tiffins-hyderabad-reddit": "Hyderabad breakfast and tiffin guide",
  "best-ice-cream-desserts-hyderabad": "Hyderabad ice cream and dessert guide",
  "best-dessert-places-in-hyderabad": "Dessert places in Hyderabad",
  "best-cakes-and-cupcakes-in-hyderabad": "Cakes and cupcakes in Hyderabad",
  "late-night-food-hyderabad-reddit": "Late-night food in Hyderabad",
  "restaurants-in-sattva-knowledge-city-hyderabad": "Restaurants around Sattva Knowledge City",
};

export function rankingDiscovery(slug) {
  const group = groups.find((g) => g.topics.some((topic) => rankingSlug(topic) === slug));
  const source = group || {
    heading: "Plan your visit",
    intro: "Compare the actual branch, neighbourhood and budget alongside local votes. Confirm current menus, prices and service hours with the venue before travelling.",
    checks: ["Choose the exact branch you intend to visit.", "Use the venue page for available directions and visit notes."],
    faqs: [], related: ["restaurants", "cafe", "biryani"], guides: [],
  };
  return {
    ...source,
    related: source.related.map(rankingSlug).filter((related) => related !== slug).slice(0, 4),
  };
}

// Only venues with real votes and resolvable branch pages enter the comparison.
export function rankingVisitOptions(results, lookup, pathForSpotId) {
  const seen = new Set();
  return rankingStandings(results).flatMap((row) => {
      if (seen.has(row.spotId)) return [];
      seen.add(row.spotId);
      const venue = lookup(row.spotId);
      if (!venue) return [];
      const budget = Number(venue.costForTwo);
      return [{ name: row.name || venue.name, href: pathForSpotId(row.spotId),
        address: typeof venue.address === "string" ? venue.address : null,
        budget: Number.isFinite(budget) && budget > 0 ? budget : null }];
    }).slice(0, 6);
}
