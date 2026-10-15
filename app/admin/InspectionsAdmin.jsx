"use client";

import { useCallback, useEffect, useState } from "react";

// Admin editor for food safety inspection drives (-> /food-safety and spot page records).
// A drive only goes public once it has at least one source URL.

const labelStyle = { display: "block", fontSize: 11.5, fontWeight: 700, color: "#888", marginBottom: 4 };
const inputStyle = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "9px 13px", fontSize: 14, fontFamily: "var(--font-ui), sans-serif", boxSizing: "border-box" };
const smallBtn = (bg, color) => ({ background: bg, color, border: "none", borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 });
const ACTIONS = [["licence-suspended", "Licence suspended"], ["closed", "Operations stopped"], ["notice", "Notice issued"], ["notice-proposed", "Show-cause notice proposed"], ["penalty", "Penalty"], ["no-action", "No action listed"]];
const STATUSES = [["action-taken", "Action taken"], ["proposed", "Proposed"], ["recorded", "Inspection recorded"], ["reinspection-due", "Re-inspection due"], ["resumed", "Resumed after re-inspection"]];

const blankEntry = () => ({ name: "", area: "", spotId: "", spotName: "", action: "licence-suspended", findings: "", status: "action-taken", statusNote: "", statusDate: "" });
const blankDrive = () => ({ id: "", date: "", title: "", areas: "", authority: "TG SAFE (Commissioner of Food Safety, Telangana)", inspected: "", samples: "", summary: "", sources: [{ label: "", url: "" }], entries: [blankEntry()] });

function SpotLink({ entry, onPick }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const search = (v) => {
    setQ(v);
    if (v.length < 2) { setHits([]); return; }
    fetch(`/api/spots/search?q=${encodeURIComponent(v)}`).then((r) => (r.ok ? r.json() : [])).then(setHits).catch(() => setHits([]));
  };
  if (entry.spotId) {
    return (
      <div style={{ fontSize: 12.5, color: "#7c3aed", fontWeight: 600 }}>
        Linked: {entry.spotName || entry.spotId}{" "}
        <button onClick={() => onPick(null)} style={smallBtn("transparent", "#7c3aed")}>Unlink</button>
      </div>
    );
  }
  return (
    <div style={{ position: "relative" }}>
      <input value={q} onChange={(e) => search(e.target.value)} placeholder="Link to an Eats spot (optional, only if sure)" style={inputStyle} />
      {hits.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, zIndex: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden" }}>
          {hits.slice(0, 8).map((s) => (
            <button key={s.spotId} onClick={() => { onPick(s); setQ(""); setHits([]); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "transparent", cursor: "pointer", borderBottom: "1px solid #f3f0ea", fontSize: 13 }}>
              <b>{s.name}</b> <span style={{ color: "#888", fontSize: 11.5 }}>{s.area}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InspectionsAdmin({ secret }) {
  const [drives, setDrives] = useState([]);
  const [form, setForm] = useState(blankDrive);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/inspections", { headers: { Authorization: `Bearer ${secret}` } }).catch(() => null);
    if (res?.ok) setDrives((await res.json()).drives || []);
  }, [secret]);
  useEffect(() => { if (secret) load(); }, [secret, load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setEntry = (i, patch) => setForm((f) => ({ ...f, entries: f.entries.map((e, j) => (j === i ? { ...e, ...patch } : e)) }));
  const setSource = (i, patch) => setForm((f) => ({ ...f, sources: f.sources.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const save = async () => {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ ...form, entries: form.entries.map(({ spotName, ...e }) => e) }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setMsg(data.published ? "Saved and published ✓" : "Saved as draft (add a source URL to publish)");
      setForm(blankDrive());
      load();
    } else {
      setMsg(`Failed: ${data.error || "network"}`);
    }
    setSaving(false);
  };

  const edit = (d) => {
    setForm({
      ...blankDrive(), ...d,
      areas: (d.areas || []).join(", "),
      inspected: String(d.inspected ?? ""), samples: String(d.samples ?? ""),
      sources: d.sources?.length ? d.sources : [{ label: "", url: "" }],
      entries: (d.entries || []).map((e) => ({ ...blankEntry(), ...e, spotId: e.spotId || "", spotName: e.spotId ? e.name : "", findings: (e.findings || []).join(", ") })),
    });
    setMsg("");
  };
  const remove = async (id) => {
    if (!confirm("Delete this drive?")) return;
    await fetch("/api/admin/inspections", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 18, padding: 22, marginTop: 32, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{form.id ? "Edit food safety drive" : "Add a food safety drive"}</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 14, lineHeight: 1.5 }}>
          Enter only what the official TG SAFE release says, in neutral words. Shows on /food-safety and on linked spot pages once it has a source URL.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
          <div><label style={labelStyle}>Date *</label><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Title *</label><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="IT corridor restaurant inspection drive" style={inputStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={labelStyle}>Areas (comma separated)</label><input value={form.areas} onChange={(e) => set("areas", e.target.value)} placeholder="Madhapur, Hitech City, Gachibowli" style={inputStyle} /></div>
          <div><label style={labelStyle}>Places inspected</label><input value={form.inspected} onChange={(e) => set("inspected", e.target.value)} inputMode="numeric" style={inputStyle} /></div>
          <div><label style={labelStyle}>Samples lifted</label><input value={form.samples} onChange={(e) => set("samples", e.target.value)} inputMode="numeric" style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 12 }}><label style={labelStyle}>Authority</label><input value={form.authority} onChange={(e) => set("authority", e.target.value)} style={inputStyle} /></div>
        <div style={{ marginBottom: 12 }}><label style={labelStyle}>Summary (1-2 neutral sentences)</label><textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></div>

        <label style={labelStyle}>Sources * (official first)</label>
        {form.sources.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, marginBottom: 8 }}>
            <input value={s.label} onChange={(e) => setSource(i, { label: e.target.value })} placeholder="TG SAFE on X" style={inputStyle} />
            <input value={s.url} onChange={(e) => setSource(i, { url: e.target.value })} placeholder="https://…" style={inputStyle} />
            <button onClick={() => set("sources", form.sources.filter((_, j) => j !== i))} style={smallBtn("#fee2e2", "#dc2626")}>✕</button>
          </div>
        ))}
        <button onClick={() => set("sources", [...form.sources, { label: "", url: "" }])} style={{ ...smallBtn("#ede9fe", "#7c3aed"), marginBottom: 16 }}>+ Source</button>

        <label style={labelStyle}>Restaurants</label>
        {form.entries.map((e, i) => (
          <div key={i} style={{ border: "1.5px solid #f0ebe3", borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
              <input value={e.name} onChange={(ev) => setEntry(i, { name: ev.target.value })} placeholder="Name as in the official release" style={inputStyle} />
              <input value={e.area} onChange={(ev) => setEntry(i, { area: ev.target.value })} placeholder="Area" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <SpotLink entry={e} onPick={(s) => setEntry(i, s ? { spotId: s.spotId, spotName: s.name } : { spotId: "", spotName: "" })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <select value={e.action} onChange={(ev) => setEntry(i, { action: ev.target.value })} style={inputStyle}>{ACTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <select value={e.status} onChange={(ev) => setEntry(i, { status: ev.target.value })} style={inputStyle}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </div>
            <input value={e.findings} onChange={(ev) => setEntry(i, { findings: ev.target.value })} placeholder="Findings, comma separated (pest infestation, expired stock)" style={{ ...inputStyle, marginBottom: 8 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8 }}>
              <input type="date" value={e.statusDate} onChange={(ev) => setEntry(i, { statusDate: ev.target.value })} style={inputStyle} />
              <input value={e.statusNote} onChange={(ev) => setEntry(i, { statusNote: ev.target.value })} placeholder="Status note (optional)" style={inputStyle} />
              <button onClick={() => set("entries", form.entries.filter((_, j) => j !== i))} style={smallBtn("#fee2e2", "#dc2626")}>Remove</button>
            </div>
          </div>
        ))}
        <button onClick={() => set("entries", [...form.entries, blankEntry()])} style={{ ...smallBtn("#ede9fe", "#7c3aed"), marginBottom: 16 }}>+ Restaurant</button>

        {msg && <div style={{ fontSize: 13, color: msg.startsWith("Failed") ? "#dc2626" : "#16a34a", marginBottom: 10, fontWeight: 600 }}>{msg}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={save} disabled={saving || !form.date || !form.title.trim()}
            style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: !form.date || !form.title.trim() ? 0.5 : 1 }}>
            {saving ? "Saving…" : "Save drive"}
          </button>
          {form.id && <button onClick={() => { setForm(blankDrive()); setMsg(""); }} style={smallBtn("#f3f4f6", "#374151")}>Cancel edit</button>}
        </div>
      </div>

      <div style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
        Food safety drives {drives.length > 0 && `(${drives.length})`}
      </div>
      {drives.length === 0 ? (
        <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>No drives yet. Add one above.</div>
      ) : drives.map((d) => (
        <div key={d.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "12px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{d.date} · {d.title}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              {(d.entries || []).length} restaurants · {(d.sources || []).length ? "published" : "draft (no source)"}
            </div>
          </div>
          <button onClick={() => edit(d)} style={smallBtn("#ede9fe", "#7c3aed")}>Edit</button>
          <button onClick={() => remove(d.id)} style={smallBtn("#fee2e2", "#dc2626")}>Delete</button>
        </div>
      ))}
    </>
  );
}
