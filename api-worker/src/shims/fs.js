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
export const promises = { readFile: async (p) => readFileSync(p) };
export default { readFileSync, existsSync, readdirSync, promises };
