import "./globals.css";
import "./recommendations.css";
import Script from "next/script";
import { outfit, fraunces, bagel } from "./fonts.js";
import { Analytics } from "@vercel/analytics/next";
import { getSiteUrl } from "../lib/site.js";
import { ogImages } from "../lib/og.js";
import SeoCrawlNav from "./components/SeoCrawlNav.jsx";
import { PHOTO_CDN_ORIGIN } from "../lib/photos.js";
import PwaRegister from "./components/PwaRegister.jsx";

const siteUrl = getSiteUrl();
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-WSV3VC8ESR";

const title = "Hyderabad Food Map & Local Rankings | Mapping HYD Eats";
const description =
  "Hyderabad food map with community-voted rankings for biryani, cafes and restaurants. Explore 3,600+ spots, local guides and weekly food votes.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s | Mapping HYD Eats" },
  description,
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/apple-touch-icon.png",
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
  appleWebApp: { capable: true, title: "HYD Eats", statusBarStyle: "default" },
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
      alternateName: ["Hyderabad Eats", "Mapping HYD", "eats.mapmyhyd.com"],
      url: siteUrl,
      description,
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Mapping HYD Eats",
      alternateName: ["Hyderabad Eats", "Mapping HYD"],
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
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


// viewportFit "cover" makes phones report safe-area insets (the gesture bar), so the
// floating bottom bar can sit above it instead of underneath.
export const viewport = { themeColor: "#7c3aed", viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} ${bagel.variable}`}>
      <head>
        {/* Venue photos come from a separate CDN origin, so warm the connection
            before the first <img> asks for one. */}
        <link rel="preconnect" href={PHOTO_CDN_ORIGIN} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={PHOTO_CDN_ORIGIN} />
      </head>
      <body className={outfit.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homeLd) }}
        />
        {children}
        <SeoCrawlNav />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        {process.env.HYD_STATIC_EXPORT !== "1" && <Analytics />}
        <PwaRegister />
      </body>
    </html>
  );
}
