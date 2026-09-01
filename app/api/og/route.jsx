import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "Hyderabad Eats").slice(0, 72);
  const subtitle = (searchParams.get("subtitle") || "Vote for the best food in Hyderabad").slice(0, 96);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f7f0e4 0%, #e8dcc8 55%, #ddd0bc 100%)",
          padding: 64,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: "#7c3aed", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20 }}>
          Hyderabad Eats
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, color: "#26305c", textAlign: "center", lineHeight: 1.1, maxWidth: 980 }}>
          {title}
        </div>
        <div style={{ fontSize: 26, color: "#4e5885", marginTop: 22, textAlign: "center", maxWidth: 900, lineHeight: 1.35 }}>
          {subtitle}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
