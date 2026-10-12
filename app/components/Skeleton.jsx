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

// Same boxes as the SiteChrome pages (violet header band, 900px body), so
// nothing jumps when the real page swaps in.
//   spot:    photo, title lines, a few rows
//   ranking: big #1 block, then compact rows
//   list:    one big block, then a grid of cards
export default function PageSkeleton({ variant = "list" }) {
  return (
    <div className="site-page" aria-busy="true">
      <header className="site-header">
        <div className="site-header-inner">
          <SiteNav />
          <div className="site-hero">
            <Sk w="72%" h={48} r={12} />
            <Sk w="44%" h={16} style={{ marginTop: 14 }} />
          </div>
        </div>
      </header>
      <main className="site-body">
        <p className="visually-hidden" role="status">Loading</p>
        {variant === "spot" && (
          <>
            <Sk h="auto" r="var(--r-card)" style={{ aspectRatio: "4 / 3", maxHeight: 460 }} />
            <div style={{ marginTop: "var(--s7)" }}><Rows n={3} thumb={false} /></div>
          </>
        )}
        {variant === "ranking" && (
          <>
            <Sk h={168} r="var(--r-card)" />
            <div style={{ marginTop: "var(--s6)" }}><Rows n={5} /></div>
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
