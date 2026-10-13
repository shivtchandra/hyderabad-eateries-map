import { SiteNav } from "./SiteChrome.jsx";
// Some routes (offers) get site.css from a parent page, not a layout, so the
// skeleton brings it along or it would render unstyled while it waits.
import "../site.css";

// One placeholder box. Fades in after 150ms (see .sk in globals.css), so fast
// loads show nothing and only slow ones show the shimmer.
export function Sk({ w = "100%", h = 16, r, onViolet, style }) {
  return (
    <span
      aria-hidden="true"
      className={`sk${onViolet ? " sk--on-violet" : ""}`}
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}

function Rows({ n = 5, thumb = true }) {
  return (
    <div className="sk-rows">
      {Array.from({ length: n }, (_, i) => (
        <div className="sk-row" key={i}>
          {thumb && <Sk w={56} h={56} r="var(--r-btn)" />}
          <div className="sk-row-text">
            <Sk w={`${62 - (i % 3) * 12}%`} h={18} />
            <Sk w="34%" h={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Same boxes as the real pages (header row with back button, then each
// page's own order), so nothing jumps when the content swaps in.
//   spot:    photo first, kicker, name, ticket, two stat tiles, facts
//   ranking: question headline, #1 ticket, photo rows with a vote button
//   list:    one big block, then a grid of cards
export default function PageSkeleton({ variant = "list" }) {
  const detail = variant === "spot" || variant === "ranking";
  return (
    <div className="site-page" aria-busy="true">
      <header className="site-header">
        <div className="site-header-inner">
          <SiteNav />
          {detail && <span className="site-back" aria-hidden="true" />}
          {variant === "spot" ? (
            <div className="sp-hero">
              <Sk h="auto" r={0} style={{ width: "calc(100% + 2 * var(--gutter))", margin: "0 calc(-1 * var(--gutter)) var(--s5)", aspectRatio: "4 / 3", maxHeight: 460 }} />
              <Sk w="38%" h={12} />
              <Sk w="78%" h={52} r={12} style={{ marginTop: "var(--s3)" }} />
              <Sk w="52%" h={16} style={{ marginTop: "var(--s3)" }} />
            </div>
          ) : variant === "ranking" ? (
            <div className="rk-hero" style={{ paddingRight: 0 }}>
              <Sk w="42%" h={12} />
              <Sk w="86%" h={52} r={12} style={{ marginTop: "var(--s3)" }} />
              <Sk w="58%" h={52} r={12} style={{ marginTop: "var(--s2)" }} />
              <Sk w="64%" h={16} style={{ marginTop: "var(--s3)" }} />
            </div>
          ) : (
            <div className="site-hero">
              <Sk w="72%" h={48} r={12} />
              <Sk w="44%" h={16} style={{ marginTop: "var(--s4)" }} />
            </div>
          )}
        </div>
      </header>
      <main className="site-body">
        <p className="visually-hidden" role="status">Loading</p>
        {variant === "spot" && (
          <>
            <Sk h={150} r="var(--r-card)" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s2)", marginTop: "var(--s7)" }}>
              <Sk h={92} r="var(--r-card)" />
              <Sk h={92} r="var(--r-card)" />
            </div>
            <div style={{ marginTop: "var(--s6)" }}><Rows n={4} thumb={false} /></div>
          </>
        )}
        {variant === "ranking" && (
          <>
            <Sk h={112} r="var(--r-card)" />
            <div style={{ marginTop: "var(--s5)" }}><Rows n={5} /></div>
          </>
        )}
        {variant === "list" && (
          <>
            <Sk h={200} r="var(--r-card)" />
            <div className="site-grid" style={{ marginTop: "var(--s6)" }}>
              {Array.from({ length: 6 }, (_, i) => <Sk key={i} h={132} r="var(--r-card)" />)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
