import "./globals.css";
import { outfit, fraunces, bagel } from "./fonts.js";
import { Analytics } from "@vercel/analytics/next";
import { getSiteUrl } from "../lib/site.js";
import { ogImages } from "../lib/og.js";
import SeoCrawlNav from "./components/SeoCrawlNav.jsx";

const siteUrl = getSiteUrl();

const title = "Hyderabad Eats, Food Map & Local Rankings";
const description =
  "Hyderabad food map with community-voted rankings for biryani, cafes and restaurants. Explore 3,400+ spots, read local stories, stamp your passport, and race each week.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🫕</text></svg>",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: siteUrl,
    siteName: "Hyderabad Eats",
    locale: "en_IN",
    images: ogImages(title, description),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ogImages(title, description).map((i) => i.url),
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} ${bagel.variable}`}>
      <body className={outfit.className}>
        {children}
        <SeoCrawlNav />
        <Analytics />
      </body>
    </html>
  );
}
