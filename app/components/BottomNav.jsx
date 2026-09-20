"use client";

import { Icon } from "./Icons.jsx";

// Every tab has a canonical href so the same bar works on SEO pages (routed
// mode, full navigation) as well as inside the SPA (setTab for the in-app tabs,
// href only for Stories which is a real route).
const TABS = [
  { key: "map", icon: "map", label: "Map", href: "/" },
  { key: "route", icon: "navigate", label: "Route", href: "/?tab=route" },
  { key: "race", icon: "trophy", label: "Race", href: "/race/this-week" },
  { key: "passport", icon: "passport", label: "Passport", href: "/?tab=passport" },
  { key: "saved", icon: "bookmark", label: "Saved", href: "/?tab=saved" },
  { key: "stories", icon: "book", label: "Stories", href: "/stories", route: true },
];

// Expanding-pill nav. The active tab grows into a filled violet pill that
// carries its label inline; inactive tabs collapse to icon-only. Only one
// label is ever shown, so the state reads instantly and the bar stays calm.
export default function BottomNav({ tab, setTab, visitedCount, savedCount, routed = false, activeKey }) {
  return (
    <div className="safe-bottom" style={{ flexShrink: 0, padding: "8px 12px 10px", zIndex: 1300 }}>
      <div
        className="material"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          padding: 6,
          borderRadius: "var(--r-pill)",
          boxShadow: "var(--e2)",
          // Without a cap, the active tab's flex-grow eats the whole bar width
          // on a wide desktop viewport, ballooning into a huge pill. Phone
          // widths never hit this ceiling, so it's a no-op there.
          maxWidth: 460,
          margin: "0 auto",
        }}
      >
        {TABS.map((t) => {
          const active = routed ? activeKey === t.key : tab === t.key;
          // routed pages navigate for every tab; the SPA navigates only for a
          // real route (Stories) and uses setTab for its own in-app tabs.
          const useHref = routed || t.route;
          const count = routed ? 0 :
            t.key === "passport" ? visitedCount :
            t.key === "saved" ? savedCount : 0;
          return (
            <button
              key={t.key}
              onClick={() => (useHref ? (window.location.href = t.href) : setTab(t.key))}
              aria-current={active ? "page" : undefined}
              aria-label={t.label}
              className="pressable-sm"
              style={{
                position: "relative",
                flex: active ? "1 1 auto" : "0 0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: active ? 7 : 0,
                height: 46,
                padding: active ? "0 18px" : "0 15px",
                border: "none",
                borderRadius: "var(--r-pill)",
                background: active ? "var(--violet)" : "transparent",
                color: active ? "#fff" : "var(--muted)",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13.5,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                transition:
                  "flex-grow 260ms cubic-bezier(0.2,0,0,1), background 200ms ease, padding 200ms ease, gap 200ms ease, color 160ms ease",
              }}
            >
              <span style={{ position: "relative", display: "flex", flexShrink: 0 }}>
                <Icon name={t.icon} size={21} width={active ? 2.1 : 1.85} />
                {count > 0 && !active && (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -6,
                      minWidth: 15,
                      height: 15,
                      padding: "0 4px",
                      borderRadius: "var(--r-pill)",
                      background: "var(--violet)",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      lineHeight: "15px",
                      textAlign: "center",
                      boxShadow: "0 0 0 2px var(--cream-hi)",
                    }}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              {/* Label only rendered for the active tab so collapsed items are pure icons */}
              {active && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {t.label}
                  {count > 0 && (
                    <span
                      style={{
                        minWidth: 18,
                        height: 18,
                        padding: "0 5px",
                        borderRadius: "var(--r-pill)",
                        background: "rgba(255,255,255,0.24)",
                        color: "#fff",
                        fontSize: 10.5,
                        fontWeight: 700,
                        lineHeight: "18px",
                        textAlign: "center",
                      }}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
