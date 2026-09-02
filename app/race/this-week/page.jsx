import EateriesApp from "../../page.jsx";
import { getSiteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";

const siteUrl = getSiteUrl();
const title = "This Week’s Food Challenge | Hyderabad Eats";
const description = "Vote for Hyderabad’s best food spot in this week’s community challenge.";

export const metadata = {
  title,
  description,
  alternates: { canonical: "/race/this-week" },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/race/this-week`,
    images: ogImages(title, description),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ogImages(title, description).map((image) => image.url),
  },
};

export default function ThisWeekRacePage() {
  return <EateriesApp initialTab="race" initialRaceView="theme" />;
}
