import Link from "next/link";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { breadcrumbJsonLd, faqJsonLd } from "../../lib/schema.js";
import { pathForSpotId, getEateryById, getEateries } from "../../lib/siteData.js";
import { getInspectionDrives, driveStats, formatDate } from "../../lib/inspectionsServer.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import BackButton from "../components/BackButton.jsx";
import DriveList from "./DriveList.jsx";
import SpotsMapClient from "../components/SpotsMapClient.jsx";
import ShareSpotButton from "../components/ShareSpotButton.jsx";

// Data changes bust the "inspections" tag; a short window only added ISR writes.
export const revalidate = 86400;

const SLUG = "/food-safety";
const TITLE = "Hyderabad Restaurant Food Safety Raids 2026";
const DESCRIPTION =
  "Every food safety inspection drive in Hyderabad, with dates, areas, the restaurants involved, the action taken and official sources. Compiled from TG SAFE releases and updated after re-inspections.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: { ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph, images: ogImages(TITLE, DESCRIPTION, SLUG) },
  keywords: [
    "hyderabad restaurant food safety raids",
    "restaurants licence suspended hyderabad",
    "tg safe inspection hyderabad",
    "hygiene violations restaurants hitech city",
    "fssai licence suspended madhapur gachibowli",
    "food safety hyderabad 2026",
  ],
};

const FAQ = [
  { q: "Who inspects restaurants in Hyderabad?",
    a: "The Telangana food safety authority (TG SAFE, the office of the Commissioner of Food Safety) runs inspection drives under the FSS Act. Teams check kitchens, storage and licences and lift samples for lab tests." },
  { q: "What does a suspended FSSAI licence mean?",
    a: "The restaurant must stop operating until it fixes the problems found and passes a re-inspection. It is a compliance action, and many places resume after corrections." },
  { q: "Where does this page get its information?",
    a: "Only from official TG SAFE releases and posts, cross-checked with reputable news reports. Every drive links to its sources, and we update the status after re-inspections." },
  { q: "A restaurant here has fixed the issues. How is that shown?",
    a: "Each restaurant carries a dated status such as inspection recorded, notice proposed, action taken, re-inspection due, or resumed after re-inspection. Send us the official update and we will change it." },
];

export default async function FoodSafetyPage() {
  const siteUrl = getSiteUrl();
  const drives = await getInspectionDrives();
  const stats = driveStats(drives);
  const updated = drives.reduce((m, d) => Math.max(m, d.updatedAt || 0), 0);
  // Resolve spot links on the server so the client list stays small.
  const view = drives.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
    entries: (d.entries || []).map((e) => ({ ...e, href: e.spotId ? pathForSpotId(e.spotId) : null, statusDateLabel: formatDate(e.statusDate) })),
  }));

  const mapPoints = safetyMapPoints(drives);

  const articleLd = {
    "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESCRIPTION,
    url: siteUrl + SLUG, datePublished: "2026-09-27",
    dateModified: updated ? new Date(updated).toISOString().slice(0, 10) : "2026-09-27",
    author: { "@type": "Organization", name: "Mapping HYD Eats Editorial Team" },
    publisher: { "@type": "Organization", name: "Hyderabad Eats", url: "https://eats.mapmyhyd.com" },
  };
  const crumbs = breadcrumbJsonLd([{ name: "Home", url: siteUrl }, { name: "Food safety inspections", url: siteUrl + SLUG }]);

  return (
    <div className="site-page" style={{ paddingBottom: 84 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ)) }} />

      <header className="site-header">
        <div className="site-header-inner">
          <SiteNav />
          <BackButton fallback="/" />
          <SiteBreadcrumb items={[{ href: "/", label: "Home" }, { href: SLUG, label: "Food safety inspections" }]} />
          <div className="site-hero">
            <h1>Restaurant food safety inspections in Hyderabad</h1>
            <p>Official inspection drives, the restaurants involved, what was found and what happened next. Dated, sourced, and updated after re-inspections.</p>
          </div>
        </div>
      </header>

      <main className="site-body">
        <div className="fs-byline">
          <div>
            <div className="fs-eyebrow">Food safety tracker · official sources only</div>
            <div className="fs-updated">{updated ? `Last updated ${new Date(updated).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}` : "Tracking TG SAFE drives from September 2026"}</div>
          </div>
          <Link href="/" className="fs-map-link">Open Map</Link>
        </div>

        <div className="fs-stats">
          <div><b>{stats.drives}</b><span>drives</span></div>
          <div><b>{stats.inspected}</b><span>places inspected</span></div>
          <div><b>{stats.suspended}</b><span>licences suspended</span></div>
          <div><b>{stats.samples}</b><span>samples lifted</span></div>
        </div>

        {mapPoints.length > 0 && (
          <section id="map" className="fs-mapbox" aria-label="Map of inspections">
            <div className="fs-mapbox-head">
              <h2>On the map</h2>
              <ShareSpotButton spotName="Hyderabad food safety map" spotPath="/food-safety#map" label="Share map" style={{ minHeight: 44, padding: "0 16px", fontSize: 14 }} />
            </div>
            <SpotsMapClient points={mapPoints} height={380} />
            <ul className="fs-legend">
              <li><span style={{ background: "#141414" }} />Closed</li>
              <li><span style={{ background: "#c2410c" }} />Licence suspended</li>
              <li><span style={{ background: "#78716c" }} />Notice</li>
              <li><span className="fs-legend-area">3</span>Records in an area (exact place not on our map)</li>
            </ul>
          </section>
        )}

        {view.length ? (
          <div id="drives"><DriveList drives={view} /></div>
        ) : (
          <div className="site-card fs-empty">
            <b>No drives published yet.</b>
            <p>We add each TG SAFE inspection drive here with its date, areas, the restaurants involved and the official source. Check back soon.</p>
          </div>
        )}

        <p className="fs-note">
          Compiled from official TG SAFE releases and cross-checked with news reports. An inspection result reflects the day of the
          visit; restaurants often fix issues and resume after re-inspection. Spotted an update or a correction? Tell us through the
          request box on the <Link href="/?tab=race">This Week</Link> page and we will update the record.
        </p>

        <section className="fs-faq">
          <h2>Frequently asked questions</h2>
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      </main>

      <SiteRelated
        links={[
          { href: "/areas/madhapur-hitec", label: "Madhapur and HITEC City food" },
          { href: "/areas/gachibowli", label: "Gachibowli restaurants" },
          { href: "/rankings", label: "Community rankings" },
          { href: "/stories", label: "Stories and guides" },
        ]}
      />
      <SiteFooter />
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="stories" />
      </div>
    </div>
  );
}

const ACTION_TONE = { closed: "#141414", "licence-suspended": "#c2410c", notice: "#78716c", "notice-proposed": "#78716c", "no-action": "#0f766e" };
const ACTION_LABEL = { closed: "Closed", "licence-suspended": "Licence suspended", notice: "Notice", "notice-proposed": "Notice proposed", "no-action": "No action listed" };
const normArea = (s = "") => s.toLowerCase().replace(/[^a-z]/g, "");

// Exact pins for records linked to a spot on our map or located by hand
// (data/inspection-places.json); the rest are counted
// per area and shown as one bubble at that area's centre, so no restaurant is
// given a location we don't actually know.
function safetyMapPoints(drives) {
  const centres = new Map();
  for (const e of getEateries()) {
    if (!e.discoveredIn || e.discoveredIn.startsWith("text:") || e.lat == null) continue;
    const k = normArea(e.discoveredIn);
    const c = centres.get(k) || { lat: 0, lng: 0, n: 0, name: e.discoveredIn };
    c.lat += e.lat; c.lng += e.lng; c.n += 1; centres.set(k, c);
  }
  const pins = [];
  const areas = new Map();
  for (const d of drives) {
    for (const en of d.entries || []) {
      const spot = en.spotId ? getEateryById(en.spotId) : null;
      if (spot?.lat != null) {
        pins.push({
          kind: "spot", lat: spot.lat, lng: spot.lng, tone: ACTION_TONE[en.action] || "#141414",
          title: en.name || spot.name, sub: `${ACTION_LABEL[en.action] || "Inspection"} · ${formatDate(d.date)}`, href: pathForSpotId(en.spotId),
        });
        continue;
      }
      if (en.place) {
        pins.push({
          kind: "spot", lat: en.place.lat, lng: en.place.lng, tone: ACTION_TONE[en.action] || "#141414",
          title: en.name, sub: `${ACTION_LABEL[en.action] || "Inspection"} · ${formatDate(d.date)}${en.area ? ` · ${en.area}` : ""}`, href: "#drives",
        });
        continue;
      }
      const c = centres.get(normArea(en.area));
      if (!c || c.n < 3) continue;
      const a = areas.get(c.name) || { lat: c.lat / c.n, lng: c.lng / c.n, count: 0, name: c.name };
      a.count += 1; areas.set(c.name, a);
    }
  }
  return [
    ...[...areas.values()].map((a) => ({ kind: "area", lat: a.lat, lng: a.lng, count: a.count, tone: "#141414", title: `${a.name}`, sub: `${a.count} inspection ${a.count === 1 ? "record" : "records"} in this area`, href: "#drives" })),
    ...pins,
  ];
}
