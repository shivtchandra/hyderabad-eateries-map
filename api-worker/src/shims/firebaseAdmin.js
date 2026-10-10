// Worker stand-in for lib/firebaseAdmin.js: same exports, backed by the
// Firestore REST client and a WebCrypto Firebase ID-token check.
import { Firestore } from "../firestore.js";
import { Bucket } from "../storage.js";

// Superset of the exports of every site's lib/firebaseAdmin.js.
let db = null;
let sa = null;
let initError = null;

export function parseServiceAccount(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  // Secrets copied from .env.local can keep their surrounding quotes.
  let s = String(raw).trim().replace(/^'([\s\S]*)'$/, "$1").replace(/^"(\{[\s\S]*\})"$/, "$1");
  let parsed = JSON.parse(s);
  if (typeof parsed === "string") parsed = JSON.parse(parsed);
  return parsed;
}
function serviceAccount() {
  if (!sa && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try { sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT); } catch (err) { initError = err?.message || "bad service account"; }
  }
  return sa;
}
export const firebaseAdminInitError = () => initError;

export async function getAdminDb() {
  if (db) return db;
  const account = serviceAccount();
  if (!account) return null;
  db = new Firestore(account);
  return db;
}

// Cloud Storage bucket for uploads, or null when not configured.
export async function getAdminBucket() {
  const account = serviceAccount();
  const name = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  return account && name ? new Bucket(account, name) : null;
}

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let jwks = null;
async function signingKey(kid) {
  if (!jwks || jwks.exp < Date.now() || !jwks.keys[kid]) {
    const res = await fetch(JWKS_URL, { cf: { cacheTtl: 3600 } });
    const { keys = [] } = await res.json();
    const imported = {};
    for (const k of keys) {
      imported[k.kid] = await crypto.subtle.importKey("jwk", k, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    }
    jwks = { keys: imported, exp: Date.now() + 3600_000 };
  }
  return jwks.keys[kid] || null;
}

const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

export async function verifyUid(idToken) {
  return (await verifyUidDetailed(idToken)).uid;
}

export async function verifyUidDetailed(idToken) {
  if (!idToken) return { uid: null, code: "no-token" };
  const pid = serviceAccount()?.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!pid) return { uid: null, code: "admin-unavailable" };
  try {
    const [h, p, s] = String(idToken).split(".");
    const header = JSON.parse(new TextDecoder().decode(fromB64url(h)));
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(p)));
    const key = header.alg === "RS256" ? await signingKey(header.kid) : null;
    if (!key) return { uid: null, code: "auth/argument-error" };
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, fromB64url(s), new TextEncoder().encode(`${h}.${p}`));
    const now = Date.now() / 1000;
    if (!ok) return { uid: null, code: "auth/invalid-id-token" };
    if (claims.aud !== pid || claims.iss !== `https://securetoken.google.com/${pid}`) return { uid: null, code: "auth/invalid-id-token" };
    if (!(claims.exp > now) || !(claims.iat <= now + 300)) return { uid: null, code: "auth/id-token-expired" };
    if (!claims.sub) return { uid: null, code: "auth/invalid-id-token" };
    return { uid: claims.sub, code: null, claims: { ...claims, uid: claims.sub } };
  } catch {
    return { uid: null, code: "verify-failed" };
  }
}

// firebase-admin Auth stand-in: only ID-token verification is supported.
export async function getAdminAuth() {
  return {
    async verifyIdToken(token) {
      const r = await verifyUidDetailed(token);
      if (!r.uid) { const e = new Error(r.code); e.code = r.code; throw e; }
      return r.claims;
    },
  };
}

let lastVerifyError = null;
export const lastIdTokenError = () => lastVerifyError;

/** Verify Firebase ID token from Authorization: Bearer <token>. Returns decoded claims or null. */
export async function verifyBearerIdToken(req) {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const r = await verifyUidDetailed(m[1].trim());
  lastVerifyError = r.code;
  return r.uid ? r.claims : null;
}
