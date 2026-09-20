"use client";

import { useEffect, useState } from "react";
import { IN_HYD } from "../../lib/eateryUtils.js";
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
    const label = `Pinned spot (${pickedPoint.lat.toFixed(4)}, ${pickedPoint.lng.toFixed(4)})`;
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
      <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8 }}>
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

  return (
    <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <RouteSearchInput
              label="From" placeholder="Ameerpet"
              value={fromQuery} onChange={setFromQuery} onPick={pickFrom}
              eateries={eateries} areaCentroids={areaCentroids}
              trailingReserve={34}
            />
          </div>
          <button
            onClick={() => togglePick("from")}
            aria-label="Drop a pin for From"
            className="pressable-sm"
            style={{
              flexShrink: 0, width: 46, height: 46, borderRadius: "50%",
              border: pickTarget === "from" ? "none" : "1.5px solid var(--line)",
              background: pickTarget === "from" ? "var(--violet)" : "var(--cream-hi)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--e1)",
            }}
          >
            <Icon name="gem" size={17} width={1.9} color={pickTarget === "from" ? "#fff" : "var(--muted)"} />
          </button>
        </div>
        <div style={{ position: "relative", display: "flex", gap: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <RouteSearchInput
              label="To" placeholder="Gachibowli"
              value={toQuery} onChange={setToQuery} onPick={pickTo}
              eateries={eateries} areaCentroids={areaCentroids}
              trailingReserve={34}
            />
          </div>
          <button
            onClick={() => togglePick("to")}
            aria-label="Drop a pin for To"
            className="pressable-sm"
            style={{
              flexShrink: 0, width: 46, height: 46, borderRadius: "50%",
              border: pickTarget === "to" ? "none" : "1.5px solid var(--line)",
              background: pickTarget === "to" ? "var(--violet)" : "var(--cream-hi)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--e1)",
            }}
          >
            <Icon name="gem" size={17} width={1.9} color={pickTarget === "to" ? "#fff" : "var(--muted)"} />
          </button>
        </div>
        {showVia && (
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <RouteSearchInput
                label="Via" placeholder="Jubilee Hills"
                value={viaQuery} onChange={setViaQuery} onPick={pickVia}
                eateries={eateries} areaCentroids={areaCentroids}
                trailingReserve={34}
              />
            </div>
            <button
              onClick={() => togglePick("via")}
              aria-label="Drop a pin for Via"
              className="pressable-sm"
              style={{
                flexShrink: 0, width: 46, height: 46, borderRadius: "50%",
                border: pickTarget === "via" ? "none" : "1.5px solid var(--line)",
                background: pickTarget === "via" ? "var(--violet)" : "var(--cream-hi)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "var(--e1)",
              }}
            >
              <Icon name="gem" size={17} width={1.9} color={pickTarget === "via" ? "#fff" : "var(--muted)"} />
            </button>
            <button
              onClick={removeVia}
              aria-label="Remove via stop"
              className="pressable-sm"
              style={{
                flexShrink: 0, width: 46, height: 46, borderRadius: "50%",
                border: "1.5px solid var(--line)", background: "var(--cream-hi)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "var(--e1)",
              }}
            >
              <Icon name="close" size={15} width={2.2} color="var(--muted)" />
            </button>
          </div>
        )}
        <button
          onClick={swap}
          aria-label="Swap from and to"
          className="pressable-sm"
          style={{
            position: "absolute", right: 56, top: 54, transform: "translateY(-50%)",
            width: 28, height: 28, borderRadius: "50%", border: "1.5px solid var(--line)",
            background: "var(--cream-hi)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2, boxShadow: "var(--e1)",
          }}
        >
          <Icon name="navigate" size={13} width={2} color="var(--muted)" style={{ transform: "rotate(90deg)" }} />
        </button>
      </div>
      {!showVia && (
        <button
          onClick={() => setShowVia(true)}
          className="pressable-sm"
          style={{
            alignSelf: "flex-start", border: "none", background: "transparent",
            color: "var(--violet)", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            padding: "2px 2px", display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <Icon name="gem" size={13} width={2} color="var(--violet)" />
          Route through a specific place
        </button>
      )}
      {pickTarget && (
        <div className="material" style={{ padding: "8px 13px", borderRadius: "var(--r-lg)", fontSize: 12, fontWeight: 600, color: "var(--violet)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="gem" size={13} width={2} color="var(--violet)" />
          Tap the map to drop a pin for {pickTarget === "from" ? "From" : pickTarget === "via" ? "your via stop" : "To"}
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        {BUFFER_OPTIONS.map((opt) => {
          const active = bufferMeters === opt.meters;
          return (
            <button
              key={opt.meters}
              onClick={() => setBufferMeters(opt.meters)}
              className="pressable-sm"
              style={{
                flex: 1, height: 34, border: "none", borderRadius: "var(--r-pill)",
                background: active ? "var(--violet)" : "var(--cream-hi)",
                color: active ? "#fff" : "var(--ink-soft)",
                fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                boxShadow: active ? "none" : "var(--e1)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={findSpots}
        disabled={status === "loading"}
        className="pressable-sm"
        style={{
          height: 44, border: "none", borderRadius: "var(--r-pill)",
          background: "var(--violet)", color: "#fff", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          cursor: status === "loading" ? "default" : "pointer",
          opacity: status === "loading" ? 0.75 : 1,
          boxShadow: "var(--e2)",
        }}
      >
        <Icon name="navigate" size={16} width={2} color="#fff" />
        {status === "loading" ? "Finding the route…" : "Find spots along the way"}
      </button>
    </div>
  );
}
