import localFont from "next/font/local";

// Display: titles, spot names, big numbers. Set tight (-0.04em) and huge.
export const display = localFont({
  src: [{ path: "../public/fonts/bricolage-500.woff2", weight: "500", style: "normal" }, { path: "../public/fonts/bricolage-700.woff2", weight: "700", style: "normal" }, { path: "../public/fonts/bricolage-800.woff2", weight: "800", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});

// UI: everything else (lists, labels, buttons, vote counts).
export const ui = localFont({
  src: [{ path: "../public/fonts/space-grotesk-400.woff2", weight: "400", style: "normal" }, { path: "../public/fonts/space-grotesk-500.woff2", weight: "500", style: "normal" }, { path: "../public/fonts/space-grotesk-600.woff2", weight: "600", style: "normal" }, { path: "../public/fonts/space-grotesk-700.woff2", weight: "700", style: "normal" }],
  variable: "--font-ui",
  display: "swap",
});
