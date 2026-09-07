export const PRODUCTS = ["startups", "eateries"];

export const EVENTS = [
  "landing",
  "place_open",
  "save",
  "directions",
  "call",
  "stamp",
  "share",
];

export function safeEvent(input) {
  if (!EVENTS.includes(input?.event) || !/^[a-f0-9-]{36}$/.test(input?.session || "")) return null;
  return {
    event: input.event,
    session: input.session,
    product: "eateries",
    variant: ["new", "control"].includes(input.variant) ? input.variant : "new",
    device: ["phone", "tablet", "desktop"].includes(input.device) ? input.device : "desktop",
    source: ["direct", "search", "social", "other"].includes(input.source) ? input.source : "other",
  };
}
