import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

// Never prerender: this route has side effects (scrapes + writes Firestore).
// Without this Next executes it during `next build`.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;

const OFFER_PATTERNS = [
  /\d+%\s*off[^.,"'\n]*/gi,
  /flat\s*₹?\s*\d+\s*off[^.,"'\n]*/gi,
  /bogo[^.,"'\n]*/gi,
  /buy\s+\d+\s+get\s+\d+[^.,"'\n]*/gi,
  /free\s+delivery[^.,"'\n]*/gi,
  /upto?\s*₹?\s*\d+\s*off[^.,"'\n]*/gi,
];

function extractOffers(markdown) {
  const found = new Set();
  for (const pat of OFFER_PATTERNS) {
    const matches = markdown.match(pat) ?? [];
    for (const m of matches) {
      const clean = m.trim().replace(/\s+/g, " ").slice(0, 80);
      if (clean.length > 5) found.add(clean);
    }
  }
  return [...found].slice(0, 5);
}

async function scrapeZomato(url) {
  if (!FIRECRAWL_KEY) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.markdown ?? null;
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function authOk(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  // Vercel's native Cron Jobs call with `Authorization: Bearer <CRON_SECRET>`
  // automatically once the env var is set, no custom header needed.
  return req.headers.get("Authorization") === `Bearer ${secret}`;
}

export async function GET(req) {
  if (!authOk(req)) return Response.json({ error: "forbidden" }, { status: 403 });

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "Firestore not configured" }, { status: 500 });

  const snap = await db.collection("eateries")
    .where("status", "==", "approved")
    .get();

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.zomatoUrl) continue;

    const markdown = await scrapeZomato(data.zomatoUrl);
    if (markdown) {
      const offers = extractOffers(markdown);
      await doc.ref.update({ offers, offersUpdatedAt: new Date().toISOString() });
      updated++;
    }

    await sleep(1000); // 1 req/sec
  }

  return Response.json({ updated, total: snap.size });
}
