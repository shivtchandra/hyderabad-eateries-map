import { createHmac, timingSafeEqual } from "node:crypto";
export function cookieSecret() {
  if (process.env.RECOMMENDATION_COOKIE_SECRET) return process.env.RECOMMENDATION_COOKIE_SECRET;
  // Reuse server-only signing material when Firebase is already configured.
  try { const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}").private_key; if (key) return key; } catch {}
  return process.env.NODE_ENV !== "production" ? "hyderabad-local-preview-only" : null;
}
export function signVoter(id, secret) {
  return `${id}.${createHmac("sha256", secret).update(`recommendation-voter:${id}`).digest("hex")}`;
}
export function verifyVoter(value, secret) {
  if (!secret || typeof value !== "string") return null;
  const [id, signature] = value.split(".");
  if (!/^[a-f0-9-]{36}$/.test(id || "") || !/^[a-f0-9]{64}$/.test(signature || "")) return null;
  const expected = signVoter(id, secret).split(".")[1];
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex")) ? id : null;
}
