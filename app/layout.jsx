import "./globals.css";
import { outfit, fraunces, bagel } from "./fonts.js";
import { Analytics } from "@vercel/analytics/next";
import { getSiteUrl } from "../lib/site.js";
import { ogImages } from "../lib/og.js";
import SeoCrawlNav from "./components/SeoCrawlNav.jsx";

const siteUrl = getSiteUrl();

const title = "Mapping HYD Eats — Hyderabad Food Map & Local Rankings";
const description =
  "Hyderabad food map with community-voted rankings for biryani, cafes and restaurants. Explore 3,400+ spots, read local stories, stamp your passport, and race each week.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s | Mapping HYD Eats" },
  description,
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🫕</text></svg>",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: siteUrl,
    siteName: "Mapping HYD Eats",
    locale: "en_IN",
    images: ogImages(title, description),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ogImages(title, description).map((i) => i.url),
  },
  alternates: { canonical: siteUrl },
};

const homeLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Mapping HYD Eats",
      url: siteUrl,
      description,
      publisher: { "@id": "https://mapmyhyd.com/#organization" },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Mapping HYD",
      url: "https://mapmyhyd.com/",
      sameAs: [
        "https://mapmyhyd.com/",
        "https://startups.mapmyhyd.com/",
        "https://eats.mapmyhyd.com/",
        "https://github.com/shivtchandra/hydstartuplist",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Hyderabad Eats?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hyderabad Eats is a Mapping HYD food map of 3,400+ restaurants, cafes, and local spots with community-voted weekly rankings.",
          },
        },
        {
          "@type": "Question",
          name: "How do Hyderabad Eats rankings work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Each ranking page shows a live community vote plus an all-time Google-review baseline so you can compare both lists.",
          },
        },
        {
          "@type": "Question",
          name: "Is Hyderabad Eats free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can browse the map, rankings, and area pages without signing up.",
          },
        },
      ],
    },
  ],
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} ${bagel.variable}`}>
      <body className={outfit.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homeLd) }}
        />
        {children}
        <SeoCrawlNav />
        <Analytics />
      </body>
    </html>
  );
}
