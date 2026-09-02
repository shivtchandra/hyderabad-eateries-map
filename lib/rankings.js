// SEO slug helpers and theme quick-picks aligned to Google Trends search queries.

export function slugFromTitle(title) {
  return (title || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SEO_THEME_PICKS = [
  { title: "Best Biryani in Hyderabad", description: "Vote for the top dum biryani spot this week" },
  { title: "Best Chicken Biryani in Hyderabad", description: "Which chicken biryani wins Hyderabad this week?" },
  { title: "Best Restaurants in Hyderabad", description: "Community vote for the best restaurant in town" },
  { title: "Best Veg Biryani in Hyderabad", description: "Vote for the best vegetarian biryani" },
  { title: "Best Cafe in Hyderabad", description: "Vote for your favourite cafe this week" },
  { title: "Best New Cafe in Hyderabad", description: "Which newly opened cafe deserves the crown?" },
  { title: "Best Haleem in Hyderabad", description: "Ramadan special — vote for the best haleem" },
  { title: "Best Late Night Cafe in Hyderabad", description: "Open late and worth the drive — you decide" },
  { title: "Best Bakery in Hyderabad", description: "Vote for the best bakery and patisserie" },
  { title: "Best Ice Cream in Hyderabad", description: "Vote for the best ice cream and dessert spot" },
  { title: "Best Restro Bar in Hyderabad", description: "Vote for the best bar and brewery" },
  { title: "Best Dosa in Hyderabad", description: "Vote for the crispiest dosa in town" },
  { title: "Best Dinner Restaurants in Hyderabad", category: "restaurant", description: "Top dinner spots in Hyderabad — voted by locals on the map." },
  { title: "Best Brewery in Hyderabad", category: "restro-bar", description: "Best microbreweries and craft beer bars in Hyderabad." },
  { title: "Best Late Night Restaurants in Hyderabad", category: "restaurant", description: "Best places to eat late night in Hyderabad, open past midnight." },
  { title: "New Restaurants in Hyderabad", category: "restaurant", description: "Newly opened restaurants and cafes in Hyderabad — community-voted best new spots." },
  { title: "Best Rooftop Restaurants in Hyderabad", category: "restaurant", description: "Best rooftop dining in Hyderabad — views, ambience, and food voted by locals." },
  { title: "Best Work-Friendly Cafes in Hyderabad", category: "cafe", description: "Cafes in Hyderabad with good wifi, power points, and quiet seating for working." },
  { title: "Best Irani Cafe in Hyderabad", category: "cafe", description: "Hyderabad's iconic Irani cafes — vote for the best Osmania biscuit and Irani chai." },
  { title: "Best Breakfast Places in Hyderabad", category: "restaurant", description: "Best breakfast spots in Hyderabad — voted by locals who actually wake up early." },
  { title: "Best Shawarma in Hyderabad", category: "restaurant", description: "Vote for the best shawarma in Hyderabad — the city's most underrated street obsession." },
];

export function rankingMeta(theme) {
  const year = new Date().getFullYear();
  const title = `${theme.title} (${year}) — Hyderabad Eats Rankings`;
  const totalVotes = (theme.results || []).reduce((s, r) => s + (r.count || 0), 0);
  const leader = theme.results?.[0];
  const leaderLine = leader?.name
    ? `Current #1: ${leader.name} (${leader.count || 0} votes). `
    : "";
  const description =
    theme.description ||
    `${leaderLine}Community-voted weekly ranking for ${theme.title.toLowerCase()}. ${totalVotes} votes so far — vote on the map.`;
  return { title, description };
}

export function itemListJsonLd(theme, siteUrl) {
  const items = (theme.results || []).slice(0, 10).map((r, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: r.name,
    url: `${siteUrl}/spot/${encodeURIComponent(r.spotId)}`,
  }));
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: theme.title,
    description: theme.description || `Community-voted ranking: ${theme.title}`,
    numberOfItems: items.length,
    itemListElement: items,
  };
}
