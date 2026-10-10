// Minimal Firestore client over the REST API with the slice of the
// firebase-admin surface the API routes use (doc/collection refs, where /
// orderBy / limit / count queries, getAll, batches, transactions and the
// FieldValue sentinels). firebase-admin itself needs gRPC and Node APIs that
// Cloudflare Workers don't have.

const SCOPE = "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform";

// ---------- auth: service-account JWT -> OAuth access token (cached per isolate)

let tokenCache = null;

function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const b64urlJson = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));

async function importPrivateKey(pem) {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

export async function accessToken(sa) {
  if (tokenCache && tokenCache.exp - 300 > Date.now() / 1000) return tokenCache.token;
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64urlJson({ alg: "RS256", typ: "JWT" })}.${b64urlJson({
    iss: sa.client_email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  })}`;
  const key = await importPrivateKey(sa.private_key);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${b64url(sig)}`,
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const d = await res.json();
  tokenCache = { token: d.access_token, exp: now + (d.expires_in || 3600) };
  return tokenCache.token;
}

// ---------- values

export class Timestamp {
  constructor(seconds, nanoseconds = 0) { this._seconds = seconds; this._nanoseconds = nanoseconds; }
  get seconds() { return this._seconds; }
  get nanoseconds() { return this._nanoseconds; }
  toMillis() { return this._seconds * 1000 + Math.floor(this._nanoseconds / 1e6); }
  toDate() { return new Date(this.toMillis()); }
  isEqual(o) { return o instanceof Timestamp && o._seconds === this._seconds && o._nanoseconds === this._nanoseconds; }
  valueOf() { return String(this.toMillis()).padStart(20, "0"); }
  static now() { return Timestamp.fromMillis(Date.now()); }
  static fromDate(d) { return Timestamp.fromMillis(d.getTime()); }
  static fromMillis(ms) { return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6); }
}

class Sentinel { constructor(kind, value) { this.kind = kind; this.value = value; } }
export const FieldValue = {
  increment: (n) => new Sentinel("increment", n),
  serverTimestamp: () => new Sentinel("serverTimestamp"),
  arrayUnion: (...v) => new Sentinel("arrayUnion", v),
  arrayRemove: (...v) => new Sentinel("arrayRemove", v),
  delete: () => new Sentinel("delete"),
};

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)
  && !(v instanceof Timestamp) && !(v instanceof Sentinel) && !(v instanceof DocumentReference);

function encode(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (v instanceof Timestamp) return { timestampValue: v.toDate().toISOString() };
  if (v instanceof DocumentReference) return { referenceValue: v._name };
  if (Array.isArray(v)) return { arrayValue: { values: v.filter((x) => x !== undefined).map(encode) } };
  if (typeof v === "object") return { mapValue: { fields: encodeFields(v) } };
  return { stringValue: String(v) };
}
function encodeFields(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && !(v instanceof Sentinel)) out[k] = encode(v);
  return out;
}

function decode(v, db) {
  if ("nullValue" in v) return null;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("stringValue" in v) return v.stringValue;
  if ("timestampValue" in v) {
    const ms = Date.parse(v.timestampValue);
    const frac = /\.(\d+)Z$/.exec(v.timestampValue)?.[1] || "";
    return new Timestamp(Math.floor(ms / 1000), Number(frac.padEnd(9, "0").slice(0, 9)));
  }
  if ("referenceValue" in v) return db ? db._refFromName(v.referenceValue) : v.referenceValue;
  if ("geoPointValue" in v) return { latitude: v.geoPointValue.latitude || 0, longitude: v.geoPointValue.longitude || 0 };
  if ("bytesValue" in v) return v.bytesValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map((x) => decode(x, db));
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {}, db);
  return null;
}
function decodeFields(fields, db) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = decode(v, db);
  return out;
}

const quoteSegment = (s) => (/^[A-Za-z_][A-Za-z_0-9]*$/.test(s) ? s : "`" + s.replace(/\\/g, "\\\\").replace(/`/g, "\\`") + "`");
const fieldPath = (dotted) => dotted.split(".").map(quoteSegment).join(".");

// Leaf paths for merge-set; sentinels become transforms.
function collect(obj, prefix, mask, transforms, { leaves }) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const path = prefix ? `${prefix}.${quoteSegment(k)}` : quoteSegment(k);
    if (v instanceof Sentinel) {
      if (v.kind === "delete") mask.push(path);
      else transforms.push(transform(path, v));
    } else if (leaves && isPlainObject(v) && Object.keys(v).length) {
      collect(v, path, mask, transforms, { leaves });
    } else mask.push(path);
  }
}
function transform(path, s) {
  if (s.kind === "increment") return { fieldPath: path, increment: encode(s.value) };
  if (s.kind === "serverTimestamp") return { fieldPath: path, setToServerValue: "REQUEST_TIME" };
  if (s.kind === "arrayUnion") return { fieldPath: path, appendMissingElements: { values: s.value.map(encode) } };
  if (s.kind === "arrayRemove") return { fieldPath: path, removeAllFromArray: { values: s.value.map(encode) } };
  throw new Error(`unsupported sentinel ${s.kind}`);
}
// Nested object from dotted update keys ("a.b": 1 -> {a:{b:1}}), skipping sentinels.
function expandDotted(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v instanceof Sentinel) continue;
    const parts = k.split(".");
    let o = out;
    for (const p of parts.slice(0, -1)) o = o[p] && isPlainObject(o[p]) ? o[p] : (o[p] = {});
    o[parts.at(-1)] = v;
  }
  return out;
}

function setWrite(ref, data, opts = {}) {
  const mask = [], transforms = [];
  if (opts.merge) collect(data, "", mask, transforms, { leaves: true });
  else for (const [k, v] of Object.entries(data)) if (v instanceof Sentinel && v.kind !== "delete") transforms.push(transform(quoteSegment(k), v));
  const w = { update: { name: ref._name, fields: encodeFields(stripSentinels(data)) } };
  if (opts.merge) w.updateMask = { fieldPaths: mask };
  if (transforms.length) w.updateTransforms = transforms;
  return w;
}
function stripSentinels(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Sentinel || v === undefined) continue;
    out[k] = isPlainObject(v) ? stripSentinels(v) : v;
  }
  return out;
}
function updateWrite(ref, data) {
  const mask = [], transforms = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    const path = fieldPath(k);
    if (v instanceof Sentinel) { if (v.kind === "delete") mask.push(path); else transforms.push(transform(path, v)); }
    else mask.push(path);
  }
  const w = { update: { name: ref._name, fields: encodeFields(stripSentinels(expandDotted(data))) }, updateMask: { fieldPaths: mask }, currentDocument: { exists: true } };
  if (transforms.length) w.updateTransforms = transforms;
  return w;
}

// ---------- refs, snapshots, queries

const randomId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const b = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(b, (x) => chars[x % chars.length]).join("");
};

class DocumentSnapshot {
  constructor(ref, doc, db) {
    this.ref = ref; this.id = ref.id; this.exists = !!doc;
    this._data = doc ? decodeFields(doc.fields, db) : undefined;
    this.createTime = doc?.createTime; this.updateTime = doc?.updateTime;
  }
  data() { return this._data; }
  get(path) { return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), this._data); }
}

class QuerySnapshot {
  constructor(docs) { this.docs = docs; this.size = docs.length; this.empty = docs.length === 0; }
  forEach(fn) { this.docs.forEach(fn); }
}

class DocumentReference {
  constructor(db, path) { this._db = db; this.path = path; this.id = path.split("/").at(-1); this._name = `${db._root}/${path}`; }
  get parent() { return new CollectionReference(this._db, this.path.split("/").slice(0, -1).join("/")); }
  collection(id) { return new CollectionReference(this._db, `${this.path}/${id}`); }
  async get() { return this._db._getDoc(this); }
  set(data, opts) { return this._db._commit([setWrite(this, data, opts)]); }
  update(data) { return this._db._commit([updateWrite(this, data)]); }
  delete() { return this._db._commit([{ delete: this._name }]); }
  create(data) { const w = setWrite(this, data); w.currentDocument = { exists: false }; return this._db._commit([w]); }
}

const OPS = { "==": "EQUAL", "!=": "NOT_EQUAL", "<": "LESS_THAN", "<=": "LESS_THAN_OR_EQUAL", ">": "GREATER_THAN", ">=": "GREATER_THAN_OR_EQUAL",
  "array-contains": "ARRAY_CONTAINS", in: "IN", "not-in": "NOT_IN", "array-contains-any": "ARRAY_CONTAINS_ANY" };

class Query {
  constructor(db, collPath, q = {}) { this._db = db; this._collPath = collPath; this._q = { where: [], orderBy: [], ...q }; }
  _with(patch) { return new Query(this._db, this._collPath, { ...this._q, ...patch }); }
  where(field, op, value) {
    if (!OPS[op]) throw new Error(`unsupported op ${op}`);
    return this._with({ where: [...this._q.where, { fieldFilter: { field: { fieldPath: fieldPath(field) }, op: OPS[op], value: encode(value) } }] });
  }
  orderBy(field, dir = "asc") { return this._with({ orderBy: [...this._q.orderBy, { field: { fieldPath: fieldPath(field) }, direction: dir === "desc" ? "DESCENDING" : "ASCENDING" }] }); }
  limit(n) { return this._with({ limit: n }); }
  offset(n) { return this._with({ offset: n }); }
  select(...fields) { return this._with({ select: { fields: fields.map((f) => ({ fieldPath: fieldPath(f) })) } }); }
  _structured() {
    const parts = this._collPath.split("/");
    const sq = { from: [{ collectionId: parts.at(-1) }] };
    if (this._q.where.length === 1) sq.where = this._q.where[0];
    else if (this._q.where.length > 1) sq.where = { compositeFilter: { op: "AND", filters: this._q.where } };
    if (this._q.orderBy.length) sq.orderBy = this._q.orderBy;
    if (this._q.limit != null) sq.limit = this._q.limit;
    if (this._q.offset != null) sq.offset = this._q.offset;
    if (this._q.select) sq.select = this._q.select;
    return { parent: parts.slice(0, -1).join("/"), sq };
  }
  async get(tx) { return this._db._runQuery(this, tx); }
  count() { return { get: () => this._db._count(this) }; }
}

class CollectionReference extends Query {
  constructor(db, path) { super(db, path); this.path = path; this.id = path.split("/").at(-1); }
  doc(id) { return new DocumentReference(this._db, `${this.path}/${id ?? randomId()}`); }
  async add(data) { const ref = this.doc(); await ref.set(data); return ref; }
}

class WriteBatch {
  constructor(db) { this._db = db; this._writes = []; }
  set(ref, data, opts) { this._writes.push(setWrite(ref, data, opts)); return this; }
  update(ref, data) { this._writes.push(updateWrite(ref, data)); return this; }
  delete(ref) { this._writes.push({ delete: ref._name }); return this; }
  create(ref, data) { const w = setWrite(ref, data); w.currentDocument = { exists: false }; this._writes.push(w); return this; }
  commit() { return this._writes.length ? this._db._commit(this._writes) : Promise.resolve([]); }
}

class Transaction extends WriteBatch {
  constructor(db, id) { super(db); this._id = id; }
  get(refOrQuery) { return refOrQuery instanceof DocumentReference ? this._db._getDoc(refOrQuery, this._id) : this._db._runQuery(refOrQuery, this._id); }
  getAll(...refs) { return this._db._batchGet(refs, this._id); }
}

export class Firestore {
  constructor(serviceAccount) {
    this._sa = serviceAccount;
    this.projectId = serviceAccount.project_id;
    this._root = `projects/${this.projectId}/databases/(default)/documents`;
    this._base = `https://firestore.googleapis.com/v1/${this._root}`;
  }
  collection(path) { return new CollectionReference(this, path); }
  doc(path) { return new DocumentReference(this, path); }
  batch() { return new WriteBatch(this); }
  _refFromName(name) { return new DocumentReference(this, name.slice(this._root.length + 1)); }

  async _call(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${await accessToken(this._sa)}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 404 && method === "GET") return null;
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`firestore ${res.status}: ${text.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  async _getDoc(ref, tx) {
    const doc = await this._call("GET", `${this._base}/${ref.path}${tx ? `?transaction=${encodeURIComponent(tx)}` : ""}`);
    return new DocumentSnapshot(ref, doc, this);
  }
  async _runQuery(query, tx) {
    const { parent, sq } = query._structured();
    const url = `${this._base}${parent ? `/${parent}` : ""}:runQuery`;
    const rows = await this._call("POST", url, { structuredQuery: sq, ...(tx ? { transaction: tx } : {}) });
    const docs = rows.filter((r) => r.document).map((r) => new DocumentSnapshot(this._refFromName(r.document.name), r.document, this));
    return new QuerySnapshot(docs);
  }
  async _count(query) {
    const { parent, sq } = query._structured();
    const url = `${this._base}${parent ? `/${parent}` : ""}:runAggregationQuery`;
    const rows = await this._call("POST", url, { structuredAggregationQuery: { structuredQuery: sq, aggregations: [{ alias: "count", count: {} }] } });
    const n = Number(rows.find((r) => r.result)?.result?.aggregateFields?.count?.integerValue || 0);
    return { data: () => ({ count: n }) };
  }
  async _batchGet(refs, tx) {
    if (!refs.length) return [];
    const rows = await this._call("POST", `${this._base}:batchGet`, { documents: refs.map((r) => r._name), ...(tx ? { transaction: tx } : {}) });
    const byName = new Map(rows.map((r) => [r.found?.name || r.missing, r.found || null]));
    return refs.map((r) => new DocumentSnapshot(r, byName.get(r._name) || null, this));
  }
  getAll(...refs) { return this._batchGet(refs.filter((r) => r instanceof DocumentReference)); }
  async _commit(writes, tx) {
    const res = await this._call("POST", `${this._base}:commit`, { writes, ...(tx ? { transaction: tx } : {}) });
    return res.writeResults || [];
  }
  async runTransaction(fn, { maxAttempts = 5 } = {}) {
    for (let attempt = 1; ; attempt++) {
      const { transaction } = await this._call("POST", `${this._base}:beginTransaction`, {});
      const tx = new Transaction(this, transaction);
      try {
        const result = await fn(tx);
        await this._commit(tx._writes, transaction);
        return result;
      } catch (err) {
        await this._call("POST", `${this._base}:rollback`, { transaction }).catch(() => {});
        if (err.status === 409 && attempt < maxAttempts) continue;
        throw err;
      }
    }
  }
}
