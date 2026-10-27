import { verifiedOffers } from "../../../lib/offers.js";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const spotId = searchParams.get("id");

    const filePath = path.join(process.cwd(), "data", "curated-offers.json");
    const historyPath = path.join(process.cwd(), "data", "offer-history.json");
    if (!fs.existsSync(filePath)) {
      return Response.json({ updatedAt: null, spots: {} });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const history = fs.existsSync(historyPath)
      ? JSON.parse(fs.readFileSync(historyPath, "utf-8"))
      : { version: 1, retentionDays: 28, updatedAt: null, spots: {} };

    if (spotId) {
      const spotOffers = verifiedOffers(data.spots?.[spotId]);
      return Response.json(
        { spotId, offers: spotOffers, history: history.spots?.[spotId] || {}, updatedAt: data.updatedAt },
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
    return Response.json({ ...data, spots, history, totalSpotsWithOffers: Object.keys(spots).length }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return Response.json({ error: "Failed to load offers", details: err.message }, { status: 500 });
  }
}
