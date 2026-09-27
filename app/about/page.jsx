import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { breadcrumbJsonLd } from "../../lib/schema.js";

const title = "About Hyderabad Eats & Editorial Policy";
const description =
  "Who runs Hyderabad Eats, where our restaurant data comes from, how community votes and rankings work, and how to report a correction.";

export const metadata = {
  ...pageMeta({ title, description, path: "/about" }),
};

export default function AboutPage() {
  const siteUrl = getSiteUrl();
  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: "About", url: `${siteUrl}/about` },
  ]);
  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: title,
    url: `${siteUrl}/about`,
    description,
    publisher: {
      "@type": "Organization",
      name: "Hyderabad Eats",
      url: siteUrl,
      parentOrganization: { "@type": "Organization", name: "Mapping HYD", url: "https://mapmyhyd.com" },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutLd) }} />
      <SiteChrome
        breadcrumb={[{ href: "/", label: "Home" }, { href: "/about", label: "About" }]}
        title="About Hyderabad Eats"
        description="A free, independent food map of Hyderabad, built with the people who eat here."
        related={[
          { href: "/rankings/how-it-works", label: "How rankings work" },
          { href: "/food-safety", label: "Food safety tracker" },
          { href: "/rankings", label: "Community rankings" },
        ]}
      >
        <div className="site-prose">
          <h2>What Hyderabad Eats is</h2>
          <p>
            Hyderabad Eats is part of <a href="https://mapmyhyd.com">Mapping HYD</a>, a set of free maps about the city.
            It covers more than 3,600 restaurants, cafes, bakeries and local spots, grouped by area and category, with
            weekly community votes, area guides and a passport to stamp the places you have eaten at.
          </p>

          <h2>Where our information comes from</h2>
          <p>
            Spot details such as address, hours, ratings and review counts come from public Google listings and are
            refreshed regularly. Weekly rankings come from votes cast by visitors on the map. Guides are written by our
            editorial team and draw on community discussion (for example r/hyderabad) and our own visits. The food safety
            tracker lists only official TG SAFE inspection drives, each linked to its sources.
          </p>

          <h2>Editorial policy</h2>
          <p>
            Rankings and guides are independent. Restaurants cannot pay to appear, move up a ranking or remove a
            listing, and we do not run sponsored placements. Community rankings show the votes as cast, one live vote per
            person per dish, and every result links to a spot page with its rating and area.
          </p>
          <p>
            When we name a restaurant in the food safety tracker, we use neutral wording, show the date and the action
            taken, and update the status after a re-inspection.
          </p>

          <h2>Corrections and contact</h2>
          <p>
            Found a wrong address, closed place, outdated hours or a food safety record that has changed? Tell us through
            the request box on the <Link href="/race/this-week">This Week</Link> page, or reach us through{" "}
            <a href="https://mapmyhyd.com">Mapping HYD</a>. We review every report and fix confirmed errors quickly.
          </p>
        </div>
      </SiteChrome>
    </>
  );
}
