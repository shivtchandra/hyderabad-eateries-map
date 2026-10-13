import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { pageMeta } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { recommendationsEnabled } from "../../lib/recommendationShared.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../../lib/rankings.js";
import { editorialRanking, hasSpotPhoto, allAreaPages, getAreaBySlug } from "../../lib/siteData.js";
import { spotPhotoUrl } from "../../lib/photos.js";

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

// One card per ranking, pictured with the first spot on its list that has a
// photo. The card only promises the board, not a winner.
function rankingCards() {
  return SEO_THEME_PICKS.map((pick) => {
    const slug = slugFromTitle(pick.title);
    let photo = null;
    try {
      const top = editorialRanking(pick, slug, 8).find((e) => hasSpotPhoto(e.id));
      if (top) photo = spotPhotoUrl(top.id);
    } catch {}
    return { slug, label: short(pick.title), photo };
  });
}

const GUIDES = [
  ...(recommendationsEnabled() ? [{ href: "/picks", label: "Best food, dish by dish", note: "What r/hyderabad actually recommends" }] : []),
  { href: "/guides/best-tiffins-hyderabad-reddit", label: "Tiffins and ghee dosas", note: "Breakfast spots locals swear by" },
  { href: "/guides/late-night-food-hyderabad-reddit", label: "Late night food", note: "Open after midnight" },
  { href: "/guides/best-ice-cream-desserts-hyderabad", label: "Ice cream and desserts", note: "Scoops, kulfi, falooda" },
  { href: "/guides/best-breweries-in-hyderabad", label: "Breweries", note: "Craft beer, ranked" },
  { href: "/guides/best-biryani-hyderabad-reddit", label: "Biryani, as Reddit picks it", note: "The threads, counted" },
  { href: "/guides/best-cafes-hyderabad-reddit", label: "Cafes, as Reddit picks it", note: "Work, coffee, dates" },
  { href: "/guides/restaurants-in-sattva-knowledge-city-hyderabad", label: "Around Sattva Knowledge City", note: "Office lunch, sorted" },
];

const JUMP = [
  { href: "#rankings", label: "Rankings" },
  { href: "#dish-guides", label: "Dish guides" },
  { href: "#areas", label: "Areas" },
  { href: "/offers", label: "Deals" },
  { href: "/food-safety", label: "Food safety" },
  { href: "/stories", label: "Stories" },
];

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
        description="Read before you go."
      >
        <nav className="guides-jump" aria-label="Jump to">
          {JUMP.map((j) => (
            <a key={j.href} href={j.href}>{j.label}</a>
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
                <span className="guides-photo">
                  {r.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photo} alt="" loading="lazy" />
                  ) : null}
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
              <span className="guides-tile-label">Dining deals</span>
              <span className="guides-tile-note">Offers at spots on the map</span>
            </Link>
            <Link href="/food-safety" className="guides-tile guides-tile--ink">
              <span className="guides-tile-label">Food safety</span>
              <span className="guides-tile-note">Inspection records, spot by spot</span>
            </Link>
            <Link href="/stories" className="guides-tile guides-tile--yellow">
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
