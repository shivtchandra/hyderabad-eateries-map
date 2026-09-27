import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const spotId = searchParams.get("id");

    const filePath = path.join(process.cwd(), "data", "curated-offers.json");
    if (!fs.existsSync(filePath)) {
      return Response.json({ updatedAt: null, spots: {} });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (spotId) {
      const spotOffers = data.spots?.[spotId] || null;
      return Response.json(
        { spotId, offers: spotOffers, updatedAt: data.updatedAt },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }

    return Response.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    return Response.json({ error: "Failed to load offers", details: err.message }, { status: 500 });
  }
}
