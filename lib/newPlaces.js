export const DISCOVERY_SOURCE = "weekly-discovery";
export const NEW_PLACE_DAYS = 7;

const timestamp = (place) => Date.parse(place?.approvedAt || place?.createdAt || "") || 0;

export function recentApprovedPlaces(places, now = Date.now(), days = NEW_PLACE_DAYS) {
  const cutoff = now - days * 86400000;
  return [...(places || [])]
    .filter((place) => place?.status === "approved" && timestamp(place) >= cutoff)
    .sort((a, b) => timestamp(b) - timestamp(a));
}

export function newPlacesCaption(places) {
  const rows = (places || []).slice(0, 8);
  const list = rows.map((place, index) => `${index + 1}. ${place.name}${place.area ? ` — ${place.area}` : ""}`).join("\n");
  return [
    "New on the Hyderabad Eats map this week ✨",
    list,
    "",
    "Save this for your next food run. Find every pin at eats.mapmyhyd.com.",
    "",
    "#HyderabadFood #HyderabadEats #NewInHyderabad #MapMyHyd",
  ].join("\n");
}
