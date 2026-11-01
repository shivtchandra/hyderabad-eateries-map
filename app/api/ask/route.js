import { getOpenAI, findCandidates, formatCandidatesContext, SYSTEM_PROMPT } from "../../../lib/askAiServer.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const openai = getOpenAI();
    if (!openai) {
      return Response.json({ fallback: true, error: "OpenAI not configured" }, { status: 200 });
    }

    const body = await req.json();
    const {
      message = "",
      history = [],
      userLoc = null,
      areaName = null,
      rankBySpot = {},
      picksMap = {},
      savedSpots = [],
      visitedSpots = []
    } = body;

    const trimmed = String(message).trim();
    if (!trimmed) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Extract prior user message so follow-ups ("cheaper", "closer", "open now") preserve the craving / venue type
    const priorUserMsgs = (history || [])
      .filter((h) => (h.from === "me" || h.role === "user") && h.text)
      .map((h) => h.text);

    const isFollowUp = priorUserMsgs.length > 0 && (
      /^(what about|which of these|closer|cheaper|open now|budget|more|any other|for this|something else|why|how about)/i.test(trimmed)
      || !/\b(biryani|chai|cafe|coffee|mandi|shawarma|tiffin|dosa|breakfast|veg|bhojanam)\b/i.test(trimmed)
    );

    const contextualQuery = isFollowUp && priorUserMsgs.length > 0
      ? `${priorUserMsgs[priorUserMsgs.length - 1]} ${trimmed}`
      : trimmed;

    // Fast candidate matching with community rankings, editorial picks, and user preferences (< 15ms)
    const candidates = findCandidates(contextualQuery, {
      userLoc,
      areaName,
      rankBySpot,
      picksMap,
      savedSpots,
      visitedSpots,
      limit: 12
    });
    const candidateContext = formatCandidatesContext(candidates);

    const spots = candidates.map((c) => ({
      id: c.e.id,
      name: c.e.name,
      area: c.e.discoveredIn || "Hyderabad",
      distKm: c.dist,
      distLabel: c.dist != null ? (c.dist < 1 ? `${Math.round(c.dist * 1000)} m` : `${c.dist.toFixed(1)} km`) : null,
      rating: c.e.rating,
      ratingCount: c.e.ratingCount,
      why: [
        c.topRank ? `#${c.topRank.rank} ${c.topRank.title} by locals` : null,
        c.editorialPick ? (c.editorialPick.dishes?.length ? `Our pick: ${c.editorialPick.dishes.map((d) => (typeof d === "string" ? d : d.name)).slice(0, 2).join(", ")}` : "Our pick") : null,
        c.isSaved ? "You saved this" : (c.isVisited ? "You've been here" : null),
        c.rp?.locals ? `${c.rp.locals} r/hyderabad locals recommend` : null,
        c.brandInfo?.locals ? `${c.brandInfo.locals} locals recommend` : null,
        c.localDishes?.length ? `Locals love: ${c.localDishes.slice(0, 2).map((d) => d.name || d.dish).join(", ")}` : null,
        c.e.rating ? `${c.e.rating}★ (${Number(c.e.ratingCount || 0).toLocaleString("en-IN")} reviews)` : null
      ].filter(Boolean),
      safety: c.inspection?.verified ? "Food safety: verified record" : null,
      band: c.topRank ? 0 : (c.editorialPick ? 1 : (c.isSaved || c.isVisited ? 2 : (c.rp ? 0 : 3)))
    }));

    // Build context
    const locationContext = userLoc
      ? `User is near: ${areaName || "lat " + userLoc.lat.toFixed(3) + ", lng " + userLoc.lng.toFixed(3)}.`
      : (areaName ? `User is asking about area: ${areaName}.` : "User location is not currently shared.");

    const messages = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n${locationContext}\n\nCANDIDATE EATERIES FROM DATABASE:\n${candidateContext}`
      },
      ...history
        .slice(-4)
        .filter((h) => h.text)
        .map((h) => ({
          role: h.from === "me" ? "user" : "assistant",
          content: h.text
        })),
      {
        role: "user",
        content: trimmed
      }
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6,
      max_tokens: 500,
      stream: true
    });

    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata event with candidate spots
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "meta", spots })}\n\n`));

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: delta })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch (err) {
          console.error("[api/ask] Stream error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });
  } catch (err) {
    console.error("[api/ask] Error:", err);
    return Response.json({ fallback: true, error: err.message }, { status: 500 });
  }
}
