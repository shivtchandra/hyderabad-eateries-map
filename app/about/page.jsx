import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
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
    <div style={{ paddingBottom: 84 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutLd) }} />
      <SiteChrome backFallback="/"
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

          <h2 id="photo-policy">Photo sources and removal requests</h2>
          <p>
            Restaurant photos include images sourced through Google Places and, for some listings, image links from
            Zomato. These third-party images belong to their respective rights holders. We do not claim ownership of
            them or imply endorsement by the restaurants or source platforms.
          </p>
          <p>
            This notice explains our sources; it does not grant permission to reuse images or replace the permissions
            and source-platform terms that apply.
          </p>
          <p>
            If you own the rights to a photo and want it removed or its credit corrected, email{" "}
            <a href="mailto:shivachandra9490@gmail.com">shivachandra9490@gmail.com</a>. Please include the restaurant page link, identify the photo,
            and explain your connection to the image. We will review your request and remove or correct the image as
            appropriate.
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
            the request box on the <Link href="/?tab=race">This Week</Link> page, or reach us through{" "}
            <a href="https://mapmyhyd.com">Mapping HYD</a>. We review every report and fix confirmed errors quickly.
          </p>
        </div>
      </SiteChrome>
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="about" />
      </div>
    </div>
  );
}
