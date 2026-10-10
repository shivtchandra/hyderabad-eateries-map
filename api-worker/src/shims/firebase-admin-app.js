// Stand-in for "firebase-admin/app" inside the Worker (Firestore is REST-backed; no app objects).
export const getApps = () => [{ name: "[DEFAULT]" }];
export const getApp = () => ({ name: "[DEFAULT]" });
export const initializeApp = (_opts, name = "[DEFAULT]") => ({ name });
export const cert = (sa) => sa;
