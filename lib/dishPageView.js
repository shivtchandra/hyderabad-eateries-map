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
  const model = getRecommendations();
  const dish = model.dishes.find((d) => d.id === dishId) || null;
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
  const updatedAt = model.updatedAt || new Date().toISOString();
  const year = new Date(updatedAt).toLocaleDateString("en-IN", { year: "numeric", timeZone: "Asia/Kolkata" });
  const top = leaders.slice(0, 3);
  const winner = leaders.map((l) => l.badge).find((b) => b && b.rank === 1);
  const winnerName = winner && leaders.find((l) => l.badge === winner)?.name;
  const answer = `${top.slice(0, -1).map((l) => `${l.name}${l.mentions ? ` (${l.mentions})` : ""}`).join(", ")}${top.length > 1 ? " and " : ""}${top[top.length - 1].name}${top[top.length - 1].mentions ? ` (${top[top.length - 1].mentions})` : ""}${area ? ` are the strongest ${dish.name.toLowerCase()} picks with a branch in ${area.area} in Mapping HYD's local-evidence set.` : ` lead Mapping HYD's Hyderabad ${dish.name.toLowerCase()} list by local discussion evidence.`} Counts represent distinct r/hyderabad accounts in the analyzed discussions; Mapping HYD editorial evidence can qualify a place or break a tie but is not added to the count.${winnerName ? ` ${winnerName} tops this week's Eats ranking for ${dish.name.toLowerCase()}.` : ""} Updated ${month}.`;
  const ask = askList().filter((q) => leaders.slice(0, 6).some((l) => q.h1.includes(l.name))).slice(0, 4);
  const topNames = top.map((l) => `${l.name}${l.mentions ? ` (${l.mentions} local recommendation signals)` : ""}`).join(", ");
  const faqs = [
    {
      q: `Which ${dish.name.toLowerCase()} places are recommended most ${where}?`,
      a: `${topNames} are the current top three in this evidence set. The list was updated ${month}.`,
    },
    {
      q: `How does Mapping HYD rank ${dish.name.toLowerCase()} places?`,
      a: "The order starts with distinct r/hyderabad accounts in the analyzed discussions. Mapping HYD editorial evidence can qualify a place or break a tie, but it is not added to the displayed count. These are discussion signals, not copied star ratings.",
    },
    ...(!area && dish.mentions && dish.brands ? [{
      q: `How much local evidence is in this ${dish.name.toLowerCase()} guide?`,
      a: `The Hyderabad-wide dataset contains ${dish.mentions.toLocaleString("en-IN")} local recommendation signals across ${dish.brands} brands for ${dish.name.toLowerCase()}.`,
    }] : []),
  ];
  return { dish, area, where, month, updatedAt, leaders, answer, faqs,
    title: `Best ${dish.name} ${where} (${year}): Local Picks`,
    h1: `Best ${dish.name.toLowerCase()} ${where}, ranked by local evidence`,
    ask, others: getRecommendations().dishes.filter((d) => d.id !== dishId) };
}
export const allDishes = () => DISHES;
