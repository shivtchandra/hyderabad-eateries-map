import fs from "fs";
import path from "path";
import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { pageMeta } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { recommendationsEnabled } from "../../lib/recommendationShared.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../../lib/rankings.js";
import { allAreaPages, getAreaBySlug } from "../../lib/siteData.js";

// The Guides tab: everything you read before you go, scannable at a glance.
// Jump chips up top, rankings as a row of photo cards, guides as a row of
// cards, areas as tiles with real counts, then three bold tiles.
const title = "Hyderabad Food Guides";
const description = "Local rankings, dish guides, areas, dining deals, food safety records and stories. Everything to read before you eat out in Hyderabad.";

export const metadata = {
  ...pageMeta({ title, description, path: "/guides" }),
  openGraph: { ...pageMeta({ title, description, path: "/guides" }).openGraph, images: ogImages(title, description, "/guides") },
};

const short = (t = "") => {
  const s = t.replace(/\s+in\s+hyderabad$/i, "");
  return s.charAt(0) + s.slice(1).toLowerCase();
};

// Stickers (isometric die-cut art) live in public/stickers/<key>.webp (or .png). A card
// shows its sticker when the file exists, else a bold typographic card, so
// art can be dropped in later without touching code. See DESIGN.md.
const STICKER_DIR = path.join(process.cwd(), "public", "stickers");
function sticker(key) {
  if (!key) return null;
  try {
    for (const ext of ["webp", "png"]) {
      if (fs.existsSync(path.join(STICKER_DIR, `${key}.${ext}`))) return `/stickers/${key}.${ext}`;
    }
  } catch {}
  return null;
}

// The headline rankings for the row (the rest are one tap away in /rankings).
const HEADLINE = [
  { slug: "best-biryani-in-hyderabad", word: "Biryani", key: "biryani" },
  { slug: "best-haleem-in-hyderabad", word: "Haleem", key: "haleem" },
  { slug: "best-irani-cafe-in-hyderabad", word: "Irani chai", key: "irani-chai" },
  { slug: "best-dosa-in-hyderabad", word: "Dosa", key: "dosa" },
  { slug: "best-mandi-in-hyderabad", word: "Mandi", key: "mandi" },
  { slug: "best-shawarma-in-hyderabad", word: "Shawarma", key: "shawarma" },
  { slug: "best-cafe-in-hyderabad", word: "Cafes", key: "coffee" },
  { slug: "best-bakery-in-hyderabad", word: "Bakery", key: "bakery" },
  { slug: "best-ice-cream-in-hyderabad", word: "Ice cream", key: "ice-cream" },
  { slug: "best-brewery-in-hyderabad", word: "Breweries", key: "beer" },
  { slug: "best-street-food-in-hyderabad", word: "Street food", key: "street-food" },
  { slug: "best-fine-dining-in-hyderabad", word: "Fine dining", key: "fine-dining" },
];
const TONES = ["violet", "yellow", "ink"];

function rankingCards() {
  const known = new Set(SEO_THEME_PICKS.map((p) => slugFromTitle(p.title)));
  return HEADLINE.filter((h) => known.has(h.slug)).map((h, i) => ({
    ...h,
    label: short(SEO_THEME_PICKS.find((p) => slugFromTitle(p.title) === h.slug).title),
    art: sticker(h.key),
    tone: TONES[i % TONES.length],
  }));
}

const GUIDES = [
  ...(recommendationsEnabled() ? [{ href: "/picks", label: "Best food, dish by dish", note: "What r/hyderabad actually recommends", key: "thali" }] : []),
  { href: "/guides/best-tiffins-hyderabad-reddit", label: "Tiffins and ghee dosas", note: "Breakfast spots locals swear by", key: "breakfast" },
  { href: "/guides/late-night-food-hyderabad-reddit", label: "Late night food", note: "Open after midnight", key: "late-night" },
  { href: "/guides/best-ice-cream-desserts-hyderabad", label: "Ice cream and desserts", note: "Scoops, kulfi, falooda", key: "ice-cream" },
  { href: "/guides/best-breweries-in-hyderabad", label: "Breweries", note: "Craft beer, ranked", key: "beer" },
  { href: "/guides/best-biryani-hyderabad-reddit", label: "Biryani, as Reddit picks it", note: "The threads, counted", key: "biryani" },
  { href: "/guides/best-cafes-hyderabad-reddit", label: "Cafes, as Reddit picks it", note: "Work, coffee, dates", key: "coffee" },
  { href: "/guides/restaurants-in-sattva-knowledge-city-hyderabad", label: "Around Sattva Knowledge City", note: "Office lunch, sorted", key: "lunchbox" },
];

// The top of Guides: six tinted tiles, each with a sticker breaking out of
// its corner. Food stickers where one fits; die-cut style icons otherwise.
const JUMP = [
  // Yellow celebrates (rankings), ink and violet carry the rest; food safety
  // stays neutral (DESIGN.md colour v3).
  { href: "#rankings", label: "Rankings", note: "Voted by locals", tone: "sun", key: "biryani" },
  { href: "#dish-guides", label: "Dish guides", note: "What to order", tone: "grape", key: "dosa" },
  { href: "#areas", label: "Areas", note: "Eat by neighbourhood", tone: "ink", icon: "pin" },
  { href: "/offers", label: "Deals", note: "Offers today", tone: "violet", key: "mandi" },
  { href: "/food-safety", label: "Food safety", note: "Inspection records", tone: "paper", icon: "shield" },
  { href: "/stories", label: "Stories", note: "Old Hyderabad spots", tone: "yellow", key: "irani-chai" },
];

// Flat icons drawn like die-cut stickers (white outline, soft shadow) so they
// sit with the 3D stickers.
function IconSticker({ kind }) {
  if (kind === "pin") {
    return (
      <svg className="guides-jump-art" viewBox="0 0 96 96" aria-hidden="true">
        <path d="M48 8c-16 0-28 12-28 27 0 20 28 49 28 49s28-29 28-49C76 20 64 8 48 8z" fill="#fff" />
        <path d="M48 14c-13 0-22 9.5-22 21.5C26 52 48 76 48 76s22-24 22-40.5C70 23.5 61 14 48 14z" fill="#7c3aed" />
        <circle cx="48" cy="35" r="9" fill="#f5c84c" stroke="#fff" strokeWidth="3" />
      </svg>
    );
  }
  return (
    <svg className="guides-jump-art" viewBox="0 0 96 96" aria-hidden="true">
      <path d="M48 6l34 12v24c0 22-14 38-34 48C28 80 14 64 14 42V18z" fill="#fff" />
      <path d="M48 13l27 9.5V42c0 18-11 31-27 40-16-9-27-22-27-40V22.5z" fill="#2e8b6b" />
      <path d="M35 46l9 9 18-20" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <span className="guides-arrow" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
    </span>
  );
}

export default function GuidesPage() {
  const rankings = rankingCards();
  const areas = allAreaPages()
    .map((a) => ({ ...a, count: getAreaBySlug(a.slug)?.spots?.length || 0 }))
    .filter((a) => a.count > 0)
    .slice(0, 8);

  return (
    <div style={{ paddingBottom: 84 }}>
      <SiteChrome
        active="/guides"
        breadcrumb={[{ href: "/", label: "Home" }, { href: "/guides", label: "Guides" }]}
        title="Guides"
        description="Rankings, dish guides and areas, picked by locals."
      >
        <nav className="guides-jump-grid" aria-label="Guides sections">
          {JUMP.map((j) => (
            <a key={j.href} href={j.href} className={`guides-jump-tile guides-jump-tile--${j.tone}`}>
              {j.icon ? <IconSticker kind={j.icon} /> : sticker(j.key) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="guides-jump-art" src={sticker(j.key)} alt="" loading="lazy" />
              )}
              <span className="guides-jump-label">{j.label}</span>
              <span className="guides-jump-note">{j.note}</span>
            </a>
          ))}
        </nav>

        <section id="rankings" className="guides-section">
          <div className="guides-h2-row">
            <h2 className="guides-h2">Voted by locals</h2>
            <Link href="/rankings" className="guides-more">All rankings</Link>
          </div>
          <div className="guides-rail">
            {rankings.map((r) => (
              <Link key={r.slug} href={`/rankings/${r.slug}`} className="guides-photo-card">
                <span className={`guides-art guides-art--${r.tone}`}>
                  {r.art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.art} alt="" loading="lazy" />
                  ) : (
                    <span className="guides-art-word" aria-hidden="true">{r.word}</span>
                  )}
                </span>
                <span className="guides-photo-label">{r.label}</span>
                <span className="guides-photo-note">See the board and vote</span>
              </Link>
            ))}
          </div>
        </section>

        <section id="dish-guides" className="guides-section">
          <h2 className="guides-h2">Dish guides</h2>
          <div className="guides-rail">
            {GUIDES.map((g) => (
              <Link key={g.href} href={g.href} className="guides-text-card">
                {sticker(g.key) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="guides-text-art" src={sticker(g.key)} alt="" loading="lazy" />
                )}
                <span className="guides-text-label">{g.label}</span>
                <span className="guides-text-note">{g.note}</span>
                <Arrow />
              </Link>
            ))}
          </div>
        </section>

        <section id="areas" className="guides-section">
          <div className="guides-h2-row">
            <h2 className="guides-h2">By area</h2>
            <Link href="/areas" className="guides-more">All areas</Link>
          </div>
          <div className="guides-area-grid">
            {areas.map((a) => (
              <Link key={a.slug} href={`/areas/${a.slug}`} className="guides-area-tile">
                {sticker(`area-${a.slug}`) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="guides-area-art" src={sticker(`area-${a.slug}`)} alt="" loading="lazy" />
                )}
                <span className="guides-area-name">{a.area}</span>
                <span className="guides-area-count">{a.count} spots</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="guides-section">
          <h2 className="guides-h2">Also</h2>
          <div className="guides-tiles">
            <Link href="/offers" className="guides-tile guides-tile--violet">
              {sticker("deals") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="guides-tile-art" src={sticker("deals")} alt="" loading="lazy" />
              )}
              <span className="guides-tile-label">Dining deals</span>
              <span className="guides-tile-note">Offers at spots on the map</span>
            </Link>
            <Link href="/food-safety" className="guides-tile guides-tile--ink">
              {sticker("food-safety") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="guides-tile-art" src={sticker("food-safety")} alt="" loading="lazy" />
              )}
              <span className="guides-tile-label">Food safety</span>
              <span className="guides-tile-note">Inspection records, spot by spot</span>
            </Link>
            <Link href="/stories" className="guides-tile guides-tile--yellow">
              {sticker("stories") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="guides-tile-art" src={sticker("stories")} alt="" loading="lazy" />
              )}
              <span className="guides-tile-label">Stories</span>
              <span className="guides-tile-note">The people behind old Hyderabad spots</span>
            </Link>
          </div>
        </section>
      </SiteChrome>
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="guides" />
      </div>
    </div>
  );
}
