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
    "@id": `${siteUrl}${spotPath(spot)}#place`,
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
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    };
    if (spot.discoveredIn && !String(spot.discoveredIn).startsWith("text:")) {
      schema.containedInPlace = { "@type": "Place", name: spot.discoveredIn };
    }
  }

  const images = spot.gallery?.length
    ? spot.gallery.map((f) => galleryPhotoUrl(f))
    : hasSpotPhoto(spot.id)
      ? [spotPhotoUrl(spot.id)]
      : [];
  if (images.length) schema.image = images;

  const cuisines = Array.isArray(spot.cuisines)
    ? spot.cuisines.filter(Boolean)
    : spot.cuisine
      ? [spot.cuisine]
      : [];
  if (cuisines.length) {
    schema.servesCuisine = cuisines;
  }
  if (spot.costForTwo) schema.priceRange = `₹${spot.costForTwo} for two`;
  else if (spot.priceLevel) schema.priceRange = "₹".repeat(spot.priceLevel);
  if (spot.phone) schema.telephone = spot.phone;
  if (spot.website) schema.sameAs = [spot.website];
  if (spot.menuUrl) schema.hasMenu = spot.menuUrl;
  if (spot.openingHoursSpecification?.length) schema.openingHoursSpecification = spot.openingHoursSpecification;

  if (spot.regularNote && author) {
    const verdictRating = spot.verdict?.score != null
      ? Math.max(1, Math.min(5, (Number(spot.verdict.score) / Number(spot.verdict.outOf || 10)) * 5))
      : null;
    // Google permits a rating-less individual review only when both author
    // and publication date are present. Never reuse a third-party star score.
    if (verdictRating != null || spot.reviewedAt) {
      schema.review = {
        "@type": "Review",
        author: { "@type": "Person", name: author },
        reviewBody: spot.regularNote.replace(/—/g, ","),
        ...(spot.reviewedAt ? { datePublished: spot.reviewedAt } : {}),
        ...(verdictRating == null ? {} : {
          reviewRating: {
            "@type": "Rating",
            ratingValue: verdictRating,
            bestRating: 5,
            worstRating: 1,
          },
        }),
      };
    }
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
  if (spot.faq?.length) {
    // Hours drift when copied into prose. Preserve custom questions, but always
    // replace timing answers with the canonical venue-hours field.
    const custom = spot.faq.filter((item) => !/timings?|opening hours?|close|open in the morning/i.test(item.q || ""));
    if (spot.hours?.length) custom.push({
      q: `What are the opening timings for ${spot.name}?`,
      a: `${spot.name} is currently listed with these hours: ${spot.hours.join(", ")}. Check with the venue for holiday changes.`,
    });
    return custom;
  }
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
      a: `${spot.name} is listed as a ${catLabel} in ${area}. Check the current venue menu for available dishes.`,
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
