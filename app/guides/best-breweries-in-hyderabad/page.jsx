import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import { Icon } from "../../components/Icons.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";
import { spotPhotoUrl } from "../../../lib/photos.js";

const SLUG = "/guides/best-breweries-in-hyderabad";
const TITLE = "Best Breweries in Hyderabad (2026): Top Microbreweries & Craft Beers";
const DESCRIPTION =
  "The definitive local guide to Hyderabad's top microbreweries: Prost, Zero40, Broadway, Windmills, Forge, Red Rhino, Zythum, and Onegolf. Craft beers on tap, vibes, and what to order.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION),
  },
  keywords: [
    "best breweries in hyd",
    "best breweries in hyderabad",
    "best microbreweries in hyderabad",
    "craft beer hyderabad",
    "best breweries in jubilee hills",
    "microbrewery hyderabad",
    "prost hyderabad review",
    "zero40 brewing hyderabad",
    "broadway the brewery hyderabad",
    "windmills craftworks hyderabad",
    "forge breu hous hyderabad",
    "breweries financial district hyderabad",
    "top breweries in hyderabad with price",
  ],
};

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  url: "https://eats.mapmyhyd.com" + SLUG,
  datePublished: "2026-10-09",
  dateModified: "2026-10-09",
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
    { "@type": "ListItem", position: 2, name: "Stories & Guides", item: "https://eats.mapmyhyd.com/stories" },
    { "@type": "ListItem", position: 3, name: "Best Breweries Guide", item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which brewery in Hyderabad has the best craft beer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Zero40 Brewing (Jubilee Hills & Financial District) and Windmills Craftworks (Madhapur) are widely considered the benchmark craft beer purists in Hyderabad. Zero40 is praised for its seasonal Belgian Wits and Cherry Beer-Ritas, while Windmills crafts exceptional German Hefeweizens and Golden Ales.",
      },
    },
    {
      "@type": "Question",
      name: "What are the best microbreweries in Jubilee Hills?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Jubilee Hills is Hyderabad's microbrewery capital. Top spots include Prost Brewpub (steampunk landmark with 18,000+ reviews), Broadway The Brewery (massive glasshouse with sports screenings and wood-fired pizzas), Zero40 Brewing (relaxing alfresco vibes), Forge Breu-Hous (poolside deck), and Zythum Brewing Co.",
      },
    },
    {
      "@type": "Question",
      name: "Which breweries are best in Financial District & Madhapur?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In the Cyberabad / Financial District tech corridor, the top breweries are Zero40 Financial District (sprawling green lawns), Red Rhino at Dallas Center, Windmills Craftworks in Sattva Knowledge City, Onegolf Brewery (with golf simulators), and The Beer Cartel in Sattva Knowledge Park.",
      },
    },
    {
      "@type": "Question",
      name: "What is the average cost for two at Hyderabad microbreweries?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A craft beer session for two in Hyderabad typically ranges between ₹1,800 and ₹2,600, covering a beer sampler flight (or 3-4 pints) and two food starters or pizzas. Windmills Craftworks sits on the higher end (₹2,800+), while daytime happy hours and weekday flights offer great value across most spots.",
      },
    },
    {
      "@type": "Question",
      name: "What fresh craft beer styles are brewed in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most Hyderabad microbreweries pour 5-8 styles on tap: Belgian Witbier (citrus/coriander), German Hefeweizen (banana/clove notes), Irish Red Ale, Apple Cider, India Pale Ale (IPA), and Oatmeal or Chocolate Stouts. Seasonal brews like Mango Wit and Spiced Ales frequently rotate during summer and winter.",
      },
    },
  ],
};

const SPOTS = [
  {
    id: "prost",
    name: "Prost Brewpub",
    tag: "Landmark Pioneer",
    tagBg: "#fef3c7",
    tagColor: "#92400e",
    area: "Road No. 45, Jubilee Hills",
    href: "/spot/prost-jubilee-hills",
    photo: spotPhotoUrl("ChIJPU_G2E6RyzsRs95LdTHxZek"),
    rating: "4.3",
    reviews: "18,800+ Google reviews",
    priceForTwo: "₹2,200 for two",
    verdict:
      "The enduring heavyweight of Hyderabad's brewery revolution. Spanning multiple levels with rustic industrial steampunk decor, exposed brick, and copper pipes, Prost is energetic, loud, and consistently packed. Their apple cider and wheat brews remain the gateway craft beers for half the city.",
    craftBeers: "Apple Cider, Belgian Wit, Bangalore Daze IPA, Stout.",
    whatToOrder: "Craft beer sampler flight, Bavarian Pretzel with beer cheese, Crackling Pork, Pepperoni Pizza.",
    vibeTip: "High-energy, DJ music, weekend rush. Arrive before 7:30 PM on Friday/Saturday or book well ahead to avoid long door waits.",
    quote: "“Prost set the bar for microbreweries in Hyderabad. The apple cider is crisp and easy-drinking, and the multi-level steampunk vibe is legendary.”",
  },
  {
    id: "zero40",
    name: "Zero40 Brewing",
    tag: "Craft Beer Purist",
    tagBg: "#f0fdf4",
    tagColor: "#166534",
    area: "Road No. 10, Jubilee Hills & Financial District",
    href: "/spot/zero40-brewing-jubilee-hills",
    photo: spotPhotoUrl("ChIJZ_3mlzCRyzsRNcddIknL_CU"),
    rating: "4.3",
    reviews: "14,000+ Google reviews",
    priceForTwo: "₹2,000 for two",
    verdict:
      "Named after Hyderabad's dialing code (040), this is the city's darling for true craft beer lovers. Zero40 keeps the focus squarely on brewing excellence: balanced Belgian Wits, bold IPAs, and playful house concoctions like the Cherry Beer-Rita. The Jubilee Hills branch features a sunlit glasshouse and green courtyards, while Financial District offers sprawling lawns.",
    craftBeers: "Vincent Van Wit (Belgian Wit), Reet (Ginger Beer), Cherry Beer-Rita, Goa Sling.",
    whatToOrder: "Beer tasting flight, Ghee Roast Chicken Pizza, Pulled Pork Sliders, Buffalo Wings.",
    vibeTip: "Relaxed, breezy, great conversation volume outdoors during early evenings.",
    quote: "“If you genuinely care about craft beer nuance rather than just loud party music, Zero40 is the top spot in Hyderabad.”",
  },
  {
    id: "broadway",
    name: "Broadway The Brewery",
    tag: "Massive Energy & Screenings",
    tagBg: "#fdf2f8",
    tagColor: "#86198f",
    area: "CBI Colony, Jubilee Hills",
    href: "/spot/broadway-the-brewery",
    photo: spotPhotoUrl("ChIJ7Ytbpx2RyzsRhX0HHSG12lQ"),
    rating: "4.3",
    reviews: "10,800+ Google reviews",
    priceForTwo: "₹2,200 for two",
    verdict:
      "A monumental, glass-walled microbrewery that feels like an amphitheatre of craft beer. Gleaming copper kettles tower behind the bar, while massive projector screens make it Hyderabad's top destination for cricket and football match nights. Ranked #1 in both the Best Brewery and Best Chicken Pizza city polls.",
    craftBeers: "Irish Red Ale, Belgian Witbier, Apple Cider, Dark Matter Stout.",
    whatToOrder: "Craft beer sampler, Wood-Fired Chicken Pizza, Ghee Roast Chicken, Truffle Fries.",
    vibeTip: "Electric and buzzing during big match screenings and weekend DJ sets. Great al fresco terrace.",
    quote: "“The sheer scale and stadium energy of Broadway make it unbeatable on game days. And the wood-fired pizzas rival standalone Italian pizzerias.”",
  },
  {
    id: "windmills",
    name: "Windmills Craftworks",
    tag: "Library Vibe & Refined Dining",
    tagBg: "#eff6ff",
    tagColor: "#1d4ed8",
    area: "Sattva Knowledge City, Madhapur",
    href: "/spot/windmills-craftworks-madhapur-madhapur",
    photo: spotPhotoUrl("ChIJV47u-zeTyzsRg1GyNX8ogOQ"),
    rating: "4.6",
    reviews: "Top-rated in Cyberabad",
    priceForTwo: "₹2,800 for two",
    verdict:
      "Windmills does not feel like a typical beer hall; it feels like an upscale library lounge with world-class acoustic architecture. Lined with hundreds of curated design books, soft leather seating, and warm lighting, it pours pristine German Hefeweizen and Golden Ales alongside sophisticated global cuisine.",
    craftBeers: "German Hefeweizen, Golden Ale, Stout, India Pale Ale.",
    whatToOrder: "Hefeweizen pint, Butternut Squash Risotto, Mango-Coconut Stew, Bacon-Wrapped Sausages.",
    vibeTip: "Cozy, refined, conversational. The perfect brewery date night where you can actually hear each other speak without shouting.",
    quote: "“Unmatched elegance. You drink pristine craft beer surrounded by floor-to-ceiling books and smooth jazz.”",
  },
  {
    id: "forge",
    name: "Forge Breu-Hous",
    tag: "Poolside Deck & Industrial Loft",
    tagBg: "#fff7ed",
    tagColor: "#9a3412",
    area: "Road No. 36, Jubilee Hills",
    href: "/spot/forge-breu-hous-jubilee-hills",
    photo: spotPhotoUrl("ChIJR3kyF-6RyzsR7s1vrhhYBEg"),
    rating: "4.5",
    reviews: "3,100+ Google reviews",
    priceForTwo: "₹2,000 for two",
    verdict:
      "Industrial chic done right. Forge pairs exposed steel and warehouse aesthetics with an open poolside deck and breezy rooftop terrace. Their brewing team takes creative liberties, delivering refreshing fruit ciders and crisp witbiers that go down remarkably smooth in Hyderabad's warm evenings.",
    craftBeers: "Loki’s Wit, Adam’s Route Cider, House IPA, Belgian Blonde.",
    whatToOrder: "Flight of four beers, Peri Peri Chicken Skewers, Crisp Calamari, Thin-Crust Pizzas.",
    vibeTip: "Poolside deck tables during sunset are the prime seats. Great casual social atmosphere.",
    quote: "“Forge's cider by the pool on a breezy evening is one of Jubilee Hills' most underrated chill experiences.”",
  },
  {
    id: "redrhino",
    name: "Red Rhino",
    tag: "Tech Belt Taproom",
    tagBg: "#f5f3ff",
    tagColor: "#6d28d9",
    area: "Dallas Center, Financial District & Madhapur",
    href: "/spot/red-rhino-madhapur",
    photo: spotPhotoUrl("ChIJ97bwQweTyzsRdFUn0_v-2eA"),
    rating: "4.5",
    reviews: "4,300+ Google reviews",
    priceForTwo: "₹2,200 for two",
    verdict:
      "Originally famous in Bangalore, Red Rhino brought its celebrated craft beers to Hyderabad's tech corridors. Featuring sleek private dining booths, high ceilings, and a polished taproom, it's the undisputed gold standard for corporate teams in Raidurg and Financial District looking for top-flight IPAs.",
    craftBeers: "Bangalore Daze IPA, Belgian Wit, Black Knight Stout, Soul Beetle.",
    whatToOrder: "Bangalore Daze pint, Mezze Platter, Wood-Fired Margherita, Chilli Pork.",
    vibeTip: "Ideal after-work corporate wind-down from 6 PM to 9 PM; transforms into a lively taproom later.",
    quote: "“Bangalore Daze is genuinely one of the best IPAs in southern India. Having it on tap right at Dallas Center is a blessing for tech folks.”",
  },
  {
    id: "zythum",
    name: "Zythum Brewing Co.",
    tag: "Egyptian Themed Alfresco",
    tagBg: "#fef9c3",
    tagColor: "#854d0e",
    area: "Road No. 36, Jubilee Hills",
    href: "/spot/zythum-brewing-co-jubilee-hills",
    photo: spotPhotoUrl("ChIJ26RxOfiRyzsR8Q68u_UqP2Y"),
    rating: "4.5",
    reviews: "3,800+ Google reviews",
    priceForTwo: "₹2,000 for two",
    verdict:
      "Spanning three distinct floors with dramatic Egyptian-inspired murals and hieroglyphic accents, Zythum pairs expansive community seating with a breezy rooftop. Known for generous beer flights and reliable live musical performances on weekend nights.",
    craftBeers: "Zythos Signature, Spaten Wheat, House Lager, Dark Dunkel.",
    whatToOrder: "Zythos sampler, Loaded Nachos Grande, Spicy Chicken Tikka, Crispy Chilli Corn.",
    vibeTip: "Top floor terrace is breezy and scenic; live acoustic singers often perform on Thursdays and Sundays.",
    quote: "“Massive community tables and a great rooftop. The Spaten wheat beer is remarkably refreshing.”",
  },
  {
    id: "onegolf",
    name: "Onegolf Brewery",
    tag: "Craft Beer & Golf Simulators",
    tagBg: "#ecfdf5",
    tagColor: "#065f46",
    area: "Financial District / Gandipet",
    href: "/spot/onegolf-brewery-financial-district",
    photo: spotPhotoUrl("ChIJN3OZCzOTyzsRMnzgaAdgXKM"),
    rating: "4.3",
    reviews: "7,100+ Google reviews",
    priceForTwo: "₹2,500 for two",
    verdict:
      "A unique experiential brewery concept in Cyberabad that merges craft brewing with virtual golf simulator bays and expansive outdoor lawns. Perfect for active groups who want to swing clubs with a freshly poured Belgian Wit in hand.",
    craftBeers: "Belgian Wit, German Wheat, House Amber, Craft Cider.",
    whatToOrder: "Craft beer pitcher, Handcrafted Burgers, Loaded Fries, BBQ Chicken Wings.",
    vibeTip: "Book a simulator bay ahead of time for weekend parties; lawn seating is great for large corporate groups.",
    quote: "“Simulator golf combined with fresh craft beer is an absolute blast for weekend group outings.”",
  },
  {
    id: "hoppery",
    name: "The Hoppery",
    tag: "Lake Views & Garden Cottage",
    tagBg: "#f0fdf4",
    tagColor: "#15803d",
    area: "Road No. 36, Jubilee Hills",
    href: "/spot/the-hoppery-road-no-36-jh",
    photo: spotPhotoUrl("ChIJSfsvCFGRyzsRVVHDEqPTedg"),
    rating: "4.1",
    reviews: "1,600+ Google reviews",
    priceForTwo: "₹2,200 for two",
    verdict:
      "Perched beside Durgam Cheruvu on the Olive Bistro property, The Hoppery feels like a whimsical glasshouse and European garden pavilion. While smaller than the mega-breweries, its intimate sunset lake views and gourmet European menu make it a perennial romantic favorite.",
    craftBeers: "House Witbier, Apple & Pear Cider, English Pale Ale.",
    whatToOrder: "Craft Apple Cider, Truffle Fries, Artisanal Thin Crust Pizza, Grilled Fish.",
    vibeTip: "Arrive around 5:30 PM for sunset over Durgam Cheruvu. The outdoor pavilion lights up gorgeously by dusk.",
    quote: "“The lake view and glasshouse charm make this the prettiest boutique brewery in Jubilee Hills.”",
  },
  {
    id: "beercartel",
    name: "The Beer Cartel",
    tag: "Office Corridor Quick Pints",
    tagBg: "#fef2f2",
    tagColor: "#991b1b",
    area: "Sattva Knowledge Park, Raidurg",
    href: "/spot/the-beer-cartel",
    photo: spotPhotoUrl("ChIJEy_-QQCTyzsR_6KR4VJT4t8"),
    rating: "4.5",
    reviews: "1,100+ Google reviews",
    priceForTwo: "₹1,800 for two",
    verdict:
      "Strategically situated inside Sattva Knowledge Park, The Beer Cartel caters to the bustling Raidurg tech belt. Fast service, crisp craft lagers on tap, and hearty finger snacks make it the prime choice for quick team celebrations without sitting in cross-city traffic.",
    craftBeers: "Craft Pilsner, Belgian Wit, Seasonal Fruit Brews.",
    whatToOrder: "Cold beer flight, Butter Garlic Prawns, Cartel Chicken Wings, Masala Peanut chaat.",
    vibeTip: "Peak crowds hit immediately between 5:30 PM and 8 PM as offices empty out.",
    quote: "“The quickest, easiest place in Knowledge Park to grab fresh beers right after clocking out.”",
  },
];

const itemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: TITLE,
  description: DESCRIPTION,
  numberOfItems: SPOTS.length,
  itemListElement: SPOTS.map((s, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: s.name,
    url: "https://eats.mapmyhyd.com" + s.href,
  })),
};

export default function BestBreweriesGuidePage() {
  return (
    <div className="site-page" style={{ paddingBottom: 84 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <header className="site-header">
        <div className="site-header-inner">
          <SiteNav active="/stories" />
          <BackButton fallback="/stories" />
          <SiteBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/stories", label: "Stories & Guides" },
              { href: SLUG, label: "Best Breweries Guide" },
            ]}
          />
          <div className="site-hero">
            <h1>Best Breweries in Hyderabad (2026)</h1>
            <p>
              The definitive local field guide to Hyderabad’s top microbreweries: fresh craft beers on tap, tasting flights, wood-fired pizzas, and where to book for date night vs match screenings.
            </p>
          </div>
        </div>
      </header>

      <main className="site-body">
        {/* Byline */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: "1.5px solid var(--line)" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--violet)" }}>
              Editorial Field Guide · Verified Local Consensus
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>
              Updated October 2026 · Microbreweries &amp; craft beer trails
            </div>
          </div>
          <Link href="/rankings/best-brewery-in-hyderabad" style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: "var(--violet)", textDecoration: "none", padding: "8px 14px", borderRadius: 999, background: "var(--violet-wash)" }}>
            Vote in Weekly Race →
          </Link>
        </div>

        {/* Quick Picks Summary Card */}
        <section
          style={{
            background: "var(--paper)",
            border: "1.5px solid var(--line)",
            borderRadius: 14,
            padding: "20px 22px",
            marginBottom: 32,
            boxShadow: "var(--e1, 0 1px 3px rgba(0,0,0,0.05))",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 20, margin: "0 0 14px", color: "var(--ink)" }}>
            Quick Decision Guide: Where to Go
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Steampunk Landmark &amp; Energy</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Prost Brewpub</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Crisp Apple Cider &amp; Pretzels (Jubilee Hills)</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Craft Beer Purist</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Zero40 Brewing</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Belgian Wit &amp; Cherry Beer-Rita (JH &amp; Fin Dist)</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Match Screenings &amp; Pizza</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Broadway The Brewery</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Huge glasshouse &amp; Wood-fired pizza (Jubilee Hills)</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Quiet Date Night &amp; Jazz</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Windmills Craftworks</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Library atmosphere &amp; German Hefeweizen (Madhapur)</div>
            </div>
          </div>
        </section>

        {/* Spot Deep Dives */}
        <section style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {SPOTS.map((s, idx) => (
            <article
              key={s.id}
              style={{
                background: "var(--paper)",
                border: "1.5px solid var(--line)",
                borderRadius: 14,
                padding: "22px 24px",
                boxShadow: "var(--e1, 0 1px 3px rgba(0,0,0,0.05))",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>#{idx + 1}</span>
                    <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(20px, 3.5vw, 24px)", margin: 0, color: "var(--ink)" }}>
                      {s.name}
                    </h2>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", marginTop: 4, flexWrap: "wrap" }}>
                    <span><Icon name="locate" size={12} width={2} color="var(--muted)" /> {s.area}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 700, color: "var(--ink)" }}>★ {s.rating}</span>
                    <span>({s.reviews})</span>
                    <span>•</span>
                    <span>{s.priceForTwo}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: s.tagBg || "var(--cream)",
                      color: s.tagColor || "var(--ink)",
                    }}
                  >
                    {s.tag}
                  </span>
                  <Link
                    href={s.href}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--violet)",
                      textDecoration: "none",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "var(--violet-wash)",
                    }}
                  >
                    View on map →
                  </Link>
                </div>
              </div>

              {s.photo && (
                <div style={{ margin: "14px 0", borderRadius: 12, overflow: "hidden", maxHeight: 320, background: "var(--cream)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.photo}
                    alt={s.name}
                    style={{ width: "100%", height: "100%", maxHeight: 320, objectFit: "cover", display: "block" }}
                    loading="lazy"
                  />
                </div>
              )}

              <p className="review-prose" style={{ margin: "0 0 16px", fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft, #333)" }}>
                {s.verdict}
              </p>

              <div style={{ background: "var(--cream)", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13.5, color: "var(--ink)" }}>
                  <strong style={{ color: "var(--violet)", flexShrink: 0 }}>🍺 On Tap:</strong>
                  <span>{s.craftBeers}</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13.5, color: "var(--ink)", marginTop: 6 }}>
                  <Icon name="utensils" size={13} width={2} color="var(--ink-soft)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span><strong style={{ color: "var(--ink)" }}>Must order food:</strong> {s.whatToOrder}</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                  <Icon name="clock" size={13} width={2} color="var(--muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span><strong style={{ color: "var(--ink)" }}>Vibe &amp; seating tip:</strong> {s.vibeTip}</span>
                </div>
              </div>

              <blockquote
                style={{
                  margin: 0,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--violet-wash)",
                  border: "1.5px solid var(--line)",
                  fontFamily: "var(--font-fraunces), serif",
                  fontSize: 14,
                  fontStyle: "italic",
                  lineHeight: 1.45,
                  color: "var(--ink)",
                }}
              >
                {s.quote}
              </blockquote>
            </article>
          ))}
        </section>

        {/* FAQs */}
        <section style={{ marginTop: 40, borderTop: "1.5px solid var(--line)", paddingTop: 28 }}>
          <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 22, color: "var(--ink)", marginBottom: 16 }}>
            Frequently Asked Questions: Hyderabad Breweries
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqLd.mainEntity.map((faq, i) => (
              <details
                key={i}
                style={{
                  background: "var(--paper)",
                  border: "1.5px solid var(--line)",
                  borderRadius: 10,
                  padding: "14px 18px",
                }}
              >
                <summary style={{ fontWeight: 700, fontSize: 15, cursor: "pointer", color: "var(--ink)" }}>
                  {faq.name}
                </summary>
                <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>
                  {faq.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Explore Hub Pills */}
        <section style={{ marginTop: 36, borderTop: "1.5px solid var(--line)", paddingTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--violet)", marginBottom: 10 }}>
            More Curated Guides &amp; Explore Hubs
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Link href="/rankings/best-brewery-in-hyderabad" className="site-pill">Vote in Best Brewery Race</Link>
            <Link href="/guides/best-cafes-hyderabad-reddit" className="site-pill">Best Cafes in Hyderabad</Link>
            <Link href="/guides/best-biryani-hyderabad-reddit" className="site-pill">Best Biryani Guide</Link>
            <Link href="/guides/late-night-food-hyderabad-reddit" className="site-pill">Late Night Food Guide</Link>
            <Link href="/guides/restaurants-in-sattva-knowledge-city-hyderabad" className="site-pill">Sattva Knowledge City Guide</Link>
            <Link href="/areas/jubilee-hills" className="site-pill">Jubilee Hills Food &amp; Nightlife</Link>
          </div>
        </section>
      </main>

      <SiteRelated
        links={[
          { href: "/rankings/best-brewery-in-hyderabad", label: "Best Brewery Weekly Ranking" },
          { href: "/areas/jubilee-hills", label: "Jubilee Hills Breweries & Eateries" },
          { href: "/explore/restaurants", label: "Restaurants & Bars on Map" },
          { href: "/stories", label: "All Food Stories & Guides" },
        ]}
      />
      <SiteFooter />
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="stories" />
      </div>
    </div>
  );
}
