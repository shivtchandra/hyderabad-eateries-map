import { getSiteUrl } from "./site.js";

// SEO + GEO for the Guides hubs (rankings, dish guides, areas, deals, food
// safety, stories). GEO here means both: the place (Hyderabad, with
// coordinates, so local search knows where this applies) and generative
// engines (an answer-first summary with real counts and a date, a clean list
// of what the page contains, and FAQs they can quote).
export const HYDERABAD = {
  "@type": "City",
  name: "Hyderabad",
  containedInPlace: { "@type": "State", name: "Telangana", containedInPlace: { "@type": "Country", name: "India" } },
  geo: { "@type": "GeoCoordinates", latitude: 17.385, longitude: 78.4867 },
};

export function hubJsonLd({ name, description, path, items = [], faqs = [], updated = null }) {
  const site = getSiteUrl();
  const url = `${site}${path}`;
  const page = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    inLanguage: "en-IN",
    isPartOf: { "@type": "WebSite", name: "Hyderabad Eats", url: site },
    about: HYDERABAD,
    spatialCoverage: HYDERABAD,
    ...(updated ? { dateModified: updated } : {}),
    ...(items.length ? {
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: items.length,
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          url: it.url.startsWith("http") ? it.url : `${site}${it.url}`,
        })),
      },
    } : {}),
  };
  const out = [page];
  if (faqs.length) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return out;
}

export const todayIso = () => new Date().toISOString().slice(0, 10);
