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
        : initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
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
  const app = await getApp();
  if (!app || !idToken) return null;
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth(app).verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}
