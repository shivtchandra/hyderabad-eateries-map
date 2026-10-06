import localFont from "next/font/local";

export const outfit = localFont({
  src: [{ path: "../public/fonts/outfit-400.ttf", weight: "400", style: "normal" }, { path: "../public/fonts/outfit-500.ttf", weight: "500", style: "normal" }, { path: "../public/fonts/outfit-600.ttf", weight: "600", style: "normal" }, { path: "../public/fonts/outfit-700.ttf", weight: "700", style: "normal" }],
  variable: "--font-outfit",
  display: "swap",
});

export const fraunces = localFont({
  src: [{ path: "../public/fonts/fraunces-500.ttf", weight: "500", style: "normal" }, { path: "../public/fonts/fraunces-600.ttf", weight: "600", style: "normal" }, { path: "../public/fonts/fraunces-700.ttf", weight: "700", style: "normal" }],
  variable: "--font-fraunces",
  display: "swap",
});

export const bagel = localFont({
  src: [{ path: "../public/fonts/bagel-400.ttf", weight: "400", style: "normal" }],
  variable: "--font-bagel",
  display: "swap",
});
