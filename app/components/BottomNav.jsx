"use client";

import { Icon } from "./Icons.jsx";

// Four labelled tabs, one job each (DESIGN.md section 4a). Every option in the
// app lives under exactly one of these:
//   Map    find somewhere to eat
//   Vote   this week's vote, results, past winners
//   Guides dish guides, areas, deals, food safety, stories
//   You    saved, passport, route planner (switched by tabs inside You)
// `keys` are the in-app tab states (and routed activeKeys) that light each tab.
const TABS = [
  { key: "map", icon: "map", label: "Map", href: "/", keys: ["map"] },
  { key: "race", icon: "trophy", label: "Vote", href: "/race/this-week", keys: ["race", "rankings"] },
  { key: "guides", icon: "book", label: "Guides", href: "/guides", route: true, keys: ["guides", "stories", "explore", "areas", "deals", "about"] },
  { key: "saved", icon: "user", label: "You", href: "/?tab=saved", keys: ["saved", "passport", "route"] },
];

export default function BottomNav({ tab, setTab, savedCount = 0, routed = false, activeKey }) {
  const current = routed ? activeKey : tab;
  return (
    <nav
      aria-label="Main"
      className={`bottomnav safe-bottom${routed ? " bottomnav-site" : ""}`}
    >
      {TABS.map((t) => {
        const active = t.keys.includes(current);
        // Routed (SEO) pages navigate for every tab; the app navigates only for
        // real routes (Guides) and switches state for its own tabs.
        const useHref = routed || t.route;
        const count = !routed && t.key === "saved" ? savedCount : 0;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => (useHref ? (window.location.href = t.href) : setTab(t.key))}
            aria-current={active ? "page" : undefined}
            className={`bottomnav-tab${active ? " is-active" : ""}`}
          >
            <span className="bottomnav-icon">
              <Icon name={t.icon} size={24} width={active ? 2.1 : 1.85} />
              {count > 0 && !active && (
                <span className="bottomnav-badge" aria-label={`${count} new`}>{count > 99 ? "99+" : count}</span>
              )}
            </span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
