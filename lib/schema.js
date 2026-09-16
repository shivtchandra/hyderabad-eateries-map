import { hasSpotPhoto, spotPath } from "./siteData.js";
import { galleryPhotoUrl, spotPhotoUrl } from "./photos.js";

const CAT_LABEL = {
  cafe: "Cafe",
  local: "Restaurant",
  "restro-bar": "BarOrPub",
  bakery: "Bakery",
  "ice-cream": "IceCreamShop",
};

export function restaurantJsonLd(spot, siteUrl, author) {
  const schema = {
    "@context": "https://schema.org",
    "@type": CAT_LABEL[spot.category] || "Restaurant",
    name: spot.name,
    url: `${siteUrl}${spotPath(spot)}`,
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

  const images = spot.gallery?.length
    ? spot.gallery.map((f) => galleryPhotoUrl(f))
    : hasSpotPhoto(spot.id)
      ? [spotPhotoUrl(spot.id)]
      : [];
  if (images.length) schema.image = images;

  if (spot.signatureDish?.name) schema.servesCuisine = spot.signatureDish.name;
  if (spot.costForTwo) schema.priceRange = `₹${spot.costForTwo} for two`;
  else if (spot.priceLevel) schema.priceRange = "₹".repeat(spot.priceLevel);
  if (spot.phone) schema.telephone = spot.phone;
  if (spot.website) schema.hasMenu = spot.website;

  if (spot.regularNote && author) {
    schema.review = {
      "@type": "Review",
      author: { "@type": "Person", name: author },
      reviewBody: spot.regularNote,
    };
  }

  return schema;
}

export function faqJsonLd(faq) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
