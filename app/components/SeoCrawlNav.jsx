import Link from "next/link";

/** Server-rendered intro + links so crawlers/answer engines see real homepage content. */
export default function SeoCrawlNav() {
  return (
    <nav className="seo-crawl-nav" aria-label="Hyderabad Eats directory">
      <h1>Hyderabad Eats — food map &amp; local rankings</h1>
      <p>
        Mapping HYD Eats is a free Hyderabad food map of 3,400+ restaurants, cafes, and local spots,
        with community-voted weekly rankings for biryani, cafes, restaurants, and more. Browse by area
        or category, then open the live map to stamp visits and vote.
      </p>
      <p>
        Looking for the best biryani in Hyderabad, best restaurants in Jubilee Hills or Banjara Hills,
        or cafes to work from? Start with the rankings and area pages below.
      </p>
      <h2>Popular rankings</h2>
      <ul>
        <li><Link href="/rankings/best-biryani-in-hyderabad">Best biryani in Hyderabad</Link></li>
        <li><Link href="/rankings/best-buffet-in-hyderabad">Best buffet in Hyderabad</Link></li>
        <li><Link href="/rankings/best-fine-dining-in-hyderabad">Best fine dining in Hyderabad</Link></li>
        <li><Link href="/rankings/best-mandi-in-hyderabad">Best mandi in Hyderabad</Link></li>
        <li><Link href="/explore/restaurants">Best restaurants in Hyderabad</Link></li>
        <li><Link href="/rankings/best-cafe-in-hyderabad">Best cafe in Hyderabad</Link></li>
        <li><Link href="/rankings">All weekly food rankings</Link></li>
      </ul>
      <h2>Food by area</h2>
      <ul>
        <li><Link href="/areas/jubilee-hills">Cafes in Jubilee Hills</Link></li>
        <li><Link href="/areas/gachibowli">Best restaurants in Gachibowli</Link></li>
        <li><Link href="/areas/madhapur-hitec">Best restaurants in Madhapur</Link></li>
        <li><Link href="/areas/kondapur">Best restaurants in Kondapur</Link></li>
        <li><Link href="/areas/secunderabad">Best restaurants in Secunderabad</Link></li>
        <li><Link href="/areas/banjara-hills">Restaurants in Banjara Hills</Link></li>
        <li><Link href="/areas">All Hyderabad food areas</Link></li>
      </ul>
      <h2>Explore &amp; stories</h2>
      <ul>
        <li><Link href="/explore">Explore food by category</Link></li>
        <li><Link href="/explore/cafes">Cafes in Hyderabad</Link></li>
        <li><Link href="/explore/biryani-and-local">Biryani &amp; local food</Link></li>
        <li><Link href="/stories">Stories behind iconic cafes</Link></li>
        <li><Link href="/rankings/how-it-works">How rankings work</Link></li>
      </ul>
      <h2>FAQ</h2>
      <p>
        <strong>What is Hyderabad Eats?</strong> A Mapping HYD layer: an interactive food map plus
        community rankings for places across the city.
      </p>
      <p>
        <strong>How are rankings made?</strong> Weekly community votes on the map, shown next to an
        all-time Google-review baseline so you can compare both lists.
      </p>
      <p>
        <strong>Is it free?</strong> Yes — no signup required to browse the map, rankings, or area pages.
      </p>
      <p>
        Part of <a href="https://mapmyhyd.com/" rel="noopener noreferrer">Mapping HYD</a>
        {" · "}
        <a href="https://startups.mapmyhyd.com/" rel="noopener noreferrer">Hyderabad Startup Map</a>
      </p>
    </nav>
  );
}
