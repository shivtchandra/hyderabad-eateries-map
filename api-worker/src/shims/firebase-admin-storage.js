// Stand-in for the "firebase-admin/storage" package inside the Worker.
export { Bucket } from "../storage.js";
export const getStorage = () => { throw new Error("use getAdminBucket()"); };
