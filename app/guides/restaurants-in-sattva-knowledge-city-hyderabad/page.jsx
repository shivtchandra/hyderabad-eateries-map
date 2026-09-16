import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import { photoPathToCdn, spotPhotoUrl } from "../../../lib/photos.js";

const SLUG = "/guides/restaurants-in-sattva-knowledge-city-hyderabad";
const TITLE = "Complete Restaurant Guide: Sattva Knowledge City, Knowledge Park, THE LOFT & RMZ Nexity";
const DESCRIPTION =
  "Every restaurant, cafe, bar and brewery across Sattva Knowledge City, Sattva Knowledge Park, THE LOFT and RMZ Nexity in Hyderabad, plus standalone spots around Raidurg and Hi-Tech City.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION),
  },
  keywords: [
    "restaurants in Sattva Knowledge City",
    "Sattva Knowledge City food guide",
    "Sattva Knowledge Park restaurants",
    "THE LOFT Hyderabad restaurants",
    "RMZ Nexity restaurants Hyderabad",
    "restaurants near Knowledge City Hyderabad",
    "Raidurg restaurants",
    "Hitec City restaurants",
    "cafes near Knowledge City Hyderabad",
    "where to eat near Sattva Knowledge City",
    "Knowledge City Hyderabad F&B",
    "breweries near HITEC City Hyderabad",
  ],
};

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  url: "https://eats.mapmyhyd.com" + SLUG,
  datePublished: "2026-09-12",
  dateModified: "2026-09-12",
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
    { "@type": "ListItem", position: 2, name: "Areas", item: "https://eats.mapmyhyd.com/areas" },
    { "@type": "ListItem", position: 3, name: TITLE, item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What restaurants are in Sattva Knowledge City?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sattva Knowledge City has over 25 F&B options including Monastery (brewery), Burma Burma, Toscano, Windmills Craftworks, Hard Rock Cafe, Baan PhadThai, Narumi, SALT, Manam, and more across dining, cafes and bars.",
      },
    },
    {
      "@type": "Question",
      name: "What are the best restaurants in Sattva Knowledge City?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Popular choices include Monastery for a brewery experience, Burma Burma for Burmese vegetarian food, Windmills Craftworks for craft beer, Toscano for Italian, and Manam for coffee and desserts.",
      },
    },
    {
      "@type": "Question",
      name: "What restaurants are in THE LOFT Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "THE LOFT has Fireback (Thai), HOSA (Contemporary South Indian), Akina (Asian), One8 Commune (Multi-Cuisine), TrueBlack cafe, and cocktail bars Barback, Dandy & Dandy, and Swing Lounge.",
      },
    },
    {
      "@type": "Question",
      name: "What food options are available in RMZ Nexity?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "RMZ Nexity has Chili's, Nando's, KOKO (Asian), Paul (European), California Burrito (Mexican), Van Lavino cafe, Chit Chat Chai, Radio Bar, and The Marketplace food court.",
      },
    },
    {
      "@type": "Question",
      name: "Are there breweries near Sattva Knowledge City?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Windmills Craftworks and Monastery are both inside Sattva Knowledge City. Red Rhino at Dallas Center is a nearby brewery. Sattva Knowledge Park has Beer Cartel.",
      },
    },
  ],
};

const VENUE_TAGS = {
  "Brewery": { bg: "#eef2ff", color: "#4338ca" },
  "Vegetarian": { bg: "#f0fdf4", color: "#166534" },
  "Italian": { bg: "#fef3c7", color: "#92400e" },
  "Bar": { bg: "#fdf2f8", color: "#86198f" },
  "Local": { bg: "#fff7ed", color: "#9a3412" },
  "South Indian": { bg: "#fff7ed", color: "#9a3412" },
  "Thai": { bg: "#f0fdf4", color: "#166534" },
  "Asian": { bg: "#f0f9ff", color: "#0369a1" },
  "American": { bg: "#fef3c7", color: "#92400e" },
  "Cafe": { bg: "#f8fafc", color: "#475569" },
  "Bakery": { bg: "#fef3c7", color: "#92400e" },
  "Snacks": { bg: "#fff7ed", color: "#9a3412" },
  "Wine bar": { bg: "#fdf2f8", color: "#86198f" },
  "Mediterranean": { bg: "#f0f9ff", color: "#0369a1" },
  "Sports bar": { bg: "#fef3c7", color: "#92400e" },
  "Cocktail bar": { bg: "#fdf2f8", color: "#86198f" },
  "Desserts": { bg: "#fdf2f8", color: "#86198f" },
  "Multi-cuisine": { bg: "#f8fafc", color: "#475569" },
  "Tex-Mex": { bg: "#fff7ed", color: "#9a3412" },
  "International": { bg: "#f0f9ff", color: "#0369a1" },
  "European": { bg: "#fef3c7", color: "#92400e" },
  "Mexican": { bg: "#fff7ed", color: "#9a3412" },
  "Tea": { bg: "#f0fdf4", color: "#166534" },
  "Food court": { bg: "#f8fafc", color: "#475569" },
  "Sports lounge": { bg: "#fef3c7", color: "#92400e" },
  "Coming soon": { bg: "#f1f5f9", color: "#94a3b8" },
};

function Tag({ label }) {
  const style = VENUE_TAGS[label] || { bg: "#f8fafc", color: "#475569" };
  return (
    <span style={{
      display: "inline-block",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      padding: "3px 8px",
      borderRadius: 999,
      background: style.bg,
      color: style.color,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function VenueRow({ name, note, tag, href, photo }) {
  const inner = (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "13px 4px", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {photo && (
          <img
            src={photoPathToCdn(photo)}
            alt={name}
            width={52}
            height={52}
            loading="lazy"
            style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1.5px solid var(--line)", background: "var(--paper)" }}
          />
        )}
        <div>
          <div style={{ fontWeight: 650, fontSize: 15, color: "var(--ink)" }}>{name}</div>
          {note && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{note}</div>}
        </div>
      </div>
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <Tag label={tag} />
      </div>
    </div>
  );
  if (href) {
    return <Link href={href} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>;
  }
  return <div>{inner}</div>;
}

function VenueGroup({ title, venues }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--violet)", marginBottom: 4 }}>{title}</div>
      <div>
        {venues.map((v) => (
          <VenueRow key={v.name} {...v} />
        ))}
      </div>
    </div>
  );
}

function SpotPhoto({ id, src, name, caption }) {
  return (
    <figure style={{ margin: "20px 0", borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--line)", background: "var(--cream)" }}>
      <img
        src={src ? photoPathToCdn(src) : spotPhotoUrl(id)}
        alt={name}
        loading="lazy"
        style={{ display: "block", width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
      />
      {caption && (
        <figcaption style={{ fontSize: 12, color: "var(--muted)", padding: "8px 14px" }}>{caption}</figcaption>
      )}
    </figure>
  );
}

function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 16, marginTop: 36, paddingBottom: 10, borderBottom: "2px solid var(--line)" }}>
      <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(22px, 4vw, 28px)", margin: "0 0 4px", letterSpacing: "-0.015em" }}>{title}</h2>
      {sub && <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}

function PullQuote({ children }) {
  return (
    <blockquote style={{
      margin: "20px 0",
      padding: "16px 18px 14px",
      borderRadius: 12,
      background: "var(--violet-wash)",
      border: "1.5px solid color-mix(in srgb, var(--violet) 18%, var(--line))",
      fontFamily: "var(--font-fraunces), serif",
      fontSize: 17,
      lineHeight: 1.45,
      color: "var(--ink)",
    }}>{children}</blockquote>
  );
}

// Venues data

const SATTVA_KC_DINING = [
  { name: "Monastery", note: "Global cuisine and brewery", tag: "Brewery", photo: "https://curlytales.com/wp-content/uploads/2023/04/Monastery.jpg" },
  { name: "Burma Burma Restaurant & Tea Room", note: "Burmese, pure vegetarian", tag: "Vegetarian", href: "/spot/burma-burma-restaurant-and-tea-room-madhapur", photo: "/photos/ChIJ5RcVE9uTyzsRdC6egQ0Chgs.jpg" },
  { name: "Toscano", note: "Italian", tag: "Italian", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSatJIuTbaPUFuUKdbk1m2iZ4ubB2ZLz3GCONP_1xkwbA&s=10" },
  { name: "Margerita By The Window", note: "Italian", tag: "Italian", photo: "https://dineout-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/DINEOUT_ALL_RESTAURANTS/IMAGES/RESTAURANT_IMAGE_SERVICE/2025/4/3/ffe81aeb-65c6-43a9-8301-e6ae4b4b7a9e_imageDownload512239654c4c448dbb336bfb2c239b0d1.PNG" },
  { name: "Tevar", note: "Contemporary Indian and bar", tag: "Bar", photo: "https://b.zmtcdn.com/data/pictures/2/20855232/b73e14f3b5f519a9e13f61ea2b65c2fe.jpeg" },
  { name: "Tales of Telugu", note: "Andhra and Telangana cuisine", tag: "Local", photo: "https://dineout-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/DINEOUT_ALL_RESTAURANTS/IMAGES/RESTAURANT_IMAGE_SERVICE/2024/4/23/b0646727-7aab-4c9f-ac6d-b13cb84f8430_DAT36683fa3d9dd1e0b469db5e29387c0076f9c.JPG" },
  { name: "Simply South", note: "South Indian", tag: "South Indian", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTb_jn5tppPlUKTBErjGgVRaVcW104HdEmzA7RNPrXESw&s=10" },
  { name: "Oye Kake", note: "Punjabi, pure vegetarian", tag: "Vegetarian", photo: "https://b.zmtcdn.com/data/pictures/1/21550771/f5fedda04f0251ece89f3cde1ed9e6ca.jpg" },
  { name: "Baan PhadThai", note: "Thai", tag: "Thai", photo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEglM1Hg1klw0eecaG1fLPDXrJHn-Rfave2B3e686WYMUQsUvRF9TSbwaAqL9wETn-Hw_DShFHscIPqEHI01xqZ_RpDc0cC7ik5bOXs5H6YwpGgjavrlWaFl8MxLbdKlHZf8W16FzEm48BDJeYMG0L2GFtoAbu20A1ZNeeXNgoAE67wmecKP0Wi-zgKPrlg/s4080/B2.jpg" },
  { name: "SALT", note: "Indian and bar", tag: "Bar", photo: "https://b.zmtcdn.com/data/pictures/0/21380310/c4245cd830d8382b6dc108eff2922029.jpg" },
  { name: "Cream Centre", note: "Indian", tag: "Multi-cuisine", photo: "https://b.zmtcdn.com/data/pictures/6/20781136/471136eeb2ce925e2bb64a517c75f657.jpg" },
  { name: "Whiskey Samba", note: "North Indian, Mughlai and Asian", tag: "Multi-cuisine", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQcOeGZalma_AJG2gTpZJmrMqoyYG8a2Yi4w4BNHbToA&s=10" },
  { name: "Narumi", note: "Asian and bar", tag: "Asian", photo: "https://b.zmtcdn.com/data/pictures/3/22423933/4fb016b36e6475aaee7de97878a1b6bd.jpg" },
  { name: "Hard Rock Cafe", note: "American", tag: "American", href: "/spot/hard-rock-cafe-banjara-hills", photo: "/photos/ChIJ1d3mkjaXyzsRFqP7f3X9P1A.jpg" },
  { name: "Oota", note: "South Indian", tag: "South Indian", photo: "https://b.zmtcdn.com/data/pictures/1/22658621/90e9dd127ab7f40a0f9d409d2bbdc8bd.png" },
];

const SATTVA_KC_CAFES = [
  { name: "Manam Chocolate Karkhana", note: "Coffee and desserts", tag: "Cafe", href: "/spot/manam-chocolate-karkhana-banjara-hills", photo: "/photos/ChIJC4H0f-KXyzsRz1Njbx7ykig.jpg" },
  { name: "SUBKO", note: "Specialty coffee", tag: "Cafe", href: "/spot/subko-mini-jubilee-hills", photo: "/photos/ChIJ8b3F8daRyzsRd-WVyztKs3w.jpg" },
  { name: "Katha", note: "Cafe", tag: "Cafe", photo: "https://cdn.corner.inc/place-photo/google-gallery/1511781/0e8ee0cc743d771fefbafb6761d639e4.jpeg" },
  { name: "Third Wave Coffee", note: "Specialty coffee", tag: "Cafe", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPuxXt98WJzoPl6KPDAHuSiqP9CNIhTFNA8axWZGkwRw&s=10" },
  { name: "Cafe Reed", note: "Cafe", tag: "Cafe", photo: "https://b.zmtcdn.com/data/pictures/1/21984131/909bd375d726c7303ae41df7a2e9ddc4_featured_v2.jpg" },
  { name: "Starbucks", note: "Cafe", tag: "Cafe", photo: "https://b.zmtcdn.com/data/pictures/7/97487/c07aa5ff38e9744f91accd98cd5b19d0.jpg" },
  { name: "Karachi Bakery", note: "Bakery and desserts", tag: "Bakery", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuoZQpPGvZJQBJBMa57cSIEHQubpCKX9iYEWeQyZOb2A&s=10" },
  { name: "FLURYS", note: "All-day breakfast and bakery", tag: "Bakery", photo: "https://b.zmtcdn.com/data/pictures/9/21670169/fed8637535ead3bed289b3fdb545f510.jpeg" },
  { name: "Haldiram's", note: "Indian snacks and sweets", tag: "Snacks", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpyqSBlmAddus3bMG5Zq6k1-oiCJcYnjEu5LkgXc3CGA&s=10" },
];

const SATTVA_KC_BARS = [
  { name: "Windmills Craftworks", note: "Craft brewery and bar", tag: "Brewery", href: "/spot/windmills-craftworks-madhapur-madhapur", photo: "/photos/ChIJV47u-zeTyzsRg1GyNX8ogOQ.jpg" },
  { name: "Raasta", note: "Bar", tag: "Bar", photo: "https://b.zmtcdn.com/data/pictures/3/20961923/ffbf287d06bb6d45df2200914fda122d.jpg" },
  { name: "The Wine Corner by QUORUM", note: "Wines and tapas", tag: "Wine bar", photo: "https://b.zmtcdn.com/data/pictures/0/21986330/7111ed3b17c8704a4e5d080aaae1e623.jpg" },
];

const SATTVA_KP_DINING = [
  { name: "Telangana Spice Kitchen", note: "Telangana cuisine, bar and grill", tag: "Local", photo: "https://b.zmtcdn.com/data/pictures/9/21554309/4e2dc055ba53ccfcdc4972f79e732faa.png" },
  { name: "Butterfly High", note: "Multi-cuisine", tag: "Multi-cuisine", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkNl-NnSvxqnHFMdQgnIz4-kaLTcL758Nk43jlu_HyPg&s=10" },
  { name: "Kyma", note: "Mediterranean and Asian", tag: "Mediterranean", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOggSXDVkG7yw77dYDwQfee6PUK0LO5B4ghEDkUI___g&s=10" },
];

const SATTVA_KP_CAFES = [
  { name: "The Theory Cafe", note: "Cafe", tag: "Cafe", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaJqPcGQMoWzvOe-HgsxJGLjrf97fTCnWpjLfXlgvQqA&s=10" },
  { name: "Third Wave Coffee", note: "Specialty coffee", tag: "Cafe" },
  { name: "Blue Tokai Coffee Roasters", note: "Specialty coffee, Knowledge Park", tag: "Cafe", href: "/spot/blue-tokai-coffee-roasters-knowledge-park-jubilee-hills", photo: "/photos/ChIJX8qAwBiTyzsR1WiJ2-Fywp0.jpg" },
  { name: "Feranoz", note: "Cafe and desserts", tag: "Cafe", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv4ya04QHyjQSVQNm2sH4Q4GPVjBoRCCDuC7E6Cu0dzg&s=10" },
  { name: "LATCHA", note: "Matcha and soft serve", tag: "Desserts", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcxrv3k5XBg4HgEdVAyHHex8ZtvPY0mPQ-boopdEi1nA&s=10" },
];

const SATTVA_KP_BARS = [
  { name: "LOQA Cocktail Room", note: "Cocktail bar", tag: "Cocktail bar", href: "/spot/loqa-cocktail-room-manikonda", photo: "/photos/ChIJHxumc9STyzsRp2Bg8IFtG7A.jpg" },
  { name: "Underdoggs", note: "Sports bar", tag: "Sports bar", photo: "https://b.zmtcdn.com/data/pictures/7/21894267/ba9b39a326301f5a4a473d7fce7e1b99.jpg" },
  { name: "Beer Cartel", note: "Bar", tag: "Bar", photo: "https://b.zmtcdn.com/data/pictures/8/21187598/c1bc8fa104210f323ff38fdf6d1c51e7.jpg" },
];

const LOFT_DINING = [
  { name: "Fireback", note: "Thai", tag: "Thai", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIaauU_aZSPOma0HWmCIY59ROci5tzlGYuu5nEnbcVbg&s" },
  { name: "HOSA", note: "Contemporary South Indian", tag: "South Indian", photo: "https://dineout-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/DINEOUT_ALL_RESTAURANTS/IMAGES/RESTAURANT_IMAGE_SERVICE/2026/8/11/dcd31c19-0ef6-4103-a467-15bcd116d11d_images0Manch40093FOODSHOTS683c96ca98f41476e884863ae559fcc3e.JPG" },
  { name: "Akina", note: "Asian", tag: "Asian", photo: "https://lh3.googleusercontent.com/grass-cs/ACvplmMX5J4V2m3oDYEtSloFktERSrItIPtinwrfZA7_I-MHOYcGipCIaI0mRYXCbEwgI8J7Zm2tZPqYX2eiLu3_gDArQX3qtrOeQ30BWSDX8ALETWKjfjvwwGHIy-_Ixod2uuUqrqAsCxaunRXW=w326-h312-n-k-no" },
  { name: "One8 Commune", note: "Multi-cuisine", tag: "Multi-cuisine", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7z9N4TmrRdvvJAIWlzr-OW7totnEdC9Re_V-bquKliQ&s=10" },
  { name: "All American Diner", note: "American, opening soon", tag: "Coming soon", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScDKCypqdT-QvUSlGNArVCyt5HFsc_jruEMJXeNJYpRg&s=10" },
];

const LOFT_CAFES = [
  { name: "TrueBlack", note: "Cafe", tag: "Cafe", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYqdbKyeLgRS1uYLp8ILuRD-klJjDR_yzm8GgjOe2LoQ&s=10" },
];

const LOFT_BARS = [
  { name: "Barback", note: "Cocktail bar", tag: "Cocktail bar", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1ApL293oVoiYT2JgZDvUhKM_wP9R6nVIJWzSIPIfixg&s=10" },
  { name: "Dandy & Dandy", note: "Bar", tag: "Bar", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRU2YS1bXlOrw1qkRuTQls_FyxToPqo0edFzGRhNaCHw&s=10" },
  { name: "Swing Lounge", note: "Sports lounge", tag: "Sports lounge", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSD9TwMWZMgThVosCY39opf5GkYZ1dqr2lWo3__x_CWtA&s" },
];

const RMZ_DINING = [
  { name: "Chili's", note: "Tex-Mex", tag: "Tex-Mex", href: "/spot/chilis-grill-and-bar-madhapur", photo: "/photos/ChIJ-1FJL1iRyzsR6UU59XXpqsw.jpg" },
  { name: "Nando's", note: "Afro-Portuguese", tag: "International", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsgK0owIew26lh9wMvcgha_DotgLavkdHAIFPOLGydHQ&s=10" },
  { name: "KOKO", note: "Asian", tag: "Asian", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBJnCWPVXxhmka4U0SqzOLgXUGHmf8qu4-LV50cqv2vQ&s" },
  { name: "Paul", note: "European bakery and cafe", tag: "European", href: "/spot/paul-jubilee-hills", photo: "/photos/ChIJSyT9cQCRyzsRwboSVeP0BPQ.jpg" },
  { name: "California Burrito", note: "Mexican", tag: "Mexican", photo: "https://content.jdmagicbox.com/v2/comp/hyderabad/y3/040pxx40.xx40.250922175015.b3y3/catalogue/california-burrito-nanakaramguda-hyderabad-mexican-restaurants-9fda0jnowe.jpg" },
];

const RMZ_CAFES = [
  { name: "Van Lavino", note: "Cafe and patisserie", tag: "Cafe", photo: "/photos/van-lavino.webp" },
  { name: "Chit Chat Chai", note: "Tea and snacks", tag: "Tea", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTl-xrQ_c6Vv38RJEOkiKykt7z6kQaXt37tE9y_xcl2UQ&s=10" },
];

const RMZ_BARS = [
  { name: "Radio Bar", note: "Bar", tag: "Bar", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-hVyCsV5cMd6fY3nOyrDAHjXXyb_5_u128Cw0v-oKmg&s=10" },
];

const RMZ_OTHER = [
  { name: "The Marketplace", note: "Food court with multiple outlets", tag: "Food court" },
];

const NEARBY = [
  { name: "Red Rhino", note: "Brewery and multi-cuisine (Dallas Center)", tag: "Brewery", photo: "https://lh3.googleusercontent.com/grass-cs/ACvplmMdtk38pR_40dU7R3VgRP_yiX-H26aJwVuwMTP5l-4-Dv0zRiMEf4jkdaI6WMRpJiXByyjY9cynk66gDvLNHHajE4O0pT-V8BkZZJFs_GB-HDehlEQs5Pg1UeiqJHj5yJsXYACV=w326-h312-n-k-no" },
  { name: "Post Card Global Tapas Bar", note: "Global tapas and bar (Dallas Center)", tag: "Bar", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQixwlbWkXLIv18tBbMC-xwollzZybYkqG8KaedQeKsMw&s=10" },
  { name: "Cafe Niloufer", note: "Irani chai, bakery and snacks (Orbit building)", tag: "Cafe", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBSiDCIlG6PyFScIkK6wqs6HB6h57eKhz1pqAPu5kddA&s=10" },
  { name: "Thangedu", note: "Telangana and South Indian", tag: "Local", photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFR1fmtbD6fzs4ejwV4IdlY77lBb4LKtkSR_slkYNHVw&s=10" },
  { name: "Aathidyam", note: "South Indian (Dallas Center)", tag: "South Indian" },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="site-page">
        <header className="site-header">
          <div className="site-header-inner">
            <SiteNav />
            <SiteBreadcrumb
              items={[
                { href: "/", label: "Home" },
                { href: "/areas", label: "Areas" },
                { href: SLUG, label: "Knowledge City F&B Guide" },
              ]}
            />
            <div className="site-hero">
              <h1>{TITLE}</h1>
              <p>60+ restaurants, cafes, bars and breweries across four commercial developments in Hyderabad's tech belt, mapped and listed.</p>
            </div>
          </div>
        </header>

        <main className="site-body">

          {/* Article hero image */}
          <figure style={{ margin: "0 0 24px", borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--line)", background: "var(--cream)", position: "relative" }}>
            <img
              src="https://rmz-static.s3.dualstack.ap-south-1.amazonaws.com/01_998d11420c.webp"
              alt="RMZ Nexity, Hyderabad - restaurants, cafes and bars"
              style={{ display: "block", width: "100%", aspectRatio: "16/10", objectFit: "cover" }}
              priority="true"
            />
            <div style={{
              position: "absolute", left: 12, bottom: 12,
              padding: "5px 10px", borderRadius: 999,
              background: "rgba(38,48,92,0.78)",
              color: "#fff", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.02em", backdropFilter: "blur(8px)"
            }}>RMZ Nexity, Hyderabad</div>
          </figure>

          {/* Byline */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--violet)", margin: 0 }}>Hyderabad Eats Guide</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>Updated September 2026 · Knowledge City, Raidurg, Hi-Tech City</div>
            </div>
            <Link href="/" style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: "var(--violet)", textDecoration: "none", padding: "8px 12px", borderRadius: 999, background: "var(--violet-wash)" }}>Open map</Link>
          </div>

          {/* Intro */}
          <p className="review-prose">
            Sattva Knowledge City, Sattva Knowledge Park, THE LOFT and RMZ Nexity have quietly become one of Hyderabad's most active F&B corridors. Spread across the Raidurg and Hi-Tech City belt, these four commercial developments now host over 60 restaurants, cafes, cocktail bars and breweries, covering cuisines from Thai and Burmese to Telugu, Italian, Mediterranean and Mexican.
          </p>
          <p className="review-prose">
            Whether you're looking for a sit-down lunch near your office, a brewery visit after work, specialty coffee, or a full dinner, the area covers most moods and budgets. Below is a complete list of what's open across all four developments, plus a handful of nearby standalone spots around the Raidurg belt.
          </p>

          <PullQuote>
            Knowledge City and its surrounding developments have turned into some of Hyderabad's most interesting F&B destinations, with new concepts opening regularly across breweries, cafes and contemporary dining.
          </PullQuote>

          {/* Quick overview numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, margin: "24px 0" }}>
            {[
              { label: "Sattva Knowledge City", count: "27+", sub: "restaurants & bars" },
              { label: "Sattva Knowledge Park", count: "11+", sub: "restaurants & bars" },
              { label: "THE LOFT", count: "9+", sub: "restaurants & bars" },
              { label: "RMZ Nexity", count: "10+", sub: "restaurants & bars" },
            ].map((s) => (
              <div key={s.label} style={{ padding: "14px 16px", borderRadius: 10, border: "1.5px solid var(--line)", background: "var(--paper)", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 28, fontWeight: 700, color: "var(--violet)", lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ---- SATTVA KNOWLEDGE CITY ---- */}
          <SectionHead
            title="Sattva Knowledge City"
            sub="The largest cluster, with 27+ F&B outlets across dining, cafes, bakeries and bars"
          />

          <p className="review-prose">
            Knowledge City is the anchor of this F&B corridor. The sheer range here means most cravings are covered without leaving the campus: craft beer at Windmills Craftworks, pure-vegetarian Burmese food at Burma Burma, a wood-fired Italian at Toscano, contemporary South Indian at Oota, Thai at Baan PhadThai, and a reliable hard rock with cocktails at Hard Rock Cafe.
          </p>
          <p className="review-prose">
            Coffee is handled by Manam, SUBKO, Third Wave and Starbucks. For late nights, Raasta, Windmills and The Wine Corner by QUORUM are all in the same vicinity.
          </p>

          <SpotPhoto
            id="ChIJV47u-zeTyzsRg1GyNX8ogOQ"
            name="Windmills Craftworks at Sattva Knowledge City"
            caption="Windmills Craftworks brings craft beer and a full menu to Sattva Knowledge City"
          />

          <VenueGroup title="Restaurants" venues={SATTVA_KC_DINING} />
          <VenueGroup title="Cafes, Bakeries & Desserts" venues={SATTVA_KC_CAFES} />
          <VenueGroup title="Bars & Nightlife" venues={SATTVA_KC_BARS} />

          {/* ---- SATTVA KNOWLEDGE PARK ---- */}
          <SectionHead
            title="Sattva Knowledge Park"
            sub="11+ outlets with a strong cocktail bar, Mediterranean dining, and specialty coffee"
          />

          <p className="review-prose">
            Knowledge Park is smaller but well-curated. Kyma stands out with Mediterranean and Asian food. LOQA Cocktail Room is one of the better dedicated cocktail bars in this part of the city. Blue Tokai handles specialty coffee, and LATCHA is the spot for matcha and soft serve.
          </p>

          <SpotPhoto
            id="ChIJHxumc9STyzsRp2Bg8IFtG7A"
            name="LOQA Cocktail Room at Sattva Knowledge Park"
            caption="LOQA Cocktail Room at Sattva Knowledge Park"
          />

          <VenueGroup title="Restaurants" venues={SATTVA_KP_DINING} />
          <VenueGroup title="Cafes & Desserts" venues={SATTVA_KP_CAFES} />
          <VenueGroup title="Bars & Nightlife" venues={SATTVA_KP_BARS} />

          {/* ---- THE LOFT ---- */}
          <SectionHead
            title="THE LOFT"
            sub="Contemporary dining with Thai, modern South Indian, and a cluster of cocktail bars"
          />

          <p className="review-prose">
            THE LOFT leans into contemporary dining. HOSA is doing modern South Indian in a way that few places in the city are. Fireback brings Thai, and One8 Commune is the multi-cuisine anchor. Barback and Dandy & Dandy round out the evenings for cocktails.
          </p>

          <VenueGroup title="Restaurants" venues={LOFT_DINING} />
          <VenueGroup title="Cafes" venues={LOFT_CAFES} />
          <VenueGroup title="Bars & Nightlife" venues={LOFT_BARS} />

          {/* ---- RMZ NEXITY ---- */}
          <SectionHead
            title="RMZ Nexity"
            sub="International brands, a food court, and a European patisserie"
          />

          <p className="review-prose">
            RMZ Nexity skews international with familiar names across Tex-Mex (Chili's), Afro-Portuguese (Nando's), Asian (KOKO) and Mexican (California Burrito). Paul is the spot for a quick European-style breakfast or pastry. The Marketplace food court fills in the quick-meal gap.
          </p>

          <SpotPhoto
            src="https://rmz-static.s3.dualstack.ap-south-1.amazonaws.com/06_4344409a50.webp"
            name="RMZ Nexity Hyderabad restaurants"
            caption="RMZ Nexity, Hyderabad"
          />

          <VenueGroup title="Restaurants" venues={RMZ_DINING} />
          <VenueGroup title="Cafes" venues={RMZ_CAFES} />
          <VenueGroup title="Bars" venues={RMZ_BARS} />
          <VenueGroup title="Food Court" venues={RMZ_OTHER} />

          {/* ---- NEARBY ---- */}
          <SectionHead
            title="Nearby Standalone Spots"
            sub="Spots around Raidurg and Hi-Tech City worth knowing, close to the four developments"
          />

          <p className="review-prose">
            Beyond the four major developments, several strong standalone restaurants are within the same Raidurg and Hi-Tech City belt. Red Rhino at Dallas Center is the area's go-to brewery for multi-cuisine. Cafe Niloufer at the Orbit building is worth a detour for Irani chai and Osmania biscuits.
          </p>

          <VenueGroup title="Worth knowing" venues={NEARBY} />

          {/* ---- FAQ ---- */}
          <div style={{ marginTop: 36, paddingTop: 24, borderTop: "2px solid var(--line)" }}>
            <h2 className="site-section-title">Frequently Asked Questions</h2>

            <p className="review-prose">
              <strong>What restaurants are in Sattva Knowledge City?</strong> Over 15 restaurants including Monastery, Burma Burma, Toscano, Hard Rock Cafe, Baan PhadThai, Tales of Telugu and Oota, plus 9 cafes/bakeries and 3 bars including Windmills Craftworks and Raasta.
            </p>
            <p className="review-prose">
              <strong>Are there vegetarian options near Sattva Knowledge City?</strong> Yes. Burma Burma is fully pure-vegetarian Burmese. Oye Kake is a pure-vegetarian Punjabi spot. Simply South and Oota cover South Indian vegetarian. Cafes like Manam, Third Wave and SUBKO are vegetarian-friendly by default.
            </p>
            <p className="review-prose">
              <strong>What breweries are in the Knowledge City area?</strong> Windmills Craftworks and Monastery are both inside Sattva Knowledge City. Red Rhino at Dallas Center is the nearby standalone brewery. Beer Cartel is the bar option at Sattva Knowledge Park.
            </p>
            <p className="review-prose">
              <strong>Is there a food court near Sattva Knowledge City?</strong> The Marketplace at RMZ Nexity is the main food court in the area. Haldiram's inside Knowledge City also works for a quick snack run.
            </p>
            <p className="review-prose">
              <strong>What is the best cocktail bar near Knowledge City?</strong> LOQA Cocktail Room at Sattva Knowledge Park is the dedicated cocktail bar in the corridor. Barback at THE LOFT is another option. Windmills Craftworks and Monastery both have bar menus alongside their food.
            </p>
          </div>

          <div style={{ marginTop: 32 }}>
            <Link href="/areas/madhapur-hitec" className="site-cta">Browse Madhapur & Hitec City on the map</Link>
          </div>
        </main>

        <div className="site-body" style={{ paddingTop: 0 }}>
          <SiteRelated
            links={[
              { href: "/areas/madhapur-hitec", label: "Madhapur & Hitec City" },
              { href: "/areas/gachibowli", label: "Gachibowli restaurants" },
              { href: "/areas/kondapur", label: "Kondapur restaurants" },
              { href: "/explore/cafes", label: "Best cafes in Hyderabad" },
              { href: "/rankings/best-cafe-in-hyderabad", label: "Vote: best cafe" },
              { href: "/stories", label: "Food stories" },
            ]}
          />
        </div>

        <SiteFooter />
      </div>
    </>
  );
}
