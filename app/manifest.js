// Web app manifest: lets people add Hyderabad Eats to their home screen and open it
// full-screen like an app.
export default function manifest() {
  return {
    name: "Hyderabad Eats",
    short_name: "HYD Eats",
    description: "Hyderabad food map, weekly community rankings, dining deals and your food passport.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f2ee",
    theme_color: "#7c3aed",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "This week's race", url: "/?tab=race", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      // { name: "Dining deals", url: "/offers", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
