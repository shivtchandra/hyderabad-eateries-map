import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";

const SLUG = "/guides/best-ice-cream-desserts-hyderabad";
const TITLE = "Best Ice Cream, Gelato & Desserts in Hyderabad (2026): The Local Guide";
const DESCRIPTION =
  "From 1951 hand-churned pot ice creams at Mozamjahi Market (Famous Ice Cream) to Italian gelato at Milano and stone-slab sundaes at Cream Stone — the ultimate Hyderabad dessert trail.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION),
  },
  keywords: [
    "best ice cream in hyderabad",
    "famous ice cream mozamjahi market review",
    "milano gelato jubilee hills",
    "cream stone hyderabad willy wonka",
    "best desserts in hyderabad 2026",
    "huber and holly hyderabad",
    "late night ice cream hyderabad",
  ],
};

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  url: "https://eats.mapmyhyd.com" + SLUG,
  datePublished: "2026-09-17",
  dateModified: "2026-09-17",
  author: {
    "@type": "Organization",
    name: "Mapping HYD Eats Editorial Team",
  },
  publisher: {
    "@type": "Organization",
    name: "Hyderabad Eats",
    url: "https://eats.mapmyhyd.com",
  },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://eats.mapmyhyd.com" },
    { "@type": "ListItem", position: 2, name: "Guides", item: "https://eats.mapmyhyd.com/guides" },
    { "@type": "ListItem", position: 3, name: "Best Ice Cream & Desserts Guide", item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where can you get the most iconic heritage ice cream in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Famous Ice Cream inside Mozamjahi Market (operating since 1951) is legendary for seasonal hand-churned fruit pot ice creams like Custard Apple (Sitaphal), Sapota (Chiku), Mango, and Anjeer.",
      },
    },
    {
      "@type": "Question",
      name: "Where is the best authentic Italian gelato in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Milano Ice Cream in Jubilee Hills serves authentic Italian artisan gelato and dairy-free fruit sorbets made with imported natural ingredients.",
      },
    },
    {
      "@type": "Question",
      name: "Which Hyderabad ice cream spots are open late at night?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Famous Ice Cream at Mozamjahi Market remains bustling until 12:30 AM – 1:00 AM, and Cream Stone outlets across Banjara Hills, Jubilee Hills, and Gachibowli are open till 1:30 AM – 2:00 AM for post-dinner crowds.",
      },
    },
  ],
};

export default function BestIceCreamGuidePage() {
  return (
    <div style={{ paddingBottom: 84 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <header className="site-header">
        <div className="site-header-inner">
          <SiteBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/stories", label: "Stories & Guides" },
              { href: SLUG, label: "Ice Cream & Desserts Guide" },
            ]}
          />
          <SiteNav active="/stories" />
        </div>
      </header>

      <main className="guide-main" style={{ maxWidth: 840, margin: "0 auto", padding: "24px 20px 60px" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, fontWeight: 700, color: "var(--violet, #7c3aed)", margin: 0 }}>
            Curated Field Guide · 2026 Edition
          </p>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: 1.2, margin: "8px 0 12px", color: "var(--fg, #111)" }}>
            Best Ice Cream, Gelato &amp; Desserts in Hyderabad (2026)
          </h1>
          <p style={{ fontSize: 16, color: "var(--muted, #666)", lineHeight: 1.5, margin: 0 }}>
            Whether you want hand-churned fresh seasonal fruit ice cream served in earthenware cups under the historic arches of Mozamjahi Market, artisan Italian gelato in Jubilee Hills, or theatrical cold stone creations past midnight, here is your definitive dessert trail.
          </p>
        </div>

        {/* AEO Quick Matrix */}
        <section
          style={{
            background: "var(--surface-sunken, #f8fafc)",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 36,
          }}
        >
          <h2 style={{ fontSize: 18, margin: "0 0 12px", color: "var(--fg, #111)" }}>
            🍦 Dessert Decision Matrix (At a Glance)
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, fontSize: 14 }}>
            <div style={{ background: "var(--surface, #fff)", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)" }}>
              <strong>Best Heritage Pot Ice Cream</strong>
              <div style={{ color: "var(--muted, #666)", marginTop: 4 }}>Famous Ice Cream (Mozamjahi Market)</div>
            </div>
            <div style={{ background: "var(--surface, #fff)", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)" }}>
              <strong>Best Authentic Italian Gelato</strong>
              <div style={{ color: "var(--muted, #666)", marginTop: 4 }}>Milano Ice Cream (Jubilee Hills)</div>
            </div>
            <div style={{ background: "var(--surface, #fff)", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)" }}>
              <strong>Best Cold Stone Late-Night Slab</strong>
              <div style={{ color: "var(--muted, #666)", marginTop: 4 }}>Cream Stone (Multiple Outlets, till 2 AM)</div>
            </div>
            <div style={{ background: "var(--surface, #fff)", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)" }}>
              <strong>Best Gourmet Fresh Churned</strong>
              <div style={{ color: "var(--muted, #666)", marginTop: 4 }}>Huber &amp; Holly (Banjara Hills)</div>
            </div>
            <div style={{ background: "var(--surface, #fff)", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)" }}>
              <strong>Best All-Natural Real Fruit</strong>
              <div style={{ color: "var(--muted, #666)", marginTop: 4 }}>Naturals Ice Cream (Tender Coconut)</div>
            </div>
            <div style={{ background: "var(--surface, #fff)", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)" }}>
              <strong>Best European Pastries &amp; Cakes</strong>
              <div style={{ color: "var(--muted, #666)", marginTop: 4 }}>Conçu &amp; Van Lavino (Jubilee Hills)</div>
            </div>
          </div>
        </section>

        {/* Spot Breakdown */}
        <section style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* Famous Ice Cream */}
          <article style={{ borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: 28 }}>
            <h2 style={{ fontSize: 22, margin: "0 0 6px", color: "var(--fg, #111)" }}>
              1. Famous Ice Cream — Mozamjahi Market
            </h2>
            <p style={{ fontSize: 13, color: "var(--violet, #7c3aed)", fontWeight: 600, margin: "0 0 12px" }}>
              Best for: 1951 heritage pot ice cream made with real seasonal fruit pulps
            </p>
            <p style={{ lineHeight: 1.6, color: "var(--fg, #333)", fontSize: 15 }}>
              Founded in 1951 within the historic stone arches of Mozamjahi Market (MJ Market), Famous Ice Cream is an indispensable Hyderabad tradition. They churn fresh milk and seasonal fruits in wooden-encased metal pots using ice and rock salt. The texture is distinctly rustic, non-commercial, and light on the palate.
            </p>
            <div style={{ background: "var(--surface-sunken, #f8fafc)", padding: "12px 16px", borderRadius: 8, fontSize: 14, margin: "14px 0" }}>
              <strong>💡 Pro Tip:</strong> Sitaphal (custard apple) in winter and Mango/Sapota in summer are non-negotiable. It costs under ₹50–₹70 per cup, making it the highest value authentic dessert in the city.
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 14 }}>
              <strong>Must Order:</strong> Sitaphal (Custard Apple), Sapota (Chiku), Mango, Anjeer (Fig).
            </p>
          </article>

          {/* Milano Ice Cream */}
          <article style={{ borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: 28 }}>
            <h2 style={{ fontSize: 22, margin: "0 0 6px", color: "var(--fg, #111)" }}>
              2. Milano Ice Cream — Jubilee Hills
            </h2>
            <p style={{ fontSize: 13, color: "var(--violet, #7c3aed)", fontWeight: 600, margin: "0 0 12px" }}>
              Best for: Authentic Italian artisan gelato, pure Sicilian pistachio, and fruit sorbets
            </p>
            <p style={{ lineHeight: 1.6, color: "var(--fg, #333)", fontSize: 15 }}>
              For those seeking true Italian gelato with slow-churned dense texture and lower butterfat than American ice creams, Milano is unmatched in Hyderabad. Their pistachio gelato is made with genuine roasted nut paste without artificial coloring, and their dark chocolate and dairy-free passionfruit sorbets are velvety and vibrant.
            </p>
            <p style={{ margin: "12px 0 0", fontSize: 14 }}>
              <strong>Must Order:</strong> Pistachio Gelato, Dark Chocolate, Salted Caramel, Raspberry Sorbet in fresh waffle cone.
            </p>
          </article>

          {/* Cream Stone */}
          <article style={{ borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: 28 }}>
            <h2 style={{ fontSize: 22, margin: "0 0 6px", color: "var(--fg, #111)" }}>
              3. Cream Stone — Banjara Hills, Jubilee Hills, Gachibowli &amp; Citywide
            </h2>
            <p style={{ fontSize: 13, color: "var(--violet, #7c3aed)", fontWeight: 600, margin: "0 0 12px" }}>
              Best for: Midnight cold slab theater, Willy Wonka fudge bowls, and late-night cravings
            </p>
            <p style={{ lineHeight: 1.6, color: "var(--fg, #333)", fontSize: 15 }}>
              Cream Stone turned post-dinner dessert runs into a Hyderabad ritual. Ice cream scoops are chopped, blended with fudges, brownies, fresh berries, and nuts on frozen granite slabs before being scooped into waffle bowls. With outlets open until 1:30 AM – 2:00 AM, it remains the quintessential weekend hangout for families and friends.
            </p>
            <p style={{ margin: "12px 0 0", fontSize: 14 }}>
              <strong>Must Order:</strong> Willy Wonka, Devil’s Brownie, Fruit Factory, Ferrero Rocher Crunch.
            </p>
          </article>

          {/* Huber & Holly */}
          <article style={{ borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: 28 }}>
            <h2 style={{ fontSize: 22, margin: "0 0 6px", color: "var(--fg, #111)" }}>
              4. Huber &amp; Holly — Banjara Hills &amp; Jubilee Hills
            </h2>
            <p style={{ fontSize: 13, color: "var(--violet, #7c3aed)", fontWeight: 600, margin: "0 0 12px" }}>
              Best for: Freshly churned gourmet scoops, charcoal waffle cones, and luxury dessert sundaes
            </p>
            <p style={{ lineHeight: 1.6, color: "var(--fg, #333)", fontSize: 15 }}>
              By Havmor's premium vertical, Huber &amp; Holly freshly churns small batches on-site every few hours. Famous for its black charcoal waffle cones and high-end dessert creations like the 24k gold leaf "Mighty Midas" cone and rich Belgian chocolate truffle pots.
            </p>
            <p style={{ margin: "12px 0 0", fontSize: 14 }}>
              <strong>Must Order:</strong> Belgian Dark Chocolate, Charcoal Cone with Hazelnut Rocher, Mighty Midas.
            </p>
          </article>

          {/* Naturals Ice Cream */}
          <article style={{ borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: 28 }}>
            <h2 style={{ fontSize: 22, margin: "0 0 6px", color: "var(--fg, #111)" }}>
              5. Naturals Ice Cream — Multiple Outlets
            </h2>
            <p style={{ fontSize: 13, color: "var(--violet, #7c3aed)", fontWeight: 600, margin: "0 0 12px" }}>
              Best for: Clean, simple real-fruit seasonal scoops with zero artificial preservatives
            </p>
            <p style={{ lineHeight: 1.6, color: "var(--fg, #333)", fontSize: 15 }}>
              Naturals remains the gold standard for fruit purists. Tender Coconut with fresh coconut malai chunks and seasonal mango or jackfruit provide clean, comforting sweetness without heavy syrups.
            </p>
            <p style={{ margin: "12px 0 0", fontSize: 14 }}>
              <strong>Must Order:</strong> Tender Coconut, Sitaphal, Alphonso Mango, Roasted Almond.
            </p>
          </article>

        </section>

        <section style={{ marginTop: 40, borderTop: "1px solid var(--border, #e2e8f0)", paddingTop: 24 }}>
          <h3 style={{ fontSize: 16, margin: "0 0 12px" }}>Explore More Curated Guides &amp; Food Maps:</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/guides/best-cafes-hyderabad-reddit" className="site-pill">Best Cafes &amp; Coffee Guide</Link>
            <Link href="/guides/best-biryani-hyderabad-reddit" className="site-pill">Best Biryani Guide</Link>
            <Link href="/guides/best-tiffins-hyderabad-reddit" className="site-pill">Best Tiffins Guide</Link>
            <Link href="/guides/late-night-food-hyderabad-reddit" className="site-pill">Late Night Food Guide</Link>
            <Link href="/explore/ice-cream" className="site-pill">Browse Ice Cream Spots on Map</Link>
          </div>
        </section>
      </main>

      <SiteRelated
        links={[
          { href: "/explore/ice-cream", label: "Ice Cream Spots on Map" },
          { href: "/explore/cafes", label: "Cafes & Bakeries" },
          { href: "/areas/banjara-hills", label: "Banjara Hills Food" },
          { href: "/stories", label: "All Food Stories & Guides" },
        ]}
      />
      <SiteFooter />
    </div>
  );
}
