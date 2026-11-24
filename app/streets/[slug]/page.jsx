import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import AreaExplorer from "../../components/AreaExplorer.jsx";
import { getEateries, spotPath, hasSpotPhoto } from "../../../lib/siteData.js";
import { spotPhotoUrl } from "../../../lib/photos.js";
import { pageMeta } from "../../../lib/site.js";

// "Streets of Hyderabad" series: one road per episode, every spot inside its box.
function streets() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "streets.json"), "utf-8")); } catch { return []; }
}
function getStreet(slug) {
  const st = streets().find((s) => s.slug === slug);
  if (!st) return null;
  const b = st.bbox;
  const skip = new Set(st.exclude || []);
  const spots = getEateries().filter((e) => !skip.has(e.id) && e.lat >= b.south && e.lat <= b.north && e.lng >= b.west && e.lng <= b.east);
  return { ...st, spots };
}

export function generateStaticParams() {
  return streets().map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }) {
  const st = getStreet(params.slug);
  if (!st) return {};
  return pageMeta({ title: st.title, description: st.intro, path: `/streets/${params.slug}` });
}

export default function StreetPage({ params }) {
  const st = getStreet(params.slug);
  if (!st) notFound();
  const items = [...st.spots]
    .sort((a, b) => (a.ratingCount ?? 0) - (b.ratingCount ?? 0))
    .map((s) => ({
      id: s.id, name: s.name, category: s.category, path: spotPath(s),
      rating: s.rating ?? null, ratingCount: s.ratingCount ?? null, priceLevel: s.priceLevel ?? null,
      lat: s.lat, lng: s.lng,
      photo: hasSpotPhoto(s.id) ? spotPhotoUrl(s.id) : null,
      rank: null, safety: null,
    }));
  return (
    <div style={{ paddingBottom: 84 }}>
      <SiteChrome
        active="/areas"
        backFallback="/areas"
        breadcrumb={[{ href: "/", label: "Home" }, { href: `/streets/${st.slug}`, label: `Streets of Hyderabad: ${st.name}` }]}
        title={st.title}
        description={st.intro}
        related={[{ href: "/explore/cafes", label: "Cafe map" }]}
      >
        <AreaExplorer area={st.name} spots={items} hiddenFirst />
        <Link href="/" className="site-cta">Open the full Hyderabad food map</Link>
        <section className="ax-about" aria-label="About this street">
          <h2 className="site-section-title">Next on Streets of Hyderabad</h2>
          <p>Vote on our Instagram post for the next street: {st.next.join(" or ")}.</p>
        </section>
      </SiteChrome>
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="areas" />
      </div>
    </div>
  );
}
