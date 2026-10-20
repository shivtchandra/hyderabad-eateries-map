const MODERN_DISH_DESTINATIONS = {
  biryani: "/rankings/best-biryani-in-hyderabad",
  haleem: "/rankings/best-haleem-in-hyderabad",
  mandi: "/rankings/best-mandi-in-hyderabad",
  shawarma: "/rankings/best-shawarma-in-hyderabad",
  dosa: "/rankings/best-dosa-in-hyderabad",
  tiffins: "/guides/best-tiffins-hyderabad-reddit",
  "irani-chai": "/rankings/best-irani-cafe-in-hyderabad",
  "ice-cream": "/rankings/best-ice-cream-in-hyderabad",
  coffee: "/rankings/best-cafe-in-hyderabad",
};

export function dishDestination(dishId, area = "") {
  if (area) {
    const query = new URLSearchParams({ dish: dishId, area });
    return `/?${query.toString()}`;
  }
  return MODERN_DISH_DESTINATIONS[dishId] || `/?dish=${encodeURIComponent(dishId)}`;
}
