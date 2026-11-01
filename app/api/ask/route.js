import { getOpenAI, prepareAsk } from "../../../lib/askAiServer.js";
import { IN_HYD } from "../../../lib/eateryUtils.js";

export const dynamic = "force-dynamic";

const MAX_BODY = 24_000;
const MAX_MESSAGE = 400;
const PER_MIN = 10;
const PER_DAY = 150;

// Per-instance limiter: enough to stop a script draining the OpenAI budget.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const h = hits.get(ip) || { recent: [], day: 0, dayStart: now };
  if (now - h.dayStart > 86_400_000) Object.assign(h, { day: 0, dayStart: now });
  h.recent = h.recent.filter((t) => now - t < 60_000);
  hits.set(ip, h);
  if (h.recent.length >= PER_MIN || h.day >= PER_DAY) return true;
  h.recent.push(now);
  h.day += 1;
  return false;
}

const ids = (v) => (Array.isArray(v) ? v : []).filter((x) => typeof x === "string" && /^[\w-]{4,120}$/.test(x)).slice(0, 300);

const INJECTION = /\b(ignore (all |the )?(previous|above|prior) (instructions|rules)|system prompt|you are now|act as|jailbreak|developer mode|reveal your (rules|prompt|instructions))\b/i;
const SCOPE_REPLY = "I only help with food and drink in Hyderabad. Try asking about a craving, an area or a spot, like \"best haleem near Charminar\".";

const enc = new TextEncoder();
const sse = (obj) => enc.encode(`data: ${JSON.stringify(obj)}\n\n`);
const SSE_HEADERS = { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" };

function cannedStream(text) {
  return new Response(new ReadableStream({
    start(c) {
      c.enqueue(sse({ type: "meta", spots: [] }));
      c.enqueue(sse({ type: "delta", text }));
      c.enqueue(sse({ type: "done" }));
      c.close();
    },
  }), { headers: SSE_HEADERS });
}

export async function POST(req) {
  try {
    const openai = getOpenAI();
    if (!openai) return Response.json({ fallback: true, error: "not_configured" });

    const ip = req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "anon";
    if (limited(ip)) return Response.json({ fallback: true, error: "rate_limited" }, { status: 429 });

    const raw = await req.text();
    if (raw.length > MAX_BODY) return Response.json({ error: "too_large" }, { status: 413 });
    let body;
    try { body = JSON.parse(raw); } catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

    const message = String(body.message || "").replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE);
    if (!message) return Response.json({ error: "Message is required" }, { status: 400 });
    if (INJECTION.test(message)) return cannedStream(SCOPE_REPLY);

    const history = (Array.isArray(body.history) ? body.history : [])
      .filter((h) => h && typeof h.text === "string" && (h.from === "me" || h.from === "bot"))
      .slice(-6)
      .map((h) => ({ from: h.from, text: h.text.slice(0, 600) }));
    const lat = Number(body.userLoc?.lat), lng = Number(body.userLoc?.lng);
    const userLoc = Number.isFinite(lat) && Number.isFinite(lng) && IN_HYD(lat, lng) ? { lat, lng } : null;

    const { slots, system, spots } = await prepareAsk({
      message,
      history,
      userLoc,
      areaName: typeof body.areaName === "string" ? body.areaName.slice(0, 60) : null,
      savedSpots: ids(body.savedSpots),
      visitedSpots: ids(body.visitedSpots),
      exclude: ids(body.exclude).slice(0, 40),
    });

    const messages = [
      { role: "system", content: system },
      ...history.map((h) => ({ role: h.from === "me" ? "user" : "assistant", content: h.text })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create(
      { model: "gpt-4o-mini", messages, temperature: 0.3, max_tokens: 450, stream: true },
      { timeout: 20_000, maxRetries: 1, signal: req.signal },
    );

    return new Response(new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(sse({ type: "meta", spots, intent: slots.intent }));
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) controller.enqueue(sse({ type: "delta", text: delta.replace(/—/g, ",") }));
          }
          controller.enqueue(sse({ type: "done" }));
        } catch (err) {
          if (err?.name !== "AbortError") console.error("[api/ask] stream:", err?.message || err);
          try { controller.enqueue(sse({ type: "error" })); } catch {}
        } finally {
          try { controller.close(); } catch {}
        }
      },
      cancel() { stream.controller?.abort(); },
    }), { headers: SSE_HEADERS });
  } catch (err) {
    console.error("[api/ask]", err?.message || err);
    return Response.json({ fallback: true, error: "failed" }, { status: 500 });
  }
}
