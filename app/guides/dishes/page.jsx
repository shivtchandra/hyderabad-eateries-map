import Link from "next/link";
import SiteChrome from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import HubAnswer, { HubFaq } from "../../components/HubAnswer.jsx";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { hubJsonLd, todayIso } from "../../../lib/hubSeo.js";
import { GUIDES, rankingCards, sticker } from "../../../lib/guidesData.js";

// Dish guides: what to eat in Hyderabad, dish by dish. Long-form guides
// (tiffins, late night, breweries, the Reddit-counted ones) plus every dish
// ranking locals vote on. Its own page so it can rank for "best X in Hyderabad".
const title = "Hyderabad Dish Guides: What to Eat and Where";
const description = "What to eat in Hyderabad, dish by dish: biryani, haleem, Irani chai, tiffins, mandi, late night food, desserts and breweries, with the spots locals vote for.";
const path = "/guides/dishes";

export const metadata = {
  ...pageMeta({ title, description, path }),
  openGraph: { ...pageMeta({ title, description, path }).openGraph, images: ogImages(title, description, path) },
  keywords: ["what to eat in hyderabad", "hyderabad food guide", "best biryani hyderabad", "best haleem hyderabad", "irani chai hyderabad", "hyderabad breakfast tiffins", "late night food hyderabad"],
};

export default function DishGuidesPage() {
  const rankings = rankingCards();
  const updated = todayIso();
  const faqs = [
    { q: "What food is Hyderabad famous for?", a: "Hyderabadi dum biryani above all, then haleem (especially in Ramzan), Irani chai with Osmania biscuits, mandi, kebabs and shawarma, plus tiffins like ghee dosa and pesarattu for breakfast." },
    { q: "Where should I eat biryani in Hyderabad?", a: "The biryani ranking is voted weekly by Hyderabad locals, so the order reflects where people actually go right now. The Reddit biryani guide counts how often each spot is recommended on r/hyderabad." },
    { q: "Where can I eat late at night in Hyderabad?", a: "The late night guide lists spots that stay open after midnight, from biryani and shawarma to Irani chai." },
  ];
  const ld = hubJsonLd({
    name: title, description, path, updated, faqs,
    items: [...GUIDES.map((g) => ({ name: g.label, url: g.href })), ...rankings.map((r) => ({ name: r.label, url: `/rankings/${r.slug}` }))],
  });

  return (
    <div style={{ paddingBottom: 84 }}>
      {ld.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
      <SiteChrome
        active="/guides"
        backFallback="/guides"
        breadcrumb={[{ href: "/", label: "Home" }, { href: "/guides", label: "Guides" }, { href: path, label: "Dish guides" }]}
        title="Dish guides"
        description="What to eat in Hyderabad, dish by dish, and where locals go for it."
      >
        <HubAnswer
          answer={`To eat like a local in Hyderabad, start with dum biryani, haleem, Irani chai and a ghee dosa breakfast. These ${GUIDES.length} guides and ${rankings.length} dish rankings show where Hyderabad locals go for each, from r/hyderabad threads and weekly community votes.`}
          stats={[{ value: GUIDES.length, label: "dish guides" }, { value: rankings.length, label: "dish rankings" }, { value: "Weekly", label: "local votes" }]}
          updated={updated}
        />

        <h2 className="site-section-title">Guides</h2>
        <ul className="hub-list">
          {GUIDES.map((g, i) => (
            <li key={g.href}>
              <Link href={g.href} className={`hub-card${i === 0 ? " hub-card--sun" : ""}`}>
                {sticker(g.key) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sticker(g.key)} alt="" loading="lazy" />
                )}
                <b>{g.label}</b>
                <span>{g.note}</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="site-section-title">Best in Hyderabad, voted by locals</h2>
        <ul className="hub-list">
          {rankings.map((r) => (
            <li key={r.slug}>
              <Link href={`/rankings/${r.slug}`} className="hub-card">
                {r.art && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.art} alt="" loading="lazy" />
                )}
                <b>{r.label} in Hyderabad</b>
                <span>See the board and vote</span>
              </Link>
            </li>
          ))}
        </ul>

        <HubFaq faqs={faqs} />
      </SiteChrome>
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="guides" />
      </div>
    </div>
  );
}
