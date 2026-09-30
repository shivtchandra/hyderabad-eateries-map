"use client";

import { useCallback, useEffect, useState } from "react";

// Places visitors added from search or the rankings. Approve puts them on the map
// (location + category needed); Remove hides them from standings for good.
const CATEGORIES = [
  ["restaurant", "Restaurant"],
  ["cafe", "Cafe"],
  ["restro-bar", "Restro bar"],
  ["bakery", "Bakery"],
  ["ice-cream", "Ice cream"],
  ["local", "Local eats"],
];

// Accepts "17.44, 78.38" or a Google Maps link (…/@17.44,78.38,… or …!3d17.44!4d78.38 or ?q=17.44,78.38).
function parseLocation(text) {
  const s = String(text || "");
  const m =
    s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    s.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ||
    s.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

function PlaceRow({ place, secret, onDone }) {
  const [loc, setLoc] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const mapsSearch = `https://www.google.com/maps/search/${encodeURIComponent(`${place.name} ${place.area || ""} Hyderabad`)}`;

  const act = async (action) => {
    setMsg("");
    const body = { id: place.id, action };
    if (action === "approve") {
      const p = parseLocation(loc);
      if (!p) { setMsg("Paste a Google Maps link or lat,lng first."); return; }
      Object.assign(body, p, { category });
    }
    setBusy(true);
    const res = await fetch("/api/admin/places", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify(body),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(data.error || "Failed"); return; }
    onDone();
  };

  return (
    <li style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "var(--cream-hi)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
        <b style={{ fontSize: 15 }}>{place.name}</b>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{place.area} · {String(place.createdAt || "").slice(0, 10)}</span>
      </div>
      {place.status === "pending" ? (
        <>
          <a href={mapsSearch} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--violet)" }}>
            Find it on Google Maps →
          </a>
          <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Paste the Google Maps link or lat,lng" style={{ height: 38, border: "1.5px solid var(--line)", borderRadius: 10, padding: "0 10px", fontSize: 13.5 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ height: 36, borderRadius: 10, border: "1.5px solid var(--line)", padding: "0 8px" }}>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button disabled={busy} onClick={() => act("approve")} style={{ height: 36, padding: "0 14px", borderRadius: 999, border: "none", background: "var(--forest)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Approve</button>
            <button disabled={busy} onClick={() => act("remove")} style={{ height: 36, padding: "0 14px", borderRadius: 999, border: "1.5px solid var(--line)", background: "var(--cream)", fontWeight: 700, cursor: "pointer" }}>Remove</button>
          </div>
        </>
      ) : (
        <div>
          <button disabled={busy} onClick={() => act("restore")} style={{ height: 32, padding: "0 12px", borderRadius: 999, border: "1.5px solid var(--line)", background: "var(--cream)", fontWeight: 700, cursor: "pointer" }}>Move back to pending</button>
        </div>
      )}
      {msg && <span style={{ fontSize: 12.5, color: "var(--pop-deep)" }}>{msg}</span>}
    </li>
  );
}

export default function PlacesAdmin({ secret }) {
  const [status, setStatus] = useState("pending");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    const res = await fetch(`/api/admin/places?status=${status}`, { headers: { Authorization: `Bearer ${secret}` } });
    const data = await res.json().catch(() => ({}));
    setPlaces(data.places || []);
    setLoading(false);
  }, [secret, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, margin: "0 0 4px" }}>New places from visitors</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
        Added from the search bar or the rankings. Approve to put a place on the map, remove junk.
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["pending", "approved", "removed"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} style={{ height: 32, padding: "0 12px", borderRadius: 999, border: "1.5px solid var(--line)", background: status === s ? "var(--violet)" : "var(--cream-hi)", color: status === s ? "#fff" : "var(--ink-soft)", fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>
            {s}
          </button>
        ))}
      </div>
      {loading ? <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</p> : places.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Nothing {status}.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {places.map((p) => <PlaceRow key={p.id} place={p} secret={secret} onDone={load} />)}
        </ul>
      )}
    </section>
  );
}
