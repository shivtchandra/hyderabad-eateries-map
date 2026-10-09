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
      : [`${siteUrl}/og/home.png`];
  if (images.length) schema.image = images;

  const cuisines = [];
  if (spot.signatureDish?.name) cuisines.push(spot.signatureDish.name);
  if (spot.category) {
    const catLabels = { cafe: "Cafe & Coffee", "restro-bar": "Bar & Lounge", bakery: "Bakery & Desserts", "ice-cream": "Ice Cream & Gelato", local: "Hyderabadi & Indian", restaurant: "Multi-Cuisine" };
    if (catLabels[spot.category]) cuisines.push(catLabels[spot.category]);
  }
  if (spot.tags?.length) {
    cuisines.push(...spot.tags.slice(0, 3).map((t) => t.replace(/-/g, " ")));
  }
  if (cuisines.length) {
    schema.servesCuisine = cuisines;
  }
  if (spot.costForTwo) schema.priceRange = `₹${spot.costForTwo} for two`;
  else if (spot.priceLevel) schema.priceRange = "₹".repeat(spot.priceLevel);
  if (spot.phone) schema.telephone = spot.phone;
  if (spot.website) schema.hasMenu = spot.website;
  if (spot.hours?.length) schema.openingHours = spot.hours;

  if (spot.regularNote && author) {
    schema.review = {
      "@type": "Review",
      author: { "@type": "Person", name: author },
      reviewBody: spot.regularNote.replace(/—/g, ","),
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

export function getSpotFaqs(spot, { spotOffers = null, safety = [] } = {}) {
  if (spot.faq?.length) return spot.faq;
  const faqs = [];
  const area = spot.discoveredIn && !spot.discoveredIn.startsWith("text:") ? spot.discoveredIn : "Hyderabad";
  const catLabel = CAT_LABEL[spot.category] || "Restaurant";

  if (spot.signatureDish?.name) {
    faqs.push({
      q: `What is the must-order dish at ${spot.name}?`,
      a: `${spot.name} in ${area} is famous for ${spot.signatureDish.name}${spot.signatureDish.why ? `, ${spot.signatureDish.why.replace(/—/g, ",")}` : ""}.`,
    });
  } else {
    faqs.push({
      q: `What kind of food does ${spot.name} serve?`,
      a: `${spot.name} is a popular ${catLabel} in ${area}, serving quality food and local favorites.`,
    });
  }

  if (spot.costForTwo) {
    faqs.push({
      q: `What is the approximate cost for two at ${spot.name}?`,
      a: `The average cost for two at ${spot.name} is around ₹${spot.costForTwo}.`,
    });
  }

  if (spotOffers && (spotOffers.district?.hasOffers || spotOffers.swiggy?.hasOffers)) {
    const deals = [];
    if (spotOffers.district?.hasOffers) deals.push("District by Zomato");
    if (spotOffers.swiggy?.hasOffers) deals.push("Swiggy Dineout");
    faqs.push({
      q: `Does ${spot.name} have active dining deals or discounts?`,
      a: `Yes, ${spot.name} currently has active dining offers and bill discounts available on ${deals.join(" and ")}.`,
    });
  }

  if (safety && safety.length > 0) {
    const latest = safety[0];
    faqs.push({
      q: `Has ${spot.name} been inspected for food safety?`,
      a: `${spot.name} was inspected by the Telangana Food Safety task force on ${latest.drive?.date || "official record"}. Status: ${latest.entry?.status || "Inspected"}.`,
    });
  }

  if (spot.rating) {
    faqs.push({
      q: `What is the rating of ${spot.name}?`,
      a: `${spot.name} is rated ${spot.rating}★ on Google${spot.ratingCount ? ` based on ${spot.ratingCount.toLocaleString("en-IN")} reviews` : ""}.`,
    });
  }

  if (spot.hours?.length) {
    faqs.push({
      q: `What are the opening timings for ${spot.name}?`,
      a: `${spot.name} in ${area} is open during the following hours: ${spot.hours.join(", ")}.`,
    });
  }

  if (spot.address) {
    faqs.push({
      q: `Where is ${spot.name} located in Hyderabad?`,
      a: `${spot.name} is located at ${spot.address}.`,
    });
  }

  return faqs;
}
