"use client";

import { useEffect, useRef, useState, useCallback, useMemo, useDeferredValue } from "react";
import { haversineKm, isOpenNow, fetchRoadDistances, validTagsFor, isNewSpot, buildAreaCentroids } from "../lib/eateryUtils.js";
import { AREA_ZOOM_MAX, scoreOf } from "../lib/spotlight.js";
import { spotPhotoUrl } from "../lib/photos.js";
import * as passportStore from "../lib/passport.js";
import { Icon } from "./components/Icons.jsx";
import dynamic from "next/dynamic";
import Clouds from "./components/Clouds.jsx";

// Race claims need GPS proof (within 250 m) only when this is on. Off while testing.
const RACE_REQUIRE_GPS = process.env.NEXT_PUBLIC_RACE_REQUIRE_GPS === "1";
const NO_PINS = [];
// While the map's code loads, keep showing the opening clouds (no gap between
// the placeholder's clouds and MapCanvas's own).
const MapCanvas = dynamic(() => import("./components/MapCanvas.jsx"), {
  ssr: false,
  loading: () => <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "var(--cream)" }}><Clouds /></div>,
});
import CardRail from "./components/CardRail.jsx";
import AskSheet from "./components/AskSheet.jsx";
import TopBar from "./components/TopBar.jsx";
import FilterChips, { countActiveFilters } from "./components/FilterChips.jsx";
import DetailSheet from "./components/DetailSheet.jsx";
import StampSheet from "./components/StampSheet.jsx";
import StickerStudio from "./components/StickerStudio.jsx";
import StickerBook from "./components/StickerBook.jsx";
import { stickerList } from "../lib/stickers.js";
import PassportPanel from "./components/PassportPanel.jsx";
import SavedPanel from "./components/SavedPanel.jsx";
import YouHub from "./components/YouHub.jsx";
import LeaderboardPanel from "./components/LeaderboardPanel.jsx";
import BottomNav from "./components/BottomNav.jsx";
import RoutePanel from "./components/RoutePanel.jsx";
import InstallPrompt from "./components/InstallPrompt.jsx";
import { canOfferInstall } from "../lib/install.js";
import { claimSpot, fetchLeaderboard } from "../lib/leaderboard.js";
import { getUid } from "../lib/identity.js";
import AteHerePopup from "./components/AteHerePopup.jsx";
import QuickClaimSheet from "./components/QuickClaimSheet.jsx";
import { fetchVoteCounts, fetchStarOfWeek, castVote as castVoteApi, removeVote as removeVoteApi, hasVoted } from "../lib/voting.js";
import { fetchCurrentTheme } from "../lib/themeVoting.js";
import ThemeNudge from "./components/ThemeNudge.jsx";
import { fetchPicks } from "../lib/picks.js";
import { trackEvent } from "../lib/engagement-client.js";
import { recommendationsEnabled, filterRecommendations, servesDish, DISHES } from "../lib/recommendationShared.js";
import RecommendationPanel from "./components/RecommendationPanel.jsx";
import PicksSheet from "./components/PicksSheet.jsx";
import AddDishSheet from "./components/AddDishSheet.jsx";
import AddPlace from "./components/AddPlace.jsx";

export default function EateriesApp({ initialTab = "map", initialRaceView = "race", initialDishSlug = null }) {
  const mapApi = useRef(null);
  // The map mounts only once its tab is shown, so a jump to a spot from Vote,
  // search or a deep link waits here until MapCanvas hands over its API.
  const pendingFly = useRef(null);
  const flyMap = useCallback((lat, lng, zoom) => {
    if (mapApi.current) mapApi.current.flyTo(lat, lng, zoom);
    else pendingFly.current = [lat, lng, zoom];
  }, []);

  const [indexedEateries, setEateries] = useState([]);
  const [details, setDetails] = useState({});
  const detailsRef = useRef({});
  const detailRequests = useRef(new Set());
  const [detailPending, setDetailPending] = useState({});
  const [allDetailsStatus, setAllDetailsStatus] = useState("idle");
  const [loading, setLoading] = useState(true);
  // ?tab= / ?dish= / ?mode= are read from window.location after mount (effect
  // below): the site is a static export, so there are no request-time searchParams.
  const [urlDish, setUrlDish] = useState(null);
  const dishSlug = initialDishSlug || urlDish || null;
  const [tab, setTab] = useState(initialTab);
  // One prebuilt HTML serves every ?tab=, so the first render can't know the
  // tab; stay blank for that frame instead of flashing the map's clouds.
  const [tabReady, setTabReady] = useState(false);
  const [raceView, setRaceView] = useState(initialRaceView); // which sub-tab the Race panel opens on
  const [activeCategory, setActiveCategory] = useState("all");

  const pushAppPath = (path) => {
    if (typeof window !== "undefined" && window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, "", path);
    }
  };

  // Vote is an in-app tab like the others: /?tab=race (This week) or
  // /?tab=race&view=race (The race). No full reload, and the address stays on
  // the same route, so the old soft-404 (pushState to /race/this-week while
  // the router sat on "/") can't happen. /race and /race/this-week remain as
  // shareable landing pages.
  const openRaceView = (view) => {
    setRaceView(view);
    setTab("race");
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/race")) return; // landing page: keep its URL
    pushAppPath(view === "race" ? "/?tab=race&view=race" : "/?tab=race");
  };

  const goTab = (nextTab) => {
    if (nextTab === "race") {
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickClaimOpen, setQuickClaimOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [heroes, setHeroes] = useState([]);
  // Every spot on the map for the card rail (the map itself shows only a few pins).
  const [railList, setRailList] = useState({ spots: [], total: 0 });
  const onVisibleChange = useCallback((spots, total) => setRailList({ spots, total }), []);
  const [areaLabel, setAreaLabel] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  // Let chrome paint first so LCP is not an OSM tile on slow mobile. The map's
  // code (~1.5 MB with MapLibre) only loads once the Map or Route tab is shown,
  // so opening straight on Vote or You doesn't pay for it; it stays mounted after.
  const showsMap = tab === "map" || tab === "route";
  useEffect(() => {
    if (mapReady || !tabReady || !showsMap) return;
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
  }, [mapReady, tabReady, showsMap]);

  const [isMobile, setIsMobile] = useState(false);
  const [passport, setPassport] = useState({ visited: {}, saved: {} });
  const [stamping, setStamping] = useState(null);
  const [installAsk, setInstallAsk] = useState(0);
  const [ateHere, setAteHere] = useState(null); // { spot, result } for the post-visit popup // stamp count when we ask to install, 0 = hidden
  const [diaryTick, setDiaryTick] = useState(0);
  const [stickerFor, setStickerFor] = useState(undefined); // undefined = closed
  const [stickerTick, setStickerTick] = useState(0);
  const [stickerCount, setStickerCount] = useState(0);
  useEffect(() => { setStickerCount(stickerList().length); }, [stickerTick]);
  const [passportTab, setPassportTab] = useState("stickers");
  const [voteMap, setVoteMap] = useState({});
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [safetyOnly, setSafetyOnly] = useState(false);
  const curatedEnabled = recommendationsEnabled();
  // The map opens with every spot; picks-only is a filter (and the Recos chip).
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [recommendationDish, setRecommendationDish] = useState("");
  // Static hosting serves one prebuilt HTML for every query string.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("tab");
    if (t && ["map", "you", "passport", "saved", "race", "route"].includes(t)) setTab(t);
    if (t === "race") setRaceView(p.get("view") === "race" ? "race" : "theme");
    const d = p.get("dish");
    if (d) {
      setUrlDish(d);
      if (curatedEnabled) setRecommendationDish(d);
    }
    if (curatedEnabled && p.get("mode") === "all") setRecommendedOnly(false);
    if (p.get("filter") === "safety") setSafetyOnly(true);
    setTabReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [recommendationData, setRecommendationData] = useState(null);
  const [recommendationError, setRecommendationError] = useState(false);
  const [addDishFor, setAddDishFor] = useState(null);
  const [dishRev, setDishRev] = useState(0); // bumps so the open card re-reads dish counts after an add // recommended place whose "What's good here?" sheet is open
  const [suggestOpen, setSuggestOpen] = useState(null); // null | "form" | "thanks"
  const recoRequested = useRef(false);
  useEffect(() => {
    if (!curatedEnabled || recoRequested.current) return;
    // 2.3 MB of map data: fetch now on the map, but let another opening tab (Vote,
    // You) get its own data first and pull this in once the browser is idle.
    const load = () => {
      if (recoRequested.current) return;
      recoRequested.current = true;
      fetch("/api/recommendations", { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then(setRecommendationData).catch(() => setRecommendationError(true));
    };
    if (tab === "map") { load(); return; }
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(load, { timeout: 3000 })
      : window.setTimeout(load, 1500);
    return () => (window.cancelIdleCallback && window.requestIdleCallback ? window.cancelIdleCallback(idle) : window.clearTimeout(idle));
  }, [curatedEnabled, tab]);
  const eateries = useMemo(() => {
    if (!curatedEnabled || !recommendationData) return indexedEateries;
    const rows = new Map(indexedEateries.map((p) => [p.id, p]));
    for (const p of recommendationData.places) if (!rows.has(p.id)) rows.set(p.id, { ...p, tags: [], core: false });
    return [...rows.values()];
  }, [indexedEateries, curatedEnabled, recommendationData]);
  // Dish dropdown options, with how many recommended spots serve each.
  const recommendationDishOptions = useMemo(() => DISHES.map((d) => ({ ...d, count: (recommendationData?.places || []).filter((p) => p.recommended && servesDish(p, d.id)).length })).filter((d) => d.count > 0), [recommendationData]);
  const recommendationById = useMemo(() => Object.fromEntries((recommendationData?.places || []).map((p) => [p.id, p])), [recommendationData]);
  const recommendationIds = useMemo(() => new Set(filterRecommendations(recommendationData?.places || [], {
    mode: recommendedOnly ? "recommended" : "all", dish: recommendationDish, q: search,
  }).map((p) => p.id)), [recommendationData, recommendedOnly, recommendationDish, search]);
  const [localsOnly, setLocalsOnly] = useState(false);
  const [localsMap, setLocalsMap] = useState({}); // spotId -> distinct r/hyderabad locals recommending it (/locals-picks.json)
  const [showAll, setShowAll] = useState(true); // on by default: every listing; off: only the curated core list (name search still finds everything)
  const [safetyMap, setSafetyMap] = useState({}); // spotId -> latest food safety record (/api/inspections)
  const [safetyPlaces, setSafetyPlaces] = useState([]); // records for places not on our map, pinned
  const [nearbyArea, setNearbyArea] = useState(null);
  const [roadDistMap, setRoadDistMap] = useState({});
  const [currentTheme, setCurrentTheme] = useState(null);
  const [voteTop, setVoteTop] = useState([]);
  const [mapOffline, setMapOffline] = useState(false);
  const [picksMap, setPicksMap] = useState({});
  const [starOfWeek, setStarOfWeek] = useState(null);
  const [locPulsed, setLocPulsed] = useState(false);
  // Clouds cover the first load, so the sticker loader only shows after them.
  const [cloudsDone, setCloudsDone] = useState(false);
  const onCloudsDone = useCallback(() => setCloudsDone(true), []);
  const [locAsk, setLocAsk] = useState(false);
  // Ask Eats (behind the search pill). seed = a question typed into search.
  const [askOpen, setAskOpen] = useState(false);
  const [askSeed, setAskSeed] = useState(null);
  const locAskRan = useRef(false);
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
        const sp = new URLSearchParams(window.location.search);
        const q = sp.get("tab");
        if (q && ["map", "you", "passport", "saved", "race", "route"].includes(q)) setTab(q);
        else setTab("map");
        if (q === "race") setRaceView(sp.get("view") === "race" ? "race" : "theme");
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
    fetchCurrentTheme().then((cur) => {
      if (cur.theme?.active && !cur.theme?.winnerId) {
        setCurrentTheme(cur.theme);
        // Top 3 of the live vote become tickets on the map (real counts only).
        setVoteTop((cur.results || []).filter((r) => (r.count || 0) > 0).slice(0, 3)
          .map((r, i) => ({ spotId: r.spotId, name: r.name, count: r.count, rank: i + 1 })));
      }
    });
  }, []);

  useEffect(() => {
    fetchPicks().then(setPicksMap);
    fetch("/api/inspections").then((r) => (r.ok ? r.json() : { spots: {} })).then((d) => { setSafetyMap(d.spots || {}); setSafetyPlaces(d.places || []); }).catch(() => {});
    fetch("/locals-picks.json").then((r) => (r.ok ? r.json() : { spots: {} })).then((d) => setLocalsMap(d.spots || {})).catch(() => {});
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
    // Approved places that visitors added aren't in the static index (built at deploy),
    // so merge them in from a tiny endpoint. A failure just leaves them out.
    const added = fetch("/api/spots/added").then((r) => (r.ok ? r.json() : [])).catch(() => []);
    fetch("/eateries-index.json")
      .then((r) => r.json())
      .then(async (base) => {
        const extra = await added;
        const known = new Set(base.map((e) => e.id));
        const rows = [...base, ...extra.filter((e) => !known.has(e.id))];
        setEateries(rows.map((e) => ({
          id: e.id, name: e.n, category: e.c, lat: e.lat, lng: e.lng,
          rating: e.r, ratingCount: e.rc, tier: e.t, tags: e.g,
          priceLevel: e.p, discoveredIn: e.a, createdAt: e.ca ?? null, dishes: e.d || [], reco: e.ro === 1,
          core: e.k !== 0, // curated list (lib/coreSpots.js); older index files without `k` count as core
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

  // What the map browses by default: the curated core list, or everything with "Show all spots".
  const pool = useMemo(() => curatedEnabled ? eateries.filter((e) => recommendationIds.has(e.id)) : (showAll ? eateries : eateries.filter((e) => e.core)), [eateries, showAll, curatedEnabled, recommendationIds]);
  const hiddenCount = eateries.length - eateries.filter((e) => e.core).length;
  const activeFilterLabels = [
    openNowOnly && "Open now",
    nearbyOnly && "Nearby",
    newOnly && "New",
    safetyOnly && "Food safety record",
    localsOnly && "Locals’ picks",
    !curatedEnabled && hiddenCount > 0 && !showAll && "Top places",
    ...activeTags.map((t) => t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, " ")),
  ].filter(Boolean);
  // Food safety filter: spots with a record join the off-map records as one
  // set of red pins.
  const safetyPins = useMemo(() => {
    if (!safetyOnly) return NO_PINS;
    const linked = eateries.filter((e) => safetyMap[e.id]).map((e) => ({ ...safetyMap[e.id], name: e.name, lat: e.lat, lng: e.lng, area: e.discoveredIn && !e.discoveredIn.startsWith("text:") ? e.discoveredIn : null, spotId: e.id }));
    return [...linked, ...safetyPlaces];
  }, [safetyOnly, eateries, safetyMap, safetyPlaces]);
  // Share the map as it is now (the filter travels in the link).
  const shareFiltered = async () => {
    const url = `${window.location.origin}/?filter=safety`;
    try {
      if (navigator.share) await navigator.share({ title: "Hyderabad food safety records on the map", url });
      else { await navigator.clipboard.writeText(url); setToast("Link copied"); }
    } catch {}
  };
  const clearFilters = () => {
    setOpenNowOnly(false); setNearbyOnly(false); setNewOnly(false);
    setSafetyOnly(false); setLocalsOnly(false); setActiveTags([]); setShowAll(true);
  };
  const tagCounts = useMemo(() => {
    const c = {};
    for (const e of pool) for (const t of e.tags ?? []) c[t] = (c[t] ?? 0) + 1;
    return c;
  }, [pool]);

  const areaCentroids = useMemo(() => buildAreaCentroids(eateries), [eateries]);
  const [routeLine, setRouteLine] = useState(null);
  const [routeMatches, setRouteMatches] = useState([]);
  // "rating": best spots first, like Google Maps' search-along-route, so a
  // dense corridor doesn't dump 180 photo cards in route order. "order":
  // the original start-to-end sequence, for someone actually driving it.
  // "order" default: spreads the capped list evenly along the corridor
  // instead of clustering at whichever end has the highest-rated spots,
  // which made pins pop in/out heavily while panning (rating-sort bunches
  // the visible cap in one area, so a pan can swing from crowded to empty).
  const [routeSortMode, setRouteSortMode] = useState("order");
  const [routeExpanded, setRouteExpanded] = useState(false);
  const [routeCardsOpen, setRouteCardsOpen] = useState(true);
  const ROUTE_DISPLAY_CAP = 25;
  const handleRouteResult = useCallback((coords, matches) => {
    setRouteLine(coords);
    setRouteMatches(matches);
    setRouteExpanded(false);
    setRouteCardsOpen(true);
  }, []);
  const routeMatchesDisplay = useMemo(() => {
    if (routeExpanded) return routeMatches;
    if (routeSortMode === "rating") {
      return [...routeMatches].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, ROUTE_DISPLAY_CAP);
    }
    // "order" mode: routeMatches is already sorted start-to-end. Taking the
    // first N here would just be the first N encountered from the start
    // (all clustered at one end, the exact clustering this mode exists to
    // avoid) so stride evenly through the route-ordered list instead.
    if (routeMatches.length <= ROUTE_DISPLAY_CAP) return routeMatches;
    const step = routeMatches.length / ROUTE_DISPLAY_CAP;
    const sampled = [];
    for (let i = 0; i < ROUTE_DISPLAY_CAP; i++) sampled.push(routeMatches[Math.floor(i * step)]);
    return sampled;
  }, [routeMatches, routeSortMode, routeExpanded]);
  // Manual pin-drop for From/To, the fallback when an area is real but
  // missing from both our data and free OSM geocoding (e.g. "Mytrivanam").
  const [pickTarget, setPickTarget] = useState(null); // "from" | "to" | null
  const [pickedPoint, setPickedPoint] = useState(null); // { target, lat, lng, id }
  const handleMapPick = useCallback((lat, lng) => {
    setPickTarget((target) => {
      if (target) setPickedPoint({ target, lat, lng, id: Date.now() });
      return null;
    });
  }, []);

  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return (curatedEnabled ? pool : eateries).filter((e) => {
      if (!curatedEnabled && !showAll && !e.core && !q && !localsOnly) return false; // locals' picks bypass the core-list cut // hidden listings still match a name search
      // "desserts" is one chip for two categories (FilterChips.jsx).
      // "Recos": anything we recommend (editorial, dish and brand picks, dishes locals name, our and locals' picks).
      if (activeCategory === "recos") { if (!(e.reco || picksMap[e.id] || (localsMap[e.id] || 0) >= 2)) return false; }
      else if (activeCategory === "desserts" ? (e.category !== "bakery" && e.category !== "ice-cream") : (activeCategory !== "all" && e.category !== activeCategory)) return false;
      if (!curatedEnabled && q && !e.name.toLowerCase().includes(q)) return false;
      if (activeTags.length && !activeTags.every((t) => validTagsFor(e.category, e.tags).includes(t))) return false;
      if (openNowOnly && allDetailsStatus === "loaded" && isOpenNow(details[e.id]?.hours) !== true) return false;
      if (nearbyOnly && userLoc) {
        const d = haversineKm(userLoc, { lat: e.lat, lng: e.lng });
        if (d == null || d > 3) return false;
      }
      if (newOnly && !isNewSpot(e.createdAt)) return false;
      if (safetyOnly && !safetyMap[e.id]) return false;
      if (localsOnly && !localsMap[e.id]) return false;
      return true;
    });
  }, [eateries, pool, curatedEnabled, showAll, activeCategory, deferredSearch, activeTags, openNowOnly, allDetailsStatus, details, nearbyOnly, newOnly, safetyOnly, safetyMap, localsOnly, localsMap, userLoc, picksMap]);

  const byId = useMemo(() => {
    const m = {};
    for (const e of eateries) m[e.id] = e;
    return m;
  }, [eateries]);

  // Suggestions update immediately while the heavier map filtering is deferred.
  // Matches name or tags so "date night" style queries hit tagged spots too,
  // not just literal name substrings.
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return (curatedEnabled ? filtered : eateries)
      .filter((e) => curatedEnabled || e.name.toLowerCase().includes(q) || (e.tags || []).some((t) => t.toLowerCase().includes(q)))
      .map((e) => ({ ...e, _dist: userLoc ? haversineKm(userLoc, { lat: e.lat, lng: e.lng }) : null }))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        if (userLoc && a._dist != null && b._dist != null) return a._dist - b._dist;
        return (b.rating ?? 0) - (a.rating ?? 0);
      })
      .slice(0, 7);
  }, [eateries, filtered, curatedEnabled, search, userLoc]);

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


  const completeStamp = useCallback((id) => {
    const already = Boolean(passportStore.getState().visited[id]);
    const next = already ? passportStore.getState() : passportStore.toggleVisited(id);
    setPassport({ ...next });
    // After the 2nd stamp they are a real user: offer the home-screen install.
    const stamps = Object.keys(next.visited || {}).length;
    if (stamps >= 2 && canOfferInstall()) setTimeout(() => setInstallAsk(stamps), 1800);
    setStamping(null);
    setDiaryTick((t) => t + 1);
    trackEvent("stamp");
    setToast(already ? "Saved to your food diary" : "Stamped, added to your passport");
  }, []);

  // One tap for a visit: stamp the passport, close the sheet, claim Race points, and
  // confirm in a popup (the old flow left the sheet open with only a toast, so it
  // looked stuck, and split one visit across "Stamp" and "Claim for the Race").
  const claimForPopup = useCallback(async (spot) => {
    setAteHere({ spot, result: { state: "claiming" } });
    // With the GPS rule on, the claim must carry the phone's real position; while it's
    // off (testing), the spot's own coordinates are sent so it works from anywhere.
    let coords = { lat: Number(spot.lat), lng: Number(spot.lng) };
    if (RACE_REQUIRE_GPS) {
      coords = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
      if (!coords) {
        setAteHere({ spot, result: { state: "failed", reason: "location blocked" } });
        return;
      }
    }
    const res = await claimSpot(spot.id, coords);
    if (res.reason === "too-far") {
      setAteHere({ spot, result: { state: "failed", reason: `you're ${res.distanceKm} km away` } });
      return;
    }
    if (!res.ok) {
      setAteHere({ spot, result: { state: "failed", reason: res.reason === "not-authenticated" ? (res.detail || "sign-in") : res.reason } });
      return;
    }
    setDiaryTick((t) => t + 1);
    let rank = null;
    try {
      const uid = await getUid();
      const board = uid ? await fetchLeaderboard(uid) : null;
      rank = board?.me?.rank ?? null;
    } catch {}
    setAteHere({ spot, result: { state: res.already ? "already" : "claimed", awarded: res.awarded, rank } });
  }, []);

  const handleAteHere = useCallback((id) => {
    const spot = byId[id];
    if (!spot) return;
    if (!passportStore.getState().visited[id]) {
      const next = passportStore.toggleVisited(id);
      setPassport({ ...next });
      setDiaryTick((t) => t + 1);
      trackEvent("stamp");
      const stamps = Object.keys(next.visited || {}).length;
      if (stamps >= 2 && canOfferInstall()) setTimeout(() => setInstallAsk(stamps), 4000);
    }
    setSheetOpen(false);
    claimForPopup(spot);
  }, [byId, claimForPopup]);

  const shareAteHere = useCallback(async (spot, result) => {
    const text = result?.rank
      ? `I just claimed ${spot.name} and I'm #${result.rank} in Hyderabad's food race. Can you beat me?`
      : `I just claimed ${spot.name} in Hyderabad's food race!`;
    const spotSlug = spot.slug || spot.id;
    const url = `${window.location.origin}/spot/${encodeURIComponent(spotSlug)}`;
    try {
      if (navigator.share) await navigator.share({ title: `${spot.name} | Hyderabad Eats`, text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); setToast("Link copied"); }
    } catch {}
  }, []);

  const handleShareSpot = useCallback(async (spot) => {
    const spotSlug = spot.slug || spot.id;
    const url = `${window.location.origin}/spot/${encodeURIComponent(spotSlug)}`;
    const text = `Check out ${spot.name} on Hyderabad Eats!`;
    try {
      if (navigator.share) await navigator.share({ title: `${spot.name} | Hyderabad Eats`, text, url });
      else { await navigator.clipboard.writeText(url); setToast("Link copied to clipboard"); }
    } catch {}
  }, []);

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
      if (e) flyMap(e.lat, e.lng, 16);
    } else if (opts.fly) {
      // Rail card tap: show the spot on the map without opening the sheet.
      const e = byId[id];
      if (e) flyMap(e.lat, e.lng, 16);
    }
  }, [byId, loadDetail]);

  const handleAreaEnter = useCallback((area) => {
    setAreaLabel(area.area);
    flyMap(area.lat, area.lng, AREA_ZOOM_MAX + 1.4);
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
    flyMap(eatery.lat, eatery.lng, 16);
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

  // Near you first: once the clouds part, a phone that already allowed location
  // flies straight to the user. Otherwise one soft card asks before the browser
  // prompt does (a cold prompt on load gets denied, and a denial sticks). Skipped
  // when the visit opened a spot or another tab. Asked once per device.
  useEffect(() => {
    if (!cloudsDone || loading || userLoc || locAskRan.current) return;
    locAskRan.current = true;
    if (tab !== "map" || selectedId || !navigator.geolocation) return;
    if (new URLSearchParams(window.location.search).get("spot")) return;
    let alive = true;
    (async () => {
      let state = "prompt";
      try { state = (await navigator.permissions?.query({ name: "geolocation" }))?.state || "prompt"; } catch {}
      if (!alive) return;
      if (state === "granted") { locateMe(); return; }
      let asked = false;
      try { asked = !!localStorage.getItem("loc_prompted"); } catch {}
      if (state === "prompt" && !asked) setLocAsk(true);
    })();
    return () => { alive = false; };
  }, [cloudsDone, loading, userLoc, tab, selectedId, locateMe]);
  const answerLocAsk = useCallback((yes) => {
    setLocAsk(false);
    if (yes) { locateMe(); return; }
    try { localStorage.setItem("loc_prompted", "1"); } catch {}
  }, [locateMe]);
  useEffect(() => { if (sheetOpen || tab !== "map") setLocAsk(false); }, [sheetOpen, tab]);

  // What Ask Eats ranks with, beyond the spots themselves (lib/askEngine.js).
  const askCtx = useMemo(() => ({
    picksMap, localsMap, passport, safetyMap,
    isOpen: (e) => (allDetailsStatus === "loaded" ? isOpenNow(details[e.id]?.hours) : null),
  }), [picksMap, localsMap, passport, safetyMap, allDetailsStatus, details]);

  // Rail: every spot on the map, closest first once we know where the user is.
  const railSpots = useMemo(() => {
    if (!userLoc) return railList.spots;
    return [...railList.spots].sort((a, b) => haversineKm(userLoc, a) - haversineKm(userLoc, b));
  }, [railList, userLoc]);

  useEffect(() => {
    if (tab === "map") mapApi.current?.invalidate();
  }, [tab]);

  const openFromList = useCallback((e) => {
    setTab("map");
    setSelectedId(e.id);
    setSheetOpen(true);
    loadDetail(e.id);
    flyMap(e.lat, e.lng, 16);
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
    const focus = () => flyMap(e.lat, e.lng, 16);
    focus();
    if (!mapApi.current) setTimeout(focus, 600); // map may still be mounting
  }, [loading, byId, loadDetail]);

  const selected = selectedId ? byId[selectedId] : null;
  const selectedFull = useMemo(
    () => (selected ? { ...selected, ...(details?.[selected.id] ?? {}) } : null),
    [selected, details]
  );

  const photoUrlFor = selectedFull ? spotPhotoUrl(selectedFull.id) : null;
  const dist = selected ? (roadDistMap[selected.id] ?? (userLoc ? haversineKm(userLoc, { lat: selected.lat, lng: selected.lng }) : null)) : null;

  const visitedCount = Object.keys(passport.visited).length;
  const savedCount = Object.keys(passport.saved).length;
  const [passportBadge, setPassportBadge] = useState(0);
  const [savedBadge, setSavedBadge] = useState(0);

  // Nav badges are "unseen since last open", not live totals.
  useEffect(() => {
    setPassportBadge(passportStore.unseenVisitedCount(visitedCount));
    setSavedBadge(passportStore.unseenSavedCount(savedCount));
  }, [visitedCount, savedCount]);

  useEffect(() => {
    if (tab === "passport") {
      passportStore.markVisitedSeen(visitedCount);
      setPassportBadge(0);
    }
    if (tab === "saved") {
      passportStore.markSavedSeen(savedCount);
      setSavedBadge(0);
    }
  }, [tab, visitedCount, savedCount]);

  return (
    <div className="app-shell" data-ready={tabReady ? "1" : "0"} style={{ position: "fixed", inset: 0, paddingTop: "env(safe-area-inset-top, 0px)", display: "flex", flexDirection: "column", background: "var(--cream)", overflow: "hidden" }}>
      {/* The map UI has no visible page heading; give crawlers and screen readers one H1. */}
      <h1 style={{ position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}>
        Hyderabad food map and community rankings
      </h1>
      {/* Map tab only (mockup): search and chips float over the map. Vote,
          Guides and You open on their own big titles instead. */}
      {tab === "map" && (
        <div className="map-chrome">
        <TopBar
          search={search} setSearch={setSearch}
          searchOpen={searchOpen} setSearchOpen={setSearchOpen}
          searchResults={searchResults} onSelectResult={handleSearchSelect}
          onPreviewResult={loadDetail}
          onFilters={tab === "map" ? () => setFiltersOpen((v) => !v) : null}
          filtersOpen={filtersOpen}
          onAsk={tab === "map" ? (q) => { setSearch(""); setSearchOpen(false); if (q.trim()) setAskSeed({ text: q, key: Date.now() }); setAskOpen(true); } : null}
          filterCount={countActiveFilters({
            openNowOnly, activeTags, nearbyOnly, newOnly, safetyOnly, localsOnly,
            activeDish: recommendationDishOptions.find((d) => d.id === recommendationDish),
            curatedEnabled, recommendedOnly, hiddenCount, showAll,
          })}
        />

        {/* Sub-pages of the You hub get one way back, not a second tab bar. */}
        {(tab === "saved" || tab === "passport" || tab === "route") && (
          <div className="you-back-row">
            <button type="button" className="you-back" onClick={() => goTab("you")}>
              <Icon name="chevronDown" size={18} width={2.2} style={{ transform: "rotate(90deg)" }} />
              You
            </button>
            {tab !== "saved" && (
              <span className="you-back-title">
                {tab === "route" ? "Food on your route" : passportTab === "stickers" ? "Sticker book" : "Passport"}
              </span>
            )}
          </div>
        )}
          <FilterChips
            curatedEnabled={curatedEnabled} recommendedOnly={recommendedOnly} setRecommendedOnly={setRecommendedOnly}
            recommendationDish={recommendationDish} setRecommendationDish={setRecommendationDish}
            recommendationDishes={recommendationDishOptions}
            activeCategory={activeCategory} setActiveCategory={setActiveCategory}
            activeTags={activeTags} toggleTag={toggleTag}
            openNowOnly={openNowOnly} setOpenNowOnly={setOpenNowOnly}
            openNowLoading={allDetailsStatus === "loading"}
            tagCounts={tagCounts}
            userLoc={userLoc} nearbyOnly={nearbyOnly} setNearbyOnly={setNearbyOnly} nearbyArea={nearbyArea}
            newOnly={newOnly} setNewOnly={setNewOnly}
            safetyOnly={safetyOnly} setSafetyOnly={setSafetyOnly} safetyCount={Object.keys(safetyMap).length}
            localsOnly={localsOnly} setLocalsOnly={setLocalsOnly} localsCount={Object.keys(localsMap).length}
            showAll={showAll} setShowAll={setShowAll} hiddenCount={hiddenCount}
            filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} hideFiltersButton
          />
        </div>
      )}

      <div style={{ flex: 1, position: "relative", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", inset: 0, visibility: (tab === "map" || tab === "route") ? "visible" : "hidden" }}>
          {mapReady ? (
            <MapCanvas
              eateries={eateries}
              filtered={tab === "route" && routeCardsOpen ? routeMatchesDisplay : filtered}
              poolSize={pool.length}
              routeLine={tab === "route" ? routeLine : null}
              heroCap={tab === "route" ? 28 : 120}
              pickMode={tab === "route" && !!pickTarget}
              onPick={handleMapPick}
              pickedPoint={tab === "route" ? pickedPoint : null}
              passport={passport}
              selectedId={selectedId}
              featuredIds={featuredIds}
              onSelect={handleSelect}
              onAreaEnter={handleAreaEnter}
              onHeroesChange={setHeroes}
              onVisibleChange={onVisibleChange}
              onZoomChange={(api) => {
                mapApi.current = api;
                if (pendingFly.current) { const [lat, lng, zoom] = pendingFly.current; pendingFly.current = null; api.flyTo(lat, lng, zoom); }
              }}
              voteTop={tab === "map" ? voteTop : []}
              voteLabel={currentTheme?.title?.replace(/^best\s+/i, "").replace(/\s+in\s+hyderabad$/i, "")}
              onMapError={() => setMapOffline(true)}
              dataReady={!loading}
              onCloudsDone={onCloudsDone}
              recordPins={safetyOnly && tab === "map" ? safetyPins : NO_PINS}
              hideSpots={safetyOnly && tab === "map"}
            />
          ) : (
            <div
              aria-hidden
              style={{
                position: "absolute", inset: 0,
                background:
                  "var(--cream)", // the clouds' own sky sits on top
              }}
            >
              <Clouds />
            </div>
          )}
        </div>

        {tab === "race" && (
          <LeaderboardPanel
            initialInnerTab={raceView}
            onInnerTabChange={openRaceView}
            initialDishSlug={dishSlug ?? initialDishSlug}
            refreshTick={diaryTick}
            stampCount={visitedCount}
            onOpenClaim={() => setQuickClaimOpen(true)}
          />
        )}
        {tab === "you" && (
          <YouHub
            visitedCount={visitedCount}
            saved={eateries.filter((e) => passport.saved[e.id])}
            stickerCount={stickerCount}
            onSelectSpot={openFromList}
            onOpen={(what) => {
              if (what === "passport" || what === "stickers") { setPassportTab(what === "stickers" ? "stickers" : "passport"); goTab("passport"); }
              else if (what === "leaderboard") openRaceView("race");
              else if (what === "add") setSuggestOpen("form");
              else if (what === "ask") { goTab("map"); setAskOpen(true); }
              else goTab(what);
            }}
          />
        )}
        {tab === "passport" && (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--cream)" }}>
            {passportTab === "stickers" ? (
              <StickerBook
                refreshTick={stickerTick}
                onAddSticker={() => setStickerFor(null)}
                onOpenSpot={(id) => { const e = byId[id]; if (e) openFromList(e); }}
              />
            ) : (
              <PassportPanel eateries={eateries} passport={passport} onSelect={openFromList} diaryTick={diaryTick} />
            )}
          </div>
        )}
        {tab === "saved" && (
          <SavedPanel
            eateries={eateries} passport={passport}
            onSelect={openFromList} onToggleVisited={handleToggleVisited}
            onBrowse={() => goTab("map")}
          />
        )}

        {tab === "route" && (
          <>
            <RoutePanel
              eateries={eateries}
              areaCentroids={areaCentroids}
              onRouteResult={handleRouteResult}
              setToast={setToast}
              pickTarget={pickTarget}
              setPickTarget={setPickTarget}
              pickedPoint={pickedPoint}
            />
            {!sheetOpen && routeCardsOpen && routeMatches.length > 0 && (
              <div style={{ position: "absolute", left: 14, right: 14, bottom: 244, zIndex: 899, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ key: "rating", label: "Best first" }, { key: "order", label: "In order" }].map((opt) => {
                    const active = routeSortMode === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setRouteSortMode(opt.key)}
                        className="material pressable-sm"
                        style={{
                          height: 28, padding: "0 11px", border: "none", borderRadius: "var(--r-pill)",
                          background: active ? "var(--violet)" : "var(--cream-hi)",
                          color: active ? "#fff" : "var(--ink-soft)",
                          fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {routeMatches.length > ROUTE_DISPLAY_CAP && (
                  <button
                    onClick={() => setRouteExpanded((v) => !v)}
                    className="material pressable-sm"
                    style={{
                      height: 28, padding: "0 11px", border: "none", borderRadius: "var(--r-pill)",
                      background: "var(--cream-hi)", color: "var(--violet)",
                      fontSize: 11.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {routeExpanded ? `Top ${ROUTE_DISPLAY_CAP} only` : `Show all ${routeMatches.length}`}
                  </button>
                )}
              </div>
            )}
            {!sheetOpen && (
              <CardRail
                spots={routeMatchesDisplay}
                activeId={selectedId}
                onActivate={handleSelect}
                onOpen={() => setSheetOpen(true)}
                open={routeCardsOpen}
                onOpenChange={setRouteCardsOpen}
                featuredIds={featuredIds}
                passport={passport}
                voteMap={voteMap}
                onVote={handleVote}
                picksMap={picksMap}
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
                onAteHere={handleAteHere}
                onToggleSaved={handleToggleSaved}
                onAddSticker={(e) => setStickerFor(e)}
                onClose={() => setSheetOpen(false)}
                voteData={voteMap[selectedFull.id]}
                onVote={handleVote}
                currentTheme={currentTheme}
                detailPending={!!detailPending[selectedFull.id]}
                pick={picksMap[selectedFull.id]}
                safety={safetyMap[selectedFull.id]}
                locals={curatedEnabled ? 0 : localsMap[selectedFull.id]}
                onShare={handleShareSpot}
                recommendationContent={curatedEnabled && recommendationById[selectedFull.id]?.recommended ? <RecommendationPanel place={recommendationById[selectedFull.id]} brand={recommendationData?.brands[recommendationById[selectedFull.id].redditBrandId]} publishedDishes={(recommendationData?.dishes || []).map((d) => d.id)} onAddDish={setAddDishFor} rev={dishRev} /> : null}
              />
            )}
          </>
        )}

        {tab === "map" && (
          <>
            {!sheetOpen && !areaLabel && (
              <ThemeNudge theme={currentTheme} onVote={() => openRaceView("theme")} />
            )}
            {mapOffline && (
              <div className="map-offline" role="status">
                <span>Map is offline. Your saved spots still work.</span>
                <button type="button" onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}
            {(areaLabel || activeFilterLabels.length > 0) && (
              // What's narrowing the map, each with an x. A filter hidden behind
              // the sliders badge made the map look empty ("there are more, right?").
              <div data-area-chip="" className="map-scope">
                {areaLabel && (
                  <button
                    type="button"
                    className="map-scope-chip"
                    onClick={() => { setAreaLabel(null); setSelectedId(null); mapApi.current?.reset(); }}
                  >
                    <Icon name="close" size={13} width={2.4} color="var(--muted)" />
                    {areaLabel}
                  </button>
                )}
                {activeFilterLabels.length > 0 && (
                  <button type="button" className="map-scope-chip map-scope-chip--filter" onClick={clearFilters} aria-label={`Clear filters: ${activeFilterLabels.join(", ")}`}>
                    <Icon name="close" size={13} width={2.4} color="var(--violet-deep)" />
                    {activeFilterLabels.length === 1 ? activeFilterLabels[0] : `${activeFilterLabels.length} filters`}
                    <span>{filtered.length + (safetyOnly ? safetyPlaces.length : 0)} {filtered.length === 1 ? "spot" : "spots"}</span>
                  </button>
                )}
                {safetyOnly && (
                  <button type="button" className="map-scope-chip map-scope-chip--share" onClick={shareFiltered} aria-label="Share this map">
                    <Icon name="share" size={14} width={2.2} color="var(--ink)" />
                    Share
                  </button>
                )}
              </div>
            )}

            <div style={{ position: "absolute", right: 12, bottom: curatedEnabled && recommendedOnly ? 64 : railSpots.length ? 186 : 20, display: "flex", flexDirection: "column", gap: 9, zIndex: 1000 }}>
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

            {loading && cloudsDone && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, pointerEvents: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/stickers/biryani.webp" alt="" width={96} height={96} className="sticker-bob" />
                <div style={{ fontFamily: "var(--font-display), system-ui, sans-serif", color: "var(--ink-soft)", fontWeight: 600, fontSize: 15 }}>
                  Finding tasty spots…
                </div>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--cream-hi)", border: "1.5px solid var(--line)", padding: "16px 22px", borderRadius: 18, boxShadow: "var(--shadow-soft)", fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 600, textAlign: "center", maxWidth: "80%" }}>
                {curatedEnabled && !recommendationData ? (recommendationError ? "Recommendations could not load. Please refresh to retry." : "Loading recommendations…") : "No spots match, try another bite"}
              </div>
            )}

            {!sheetOpen && curatedEnabled && recommendedOnly && recommendationData && (
              <PicksSheet
                spots={filtered}
                recById={recommendationById}
                userLoc={userLoc}
                dishName={DISHES.find((d) => d.id === recommendationDish)?.name}
                onSelect={(id) => handleSelect(id)}
                onAddDish={setAddDishFor}
                onSuggest={() => setSuggestOpen("form")}
              />
            )}

            <AskSheet
              open={askOpen && tab === "map" && !sheetOpen}
              onClose={() => setAskOpen(false)}
              seed={askSeed}
              eateries={eateries}
              userLoc={userLoc}
              onRequestLocation={locateMe}
              ctx={askCtx}
              onOpenSpot={(id) => { setAskOpen(false); handleSelect(id); }}
            />

            {locAsk && !sheetOpen && (
              <div className="loc-ask" role="dialog" aria-labelledby="loc-ask-title">
                <div className="loc-ask-head">
                  <span className="loc-ask-icon"><Icon name="locate" size={24} width={2} color="var(--violet)" /></span>
                  <div>
                    <h2 id="loc-ask-title">Start with what&apos;s near you?</h2>
                    <p>We&apos;ll fly to where you are and line up the closest spots first.</p>
                  </div>
                </div>
                <div className="loc-ask-actions">
                  <button type="button" className="loc-ask-yes" onClick={() => answerLocAsk(true)}>Use my location</button>
                  <button type="button" className="loc-ask-no" onClick={() => answerLocAsk(false)}>Not now</button>
                </div>
              </div>
            )}

            {!sheetOpen && !locAsk && !askOpen && !(curatedEnabled && recommendedOnly) && (
              <CardRail
                spots={railSpots}
                total={railList.total}
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
                onAteHere={handleAteHere}
                onToggleSaved={handleToggleSaved}
                onAddSticker={(e) => setStickerFor(e)}
                onClose={() => setSheetOpen(false)}
                voteData={voteMap[selectedFull.id]}
                onVote={handleVote}
                currentTheme={currentTheme}
                detailPending={!!detailPending[selectedFull.id]}
                pick={picksMap[selectedFull.id]}
                safety={safetyMap[selectedFull.id]}
                locals={curatedEnabled ? 0 : localsMap[selectedFull.id]}
                recommendationContent={curatedEnabled && recommendationById[selectedFull.id]?.recommended ? <RecommendationPanel place={recommendationById[selectedFull.id]} brand={recommendationData?.brands[recommendationById[selectedFull.id].redditBrandId]} publishedDishes={(recommendationData?.dishes || []).map((d) => d.id)} onAddDish={setAddDishFor} rev={dishRev} /> : null}
              />
            )}

          </>
        )}

        {installAsk > 0 && <InstallPrompt stamps={installAsk} onClose={() => setInstallAsk(0)} />}

        {ateHere && (
          <AteHerePopup
            spot={ateHere.spot}
            result={ateHere.result}
            onOrder={() => { const s = ateHere.spot; setAteHere(null); setStamping(s); }}
            onShare={() => shareAteHere(ateHere.spot, ateHere.result)}
            onRetry={() => claimForPopup(ateHere.spot)}
            onClose={() => setAteHere(null)}
            onViewRace={() => { setAteHere(null); openRaceView("race"); }}
          />
        )}

        <QuickClaimSheet
          isOpen={quickClaimOpen}
          onClose={() => setQuickClaimOpen(false)}
          eateries={eateries}
          userLoc={userLoc}
          passport={passport}
          onClaimSpot={(spot) => handleAteHere(spot.id)}
          onViewOnMap={(spot) => {
            setTab("map");
            if (spot) handleSelect(spot.id);
          }}
        />

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

      </div>

      {addDishFor && <AddDishSheet place={addDishFor} onClose={() => setAddDishFor(null)} onSaved={() => setDishRev((n) => n + 1)} />}
      {suggestOpen && (
        <div className="dish-sheet-backdrop" onClick={() => setSuggestOpen(null)}>
          <div className="dish-sheet" role="dialog" aria-modal="true" aria-label="Suggest a place" onClick={(e) => e.stopPropagation()}>
            <div className="dish-sheet-grip" aria-hidden="true" />
            {suggestOpen === "form" ? (
              <AddPlace forPicks startOpen query="" submitLabel="Suggest it" note="We check every suggestion before it joins Recommended."
                onCancel={() => setSuggestOpen(null)} onAdded={() => setSuggestOpen("thanks")} />
            ) : (
              <>
                <h3>Thanks, got it!</h3>
                <p className="dish-sheet-note">We'll check it out. Once it's approved it shows up under Recommended for everyone.</p>
                <button type="button" className="dish-sheet-done" onClick={() => setSuggestOpen(null)}>Done</button>
              </>
            )}
          </div>
        </div>
      )}
      <BottomNav tab={tab} setTab={goTab} savedCount={savedBadge + passportBadge} />
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
