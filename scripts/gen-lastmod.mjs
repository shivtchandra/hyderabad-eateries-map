#!/usr/bin/env node
// Writes lib/lastmod.gen.json: route pattern -> ISO date of the last meaningful change to
// that route's page file or the files it imports (two levels deep).
//
// Why: Google only trusts <lastmod> when it tracks real content changes. A build timestamp
// on every URL is ignored, and no date at all hides real fixes from the crawler. This uses
// git history, and skips commits made by CI bots (data refreshes every few hours), so a
// date moves when a person changes a template, title, copy or schema.
//
// Needs full git history (actions/checkout with fetch-depth: 0). On a shallow clone it keeps
// the committed JSON instead of writing dates that would all equal the latest commit.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP = path.join(ROOT, "app");
const OUT = path.join(ROOT, "lib", "lastmod.gen.json");
const EXTS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".json"];
// CI data refreshes, e.g. "offers-bot <actions@github.com>" in the eats repo.
const BOT_AUTHORS = /github-actions|actions@github\.com|\[bot\]|-bot\b|^bot\b|dependabot/i;
const DEPTH = 2;

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

let shallow = false;
try {
  shallow = git(["rev-parse", "--is-shallow-repository"]) === "true";
} catch {
  console.warn("gen-lastmod: not a git checkout; keeping existing lib/lastmod.gen.json");
  process.exit(0);
}
if (shallow) {
  console.warn("gen-lastmod: shallow clone (set fetch-depth: 0); keeping existing lib/lastmod.gen.json");
  process.exit(0);
}

const dateCache = new Map();
function lastHumanChange(file) {
  if (dateCache.has(file)) return dateCache.get(file);
  let iso = null;
  try {
    const rel = path.relative(ROOT, file);
    const log = git(["log", "--format=%cI%x09%an%x09%ae", "-n", "200", "--", rel]);
    for (const line of log.split("\n")) {
      const [date, name = "", email = ""] = line.split("\t");
      if (date && !BOT_AUTHORS.test(name) && !BOT_AUTHORS.test(email)) {
        iso = date;
        break;
      }
    }
  } catch {}
  dateCache.set(file, iso);
  return iso;
}

function resolveImport(fromFile, spec) {
  let base;
  if (spec.startsWith("./") || spec.startsWith("../")) base = path.resolve(path.dirname(fromFile), spec);
  else if (spec.startsWith("@/")) base = path.join(ROOT, spec.slice(2));
  else return null; // package import
  const candidates = [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => path.join(base, "index" + e))];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

const IMPORT_RE = /(?:import\s[^"'`]*?from\s*|import\s*\(\s*|require\s*\(\s*|export\s[^"'`]*?from\s*)["']([^"']+)["']/g;
function deps(file, depth, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  if (depth === 0 || file.endsWith(".json")) return seen;
  let src = "";
  try {
    src = fs.readFileSync(file, "utf8");
  } catch {
    return seen;
  }
  for (const m of src.matchAll(IMPORT_RE)) {
    const dep = resolveImport(file, m[1]);
    if (dep) deps(dep, depth - 1, seen);
  }
  return seen;
}

function pageFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("_") || entry.name === "api") continue;
      pageFiles(full, out);
    } else if (/^page\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const result = {};
for (const page of pageFiles(APP)) {
  const route = path
    .relative(APP, path.dirname(page))
    .split(path.sep)
    .filter((seg) => seg && !/^\(.*\)$/.test(seg)) // drop route groups like (marketing)
    .join("/");
  let newest = null;
  for (const f of deps(page, DEPTH)) {
    const d = lastHumanChange(f);
    if (d && (!newest || d > newest)) newest = d;
  }
  if (newest) result[route] = newest;
}

const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(OUT, JSON.stringify(sorted, null, 2) + "\n");
console.log(`gen-lastmod: ${Object.keys(sorted).length} routes -> ${path.relative(ROOT, OUT)}`);
