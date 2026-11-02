export function googleMapsPlaceUrl(spotId, name) {
  const params = new URLSearchParams({ api: "1", query: `${String(name || "Restaurant").trim()}, Hyderabad` });
  if (typeof spotId === "string" && /^ChI[A-Za-z0-9_-]+$/.test(spotId)) params.set("query_place_id", spotId);
  return `https://www.google.com/maps/search/?${params}`;
}
