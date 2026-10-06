"use client";
// Dish guides continue into the existing main map.
export default function RecommendationMapLaunch({ dish }) {
  return <a className="rec-map-launch" href={`/?dish=${encodeURIComponent(dish)}`}>Explore these recommendations on the map</a>;
}
