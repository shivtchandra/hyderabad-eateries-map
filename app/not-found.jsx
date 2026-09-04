import Link from "next/link";
import SiteChrome from "./components/SiteChrome.jsx";

export const metadata = {
  title: "Page not found, Hyderabad Eats",
  description: "This page doesn't exist. Explore food rankings, areas and 3,400+ spots on the map.",
  openGraph: {
    images: [{ url: "/og/404.svg", width: 1200, height: 630, alt: "Page not found" }],
  },
};

export default function NotFound() {
  return (
    <SiteChrome
      breadcrumb={[{ href: "/", label: "Home" }, { href: "#", label: "404" }]}
      title="Page not found"
      description="This spot on the internet doesn't exist, but 3,400+ real ones do."
      related={[
        { href: "/", label: "Open the map" },
        { href: "/rankings", label: "Weekly rankings" },
        { href: "/explore", label: "Explore categories" },
        { href: "/areas", label: "Browse areas" },
      ]}
    >
      <div className="site-not-found">
        <h1>404</h1>
        <p style={{ fontSize: 16, color: "var(--ink-soft)", margin: "12px 0 24px" }}>Lost your way? Try one of these instead.</p>
        <div className="site-grid" style={{ maxWidth: 520, margin: "0 auto" }}>
          <Link href="/" className="site-card"><h3>Map</h3><p>Explore &amp; vote</p></Link>
          <Link href="/rankings" className="site-card"><h3>Rankings</h3><p>Weekly votes</p></Link>
          <Link href="/explore/cafes" className="site-card"><h3>Cafes</h3><p>Top cafes</p></Link>
          <Link href="/rankings/best-biryani-in-hyderabad" className="site-card"><h3>Biryani</h3><p>Best biryani vote</p></Link>
        </div>
      </div>
    </SiteChrome>
  );
}
