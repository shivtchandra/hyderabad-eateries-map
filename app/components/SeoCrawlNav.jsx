import Link from "next/link";

/** Server-rendered links so crawlers discover SEO pages from the map homepage. */
export default function SeoCrawlNav() {
  return (
    <nav className="seo-crawl-nav" aria-label="Site sections">
      <Link href="/rankings">Weekly food rankings in Hyderabad</Link>
      <Link href="/rankings/how-it-works">How Hyderabad Eats rankings work</Link>
      <Link href="/explore/cafes">Best cafes in Hyderabad</Link>
      <Link href="/explore/biryani-and-local">Best biryani in Hyderabad</Link>
      <Link href="/explore">Explore food categories</Link>
      <Link href="/areas">Hyderabad areas</Link>
      <Link href="/rankings/best-biryani-in-hyderabad">Vote: best biryani</Link>
      <Link href="/rankings/best-cafe-in-hyderabad">Vote: best cafe</Link>
      <Link href="/areas/gachibowli">Restaurants in Gachibowli, Hyderabad</Link>
      <Link href="/areas/jubilee-hills">Restaurants &amp; Cafes in Jubilee Hills</Link>
      <Link href="/areas/banjara-hills">Restaurants in Banjara Hills, Hyderabad</Link>
      <Link href="/areas/madhapur-hitec">Restaurants in HITEC City &amp; Madhapur</Link>
      <Link href="/rankings/best-dinner-restaurants-in-hyderabad">Best dinner restaurants in Hyderabad</Link>
      <Link href="/rankings/best-brewery-in-hyderabad">Best brewery in Hyderabad</Link>
      <Link href="/rankings/best-late-night-restaurants-in-hyderabad">Late night restaurants in Hyderabad</Link>
      <a href="https://www.mapmyhyd.com/" rel="noopener noreferrer" target="_blank">Mapping HYD</a>
      <a href="https://startups.mapmyhyd.com/" rel="noopener noreferrer" target="_blank">Hyderabad Startup Map</a>
    </nav>
  );
}
