import { getSiteUrl } from "../lib/site.js";

export default function robots() {
  const siteUrl = getSiteUrl();
  const disallow = ["/admin", "/api/"];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      {
        userAgent: ["OAI-SearchBot", "GPTBot", "ChatGPT-User", "Google-Extended", "anthropic-ai", "ClaudeBot", "PerplexityBot"],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
