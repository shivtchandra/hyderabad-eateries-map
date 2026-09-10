"use client";

import { useEffect, useRef, useState, useCallback, useMemo, useDeferredValue } from "react";
import { haversineKm, isOpenNow, fetchRoadDistances, validTagsFor, isNewSpot } from "../lib/eateryUtils.js";
import { AREA_ZOOM_MAX } from "../lib/spotlight.js";
import * as passportStore from "../lib/passport.js";
import { Icon } from "./components/Icons.jsx";
import dynamic from "next/dynamic";
const MapCanvas = dynamic(() => import("./components/MapCanvas.jsx"), { ssr: false });
import CardRail from "./components/CardRail.jsx";
import TopBar from "./components/TopBar.jsx";
import FilterChips from "./components/FilterChips.jsx";
import DetailSheet from "./components/DetailSheet.jsx";
import StampSheet from "./components/StampSheet.jsx";
import StickerStudio from "./components/StickerStudio.jsx";
import StickerBook from "./components/StickerBook.jsx";
import { stickerList } from "../lib/stickers.js";
import PassportPanel from "./components/PassportPanel.jsx";
import SavedPanel from "./components/SavedPanel.jsx";
import LeaderboardPanel from "./components/LeaderboardPanel.jsx";
import BottomNav from "./components/BottomNav.jsx";
import { claimSpot } from "../lib/leaderboard.js";
import { fetchVoteCounts, fetchStarOfWeek, castVote as castVoteApi, removeVote as removeVoteApi, hasVoted } from "../lib/voting.js";
import { fetchCurrentTheme } from "../lib/themeVoting.js";
import ThemeIntro from "./components/ThemeIntro.jsx";
import ThemeNudge from "./components/ThemeNudge.jsx";
import Onboarding from "./components/Onboarding.jsx";
import { fetchPicks } from "../lib/picks.js";
import { trackEvent } from "../lib/engagement-client.js";

export default function EateriesApp({ searchParams, initialTab = "map", initialRaceView = "race", initialDishSlug = null }) {
  const mapApi = useRef(null);

  const [eateries, setEateries] = useState([]);
  const [details, setDetails] = useState({});
  const detailsRef = useRef({});
  const detailRequests = useRef(new Set());
  const [detailPending, setDetailPending] = useState({});
  const [allDetailsStatus, setAllDetailsStatus] = useState("idle");
  const [loading, setLoading] = useState(true);
  // Open the tab named in ?tab= on the very first render (e.g. landing from the
  // Stories page's bottom nav), so it never flashes the map first. searchParams
  // is passed by Next on both server and client, so no hydration mismatch.
  const urlTab = searchParams?.tab;
  const dishSlug = initialDishSlug || searchParams?.dish || null;
  const [tab, setTab] = useState(
    urlTab && ["map", "passport", "saved", "race"].includes(urlTab) ? urlTab : initialTab
  );
  const [raceView, setRaceView] = useState(initialRaceView); // which sub-tab the Race panel opens on
  const [activeCategory, setActiveCategory] = useState("all");

  const pushAppPath = (path) => {
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  };

  // Race views have real URLs so either screen can be opened and shared directly.
  const openRaceView = (view) => {
    setRaceView(view);
    setTab("race");
    pushAppPath(view === "theme" ? "/race/this-week" : "/race");
  };

  // Opening Race from the bottom nav lands on This Week via a real URL load.
  // pushState-only left the App Router on "/" while the address bar said
  // /race/this-week, which soft-404'd on the next navigation for some users.
  const goTab = (nextTab) => {
    if (nextTab === "race") {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/race")) {
        window.location.href = "/race/this-week";
        return;
      }
      openRaceView("theme");
      return;
    }
    // Leaving /race/* needs a real navigation. Keep the destination tab in ?tab=
    // so Passport/Saved do not bounce back to the map.
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/race")) {
      window.location.href = nextTab === "map" ? "/" : `/?tab=${nextTab}`;
      return;
    }
    setTab(nextTab);
    pushAppPath(nextTab === "map" ? "/" : `/?tab=${nextTab}`);
  };
  const [activeTags, setActiveTags] = useState([]);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [heroes, setHeroes] = useState([]);
  const [areaLabel, setAreaLabel] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  // Let chrome paint first so LCP is not an OSM tile on slow mobile.
  useEffect(() => {
    let idleId = 0;
    let t = 0;
    const go = () => setMapReady(true);
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(go, { timeout: 1200 });
    } else {
      t = window.setTimeout(go, 200);
    }
    return () => {
      if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      if (t) window.clearTimeout(t);
    };
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  const [passport, setPassport] = useState({ visited: {}, saved: {} });
  const [stamping, setStamping] = useState(null);
  const [diaryTick, setDiaryTick] = useState(0);
  const [stickerFor, setStickerFor] = useState(undefined); // undefined = closed
  const [stickerTick, setStickerTick] = useState(0);
  const [stickerCount, setStickerCount] = useState(0);
  useEffect(() => { setStickerCount(stickerList().length); }, [stickerTick]);
  const [voteMap, setVoteMap] = useState({});
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [nearbyArea, setNearbyArea] = useState(null);
  const [roadDistMap, setRoadDistMap] = useState({});
  const [currentTheme, setCurrentTheme] = useState(null);
  const [picksMap, setPicksMap] = useState({});
  const [starOfWeek, setStarOfWeek] = useState(null);
  const [locPulsed, setLocPulsed] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem("loc_prompted")) setLocPulsed(true); } catch {}
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      const path = window.location.pathname.replace(/\/$/, "") || "/";
      if (path === "/race/this-week") {
        setRaceView("theme");
        setTab("race");
      } else if (path === "/race") {
        setRaceView("race");
        setTab("race");
      } else if (path === "/") {
        const q = new URLSearchParams(window.location.search).get("tab");
        if (q && ["map", "passport", "saved", "race"].includes(q)) setTab(q);
        else setTab("map");
      }
    };
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  // Read inside handleSelect without making it a dependency (which would
  // rebuild the map's marker layer on every selection change).
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selectedId;

  useEffect(() => { setPassport(passportStore.getState()); }, []);

  useEffect(() => {
    trackEvent("landing");
  }, []);

  useEffect(() => {
    fetchCurrentTheme().then((cur) => { if (cur.theme?.active && !cur.theme?.winnerId) setCurrentTheme(cur.theme); });
  }, []);

  useEffect(() => {
    fetchPicks().then(setPicksMap);
  }, []);

  // Editorial spots (venues with a hand-written story) for the "Stories" rail
  // and the ★ Story badge on pins/cards/sheet.
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
    fetch("/featured.json").then((r) => r.json()).then(setFeatured).catch(() => {});
  }, []);
  const featuredIds = useMemo(() => new Set(featured.map((f) => f.id)), [featured]);

  useEffect(() => {
    fetchStarOfWeek().then(setStarOfWeek);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Static index, 74KB gzipped, cacheable, zero Firestore reads at runtime
  // (querying ~1600 docs per page load blew the free-tier quota).
  useEffect(() => {
    fetch("/eateries-index.json")
      .then((r) => r.json())
      .then((rows) => {
        setEateries(rows.map((e) => ({
          id: e.id, name: e.n, category: e.c, lat: e.lat, lng: e.lng,
          rating: e.r, ratingCount: e.rc, tier: e.t, tags: e.g,
          priceLevel: e.p, discoveredIn: e.a, createdAt: e.ca ?? null,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch only the selected spot. The previous eager 3.9 MB detail download
  // made a simple selection compete with the map and photos on slow connections.
  const loadDetail = useCallback((id) => {
    if (!id || detailsRef.current[id] || detailRequests.current.has(id)) return;
    detailRequests.current.add(id);
    setDetailPending((prev) => ({ ...prev, [id]: true }));
    fetch(`/api/eateries/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) throw new Error("detail request failed");
        return r.json();
      })
      .then((detail) => {
        setDetails((prev) => {
          const next = { ...prev, [id]: detail };
          detailsRef.current = next;
          return next;
        });
      })
      .catch(() => {})
      .finally(() => {
        detailRequests.current.delete(id);
        setDetailPending((prev) => ({ ...prev, [id]: false }));
      });
  }, []);

  // Opening-hours filtering genuinely needs every schedule. Pay that larger
  // network cost only when the user asks for this filter, never during startup.
  useEffect(() => {
    if (!openNowOnly || allDetailsStatus !== "idle") return;
    setAllDetailsStatus("loading");
    fetch("/eateries-detail.json")
      .then((r) => {
        if (!r.ok) throw new Error("hours request failed");
        return r.json();
      })
      .then((allDetails) => {
        setDetails((prev) => {
          const next = { ...allDetails, ...prev };
          detailsRef.current = next;
          return next;
        });
        setAllDetailsStatus("loaded");
      })
      .catch(() => {
        setAllDetailsStatus("idle");
        setOpenNowOnly(false);
        setToast("Couldn’t load opening hours");
      });
  }, [openNowOnly, allDetailsStatus]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!heroes.length) return;
    fetchVoteCounts(heroes.map((h) => h.id)).then(setVoteMap);
  }, [heroes]);

  useEffect(() => {
    if (!userLoc || !heroes.length) return;
    fetchRoadDistances(userLoc, heroes).then((m) => setRoadDistMap((prev) => ({ ...prev, ...m })));
  }, [userLoc, heroes]);

  useEffect(() => {
    if (!userLoc || !eateries.length) { setNearbyArea(null); return; }
    const groups = {};
    for (const e of eateries) {
      const a = e.discoveredIn;
      if (!a || a.startsWith("text:")) continue;
      (groups[a] ??= []).push(e);
    }
    let best = null, bestD = Infinity;
    for (const [area, list] of Object.entries(groups)) {
      const lat = list.reduce((s, e) => s + e.lat, 0) / list.length;
      const lng = list.reduce((s, e) => s + e.lng, 0) / list.length;
      const d = haversineKm(userLoc, { lat, lng });
      if (d != null && d < bestD) { bestD = d; best = area; }
    }
    setNearbyArea(bestD < 2 ? best : null);
  }, [userLoc, eateries]);

  // Toggle: cast a vote, or remove it if this device already voted this spot.
  const handleVote = useCallback(async (spotId) => {
    const already = hasVoted(spotId);
    let result;
    if (already) {
      result = await removeVoteApi(spotId);
    } else {
      const spot = eateries.find((e) => e.id === spotId);
      result = await castVoteApi(spotId, spot?.name ?? spot?.n);
    }
    if (result.ok) {
      setVoteMap((prev) => ({ ...prev, [spotId]: { total: result.total, week_total: result.week_total } }));
      setToast(already ? "Vote removed" : "Vote counted!");
    }
  }, [eateries]);

  const counts = useMemo(() => {
    const c = { all: eateries.length };
    for (const e of eateries) c[e.category] = (c[e.category] ?? 0) + 1;
    return c;
  }, [eateries]);

  // Per-category counts with only sub-filters applied (tags, openNow, nearby), // not the category filter itself, so each chip shows how many of its own spots
  // pass the active filters.
  const filteredCounts = useMemo(() => {
    if (!activeTags.length && !openNowOnly && !nearbyOnly && !newOnly) return counts;
    const c = {};
    for (const e of eateries) {
      if (activeTags.length && !activeTags.every((t) => validTagsFor(e.category, e.tags).includes(t))) continue;
      if (openNowOnly && allDetailsStatus === "loaded" && isOpenNow(details[e.id]?.hours) !== true) continue;
      if (nearbyOnly && userLoc) {
        const d = haversineKm(userLoc, { lat: e.lat, lng: e.lng });
        if (d == null || d > 3) continue;
      }
      if (newOnly && !isNewSpot(e.createdAt)) continue;
      c[e.category] = (c[e.category] ?? 0) + 1;
    }
    c.all = Object.values(c).reduce((s, n) => s + n, 0);
    return c;
  }, [eateries, activeTags, openNowOnly, allDetailsStatus, nearbyOnly, newOnly, details, userLoc, counts]);

  const tagCounts = useMemo(() => {
    const c = {};
    for (const e of eateries) for (const t of e.tags ?? []) c[t] = (c[t] ?? 0) + 1;
    return c;
  }, [eateries]);

  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return eateries.filter((e) => {
      if (activeCategory !== "all" && e.category !== activeCategory) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      if (activeTags.length && !activeTags.every((t) => validTagsFor(e.category, e.tags).includes(t))) return false;
      if (openNowOnly && allDetailsStatus === "loaded" && isOpenNow(details[e.id]?.hours) !== true) return false;
      if (nearbyOnly && userLoc) {
        const d = haversineKm(userLoc, { lat: e.lat, lng: e.lng });
        if (d == null || d > 3) return false;
      }
      if (newOnly && !isNewSpot(e.createdAt)) return false;
      return true;
    });
  }, [eateries, activeCategory, deferredSearch, activeTags, openNowOnly, allDetailsStatus, details, nearbyOnly, newOnly, userLoc]);

  const byId = useMemo(() => {
    const m = {};
    for (const e of eateries) m[e.id] = e;
    return m;
  }, [eateries]);

  // Suggestions update immediately while the heavier map filtering is deferred.
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return eateries
      .filter((e) => e.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
        return bStarts - aStarts || (b.rating ?? 0) - (a.rating ?? 0);
      })
      .slice(0, 7);
  }, [eateries, search]);

  const toggleTag = useCallback((t) => {
    setActiveTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  }, []);

  // Stamping a *new* place opens the diary sheet, the receipt, dish and note
  // are the whole point of the passport. Un-stamping is immediate.
  const handleToggleVisited = useCallback((id) => {
    if (passportStore.getState().visited[id]) {
      setPassport({ ...passportStore.toggleVisited(id) });
      setToast("Removed from your passport");
    } else {
      setStamping(byId[id] ?? null);
    }
  }, [byId]);

  // Passport stamping is personal and works anywhere, logging a memory. The
  // Race claim is the competitive half: it needs live GPS proof you're actually
  // there, so it's attempted separately and is allowed to fail ("too far")
  // without affecting the stamp.
  const attemptRaceClaim = useCallback((id) => {
    if (!navigator.geolocation) {
      setToast("Stamped, turn on location to also claim it for the Race");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await claimSpot(id, { lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (res.ok && !res.already) {
          setToast(`Claimed for the Race, +${res.awarded} pts`);
          setDiaryTick((t) => t + 1); // refresh the board
        } else if (res.ok && res.already) {
          setToast("Already claimed for the Race");
        } else if (res.reason === "too-far") {
          setToast(`Stamped, but you're ${res.distanceKm} km away, too far to claim for the Race`);
        } else if (res.reason === "not-authenticated") {
          setToast("Stamped, Race sign-in unavailable, claim didn't count");
        } else {
          // backend / network / write-failed
          setToast("Stamped, couldn't reach the Race board, claim didn't count");
        }
      },
      () => setToast("Stamped, location denied, so it wasn't claimed for the Race"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const completeStamp = useCallback((id) => {
    setPassport({ ...passportStore.toggleVisited(id) });
    setStamping(null);
    setDiaryTick((t) => t + 1);
    trackEvent("stamp");
    setToast("Stamped, added to your passport");
    attemptRaceClaim(id);
  }, [attemptRaceClaim]);

  const handleToggleSaved = useCallback((id) => {
    const next = passportStore.toggleSaved(id);
    setPassport({ ...next });
    if (next.saved[id]) trackEvent("save");
    setToast(next.saved[id] ? "Saved to your list" : "Removed from saved");
  }, []);

  const handleSelect = useCallback((id, opts = {}) => {
    setSelectedId(id);
    loadDetail(id);
    // Scrolling the card rail calls this on every settle (fromRail: true), // that should only highlight the card/pin, never pop the detail sheet
    // open on its own. Opening stays an explicit action: tap the card, tap a
    // map pin, or search.
    if (!opts.fromRail) {
      setSheetOpen(true);
      trackEvent("place_open");
      const e = byId[id];
      if (e) mapApi.current?.flyTo(e.lat, e.lng, 16);
    }
  }, [byId, loadDetail]);

  const handleAreaEnter = useCallback((area) => {
    setAreaLabel(area.area);
    mapApi.current?.flyTo(area.lat, area.lng, AREA_ZOOM_MAX + 1.4);
  }, []);

  const handleSearchSelect = useCallback((eatery) => {
    // The sheet appears from index data immediately; detail and map movement
    // continue independently, so neither can hold up the user’s feedback.
    setSearch("");
    setSearchOpen(false);
    setAreaLabel(null);
    setTab("map");
    setSelectedId(eatery.id);
    setSheetOpen(true);
    trackEvent("place_open");
    loadDetail(eatery.id);
    mapApi.current?.flyTo(eatery.lat, eatery.lng, 16);
  }, [loadDetail]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { setToast("Location not supported here"); return; }
    setLocPulsed(true);
    try { localStorage.setItem("loc_prompted", "1"); } catch {}
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        mapApi.current?.showMe(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        setToast(err.code === 1 ? "Location access denied, allow it in browser settings" : "Couldn't get your location");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (tab === "map") mapApi.current?.invalidate();
  }, [tab]);

  const openFromList = useCallback((e) => {
    setTab("map");
    setSelectedId(e.id);
    setSheetOpen(true);
    loadDetail(e.id);
    mapApi.current?.flyTo(e.lat, e.lng, 16);
  }, [loadDetail]);

  // Deep link: /?spot=<id> selects that spot, opens its sheet and centres the
  // map on it. Lets the spot page's "Open on map" button (and any shared spot
  // link) land on the right pin instead of the bare city map. Runs once, after
  // the index has loaded so byId[id] resolves.
  const deepLinkedRef = useRef(false);
  useEffect(() => {
    if (deepLinkedRef.current || loading) return;
    const id = new URLSearchParams(window.location.search).get("spot");
    if (!id) { deepLinkedRef.current = true; return; }
    const e = byId[id];
    if (!e) return; // data not ready to resolve this id yet; retry on next tick
    deepLinkedRef.current = true;
    setTab("map");
    setSelectedId(id);
    setSheetOpen(true);
    loadDetail(id);
    const focus = () => mapApi.current?.flyTo(e.lat, e.lng, 16);
    focus();
    if (!mapApi.current) setTimeout(focus, 600); // map may still be mounting
  }, [loading, byId, loadDetail]);

  const selected = selectedId ? byId[selectedId] : null;
  const selectedFull = useMemo(
    () => (selected ? { ...selected, ...(details?.[selected.id] ?? {}) } : null),
    [selected, details]
  );

  const photoUrlFor = selectedFull ? `/photos/${selectedFull.id}.jpg` : null;
  const dist = selected ? (roadDistMap[selected.id] ?? (userLoc ? haversineKm(userLoc, { lat: selected.lat, lng: selected.lng }) : null)) : null;

  const visitedCount = Object.keys(passport.visited).length;
  const savedCount = Object.keys(passport.saved).length;

  return (
    <div style={{ position: "fixed", inset: 0, height: "100dvh", display: "flex", flexDirection: "column", background: "var(--cream)", overflow: "hidden" }}>
      <TopBar
        search={search} setSearch={setSearch}
        searchOpen={searchOpen} setSearchOpen={setSearchOpen}
        searchResults={searchResults} onSelectResult={handleSearchSelect}
        onPreviewResult={loadDetail}
        count={filtered.length} visitedCount={visitedCount}
      />

      {tab === "map" && (
        <FilterChips
          activeCategory={activeCategory} setActiveCategory={setActiveCategory}
          activeTags={activeTags} toggleTag={toggleTag}
          openNowOnly={openNowOnly} setOpenNowOnly={setOpenNowOnly}
          openNowLoading={allDetailsStatus === "loading"}
          counts={filteredCounts} tagCounts={tagCounts}
          userLoc={userLoc} nearbyOnly={nearbyOnly} setNearbyOnly={setNearbyOnly} nearbyArea={nearbyArea}
          newOnly={newOnly} setNewOnly={setNewOnly}
        />
      )}

      <div style={{ flex: 1, position: "relative", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", inset: 0, visibility: tab === "map" ? "visible" : "hidden" }}>
          {mapReady ? (
            <MapCanvas
              eateries={eateries}
              filtered={filtered}
              passport={passport}
              selectedId={selectedId}
              featuredIds={featuredIds}
              onSelect={handleSelect}
              onAreaEnter={handleAreaEnter}
              onHeroesChange={setHeroes}
              onZoomChange={(api) => { mapApi.current = api; }}
            />
          ) : (
            <div
              aria-hidden
              style={{
                position: "absolute", inset: 0,
                background:
                  "radial-gradient(ellipse at 30% 20%, var(--violet-wash), transparent 55%), var(--cream)",
              }}
            />
          )}
        </div>

        {tab === "race" && (
          <LeaderboardPanel
            initialInnerTab={raceView}
            onInnerTabChange={openRaceView}
            initialDishSlug={dishSlug ?? initialDishSlug}
            refreshTick={diaryTick}
          />
        )}
        {tab === "passport" && (
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "var(--cream)" }}>
            <PassportPanel eateries={eateries} passport={passport} onSelect={openFromList} diaryTick={diaryTick} />
            <StickerBook
              refreshTick={stickerTick}
              onAddSticker={() => setStickerFor(null)}
              onOpenSpot={(id) => { const e = byId[id]; if (e) openFromList(e); }}
            />
          </div>
        )}
        {tab === "saved" && (
          <SavedPanel
            eateries={eateries} passport={passport}
            onSelect={openFromList} onToggleVisited={handleToggleVisited}
          />
        )}

        {tab === "map" && (
          <>
            {!sheetOpen && !areaLabel && (
              <ThemeNudge theme={currentTheme} onVote={() => openRaceView("theme")} />
            )}
            {areaLabel && (
              <button
                onClick={() => { setAreaLabel(null); setSelectedId(null); mapApi.current?.reset(); }}
                style={{
                  position: "absolute", top: 12, left: 12, zIndex: 1000,
                  background: "var(--cream-hi)", border: "1.5px solid var(--line)",
                  borderRadius: 20, padding: "7px 13px", cursor: "pointer",
                  fontSize: 12.5, fontWeight: 600, color: "var(--ink)",
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <Icon name="close" size={13} width={2.4} color="var(--muted)" />
                {areaLabel}
              </button>
            )}

            <div style={{ position: "absolute", right: 12, bottom: heroes.length ? 186 : 20, display: "flex", flexDirection: "column", gap: 9, zIndex: 1000 }}>
              <button onClick={() => { setAreaLabel(null); setSelectedId(null); mapApi.current?.reset(); }} style={fab} aria-label="Back to city view">
                <Icon name="city" size={20} width={1.9} color="var(--ink-soft)" />
              </button>
              <div style={{ position: "relative" }}>
                {!locPulsed && !userLoc && (
                  <div style={{
                    position: "absolute", inset: -6, borderRadius: "50%",
                    background: "rgba(47,107,107,0.28)",
                    animation: "pulse-ring 1.8s ease-out infinite",
                    pointerEvents: "none",
                  }} />
                )}
                <button onClick={locateMe} style={{ ...fab, background: locating ? "var(--pop-wash)" : "var(--cream-hi)" }} aria-label="Find me">
                  <Icon name="locate" size={20} width={1.9} color={locating ? "var(--pop-deep)" : "var(--cafe)"} />
                </button>
              </div>
            </div>

            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, pointerEvents: "none" }}>
                <Icon name="sparkle" size={38} width={1.6} color="var(--pop)" className="swirl" />
                <div style={{ fontFamily: "Fraunces, serif", color: "var(--ink-soft)", fontWeight: 600, fontSize: 15 }}>
                  Finding tasty spots…
                </div>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--cream-hi)", border: "1.5px solid var(--line)", padding: "16px 22px", borderRadius: 18, boxShadow: "var(--shadow-soft)", fontFamily: "Fraunces, serif", fontWeight: 600, textAlign: "center", maxWidth: "80%" }}>
                No spots match, try another bite
              </div>
            )}

            {!sheetOpen && (
              <CardRail
                spots={heroes}
                activeId={selectedId}
                onActivate={handleSelect}
                onOpen={() => setSheetOpen(true)}
                featuredIds={featuredIds}
                passport={passport}
                voteMap={voteMap}
                onVote={handleVote}
                distMap={roadDistMap}
                picksMap={picksMap}
                starOfWeek={starOfWeek}
              />
            )}

            {sheetOpen && selectedFull && (
              <DetailSheet
                eatery={selectedFull}
                isMobile={isMobile}
                featured={featuredIds.has(selectedFull.id)}
                photoUrl={photoUrlFor}
                dist={dist}
                passportState={passportStore.stateOf(passport, selectedFull.id)}
                onToggleVisited={handleToggleVisited}
                onToggleSaved={handleToggleSaved}
                onAddSticker={(e) => setStickerFor(e)}
                onClose={() => setSheetOpen(false)}
                voteData={voteMap[selectedFull.id]}
                onVote={handleVote}
                currentTheme={currentTheme}
                detailPending={!!detailPending[selectedFull.id]}
                pick={picksMap[selectedFull.id]}
              />
            )}

          </>
        )}

        {stamping && (
          <StampSheet
            eatery={stamping}
            onDone={() => completeStamp(stamping.id)}
            onCancel={() => setStamping(null)}
          />
        )}

        {stickerFor !== undefined && (
          <StickerStudio
            spot={stickerFor}
            onDone={() => { setStickerFor(undefined); setStickerTick((t) => t + 1); }}
            onCancel={() => setStickerFor(undefined)}
          />
        )}

        {toast && (
          <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--cream-hi)", padding: "10px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 1400, boxShadow: "var(--shadow-pop)", whiteSpace: "nowrap", animation: "fade-in .2s ease" }}>
            {toast}
          </div>
        )}

        <Onboarding />
        <ThemeIntro theme={currentTheme} onVote={() => openRaceView("theme")} />
      </div>

      <BottomNav tab={tab} setTab={goTab} visitedCount={visitedCount} savedCount={savedCount} />
    </div>
  );
}

const fab = {
  width: 46, height: 46, borderRadius: "50%",
  border: "1.5px solid var(--line)",
  background: "var(--cream-hi)", boxShadow: "var(--shadow-pop)",
  cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
