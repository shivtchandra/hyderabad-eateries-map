// Secrets copied from .env.local can keep its surrounding quotes.
const unquote = (v) => v.trim().replace(/^'([\s\S]*)'$/, "$1").replace(/^"(\{[\s\S]*\})"$/, "$1");

let cachedApp = null;
let initFailed = false;

async function getApp() {
  if (initFailed) return null;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return null;
  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    if (!cachedApp) {
      cachedApp = getApps().length
        ? getApps()[0]
        : initializeApp({ credential: cert(JSON.parse(unquote(process.env.FIREBASE_SERVICE_ACCOUNT))) });
    }
    return cachedApp;
  } catch (err) {
    initFailed = true;
    console.error("[firebaseAdmin] init failed:", err?.message || err);
    return null;
  }
}

export async function getAdminDb() {
  const app = await getApp();
  if (!app) return null;
  try {
    const { getFirestore } = await import("firebase-admin/firestore");
    return getFirestore(app);
  } catch (err) {
    console.error("[firebaseAdmin] getFirestore failed:", err?.message || err);
    return null;
  }
}

// Verifies a client's Firebase ID token and returns its uid, or null.
// The leaderboard trusts the uid only after this check; a raw uid in the
// request body could be forged; a signed token cannot.
export async function verifyUid(idToken) {
  return (await verifyUidDetailed(idToken)).uid;
}

// Same check, but also says WHY a token was rejected (Firebase error code, never the token
// or credentials) so a failing claim can be diagnosed from the response and the Vercel logs.
export async function verifyUidDetailed(idToken) {
  if (!idToken) return { uid: null, code: "no-token" };
  const app = await getApp();
  if (!app) return { uid: null, code: "admin-unavailable" };
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth(app).verifyIdToken(idToken);
    return { uid: decoded.uid, code: null };
  } catch (err) {
    const code = err?.code || err?.errorInfo?.code || "verify-failed";
    console.error("[firebaseAdmin] verifyIdToken failed:", code, (err?.message || "").slice(0, 300));
    return { uid: null, code, hint: (err?.message || "").split(" See https")[0].slice(0, 160) };
  }
}
