// Read-only public crawl checks. No Search results scraping or ranking claims.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const ORIGIN = "https://eats.mapmyhyd.com";
export const WATCH_PATHS = [
  "/", "/rankings", "/rankings/best-biryani-in-hyderabad",
  "/rankings/best-mandi-in-hyderabad", "/rankings/best-shawarma-in-hyderabad",
  "/rankings/best-dosa-in-hyderabad", "/rankings/best-ice-cream-in-hyderabad",
  "/rankings/best-brewery-in-hyderabad", "/rankings/best-cafe-in-hyderabad",
  "/spot/between-brewhouse-and-kitchen-financial-district",
  "/spot/feranoz-filmnagar-jubilee-hills",
  "/spot/the-kop-specialty-coffee-financial-district",
  "/spot/windmills-craftworks-madhapur",
  "/spot/alley-91-bowling-bar-financial-district",
  "/spot/lasthouse-by-the-lake-jubilee-hills",
];

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(([, key, a, b, c]) => [key.toLowerCase(), a ?? b ?? c]));
}

export function inspectHtml(html, url, headers = "") {
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => attributes(tag));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => attributes(tag));
  const robots = meta.filter((m) => ["robots", "googlebot"].includes(m.name?.toLowerCase()))
    .map((m) => m.content || "");
  const headerRobots = [...headers.matchAll(/^x-robots-tag:\s*(.+)$/gim)].map(([, v]) => v.trim());
  const canonical = links.find((l) => l.rel?.toLowerCase().split(/\s+/).includes("canonical"))?.href || null;
  const expected = new URL(url).href.replace(/\/$/, "");
  const issues = [];
  if ([...robots, ...headerRobots].some((r) => /\b(noindex|none)\b/i.test(r))) issues.push("noindex");
  if (!canonical) issues.push("missing-canonical");
  else {
    try { if (new URL(canonical, url).href.replace(/\/$/, "") !== expected) issues.push("canonical-mismatch"); }
    catch { issues.push("invalid-canonical"); }
  }
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || null;
  if (!title) issues.push("missing-title");
  return { title, canonical, robots, headerRobots, issues };
}

function download(path) {
  // curl works with the public site; some other client user agents receive 403.
  // This is a client-side probe, never proof of verified Googlebot access.
  const raw = execFileSync("curl", ["-sS", "--max-time", "30", "-D", "-",
    "-w", "\n__SEO_STATUS__%{http_code}", `${ORIGIN}${path}`], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  // Some proxies prepend a CONNECT response. Only split HTTP header blocks.
  let body = raw;
  let headers = "";
  while (/^HTTP\/\S+\s+\d{3}/.test(body)) {
    const boundary = /\r?\n\r?\n/.exec(body);
    if (!boundary) break;
    headers = body.slice(0, boundary.index);
    body = body.slice(boundary.index + boundary[0].length);
  }
  const status = Number(body.match(/\n__SEO_STATUS__(\d+)$/)?.[1] || 0);
  body = body.replace(/\n__SEO_STATUS__\d+$/, "");
  return { status, headers, body };
}

export function inspectRedirect(status, headers, destination) {
  const location = headers.match(/^location:\s*(.+)$/im)?.[1]?.trim() || null;
  const issues = [];
  if (![301, 308].includes(status)) issues.push("missing-permanent-redirect");
  try {
    if (!location || new URL(location, ORIGIN).href !== `${ORIGIN}${destination}`) issues.push("redirect-destination-mismatch");
  } catch { issues.push("redirect-destination-mismatch"); }
  return { location, expectedDestination: destination, issues };
}

export function runAudit() {
  const checkedAt = new Date().toISOString();
  const rows = [];
  const resources = {};
  const legacyRedirects = { "/picks/biryani": "/rankings/best-biryani-in-hyderabad" };
  for (const path of ["/robots.txt", "/sitemap.xml", ...WATCH_PATHS, ...Object.keys(legacyRedirects)]) {
    try {
      const { status, headers, body } = download(path);
      if (legacyRedirects[path]) {
        rows.push({ path, status, ...inspectRedirect(status, headers, legacyRedirects[path]) });
      } else if (path === "/robots.txt" || path === "/sitemap.xml") {
        resources[path] = { status, body };
        rows.push({ path, status, issues: status === 200 ? [] : [`http-${status}`] });
      } else {
        const data = inspectHtml(body, `${ORIGIN}${path}`, headers);
        rows.push({ path, status, ...data, issues: [...(status === 200 ? [] : [`http-${status}`]), ...data.issues] });
      }
    } catch (error) {
      rows.push({ path, status: null, issues: ["fetch-failed"], error: String(error.message).slice(0, 250) });
    }
  }
  const sitemap = resources["/sitemap.xml"];
  const locations = new Set([...((sitemap?.body || "").matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g))].map(([, u]) => u.trim().replace(/\/$/, "")));
  for (const row of rows.filter((r) => WATCH_PATHS.includes(r.path))) {
    row.inSitemap = sitemap?.status === 200 ? locations.has(`${ORIGIN}${row.path}`.replace(/\/$/, "")) : null;
    if (row.inSitemap === false) row.issues.push("missing-from-sitemap");
  }
  const report = {
    checkedAt, origin: ORIGIN,
    limitation: "Public HTTP probes only. Does not establish Google indexing, Googlebot access, positions, search volume, or the cause of a traffic drop.",
    robotsText: resources["/robots.txt"]?.body || null,
    sitemapUrls: locations.size, rows,
    issueCount: rows.reduce((n, row) => n + row.issues.length, 0),
  };
  const dir = resolve(".mini/seo-recovery");
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, `${checkedAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(resolve(dir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ report: file, pages: rows.length, issueCount: report.issueCount,
    issues: rows.filter((r) => r.issues.length).map(({ path, issues }) => ({ path, issues })) }));
  process.exitCode = report.issueCount ? 1 : 0;
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) runAudit();
