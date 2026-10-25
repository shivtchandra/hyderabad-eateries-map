import { voterHash, voteTarget } from "./recommendationVotes.js";
import { isSpecificDishRecommendation, normalize } from "./recommendationShared.js";

// "What's good here?": people add (or +1) a must-try dish at a recommended place.
// A dish goes public once PUBLIC_AT different browsers have added it; before that only
// the person who added it sees it. Firestore:
//   recommendation_dishes/{placeId}          { dishes: { [key]: { name, count } } }
//   recommendation_dish_adds/{voter_place}   { placeId, keys: { [key]: true } }
//   recommendation_dish_voters/{voter}       { windowAt, writes, day, dayCount }
//   recommendation_dishes_public/summary     { places: { [placeId]: [{ name, count }] } }
export const PUBLIC_AT = 2;
export const DAY_LIMIT = 20;
export const MINUTE_LIMIT = 30;
const MAX_PER_PLACE = 30;
const SUMMARY_PER_PLACE = 5;
const BLOCK = /(fuck|shit|bitch|porn|nigg|madarchod|bhenchod|behenchod|chutiya|gandu|randi|lund\b|\bsex\b)/i;

export const dishKey = (name) => normalize(name).slice(0, 40);

export function cleanDishName(raw) {
  const name = String(raw || "").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 40) return null;
  if (!/^\p{L}[\p{L}\s&'’./-]*$/u.test(name)) return null;
  if (/https?:|www\.|\.com\b/i.test(name) || BLOCK.test(name)) return null;
  if (!isSpecificDishRecommendation(name)) return null;
  return name[0].toUpperCase() + name.slice(1);
}

// Top public dishes for one place, from its stored counts.
export function publicDishes(dishes = {}) {
  return Object.values(dishes).filter((d) => d.count >= PUBLIC_AT && isSpecificDishRecommendation(d.name))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, SUMMARY_PER_PLACE).map(({ name, count }) => ({ name, count }));
}

// Dishes one visitor should see at a place: public ones plus their own pending adds.
export function visibleDishes(dishes = {}, mineKeys = new Set()) {
  return Object.entries(dishes)
    .filter(([k, d]) => isSpecificDishRecommendation(d.name) && (d.count >= PUBLIC_AT || (mineKeys.has(k) && d.count > 0)))
    .map(([k, d]) => ({ name: d.name, count: d.count, public: d.count >= PUBLIC_AT, mine: mineKeys.has(k) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// One doc per visitor per place holds every dish they added there.
export const dishAddRef = (db, voter, placeId) => db.collection("recommendation_dish_adds").doc(`${voterHash(voter).slice(0, 32)}_${voteTarget(placeId).slice(0, 32)}`);

// add=true adds this visitor's +1, add=false takes it back. Idempotent per visitor.
export async function writeDishAdd(db, { voter, placeId, name, add = true, now = Date.now() }) {
  const clean = cleanDishName(name);
  if (!clean) throw Object.assign(new Error("Use a dish name, like Mutton biryani."), { status: 400 });
  const key = dishKey(clean);
  const placeRef = db.collection("recommendation_dishes").doc(placeId);
  const addRef = dishAddRef(db, voter, placeId);
  const userRef = db.collection("recommendation_dish_voters").doc(voterHash(voter));
  const summaryRef = db.collection("recommendation_dishes_public").doc("summary");
  return db.runTransaction(async (tx) => {
    const [placeDoc, addDoc, userDoc, summaryDoc] = await Promise.all([tx.get(placeRef), tx.get(addRef), tx.get(userRef), tx.get(summaryRef)]);
    const dishes = { ...((placeDoc.exists && placeDoc.data().dishes) || {}) };
    const keys = { ...((addDoc.exists && addDoc.data().keys) || {}) };
    const had = !!keys[key];
    const result = () => { const d = dishes[key] || { name: clean, count: 0 }; return { name: d.name, count: d.count, public: d.count >= PUBLIC_AT, mine: add }; };
    if (had === add) return { ...result(), unchanged: true };
    const rate = userDoc.exists ? userDoc.data() : {};
    const fresh = !rate.windowAt || now - rate.windowAt >= 60_000;
    const day = new Date(now).toISOString().slice(0, 10);
    const dayCount = rate.day === day ? rate.dayCount || 0 : 0;
    if (add && dayCount >= DAY_LIMIT) throw Object.assign(new Error("That's plenty for today. Come back tomorrow."), { status: 429 });
    if (!fresh && rate.writes >= MINUTE_LIMIT) throw Object.assign(new Error("Please wait a minute and try again."), { status: 429 });
    if (add && !dishes[key] && Object.keys(dishes).length >= MAX_PER_PLACE) throw Object.assign(new Error("This place has enough dishes listed. Add a +1 instead."), { status: 409 });
    const cur = dishes[key] || { name: clean, count: 0 };
    dishes[key] = { name: cur.name, count: Math.max(0, cur.count + (add ? 1 : -1)) };
    const places = { ...((summaryDoc.exists && summaryDoc.data().places) || {}) };
    const top = publicDishes(dishes);
    const summaryChanged = JSON.stringify(places[placeId] || []) !== JSON.stringify(top);
    if (top.length) places[placeId] = top; else delete places[placeId];
    tx.set(placeRef, { dishes, updatedAt: now });
    if (add) keys[key] = true; else delete keys[key];
    tx.set(addRef, { placeId, keys, updatedAt: now });
    tx.set(userRef, { windowAt: fresh ? now : rate.windowAt, writes: fresh ? 1 : rate.writes + 1, day, dayCount: add ? dayCount + 1 : dayCount });
    if (summaryChanged) { tx.set(summaryRef, { places, updatedAt: now }); memo = null; }
    return result();
  });
}

// One read per minute per server instance for the whole list (no Vercel cache, plan limits).
let memo = null;
export async function getPublicDishSummary(db, now = Date.now()) {
  if (memo && now - memo.at < 60_000) return memo.value;
  let value = {};
  try {
    const doc = await db.collection("recommendation_dishes_public").doc("summary").get();
    const places = (doc.exists && doc.data().places) || {};
    value = Object.fromEntries(Object.entries(places)
      .map(([id, dishes]) => [id, (dishes || []).filter((dish) => isSpecificDishRecommendation(dish.name))])
      .filter(([, dishes]) => dishes.length));
  } catch {}
  memo = { at: now, value };
  return value;
}
export const clearPublicDishSummary = () => { memo = null; };
