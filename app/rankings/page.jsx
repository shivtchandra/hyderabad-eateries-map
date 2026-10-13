import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { getAllRankingsThemes } from "../../lib/themesServer.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../../lib/rankings.js";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { breadcrumbJsonLd } from "../../lib/schema.js";
import { stickerForTitle } from "../../lib/stickerArt.js";
import HubAnswer, { HubFaq } from "../components/HubAnswer.jsx";
import { hubJsonLd, todayIso } from "../../lib/hubSeo.js";

export const dynamic = "force-dynamic";

const title = "Hyderabad Food Rankings";
const description = "Community-voted weekly rankings for the best biryani, breweries, mandi, buffets, cafes, and fine dining in Hyderabad. Compare votes and cast yours.";

export const metadata = {
  ...pageMeta({ title, description, path: "/rankings" }),
  openGraph: { ...pageMeta({ title, description, path: "/rankings" }).openGraph, images: ogImages(title, description, "/rankings") },
};

// "Best Dosa in Hyderabad" -> question hook / short label for the index.
function hook(title = "") {
  const m = title.match(/^best (.+?) in hyderabad$/i);
  return m ? `Hyderabad’s best ${m[1].toLowerCase()}?` : title;
}
function short(title = "") {
  const t = title.replace(/\s+in\s+hyderabad$/i, "");
  return t.charAt(0) + t.slice(1).toLowerCase();
}

function statusOf(theme) {
  if (theme.active && !theme.winnerId) return "live";
  if (theme.winnerId) return "winner";
  return "ended";
}

export default async function RankingsHubPage() {
  let themes = [];
  try {
    themes = await getAllRankingsThemes(50);
  } catch {
    themes = [];
  }
  const live = themes.filter((t) => t.active && !t.winnerId);
  const past = themes.filter((t) => !t.active || t.winnerId);
  const themeSlugs = new Set(themes.map((t) => t.slug));
  const upcoming = SEO_THEME_PICKS.filter((p) => !themeSlugs.has(slugFromTitle(p.title)));

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Rankings", url: `${getSiteUrl()}/rankings` },
  ]);
  // Answer-first: the current #1s are what people (and AI answers) ask for.
  const allVotes = themes.reduce((n, t) => n + (t.results || []).reduce((m, r) => m + (r.count || 0), 0), 0);
  const crowned = themes.filter((t) => t.winnerId && t.winnerName).slice(0, 4);
  const updated = todayIso();
  const faqs = [
    ...crowned.slice(0, 2).map((t) => ({ q: `What is the ${t.title.toLowerCase()}?`, a: `${t.winnerName}, voted #1 by Hyderabad locals on Hyderabad Eats. Votes stay open, so the crown can move.` })),
    { q: "How are Hyderabad Eats rankings decided?", a: "By weekly community votes from Hyderabad locals. One vote per person per ranking; the spot with the most votes holds #1." },
    { q: "Can I add a restaurant that isn't on the list?", a: "Yes. Open the ranking and use 'Can't see your pick? Add it'. New places show up once checked." },
  ];
  const ld = hubJsonLd({ name: title, description, path: "/rankings", updated, faqs, items: themes.map((t) => ({ name: t.title, url: `/rankings/${t.slug}` })) });

  return (
    <div style={{ paddingBottom: 84 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    {ld.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
    <SiteChrome
      active="/rankings"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/rankings", label: "Rankings" }]}
      title={title}
      description={`Hyderabad Eats ranks the city's food by weekly votes from locals: ${themes.length} rankings and ${allVotes.toLocaleString("en-IN")} votes so far.${crowned.length ? ` Current #1s: ${crowned.map((t) => `${t.title.replace(/\s+in\s+hyderabad$/i, "")}, ${t.winnerName}`).join("; ")}.` : ""}`}
      related={[
        { href: "/rankings/how-it-works", label: "How rankings work" },
        { href: "/rankings/best-biryani-in-hyderabad", label: "Best biryani" },
        { href: "/rankings/best-buffet-in-hyderabad", label: "Best buffet" },
        { href: "/rankings/best-fine-dining-in-hyderabad", label: "Fine dining" },
        { href: "/rankings/best-cafe-in-hyderabad", label: "Best cafes" },
        { href: "/explore", label: "Explore categories" },
        { href: "/areas", label: "Browse areas" },
      ]}
    >
      <HubAnswer
        stats={[{ value: themes.length, label: "rankings" }, { value: allVotes.toLocaleString("en-IN"), label: "local votes" }, { value: live.length, label: live.length === 1 ? "live vote" : "live votes" }]}
        updated={updated}
      />
      {/* One index of every ranking (Vote mockup): the live one first as a
          yellow card, then every past ranking with its live #1. Votes stay
          open, so nothing here says "ended". */}
      {live.map((theme) => {
        const totalVotes = (theme.results || []).reduce((s, r) => s + (r.count || 0), 0);
        const leader = theme.results?.[0];
        return (
          <Link key={theme.id} href={`/rankings/${theme.slug}`} className="rk-live-card">
            {stickerForTitle(theme.title) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="rk-live-sticker" src={stickerForTitle(theme.title)} alt="" width={120} height={120} />
            )}
            <span className="rk-live-kicker">Live vote</span>
            <span className="rk-live-q">{hook(theme.title)}</span>
            <span className="rk-live-meta">
              {leader ? `#1 ${leader.name} · ${totalVotes} ${totalVotes === 1 ? "vote" : "votes"} so far` : "No votes yet. Yours starts it."}
            </span>
            <span className="rk-live-cta">Vote now</span>
          </Link>
        );
      })}
      {live.length === 0 && (
        <div className="site-card" style={{ marginBottom: 16 }}>
          <p>No live vote this week. Every ranking below is still open.</p>
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="site-section-title">Every ranking</h2>
          <ul className="rk-index">
            {past.map((theme) => {
              const st = statusOf(theme);
              const totalVotes = (theme.results || []).reduce((s, r) => s + (r.count || 0), 0);
              const leader = theme.results?.[0];
              return (
                <li key={theme.id}>
                  <Link href={`/rankings/${theme.slug}`} className={`rank-card rk-index-card${st === "winner" ? " is-crowned" : ""}`}>
                    <span className={`sticker-tile${st === "winner" ? " sticker-tile--sun" : ""}`} aria-hidden="true">
                      {stickerForTitle(theme.title)
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={stickerForTitle(theme.title)} alt="" loading="lazy" width={56} height={56} />
                        : <span>{short(theme.title).replace(/^best\s+/i, "").charAt(0)}</span>}
                    </span>
                    <span className="rank-card-main">
                      <span className="rank-card-title">{short(theme.title)}</span>
                      <span className="rank-card-meta">
                        {st === "winner" && <span className="ink-chip">Crowned</span>}
                        {leader ? <><b>{theme.winnerName || leader.name}</b>{totalVotes > 0 ? ` · ${totalVotes} votes` : ""}</> : "No votes yet"}
                      </span>
                    </span>
                    <span className="rank-card-vote" aria-hidden="true">Vote</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className="site-section-title">More to vote on</h2>
          <div className="site-grid">
            {upcoming.map((p) => (
              <Link key={p.title} href={`/rankings/${slugFromTitle(p.title)}`} className="site-card">
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </Link>
            ))}
          </div>
        </>
      )}
      <HubFaq faqs={faqs} />
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="race" />
    </div>
    </div>
  );
}
