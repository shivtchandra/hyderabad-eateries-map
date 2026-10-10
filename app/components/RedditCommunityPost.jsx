import Link from "next/link";

export default function RedditCommunityPost({ thread, showStandings = true, showHighlights = true, style = {} }) {
  if (!thread) return null;

  return (
    <aside
      className="reddit-community-card"
      style={{
        background: "var(--paper, #fff)",
        border: "1.5px solid rgba(255, 69, 0, 0.22)",
        borderRadius: 16,
        padding: "16px 18px",
        boxShadow: "0 2px 10px rgba(255, 69, 0, 0.05)",
        margin: "18px 0 24px",
        ...style,
      }}
      aria-label="Community discussion on Reddit"
    >
      {/* Header bar: Subreddit pill + thread link */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#ff4500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 900,
              fontSize: 11.5,
              flexShrink: 0,
            }}
          >
            r/
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#ff4500", letterSpacing: "0.03em" }}>
            {thread.subreddit}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>•</span>
          <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>
            Weekly Food Race
          </span>
        </div>

        <a
          href={thread.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "#ff4500",
            background: "rgba(255, 69, 0, 0.07)",
            padding: "3px 9px",
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

      {/* Title */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 17, color: "var(--ink)", margin: 0, lineHeight: 1.3 }}>
          {thread.shortTitle || thread.title}
        </h3>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted)" }}>
          Live community standings · 0% sponsored
        </p>
      </div>

      {/* Standings Podium */}
      {showStandings && thread.standings?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {thread.standings.map((s) => (
            <div
              key={s.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 10,
                background: s.rank === 1 ? "rgba(245, 158, 11, 0.08)" : "var(--cream, #faf7f2)",
                border: s.rank === 1 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid var(--line)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: "var(--font-mono, monospace)",
                    color: s.rank === 1 ? "#92400e" : "var(--muted)",
                    background: s.rank === 1 ? "#fef3c7" : "rgba(0,0,0,0.06)",
                    padding: "2px 6px",
                    borderRadius: 6,
                    flexShrink: 0,
                  }}
                >
                  #{s.rank}
                </span>
                <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.spotId ? (
                    <Link
                      href={`/spot/${s.spotId}`}
                      style={{ fontWeight: 750, fontSize: 13, color: "var(--ink)", textDecoration: "none" }}
                    >
                      {s.name}
                    </Link>
                  ) : (
                    <span style={{ fontWeight: 750, fontSize: 13, color: "var(--ink)" }}>{s.name}</span>
                  )}
                  {s.area && (
                    <span style={{ fontSize: 11.5, color: "var(--muted)", marginLeft: 6 }}>
                      {s.area}
                    </span>
                  )}
                </div>
              </div>
              <span
                style={{
                  flexShrink: 0,
                  fontWeight: 800,
                  fontSize: 11.5,
                  color: s.rank === 1 ? "#b45309" : "var(--violet)",
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {s.votes} {s.votes === 1 ? "vote" : "votes"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Local Consensus Takeaway */}
      {showHighlights && thread.highlights?.length > 0 && (
        <div
          style={{
            background: "rgba(255, 69, 0, 0.04)",
            border: "1px solid rgba(255, 69, 0, 0.12)",
            borderRadius: 10,
            padding: "9px 12px",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--ink)" }}>
            &ldquo;{thread.highlights[0].comment}&rdquo;
            <span style={{ display: "inline-block", marginLeft: 6, fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
              — u/{thread.highlights[0].user}
            </span>
          </div>
        </div>
      )}

      {/* Action footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid var(--line)" }}>
        <Link
          href="/race/this-week"
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "var(--violet)",
            textDecoration: "none",
            padding: "5px 11px",
            borderRadius: 8,
            background: "var(--violet-wash)",
          }}
        >
          Vote in This Week&apos;s Race →
        </Link>
        <a
          href={thread.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)", textDecoration: "none" }}
        >
          r/{thread.subreddit} Discussion ↗
        </a>
      </div>
    </aside>
  );
}
