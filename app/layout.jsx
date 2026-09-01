import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Hyderabad Eats",
  description: "Cute map of Hyderabad's best cafes, restro-bars, bakeries & ice cream spots",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🫕</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
