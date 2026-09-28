"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Other site sections, reachable from the same row (they navigate away, unlike the tabs).
const SITE_LINKS = [
  { href: "/offers", label: "Deals" },
  { href: "/rankings", label: "Rankings" },
  { href: "/explore", label: "Explore" },
  { href: "/areas", label: "Areas" },
];

// Tabs are hash-backed (#guides, #stories, #trail) so they can be shared and the back
// button works. Every panel is server-rendered and only hidden, so all content stays indexable.
const TABS = ["all", "guides", "stories", "trail"];

function tabFromHash() {
  if (typeof window === "undefined") return "all";
  const h = window.location.hash.replace("#", "");
  return TABS.includes(h) ? h : "all";
}

export default function StoriesTabs({ guideCount, storyCount, cats, featured, guides, stories, trail }) {
  const [tab, setTab] = useState("all");
  const [cat, setCat] = useState("");
  const storiesRef = useRef(null);

  useEffect(() => {
    const sync = () => setTab(tabFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    const root = storiesRef.current;
    if (!root) return;
    root.querySelectorAll("[data-cat]").forEach((el) => {
      el.hidden = Boolean(cat) && el.getAttribute("data-cat") !== cat;
    });
  }, [cat]);

  const pick = (next) => {
    setTab(next);
    setCat("");
    const url = next === "all" ? window.location.pathname + window.location.search : `#${next}`;
    window.history.pushState(null, "", url);
  };

  const items = [
    { key: "all", label: "All" },
    { key: "guides", label: "Guides", count: guideCount },
    { key: "stories", label: "Spot stories", count: storyCount },
    { key: "trail", label: "Chai trail" },
  ];
  const show = (key) => tab === "all" || tab === key;

  return (
    <>
      <nav className="stories-tabs" aria-label="Story types">
        {items.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "active" : undefined}
            aria-pressed={tab === t.key}
            onClick={() => pick(t.key)}
          >
            {t.label}
            {t.count != null && <span>{t.count}</span>}
          </button>
        ))}
        <span className="stories-tabs-divider" aria-hidden="true" />
        {SITE_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="stories-tabs-link">{l.label}</Link>
        ))}
      </nav>

      <div hidden={!show("stories")}>{featured}</div>
      <div hidden={!show("guides")}>{guides}</div>
      <div hidden={!show("stories")} ref={storiesRef}>
        {tab === "stories" && cats.length > 1 && (
          <div className="stories-cats" role="group" aria-label="Filter by category">
            <button type="button" className={!cat ? "active" : undefined} onClick={() => setCat("")}>All</button>
            {cats.map((c) => (
              <button key={c.key} type="button" className={cat === c.key ? "active" : undefined} onClick={() => setCat(c.key)}>
                {c.label} <span>{c.count}</span>
              </button>
            ))}
          </div>
        )}
        {stories}
      </div>
      <div hidden={!show("trail")}>{trail}</div>
    </>
  );
}
