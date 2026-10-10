// Read-only stand-in for "fs" inside the Worker. The site's libs read their
// JSON from data/ with readFileSync; build.mjs embeds those files (eateries.json
// trimmed to the fields the API uses) and lookups match on the file name.
import files from "../data.gen.js";

function find(p) {
  const name = String(p).split(/[\\/]/).pop();
  return Object.prototype.hasOwnProperty.call(files, name) ? files[name] : undefined;
}
export function readFileSync(p) {
  const v = find(p);
  if (v === undefined) {
    const err = new Error(`ENOENT: no such file, open '${p}'`);
    err.code = "ENOENT";
    throw err;
  }
  return v;
}
export const existsSync = (p) => find(p) !== undefined;
export const readdirSync = () => [];
// The Worker has no writable disk; routes only write files when Firestore is missing.
const readOnly = () => { const e = new Error("EROFS: read-only file system"); e.code = "EROFS"; throw e; };
export const writeFileSync = readOnly;
export const mkdirSync = readOnly;
export const appendFileSync = readOnly;
export const promises = { readFile: async (p) => readFileSync(p) };
export default { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync, appendFileSync, promises };
