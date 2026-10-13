"use client";

import { useEffect, useRef } from "react";

// A small, shareable map of a set of places (food safety records, a ranking).
// Same light basemap as the main map (lib/mapStyle.js via MapLibre inside
// Leaflet), raster fallback, no scroll-wheel trap. Points:
//   { lat, lng, kind: "spot" | "area" | "rank", title, sub, href, tone, label, count }
const WORKER_URL = "/vendor/maplibre/6.6.0/maplibre-gl-worker.mjs";

export default function SpotsMap({ points = [], height = 360 }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true, minZoom: 9, maxZoom: 17 });
      mapRef.current = map;

      const raster = () => L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19, className: "raster-basemap",
      }).addTo(map);
      try {
        const maplibregl = await import("maplibre-gl");
        maplibregl.setWorkerUrl(WORKER_URL);
        await import("maplibre-gl/dist/maplibre-gl.css");
        await import("@maplibre/maplibre-gl-leaflet");
        const { mapStyle } = await import("../../lib/mapStyle.js");
        if (cancelled) return;
        const gl = L.maplibreGL({
          style: mapStyle,
          attribution: '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        // 'load' can fire before we listen; ask the map itself before falling back.
        const glMap = gl.getMaplibreMap();
        setTimeout(() => {
          if (cancelled || glMap.loaded() || glMap.isStyleLoaded()) return;
          map.removeLayer(gl); raster();
        }, 8000);
      } catch { raster(); }

      const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
      const bounds = [];
      for (const p of points) {
        if (p.lat == null || p.lng == null) continue;
        let html, size;
        if (p.kind === "area") {
          size = 44;
          html = `<div class="smap-area" style="--t:${p.tone || "var(--ink)"}">${esc(p.count)}</div>`;
        } else if (p.kind === "rank") {
          size = 32;
          html = `<div class="smap-rank" style="--t:${p.tone || "var(--violet)"}">${esc(p.label)}</div>`;
        } else {
          size = 22;
          html = `<div class="smap-dot" style="--t:${p.tone || "var(--violet)"}"></div>`;
        }
        const popup = `<div class="smap-pop"><b>${esc(p.title)}</b>${p.sub ? `<span>${esc(p.sub)}</span>` : ""}${p.href ? `<a href="${esc(p.href)}">Open</a>` : ""}</div>`;
        L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }), keyboard: true, title: p.title })
          .bindPopup(popup, { closeButton: false, offset: [0, -size / 2] })
          .addTo(map);
        bounds.push([p.lat, p.lng]);
      }
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
      else map.setView(bounds[0] || [17.42, 78.44], bounds.length ? 14 : 11);
    })();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, [points]);

  return <div ref={ref} className="smap" style={{ height }} role="region" aria-label="Map" />;
}
