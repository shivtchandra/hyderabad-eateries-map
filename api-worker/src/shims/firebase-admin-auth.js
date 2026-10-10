// Stand-in for "firebase-admin/auth" inside the Worker: ID-token verification only.
import { getAdminAuth } from "./firebaseAdmin.js";
let auth = null;
getAdminAuth().then((a) => { auth = a; });
export const getAuth = () => ({ verifyIdToken: (t) => (auth ? auth.verifyIdToken(t) : getAdminAuth().then((a) => a.verifyIdToken(t))) });
