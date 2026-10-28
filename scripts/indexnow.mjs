#!/usr/bin/env node
// Tells Bing (and other IndexNow engines) which pages changed in a deploy.
// ChatGPT search leans on Bing's index, so fresh pages there matter for GEO.
//
//   node scripts/indexnow.mjs prepare   before deploy: hash every sitemap page
//                                       in out/, write out/indexnow-manifest.json,
//                                       and list the URLs whose text changed
//                                       versus the live manifest.
//   node scripts/indexnow.mjs submit    after deploy: send that list.
//   add --dry-run to print instead of sending.
//
// Hashes visible text only, so build ids and chunk names in the HTML do not
// make every page look changed on each daily rebuild.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SITE = "https://eats.mapmyhyd.com";
const KEY = "5d5c844b3ff5a1c3989804a09cd4f9cd"; // same key as submit-indexnow.mjs
const OUT = path.resolve("out");
const MANIFEST = "indexnow-manifest.json";
const CHANGED = path.join(process.env.RUNNER_TEMP || tmpdir(), "indexnow-changed.json");
// IndexNow accepts up to 10,000 URLs per request.
const BATCH = 10000;

const [mode] = process.argv.slice(2);
const dryRun = process.argv.includes("--dry-run");

function sitemapUrls() {
  const xml = readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function htmlFile(url) {
  const p = decodeURI(new URL(url).pathname).replace(/\/$/, "");
  for (const f of [p ? `${p}.html` : "/index.html", `${p}/index.html`]) {
    const full = path.join(OUT, f);
    if (existsSync(full)) return full;
  }
  return null;
}

function textHash(file) {
  const text = readFileSync(file, "utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha1").update(text).digest("hex").slice(0, 16);
}

async function liveManifest() {
  try {
    const res = await fetch(`${SITE}/${MANIFEST}`);
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

async function prepare() {
  const manifest = {};
  for (const url of sitemapUrls()) {
    const file = htmlFile(url);
    if (file) manifest[url] = textHash(file);
  }
  writeFileSync(path.join(OUT, MANIFEST), JSON.stringify(manifest));
  const live = await liveManifest();
  const changed = Object.keys(manifest).filter((u) => live[u] !== manifest[u]);
  writeFileSync(CHANGED, JSON.stringify(changed));
  console.log(`indexnow: ${Object.keys(manifest).length} pages hashed, ${changed.length} new or changed`);
}

async function submit() {
  const urls = existsSync(CHANGED) ? JSON.parse(readFileSync(CHANGED, "utf8")) : [];
  if (!urls.length) return console.log("indexnow: nothing changed");
  for (let i = 0; i < urls.length; i += BATCH) {
    const body = {
      host: new URL(SITE).host,
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList: urls.slice(i, i + BATCH),
    };
    if (dryRun) {
      console.log(`indexnow (dry run): would send ${body.urlList.length} URLs`, body.urlList.slice(0, 5));
      continue;
    }
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    // 200/202 accepted. Never fail the deploy over a ping.
    console.log(`indexnow: sent ${body.urlList.length} URLs, HTTP ${res.status}`);
  }
}

if (mode === "prepare") await prepare();
else if (mode === "submit") await submit();
else {
  console.error("usage: node scripts/indexnow.mjs prepare|submit [--dry-run]");
  process.exit(1);
}
