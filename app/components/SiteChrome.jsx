import Link from "next/link";

const NAV = [
  { href: "/", label: "Map" },
  { href: "/stories", label: "Stories" },
  { href: "/rankings", label: "Rankings" },
  { href: "/explore", label: "Explore" },
  { href: "/areas", label: "Areas" },
];

export function SiteNav({ active }) {
  return (
    <nav className="site-topnav" aria-label="Main">
      <Link href="/" className="site-logo">Hyderabad Eats</Link>
      {NAV.map((item) => (
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
        <Link href="/stories">Stories</Link>
        <Link href="/rankings">Rankings</Link>
        <Link href="/explore">Explore</Link>
        <Link href="/areas">Areas</Link>
        <Link href="/explore/cafes">Cafes</Link>
        <Link href="/explore/biryani-and-local">Biryani</Link>
        <Link href="/rankings/best-biryani-in-hyderabad">Best Biryani</Link>
        <Link href="/rankings/best-cafe-in-hyderabad">Best Cafes</Link>
        <a href="https://www.mapmyhyd.com/" rel="noopener noreferrer" target="_blank">Mapping HYD</a>
        <a href="https://startups.mapmyhyd.com/" rel="noopener noreferrer" target="_blank">Hyderabad Startup Map</a>
      </nav>
      <div>Community-voted food rankings &amp; map · 3,400+ spots in Hyderabad</div>
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

export default function SiteChrome({ active, breadcrumb, title, description, children, related }) {
  return (
    <div className="site-page">
      <header className="site-header">
        <div className="site-header-inner">
          <SiteNav active={active} />
          {breadcrumb?.length > 0 && <SiteBreadcrumb items={breadcrumb} />}
          <div className="site-hero">
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
