import Link from "next/link";

/** Server-rendered links so crawlers discover SEO pages from the map homepage. */
export default function SeoCrawlNav() {
  return (
    <nav className="seo-crawl-nav" aria-label="Site sections">
      <Link href="/stories">Stories behind Hyderabad's iconic cafes</Link>
      <Link href="/spot/ChIJVy0-aGiXyzsRWMiIWZ1fC30">Cafe Niloufer Jubilee Hills story</Link>
      <Link href="/spot/ChIJ4UHRkeSTyzsRiFzajl4M9z0">Cafe Niloufer Hitech City</Link>
      <Link href="/spot/ChIJ1Z7b5_mXyzsR_6g6Az9fWjk">Nimrah Cafe Charminar story</Link>
      <Link href="/spot/ChIJGypuNaiRyzsR-smd2ySqMuo">Rameshwaram Cafe Madhapur story</Link>
      <Link href="/spot/ChIJIfN2naWRyzsRQ884HoebNm8">Ishtaa HITEC City tiffin story</Link>
      <Link href="/spot/ChIJJciqpn6RyzsReV8FPqZW5Mo">Penam Jubilee Hills dosa story</Link>
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
      <Link href="/rankings/new-restaurants-in-hyderabad">New restaurants in Hyderabad</Link>
      <Link href="/rankings/best-rooftop-restaurants-in-hyderabad">Rooftop restaurants in Hyderabad</Link>
      <Link href="/rankings/best-work-friendly-cafes-in-hyderabad">Work-friendly cafes in Hyderabad</Link>
      <Link href="/rankings/best-irani-cafe-in-hyderabad">Best Irani cafe in Hyderabad</Link>
      <Link href="/rankings/best-breakfast-places-in-hyderabad">Best breakfast places in Hyderabad</Link>
      <Link href="/rankings/best-shawarma-in-hyderabad">Best shawarma in Hyderabad</Link>
      <Link href="/rankings/best-mandi-in-hyderabad">Best mandi in Hyderabad</Link>
      <Link href="/rankings/best-street-food-in-hyderabad">Best street food in Hyderabad</Link>
      <Link href="/explore/restaurants">Best restaurants in Hyderabad</Link>
      <a href="https://www.mapmyhyd.com/" rel="noopener noreferrer" target="_blank">Mapping HYD</a>
      <a href="https://startups.mapmyhyd.com/" rel="noopener noreferrer" target="_blank">Hyderabad Startup Map</a>
    </nav>
  );
}
