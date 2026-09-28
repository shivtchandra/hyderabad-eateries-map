import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { getAllRankingsThemes } from "../../lib/themesServer.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../../lib/rankings.js";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { breadcrumbJsonLd } from "../../lib/schema.js";

export const dynamic = "force-dynamic";

const title = "Hyderabad Food Rankings";
const description = "Community-voted weekly rankings for the best biryani, buffet, fine dining, cafes, and restaurants in Hyderabad.";

export const metadata = {
  ...pageMeta({ title, description, path: "/rankings" }),
  openGraph: { ...pageMeta({ title, description, path: "/rankings" }).openGraph, images: ogImages(title, description) },
};

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

  return (
    <div style={{ paddingBottom: 84 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    <SiteChrome
      active="/rankings"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/rankings", label: "Rankings" }]}
      title={title}
      description={description}
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
      {live.map((theme) => {
        const totalVotes = (theme.results || []).reduce((s, r) => s + (r.count || 0), 0);
        const leader = theme.results?.[0];
        return (
          <Link key={theme.id} href={`/rankings/${theme.slug}`} className="site-card" style={{ borderColor: "var(--violet)", marginBottom: 12 }}>
            <span className="rankings-status live">Voting open</span>
            <h2>{theme.title}</h2>
            <p>{leader ? `Leading: ${leader.name} (${leader.count} votes)` : "Be the first to vote"}{totalVotes > 0 ? ` · ${totalVotes} total` : ""}</p>
          </Link>
        );
      })}

      {live.length === 0 && (
        <div className="site-card" style={{ marginBottom: 16 }}>
          <p>No live vote right now. Pick a ranking below or explore the map.</p>
          <Link href="/" className="site-cta">Open the map</Link>
        </div>
      )}

      <h2 className="site-section-title">Vote by dish</h2>
      <div className="site-grid">
        {SEO_THEME_PICKS.map((p) => (
          <Link key={p.title} href={`/rankings/${slugFromTitle(p.title)}`} className="site-card">
            <h3>{p.title}</h3>
            <p>{p.description}</p>
          </Link>
        ))}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="site-section-title">Past rankings</h2>
          {past.map((theme) => {
            const st = statusOf(theme);
            const totalVotes = (theme.results || []).reduce((s, r) => s + (r.count || 0), 0);
            return (
              <Link key={theme.id} href={`/rankings/${theme.slug}`} className="site-card" style={{ marginBottom: 10 }}>
                <span className={`rankings-status ${st}`}>{st === "winner" ? "Winner crowned" : "Ended"}</span>
                <h2>{theme.title}</h2>
                <p>{theme.winnerName ? `Winner: ${theme.winnerName}` : theme.results?.[0] ? `#1: ${theme.results[0].name}` : "View results"}{totalVotes > 0 ? ` · ${totalVotes} votes` : ""}</p>
              </Link>
            );
          })}
        </>
      )}
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="race" />
    </div>
    </div>
  );
}
