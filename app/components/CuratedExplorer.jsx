"use client";
import { useCallback, useEffect, useMemo, useRef, useState, Component } from "react";
import dynamic from "next/dynamic";
import DetailSheet from "./DetailSheet.jsx";
import RecommendationPanel from "./RecommendationPanel.jsx";
import { DISHES, filterRecommendations, groupRecommendations, mapSearch, parseMapState } from "../../lib/recommendationShared.js";
import { haversineKm } from "../../lib/eateryUtils.js";
import { spotPhotoUrl } from "../../lib/photos.js";
import * as passport from "../../lib/passport.js";
import { trackRecommendationEvent as track } from "../../lib/recommendationTracking.js";
const MapCanvas = dynamic(() => import("./MapCanvas.jsx"), { ssr: false, loading: () => <p className="rec-map-message">Loading map. The place list is ready to use.</p> });
const EMPTY = { places: [], brands: {}, dishes: [] };
class MapBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="rec-map-message" role="status">The map is unavailable. Use the place list to keep exploring.</p> : this.props.children; }
}
export default function CuratedExplorer({ initialDish = "", embedded = false, initialModel = null }) {
  const [model, setModel] = useState(initialModel || EMPTY);
  const [loaded, setLoaded] = useState(!!initialModel);
  const [loadError, setLoadError] = useState(false);
  const [state, setState] = useState(() => parseMapState("", initialDish));
  const stateRef = useRef(state); stateRef.current = state;
  const mapApi = useRef(null);
  const latestView = useRef(null);
  const lastBounds = useRef(null);
  const [moved, setMoved] = useState(false);
  const [ready, setReady] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState({ visited: {}, saved: {} });
  const [isMobile, setIsMobile] = useState(false);
  const listRef = useRef(null);
  const opener = useRef(null);
  const scrollPositions = useRef(new Map());
  const setUrl = useCallback((next, push = false) => {
    const currentKey = mapSearch(stateRef.current);
    if (listRef.current) scrollPositions.current.set(currentKey, listRef.current.scrollTop);
    const result = { ...stateRef.current, ...next, view: latestView.current || stateRef.current.view };
    stateRef.current = result; setState(result);
    const query = mapSearch(result);
    window.history[push ? "pushState" : "replaceState"]({ ...window.history.state, rec: true }, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, []);
  useEffect(() => {
    const parsed = parseMapState(window.location.search, initialDish);
    stateRef.current = parsed; setState(parsed); setReady(true); setSaved(passport.getState());
    const media = window.matchMedia("(max-width: 767px)");
    const resize = () => { setIsMobile(media.matches); mapApi.current?.invalidate(); };
    resize(); media.addEventListener("change", resize);
    const back = () => {
      const next = parseMapState(window.location.search, initialDish);
      stateRef.current = next; setState(next);
      if (next.view) mapApi.current?.setView(...next.view);
      requestAnimationFrame(() => { if (listRef.current) listRef.current.scrollTop = scrollPositions.current.get(mapSearch(next)) || 0; });
    };
    window.addEventListener("popstate", back);
    track("landing", { dish: parsed.dish, mode: parsed.mode });
    return () => { window.removeEventListener("popstate", back); media.removeEventListener("change", resize); };
  }, [initialDish]);
  const load = useCallback(() => {
    setLoadError(false);
    fetch("/api/recommendations").then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setModel(d); setLoaded(true); }).catch(() => { setLoadError(true); setLoaded(true); });
  }, []);
  useEffect(() => { if (!initialModel) load(); }, [initialModel, load]);
  const onReady = useCallback((api) => {
    mapApi.current = api;
    const view = stateRef.current.view;
    if (view) api.setView(...view);
  }, []);
  const onViewport = useCallback((viewport) => {
    if (!mapApi.current) return;
    const previous = latestView.current;
    latestView.current = viewport.view; lastBounds.current = viewport.bounds;
    if (previous && previous.join() !== viewport.view.join()) setMoved(true);
    const next = { ...stateRef.current, view: viewport.view };
    stateRef.current = next;
    window.history.replaceState({ ...window.history.state, rec: true }, "", `${window.location.pathname}?${mapSearch(next)}`);
  }, []);
  const filtered = useMemo(() => filterRecommendations(model.places, state), [model.places, state]);
  const groups = useMemo(() => groupRecommendations(filtered), [filtered]);
  const areas = useMemo(() => [...new Set(model.places.filter((p) => state.mode === "all" || p.recommended).map((p) => p.area))].sort(), [model.places, state.mode]);
  const selected = model.places.find((p) => p.id === state.spot);
  useEffect(() => {
    if (loaded) track("impressions", { count: filtered.length, mode: state.mode, dish: state.dish, view: state.list ? "list" : "map" });
  }, [loaded, filtered.length, state.mode, state.dish, state.list]);
  function open(p) {
    opener.current = document.activeElement;
    setUrl({ spot: p.id }, true);
    track("place_open", { mode: state.mode, dish: state.dish });
  }
  function close() { setUrl({ spot: "" }); requestAnimationFrame(() => opener.current?.focus?.()); }
  function toggleSaved(id) { setSaved(passport.toggleSaved(id)); track("save"); }
  async function share(p) {
    const url = new URL(p.path, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else { await navigator.clipboard.writeText(url); setNotice("Place link copied."); }
      track("share");
    } catch (e) { if (e.name !== "AbortError") setNotice(`Share this place: ${url}`); }
  }
  function nearMe() {
    if (!navigator.geolocation) { setNotice("Location is unavailable. Choose a neighbourhood instead."); return; }
    setNotice("Finding your location…");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const loc = { lat: coords.latitude, lng: coords.longitude }; setUserLoc(loc);
      if (loc.lat < 17 || loc.lat > 18 || loc.lng < 78 || loc.lng > 79) { setNotice("You are outside Hyderabad. Choose a neighbourhood to explore."); return; }
      const b = { south: loc.lat - .027, north: loc.lat + .027, west: loc.lng - .029, east: loc.lng + .029 };
      setUrl({ bounds: b, area: "" }, true); mapApi.current?.showMe(loc.lat, loc.lng); setNotice("Showing places within the nearby map area.");
    }, () => setNotice("Location wasn’t shared. You can still choose a neighbourhood."), { timeout: 10000, maximumAge: 60000 });
  }
  useEffect(() => { mapApi.current?.invalidate(); }, [state.list]);
  const noop = useCallback(() => {}, []);
  return <div className={`rec-explorer ${embedded ? "rec-embedded" : ""} ${state.list ? "rec-list-expanded" : ""}`}>
    <header className="rec-header">
      {!embedded && <a className="rec-logo" href="/">Hyderabad Eats<span>Find your next good meal</span></a>}
      <div className="rec-search"><label htmlFor={`rec-search-${embedded}`}>Search a dish, place or neighbourhood</label><input id={`rec-search-${embedded}`} type="search" value={state.q} onChange={(e) => setUrl({ q: e.target.value })} placeholder="Try dosa, Nimrah or Madhapur" /></div>
      {!embedded && <nav aria-label="Explore Hyderabad Eats"><a href="/picks">Dish guides</a><a href="/?tab=saved">Saved</a><a href="/?tab=route">Routes</a><a href="/rankings">Rankings</a><a href="/stories">Stories</a></nav>}
    </header>
    <div className="rec-toolbar">
      <div className="rec-segment" aria-label="Places to show" role="group">{[["recommended", "Recommended"], ["all", "All places"]].map(([mode, label]) => <button key={mode} aria-pressed={state.mode === mode} onClick={() => { setUrl({ mode }, true); track("mode", { mode }); }}>{label}</button>)}</div>
      <label>Dish<select value={state.dish} onChange={(e) => { setUrl({ dish: e.target.value }, true); track("dish", { dish: e.target.value }); }}><option value="">Any dish</option>{DISHES.map((d) => <option value={d.id} key={d.id}>{d.name}</option>)}</select></label>
      <label>Neighbourhood<select value={state.area} onChange={(e) => { setUrl({ area: e.target.value, bounds: null }, true); mapApi.current?.fitPlaces(model.places.filter((p) => p.area === e.target.value && (state.mode === "all" || p.recommended))); }}><option value="">All Hyderabad</option>{areas.map((a) => <option key={a}>{a}</option>)}</select></label>
      <button onClick={nearMe}>Near me</button>
      <div className="rec-mobile-switch" role="group" aria-label="View"><button aria-pressed={!state.list} onClick={() => { setUrl({ list: false }); track("view", { view: "map" }); }}>Map</button><button aria-pressed={state.list} onClick={() => { setUrl({ list: true }); track("view", { view: "list" }); }}>List</button></div>
    </div>
    {notice && <p className="rec-notice" role="status">{notice} <button aria-label="Dismiss message" onClick={() => setNotice("")}>×</button></p>}
    <div className="rec-workspace">
      <section className="rec-map" aria-label="Map of matching places">
        {ready && <MapBoundary><MapCanvas eateries={filtered} filtered={filtered} passport={saved} selectedId={state.spot} featuredIds={new Set()} onSelect={(id) => { const p = model.places.find((x) => x.id === id); if (p) open(p); }} onAreaEnter={(area) => mapApi.current?.setView(area.lat, area.lng, 14.5)} onHeroesChange={noop} onZoomChange={onReady} onViewportChange={onViewport} recommendationMode onMapError={() => setNotice("Map tiles are unavailable. The place list still works.")} /></MapBoundary>}
        {moved && <button className="rec-search-area" onClick={() => { setUrl({ bounds: lastBounds.current, area: "" }, true); setMoved(false); }}>Search this area</button>}
        {state.bounds && <button className="rec-expand-area" onClick={() => { setUrl({ bounds: null }, true); setMoved(false); }}>Expand to all Hyderabad</button>}
      </section>
      <section className="rec-results" aria-label="Matching places" ref={listRef}>
        <button className="rec-sheet-handle" aria-expanded={state.list} onClick={() => setUrl({ list: !state.list })}>{state.list ? "Show more map" : "Expand results"}</button>
        <div className="rec-results-heading"><h2>{state.mode === "recommended" ? "Recommended places" : "All places"}</h2><p aria-live="polite">{loaded ? `${groups.length} ${groups.length === 1 ? "brand" : "brands"} · ${filtered.length} branches` : "Loading places…"}</p></div>
        {loadError && <p role="alert">Could not load places. <button onClick={load}>Retry</button></p>}
        {loaded && !loadError && !filtered.length && <div className="rec-empty"><h3>No matching places here</h3><p>Try another dish or neighbourhood, or widen the map area.</p><button onClick={() => setUrl({ q: "", dish: "", area: "", bounds: null }, true)}>Clear filters</button>{state.bounds && <button onClick={() => setUrl({ bounds: null }, true)}>Expand area</button>}</div>}
        {groups.map((group) => <article className="rec-result" key={group.id}>
          {group.branches.map((p, index) => <div key={p.id} className={`rec-branch ${state.spot === p.id ? "rec-selected" : ""}`}>
            <button className="rec-place-button" onClick={() => open(p)} aria-label={`Open ${p.name}, ${p.area}`}>
              {index === 0 && <img src={spotPhotoUrl(p.id)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
              <span><strong>{p.name}</strong><span className="rec-muted">{p.area}{userLoc ? ` · ${haversineKm(userLoc, p).toFixed(1)} km straight-line` : ""}</span>
              {!!p.dishes.length && <span>Try {p.dishes.map((d) => d.name).join(" · ")}</span>}
              <span className="rec-source">{p.editorial ? "Editorial pick" : p.redditBrandId ? "Reviewed Reddit pick · brand evidence" : "Not yet reviewed"}</span></span>
            </button>
          </div>)}
        </article>)}
      </section>
      {selected && <DetailSheet key={selected.id} eatery={selected} isMobile={isMobile} photoUrl={spotPhotoUrl(selected.id)} passportState={passport.stateOf(saved, selected.id)} onToggleSaved={toggleSaved} onClose={close} onShare={() => share(selected)} onDirections={() => track("directions", { dish: state.dish, mode: state.mode })} curatedContent={<RecommendationPanel place={selected} brand={model.brands[selected.redditBrandId]} publishedDishes={model.dishes.map((d) => d.id)} />} />}
    </div>
  </div>;
}
