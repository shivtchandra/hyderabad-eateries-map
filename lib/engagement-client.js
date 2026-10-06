"use client";

/**
 * Anonymous session funnel → Firestore (/api/events) + GA4 when present.
 * Never send emails, queries, or coordinates.
 */
export function trackEvent(event, variant = "new") {
  try {
    let s = JSON.parse(sessionStorage.getItem("hyd-eats-session") || "null");
    if (!s || Date.now() - s.started > 1_800_000) {
      s = { id: crypto.randomUUID(), started: Date.now() };
      sessionStorage.setItem("hyd-eats-session", JSON.stringify(s));
    }

    const ref = document.referrer;
    const source = !ref
      ? "direct"
      : /chatgpt\.com|chat\.openai|perplexity\.ai|gemini\.google|copilot\.microsoft|claude\.ai|you\.com/i.test(ref)
        ? "ai" // AI answer engines: are we being cited?
      : /google|bing|duckduckgo/i.test(ref)
        ? "search"
        : /linkedin|instagram|facebook|t\.co|twitter|x\.com/i.test(ref)
          ? "social"
          : "other";
    const device =
      innerWidth < 768 ? "phone" : innerWidth < 1024 ? "tablet" : "desktop";

    fetch("/api/events", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        session: s.id,
        product: "eateries",
        variant,
        device,
        source,
      }),
    }).catch(() => {});

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", event, {
        engagement_product: "eateries",
        engagement_variant: variant,
        engagement_device: device,
        engagement_source: source,
      });
    }
  } catch {}
}
