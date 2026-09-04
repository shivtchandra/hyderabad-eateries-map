"use client";

import { SEO_THEME_PICKS, slugFromTitle } from "../../lib/rankings.js";
import { useState, useEffect, useCallback } from "react";

const STATUS_COLORS = { live: "#16a34a", scheduled: "#d97706", ended: "#6b7280" };

function themeStatus(theme) {
  if (!theme) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (theme.active) return "live";
  if (theme.startDate && today < theme.startDate) return "scheduled";
  return "ended";
}

export default function AdminPage() {
  const [secret, setSecret] = useState(() => {
    try { return sessionStorage.getItem("admin_secret") || ""; } catch { return ""; }
  });
  const [authed, setAuthed] = useState(false);
  const [secretInput, setSecretInput] = useState("");

  // Theme form
  const [themeId, setThemeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [displayLimit, setDisplayLimit] = useState("20");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // All themes
  const [themes, setThemes] = useState([]);
  const [loadingThemes, setLoadingThemes] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const loadSuggestions = useCallback(async (s) => {
    try {
      const res = await fetch("/api/admin/suggestions?status=new", { headers: { Authorization: `Bearer ${s}` } });
      if (res.ok) setSuggestions((await res.json()).suggestions || []);
    } catch {}
  }, []);

  const dismissSuggestion = async (id) => {
    setSuggestions((l) => l.filter((x) => x.id !== id));
    await fetch("/api/admin/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ id, action: "dismiss" }),
    }).catch(() => {});
  };

  const loadThemes = useCallback(async (s) => {
    setLoadingThemes(true);
    const res = await fetch("/api/admin/theme?limit=20", {
      headers: { Authorization: `Bearer ${s}` },
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setThemes(data.themes || []);
    }
    setLoadingThemes(false);
  }, []);

  // Top Picks, "what to order" for a hand-picked few spots
  const [picks, setPicks] = useState([]);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const [pickSearch, setPickSearch] = useState("");
  const [pickSuggestions, setPickSuggestions] = useState([]);
  const [pickSpot, setPickSpot] = useState(null); // { spotId, name }
  const [pickDishes, setPickDishes] = useState("");
  const [pickCurator, setPickCurator] = useState("");
  const [pickNote, setPickNote] = useState("");
  const [pickSaving, setPickSaving] = useState(false);
  const [pickMsg, setPickMsg] = useState("");

  const loadPicks = useCallback(async (s) => {
    setLoadingPicks(true);
    const res = await fetch("/api/admin/picks", {
      headers: { Authorization: `Bearer ${s}` },
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setPicks(data.picks || []);
    }
    setLoadingPicks(false);
  }, []);

  const searchPickSpots = (q) => {
    setPickSearch(q);
    if (q.length < 2) { setPickSuggestions([]); return; }
    fetch(`/api/spots/search?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setPickSuggestions)
      .catch(() => setPickSuggestions([]));
  };

  const pickChoose = (spot) => {
    setPickSpot({ spotId: spot.spotId, name: spot.name });
    setPickSearch("");
    setPickSuggestions([]);
  };

  const savePick = async () => {
    if (!pickSpot || !pickDishes.trim()) return;
    setPickSaving(true); setPickMsg("");
    const res = await fetch("/api/admin/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({
        spotId: pickSpot.spotId, spotName: pickSpot.name,
        dishes: pickDishes.trim(), curator: pickCurator.trim(), note: pickNote.trim(),
      }),
    });
    if (res.ok) {
      setPickMsg("Saved ✓");
      setPickSpot(null); setPickDishes(""); setPickCurator(""); setPickNote("");
      loadPicks(secret);
    } else {
      setPickMsg("Failed to save");
    }
    setPickSaving(false);
  };

  const editPick = (p) => {
    setPickSpot({ spotId: p.spotId, name: p.spotName });
    setPickDishes(p.dishes || "");
    setPickCurator(p.curator || "");
    setPickNote(p.note || "");
    setPickMsg("");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const deletePick = async (spotId) => {
    if (!confirm("Remove this pick?")) return;
    const res = await fetch("/api/admin/picks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ spotId }),
    });
    if (res.ok) loadPicks(secret);
  };

  const tryAuth = () => {
    const s = secretInput.trim();
    if (!s) return;
    try { sessionStorage.setItem("admin_secret", s); } catch {}
    setSecret(s);
    setAuthed(true);
    loadThemes(s);
    loadPicks(s);
    loadSuggestions(s);
  };

  useEffect(() => {
    if (secret) { setAuthed(true); loadThemes(secret); loadPicks(secret); loadSuggestions(secret); }
  }, [secret, loadThemes, loadPicks, loadSuggestions]);

  const useSuggestionAsTitle = (text) => {
    setTitle(text);
    setThemeId("");
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadThemeIntoForm = (theme) => {
    setThemeId(theme.id);
    setTitle(theme.title || "");
    setDescription(theme.description || "");
    setStartDate(theme.startDate || "");
    setEndDate(theme.endDate || "");
    setDisplayLimit(String(theme.displayLimit || 20));
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveTheme = async () => {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ themeId: themeId || undefined, title, description, startDate, endDate, displayLimit: Number(displayLimit) }),
    });
    if (res.ok) {
      const data = await res.json();
      setThemeId(data.id);
      setMsg(`Saved ✓  Status: ${data.active ? "🟢 Live now" : "🕐 Scheduled"}`);
      loadThemes(secret);
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(`Error: ${err.error || res.status}`);
    }
    setSaving(false);
  };

  const pickWinner = async (theme, spotId, spotName) => {
    if (!confirm(`Set winner to "${spotName}"? This closes voting.`)) return;
    const res = await fetch("/api/admin/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ themeId: theme.id, winnerId: spotId, winnerName: spotName }),
    });
    if (res.ok) { setMsg("Winner set ✓"); loadThemes(secret); }
    else setMsg("Failed to set winner");
  };

  const newTheme = () => {
    setThemeId(""); setTitle(""); setDescription(""); setStartDate(""); setEndDate(""); setDisplayLimit("20"); setMsg("");
  };

  if (!authed) return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f0ea", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Admin Panel</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 18 }}>Enter your admin secret to continue.</div>
        <input
          type="password"
          value={secretInput}
          onChange={(e) => setSecretInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && tryAuth()}
          placeholder="Admin secret"
          style={{ width: "100%", border: "1.5px solid #ddd", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "Outfit, sans-serif", boxSizing: "border-box", marginBottom: 12 }}
        />
        <button onClick={tryAuth} style={{ width: "100%", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Sign in
        </button>
      </div>
    </div>
  );

  const liveTheme = themes.find((t) => t.active);

  return (
    <div style={{ minHeight: "100dvh", background: "#f3f0ea", padding: "24px 16px 80px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 24 }}>Admin, Weekly Voting</div>
          <button onClick={newTheme} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + New theme
          </button>
        </div>

        {/* Theme form */}
        <div style={{ background: "#fff", borderRadius: 18, padding: 22, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
            {themeId ? "Edit theme" : "Create new theme"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

          <div style={{ gridColumn: "1 / -1", marginBottom: 4 }}>
            <label style={labelStyle}>SEO quick-picks (Google Trends)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {SEO_THEME_PICKS.map((pick) => (
                <button
                  key={pick.title}
                  type="button"
                  onClick={() => { setTitle(pick.title); setDescription(pick.description); setThemeId(""); setMsg(""); }}
                  style={{
                    background: title === pick.title ? "#7c3aed" : "#f3f0ea",
                    color: title === pick.title ? "#fff" : "#444",
                    border: "1.5px solid #ddd",
                    borderRadius: 20,
                    padding: "5px 11px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {pick.title}
                </button>
              ))}
            </div>
            {title && (
              <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                SEO URL: <code>/rankings/{slugFromTitle(title)}</code>
              </div>
            )}
          </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Best Biryani in Hyderabad" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Vote for the top dum biryani spot this week" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Start date (auto-live)</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End date (auto-lock)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Max spots to show in vote</label>
              <input type="number" min="5" max="50" value={displayLimit} onChange={(e) => setDisplayLimit(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ fontSize: 12, color: "#888", marginBottom: 12, lineHeight: 1.5 }}>
            Theme goes <b>live automatically</b> on start date and <b>locks automatically</b> on end date. If no dates set, it goes live immediately.
          </div>

          {msg && <div style={{ fontSize: 13, color: msg.startsWith("Error") ? "#dc2626" : "#16a34a", marginBottom: 10, fontWeight: 600 }}>{msg}</div>}
          <button
            onClick={saveTheme}
            disabled={saving || !title}
            style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: !title ? 0.5 : 1 }}
          >
            {saving ? "Saving…" : themeId ? "Update theme" : "Publish theme"}
          </button>
        </div>

        {/* Visitor requests */}
        <div style={{ background: "#fff", borderRadius: 18, padding: 22, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Visitor requests{suggestions.length ? ` (${suggestions.length})` : ""}
            </div>
            <button onClick={() => loadSuggestions(secret)} style={{ background: "transparent", border: "1.5px solid #ddd", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Refresh
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 14, lineHeight: 1.5 }}>
            What visitors want next. Tap <b>Use as title</b> to start a theme from one, or dismiss it.
          </div>
          {suggestions.length === 0 ? (
            <div style={{ fontSize: 13, color: "#aaa", fontWeight: 500, padding: "4px 0" }}>No new requests.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f7f5f0", borderRadius: 10, padding: "10px 12px" }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: "#2a2a2a" }}>{s.text}</span>
                  <button onClick={() => useSuggestionAsTitle(s.text)} style={{ flexShrink: 0, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Use as title
                  </button>
                  <button onClick={() => dismissSuggestion(s.id)} style={{ flexShrink: 0, background: "transparent", color: "#999", border: "1.5px solid #ddd", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All themes with results */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 18 }}>All themes</div>
          <button onClick={() => loadThemes(secret)} style={{ background: "transparent", border: "1.5px solid #ddd", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Refresh
          </button>
        </div>

        {loadingThemes ? (
          <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>Loading…</div>
        ) : themes.length === 0 ? (
          <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>No themes yet. Create one above.</div>
        ) : (
          themes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} onEdit={() => loadThemeIntoForm(theme)} onPickWinner={(spotId, name) => pickWinner(theme, spotId, name)} />
          ))
        )}

        {/* Top Picks, "what to order" for a hand-picked few spots */}
        <div style={{ background: "#fff", borderRadius: 18, padding: 22, marginTop: 32, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
            {pickSpot ? `Editing pick for ${pickSpot.name}` : "Add a Top Pick"}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 14, lineHeight: 1.5 }}>
            Only a few spots need this, recommended dishes, optionally attributed to whoever picked them.
          </div>

          {!pickSpot ? (
            <div style={{ position: "relative" }}>
              <input
                value={pickSearch}
                onChange={(e) => searchPickSpots(e.target.value)}
                placeholder="Search a restaurant…"
                style={inputStyle}
              />
              {pickSuggestions.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, zIndex: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                  {pickSuggestions.map((s) => (
                    <button
                      key={s.spotId}
                      onClick={() => pickChoose(s)}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 13px", border: "none", background: "transparent", cursor: "pointer", borderBottom: "1px solid #f3f0ea", fontSize: 13.5 }}
                    >
                      <b>{s.name}</b> <span style={{ color: "#888", fontSize: 11.5 }}>{s.area}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#faf5ff", border: "1px solid #ede9fe", borderRadius: 10, padding: "9px 13px", marginBottom: 12 }}>
                <b style={{ fontSize: 13.5 }}>{pickSpot.name}</b>
                <button onClick={() => { setPickSpot(null); setPickDishes(""); setPickCurator(""); setPickNote(""); }} style={{ background: "transparent", border: "none", color: "#7c3aed", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Change
                </button>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>What to order *</label>
                <input value={pickDishes} onChange={(e) => setPickDishes(e.target.value)} placeholder="Mutton Biryani, Double ka Meetha" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Recommended by</label>
                  <input value={pickCurator} onChange={(e) => setPickCurator(e.target.value)} placeholder="Optional, e.g. Shiva" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Note</label>
                  <input value={pickNote} onChange={(e) => setPickNote(e.target.value)} placeholder="Optional short note" style={inputStyle} />
                </div>
              </div>
              {pickMsg && <div style={{ fontSize: 13, color: pickMsg.startsWith("Failed") ? "#dc2626" : "#16a34a", marginBottom: 10, fontWeight: 600 }}>{pickMsg}</div>}
              <button
                onClick={savePick}
                disabled={pickSaving || !pickDishes.trim()}
                style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: pickSaving ? "wait" : "pointer", opacity: !pickDishes.trim() ? 0.5 : 1 }}
              >
                {pickSaving ? "Saving…" : "Save pick"}
              </button>
            </>
          )}
        </div>

        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
          Current picks {picks.length > 0 && `(${picks.length})`}
        </div>
        {loadingPicks ? (
          <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>Loading…</div>
        ) : picks.length === 0 ? (
          <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>No picks yet. Add one above.</div>
        ) : (
          picks.map((p) => (
            <div key={p.spotId} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "12px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.spotName}</div>
                <div style={{ fontSize: 12.5, color: "#7c3aed", fontWeight: 600, marginTop: 2 }}>{p.dishes}</div>
                {(p.curator || p.note) && (
                  <div style={{ fontSize: 11.5, color: "#888", marginTop: 2 }}>
                    {p.curator && <span>, {p.curator}</span>}
                    {p.curator && p.note && <span> · </span>}
                    {p.note}
                  </div>
                )}
              </div>
              <button onClick={() => editPick(p)} style={{ background: "#ede9fe", color: "#7c3aed", border: "none", borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                Edit
              </button>
              <button onClick={() => deletePick(p.spotId)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ThemeCard({ theme, onEdit, onPickWinner }) {
  const [expanded, setExpanded] = useState(theme.active);
  const status = themeStatus(theme);
  const totalVotes = (theme.results || []).reduce((s, r) => s + (r.count || 0), 0);

  return (
    <div style={{ background: "#fff", borderRadius: 16, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
      {/* Header */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{ padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: status === "live" ? "#dcfce7" : status === "scheduled" ? "#fef3c7" : "#f3f4f6",
              color: STATUS_COLORS[status],
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {status === "live" ? "🟢 Live" : status === "scheduled" ? "🕐 Scheduled" : "Ended"}
            </span>
            {theme.winnerId && <span style={{ fontSize: 10, fontWeight: 700, color: "#d97706" }}>🏆 Winner set</span>}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {theme.title}
          </div>
          <div style={{ fontSize: 11.5, color: "#888", marginTop: 2 }}>
            {theme.startDate && theme.endDate ? `${theme.startDate} → ${theme.endDate}` : theme.startDate || theme.endDate || "No dates set"}
            {totalVotes > 0 && ` · ${totalVotes} votes total`}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          style={{ background: "#ede9fe", color: "#7c3aed", border: "none", borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
        >
          Edit
        </button>
        <span style={{ color: "#888", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Results */}
      {expanded && (
        <div style={{ borderTop: "1.5px solid #f3f0ea" }}>
          {!theme.results?.length ? (
            <div style={{ padding: "14px 18px", color: "#888", fontSize: 13 }}>No votes yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#faf9f7" }}>
                  {["#", "Restaurant", "Votes", ...(status === "live" && !theme.winnerId ? ["Action"] : [])].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#888", fontSize: 11, borderBottom: "1px solid #f3f0ea" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {theme.results.map((r, i) => {
                  const isWinner = r.spotId === theme.winnerId;
                  return (
                    <tr key={r.spotId} style={{ borderBottom: "1px solid #f3f0ea", background: isWinner ? "#fefce8" : "transparent" }}>
                      <td style={{ padding: "10px 12px", color: "#888", fontWeight: 700, width: 32 }}>
                        {isWinner ? "🏆" : i + 1}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: isWinner ? "#92400e" : "#1a1a1a" }}>{r.name}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 800, color: "#7c3aed" }}>{r.count}</td>
                      {status === "live" && !theme.winnerId && (
                        <td style={{ padding: "10px 12px" }}>
                          <button
                            onClick={() => onPickWinner(r.spotId, r.name)}
                            style={{ background: "#fde68a", color: "#92400e", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          >
                            Set winner
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11.5, fontWeight: 700, color: "#888", marginBottom: 4 };
const inputStyle = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "9px 13px", fontSize: 14, fontFamily: "Outfit, sans-serif", boxSizing: "border-box" };
