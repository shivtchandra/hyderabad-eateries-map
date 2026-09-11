import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getAreaBySlug, allAreaPages, spotPath } from "../../../lib/siteData.js";
import { getAreaPillar } from "../../../lib/explorePillars.js";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";


function areaPageCopy(area, spotCount) {
  if (area === "Jubilee Hills") {
    return {
      title: `Best Cafes & Restaurants in Jubilee Hills`,
      description: `Cafes in Jubilee Hills and top restaurants on Hyderabad Eats — ${spotCount} mapped spots with ratings, stories, and the live food map.`,
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
      description: `Best restaurants in Gachibowli, Hyderabad — ${spotCount} places on Hyderabad Eats with ratings and map pins across the western corridor.`,
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
      description: `Best restaurants in Madhapur and HITEC City — ${spotCount} cafes and restaurants on Hyderabad Eats near Hyderabad's tech belt.`,
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
      description: `Best restaurants in Secunderabad — ${spotCount} places on Hyderabad Eats with ratings, hours, and map locations.`,
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
      description: `Best restaurants in Kondapur, Hyderabad — ${spotCount} cafes and restaurants on Hyderabad Eats near Gachibowli and Madhapur.`,
      lead: (names) =>
        names.length
          ? `Best restaurants in Kondapur include ${names.join(", ")}, among ${spotCount} mapped places.`
          : `Explore the best restaurants in Kondapur on Hyderabad Eats (${spotCount} spots).`,
      faqWhere: "What are the best restaurants in Kondapur?",
    };
  }
  return {
    title: `Best Restaurants & Cafes in ${area}`,
    description: `Top food spots in ${area}, Hyderabad. ${spotCount} cafes, restaurants and local gems on the map.`,
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
  const copy = areaPageCopy(data.area, data.spots.length);
  const title = `${copy.title} (${year})`;
  const pillar = getAreaPillar(data.area);
  const description = pillar?.blurb || copy.description;
  return {
    ...pageMeta({ title, description, path: `/areas/${params.slug}` }),
    openGraph: { ...pageMeta({ title, description, path: `/areas/${params.slug}` }).openGraph, images: ogImages(title, description) },
  };
}

export default function AreaPage({ params }) {
  const data = getAreaBySlug(params.slug);
  if (!data) notFound();

  const pillar = getAreaPillar(data.area);
  const year = new Date().getFullYear();
  const top = [...data.spots].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)).slice(0, 30);
  const copy = areaPageCopy(data.area, data.spots.length);
  const pageTitle = copy.title;
  const topNames = top.slice(0, 3).map((s) => s.name).filter(Boolean);
  const answerLead = copy.lead(topNames);
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

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    <SiteChrome
      active="/areas"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/areas", label: "Areas" }, { href: `/areas/${params.slug}`, label: data.area }]}
      title={pageTitle}
      description={pillar?.blurb || `${data.spots.length} spots in ${data.area}. Top picks by reviews.`}
      related={[
        { href: "/explore/cafes", label: "Best cafes" },
        { href: "/explore/biryani-and-local", label: "Best biryani" },
        { href: "/explore/restaurants", label: "Restaurants" },
        { href: "/rankings/best-cafe-in-hyderabad", label: "Vote: best cafe" },
        ...allAreaPages().filter((a) => a.slug !== params.slug).slice(0, 3).map((a) => ({ href: `/areas/${a.slug}`, label: a.area })),
      ]}
    >
      <p className="spot-prose"><strong>{answerLead}</strong></p>
      {pillar?.blurb && <p className="spot-prose">{pillar.blurb}</p>}
      <p className="spot-prose">
        Showing top {top.length} of {data.spots.length} spots in {data.area} for {year}. Open any place for details, or jump to the map to stamp and vote.
      </p>
      <p className="spot-prose">
        This {data.area} list ranks places by review volume on Hyderabad Eats so you can compare cafes and restaurants before you go.
      </p>
      <h2 className="site-section-title">Top food in {data.area}</h2>
      <ul className="site-spot-list">
        {top.map((s, i) => (
          <li key={s.id}>
            <Link href={spotPath(s)}>
              <span>
                <div className="site-spot-name">{i + 1}. {s.name}</div>
                <div className="site-spot-meta">{s.category} · {s.rating ? `${s.rating}★` : ","}</div>
              </span>
              <span className="site-spot-meta">View →</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="site-related-links" style={{ marginTop: 20 }}>
        <Link href="/explore/biryani-and-local">Biryani & local</Link>
        <Link href="/explore/cafes">Cafes</Link>
        <Link href="/stories">Stories</Link>
      </div>
      <Link href="/" className="site-cta">See {data.area} on the map</Link>
      <section className="spot-prose" aria-label="FAQ" style={{ marginTop: 24 }}>
        <h2 className="site-section-title">FAQ</h2>
        <p><strong>{copy.faqWhere}</strong> {answerLead}</p>
        <p><strong>How many places are listed?</strong> {data.spots.length} restaurants and cafes on this map.</p>
        <p><strong>Can I open them on a map?</strong> Yes — use the map link below for {data.area} pins, hours, and votes.</p>
      </section>
    </SiteChrome>
    </>
  );
}
