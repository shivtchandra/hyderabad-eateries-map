import Link from "next/link";
import BackButton from "./BackButton.jsx";

// Same three destinations as the app's bottom nav (You is app-only). Deals,
// food safety, stories, areas and dish guides all live under Guides now; the
// footer keeps every link for crawlers.
const NAV = [
  { href: "/", label: "Map" },
  { href: "/?tab=race", label: "Vote", match: ["/rankings", "/race"] },
  { href: "/guides", label: "Guides", match: ["/guides", "/stories", "/explore", "/areas", "/offers", "/food-safety", "/picks"] },
];


// One line of links on every width (swipes sideways on phones). The floating bottom bar shows too.
// linksHidden is kept for old callers; every page gets the same nav now.
// eslint-disable-next-line no-unused-vars
export function SiteNav({ active, linksHidden }) {
  return (
    <nav className="site-topnav" aria-label="Main">
      <Link href="/" className="site-logo" aria-label="Hyderabad Eats, open the map">
        <span className="site-logo-tile" aria-hidden="true">E</span>
        <span className="site-logo-name">Hyderabad Eats</span>
      </Link>
      {NAV.map((item) => (
        <Link key={item.href} href={item.href} className={`site-topnav-link${(item.match ? item.match.includes(active) : active === item.href) ? " active" : ""}`}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteBreadcrumb({ items }) {
  return (
    <div className="site-breadcrumb">
      {items.map((item, i) => (
        <span key={item.href}>
          {i > 0 && " · "}
          {i < items.length - 1 ? <Link href={item.href}>{item.label}</Link> : item.label}
        </span>
      ))}
    </div>
  );
}

// Slim footer. The full link list for crawlers already ships on every page in
// SeoCrawlNav (visually hidden), and the bottom nav / Guides cover browsing,
// so repeating 16 links here was only clutter.
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer-brand">
        <b>Hyderabad Eats</b>, part of <a href="https://mapmyhyd.com/">Mapping HYD</a>
      </p>
      <nav aria-label="More from Mapping HYD">
        <Link href="/about">About</Link>
        <Link href="/rankings/how-it-works">How rankings work</Link>
        <a href="https://startups.mapmyhyd.com/">Startup map</a>
        <a href="https://startups.mapmyhyd.com/jobs">Jobs in Hyderabad</a>
      </nav>
    </footer>
  );
}

export function SiteRelated({ links }) {
  if (!links?.length) return null;
  return (
    <section className="site-related">
      <h2>Also explore</h2>
      <div className="site-related-links">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>{l.label}</Link>
        ))}
      </div>
    </section>
  );
}

// `hero` replaces the default title block (the spot page leads with its photo).
export default function SiteChrome({ active, breadcrumb, title, description, children, related, heroClass, navLinksHidden, backFallback, hero }) {
  return (
    <div className="site-page">
      <header className="site-header">
        <div className="site-header-inner">
          <SiteNav active={active} linksHidden={navLinksHidden} />
          {backFallback && <BackButton fallback={backFallback} />}
          {/* A custom hero (spot page) carries its own area kicker. */}
          {!hero && breadcrumb?.length > 0 && <SiteBreadcrumb items={breadcrumb} />}
          {hero || (
            <div className={`site-hero${heroClass ? ` ${heroClass}` : ""}`}>
              <h1>{title}</h1>
              {description && <p>{description}</p>}
            </div>
          )}
        </div>
      </header>
      <main className="site-body">{children}</main>
      {related && <div className="site-body" style={{ paddingTop: 0 }}><SiteRelated links={related} /></div>}
      <SiteFooter />
    </div>
  );
}
