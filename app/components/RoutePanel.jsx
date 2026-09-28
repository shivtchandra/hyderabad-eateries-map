"use client";

import { useEffect, useState } from "react";
import { IN_HYD, nearestAreaLabel } from "../../lib/eateryUtils.js";
import { fetchRoutePolyline, findEateriesAlongRoute } from "../../lib/routeSearch.js";
import RouteSearchInput from "./RouteSearchInput.jsx";
import { Icon } from "./Icons.jsx";

// Route tab: From/To inputs resolve to coordinates (area centroid, exact
// spot, or free-text address), OSRM gives the road polyline, then spots
// within a buffer of that polyline are surfaced. Map + results list live in
// page.jsx (MapCanvas gets routeLine/matches, CardRail gets the matches),
// this panel only owns the input row and status line.
//
// Collapses to a one-line summary once a search succeeds, Maps-style, so the
// map (and the CardRail results under it) get the screen back instead of
// the input form staying pinned open over everything.
const BUFFER_OPTIONS = [
  { label: "Closer", meters: 200 },
  { label: "Default", meters: 350 },
  { label: "Wider", meters: 700 },
];

export default function RoutePanel({
  eateries, areaCentroids, onRouteResult, setToast,
  pickTarget, setPickTarget, pickedPoint,
}) {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromSel, setFromSel] = useState(null);
  const [toSel, setToSel] = useState(null);
  const [showVia, setShowVia] = useState(false);
  const [viaQuery, setViaQuery] = useState("");
  const [viaSel, setViaSel] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | success | empty
  const [meta, setMeta] = useState(null); // { distanceKm, durationMin, count }
  const [bufferMeters, setBufferMeters] = useState(350);
  const [routeCoords, setRouteCoords] = useState(null); // cached, so buffer changes don't refetch OSRM
  const [editing, setEditing] = useState(true);

  const pickFrom = (r) => { setFromSel(r); setFromQuery(r.label); };
  const pickTo = (r) => { setToSel(r); setToQuery(r.label); };
  const pickVia = (r) => { setViaSel(r); setViaQuery(r.label); };
  const removeVia = () => { setShowVia(false); setViaSel(null); setViaQuery(""); };

  // A pin dropped on the map (page.jsx owns the click, this just consumes
  // the result), the fallback for a real place missing from both our area
  // data and free OSM geocoding. Also how a general "route through here"
  // via-point gets set, generalising the one-off Jubilee Hills bias into
  // something anyone can do for any pair.
  useEffect(() => {
    if (!pickedPoint) return;
    const label = nearestAreaLabel(pickedPoint, areaCentroids);
    const result = { kind: "pin", label, lat: pickedPoint.lat, lng: pickedPoint.lng };
    if (pickedPoint.target === "from") pickFrom(result);
    else if (pickedPoint.target === "via") pickVia(result);
    else pickTo(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedPoint?.id]);

  const togglePick = (target) => setPickTarget((t) => {
    const next = t === target ? null : target;
    if (next) {
      const label = next === "from" ? "From" : next === "via" ? "your via stop" : "To";
      setToast(`Tap the map to drop a pin for ${label}`);
    }
    return next;
  });

  const swap = () => {
    const f = fromSel, fq = fromQuery;
    setFromSel(toSel); setFromQuery(toQuery);
    setToSel(f); setToQuery(fq);
  };

  const applyBuffer = (coords, meters, routeMeta) => {
    const matches = findEateriesAlongRoute(eateries, coords, { bufferMeters: meters });
    setMeta({ ...routeMeta, count: matches.length });
    setStatus(matches.length ? "success" : "empty");
    onRouteResult(coords, matches);
  };

  const findSpots = async () => {
    if (!fromSel || !toSel) {
      setToast("Pick a from and a to spot first");
      return;
    }
    if (!IN_HYD(fromSel.lat, fromSel.lng) || !IN_HYD(toSel.lat, toSel.lng)) {
      setToast("That's outside Hyderabad, try another spot");
      return;
    }
    setStatus("loading");
    const route = await fetchRoutePolyline(fromSel, toSel, viaSel ? { lat: viaSel.lat, lng: viaSel.lng } : null);
    if (!route) {
      setStatus("idle");
      setToast("Couldn't load the route, try again");
      onRouteResult(null, []);
      return;
    }
    setRouteCoords(route.coords);
    applyBuffer(route.coords, bufferMeters, { distanceKm: route.distanceKm, durationMin: route.durationMin });
    setEditing(false);
  };

  const changeBuffer = (meters) => {
    setBufferMeters(meters);
    if (routeCoords && meta) applyBuffer(routeCoords, meters, meta);
  };

  if (!editing && (status === "success" || status === "empty")) {
    return (
      <div style={{ position: "absolute", top: 12, left: 12, right: 12, maxWidth: 480, margin: "0 auto", zIndex: 1000, display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={() => setEditing(true)}
          className="material pressable-sm"
          style={{
            display: "flex", alignItems: "center", gap: 9, height: 46, padding: "0 13px",
            borderRadius: "var(--r-pill)", border: "none", textAlign: "left", cursor: "pointer",
          }}
        >
          <Icon name="navigate" size={16} width={2} color="var(--violet)" />
          <span style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {fromQuery} <span style={{ color: "var(--muted)", fontWeight: 500 }}>to</span> {toQuery}
              {viaSel && <span style={{ color: "var(--muted)", fontWeight: 500 }}> via {viaQuery}</span>}
            </span>
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginTop: 1 }}>
              {status === "success"
                ? `${meta.count} spot${meta.count === 1 ? "" : "s"} · ${meta.distanceKm.toFixed(1)} km · ${Math.round(meta.durationMin)} min`
                : `No spots within ${bufferMeters}m, try Wider`}
            </span>
          </span>
          <Icon name="close" size={13} width={2.2} color="var(--muted)" style={{ transform: "rotate(45deg)" }} />
        </button>

        <div style={{ display: "flex", gap: 6 }}>
          {BUFFER_OPTIONS.map((opt) => {
            const active = bufferMeters === opt.meters;
            return (
              <button
                key={opt.meters}
                onClick={() => changeBuffer(opt.meters)}
                className="pressable-sm"
                style={{
                  flex: 1, height: 30, border: "none", borderRadius: "var(--r-pill)",
                  background: active ? "var(--violet)" : "var(--cream-hi)",
                  color: active ? "#fff" : "var(--ink-soft)",
                  fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                  boxShadow: active ? "none" : "var(--e1)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const pinBtn = (target) => (
    <button
      type="button"
      onClick={() => togglePick(target)}
      aria-label={`Drop a pin on the map for ${target === "via" ? "the stop" : target}`}
      aria-pressed={pickTarget === target}
      className={`route-pin${pickTarget === target ? " active" : ""}`}
    >
      <Icon name="pin" size={15} width={2} color={pickTarget === target ? "#fff" : "var(--muted)"} />
    </button>
  );

  return (
    <div className="route-panel">
      <div className="route-card material">
        <div className="route-fields">
          <div className="route-rail" aria-hidden="true">
            <span className="route-dot from" />
            <span className="route-line" />
            {showVia && <><span className="route-dot via" /><span className="route-line" /></>}
            <span className="route-dot to" />
          </div>
          <div className="route-inputs">
            <RouteSearchInput
              row label="From" placeholder="Where from? e.g. Ameerpet"
              value={fromQuery} onChange={setFromQuery} onPick={pickFrom}
              eateries={eateries} areaCentroids={areaCentroids}
              trailing={pinBtn("from")}
            />
            {showVia && (
              <RouteSearchInput
                row label="Stop" placeholder="Stop on the way"
                value={viaQuery} onChange={setViaQuery} onPick={pickVia}
                eateries={eateries} areaCentroids={areaCentroids}
                trailing={<>
                  {pinBtn("via")}
                  <button type="button" onClick={removeVia} aria-label="Remove stop" className="route-pin">
                    <Icon name="close" size={13} width={2.2} color="var(--muted)" />
                  </button>
                </>}
              />
            )}
            <RouteSearchInput
              row label="To" placeholder="Where to? e.g. Gachibowli"
              value={toQuery} onChange={setToQuery} onPick={pickTo}
              eateries={eateries} areaCentroids={areaCentroids}
              trailing={pinBtn("to")}
            />
          </div>
          <button type="button" onClick={swap} aria-label="Swap from and to" className="route-swap">
            <Icon name="navigate" size={14} width={2} color="var(--ink-soft)" style={{ transform: "rotate(90deg)" }} />
          </button>
        </div>

        {pickTarget && (
          <p className="route-hint">
            <Icon name="pin" size={12} width={2} color="var(--violet)" />
            Tap the map to drop a pin for {pickTarget === "from" ? "From" : pickTarget === "via" ? "your stop" : "To"}
          </p>
        )}

        <div className="route-opts">
          {!showVia ? (
            <button type="button" onClick={() => setShowVia(true)} className="route-add">+ Add a stop</button>
          ) : <span />}
          <div className="route-seg" role="group" aria-label="How far off the route">
            {BUFFER_OPTIONS.map((opt) => (
              <button
                key={opt.meters}
                type="button"
                className={bufferMeters === opt.meters ? "active" : undefined}
                aria-pressed={bufferMeters === opt.meters}
                onClick={() => setBufferMeters(opt.meters)}
                title={`Spots within ${opt.meters} m of the road`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={findSpots} disabled={status === "loading"} className="route-go">
          <Icon name="navigate" size={16} width={2} color="#fff" />
          {status === "loading" ? "Finding the route…" : "Find spots along the way"}
        </button>
      </div>
    </div>
  );
}
