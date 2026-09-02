// Framework-free SVG path data on a 24×24 grid, shared by the client icon
// components and the server-rendered map pins. Stroke-based, 1.75 weight,
// round caps — one consistent drawing language instead of emoji.

export const CATEGORY_GLYPH = {
  // Coffee cup, saucer and steam
  cafe: [
    "M5 9h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 14.5V9z",
    "M16 10.5h1.25a2.75 2.75 0 0 1 0 5.5H16",
    "M4 21.5h13",
    "M8.5 6V4.2",
    "M12.5 6V4.2",
  ],
  // Cocktail glass with garnish
  "restro-bar": [
    "M4.5 5.5h15L12 13.5z",
    "M12 13.5V19",
    "M8.5 19h7",
    "M17.5 8.5 20 5",
  ],
  // Croissant crescent
  bakery: [
    "M3.5 15.5c0-4.4 3.8-7.8 8.5-7.8s8.5 3.4 8.5 7.8",
    "M3.5 15.5c1.3-1.1 2.6-1.7 3.9-1.7s2.3.6 3 1.7",
    "M10.4 15.5c.7-1.1 1.6-1.7 2.7-1.7s2.1.6 2.9 1.7",
    "M20.5 15.5c-1.2-1.1-2.4-1.7-3.6-1.7",
  ],
  // Ice cream cone
  "ice-cream": [
    "M6.8 10.5a5.2 5.2 0 0 1 10.4 0",
    "M6.3 10.5h11.4L12 21z",
    "M9.2 14.7h5.6",
  ],
  // Cloche / covered plate — sit-down dining
  restaurant: [
    "M3.5 16.5h17",
    "M5 16.5a7 7 0 0 1 14 0",
    "M12 6.6v2.9",
    "M12 4.5a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z",
    "M4 20h16",
  ],
  // Chai glass on a saucer with steam — everyday Hyderabad
  local: [
    "M7.5 8.5h9l-1.2 8.2a2 2 0 0 1-2 1.7h-2.6a2 2 0 0 1-2-1.7z",
    "M4.5 21h15",
    "M10 5.6V3.9",
    "M14 5.6V3.9",
  ],
};

// UI icons
export const UI_GLYPH = {
  trophy: [
    "M7 4.5h10v3a5 5 0 0 1-10 0z",
    "M7 5.5H4.5V7a3 3 0 0 0 3 3",
    "M17 5.5h2.5V7a3 3 0 0 1-3 3",
    "M12 12.5v3.5",
    "M8.5 20h7",
    "M9.5 16h5l.5 4h-6z",
  ],
  crown: ["M4 8l3.5 3L12 5.5 16.5 11 20 8l-1.5 9h-13z", "M5.5 20h13"],
  flame: ["M12 3.5c3.5 3 5 5.5 5 8.5a5 5 0 0 1-10 0c0-1.4.5-2.6 1.5-3.6.3 1.2 1 1.9 1.7 2.1C10.4 8.5 11 6 12 3.5z"],
  search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M16.2 16.2 21 21"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  locate: [
    "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
    "M12 2.5V5",
    "M12 19v2.5",
    "M21.5 12H19",
    "M5 12H2.5",
    "M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15z",
  ],
  city: [
    "M3 21h18",
    "M5 21V9.5l5-3v14.5",
    "M14 21V4.5l5 3V21",
    "M7.5 12.5h0M7.5 16h0M16.5 11h0M16.5 14.5h0",
  ],
  map: [
    "M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z",
    "M9 4v13.5",
    "M15 6.5V20",
  ],
  passport: [
    "M5 4.5A1.5 1.5 0 0 1 6.5 3H19v18H6.5A1.5 1.5 0 0 1 5 19.5z",
    "M5 17.5h14",
    "M12 7.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4z",
    "M9.5 14.5h5",
  ],
  bookmark: ["M6.5 3.5h11v17l-5.5-4-5.5 4z"],
  navigate: ["M21 3 3 10.5l8 3 3 8z"],
  share: [
    "M12 15V3",
    "M8 7l4-4 4 4",
    "M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8",
  ],
  globe: [
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
    "M3.5 9.5h17",
    "M3.5 14.5h17",
    "M12 3c-2.4 2.4-3.6 5.4-3.6 9s1.2 6.6 3.6 9c2.4-2.4 3.6-5.4 3.6-9S14.4 5.4 12 3z",
  ],
  phone: [
    "M8 3.5H5.5A2 2 0 0 0 3.5 5.7C4 13 11 20 18.3 20.5a2 2 0 0 0 2.2-2V16l-4.5-1.5-2 2A14.5 14.5 0 0 1 7.5 10l2-2z",
  ],
  star: ["M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z"],
  check: ["M4.5 12.5 9.5 17.5 19.5 6.5"],
  ticket: [
    "M3.5 8.5A1.5 1.5 0 0 1 5 7h14a1.5 1.5 0 0 1 1.5 1.5V10a2 2 0 0 0 0 4v1.5A1.5 1.5 0 0 1 19 17H5a1.5 1.5 0 0 1-1.5-1.5V14a2 2 0 0 0 0-4z",
    "M14 7v10",
  ],
  clock: ["M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z", "M12 7.5V12l3 2"],
  sparkle: [
    "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
    "M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z",
  ],
  gem: ["M6 3.5h12l3.5 5.5L12 20.5 2.5 9z", "M2.5 9h19", "M8.5 3.5 6.5 9l5.5 11.5L17.5 9l-2-5.5"],
  landmark: [
    "M3 21h18",
    "M4.5 21V10h15v11",
    "M12 3 21 8H3z",
    "M8.5 13.5v4M12 13.5v4M15.5 13.5v4",
  ],
  laptop: ["M5 5.5h14v10H5z", "M2.5 18.5h19"],
  quiet: ["M11 5.5 6.5 9.5H3.5v5h3l4.5 4z", "M15 9.5a4 4 0 0 1 0 5", "M17.8 7a8 8 0 0 1 0 10"],
  view: [
    "M2.5 19.5 9 10l4 5 3-3.5 5.5 8z",
    "M17 3.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4z",
  ],
  leaf: ["M20 4c0 9-5 13-11 13H5c0-8 5-12 11-12z", "M5 20c1.5-4.5 4-7.5 8-9.5"],
  heart: ["M12 20.5C6 16.5 3 13 3 9.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 9 2.4c0 3.6-3 7.1-9 11.1z"],
  music: ["M9 18V5l11-2v13", "M6.5 15.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z", "M17.5 13.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"],
  sunrise: ["M12 3.5V7", "M5 12H2.5M21.5 12H19", "M6 6l1.8 1.8M16.2 7.8 18 6", "M7 16a5 5 0 0 1 10 0z", "M3 20h18"],
  paw: [
    "M12 13.5c-2.6 0-4.5 1.8-4.5 3.7 0 1.6 1.4 2.6 3 2.6h3c1.6 0 3-1 3-2.6 0-1.9-1.9-3.7-4.5-3.7z",
    "M7 8.5a1.7 2.2 0 1 0 0 4.4 1.7 2.2 0 0 0 0-4.4z",
    "M17 8.5a1.7 2.2 0 1 0 0 4.4 1.7 2.2 0 0 0 0-4.4z",
    "M10.5 4.5a1.6 2.1 0 1 0 0 4.2 1.6 2.1 0 0 0 0-4.2z",
    "M14.5 4.5a1.6 2.1 0 1 0 0 4.2 1.6 2.1 0 0 0 0-4.2z",
  ],
  cake: ["M4 20.5h16v-6H4z", "M4 14.5c0-2 1.5-3 4-3s4 1 4 3", "M12 14.5c0-2 1.5-3 4-3s4 1 4 3", "M12 11.5V7", "M12 5.5a1.2 1.2 0 1 0 0 .1z"],
  book: ["M4 4.5h6a2.5 2.5 0 0 1 2 2 2.5 2.5 0 0 1 2-2h6v14h-6a2.5 2.5 0 0 0-2 1.5 2.5 2.5 0 0 0-2-1.5H4z", "M12 6.5v13"],
  utensils: ["M6 3v7a2.5 2.5 0 0 0 5 0V3", "M8.5 10v11", "M17 3c-1.5 1-2.5 3-2.5 5.5S15.5 13 17 13.5V21"],
  filter: ["M3.5 5.5h17l-6.5 7.5V19l-4 2v-7.5z"],
};

export const TAG_ICON = {
  "work-friendly": "laptop",
  quiet: "quiet",
  view: "view",
  outdoor: "leaf",
  date: "heart",
  specialty: "cafe",
  "live-music": "music",
  breakfast: "sunrise",
  "pet-friendly": "paw",
  desserts: "cake",
  "veg-friendly": "leaf",
  "pure-veg": "leaf",
  reservable: "book",
};

export const TIER_ICON = {
  landmark: "landmark",
  established: "sparkle",
  "hidden-gem": "gem",
};

// Build a plain SVG string — used by the server-rendered marker route.
export function svgPaths(paths, { stroke = "currentColor", width = 1.75, fill = "none" } = {}) {
  return paths
    .map(
      (d) =>
        `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join("");
}
