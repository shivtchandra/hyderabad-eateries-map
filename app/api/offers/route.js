import { verifiedOffers } from "../../../lib/offers.js";
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
      const spotOffers = verifiedOffers(data.spots?.[spotId]);
      return Response.json(
        { spotId, offers: spotOffers, updatedAt: data.updatedAt },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const spots = Object.fromEntries(
      Object.entries(data.spots || {}).map(([id, e]) => [id, verifiedOffers(e)]).filter(([, e]) => e)
    );
    return Response.json({ ...data, spots, totalSpotsWithOffers: Object.keys(spots).length }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return Response.json({ error: "Failed to load offers", details: err.message }, { status: 500 });
  }
}
