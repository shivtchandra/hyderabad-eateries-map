// Google files plenty of non-cafes as cafes (McDonald's, Subway, Cream Stone,
// shake bars, breweries, Karachi Bakery), so the Cafes chip and Ask Eats
// "cafe to work" filled up with them. This re-sorts a spot filed as "cafe" by
// what its name says it is. Applied when data loads (lib/siteData.js) and when
// the map index is built (scripts/build-static.mjs), so new spots get it too.
// Café-patisseries and coffee bakehouses (Theory, Kami, Auberrie) stay cafes:
// people sit and work there.
const RULES = [
  ["local", /\b(biryani|tiffins?|mess|meals)\b/i],
  ["restaurant", /\b(mcdonald'?s|subway|domino'?s|kfc|burger king|burgers?|pizza|pizzeria|momos?|shawarma)\b/i],
  ["restro-bar", /\b(brew ?co|brewery|brewing|taproom)\b/i],
  ["ice-cream", /\b(thick ?shakes?|shakes?|milkshakes?|juices?|cream ?stone|baskin|naturals|ice ?creams?|icecream|gelato|kulfi|falooda|creamery|scoops?|cones?)\b/i],
  ["bakery", /\b(karachi bakery|karachi cafe|krispy kreme|cakes? (wow|cafe)|cake cafe|degree oven|taiba bakery|adarsh bakers)\b/i],
];

export function fixCategory(e) {
  if (!e || e.category !== "cafe") return e?.category ?? null;
  const name = e.name || "";
  for (const [cat, re] of RULES) if (re.test(name)) return cat;
  return "cafe";
}
