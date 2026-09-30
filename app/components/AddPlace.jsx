"use client";

import { useState } from "react";
import { Icon } from "./Icons.jsx";

// "Can't find it? Add it": sits under the ranking search. Creates a pending spot
// (api/spots/suggest) and hands it back so the caller can vote for it straight away.
const DAILY_KEY = "hyd-eats-added-places";
const DAILY_MAX = 5;

function addedToday() {
  try {
    const v = JSON.parse(localStorage.getItem(DAILY_KEY) || "{}");
    return v.day === new Date().toDateString() ? v.n : 0;
  } catch { return 0; }
}
function countAdd() {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify({ day: new Date().toDateString(), n: addedToday() + 1 })); } catch {}
}

export function isUserSpot(id) {
  return typeof id === "string" && id.startsWith("user-");
}

export default function AddPlace({ query, onAdded }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [state, setState] = useState("idle"); // idle | saving | error
  const [msg, setMsg] = useState("");
  const q = (query || "").trim();

  if (q.length < 3 && !open) return null;

  const start = () => { setName(q); setArea(""); setMsg(""); setOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    if (addedToday() >= DAILY_MAX) { setState("error"); setMsg("You've added 5 places today, try again tomorrow."); return; }
    setState("saving");
    try {
      const res = await fetch("/api/spots/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, area }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't add it, try again.");
      countAdd();
      setOpen(false);
      setState("idle");
      onAdded({ spotId: data.spotId, name: data.name, area: data.area });
    } catch (err) {
      setState("error");
      setMsg(err.message);
    }
  };

  if (!open) {
    return (
      <button type="button" className="add-place-cta" onClick={start}>
        <Icon name="pin" size={14} width={2.2} color="var(--violet)" />
        Can&apos;t find it? Add &ldquo;{q}&rdquo;
      </button>
    );
  }

  return (
    <form className="add-place-form" onSubmit={submit}>
      <b>Add a place we don&apos;t have yet</b>
      <label>
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required autoFocus />
      </label>
      <label>
        <span>Area</span>
        <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Kondapur" maxLength={40} required />
      </label>
      {msg && <p className="add-place-msg">{msg}</p>}
      <div className="add-place-actions">
        <button type="button" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" disabled={state === "saving"} className="primary">
          {state === "saving" ? "Adding…" : "Add and vote"}
        </button>
      </div>
      <small>It shows as &ldquo;New&rdquo; while we verify it.</small>
    </form>
  );
}
