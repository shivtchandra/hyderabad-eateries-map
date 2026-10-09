// Stand-in for "next/server" inside the Worker: NextResponse with cookie
// support, and NextRequest-style helpers are added to the incoming Request by
// the router (req.cookies.get, req.nextUrl).
function serializeCookie(name, value, o = {}) {
  let s = `${name}=${encodeURIComponent(value)}`;
  if (o.maxAge != null) s += `; Max-Age=${Math.floor(o.maxAge)}`;
  if (o.expires) s += `; Expires=${new Date(o.expires).toUTCString()}`;
  s += `; Path=${o.path || "/"}`;
  if (o.domain) s += `; Domain=${o.domain}`;
  if (o.httpOnly) s += "; HttpOnly";
  if (o.secure) s += "; Secure";
  if (o.sameSite) s += `; SameSite=${String(o.sameSite).replace(/^./, (c) => c.toUpperCase())}`;
  return s;
}

export class NextResponse extends Response {
  constructor(body, init) {
    super(body, init);
    const headers = this.headers;
    this.cookies = {
      set(name, value, opts) {
        if (typeof name === "object") ({ name, value, ...opts } = name);
        headers.append("Set-Cookie", serializeCookie(name, value, opts));
      },
      delete(name) { headers.append("Set-Cookie", serializeCookie(name, "", { maxAge: 0 })); },
    };
  }
  static json(body, init = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
  static redirect(url, status = 307) {
    return new NextResponse(null, { status: typeof status === "number" ? status : status?.status || 307, headers: { Location: String(url) } });
  }
  static next() { return new NextResponse(null, { status: 200 }); }
}

export class NextRequest extends Request {}
