import Link from "next/link";
import { Icon } from "./Icons.jsx";

export default function RedditCommunityPost({ thread, showStandings = true, showHighlights = true, style = {} }) {
  if (!thread) return null;

  return (
    <aside
      className="reddit-community-card"
      style={{
        background: "var(--paper, #fff)",
        border: "1.5px solid #ff4500", // Reddit authentic orange border
        borderRadius: 14,
        padding: "18px 20px",
        boxShadow: "0 2px 8px rgba(255, 69, 0, 0.08)",
        margin: "20px 0 28px",
        ...style,
      }}
      aria-label="Community discussion on Reddit"
    >
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#ff4500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 900,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            r/
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <a
                href="https://www.reddit.com/r/hyderabad/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: 800, fontSize: 13, color: "#ff4500", textDecoration: "none" }}
              >
                {thread.subreddit}
              </a>
              <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>•</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                Posted by <strong style={{ color: "var(--ink)" }}>{thread.author}</strong>
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
              Verified Hyderabad Eats Weekly Food Challenge
            </div>
          </div>
        </div>

        <a
          href={thread.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#ff4500",
            background: "rgba(255, 69, 0, 0.08)",
            padding: "5px 11px",
            borderRadius: 999,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          View Reddit Thread ↗
        </a>
      </div>

      {/* Post title */}
      <h3 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 18, color: "var(--ink)", margin: "8px 0 10px", lineHeight: 1.35 }}>
        <a href={thread.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
          &ldquo;{thread.title}&rdquo;
        </a>
      </h3>

      {thread.summary && (
        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
          {thread.summary}
        </p>
      )}

      {/* Standings from the user's thread */}
      {showStandings && thread.standings?.length > 0 && (
        <div style={{ background: "var(--cream, #faf7f2)", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--violet)", marginBottom: 8 }}>
            Live Voting Standings in r/hyderabad
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {thread.standings.map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, gap: 10 }}>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                  {s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : "🥉"} {s.name} <small style={{ color: "var(--muted)", fontWeight: 400 }}>({s.area})</small>
                </span>
                <span style={{ fontWeight: 800, color: "var(--violet)", fontSize: 12.5 }}>
                  {s.votes} vote{s.votes === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw unfiltered comments from locals */}
      {showHighlights && thread.highlights?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 8 }}>
            Local Diners Debate:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {thread.highlights.map((h, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: h.user.includes("OP") ? "rgba(255, 69, 0, 0.05)" : "var(--paper)",
                  border: "1px solid var(--line)",
                  fontSize: 12.5,
                  color: "var(--ink)",
                  lineHeight: 1.45,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <strong style={{ color: h.user.includes("OP") ? "#ff4500" : "var(--violet)" }}>{h.user}</strong>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>▲ {h.score}</span>
                </div>
                <span>&ldquo;{h.comment}&rdquo;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call to action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          No sponsored rankings. Voted directly by r/hyderabad foodies.
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/race/this-week"
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "var(--violet)",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 8,
              background: "var(--violet-wash)",
            }}
          >
            Vote in Live Food Race →
          </Link>
        </div>
      </div>
    </aside>
  );
}
