const CAT_LABEL = {
  cafe: "Cafe",
  local: "Restaurant",
  "restro-bar": "BarOrPub",
  bakery: "Bakery",
  "ice-cream": "IceCreamShop",
};

export function restaurantJsonLd(spot, siteUrl) {
  const schema = {
    "@context": "https://schema.org",
    "@type": CAT_LABEL[spot.category] || "Restaurant",
    name: spot.name,
    url: `${siteUrl}/spot/${spot.id}`,
    geo: {
      "@type": "GeoCoordinates",
      latitude: spot.lat,
      longitude: spot.lng,
    },
  };

  if (spot.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: spot.address,
      addressLocality: spot.discoveredIn || "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    };
  }

  if (spot.rating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: spot.rating,
      reviewCount: spot.ratingCount || 0,
      bestRating: 5,
    };
  }

  return schema;
}
