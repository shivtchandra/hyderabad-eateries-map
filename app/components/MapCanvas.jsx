"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { spotlight, buildAreas, scoreOf, AREA_ZOOM_MAX, photoUrl } from "../../lib/spotlight.js";
import * as passportStore from "../../lib/passport.js";
import Clouds from "./Clouds.jsx";

const HYD_CENTER = [17.42, 78.44];
let cloudsPlayed = false; // per page load, survives map remounts
// Copied from node_modules/maplibre-gl/dist (worker + the shared chunk it
// imports). Bump the folder when maplibre-gl is upgraded.
const MAPLIBRE_WORKER_URL = "/vendor/maplibre/6.6.0/maplibre-gl-worker.mjs";

// Mirrors the category tokens in globals.css (Leaflet builds raw HTML strings,
// so these can't be var() references).
const CAT_COLOR = {
  restaurant: "#9D2F4F",
  "restro-bar": "#E2622A",
  cafe: "#2F4FC4",
  bakery: "#DFA43A",
  "ice-cream": "#E0899E",
  local: "#2E8B6B",
};

// Zoomed out we show neighbourhoods, not spots, you choose an area, then the
// area gives you its best. Zoomed in, the top-ranked few become photo pins and
// everything else stays a dot, so quality is visible instead of buried.
export default function MapCanvas({
  eateries, filtered, passport, selectedId, featuredIds,
  onSelect, onAreaEnter, onHeroesChange, onZoomChange, routeLine = null, heroCap = 120, poolSize,
  pickMode = false, onPick, pickedPoint = null,
  onViewportChange, onMapError, recommendationMode = false,
  voteTop = [], voteLabel = "", dataReady = true, onCloudsDone,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const LRef = useRef(null);
  const spotLayerRef = useRef(null);
  const areaLayerRef = useRef(null);
  const meLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const pickLayerRef = useRef(null);
  const voteTopRef = useRef(voteTop); voteTopRef.current = voteTop;
  const [ready, setReady] = useState(false);
  // Every cold open: clouds part once the basemap and the spots are ready (the
  // reels' opening). Not replayed when the map remounts in the same load.
  // Never blocks taps; skipped for reduced motion.
  const [clouds, setClouds] = useState(() => {
    if (cloudsPlayed) return false;
    cloudsPlayed = true;
    try { return !window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  });
  const cloudsDoneRef = useRef(onCloudsDone); cloudsDoneRef.current = onCloudsDone;
  useEffect(() => { if (!clouds) cloudsDoneRef.current?.(); }, [clouds]);
  const [basemapReady, setBasemapReady] = useState(false);
  const [cloudsParted, setCloudsParted] = useState(false);
  useEffect(() => {
    if (!clouds) return;
    if (!basemapReady || !dataReady) {
      const cap = window.setTimeout(() => setCloudsParted(true), 3500); // never hold the map hostage
      return () => window.clearTimeout(cap);
    }
    setCloudsParted(true);
  }, [clouds, basemapReady, dataReady]);
  useEffect(() => {
    if (!cloudsParted) return;
    const t = window.setTimeout(() => setClouds(false), 800);
    return () => window.clearTimeout(t);
  }, [cloudsParted]);
  const [viewTick, setViewTick] = useState(0);

  // Kept as refs (not state), the map's own 'click' listener is registered
  // once in the init effect below and must read the latest values without
  // that effect re-running (re-running it would tear down and rebuild the
  // whole Leaflet instance).
  const pickModeRef = useRef(pickMode);
  pickModeRef.current = pickMode;
  const viewportRef = useRef(onViewportChange); viewportRef.current = onViewportChange;
  const errorRef = useRef(onMapError); errorRef.current = onMapError;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;

      LRef.current = L;
      const map = L.map(containerRef.current, {
        center: HYD_CENTER,
        zoom: 11.6,
        zoomControl: false,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 140,
        wheelDebounceTime: 40,
        minZoom: 10.5,
        maxZoom: 18,
      });
      mapRef.current = map;

      // Basemap: our own light vector style (lib/mapStyle.js, OpenFreeMap tiles,
      // no POI icons or labels) drawn by MapLibre inside Leaflet, so markers and
      // clusters stay Leaflet. An earlier attempt "never initialised": MapLibre 6
      // builds its worker URL from import.meta.url, which webpack rewrites to a
      // file:// path, so the worker silently never started. We serve the worker
      // from public/vendor and point MapLibre at it. Anything else going wrong
      // (no WebGL, import failure, no 'load' within 8s) falls back to OSM raster.
      const addRaster = () => {
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          className: "raster-basemap",
        }).on("tileerror", () => errorRef.current?.()).addTo(map);
        setBasemapReady(true);
      };
      const hasWebGL = (() => {
        try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
      })();
      if (!hasWebGL) addRaster();
      else {
        try {
          const maplibregl = await import("maplibre-gl");
          maplibregl.setWorkerUrl(MAPLIBRE_WORKER_URL);
          await import("maplibre-gl/dist/maplibre-gl.css");
          await import("@maplibre/maplibre-gl-leaflet");
          const { mapStyle } = await import("../../lib/mapStyle.js");
          if (cancelled) return;
          const gl = L.maplibreGL({
            style: mapStyle,
            attribution:
              '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          }).addTo(map);
          let loaded = false;
          gl.getMaplibreMap().once("load", () => { loaded = true; setBasemapReady(true); });
          // Tile fetches failing after load (offline) surface the offline card.
          gl.getMaplibreMap().on("error", (ev) => { if (loaded && ev?.sourceId) errorRef.current?.(); });
          window.setTimeout(() => {
            const glm = gl.getMaplibreMap();
            if (glm.loaded() || glm.isStyleLoaded()) { if (!loaded) { loaded = true; setBasemapReady(true); } return; }
            if (loaded || cancelled || !mapRef.current) return;
            map.removeLayer(gl);
            addRaster();
          }, 8000);
        } catch {
          addRaster();
        }
      }

      areaLayerRef.current = L.layerGroup().addTo(map);
      spotLayerRef.current = L.layerGroup().addTo(map);
      meLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      pickLayerRef.current = L.layerGroup().addTo(map);

      const bump = () => {
        setViewTick((t) => t + 1);
        const b = map.getBounds(); const c = map.getCenter();
        viewportRef.current?.({ view: [c.lat, c.lng, map.getZoom()], bounds: { south: b.getSouth(), north: b.getNorth(), west: b.getWest(), east: b.getEast() } });
      };
      map.on("moveend zoomend", bump);
      // Marker clicks are separate Leaflet listeners that don't bubble here,
      // so this only fires for a tap on open map, exactly what pin-drop wants.
      map.on("click", (e) => {
        if (pickModeRef.current) onPickRef.current?.(e.latlng.lat, e.latlng.lng);
      });
      setReady(true);
      bump();
    })().catch(() => errorRef.current?.());
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // When the live vote's top 3 arrive, redraw hero pins once so the ones
  // already on screen pick up their rank badge.
  const voteKey = voteTop.map((t) => `${t.spotId}:${t.rank}`).join(",");
  useEffect(() => {
    const layer = spotLayerRef.current;
    if (!ready || !layer || !voteKey) return;
    for (const [, m] of heroMarkers.current) layer.removeLayer(m);
    heroMarkers.current.clear();
    heroEls.current = {};
    setViewTick((t) => t + 1);
  }, [ready, voteKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Spots whose photo failed to load drop to dots (no empty white pins).
  const noPhoto = useRef(new Set());
  useEffect(() => {
    try { JSON.parse(sessionStorage.getItem("eats-nophoto") || "[]").forEach((id) => noPhoto.current.add(id)); } catch {}
    const onMiss = (ev) => {
      if (!ev.detail || noPhoto.current.has(ev.detail)) return;
      noPhoto.current.add(ev.detail);
      try { sessionStorage.setItem("eats-nophoto", JSON.stringify([...noPhoto.current].slice(-500))); } catch {}
      setViewTick((t) => t + 1);
    };
    window.addEventListener("eats-nophoto", onMiss);
    return () => window.removeEventListener("eats-nophoto", onMiss);
  }, []);


  // Crosshair cursor while picking, so it's obvious the next tap places a pin.
  useEffect(() => {
    if (containerRef.current) containerRef.current.style.cursor = pickMode ? "crosshair" : "";
  }, [pickMode]);

  // Expose imperative helpers to the parent
  useEffect(() => {
    if (!ready) return;
    onZoomChange?.({
      setView: (lat, lng, zoom = 15) => mapRef.current?.setView([lat, lng], zoom, { animate: false }),
      fitPlaces: (places) => { if (places.length) mapRef.current?.fitBounds(places.map((p) => [p.lat, p.lng]), { padding: [35, 35], maxZoom: 15, animate: false }); },
      flyTo: (lat, lng, z = 15) => mapRef.current?.flyTo([lat, lng], z, { duration: 0.42, easeLinearity: 0.22 }),
      reset: () => mapRef.current?.flyTo(HYD_CENTER, 11.6, { duration: 0.55, easeLinearity: 0.22 }),
      showMe: (lat, lng) => {
        const L = LRef.current;
        if (!L || !meLayerRef.current) return;
        meLayerRef.current.clearLayers();
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: "",
            html: `<div class="me-dot"><div class="ring"></div><div class="core"></div></div>`,
            iconSize: [18, 18], iconAnchor: [9, 9],
          }),
          zIndexOffset: 3000,
        }).addTo(meLayerRef.current);
        mapRef.current?.flyTo([lat, lng], 14.5, { duration: 0.5, easeLinearity: 0.22 });
      },
      invalidate: () => setTimeout(() => mapRef.current?.invalidateSize(), 60),
    });
  }, [ready, onZoomChange]);

  // Route line, drawn once per new route, fits the view to it. Cleared when
  // routeLine goes null (leaving the Route tab or clearing a search).
  useEffect(() => {
    if (!ready || !LRef.current || !routeLayerRef.current) return;
    const L = LRef.current;
    const layer = routeLayerRef.current;
    layer.clearLayers();
    if (!routeLine?.length) return;
    const latlngs = routeLine.map((p) => [p.lat, p.lng]);
    const line = L.polyline(latlngs, { color: "#5B21B6", weight: 4, opacity: 0.85 }).addTo(layer);
    mapRef.current?.fitBounds(line.getBounds(), { padding: [48, 48] });
  }, [ready, routeLine]);

  // Manual From/To pin, dropped by tapping the map. Animates in (reuses the
  // existing pin-drop keyframe) so it's obvious where the tap landed.
  useEffect(() => {
    if (!ready || !LRef.current || !pickLayerRef.current) return;
    const L = LRef.current;
    const layer = pickLayerRef.current;
    layer.clearLayers();
    if (!pickedPoint) return;
    L.marker([pickedPoint.lat, pickedPoint.lng], {
      icon: L.divIcon({
        className: "",
        html: `
          <div class="drop-pin drop">
            <div class="drop-pin-ring"></div>
            <svg width="34" height="44" viewBox="0 0 34 44">
              <path d="M17 0C7.6 0 0 7.6 0 17c0 12.5 17 27 17 27s17-14.5 17-27C34 7.6 26.4 0 17 0z" fill="#5B21B6"/>
              <circle cx="17" cy="17" r="6" fill="#fff"/>
            </svg>
          </div>`,
        iconSize: [34, 44], iconAnchor: [17, 44],
      }),
      zIndexOffset: 2500,
    }).addTo(layer);
    mapRef.current?.flyTo([pickedPoint.lat, pickedPoint.lng], Math.max(mapRef.current.getZoom(), 14), { duration: 0.4, easeLinearity: 0.22 });
  }, [ready, pickedPoint]);

  const areas = useRef([]);
  useEffect(() => { areas.current = buildAreas(eateries); }, [eateries]);

  // Marker elements by id, so selection can be applied without a rebuild.
  const heroEls = useRef({});
  // Live Leaflet markers keyed by spot id, so each pass can diff against what's
  // already on the map instead of tearing the whole layer down.
  const heroMarkers = useRef(new Map());
  const dotMarkers = useRef(new Map());
  const prevSelected = useRef(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  // Only notify the parent when the hero *set* actually changes, firing on
  // every pan would re-render the rail continuously.
  const heroKey = useRef("");

  // Selection is a CSS class change, NOT a re-render. Rebuilding ~190 Leaflet
  // markers on every scroll tick of the card rail was the source of the jank.
  useEffect(() => {
    const els = heroEls.current;
    if (prevSelected.current && els[prevSelected.current]) {
      els[prevSelected.current].classList.remove("active");
    }
    if (selectedId && els[selectedId]) {
      els[selectedId].classList.add("active");
    }
    prevSelected.current = selectedId;
  }, [selectedId]);

  // Render pass, reconciles on view/filter changes and promotes a newly selected dot.
  useEffect(() => {
    if (!ready || !LRef.current || !mapRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;
    const zoom = map.getZoom();
    const areaLayer = areaLayerRef.current;
    const spotLayer = spotLayerRef.current;

    // When zoomed out (zoom <= AREA_ZOOM_MAX), show neighbourhood number blobs whenever
    // there are more than 12 matching spots, keeping the map clean and preventing pin piles.
    // If there are 12 or fewer spots (e.g. precise search), skip straight to individual pins.
    const isSmallSet = filtered.length <= 12;
    const showAreaBlobs = zoom <= AREA_ZOOM_MAX && !isSmallSet;

    // ---------- Neighbourhood view ----------
    if (showAreaBlobs) {
      areaLayer.clearLayers();
      // Leaving the spot view: drop the pins and the maps that track them, so
      // the next zoom-in starts from a clean slate rather than stale handles.
      if (dotMarkers.current.size || heroMarkers.current.size) {
        spotLayer.clearLayers();
        dotMarkers.current.clear();
        heroMarkers.current.clear();
        heroEls.current = {};
      }
      if (heroKey.current !== "") { heroKey.current = ""; onHeroesChange?.([]); }
      const visibleIds = new Set(filtered.map((e) => e.id));

      // Biggest areas first, then skip any that would collide with one already
      // placed, the west-side neighbourhoods sit close enough to overlap and
      // clip each other's labels otherwise.
      const candidates = areas.current
        .map((a) => ({ a, n: a.spots.filter((e) => visibleIds.has(e.id)).length }))
        .filter((c) => c.n > 0)
        .sort((x, y) => y.n - x.n);

      const placed = [];
      for (const { a, n } of candidates) {
        const size = n < 15 ? 56 : n < 60 ? 68 : 80;
        const p = map.latLngToContainerPoint([a.lat, a.lng]);
        const clash = placed.some(
          (q) => Math.hypot(q.x - p.x, q.y - p.y) < (q.size + size) / 2 + 8
        );
        if (clash) continue;
        placed.push({ x: p.x, y: p.y, size });

        const collected = a.spots.filter((e) => passport.visited[e.id]).length;
        const pct = Math.round((collected / a.spots.length) * 100);

        const html = `
          <div class="area-blob" style="width:${size}px;height:${size}px">
            <div class="area-ring" style="background:conic-gradient(var(--yellow) ${pct * 3.6}deg, rgba(0,0,0,0) 0deg)"></div>
            <div class="area-inner">
              <div class="area-count">${n}</div>
              <div class="area-name">${escapeHtml(a.area)}</div>
            </div>
          </div>`;

        L.marker([a.lat, a.lng], {
          icon: L.divIcon({ className: "", html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
          zIndexOffset: 500,
        })
          .on("click", () => onAreaEnter?.(a))
          .addTo(areaLayer);
      }
      return;
    }

    // ---------- Spot view: photo heroes + mini dots ----------
    areaLayer.clearLayers(); // blobs are few and cheap; only pins need diffing
    const b = map.getBounds();

    // The card rail covers the bottom ~185px, so exclude that strip when
    // choosing heroes, otherwise the best-ranked pins land underneath it.
    // Measured, not guessed: the rail's real height (plus its collapse button)
    // and the bottom of the floating chrome / area chip at the top.
    const mapRect = containerRef.current?.getBoundingClientRect();
    const railEl = document.querySelector("[data-map-rail]");
    const RAIL_PX = recommendationMode || !mapRect ? 0
      : railEl ? Math.max(0, mapRect.bottom - railEl.getBoundingClientRect().top) + 48
      : 24;
    const chipEl = document.querySelector("[data-area-chip]");
    const chromeBottom = Math.max(136, chipEl && mapRect ? chipEl.getBoundingClientRect().bottom - mapRect.top + 8 : 0);
    const southLimit = map.containerPointToLatLng([0, map.getSize().y - RAIL_PX]).lat;
    const bounds = {
      north: b.getNorth(),
      south: Math.max(b.getSouth(), southLimit),
      east: b.getEast(),
      west: b.getWest(),
    };
    // ---- Hero pins, placed in screen space so they never overlap ----
    // Street level used to turn every spot in view into a photo pin (up to
    // 400), and their photos and labels piled on top of each other. Now the
    // best spots in view get a photo pin only where pin + label (~128x98px)
    // fits, capped for the screen size; everything else is a small dot. Pins
    // already on screen are placed first so panning doesn't make them pop.
    const PIN = 56;
    const W = map.getSize().x, H = map.getSize().y;
    const TOP_PX = chromeBottom; // floating search row + chips (+ area chip)
    const maxHeroes = Math.min(heroCap, Math.max(4, Math.min(W < 600 ? 12 : 30, Math.floor((W * Math.max(0, H - TOP_PX - RAIL_PX)) / (130 * 110)))));
    const inBounds = (e) => e.lat >= bounds.south && e.lat <= bounds.north && e.lng >= bounds.west && e.lng <= bounds.east;
    const visible = filtered.filter(inBounds);
    // Hero candidates use the whole map (not the rail-trimmed box) so a pin
    // that drifts toward the edges while zooming keeps its photo.
    const fullB = map.getBounds();
    const onMap = (e) => e.lat >= fullB.getSouth() && e.lat <= fullB.getNorth() && e.lng >= fullB.getWest() && e.lng <= fullB.getEast();
    const byScore = filtered.filter(onMap).sort((x, y) => scoreOf(y) - scoreOf(x));
    const shown = heroMarkers.current;
    const topIds = new Set(voteTopRef.current.map((t) => t.spotId));
    const withPhoto = byScore.filter((e) => !noPhoto.current.has(e.id) || e.id === selectedId);
    const ordered = [
      ...withPhoto.filter((e) => shown.has(e.id)),
      ...withPhoto.filter((e) => !shown.has(e.id) && topIds.has(e.id)),
      ...withPhoto.filter((e) => !shown.has(e.id) && !topIds.has(e.id)),
    ];
    const boxes = [];
    let heroes = [];
    for (const e of ordered) {
      if (heroes.length >= maxHeroes) break;
      const pt = map.latLngToContainerPoint([e.lat, e.lng]);
      // The pin hangs above its point; its label sits below it.
      const bx = { x1: pt.x - 64, x2: pt.x + 64, y1: pt.y - (PIN + 12), y2: pt.y + 34 };
      if (shown.has(e.id)) {
        // Already a pin: keep it while its point is on the map (zooming in
        // pushes pins outward; they shouldn't vanish for that).
        if (pt.x < 0 || pt.x > W || pt.y < TOP_PX - 40 || pt.y > H - RAIL_PX + 12) continue; // hidden under the chrome or rail anyway
      } else {
        // New pins only where they're fully readable.
        if (bx.y1 < TOP_PX || bx.y2 > H - RAIL_PX) continue;       // under the chrome or the rail
        if (bx.x1 < 4 || bx.x2 > W - 4) continue;                  // label would be cut off
        if (bx.x2 > W - 72 && bx.y2 > H - RAIL_PX - 130) continue; // map buttons column
      }
      if (boxes.some((q) => bx.x1 < q.x2 && bx.x2 > q.x1 && bx.y1 < q.y2 && bx.y2 > q.y1)) continue;
      boxes.push(bx);
      heroes.push(e);
    }
    const heroIds = new Set(heroes.map((e) => e.id));
    let rest = visible.filter((e) => !heroIds.has(e.id));

    // An exact search result must never disappear into the dot layer just because
    // another nearby spot won the ranking cell. Selection overrides ranking.
    const selectedSpot = selectedId ? eateries.find((e) => e.id === selectedId) : null;
    const selectedVisible = selectedSpot
      && selectedSpot.lat >= bounds.south && selectedSpot.lat <= bounds.north
      && selectedSpot.lng >= bounds.west && selectedSpot.lng <= bounds.east;
    if (selectedVisible && !heroes.some((e) => e.id === selectedSpot.id)) {
      heroes = [selectedSpot, ...heroes];
      rest = rest.filter((e) => e.id !== selectedSpot.id);
    }

    if (typeof window !== "undefined") {
      window.__spot = { zoom, heroes: heroes.length, max: maxHeroes, dots: rest.length };
    }

    const key = heroes.map((e) => e.id).join(",");
    if (key !== heroKey.current) {
      heroKey.current = key;
      onHeroesChange?.(heroes);
    }

    // ---- Reconcile, don't rebuild ----
    // Previously this cleared the layer and recreated every marker on each
    // move, so a pan destroyed ~190 DOM nodes, re-requested their images and
    // replayed the drop animation, the flicker you see while dragging. Now we
    // diff: markers already on screen are left completely untouched.
    const liveDots = dotMarkers.current;
    const liveHeroes = heroMarkers.current;

    const wantDots = new Set(rest.map((e) => e.id));
    const wantHeroes = new Set(heroes.map((e) => e.id));

    for (const [id, m] of liveDots) {
      if (!wantDots.has(id)) { spotLayer.removeLayer(m); liveDots.delete(id); }
    }
    for (const [id, m] of liveHeroes) {
      if (!wantHeroes.has(id)) {
        spotLayer.removeLayer(m);
        liveHeroes.delete(id);
        delete heroEls.current[id];
      }
    }

    for (const e of rest) {
      if (liveDots.has(e.id)) continue;
      const color = CAT_COLOR[e.category] ?? "#948567";
      const isVisited = !!passport.visited[e.id];
      const m = L.marker([e.lat, e.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div class="mini-dot${isVisited ? " visited" : ""}" style="--c:${color}"></div>`,
          iconSize: [12, 12], iconAnchor: [6, 6],
        }),
        zIndexOffset: 100,
      })
        .on("click", () => onSelect?.(e.id))
        .addTo(spotLayer);
      liveDots.set(e.id, m);
    }

    const size = 56;

    for (const e of heroes) {
      if (liveHeroes.has(e.id)) continue; // already on screen, leave it alone
      const color = CAT_COLOR[e.category] ?? "#948567";
      const state = passportStore.stateOf(passport, e.id);
      const cls = ["photo-pin", state === "visited" ? "collected" : "", voteTopRef.current.some((t) => t.spotId === e.id) ? "voted-top" : ""].filter(Boolean).join(" ");

      const html = `
        <div class="${cls}" style="--c:${color};width:${size}px;height:${size + 10}px">
          <div class="photo-pin-img">
            <img src="${photoUrl(e.id)}" alt="" loading="lazy"
                 onerror="this.parentNode.classList.add('noimg');window.dispatchEvent(new CustomEvent('eats-nophoto',{detail:'${e.id}'}));this.remove()"/>
          </div>
          <div class="photo-pin-stem"></div>
          <div class="photo-pin-label">${escapeHtml(e.name)}</div>
          ${featuredIds?.has(e.id) ? '<div class="photo-pin-story" title="Has a food story"></div>' : ""}
          ${(() => { const t = voteTopRef.current.find((v) => v.spotId === e.id); return t ? `<div class="photo-pin-rank">#${t.rank}</div>` : ""; })()}
        </div>`;

      const marker = L.marker([e.lat, e.lng], {
        icon: L.divIcon({ className: "", html, iconSize: [size, size + 10], iconAnchor: [size / 2, size + 10] }),
        zIndexOffset: 1000,
      })
        .on("click", () => onSelect?.(e.id))
        .addTo(spotLayer);

      liveHeroes.set(e.id, marker);

      const el = marker.getElement()?.querySelector(".photo-pin");
      if (el) {
        heroEls.current[e.id] = el;
        if (e.id === selectedIdRef.current) el.classList.add("active");
      }
    }
  }, [ready, eateries, filtered, passport, selectedId, featuredIds, viewTick, onSelect, onAreaEnter, onHeroesChange, heroCap, poolSize]);

  return (
    <>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      {clouds && <Clouds parted={cloudsParted} />}
    </>
  );
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
