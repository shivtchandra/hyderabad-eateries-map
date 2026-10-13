import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { getAreaBySlug, allAreaPages, spotPath, hasSpotPhoto } from "../../../lib/siteData.js";
import { spotPhotoUrl } from "../../../lib/photos.js";
import { getAreaPillar } from "../../../lib/explorePillars.js";
import { pageMeta, getSiteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { breadcrumbJsonLd } from "../../../lib/schema.js";
import { rankedPlaces } from "../../../lib/recommendationPicks.js";
import { getInspectionDrives } from "../../../lib/inspectionsServer.js";
import AreaExplorer from "../../components/AreaExplorer.jsx";

const SAFETY = { closed: ["Closed", "#141414"], "licence-suspended": ["Licence suspended", "#c2410c"], notice: ["Notice", "#78716c"] };
const shortTitle = (t = "") => t.replace(/^best\s+/i, "").replace(/\s+in\s+hyderabad$/i, "");


function areaPageCopy(area, spotCount, sampleNames = []) {
  const namesSnippet = sampleNames.length ? ` Popular picks include ${sampleNames.slice(0, 3).join(", ")}.` : "";
  if (area === "Jubilee Hills") {
    return {
      title: `Best Cafes & Restaurants in Jubilee Hills`,
      description: `Cafes in Jubilee Hills and top restaurants on Hyderabad Eats: ${spotCount} mapped spots with verified ratings, must-order dishes, menu prices, and live map pins.`,
      lead: (names) =>
        names.length
          ? `Looking for cafes in Jubilee Hills? Popular picks include ${names.join(", ")}, among ${spotCount} mapped cafes and restaurants.`
          : `Browse cafes in Jubilee Hills and nearby restaurants on the Hyderabad Eats map (${spotCount} spots).`,
      faqWhere: "Where are the best cafes in Jubilee Hills?",
    };
  }
  if (area === "Gachibowli") {
    return {
      title: `Best Restaurants in Gachibowli`,
      description: `Best restaurants and cafes in Gachibowli, Hyderabad: ${spotCount} curated places on Hyderabad Eats with ratings, must-order dishes, prices, and map pins.`,
      lead: (names) =>
        names.length
          ? `Best restaurants in Gachibowli right now include ${names.join(", ")}, among ${spotCount} mapped spots.`
          : `Explore the best restaurants in Gachibowli on Hyderabad Eats (${spotCount} mapped places).`,
      faqWhere: "What are the best restaurants in Gachibowli?",
    };
  }
  if (area === "Madhapur/HITEC") {
    return {
      title: `Best Restaurants in Madhapur & HITEC City`,
      description: `Best restaurants in Madhapur and HITEC City: ${spotCount} cafes, breweries, and lunch spots on Hyderabad Eats across Hyderabad's tech corridor.`,
      lead: (names) =>
        names.length
          ? `Best restaurants in Madhapur include ${names.join(", ")}, with HITEC City covered on the same Hyderabad Eats list (${spotCount} spots).`
          : `Find the best restaurants in Madhapur and HITEC City on Hyderabad Eats (${spotCount} spots).`,
      faqWhere: "What are the best restaurants in Madhapur?",
    };
  }
  if (area === "Secunderabad") {
    return {
      title: `Best Restaurants in Secunderabad`,
      description: `Best restaurants, iconic bakeries, and cafes in Secunderabad: ${spotCount} places on Hyderabad Eats with verified ratings, must-orders, hours, and map pins.`,
      lead: (names) =>
        names.length
          ? `Best restaurants in Secunderabad include ${names.join(", ")}, among ${spotCount} mapped spots.`
          : `Browse the best restaurants in Secunderabad on Hyderabad Eats (${spotCount} spots).`,
      faqWhere: "What are the best restaurants in Secunderabad?",
    };
  }
  if (area === "Kondapur") {
    return {
      title: `Best Restaurants in Kondapur`,
      description: `Best restaurants and cafes in Kondapur, Hyderabad: ${spotCount} places on Hyderabad Eats with ratings, must-order dishes, prices, and map pins near Gachibowli.`,
      lead: (names) =>
        names.length
          ? `Best restaurants in Kondapur include ${names.join(", ")}, among ${spotCount} mapped places.`
          : `Explore the best restaurants in Kondapur on Hyderabad Eats (${spotCount} spots).`,
      faqWhere: "What are the best restaurants in Kondapur?",
    };
  }
  return {
    title: `Best Restaurants & Cafes in ${area}`,
    description: `Explore the best restaurants, cafes, and local food spots in ${area}, Hyderabad: ${spotCount} mapped places with ratings, must-orders, and menu prices.${namesSnippet}`,
    lead: (names) =>
      names.length
        ? `Popular food spots in ${area} include ${names.join(", ")}, among ${spotCount} mapped places.`
        : `${area} has ${spotCount} restaurants and cafes on the Hyderabad Eats map.`,
    faqWhere: `Where should I eat in ${area}, Hyderabad?`,
  };
}

export function generateStaticParams() {
  return allAreaPages().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }) {
  const data = getAreaBySlug(params.slug);
  if (!data) return { title: "Not found" };
  const year = new Date().getFullYear();
  const sampleNames = data.spots.slice(0, 3).map((s) => s.name);
  const copy = areaPageCopy(data.area, data.spots.length, sampleNames);
  const title = `${copy.title} (${year})`;
  const pillar = getAreaPillar(data.area);
  const description = pillar?.blurb || copy.description;
  return {
    ...pageMeta({ title, description, path: `/areas/${params.slug}` }),
    openGraph: { ...pageMeta({ title, description, path: `/areas/${params.slug}` }).openGraph, images: ogImages(title, description, `/areas/${params.slug}`) },
  };
}

export default async function AreaPage({ params }) {
  const data = getAreaBySlug(params.slug);
  if (!data) notFound();

  const pillar = getAreaPillar(data.area);
  const top = [...data.spots].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
  const featured = top.filter((sp) => hasSpotPhoto(sp.id)).slice(0, 3);
  const copy = areaPageCopy(data.area, data.spots.length);
  const pageTitle = copy.title;
  const topNames = top.slice(0, 3).map((s) => s.name).filter(Boolean);
  const answerLead = copy.lead(topNames);

  // What makes a row worth more than a map listing: its place in a community
  // vote and its latest food safety record (both shown as badges).
  const ranked = await rankedPlaces();
  const safetyBySpot = new Map();
  try {
    const drives = [...(await getInspectionDrives())].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    for (const d of drives) for (const en of d.entries || []) {
      if (en.spotId && SAFETY[en.action] && !safetyBySpot.has(en.spotId)) safetyBySpot.set(en.spotId, SAFETY[en.action]);
    }
  } catch {}
  const items = top.map((s) => {
    const r = ranked.get(s.id)?.[0];
    const sf = safetyBySpot.get(s.id);
    return {
      id: s.id, name: s.name, category: s.category, path: spotPath(s),
      rating: s.rating ?? null, ratingCount: s.ratingCount ?? null, priceLevel: s.priceLevel ?? null,
      lat: s.lat, lng: s.lng,
      photo: hasSpotPhoto(s.id) ? spotPhotoUrl(s.id) : null,
      rank: r ? { n: r.rank, title: shortTitle(r.title) } : null,
      safety: sf ? { label: sf[0], tone: sf[1] } : null,
    };
  });

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: copy.faqWhere,
        acceptedAnswer: { "@type": "Answer", text: `${answerLead} Browse the list below or open the map for details.` },
      },
      {
        "@type": "Question",
        name: `How many restaurants are mapped in ${data.area}?`,
        acceptedAnswer: { "@type": "Answer", text: `Hyderabad Eats currently lists ${data.spots.length} spots in ${data.area}.` },
      },
    ],
  };

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Areas", url: `${getSiteUrl()}/areas` },
    { name: data.area, url: `${getSiteUrl()}/areas/${params.slug}` },
  ]);

  return (
    <div style={{ paddingBottom: 84 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    <SiteChrome
      active="/areas"
      backFallback="/areas"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/areas", label: "Areas" }, { href: `/areas/${params.slug}`, label: data.area }]}
      title={pageTitle}
      description={answerLead}
      related={[
        { href: "/explore/cafes", label: "Best cafes" },
        { href: "/explore/biryani-and-local", label: "Best biryani" },
        { href: "/rankings/best-cafe-in-hyderabad", label: "Vote: best cafe" },
        ...allAreaPages().filter((a) => a.slug !== params.slug).slice(0, 3).map((a) => ({ href: `/areas/${a.slug}`, label: a.area })),
      ]}
    >
      {featured.length === 3 && (
        <div className="area-strip">
          {featured.map((sp, i) => (
            <Link key={sp.id} href={spotPath(sp)} className={`area-strip-card${i === 0 ? " area-strip-card--big" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spotPhotoUrl(sp.id)} alt={sp.name} loading={i === 0 ? "eager" : "lazy"} />
              <span className="area-strip-name">{sp.name}</span>
            </Link>
          ))}
        </div>
      )}

      <AreaExplorer area={data.area} spots={items} />

      <Link href="/" className="site-cta">Open the full map</Link>

      <section className="ax-about" aria-label={`About eating in ${data.area}`}>
        <h2 className="site-section-title">About {data.area}</h2>
        {pillar?.blurb && <p>{pillar.blurb}</p>}
        <p><strong>{copy.faqWhere}</strong> {answerLead}</p>
        <p><strong>How many places are listed?</strong> {data.spots.length} restaurants and cafes, sorted by review count unless you pick another order above.</p>
      </section>
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="areas" />
    </div>
    </div>
  );
}
