// Stand-in for the "firebase-admin/firestore" package inside the Worker.
export { FieldValue, Timestamp } from "../firestore.js";
import { getAdminDb } from "./firebaseAdmin.js";
export const getFirestore = () => { throw new Error("use getAdminDb()"); };
export { getAdminDb };
