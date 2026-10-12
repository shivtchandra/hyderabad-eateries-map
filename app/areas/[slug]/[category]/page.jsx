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

export const revalidate = 86400;

export function generateStaticParams() {
  return allAreaCategoryCombinations().map((c) => ({
    slug: c.areaSlug,
    category: c.categorySlug,
  }));
}

export function generateMetadata({ params }) {
  const data = getAreaCategoryData(params.slug, params.category);
  if (!data) return { title: "Not found, Hyderabad Eats" };
  const year = new Date().getFullYear();
  const title = `Best ${data.category.label} in ${data.area} (${year})`;
  const description = `Top-rated ${data.category.label.toLowerCase()} in ${data.area}, Hyderabad. ${data.spots.length} curated spots with ratings, must-order dishes, menu prices, and live map pins.`;
  return {
    ...pageMeta({ title, description, path: `/areas/${params.slug}/${params.category}` }),
    openGraph: {
      ...pageMeta({ title, description, path: `/areas/${params.slug}/${params.category}` }).openGraph,
      images: ogImages(title, description, `/areas/${params.slug}`),
    },
  };
}

export default function AreaCategoryPage({ params }) {
  const data = getAreaCategoryData(params.slug, params.category);
  if (!data) notFound();

  const { area, category, spots, areaSlug } = data;
  const siteUrl = getSiteUrl();
  const year = new Date().getFullYear();
  const topSpots = spots.slice(0, 35);

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: "Areas", url: `${siteUrl}/areas` },
    { name: area, url: `${siteUrl}/areas/${areaSlug}` },
    { name: category.label, url: `${siteUrl}/areas/${areaSlug}/${params.category}` },
  ]);

  const itemsLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${category.label} in ${area}, Hyderabad`,
    itemListElement: topSpots.map((spot, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: spot.name,
      url: `${siteUrl}${spotPath(spot)}`,
    })),
  };

  return (
    <div style={{ paddingBottom: 84 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemsLd) }} />

      <SiteChrome
        active="/areas"
        breadcrumb={[
          { href: "/", label: "Home" },
          { href: "/areas", label: "Areas" },
          { href: `/areas/${areaSlug}`, label: area },
          { href: `/areas/${areaSlug}/${params.category}`, label: category.label },
        ]}
        title={`Best ${category.label} in ${area} (${year})`}
        description={`Top-rated ${category.label.toLowerCase()} in ${area}, Hyderabad. Showing top ${topSpots.length} of ${spots.length} mapped spots.`}
        related={[
          { href: `/?tab=map`, label: "Open full map" },
          { href: `/areas/${areaSlug}`, label: `All food in ${area}` },
          { href: `/explore/${params.category}`, label: `All ${category.label} in HYD` },
          { href: "/race", label: "The Food Race" },
          { href: "/rankings", label: "Community rankings" },
        ]}
      >
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
            href="/race"
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
            Top {category.label} in {area} ({topSpots.length})
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            {topSpots.map((spot, i) => {
              const tierKey = spot.tier || tierFor(spot.ratingCount || 0);
              const tier = TIERS[tierKey] || TIERS["hidden-gem"];

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
                        <span style={{
                          fontFamily: "Fraunces, serif",
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--muted)",
                        }}>
                          #{i + 1}
                        </span>
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
                            ★ {Number(spot.rating).toFixed(1)} {spot.ratingCount ? `(${spot.ratingCount.toLocaleString("en-IN")})` : ""}
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
                      background: "rgba(38,48,92,0.04)",
                      padding: "6px 12px",
                      borderRadius: 10,
                      fontWeight: 500,
                    }}>
                      <strong style={{ color: "var(--violet-deep)" }}>Must-Try:</strong> {spot.signatureDish.name}
                      {spot.signatureDish.why ? ` — ${spot.signatureDish.why}` : ""}
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
                      View Menu &amp; Reviews →
                    </Link>
                    <Link
                      href={`/?spot=${encodeURIComponent(spot.id)}`}
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
