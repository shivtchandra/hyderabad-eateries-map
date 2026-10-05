/**
 * Collect recent r/hyderabad food threads + every comment, via Reddit's official API
 * (application-only OAuth, read-only). Raw dump feeds scripts/reddit-picks.mjs.
 *
 * Needs REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET (in .env.local or the environment).
 * Run:  node scripts/reddit-collect.mjs            → data/reddit/raw.json (gitignored)
 *       MONTHS=18 TOPIC_LIMIT=3 node scripts/reddit-collect.mjs   (quick sample)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "data", "reddit");
const MONTHS = Number(process.env.MONTHS || 18);
const TOPIC_LIMIT = Number(process.env.TOPIC_LIMIT || Infinity);
const UA = "web:mapping-hyd-research:0.1 (by /u/EveningTarget3419)";
const CUTOFF = Date.now() / 1000 - MONTHS * 30.4 * 86400;

// Credentials: environment first, then .env.local.
function env(key) {
  if (process.env[key]) return process.env[key];
  try {
    const line = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n").find((l) => l.startsWith(key + "="));
    return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
  } catch { return ""; }
}

// Dishes, cuisines and generic "where to eat" asks. Each is one search on r/hyderabad.
const TOPICS = [
  "biryani", "mutton biryani", "chicken biryani", "haleem", "mandi", "irani chai", "osmania biscuit", "bun maska",
  "dosa", "idli", "tiffin", "breakfast", "andhra meals", "telugu food", "thali", "pulao", "kebab", "tandoori",
  "shawarma", "paya nihari", "street food", "chaat", "pani puri", "momos", "chinese food", "pizza", "burger",
  "pasta italian", "sushi", "korean food", "thai food", "arabian food", "north indian", "south indian", "kerala food",
  "seafood fish", "bakery", "cake", "dessert", "ice cream", "coffee cafe", "brunch", "late night food", "veg restaurant",
  "fine dining", "brewery pub", "food recommendations", "where to eat", "restaurant suggestions", "underrated restaurant",
  "hidden gem food", "must try food hyderabad",
  // world food + niche
  "sushi", "ramen", "japanese restaurant", "korean restaurant", "korean bbq", "thai restaurant", "vietnamese pho", "dimsum",
  "pan asian", "mexican tacos", "burrito", "lebanese", "turkish food", "mediterranean", "greek food", "kunafa baklava",
  "steak", "bbq grill", "waffles pancakes", "croissant", "sourdough bread", "bubble tea boba", "matcha", "specialty coffee",
  "filter coffee", "cheesecake", "donuts", "gelato", "crepes", "salad healthy food", "vegan food", "buffet", "cocktail bar",
  "kebab", "nihari", "paya", "chinese restaurant", "momos", "falooda", "kulfi", "lassi", "fried chicken", "wings",
].slice(0, TOPIC_LIMIT);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let token = null;
async function auth() {
  const id = env("REDDIT_CLIENT_ID"), secret = env("REDDIT_CLIENT_SECRET");
  if (!id || !secret) throw new Error("Missing REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET");
  const r = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
    body: "grant_type=client_credentials",
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("Reddit auth failed: " + JSON.stringify(j));
  token = j.access_token;
}
async function api(pathAndQuery) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch("https://oauth.reddit.com" + pathAndQuery, { headers: { Authorization: `Bearer ${token}`, "User-Agent": UA } });
    if (r.status === 401) { await auth(); continue; }
    if (r.status === 429) { await sleep(15000 * (attempt + 1)); continue; }
    const remaining = Number(r.headers.get("x-ratelimit-remaining") || 100);
    if (remaining < 5) await sleep(Number(r.headers.get("x-ratelimit-reset") || 60) * 1000);
    if (!r.ok) return null;
    return r.json();
  }
  return null;
}

function flatten(children, postId, out, depth = 0) {
  for (const c of children || []) {
    if (c.kind !== "t1") continue;
    const d = c.data;
    out.push({
      id: d.id, post: postId, author: d.author, body: d.body || "", score: d.score ?? 0,
      created: d.created_utc, permalink: "https://www.reddit.com" + d.permalink, topLevel: depth === 0,
    });
    if (d.replies && d.replies.data) flatten(d.replies.data.children, postId, out, depth + 1);
  }
}

await auth();
// Resume: progress is checkpointed so a stopped run never loses what it already read.
const CKPT = path.join(OUT_DIR, "raw-partial.json");
fs.mkdirSync(OUT_DIR, { recursive: true });
const RAW = path.join(OUT_DIR, "raw.json");
let prev = fs.existsSync(CKPT) ? JSON.parse(fs.readFileSync(CKPT, "utf8")) : null;
if (!prev && fs.existsSync(RAW)) {
  const r = JSON.parse(fs.readFileSync(RAW, "utf8"));
  prev = { posts: r.posts, comments: r.comments, done: r.posts.map((x) => x.id) };
}
const posts = new Map((prev?.posts || []).map((p) => [p.id, p]));
const comments = prev?.comments || [];
const done = new Set(prev?.done || []);
const save = () => fs.writeFileSync(CKPT, JSON.stringify({ posts: [...posts.values()], comments, done: [...done] }));
const MIN_COMMENTS = Number(process.env.MIN_COMMENTS || 10);
for (const [i, q] of TOPICS.entries()) {
  const j = await api(`/r/hyderabad/search?q=${encodeURIComponent(q)}&restrict_sr=1&sort=relevance&t=all&limit=100&raw_json=1`);
  let kept = 0;
  for (const c of j?.data?.children || []) {
    const p = c.data;
    if (p.created_utc < CUTOFF || p.num_comments < MIN_COMMENTS || posts.has(p.id)) continue;
    posts.set(p.id, { id: p.id, title: p.title, body: p.selftext || "", author: p.author, score: p.score, created: p.created_utc,
      comments: p.num_comments, permalink: "https://www.reddit.com" + p.permalink, topics: [q] });
    kept++;
  }
  for (const c of j?.data?.children || []) if (posts.has(c.data.id) && !posts.get(c.data.id).topics.includes(q)) posts.get(c.data.id).topics.push(q);
  console.log(`[${i + 1}/${TOPICS.length}] "${q}": +${kept} threads (total ${posts.size})`);
  await sleep(400);
}
save();
console.log(`resume: ${done.size}/${posts.size} threads already read, ${comments.length} comments`);

let n = 0;
for (const p of posts.values()) {
  n++;
  if (done.has(p.id)) continue;
  const j = await api(`/comments/${p.id}?limit=500&depth=10&sort=top&raw_json=1`);
  const before = comments.length;
  if (Array.isArray(j)) flatten(j[1]?.data?.children, p.id, comments);
  done.add(p.id);
  if (n % 25 === 0) save();
  if (n % 20 === 0) console.log(`  comments: ${n}/${posts.size} threads, ${comments.length} comments (+${comments.length - before})`);
  await sleep(350);
}
save();
fs.writeFileSync(path.join(OUT_DIR, "raw.json"), JSON.stringify({ fetchedAt: new Date().toISOString(), months: MONTHS, posts: [...posts.values()], comments }));
fs.rmSync(CKPT, { force: true });
console.log(`\nDone: ${posts.size} threads, ${comments.length} comments → data/reddit/raw.json`);
