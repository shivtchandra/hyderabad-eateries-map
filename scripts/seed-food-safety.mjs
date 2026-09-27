// Publish verified 2026 TG SAFE inspection drives to /food-safety via the admin API.
// Usage: node --env-file=.env.local scripts/seed-food-safety.mjs [https://eats.mapmyhyd.com]
// Idempotent: fixed drive ids, re-running overwrites the same records. Edit later in /admin.
//
// Every drive is taken from TG SAFE releases as reported by at least two outlets (links below).
// spotId only where the Eats spot is clearly the same branch (name + area/address match).
// Establishments that were merely inspected, with no action reported, are not listed.

const BASE = (process.argv[2] || "https://eats.mapmyhyd.com").replace(/\/$/, "");
const SECRET = process.env.ADMIN_SECRET;
if (!SECRET) { console.error("ADMIN_SECRET missing (run with --env-file=.env.local)"); process.exit(1); }

const AUTH = "TG SAFE (Commissioner of Food Safety, Telangana)";
const mk = (date) => ({
  suspended: (name, area, spotId = null, findings = []) => ({ name, area, spotId, action: "licence-suspended", findings, status: "action-taken", statusDate: date, statusNote: "Told to stop operations until compliance and re-inspection" }),
  closed: (name, area, note = "Operating without an FSSAI licence or registration", spotId = null) => ({ name, area, spotId, action: "closed", findings: [], status: "action-taken", statusDate: date, statusNote: note }),
  notice: (name, area, note, spotId = null) => ({ name, area, spotId, action: "notice", findings: [], status: "action-taken", statusDate: date, statusNote: note }),
});

const DRIVES = [];

{ const D = "2026-08-26", e = mk(D); DRIVES.push({
  id: "2026-08-26-sweet-shops", date: D, title: "Sweet and savoury units drive before the festivals",
  areas: ["Core Urban Region"], authority: AUTH, inspected: 32, samples: 35,
  summary: "Fifteen teams inspected 32 sweet and savoury makers and sellers ahead of Raksha Bandhan and Milad-un-Nabi, seizing about 15 tonnes of food articles worth Rs 30 lakh. 12 improvement notices and 4 show-cause notices were issued.",
  sources: [
    { label: "Telangana Today", url: "https://telanganatoday.com/tg-safe-seizes-food-articles-worth-rs-30-lakh-in-hyderabad" },
    { label: "NewsMeter", url: "https://newsmeter.in/hyderabad/poor-hygiene-expired-food-rodents-tg-safe-finds-safety-violations-at-32-sweet-shops-in-hyderabad-774299" },
    { label: "Siasat", url: "https://www.siasat.com/g-pulla-reddy-31-other-sweet-shops-units-raided-in-hyderabad-3530943/" },
  ],
  entries: [e.suspended("Burfi Ghar", "Bachupally")],
}); }

{ const D = "2026-09-02", e = mk(D); DRIVES.push({
  id: "2026-09-02-cafes-snacks", date: D, title: "Cafes and snack shops drive",
  areas: ["Madina Circle", "Bagh Lingampally", "Punjagutta"], authority: AUTH, inspected: 19, samples: 0,
  summary: "Nine teams inspected 19 cafes and snack shops. Officials reported expired and spoiled food, poor hygiene, improper storage and fly and cockroach infestation at some places.",
  sources: [
    { label: "The News Minute", url: "https://www.thenewsminute.com/telangana/hyderabads-hotel-shadab-fssai-licence-suspended-after-food-safety-inspection" },
    { label: "Siasat", url: "https://www.siasat.com/shadab-hotel-licence-suspended-2-cafes-shut-in-hyderabad-3535178/" },
    { label: "The South First", url: "https://thesouthfirst.com/telangana/iconic-hyderabad-eatery-shadab-hotels-fssai-licence-suspended-over-food-safety-violations/" },
  ],
  entries: [
    e.suspended("Hotel Shadab (Madina Circle branch)", "Madina Circle", "ChIJKyxGIoiXyzsRPY8PASGdTW0"),
    e.closed("Dreamz Cafeteria", "Bagh Lingampally"),
    e.closed("Asiatic Cafe", "Punjagutta"),
  ],
}); }

{ const D = "2026-09-09", e = mk(D); DRIVES.push({
  id: "2026-09-09-kukatpally", date: D, title: "Kukatpally area drive: restaurants, bakeries and hostels",
  areas: ["Kukatpally"], authority: AUTH, inspected: 20, samples: 0,
  summary: "Ten teams inspected 20 restaurants, bakeries, sweet shops and hostels. Officials reported cockroach infestation, pest-infested and expired food, fungal contamination in groundnuts and poorly kept refrigerators at some places.",
  sources: [
    { label: "ANI", url: "https://aninews.in/news/national/general-news/tg-safe-suspends-licences-of-5-food-establishments-in-kukatpally20260909204551/" },
    { label: "The South First", url: "https://thesouthfirst.com/telangana/hyderabad-food-safety-crackdown-five-fssai-licences-suspended-in-kukatpally/" },
    { label: "LatestLY", url: "https://www.latestly.com/agency-news/india-news-tg-safe-suspends-licences-of-5-food-establishments-in-kukatpally-7597355.html" },
  ],
  entries: [
    e.suspended("Manikanta's Live Space Luxury Women's Hostel", "Kukatpally"),
    e.suspended("Sri Balaji Luxury Men's PG Hostel", "Kukatpally"),
    e.suspended("Hotel Sitara Grand", "Kukatpally", "ChIJbdDUpJSRyzsRzG4bQhKPwYw"),
    e.suspended("Bake Max Foods Pvt Ltd (Brown Bear manufacturing unit)", "Kukatpally"),
    e.suspended("Mandi King Arabian Restaurant", "Kukatpally"),
    e.closed("GVK New Luxury PG Men's Hostel", "Kukatpally"),
    e.notice("Mehfil Restaurant", "Kukatpally", "Improvement notice; re-inspection to follow"),
  ],
}); }

{ const D = "2026-09-16", e = mk(D); DRIVES.push({
  id: "2026-09-16-lb-nagar", date: D, title: "LB Nagar area drive",
  areas: ["LB Nagar", "Dilsukhnagar", "Champapet", "Vanasthalipuram"], authority: AUTH, inspected: 0, samples: 0,
  summary: "Nine establishments in the LB Nagar area had their FSSAI licences suspended and were told to stop operations after inspections found serious violations.",
  sources: [
    { label: "Telangana Today", url: "https://telanganatoday.com/tg-safe-suspends-fssai-licences-of-nine-food-establishments-in-lb-nagar" },
    { label: "Siasat", url: "https://www.siasat.com/tg-safe-suspends-fssai-licences-of-nine-eateries-in-hyderabad-3543291/" },
    { label: "The Hans India", url: "https://www.thehansindia.com/news/cities/hyderabad/tgsafe-suspends-fssai-licences-of-nine-eateries-across-lb-nagar-1122660" },
    { label: "NewsMeter", url: "https://newsmeter.in/hyderabad/tg-safe-suspends-dilsukhnagar-bahar-biryani-cafe-licence-over-stale-meat-and-rodent-infestation-775620" },
  ],
  entries: [
    e.suspended("Hotel Sangeeth Grand Restaurant and Bar", "LB Nagar", "ChIJYzpdCQ-iyzsR8wNj6FlE1us", ["Cockroach infestation", "Expired food products", "Synthetic colours in prepared food"]),
    e.suspended("Bahar Biryani Cafe", "Dilsukhnagar", null, ["About 50 kg of stale meat, chicken and prawns", "Expired ingredients"]),
    e.suspended("Balaji Pheni and Namkeen", "LB Nagar"),
    e.suspended("Bhuvaneshwari Oil Industries", "LB Nagar"),
    e.suspended("Hotel Sindhura East Court", "LB Nagar"),
    e.suspended("Chemistry Bar and Kitchen (Surabhi Grand)", "LB Nagar"),
    e.suspended("New Limra Hotel", "LB Nagar"),
    e.suspended("N Village Multicuisine Restaurant", "Champapet", null, ["Cockroach infestation", "Expired food items"]),
    e.suspended("Hotel Kinara Grand Restaurant and Bar", "Vanasthalipuram", null, ["Rodent infestation", "Water stagnation", "Inadequate records"]),
  ],
}); }

{ const D = "2026-09-24", e = mk(D); DRIVES.push({
  id: "2026-09-24-core-urban", date: D, title: "Core Urban Region restaurant drive",
  areas: ["Gachibowli", "Raidurg", "Kondapur", "Hafeezpet", "Begum Bazar", "Kothapet"], authority: AUTH, inspected: 15, samples: 16,
  summary: "Eight teams inspected 15 establishments. Officials reported houseflies, cockroaches and rodents, expired products and spoiled vegetables at some places, closed one unlicensed eatery and issued improvement and show-cause notices.",
  sources: [
    { label: "Telangana Today", url: "https://telanganatoday.com/tg-safe-orders-eight-eateries-to-shut-over-serious-hygiene-lapses" },
    { label: "NewsMeter", url: "https://newsmeter.in/hyderabad/cockroaches-to-expired-food-tg-safe-inspects-15-establishments-suspends-fssai-licences-of-8-776170" },
    { label: "Telangana Tribune", url: "https://www.telanganatribune.com/tgsafe-suspends-licenses-of-eight-hyderabad-restaurants-for-worst-hygiene/" },
  ],
  entries: [
    e.suspended("Aroma Multicuisine Restaurant", "Jayabheri Enclave, Gachibowli"),
    e.suspended("Aditya Restaurant and Bar", "Safilguda"),
    e.suspended("Vaishnavi Darshini", "Begum Bazar"),
    e.suspended("Spicy Hub (Green Treat Restaurant)", "Kothapet"),
    e.suspended("Pakwan Grand Restaurant", "Raidurg", null, ["1,170 kg of expired rice", "45 kg of noodles with labelling defects"]),
    e.suspended("Godavari Ghumaghumalu", "Hafeezpet"),
    e.suspended("Sri Krishna Family Dhaba Pure Veg", "Gopanpally"),
    e.suspended("Sri Sai Mess (Babai Hotel unit)", "Kondapur"),
    e.closed("Lucky Restaurant", "Pragathi Nagar, Bachupally"),
    e.notice("Girl Friend Mandi", "Gachibowli", "Improvement notice"),
    e.notice("Eat Club Brands (Box8 and Mojo Pizza)", "Yousufguda", "Improvement notice"),
    e.notice("Seasons Xpress", "Hitech City", "Improvement notice"),
    e.notice("Yummy Bee", "Sainikpuri", "Improvement notice", "ChIJM_wDTOWbyzsRIDxdXsMLso8"),
    e.notice("JMJ Boys and Girls Hostel", "Gandimaisamma", "Improvement notice"),
    e.notice("Nexar Hoflich Food and Beverages (Asaa Neo Indian Kitchen)", "Puppalguda", "Show-cause notice"),
  ],
}); }

{ const D = "2026-09-26", e = mk(D); DRIVES.push({
  id: "2026-09-26-it-corridor", date: D, title: "IT corridor restaurant inspection drive",
  areas: ["Madhapur", "Hitech City", "Gachibowli"], authority: AUTH, inspected: 20, samples: 21,
  summary: "Ten teams of Food Safety Officers and police inspected 20 establishments and lifted 21 samples for lab tests. Officials reported pest infestation, expired and spoiled food, fungal contamination and poor storage at several places; 11 FSSAI licences were suspended.",
  sources: [
    { label: "TG SAFE on X", url: "https://x.com/c_tgsafe" },
    { label: "Siasat", url: "https://www.siasat.com/tg-safe-suspends-fssai-licences-of-11-eateries-in-hyderabad-3548718/" },
    { label: "Telangana Today", url: "https://telanganatoday.com/cockroaches-rat-faeces-found-as-tg-safe-acts-against-11-hyderabad-eateries" },
    { label: "NewsMeter", url: "https://newsmeter.in/hyderabad/cockroaches-rodents-expired-food-what-tg-safe-found-at-eateries-in-hyderabads-it-corridor-776266" },
  ],
  entries: [
    e.suspended("Monastery", "Hitech City"),
    e.suspended("Shivani The Restaurant & Bar", "Gachibowli"),
    e.suspended("Al Saba Restaurant", "Gachibowli"),
    e.suspended("Lucky Multicuisine Restaurant", "Madhapur"),
    e.suspended("Sai Ram Mess", "Madhapur"),
    e.suspended("Udupi's Upahar", "Gachibowli"),
    e.suspended("Coal Spark Multi Cuisine Restaurant", "Hitech City", null, ["About 22 kg of fungus-infested peanuts discarded"]),
    e.suspended("Kanchi Cafe", "Hitech City", "ChIJ7-gSVoCTyzsRCdGH_rfeAFE"),
    e.suspended("Antera Kitchen & Bar", "Gachibowli"),
    e.suspended("Am Aha Telugu Kitchen & Bar", "Inorbit Mall, Madhapur"),
    e.suspended("Fusion 9 / Amnesia Sky Bar", "Inorbit Mall, Madhapur", "ChIJQXy9RiWRyzsRLSs0KeUpDmI"),
    e.notice("Rameshwaram Cafe", "Madhapur", "Improvement notice", "ChIJGypuNaiRyzsR-smd2ySqMuo"),
    e.notice("Hotel Shadab", "Gachibowli", "Improvement notice"),
    e.notice("Shah Ghouse Hotel & Restaurant", "Gachibowli", "Improvement notice"),
    e.notice("White Elephant Food Works (63 Degrees Modern Regional Buffet)", "Gachibowli", "Show-cause notice; penalties may follow"),
    e.notice("Minerva Grand", "Hitech City", "Show-cause notice; penalties may follow"),
    e.notice("Hotel Avasa", "Hitech City", "Show-cause notice; penalties may follow"),
  ],
}); }

for (const drive of DRIVES) {
  const res = await fetch(`${BASE}/api/admin/inspections`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SECRET}` },
    body: JSON.stringify(drive),
  });
  console.log(drive.date, res.status, await res.text());
}
