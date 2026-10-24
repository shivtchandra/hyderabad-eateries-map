import Link from "next/link";
import SiteChrome from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { pageMeta, getSiteUrl } from "../../../lib/site.js";
import { breadcrumbJsonLd } from "../../../lib/schema.js";

const title = "How Hyderabad Eats Rankings Work";
const description =
  "Continuous community food rankings for Hyderabad with all-time preferences, monthly standings, visible vote totals, and map-backed venue evidence.";

export const metadata = {
  ...pageMeta({ title, description, path: "/rankings/how-it-works" }),
};

export default function HowItWorksPage() {
  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Rankings", url: `${getSiteUrl()}/rankings` },
    { name: "How it works", url: `${getSiteUrl()}/rankings/how-it-works` },
  ]);

  return (
    <div style={{ paddingBottom: 84 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    <SiteChrome backFallback="/rankings"
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
        <h2>Continuous community votes</h2>
        <p>
          Each topic, such as best biryani or best cafe in Hyderabad, keeps a continuing all-time leaderboard.
          The currently promoted topic changes, but every published ranking remains open for voting.
        </p>

        <h2>All time and this month</h2>
        <p>
          Your latest pick counts toward the all-time board. You can also participate once in each Hyderabad
          calendar month, switch during that month, and compare the current month with earlier monthly results.
        </p>

        <h2>Passport visits (optional)</h2>
        <p>
          Stamp spots on the map when you visit. Passport stamps are for fun and discovery, votes are separate and open to everyone.
        </p>

        <h2>Why trust these rankings?</h2>
        <p>
          Unlike static listicles, the standings continue updating from community preferences.
          We show vote totals, leader share, monthly movement, what locals order, and map-backed area context.
        </p>

        <h2>FAQ</h2>
        <p><strong>Where is the best biryani in Hyderabad?</strong> Check the current{" "}
          <Link href="/rankings/best-biryani-in-hyderabad">Best Biryani ranking</Link>, with all-time and monthly results.</p>
        <p><strong>How do I vote?</strong> Open a ranking or the <Link href="/">map</Link>, find your exact branch, and cast or switch your vote.</p>
      </div>

      <Link href="/rankings" className="site-cta">See current rankings →</Link>
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="race" />
    </div>
    </div>
  );
}
