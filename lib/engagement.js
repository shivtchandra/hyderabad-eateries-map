export const PRODUCTS = ["startups", "eateries"];

export const EVENTS = [
  "landing",
  "place_open",
  "save",
  "directions",
  "call",
  "stamp",
  "share",
  "rec_landing", "rec_mode", "rec_dish", "rec_impressions", "rec_view", "rec_place_open", "rec_save", "rec_share", "rec_directions", "rec_vote", "rec_dish_add", "rec_list", "rec_suggest",
];

export function safeEvent(input) {
  if (!EVENTS.includes(input?.event) || !/^[a-f0-9-]{36}$/.test(input?.session || "")) return null;
  return {
    event: input.event,
    session: input.session,
    product: "eateries",
    variant: ["new", "control", "curated"].includes(input.variant) ? input.variant : "new",
    ...(input.event.startsWith("rec_") ? { context: {
      mode: ["recommended", "all"].includes(input.mode) ? input.mode : null,
      dish: ["biryani", "haleem", "mandi", "shawarma", "dosa", "tiffins", "irani-chai", "osmania-biscuits", "pizza", "ice-cream", "coffee", "sushi"].includes(input.dish) ? input.dish : null,
      view: ["map", "list"].includes(input.view) ? input.view : null,
      outcome: ["success", "failure", "add", "remove", "open", "close"].includes(input.outcome) ? input.outcome : null,
      count: Number.isInteger(input.count) && input.count >= 0 && input.count <= 10000 ? input.count : null,
    } } : {}),
    device: ["phone", "tablet", "desktop"].includes(input.device) ? input.device : "desktop",
    source: ["direct", "search", "ai", "social", "other"].includes(input.source) ? input.source : "other",
  };
}
