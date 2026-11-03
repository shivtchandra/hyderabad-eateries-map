export const RECENT_OPENINGS = [
  {
    name: "Anaganaga – Telugu Culinary Tales",
    reportedMonth: "2026-10", reportedOn: "2026-10-08",
    kind: "Regional Telugu restaurant",
    area: "Road No. 45, Jubilee Hills",
    reported: "8 Oct 2026",
    what: "A 200-cover restaurant across two floors, focused on Andhra Pradesh and Telangana food. The opening report describes Telugu art and craft alongside a regional menu.",
    order: "The report names Pachi Pasupukommula Koora, Ippapoovu Pudding and a limited-availability thali. Confirm the current selection with the restaurant.",
    source: { label: "Restaurant India opening report", url: "https://www.restaurantindia.in/news/anaganaga-opens-200-cover-telugu-restaurant-in-hyderabad.n17409" },
  },
  {
    name: "Oktober",
    reportedMonth: "2026-10", reportedOn: "2026-10-26",
    kind: "Brewery and restaurant",
    area: "Road No. 10, Jubilee Hills",
    reported: "26 Oct 2026",
    what: "Craft beer, cocktails, music, and Indian and international food. Founded by Snehit Reddy and Rashmi Reddy; designed by Srikanth Reddy of 23 Degrees Design Shift, with terraces overlooking a park.",
    order: "Beers include Wise Men (hefeweizen), Hell Yes! (helles lager), Cloud 10 (hazy IPA) and Dhorasani (pineapple cider). Food includes Truffle Tandoori Paneer Tikka, Banana Leaf Chilli Fish and Qubani Cheesecake.",
    source: { label: "Telangana Today", url: "https://telanganatoday.com/oktober-opens-in-jubilee-hills-bringing-cocktails-and-dining-together" },
  },
  {
    name: "HOSA",
    reportedMonth: "2026-10", openedMonth: "2026-08",
    opened: "August 2026",
    timingSource: "https://www.esquireindia.co.in/food-and-drinks/what-to-eat/all-american-diner-fireback-barback-hosa-rmz-the-loft-hyderabad",
    kind: "Contemporary South Indian",
    area: "RMZ The Loft, HITEC City",
    reported: "23 Oct 2026",
    what: "A contemporary South Indian restaurant with a menu drawing on Andhra Pradesh and Telangana regional cooking.",
    source: { label: "Indian Retailer", url: "https://www.indianretailer.com/news/rmz-loft-adds-hosa-and-all-american-diner-hitec-city" },
  },
  {
    name: "The All American Diner",
    reportedMonth: "2026-10", openedMonth: "2026-09", openedOn: "2026-09-23", spotId: "curated-77e750a24cf6c588d418",
    opened: "23 September 2026",
    timingSource: "https://www.esquireindia.co.in/food-and-drinks/what-to-eat/all-american-diner-fireback-barback-hosa-rmz-the-loft-hyderabad",
    kind: "American diner",
    area: "RMZ The Loft, HITEC City",
    reported: "23 Oct 2026",
    what: "An American-style diner at RMZ The Loft, with all-day breakfast and familiar diner dishes.",
    order: "Breakfast plates, pancakes, burgers, hot dogs and thick shakes.",
    source: { label: "Indian Retailer", url: "https://www.indianretailer.com/news/rmz-loft-adds-hosa-and-all-american-diner-hitec-city" },
  },
  {
    name: "Foxie",
    reportedMonth: "2026-10", spotId: "ChIJX6yOslSRyzsRS3COscNwma0",
    kind: "Cocktail bar",
    area: "Jubilee Hills, one floor below Lili",
    reported: "Oct 2026",
    what: "A cocktail bar below Lili, with nine signature drinks inspired by fox folklore and 100 fox-themed artworks by Siddharth Kerkar.",
    order: "Truffle lobster cone and hoisin duck zambusa from the bar menu.",
    href: "/spot/foxie-cocktail-bar-jubilee-hills",
    source: { label: "Esquire India October hotlist", url: "https://www.esquireindia.co.in/food-and-drinks/what-to-eat/esquire-india-october-hotlist-new-restaurants-and-bars-across-india-fitour-n%C4%81m-chor-bizarre-and-more" },
  },
  {
    name: "Du Jour",
    reportedMonth: "2026-10", spotId: "ChIJHT0L-KWRyzsRNvi0WnSYDIc",
    kind: "Bakery cafe",
    area: "Jubilee Hills",
    reported: "Oct 2026",
    what: "A 15-seat cafe for viennoiserie, specialty coffee and matcha, from a bakery that started as a cloud kitchen.",
    order: "Chocolate Crobun, Pistachio and Raspberry Crobun, and the Cheese & Olive savoury bake.",
    href: "/spot/du-jour-jubilee-hills",
    source: { label: "Esquire India October hotlist", url: "https://www.esquireindia.co.in/food-and-drinks/what-to-eat/esquire-india-october-hotlist-new-restaurants-and-bars-across-india-fitour-n%C4%81m-chor-bizarre-and-more" },
  },
];

// Dates describe reported openings, never when an entry was added to our map.
export function selectRecentOpenings({ area = null, craving = null, period = null, now = new Date() } = {}) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const month = today.slice(0, 7);
  const cutoff = new Date(today + "T00:00:00+05:30").getTime() - 90 * 86400000;
  const normal = (s) => String(s || "").toLowerCase().replace(/hitech|hitec/g, "hitec").replace(/[^a-z0-9]+/g, " ").trim();
  return RECENT_OPENINGS.filter((report) => {
    if (report.reportedMonth > month) return false;
    if (area && !String(area).split(/[\/|]/).some((part) => part.trim() && normal(report.area).includes(normal(part)))) return false;
    if (craving && !["cafe", "bakery", "drinks", "meals", "tiffins", "dessert"].includes(craving)) return false;
    if (["cafe", "bakery", "dessert"].includes(craving) && !/cafe|bakery/i.test(report.kind)) return false;
    if (craving === "drinks" && !/bar|brewery/i.test(report.kind)) return false;
    if (craving === "tiffins" && !/diner|cafe/i.test(report.kind)) return false;
    if (period === "month") return report.openedMonth === month;
    if (period === "week") {
      const start = new Date(today + "T00:00:00+05:30");
      const weekday = new Date(today + "T12:00:00Z").getUTCDay();
      start.setTime(start.getTime() - ((weekday + 6) % 7) * 86400000);
      return Boolean(report.openedOn && new Date(report.openedOn + "T12:00:00+05:30") >= start && report.openedOn <= today);
    }
    return new Date(report.reportedMonth + "-01T00:00:00+05:30").getTime() >= cutoff;
  }).sort((a, b) => {
    const date = (r) => r.openedOn || (r.openedMonth ? r.openedMonth + "-01" : r.reportedOn || r.reportedMonth + "-01");
    return date(b).localeCompare(date(a));
  });
}

