/**
 * Push local public/photos into the public photo repo and refresh the manifest.
 *
 * Venue photos are deliberately NOT in this repo or in Vercel deployments. They
 * live in shivtchandra/hyd-eats-photos and are served by GitHub Pages. Shipping
 * them as Vercel static assets cost ~151MB of Deployment Storage per deploy,
 * which is most of how this project blew the 10GB Hobby cap.
 *
 * Typical flow after scraping new thumbnails:
 *   node scripts/cache-photos.mjs     # writes public/photos/<place-id>.jpg
 *   node scripts/sync-photos.mjs      # pushes them, rewrites data/photo-ids.json
 *   git add data/photo-ids.json && git commit
 *
 * The manifest must be committed: the app reads it to decide whether a venue has
 * a photo, and it cannot look at public/photos on Vercel.
 *
 * Env:
 *   PHOTO_REPO   default shivtchandra/hyd-eats-photos
 *   PHOTO_BRANCH default main
 *   DRY_RUN=1    stage and report, push nothing
 */

import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PHOTOS = path.join(ROOT, "public", "photos");
const MANIFEST = path.join(ROOT, "data", "photo-ids.json");

const REPO = process.env.PHOTO_REPO || "shivtchandra/hyd-eats-photos";
const BRANCH = process.env.PHOTO_BRANCH || "main";
const DRY_RUN = process.env.DRY_RUN === "1";

const [OWNER, NAME] = REPO.split("/");
const PAGES_BASE = process.env.NEXT_PUBLIC_PHOTO_CDN || `https://${OWNER}.github.io/${NAME}`;

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "inherit"] }).trim();

if (!fs.existsSync(PHOTOS)) {
  console.error(`No ${path.relative(ROOT, PHOTOS)} directory. Nothing to sync.`);
  process.exit(1);
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), "hyd-photos-"));
console.log(`Cloning ${REPO}#${BRANCH} into ${work}`);
run("git", ["clone", "--depth", "1", "--branch", BRANCH, `https://github.com/${REPO}.git`, work]);

// Mirror local photos into the clone. Copy only new or changed files so the
// commit stays small and jsDelivr keeps serving unchanged files from cache.
let copied = 0;
const walk = (dir, rel = "") => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const from = path.join(dir, entry.name);
    const relPath = rel ? path.join(rel, entry.name) : entry.name;
    if (entry.isDirectory()) {
      fs.mkdirSync(path.join(work, relPath), { recursive: true });
      walk(from, relPath);
      continue;
    }
    const to = path.join(work, relPath);
    const src = fs.statSync(from);
    let dst = null;
    try {
      dst = fs.statSync(to);
    } catch {}
    if (!dst || dst.size !== src.size) {
      fs.copyFileSync(from, to);
      copied++;
    }
  }
};
walk(PHOTOS);

const status = run("git", ["status", "--porcelain"], work);
const changed = status ? status.split("\n").length : 0;
console.log(`${copied} file(s) copied, ${changed} path(s) changed in the photo repo`);

if (changed && !DRY_RUN) {
  run("git", ["add", "-A"], work);
  run("git", ["commit", "-m", `photos: sync ${changed} file(s) from eats app`], work);
  run("git", ["push", "origin", BRANCH], work);
  console.log(`Pushed to ${REPO}#${BRANCH}`);
} else if (changed) {
  console.log("DRY_RUN=1, not pushing");
} else {
  console.log("Photo repo already up to date");
}

// Regenerate the committed manifest from what is now on the CDN.
const ids = fs
  .readdirSync(PHOTOS)
  .filter((f) => f.endsWith(".jpg"))
  .map((f) => f.replace(/\.jpg$/, ""))
  .sort();
fs.writeFileSync(MANIFEST, JSON.stringify(ids));
console.log(`data/photo-ids.json rewritten with ${ids.length} ids`);

// GitHub Pages republishes on push and purges its own CDN, so no manual purge is
// needed. It does take a minute, so confirm one new file is actually live rather
// than assuming it.
if (changed && !DRY_RUN) {
  const probe = status
    .split("\n")
    .map((l) => l.slice(3).trim().replace(/^"|"$/g, ""))
    .find((p) => /\.(jpg|jpeg|png|webp)$/i.test(p));
  if (probe) {
    const url = `${PAGES_BASE}/${probe}`;
    process.stdout.write(`Waiting for Pages to publish ${probe} `);
    let live = false;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) {
          live = true;
          break;
        }
      } catch {}
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 15000));
    }
    console.log(live ? " live" : " still not live, check the Pages build");
    if (!live) process.exitCode = 1;
  }
}

fs.rmSync(work, { recursive: true, force: true });
console.log("Done. Commit data/photo-ids.json so the app knows about the new photos.");
