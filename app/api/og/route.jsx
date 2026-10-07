import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "Hyderabad Eats").slice(0, 72);
  const subtitle = (searchParams.get("subtitle") || "").slice(0, 96);
  const area = (searchParams.get("area") || "").slice(0, 48);
  const rating = searchParams.get("rating") || "";
  const dish = (searchParams.get("dish") || "").slice(0, 60);
  const category = (searchParams.get("category") || "").slice(0, 32);
  const image = searchParams.get("image") || "";

  const hasImage = Boolean(image && image.startsWith("http"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: "#0f172a",
          color: "#ffffff",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Left / Main Content Container */}
        <div
          style={{
            flex: hasImage ? "1 1 65%" : "1 1 100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "54px 56px",
            background: hasImage
              ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
              : "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          }}
        >
          {/* Header Strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#ffffff",
              }}
            >
              Hyderabad Eats
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#94a3b8",
                letterSpacing: "0.04em",
              }}
            >
              Curated Food Map &amp; Guide
            </div>
          </div>

          {/* Center: Title & Badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: hasImage ? 44 : 54,
                fontWeight: 900,
                color: "#f8fafc",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                maxWidth: hasImage ? 640 : 1000,
              }}
            >
              {title}
            </div>

            {/* Badges strip (Rating, Area, Category) */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
              {rating ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#f59e0b",
                    color: "#0f172a",
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 16,
                    fontWeight: 800,
                  }}
                >
                  <span>★</span>
                  <span>{rating} Rating</span>
                </div>
              ) : null}

              {area ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    color: "#f1f5f9",
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  <span>📍</span>
                  <span>{area}</span>
                </div>
              ) : null}

              {category ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(124, 58, 237, 0.25)",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    color: "#e9d5ff",
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  <span>{category}</span>
                </div>
              ) : null}
            </div>

            {/* Signature dish or Subtitle callout */}
            {dish ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(234, 88, 12, 0.15)",
                  border: "1px solid rgba(249, 115, 22, 0.35)",
                  padding: "10px 18px",
                  borderRadius: 14,
                  fontSize: 16,
                  color: "#fed7aa",
                  fontWeight: 600,
                  maxWidth: hasImage ? 640 : 900,
                }}
              >
                <span style={{ fontSize: 18 }}>🔥</span>
                <span>Must Order: {dish}</span>
              </div>
            ) : subtitle ? (
              <div
                style={{
                  fontSize: 19,
                  color: "#cbd5e1",
                  lineHeight: 1.35,
                  maxWidth: hasImage ? 640 : 900,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          {/* Footer Strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 18,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: 14,
              color: "#94a3b8",
            }}
          >
            <div>eats.mapmyhyd.com</div>
            <div>The Curated Food Guide of Hyderabad</div>
          </div>
        </div>

        {/* Right: Venue Hero Photo Frame */}
        {hasImage ? (
          <div
            style={{
              flex: "0 0 35%",
              width: "35%",
              height: "100%",
              display: "flex",
              position: "relative",
              overflow: "hidden",
              borderLeft: "2px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Soft gradient wash over the image for brand blend */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, rgba(15,23,42,0.4) 0%, rgba(15,23,42,0) 60%)",
              }}
            />
          </div>
        ) : null}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    }
  );
}
