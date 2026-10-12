import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { pageMeta } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { recommendationsEnabled } from "../../lib/recommendationShared.js";

// The Guides tab: one home for everything you read before you go. These pages
// were spread across eight header links and a Stories tab before.
const title = "Hyderabad Food Guides";
const description = "Local rankings, dish guides, areas, dining deals, food safety records and stories. Everything to read before you eat out in Hyderabad.";

export const metadata = {
  ...pageMeta({ title, description, path: "/guides" }),
  openGraph: { ...pageMeta({ title, description, path: "/guides" }).openGraph, images: ogImages(title, description, "/guides") },
};

const VOTED = [
  { href: "/rankings/best-biryani-in-hyderabad", label: "Best biryani" },
  { href: "/rankings/best-cafe-in-hyderabad", label: "Best cafes" },
  { href: "/rankings/best-buffet-in-hyderabad", label: "Best buffet" },
  { href: "/rankings/best-fine-dining-in-hyderabad", label: "Best fine dining" },
  { href: "/rankings", label: "All weekly rankings" },
];

const LOCAL = [
  ...(recommendationsEnabled() ? [{ href: "/picks", label: "Best food, dish by dish" }] : []),
  { href: "/guides/best-tiffins-hyderabad-reddit", label: "Tiffin centres and ghee dosas" },
  { href: "/guides/late-night-food-hyderabad-reddit", label: "Late night food" },
  { href: "/guides/best-ice-cream-desserts-hyderabad", label: "Ice cream and desserts" },
  { href: "/guides/best-breweries-in-hyderabad", label: "Breweries" },
  { href: "/guides/best-biryani-hyderabad-reddit", label: "Biryani, as Reddit picks it" },
  { href: "/guides/best-cafes-hyderabad-reddit", label: "Cafes, as Reddit picks it" },
  { href: "/guides/restaurants-in-sattva-knowledge-city-hyderabad", label: "Eating around Sattva Knowledge City" },
];

const AREAS = [
  { href: "/areas/jubilee-hills", label: "Jubilee Hills" },
  { href: "/areas/gachibowli", label: "Gachibowli" },
  { href: "/areas/kondapur", label: "Kondapur" },
];

const ALSO = [
  { href: "/offers", label: "Dining deals", note: "Offers at spots on the map" },
  { href: "/food-safety", label: "Food safety", note: "Inspection records, spot by spot" },
  { href: "/stories", label: "Stories", note: "The people behind old Hyderabad spots" },
  { href: "/explore", label: "Explore by craving", note: "Cafes, biryani, bars, bakeries" },
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

function LinkList({ links }) {
  return (
    <ul className="guides-list">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="guides-row">
            <span className="guides-row-text">
              <span className="guides-row-label">{l.label}</span>
              {l.note && <span className="guides-row-note">{l.note}</span>}
            </span>
            <Arrow />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function GuidesPage() {
  return (
    <div style={{ paddingBottom: 84 }}>
      <SiteChrome
        active="/guides"
        breadcrumb={[{ href: "/", label: "Home" }, { href: "/guides", label: "Guides" }]}
        title="Guides"
        description="Read before you go. Local rankings, dish guides, areas, deals and food safety, in one place."
      >
        <section className="guides-section">
          <h2 className="guides-h2">Voted by locals</h2>
          <LinkList links={VOTED} />
        </section>
        <section className="guides-section">
          <h2 className="guides-h2">Local guides</h2>
          <LinkList links={LOCAL} />
        </section>
        <section className="guides-section">
          <div className="guides-h2-row">
            <h2 className="guides-h2">By area</h2>
            <Link href="/areas" className="guides-more">All areas</Link>
          </div>
          <div className="guides-areas">
            {AREAS.map((a) => (
              <Link key={a.href} href={a.href} className="guides-area">{a.label}</Link>
            ))}
          </div>
        </section>
        <section className="guides-section">
          <h2 className="guides-h2">Also</h2>
          <LinkList links={ALSO} />
        </section>
      </SiteChrome>
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="guides" />
      </div>
    </div>
  );
}
