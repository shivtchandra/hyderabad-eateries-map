// Only coarse UI context. Never send map bounds, search text or visitor coordinates.
export function trackRecommendationEvent(event, context = {}) {
  if (typeof window === "undefined") return;
  try {
    let session = sessionStorage.getItem("hyd-rec-session");
    if (!session) { session = crypto.randomUUID(); sessionStorage.setItem("hyd-rec-session", session); }
    const payload = { event: `rec_${event}`, session, product: "eateries", variant: "curated", device: window.innerWidth < 768 ? "phone" : "desktop", source: !document.referrer ? "direct" : /chatgpt\.com|chat\.openai|perplexity\.ai|gemini\.google|copilot\.microsoft|claude\.ai|you\.com/i.test(document.referrer) ? "ai" : /google|bing|duckduckgo/i.test(document.referrer) ? "search" : /instagram|facebook|t\.co|reddit/i.test(document.referrer) ? "social" : "other",
      mode: context.mode, dish: context.dish, view: context.view, outcome: context.outcome, count: context.count };
    fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
  } catch { /* Storage can be unavailable without affecting discovery. */ }
}
