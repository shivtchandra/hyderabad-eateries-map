import EateriesApp from "../page.jsx";
import { getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";

const siteUrl = getSiteUrl();
const title = "The Hyderabad Food Race | Hyderabad Eats";
const description = "Claim Hyderabad food spots, score points, and see where you rank in the Hyderabad Eats race.";

export const metadata = {
  title,
  description,
  alternates: { canonical: "/race" },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/race`,
    images: ogImages(title, description),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ogImages(title, description).map((image) => image.url),
  },
};

export default function RacePage() {
  return <EateriesApp initialTab="race" initialRaceView="race" />;
}
