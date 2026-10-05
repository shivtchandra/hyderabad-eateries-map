import { dishLeaders, getRecommendations } from "./recommendations.js";
import { DISHES, mustTry } from "./recommendationShared.js";
import { getAreaBySlug } from "./siteData.js";
import { askList } from "./askPages.js";

// Shared view for /picks/[dish] and /picks/[dish]/[area]: "best X right now" with a short,
// quotable answer (top 3 + counts + month) and a ranked list. No em-dashes in copy.
const cleanName = (p) => p.research?.name || p.name.split(/\s[-|@]\s|\s\(|,|\|/)[0].trim();
export function monthLabel() {
  const at = getRecommendations().updatedAt ? new Date(getRecommendations().updatedAt) : new Date();
  return at.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}
export function dishView(dishId, areaSlug = null) {
  const dish = getRecommendations().dishes.find((d) => d.id === dishId) || null;
  if (!dish) return null;
  const area = areaSlug ? getAreaBySlug(areaSlug) : null;
  if (areaSlug && !area) return null;
  const leaders = dishLeaders(dishId, areaSlug).slice(0, 15).map((l) => ({
    ...l, name: cleanName(l.place), tries: mustTry(l.place, 3),
    badge: l.place.rankings?.find((r) => r.dishId === dishId) || null,
  }));
  if (areaSlug && leaders.length < 3) return null;
  const where = area ? `in ${area.area}` : "in Hyderabad";
  const month = monthLabel();
  const top = leaders.slice(0, 3);
  const winner = leaders.map((l) => l.badge).find((b) => b && b.rank === 1);
  const winnerName = winner && leaders.find((l) => l.badge === winner)?.name;
  const answer = `${top.slice(0, -1).map((l) => `${l.name}${l.mentions ? ` (${l.mentions})` : ""}`).join(", ")}${top.length > 1 ? " and " : ""}${top[top.length - 1].name}${top[top.length - 1].mentions ? ` (${top[top.length - 1].mentions})` : ""}${area ? ` are the most recommended ${dish.name.toLowerCase()} places with a branch in ${area.area} right now, counting the people across Hyderabad who name each on r/hyderabad.` : ` are the ${dish.name.toLowerCase()} places locals recommend most in Hyderabad right now, counting the people who name each on r/hyderabad.`}${winnerName ? ` ${winnerName} tops this week's Eats ranking for ${dish.name.toLowerCase()}.` : ""} Updated ${month}.`;
  const ask = askList().filter((q) => leaders.slice(0, 6).some((l) => q.h1.includes(l.name))).slice(0, 4);
  return { dish, area, where, month, leaders, answer,
    title: `Best ${dish.name.toLowerCase()} ${where} right now (${month})`,
    h1: `Best ${dish.name.toLowerCase()} ${where} right now`,
    ask, others: getRecommendations().dishes.filter((d) => d.id !== dishId) };
}
export const allDishes = () => DISHES;
