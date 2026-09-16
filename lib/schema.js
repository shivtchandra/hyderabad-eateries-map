import { hasSpotPhoto, spotPath } from "./siteData.js";
import { galleryPhotoUrl, spotPhotoUrl } from "./photos.js";

const CAT_LABEL = {
  cafe: "CafeOrCoffeeShop",
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
      worstRating: 1,
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
      reviewRating: {
        "@type": "Rating",
        ratingValue: spot.rating || 5,
        bestRating: 5,
        worstRating: 1,
      },
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

export function breadcrumbJsonLd(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getSpotFaqs(spot) {
  if (spot.faq?.length) return spot.faq;
  const faqs = [];
  const area = spot.discoveredIn && !spot.discoveredIn.startsWith("text:") ? spot.discoveredIn : "Hyderabad";
  const catLabel = CAT_LABEL[spot.category] || "Restaurant";

  if (spot.signatureDish?.name) {
    faqs.push({
      q: `What is ${spot.name} famous for?`,
      a: `${spot.name} in ${area} is famous for ${spot.signatureDish.name}${spot.signatureDish.why ? ` — ${spot.signatureDish.why}` : ""}.`,
    });
  } else {
    faqs.push({
      q: `What kind of food does ${spot.name} serve?`,
      a: `${spot.name} is a popular ${catLabel} in ${area}, serving quality food and local favorites.`,
    });
  }

  if (spot.rating) {
    faqs.push({
      q: `What is the rating of ${spot.name}?`,
      a: `${spot.name} is rated ${spot.rating}★ on Google${spot.ratingCount ? ` based on ${spot.ratingCount.toLocaleString("en-IN")} reviews` : ""}.`,
    });
  }

  if (spot.address) {
    faqs.push({
      q: `Where is ${spot.name} located in Hyderabad?`,
      a: `${spot.name} is located at ${spot.address}.`,
    });
  }

  if (spot.costForTwo) {
    faqs.push({
      q: `What is the approximate cost for two at ${spot.name}?`,
      a: `The average cost for two at ${spot.name} is around ₹${spot.costForTwo}.`,
    });
  }

  return faqs;
}
