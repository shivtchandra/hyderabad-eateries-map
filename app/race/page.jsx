import EateriesApp from "../page.jsx";
import { getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";

const siteUrl = getSiteUrl();
const title = "The Hyderabad Food Race | Hyderabad Eats";
const description = "Claim Hyderabad food spots, score points across cafes, biryani legends, and breweries, and see where you rank on the live Hyderabad Eats leaderboard.";

export const metadata = {
  title,
  description,
  alternates: { canonical: "/race" },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/race`,
    images: ogImages(title, description, "/race"),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ogImages(title, description, "/race").map((image) => image.url),
  },
};

export default function RacePage() {
  return <EateriesApp initialTab="race" initialRaceView="race" />;
}
