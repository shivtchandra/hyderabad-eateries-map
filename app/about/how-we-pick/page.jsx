import Link from "next/link";
import SiteChrome from "../../components/SiteChrome.jsx";
import { pageMeta } from "../../../lib/site.js";
import { askStats } from "../../../lib/askPages.js";
import { recommendationsEnabled } from "../../../lib/recommendationShared.js";

export const metadata = pageMeta({ title: "How Hyderabad Eats picks places", description: "How we count what r/hyderabad recommends, how dishes and weekly community polls work, and what the verified consensus numbers on Hyderabad Eats mean.", path: "/about/how-we-pick" });

export default function HowWePick() {
  const s = askStats();
  return <SiteChrome backFallback="/about" title="How we pick" description="What the numbers on Hyderabad Eats mean, and what they don't." breadcrumb={[{ href: "/", label: "Map" }, { href: "/about/how-we-pick", label: "How we pick" }]}>
    <div className="ask-page">
      <section className="ask-block"><h2>Where the counts come from</h2>
        <p>Every week we read public r/hyderabad threads about food through Reddit's official API: currently {s.threads.toLocaleString("en-IN")} threads and {s.comments.toLocaleString("en-IN")} comments from the last {s.months} months. Place names are matched literally to the places on our map. No AI writes or scores anything.</p>
        <p>We count <b>people, not comments</b>. One person praising a place five times counts once. Deleted accounts, bots and promotional posts (discount codes, "our restaurant", Instagram links) don't count.</p>
      </section>
      <section className="ask-block"><h2>When a place is recommended</h2>
        <ul className="ask-related">
          <li>At least 3 different people recommend it, and at least twice as many recommend it as warn against it.</li>
          <li>A mention is a warning when its sentence says avoid, overrated, went downhill, worst, food poisoning and similar.</li>
          <li>Places also qualify through our editors, by appearing in the weekly Eats standings with at least one vote, or when visitors suggest them and we verify them.</li>
          <li>Movie titles and landmarks ("Paradise circle", "near Paradise metro") are not counted as mentions of the restaurant.</li>
        </ul>
      </section>
      <section className="ask-block"><h2>Dishes and polls</h2>
        <ul className="ask-related">
          <li>"What to order" comes from dishes people name in the same sentence as the place, our editors' signature dishes, and dishes visitors add.</li>
          <li>A dish a visitor adds shows publicly once 2 different people add it.</li>
          <li>Polls allow one vote per browser, which you can change. Percentages show from 20 votes.</li>
        </ul>
      </section>
      <section className="ask-block"><h2>Quotes</h2>
        <p>Quotes are short excerpts (160 characters or less) from public comments, always linked to the original. We never show usernames.</p>
      </section>
      <section className="ask-block"><h2>What the numbers are not</h2>
        <p>They are not ratings, reviews or a guarantee of today's menu, prices or hours. Popular places get talked about more, and branches of the same brand share one count unless locals name a branch.</p>
        <p>{recommendationsEnabled() && <><Link href="/ask">Questions locals ask</Link> · <Link href="/guides/dishes">Dish guides</Link> · </>}<Link href="/">Map</Link></p>
      </section>
    </div>
  </SiteChrome>;
}
