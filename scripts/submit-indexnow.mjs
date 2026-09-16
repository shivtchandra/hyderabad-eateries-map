/**
 * Submit all site URLs to IndexNow (Bing, Yahoo, Yandex, Naver) for instant indexing.
 * Run: node scripts/submit-indexnow.mjs
 */

import sitemap from "../app/sitemap.js";

const KEY = "54dd7e84fc794b7a96faf6851aac4250";
const HOST = "eats.mapmyhyd.com";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function main() {
  console.log("Fetching sitemap URLs...");
  const entries = await sitemap();
  const urls = entries.map((e) => e.url);

  console.log(`Found ${urls.length} URLs to submit to IndexNow.`);

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 200 || res.status === 202) {
      console.log(`✅ Successfully submitted ${urls.length} URLs to IndexNow! (HTTP ${res.status})`);
    } else {
      const text = await res.text();
      console.log(`⚠️ IndexNow response: HTTP ${res.status} - ${text}`);
    }
  } catch (err) {
    console.error("❌ IndexNow submission error:", err.message);
  }
}

main();
