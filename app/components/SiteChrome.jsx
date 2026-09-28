import Link from "next/link";
import { Squiggles } from "./Icons.jsx";
import BackButton from "./BackButton.jsx";

const NAV = [
  { href: "/", label: "Map" },
  { href: "/offers", label: "Deals" },
  { href: "/stories", label: "Stories" },
  { href: "/rankings", label: "Rankings" },
  { href: "/explore", label: "Explore" },
  { href: "/areas", label: "Areas" },
];

export function SiteNav({ active, linksHidden }) {
  return (
    <nav className="site-topnav" aria-label="Main">
      <Link href="/" className="site-logo">Hyderabad Eats</Link>
      {!linksHidden && NAV.map((item) => (
        <Link key={item.href} href={item.href} className={active === item.href ? "active" : undefined}>
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

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav aria-label="Footer">
        <Link href="/">Map</Link>
        <Link href="/rankings">Rankings</Link>
        <Link href="/rankings/best-buffet-in-hyderabad">Best Buffet</Link>
        <Link href="/rankings/best-fine-dining-in-hyderabad">Best Fine Dining</Link>
        <Link href="/rankings/best-biryani-in-hyderabad">Best Biryani</Link>
        <Link href="/rankings/best-cafe-in-hyderabad">Best Cafes</Link>
        <Link href="/areas/jubilee-hills">Jubilee Hills</Link>
        <Link href="/areas/gachibowli">Gachibowli</Link>
        <Link href="/areas/kondapur">Kondapur</Link>
        <Link href="/areas">Areas</Link>
        <Link href="/explore">Explore</Link>
        <Link href="/offers">Dining Deals</Link>
        <Link href="/stories">Stories</Link>
        <Link href="/food-safety">Food safety</Link>
        <Link href="/about">About</Link>
      </nav>
      <nav aria-label="Mapping HYD series">
        <a href="https://mapmyhyd.com/">Mapping HYD</a>
        <a href="https://startups.mapmyhyd.com/">Mapping HYD Startups</a>
        <a href="https://startups.mapmyhyd.com/jobs">Jobs in Hyderabad</a>
      </nav>
      <div>Part of Mapping HYD — community-voted food rankings &amp; map · 3,400+ spots</div>
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

export default function SiteChrome({ active, breadcrumb, title, description, children, related, heroClass, navLinksHidden, heroDecor, backFallback }) {
  return (
    <div className="site-page">
      <header className="site-header" style={heroDecor ? { position: "relative", overflow: "hidden" } : undefined}>
        {heroDecor && (
          <div style={{ position: "absolute", inset: "-10% -5% 30%", opacity: 0.22, pointerEvents: "none" }}>
            <Squiggles color="var(--cream-hi)" opacity={1} />
          </div>
        )}
        <div className="site-header-inner" style={heroDecor ? { position: "relative" } : undefined}>
          <SiteNav active={active} linksHidden={navLinksHidden} />
          {backFallback && <BackButton fallback={backFallback} />}
          {breadcrumb?.length > 0 && <SiteBreadcrumb items={breadcrumb} />}
          <div className={`site-hero${heroClass ? ` ${heroClass}` : ""}`}>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
        </div>
      </header>
      <main className="site-body">{children}</main>
      {related && <div className="site-body" style={{ paddingTop: 0 }}><SiteRelated links={related} /></div>}
      <SiteFooter />
    </div>
  );
}
