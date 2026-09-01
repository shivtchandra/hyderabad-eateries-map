import Link from "next/link";
import SiteChrome from "../../components/SiteChrome.jsx";
import { pageMeta } from "../../../lib/site.js";

const title = "How Hyderabad Eats Rankings Work";
const description =
  "Community-voted weekly food rankings for Hyderabad. One vote per person per week, refreshed results, and map-backed spot pages.";

export const metadata = {
  ...pageMeta({ title, description, path: "/rankings/how-it-works" }),
};

export default function HowItWorksPage() {
  return (
    <SiteChrome
      active="/rankings"
      breadcrumb={[
        { href: "/", label: "Home" },
        { href: "/rankings", label: "Rankings" },
        { href: "/rankings/how-it-works", label: "How it works" },
      ]}
      title={title}
      description={description}
      related={[
        { href: "/rankings/best-biryani-in-hyderabad", label: "Best biryani vote" },
        { href: "/rankings/best-cafe-in-hyderabad", label: "Best cafe vote" },
        { href: "/explore/cafes", label: "Explore cafes" },
      ]}
    >
      <div className="site-prose">
        <h2>Weekly community votes</h2>
        <p>
          Each week we run one themed vote — for example, best biryani or best cafe in Hyderabad.
          Anyone can vote on the map. Results update live and are published on public ranking pages.
        </p>

        <h2>One vote per person</h2>
        <p>
          You get one vote per weekly theme. Change your mind anytime before the week ends — your latest pick counts.
        </p>

        <h2>Passport visits (optional)</h2>
        <p>
          Stamp spots on the map when you visit. Passport stamps are for fun and discovery — votes are separate and open to everyone.
        </p>

        <h2>Why trust these rankings?</h2>
        <p>
          Unlike static listicles, our standings refresh every week with real community votes.
          We show vote counts, winners, and link every result to a map-backed spot page with ratings and area context.
        </p>

        <h2>FAQ</h2>
        <p><strong>Where is the best biryani in Hyderabad?</strong> Check the current{" "}
          <Link href="/rankings/best-biryani-in-hyderabad">Best Biryani ranking</Link> — updated weekly.</p>
        <p><strong>How do I vote?</strong> Open the <Link href="/">map</Link>, find a spot, and cast your vote during an active theme.</p>
      </div>

      <Link href="/rankings" className="site-cta">See current rankings →</Link>
    </SiteChrome>
  );
}
