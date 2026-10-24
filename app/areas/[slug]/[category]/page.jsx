import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../../components/SiteChrome.jsx";
import BottomNav from "../../../components/BottomNav.jsx";
import { getAreaCategoryData, allAreaCategoryCombinations, spotPath } from "../../../../lib/siteData.js";
import { pageMeta, getSiteUrl } from "../../../../lib/site.js";
import { ogImages } from "../../../../lib/og.js";
import { breadcrumbJsonLd, itemListJsonLd } from "../../../../lib/schema.js";
import { TIERS, tierFor } from "../../../../lib/eateryUtils.js";
import { Icon } from "../../../components/Icons.jsx";
import { rankedPlaces } from "../../../../lib/recommendationPicks.js";

export const revalidate = 86400;

export function generateStaticParams() {
  return allAreaCategoryCombinations({ minSpots: 3 }).map((c) => ({
    slug: c.areaSlug,
    category: c.categorySlug,
  }));
}

export function generateMetadata({ params }) {
  const data = getAreaCategoryData(params.slug, params.category);
  if (!data) return { title: "Not found, Hyderabad Eats" };
  const year = new Date().getFullYear();
  const breakfast = data.category.slug === "breakfast";
  const title = breakfast
    ? `Best Breakfast Places in ${data.area} (${year})`
    : `${data.category.label} in ${data.area} (${year})`;
  const description = breakfast
    ? `${data.spots.length} mapped breakfast and tiffin places in ${data.area}, Hyderabad, with dosa, idli, cafe and local options plus map links.`
    : `Browse ${data.spots.length} mapped ${data.category.label.toLowerCase()} in ${data.area}, Hyderabad, with community standings, available venue facts and map links.`;
  const meta = pageMeta({ title, description, path: `/areas/${params.slug}/${params.category}` });
  return {
    ...meta,
    ...(!data.indexable ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      ...meta.openGraph,
      images: ogImages(title, description, `/areas/${params.slug}`),
    },
  };
}

export default async function AreaCategoryPage({ params }) {
  const data = getAreaCategoryData(params.slug, params.category);
  if (!data) notFound();

  const { area, category, spots, areaSlug } = data;
  const siteUrl = getSiteUrl();
  const year = new Date().getFullYear();
  const breakfast = category.slug === "breakfast";
  const ranked = await rankedPlaces();
  const topSpots = [...spots].sort((a, b) => {
    const ar = ranked.get(a.id)?.[0];
    const br = ranked.get(b.id)?.[0];
    return (Boolean(br) - Boolean(ar))
      || ((ar?.rank || 99) - (br?.rank || 99))
      || ((br?.votes || 0) - (ar?.votes || 0))
      || String(a.name || "").localeCompare(String(b.name || ""));
  }).slice(0, 35);

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: "Areas", url: `${siteUrl}/areas` },
    { name: area, url: `${siteUrl}/areas/${areaSlug}` },
    { name: category.label, url: `${siteUrl}/areas/${areaSlug}/${params.category}` },
  ]);

  const itemsLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.label} in ${area}, Hyderabad`,
    numberOfItems: topSpots.length,
    itemListElement: topSpots.map((spot, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: spot.name,
      url: `${siteUrl}${spotPath(spot)}`,
    })),
  };
  const answerNames = topSpots.slice(0, 3).map((spot) => spot.name);
  const answer = breakfast
    ? `There are ${spots.length} mapped breakfast and tiffin places in ${area}. ${answerNames.length ? `Start with ${answerNames.join(", ")}, then compare the full list and map below.` : "Use the list and map below to compare nearby options."}`
    : `There are ${spots.length} mapped ${category.label.toLowerCase()} in ${area}. ${answerNames.length ? `The list includes ${answerNames.join(", ")}.` : "Browse the verified venue list below."}`;

  return (
    <div style={{ paddingBottom: 84 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemsLd) }} />

      <SiteChrome backFallback={`/areas/${params.slug}`}
        active="/areas"
        breadcrumb={[
          { href: "/", label: "Home" },
          { href: "/areas", label: "Areas" },
          { href: `/areas/${areaSlug}`, label: area },
          { href: `/areas/${areaSlug}/${params.category}`, label: category.label },
        ]}
        title={breakfast ? `Best Breakfast Places in ${area} (${year})` : `${category.label} in ${area}: Map & Guide (${year})`}
        description={answer}
        related={[
          { href: `/?tab=map`, label: "Open full map" },
          { href: `/areas/${areaSlug}`, label: `All food in ${area}` },
          ...(breakfast
            ? [{ href: "/guides/best-tiffins-hyderabad-reddit", label: "Hyderabad breakfast guide" }]
            : [{ href: `/explore/${params.category}`, label: `All ${category.label} in HYD` }]),
          { href: "/?tab=race&view=race", label: "The Food Race" },
          { href: "/rankings", label: "Community rankings" },
        ]}
      >
        <section className="spot-section" aria-label={`${category.label} answer for ${area}`}>
          <h2 className="site-section-title">{breakfast ? `Where to eat breakfast in ${area}` : `${category.label} in ${area} at a glance`}</h2>
          <p className="spot-prose">{answer}</p>
          <p className="spot-prose">Mapping HYD community standings lead when votes exist. Other places are ordered by name, while Google ratings are shown only as labelled third-party facts.</p>
        </section>
        {/* Race Banner */}
        <div style={{
          background: "linear-gradient(135deg, var(--violet-wash) 0%, rgba(124,58,237,0.12) 100%)",
          border: "1.5px solid rgba(124,58,237,0.25)",
          borderRadius: 20,
          padding: "16px 20px",
          margin: "8px 0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          boxShadow: "0 2px 10px rgba(124,58,237,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "var(--violet)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 3px 8px rgba(124,58,237,0.3)"
            }}>
              <Icon name="trophy" size={21} width={2.1} color="#fff" />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)", lineHeight: 1.25 }}>
                The Hyderabad Food Race
              </div>
              <div style={{ fontSize: 13, color: "var(--violet-deep)", fontWeight: 600, marginTop: 2 }}>
                Eat at any spot in {area}, claim points, and climb the leaderboard!
              </div>
            </div>
          </div>
          <Link
            href="/?tab=race&view=race"
            className="pressable-sm"
            style={{
              padding: "9px 18px",
              borderRadius: "var(--r-pill)",
              background: "var(--violet)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 750,
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(124,58,237,0.25)"
            }}
          >
            Join Race →
          </Link>
        </div>

        {/* Spot List */}
        <section className="spot-section">
          <h2 className="site-section-title">
            Browse {category.label} in {area} ({topSpots.length})
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            {topSpots.map((spot) => {
              const tierKey = spot.tier || tierFor(spot.ratingCount || 0);
              const tier = TIERS[tierKey] || TIERS["hidden-gem"];
              const localStanding = ranked.get(spot.id)?.[0];

              return (
                <article
                  key={spot.id}
                  style={{
                    background: "var(--cream-hi)",
                    borderRadius: 18,
                    border: "1.5px solid var(--line)",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    boxShadow: "var(--e1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {localStanding && <span style={{
                          fontFamily: "var(--font-display), system-ui, sans-serif",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--violet-deep)",
                        }}>
                          Mapping HYD #{localStanding.rank} {localStanding.title}
                        </span>}
                        <h3 style={{
                          fontSize: 16.5,
                          fontWeight: 750,
                          margin: 0,
                          color: "var(--ink)",
                        }}>
                          <Link href={spotPath(spot)} style={{ color: "inherit", textDecoration: "none" }}>
                            {spot.name}
                          </Link>
                        </h3>
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 4,
                        fontSize: 12.5,
                        color: "var(--muted)",
                        fontWeight: 500,
                      }}>
                        {spot.rating && (
                          <span style={{ fontWeight: 700, color: "var(--ink-soft)" }}>
                            Google {Number(spot.rating).toFixed(1)}★ {spot.ratingCount ? `(${spot.ratingCount.toLocaleString("en-IN")})` : ""}
                          </span>
                        )}
                        {spot.costForTwo && (
                          <span>· ₹{spot.costForTwo} for 2</span>
                        )}
                        <span>· {area}</span>
                      </div>
                    </div>

                    {/* Tier badge */}
                    <span
                      style={{
                        background: "var(--violet-wash)",
                        color: "var(--violet-deep)",
                        borderRadius: "var(--r-pill)",
                        padding: "3px 9px",
                        fontSize: 11,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      +{tier.points} pts
                    </span>
                  </div>

                  {spot.signatureDish?.name && (
                    <div style={{
                      fontSize: 12.5,
                      color: "var(--ink-soft)",
                      background: "rgba(20, 20, 20,0.04)",
                      padding: "6px 12px",
                      borderRadius: 10,
                      fontWeight: 500,
                    }}>
                      <strong style={{ color: "var(--violet-deep)" }}>Must-Try:</strong> {spot.signatureDish.name}
                      {spot.signatureDish.why ? `: ${spot.signatureDish.why}` : ""}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 2 }}>
                    <Link
                      href={spotPath(spot)}
                      style={{
                        fontSize: 12.5,
                        fontWeight: 650,
                        color: "var(--ink-soft)",
                        textDecoration: "none",
                      }}
                    >
                      View venue details →
                    </Link>
                    <Link
                      href={`/#spot=${encodeURIComponent(spot.id)}`}
                      className="pressable-sm"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "5px 12px",
                        borderRadius: "var(--r-pill)",
                        background: "var(--violet)",
                        color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      Open on Map
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Other Categories in Area */}
        <section className="spot-section" style={{ marginTop: 32 }}>
          <h2 className="site-section-title">More Dining in {area}</h2>
          <div className="site-related-links">
            <Link href={`/areas/${areaSlug}`}>All {area} Eateries</Link>
            <Link href="/areas">Browse All Areas</Link>
            <Link href="/explore">Browse All Categories</Link>
          </div>
        </section>
      </SiteChrome>

      <BottomNav routed activeKey="map" />
    </div>
  );
}
