"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { spotlight, buildAreas, scoreOf, AREA_ZOOM_MAX, photoUrl } from "../../lib/spotlight.js";
import * as passportStore from "../../lib/passport.js";

const HYD_CENTER = [17.42, 78.44];

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

// Zoomed out we show neighbourhoods, not spots — you choose an area, then the
// area gives you its best. Zoomed in, the top-ranked few become photo pins and
// everything else stays a dot, so quality is visible instead of buried.
export default function MapCanvas({
  eateries, filtered, passport, selectedId,
  onSelect, onAreaEnter, onHeroesChange, onZoomChange,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const LRef = useRef(null);
  const spotLayerRef = useRef(null);
  const areaLayerRef = useRef(null);
  const meLayerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [viewTick, setViewTick] = useState(0);

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

      // OSM raster. A vector basemap (MapLibre + OpenFreeMap) was attempted so
      // the POI layer could simply be omitted, but MapLibre never initialises
      // here — no 'load' event, no tile requests, no errors, even for a
      // background-only style. Falling back rather than shipping a blank map.
      // Removing OSM's baked-in POI icons needs a keyed source (CARTO Voyager
      // nolabels or Stadia); see lib/mapStyle.js for the intended palette.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      areaLayerRef.current = L.layerGroup().addTo(map);
      spotLayerRef.current = L.layerGroup().addTo(map);
      meLayerRef.current = L.layerGroup().addTo(map);

      const bump = () => setViewTick((t) => t + 1);
      map.on("moveend zoomend", bump);
      setReady(true);
      bump();
    })();
    return () => { cancelled = true; };
  }, []);

  // Expose imperative helpers to the parent
  useEffect(() => {
    if (!ready) return;
    onZoomChange?.({
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

  // Only notify the parent when the hero *set* actually changes — firing on
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

  // Render pass — reconciles on view/filter changes and promotes a newly selected dot.
  useEffect(() => {
    if (!ready || !LRef.current || !mapRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;
    const zoom = map.getZoom();
    const areaLayer = areaLayerRef.current;
    const spotLayer = spotLayerRef.current;

    // A category/tag filter is active when the working set is a strict subset of
    // everything. Filtered sets are small, so the neighbourhood-blob view (which
    // forces a zoom-in to see anything) just gets in the way — skip straight to
    // individual spots and, below, show every match instead of a ranked few.
    const filterActive = filtered.length < eateries.length;

    // ---------- Neighbourhood view ----------
    if (zoom <= AREA_ZOOM_MAX && !filterActive) {
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
      // placed — the west-side neighbourhoods sit close enough to overlap and
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
            <div class="area-ring" style="background:conic-gradient(var(--pop) ${pct * 3.6}deg, rgba(0,0,0,0) 0deg)"></div>
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
    // choosing heroes — otherwise the best-ranked pins land underneath it.
    const RAIL_PX = 185;
    const southLimit = map.containerPointToLatLng([0, map.getSize().y - RAIL_PX]).lat;
    const bounds = {
      north: b.getNorth(),
      south: Math.max(b.getSouth(), southLimit),
      east: b.getEast(),
      west: b.getWest(),
    };
    // Size the grid cell so the number of cells on screen lands near the target
    // pin count. Sizing the cell rather than truncating a ranked list is what
    // keeps the set stable: with no cut-off, panning can't push a spot over the
    // edge of a limit and make it vanish.
    const viewport = map.getSize();
    const usableH = Math.max(viewport.y - RAIL_PX, 200);
    const target = Math.max(12, Math.min(zoom > 15.5 ? 34 : 26,
      Math.round((viewport.x * usableH) / 42000)));

    const cellArea = (viewport.x * usableH) / target;
    // Wider than tall — labels run sideways, so horizontal room matters more.
    const cellW = Math.max(124, Math.sqrt(cellArea * 1.5));
    const cellH = Math.max(94, cellArea / cellW);

    // Convert that pixel cell into degrees at the current zoom.
    const c = map.getCenter();
    const origin = map.latLngToContainerPoint(c);
    const corner = map.containerPointToLatLng([origin.x + cellW, origin.y + cellH]);
    const cellLng = Math.abs(corner.lng - c.lng) || 0.002;
    const cellLat = Math.abs(corner.lat - c.lat) || 0.002;

    let { heroes, rest } = spotlight(filtered, bounds, {
      cellLat, cellLng,
      // Part of the cache key: a different filter is a different hero set.
      filterKey: `${filtered.length}:${filtered[0]?.id ?? ""}`,
    });

    // With a filter on, the user wants to see *all* the matches in view, not a
    // spread-out ranked subset with the rest demoted to dots they have to hunt
    // for. If a reasonable number are visible, promote every one to a full pin;
    // above the cap, fall back to the ranked heroes + dots so we don't paint
    // hundreds of photo cards.
    if (filterActive) {
      const inFull = (e) =>
        e.lat >= b.getSouth() && e.lat <= b.getNorth() &&
        e.lng >= b.getWest() && e.lng <= b.getEast();
      const visMatches = filtered.filter(inFull).sort((x, y) => scoreOf(y) - scoreOf(x));
      if (visMatches.length && visMatches.length <= 120) {
        heroes = visMatches;
        rest = [];
      }
    }

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
      window.__spot = { zoom, target, cellW: Math.round(cellW), cellH: Math.round(cellH), cellLat, cellLng, heroes: heroes.length };
    }

    const key = heroes.map((e) => e.id).join(",");
    if (key !== heroKey.current) {
      heroKey.current = key;
      onHeroesChange?.(heroes);
    }

    // ---- Reconcile, don't rebuild ----
    // Previously this cleared the layer and recreated every marker on each
    // move, so a pan destroyed ~190 DOM nodes, re-requested their images and
    // replayed the drop animation — the flicker you see while dragging. Now we
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
      if (liveHeroes.has(e.id)) continue; // already on screen — leave it alone
      const color = CAT_COLOR[e.category] ?? "#948567";
      const state = passportStore.stateOf(passport, e.id);
      const cls = ["photo-pin", state === "visited" ? "collected" : ""].filter(Boolean).join(" ");

      const html = `
        <div class="${cls}" style="--c:${color};width:${size}px;height:${size + 10}px">
          <div class="photo-pin-img">
            <img src="${photoUrl(e.id)}" alt="" loading="lazy"
                 onerror="this.parentNode.classList.add('noimg');this.remove()"/>
          </div>
          <div class="photo-pin-stem"></div>
          <div class="photo-pin-label">${escapeHtml(e.name)}</div>
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
  }, [ready, eateries, filtered, passport, selectedId, viewTick, onSelect, onAreaEnter, onHeroesChange]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
