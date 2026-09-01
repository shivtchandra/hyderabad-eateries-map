const TRENDING_PATTERNS = [
  "babylon",
  "macaw",
  "summer bistro",
  "sobremesa",
  "aaromale",
  "roastery coffee house",
];

export function isTrendingSpot(name) {
  if (!name) return false;
  const n = name.toLowerCase();
  return TRENDING_PATTERNS.some((p) => n.includes(p));
}
