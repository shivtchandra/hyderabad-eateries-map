// Isometric die-cut stickers in public/stickers/<key>.webp (DESIGN.md section 8).
// When you add a sticker file, add its key here so client components can use
// it (server pages also check the file on disk).
export const STICKER_KEYS = new Set([
  "biryani", "haleem", "irani-chai", "dosa", "mandi", "shawarma", "coffee",
]);

export function stickerUrl(key) {
  return key && STICKER_KEYS.has(key) ? `/stickers/${key}.webp` : null;
}

// Which sticker fits a ranking / vote title ("Best Ice Cream in Hyderabad").
const BY_WORD = [
  [/haleem/i, "haleem"],
  [/biryani/i, "biryani"],
  [/irani|chai/i, "irani-chai"],
  [/dosa|tiffin|breakfast/i, "dosa"],
  [/mandi/i, "mandi"],
  [/shawarma/i, "shawarma"],
  [/cafe|coffee/i, "coffee"],
  [/bakery|bakeries/i, "bakery"],
  [/ice cream|dessert/i, "ice-cream"],
  [/brew|beer|\bbar\b|pub/i, "beer"],
  [/street/i, "street-food"],
  [/fine dining/i, "fine-dining"],
];

export function stickerForTitle(title = "") {
  for (const [re, key] of BY_WORD) if (re.test(title)) return stickerUrl(key);
  return null;
}
