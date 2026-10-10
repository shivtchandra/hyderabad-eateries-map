// Minimal Cloud Storage client (JSON API) with the slice of the firebase-admin
// bucket API the routes use: bucket.file(path).save(buffer, { contentType, metadata }).
import { accessToken } from "./firestore.js";

class StorageFile {
  constructor(bucket, path) { this.bucket = bucket; this.name = path; }
  async save(data, opts = {}) {
    const meta = { name: this.name, contentType: opts.contentType || "application/octet-stream" };
    if (opts.metadata?.cacheControl) meta.cacheControl = opts.metadata.cacheControl;
    if (opts.metadata?.metadata) meta.metadata = opts.metadata.metadata;
    const boundary = `b${crypto.randomUUID().replace(/-/g, "")}`;
    const enc = new TextEncoder();
    const head = enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${meta.contentType}\r\n\r\n`);
    const tail = enc.encode(`\r\n--${boundary}--\r\n`);
    const bytes = typeof data === "string" ? enc.encode(data) : new Uint8Array(data.buffer ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data);
    const body = new Uint8Array(head.length + bytes.length + tail.length);
    body.set(head, 0); body.set(bytes, head.length); body.set(tail, head.length + bytes.length);
    const res = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(this.bucket.name)}/o?uploadType=multipart`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken(this.bucket._sa)}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!res.ok) throw new Error(`storage ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

export class Bucket {
  constructor(serviceAccount, name) { this._sa = serviceAccount; this.name = name; }
  file(path) { return new StorageFile(this, path); }
}
