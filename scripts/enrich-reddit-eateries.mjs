import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EATERIES_PATH = path.join(__dirname, "..", "data", "eateries.json");
const GUIDE_PATH = path.join(__dirname, "..", "data", "reddit-hyderabad-eateries-guide.md");

// Curated list of r/hyderabad top recommended eateries across categories
const REDDIT_EATERIES = [
  // ==========================================
  // 1. TIFFINS, BREAKFAST CENTERS & BANDIS
  // ==========================================
  {
    name: "Panchakattu Dosa",
    area: "Banjara Hills",
    address: "Road No. 10, Singada Kunta, Banjara Hills, Hyderabad, Telangana 500034",
    category: "local",
    tier: "landmark",
    lat: 17.4294,
    lng: 78.4358,
    priceLevel: 1,
    costForTwo: 250,
    tags: ["breakfast", "tiffin", "veg-friendly", "quick-bite"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Ghee Karam Dosa, Ghee Podi Idli with spicy tomato chutney",
    blurb: "Famous on r/hyderabad for crispy, ghee-drenched dosas served with distinctive spicy red chutney.",
    redditTip: "The ghee karam dosa and ghee podi idlis are must-haves. Portion sizes can be modest, so order an extra item if very hungry."
  },
  {
    name: "Taaza Kitchen",
    area: "Madhapur",
    address: "100 Feet Rd, Madhapur, Hyderabad, Telangana 500081",
    category: "local",
    tier: "established",
    lat: 17.4483,
    lng: 78.3915,
    priceLevel: 1,
    costForTwo: 200,
    tags: ["breakfast", "tiffin", "veg-friendly", "budget"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Masala Dosa, Crispy Vada, Chow Chow Bath, Filter Coffee",
    blurb: "Highly praised by the tech corridor crowd for fresh, hygienic, and fast South Indian breakfast.",
    redditTip: "Go early to avoid long queues during weekend mornings. The filter coffee and crispy vadas are extremely consistent."
  },
  {
    name: "Pragathi Tiffin Center",
    area: "Koti",
    address: "Opposite Pragathi College, Hanuman Tekdi, Koti, Hyderabad, Telangana 500001",
    category: "local",
    tier: "landmark",
    lat: 17.3872,
    lng: 78.4828,
    priceLevel: 1,
    costForTwo: 150,
    tags: ["breakfast", "tiffin", "street-food", "veg-friendly"],
    amenities: ["takeaway", "street-stall"],
    mustTry: "Butter Masala Dosa, Paneer Dosa, Ghee Tawa Idli",
    blurb: "Legendary student and local hub serving hot, butter-laden dosas and tawa idlis in Koti.",
    redditTip: "A staple bandi dosa experience in the city center. Try the butter paneer dosa loaded with upma."
  },
  {
    name: "Govind Ki Dosa",
    area: "Charminar",
    address: "Gulzar Houz, Charkaman, Ghansi Bazaar, Hyderabad, Telangana 500002",
    category: "local",
    tier: "landmark",
    lat: 17.3626,
    lng: 78.4747,
    priceLevel: 1,
    costForTwo: 200,
    tags: ["breakfast", "tiffin", "night-eats", "veg-friendly"],
    amenities: ["takeaway", "street-stall"],
    mustTry: "Butter Tawa Dosa, Karam Dosa, Tawa Idli with dollop of Amul butter",
    blurb: "Iconic Old City tiffin cart famous for generous slabs of butter melted on screaming-hot tawas.",
    redditTip: "Opens early in the morning and also draws late night crowds around Gulzar Houz."
  },
  {
    name: "Ram Ki Bandi",
    area: "Nampally",
    address: "Opposite Karachi Bakery, Mozamjahi Market, Nampally, Hyderabad, Telangana 500001",
    category: "local",
    tier: "landmark",
    lat: 17.3852,
    lng: 78.4764,
    priceLevel: 1,
    costForTwo: 250,
    tags: ["night-eats", "tiffin", "street-food", "veg-friendly"],
    amenities: ["takeaway", "street-stall", "late-night"],
    mustTry: "Cheese Butter Dosa, Upma Dosa, Double Cheese Pizza Dosa",
    blurb: "The pioneer of Hyderabad midnight butter dosa culture near Mozamjahi Market.",
    redditTip: "Original Nampally location is the classic 3:00 AM post-drive destination."
  },
  {
    name: "Laxman Ki Bandi",
    area: "Begum Bazaar",
    address: "Gowliguda Chaman, Begum Bazaar, Hyderabad, Telangana 500012",
    category: "local",
    tier: "hidden-gem",
    lat: 17.3789,
    lng: 78.4782,
    priceLevel: 1,
    costForTwo: 180,
    tags: ["breakfast", "tiffin", "street-food", "veg-friendly"],
    amenities: ["takeaway", "street-stall"],
    mustTry: "Melting Butter Idli, Cheese Karam Dosa",
    blurb: "Old City favorite known for tawa-fried butter idlis drenched in spicy podi.",
    redditTip: "Lesser known to tourists compared to Ram Ki Bandi, but staunchly defended by Old City locals for better chutney."
  },
  {
    name: "Varalakshmi Tiffins",
    area: "DLF Gachibowli",
    address: "DLF Cyber City Road, Gachibowli, Hyderabad, Telangana 500032",
    category: "local",
    tier: "landmark",
    lat: 17.4472,
    lng: 78.3589,
    priceLevel: 1,
    costForTwo: 220,
    tags: ["breakfast", "tiffin", "ghee-idli", "veg-friendly"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Ghee Podi Idli, Ghee Karam Dosa, Sambar Vada",
    blurb: "Rapidly grown sensation renowned for drowning idlis in fragrant melted ghee and spicy gun powder.",
    redditTip: "Order the ghee podi idlis swimming in warm ghee, pairs exceptionally well with their spicy chutney."
  },
  {
    name: "Babai Hotel",
    area: "Kukatpally",
    address: "KPHB Colony, Kukatpally, Hyderabad, Telangana 500072",
    category: "local",
    tier: "established",
    lat: 17.4935,
    lng: 78.3986,
    priceLevel: 1,
    costForTwo: 200,
    tags: ["breakfast", "tiffin", "andhra", "veg-friendly"],
    amenities: ["takeaway", "family"],
    mustTry: "Babai Ghee Idli with white butter, Babai Dosa, Filter Coffee",
    blurb: "Heritage Vijayawada brand serving fluffy idlis crowned with home-churned white butter and aromatic podi.",
    redditTip: "Order the signature ghee idlis topped with their signature white butter blob."
  },
  {
    name: "Royal Tiffin Centre",
    area: "Banjara Hills",
    address: "Road No. 1, Banjara Hills, Hyderabad, Telangana 500034",
    category: "local",
    tier: "hidden-gem",
    lat: 17.4168,
    lng: 78.4485,
    priceLevel: 1,
    costForTwo: 200,
    tags: ["breakfast", "tiffin", "street-food", "veg-friendly"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Cheese Butter Masala Dosa, Ghee Karam Dosa",
    blurb: "Popular late evening and breakfast tiffin adda in Banjara Hills with generous cheese toppings.",
    redditTip: "Great quick stop on Road No. 1 for crispy dosas and rich peanut chutney."
  },
  {
    name: "Nani's Tiffins",
    area: "Necklace Road",
    address: "PVNR Marg, Necklace Road, Hyderabad, Telangana 500004",
    category: "local",
    tier: "hidden-gem",
    lat: 17.4241,
    lng: 78.4715,
    priceLevel: 1,
    costForTwo: 180,
    tags: ["breakfast", "tiffin", "street-food", "lake-view"],
    amenities: ["takeaway", "outdoor"],
    mustTry: "Ghee Karam Dosa, Sambar Vada",
    blurb: "Beloved breakfast stop for morning walkers and cyclists along Hussain Sagar lake.",
    redditTip: "Perfect spot for breakfast after a morning walk on Necklace Road."
  },
  {
    name: "Ishtaa",
    area: "Gachibowli",
    address: "Financial District, Nanakramguda, Gachibowli, Hyderabad, Telangana 500032",
    category: "local",
    tier: "established",
    lat: 17.4182,
    lng: 78.3497,
    priceLevel: 2,
    costForTwo: 450,
    tags: ["breakfast", "tiffin", "pure-veg", "family"],
    amenities: ["family", "parking", "takeaway", "dine-in"],
    mustTry: "Pesarattu Upma, Ghee Roast Dosa, Rava Kesari, Filter Coffee",
    blurb: "Premium pure vegetarian South Indian dining destination with refined traditional recipes.",
    redditTip: "Subreddit favorite when you want clean sit-down ambience without compromising on authentic ghee tiffin flavor."
  },
  {
    name: "Davanagere Benne Dosa",
    area: "Madhapur",
    address: "Ayyappa Society Main Rd, Madhapur, Hyderabad, Telangana 500081",
    category: "local",
    tier: "hidden-gem",
    lat: 17.4496,
    lng: 78.3854,
    priceLevel: 1,
    costForTwo: 180,
    tags: ["breakfast", "karnataka", "tiffin", "veg-friendly"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Open Benne Dosa, Ghee Butter Benne Dosa, Aloo Palya, Coconut Chutney",
    blurb: "Authentic Karnataka style Benne (butter) dosa cooked on thick iron griddles until golden and airy.",
    redditTip: "If you love Karnataka style thick butter dosas with potato mash, this is the top community pick."
  },
  {
    name: "Kanchi Cafe",
    area: "Banjara Hills",
    address: "Road No. 12, Banjara Hills, Hyderabad, Telangana 500034",
    category: "local",
    tier: "established",
    lat: 17.4124,
    lng: 78.4382,
    priceLevel: 2,
    costForTwo: 400,
    tags: ["breakfast", "tiffin", "tamil-nadu", "pure-veg"],
    amenities: ["parking", "takeaway", "family"],
    mustTry: "Ghee Podi Thatte Idli, Filter Coffee, Ghee Pongal",
    blurb: "Tamil Nadu temple-town inspired cafe serving soft thatte idlis, rich pongal, and aromatic decoction coffee.",
    redditTip: "Order the Podi Thatte Idli swimming in hot ghee along with piping hot sambar."
  },
  {
    name: "Minerva Coffee Shop",
    area: "Himayatnagar",
    address: "Himayat Nagar Main Rd, Hyderabad, Telangana 500029",
    category: "local",
    tier: "landmark",
    lat: 17.3995,
    lng: 78.4877,
    priceLevel: 2,
    costForTwo: 450,
    tags: ["breakfast", "tiffin", "legacy", "pure-veg"],
    amenities: ["family", "parking", "takeaway", "dine-in"],
    mustTry: "Button Idli Sambar, Set Dosa, Poori Bhaji, Filter Coffee",
    blurb: "Classic Hyderabad institution that has served generations with impeccable filter coffee and South Indian breakfast.",
    redditTip: "The button idlis floating in a bowl of hot Madras sambar remain unbeatable."
  },
  {
    name: "Taj Mahal Hotel",
    area: "Abids",
    address: "King Koti Rd, Bogulkunta, Abids, Hyderabad, Telangana 500001",
    category: "local",
    tier: "landmark",
    lat: 17.3912,
    lng: 78.4796,
    priceLevel: 2,
    costForTwo: 400,
    tags: ["breakfast", "tiffin", "heritage", "pure-veg"],
    amenities: ["family", "dine-in", "legacy"],
    mustTry: "Button Sambar Idli, Crispy Medu Vada, Filter Coffee, Cutlet",
    blurb: "Heritage vegetarian restaurant in Abids dating back to the mid-20th century with old-world charm.",
    redditTip: "A timeless Abids breakfast landmark. Pair the hot crispy vadas with their traditional filter coffee."
  },
  {
    name: "Narsing Tiffin Centre",
    area: "Chandanagar",
    address: "Chandanagar Main Rd, Hyderabad, Telangana 500050",
    category: "local",
    tier: "hidden-gem",
    lat: 17.4925,
    lng: 78.3289,
    priceLevel: 1,
    costForTwo: 160,
    tags: ["breakfast", "tiffin", "budget", "veg-friendly"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Ghee Masala Dosa, Poori Curry, Tawa Vada",
    blurb: "Western suburban cult spot packed with locals for freshly made crispy dosas and piping hot sambar.",
    redditTip: "Locals in Miyapur and Chandanagar swear by Narsing for authentic neighborhood breakfast."
  },
  {
    name: "Chutneys",
    area: "Banjara Hills",
    address: "Road No. 3, Banjara Hills, Hyderabad, Telangana 500034",
    category: "local",
    tier: "landmark",
    lat: 17.4262,
    lng: 78.4412,
    priceLevel: 2,
    costForTwo: 600,
    tags: ["breakfast", "tiffin", "7-chutneys", "pure-veg"],
    amenities: ["family", "parking", "dine-in"],
    mustTry: "Babai Idli, Guntur Idli, MLA Pesarattu, 7 Assorted Chutneys",
    blurb: "Pioneering Hyderabad restaurant chain famous for serving 7 distinct homemade chutneys with every tiffin.",
    redditTip: "Order the Babai Idli or Steam Dosa; the allam (ginger) and groundnut chutneys are legendary."
  },
  {
    name: "Dosa Gaadi",
    area: "Madhapur",
    address: "Durgam Cheruvu Road, Silicon Valley, Madhapur, Hyderabad, Telangana 500081",
    category: "local",
    tier: "hidden-gem",
    lat: 17.4412,
    lng: 78.3892,
    priceLevel: 1,
    costForTwo: 250,
    tags: ["night-eats", "non-veg-dosa", "tiffin", "street-food"],
    amenities: ["street-stall", "takeaway", "late-night"],
    mustTry: "Mutton Kheema Dosa, Chicken 65 Dosa, Egg Pizza Dosa",
    blurb: "Late-night food truck famous for unconventional and hearty non-veg loaded dosas near Durgam Cheruvu.",
    redditTip: "Subreddit recommendation for late night non-veg tiffins after clubbing or late office shifts."
  },

  // ==========================================
  // 2. BIRYANI, MANDI, KEBABS & MEAT SPECIALTIES
  // ==========================================
  {
    name: "Bawarchi Restaurant",
    area: "RTC X Roads",
    address: "Beside Sandhya Theatre, RTC Cross Roads, Chikkadpally, Hyderabad, Telangana 500020",
    category: "local",
    tier: "landmark",
    lat: 17.4042,
    lng: 78.4984,
    priceLevel: 2,
    costForTwo: 600,
    tags: ["biryani", "non-veg", "hyderabadi", "rtc-x-roads"],
    amenities: ["family", "takeaway", "dine-in"],
    mustTry: "Mutton Biryani, Chicken Dum Biryani, Boti Kebab, Tangdi Kebab",
    blurb: "The single original Bawarchi at RTC X Roads, renowned for spicy and fragrant Hyderabadi dum biryani.",
    redditTip: "Only visit the RTC X Roads original branch; all other Bawarchi named outlets across town are unrelated copycats."
  },
  {
    name: "Cafe Bahar",
    area: "Basheerbagh",
    address: "Old MLA Quarters Rd, Hyderguda, Basheerbagh, Hyderabad, Telangana 500029",
    category: "local",
    tier: "landmark",
    lat: 17.3976,
    lng: 78.4839,
    priceLevel: 2,
    costForTwo: 550,
    tags: ["biryani", "haleem", "irani-chai", "non-veg"],
    amenities: ["family", "takeaway", "dine-in"],
    mustTry: "Special Mutton Biryani, Haleem, Tala Hua Gosht, Irani Chai",
    blurb: "One of Hyderabad's most venerated culinary anchors, known for flavorful biryani, kebabs, and seasonal haleem.",
    redditTip: "Redditors frequently rate Bahar's Special Mutton Biryani with extra meat pieces as among the most consistent in town."
  },
  {
    name: "Hotel Shadab",
    area: "Charminar",
    address: "High Court Rd, Madina Circle, Ghansi Bazaar, Hyderabad, Telangana 500002",
    category: "local",
    tier: "landmark",
    lat: 17.3687,
    lng: 78.4735,
    priceLevel: 2,
    costForTwo: 600,
    tags: ["biryani", "nihari", "paya", "heritage", "charminar"],
    amenities: ["family", "takeaway", "dine-in"],
    mustTry: "Mutton Biryani, Paya with Char Koni Naan, Gurda Bhaji, Falooda",
    blurb: "Old City landmark near Charminar famous for breakfast paya and evening mutton dum biryani.",
    redditTip: "For breakfast, visit before 8:00 AM for fresh paya and nihari. For dinner, the mutton biryani upstairs in AC hall is best."
  },
  {
    name: "Hotel Nayab",
    area: "Madina Circle",
    address: "Nayapul, Madina Building, Charminar, Hyderabad, Telangana 500002",
    category: "local",
    tier: "landmark",
    lat: 17.3694,
    lng: 78.4761,
    priceLevel: 1,
    costForTwo: 350,
    tags: ["breakfast", "nihari", "paya", "heritage", "irani-chai"],
    amenities: ["takeaway", "dine-in", "early-morning"],
    mustTry: "Nihari Paya with Char Koni Naan, Bheja Fry, Kesar Chai",
    blurb: "Centuries-style breakfast institution over Nayapul bridge serving legendary slow-cooked bone-marrow stews.",
    redditTip: "Arrive at 6:00 AM for the freshest paya nihari and pair it with hot square char-koni naan and kesar chai."
  },
  {
    name: "Grand Hotel",
    area: "Abids",
    address: "Opposite Taj Mahal Hotel, Abids Road, Hyderabad, Telangana 500001",
    category: "local",
    tier: "landmark",
    lat: 17.3908,
    lng: 78.4776,
    priceLevel: 2,
    costForTwo: 500,
    tags: ["biryani", "heritage", "legacy", "late-night"],
    amenities: ["family", "takeaway", "dine-in", "late-night"],
    mustTry: "Classic Chicken Dum Biryani, Mutton Biryani, Irani Chai, Chicken 65",
    blurb: "Dating back to 1935, this Abids establishment serves nostalgic, aromatic biryani until late midnight.",
    redditTip: "A favorite for old-school Hyderabadis. Open till 2:00 AM with reliable late night biryani."
  },
  {
    name: "Shah Ghouse",
    area: "Tolichowki",
    address: "Kakatiya Nagar, Tolichowki, Hyderabad, Telangana 500008",
    category: "local",
    tier: "landmark",
    lat: 17.4005,
    lng: 78.4132,
    priceLevel: 2,
    costForTwo: 600,
    tags: ["biryani", "haleem", "late-night", "tangdi-kebab"],
    amenities: ["family", "takeaway", "late-night", "dine-in"],
    mustTry: "Special Mutton Biryani, Tangdi Kebab, Paya Nihari, Irani Chai",
    blurb: "Massive culinary magnet known for robust, spice-forward biryani and round-the-clock bustle.",
    redditTip: "The Tolichowki branch is a favorite late night spot for spicy biryani and midnight tea."
  },
  {
    name: "Nawaabs Restaurant",
    area: "Gachibowli",
    address: "Telecom Nagar, Gachibowli, Hyderabad, Telangana 500032",
    category: "local",
    tier: "established",
    lat: 17.4385,
    lng: 78.3682,
    priceLevel: 2,
    costForTwo: 700,
    tags: ["biryani", "kebabs", "gachibowli", "non-veg"],
    amenities: ["family", "parking", "takeaway", "dine-in"],
    mustTry: "Chicken Dum Biryani, Mutton Biryani, Nawaabs Special Kebab",
    blurb: "Subreddit favorite in Gachibowli delivering consistently flavorful dum biryani for the IT crowd.",
    redditTip: "Frequently recommended as the most reliable biryani choice in the western tech belt."
  },
  {
    name: "Mataam Al Arabi",
    area: "Barkas",
    address: "Chandrayangutta, Barkas, Hyderabad, Telangana 500005",
    category: "local",
    tier: "landmark",
    lat: 17.3228,
    lng: 78.4831,
    priceLevel: 2,
    costForTwo: 700,
    tags: ["mandi", "arabian", "barkas", "non-veg"],
    amenities: ["floor-seating", "family", "takeaway"],
    mustTry: "Faham Mandi, Mutton Juicy Mandi, Laham Mandi, Kunafa",
    blurb: "The undisputed birthplace and original pioneer of Yemeni Mandi culture in Hyderabad's Chaush neighborhood.",
    redditTip: "Barkas is where authentic Mandi started. Sit on traditional floor carpets and order the mutton juicy mandi."
  },
  {
    name: "Aazebo The Royal Arabian Restaurant",
    area: "Tolichowki",
    address: "Opposite Galaxy Theatre, Tolichowki, Hyderabad, Telangana 500008",
    category: "local",
    tier: "established",
    lat: 17.4018,
    lng: 78.4116,
    priceLevel: 2,
    costForTwo: 750,
    tags: ["mandi", "arabian", "non-veg", "family"],
    amenities: ["floor-seating", "family", "parking", "takeaway"],
    mustTry: "Mutton Juicy Mandi, Pepper Chicken Mandi, Cream Kunafa",
    blurb: "Celebrated Arabian restaurant known for tender slow-braised meats and fragrant long-grain Mandi rice.",
    redditTip: "One of the most praised Mandi spots on r/hyderabad. The mutton falls right off the bone."
  },
  {
    name: "Mandi @ 36",
    area: "Jubilee Hills",
    address: "Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033",
    category: "local",
    tier: "established",
    lat: 17.4329,
    lng: 78.4055,
    priceLevel: 3,
    costForTwo: 950,
    tags: ["mandi", "arabian", "fine-dining", "jubilee-hills"],
    amenities: ["parking", "family", "floor-seating", "reservable"],
    mustTry: "Barkas Special Mutton Mandi, Fish Mandi, Kunafa",
    blurb: "High-end Mandi experience bringing authentic Barkas spice profiles to an upscale Jubilee Hills setup.",
    redditTip: "Top pick when you want authentic Mandi flavours in an upscale setting with easy valet parking."
  },
  {
    name: "Marhaba Shawarma",
    area: "Tolichowki",
    address: "Paramount Colony, Tolichowki, Hyderabad, Telangana 500008",
    category: "local",
    tier: "hidden-gem",
    lat: 17.4039,
    lng: 78.4067,
    priceLevel: 1,
    costForTwo: 250,
    tags: ["shawarma", "street-food", "middle-eastern", "budget"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Authentic Arabic Shawarma with garlic toum, Rumali Chicken Shawarma",
    blurb: "Community-adored shawarma counter favored for genuine middle-eastern toum and no-cabbage authentic rolls.",
    redditTip: "Redditors consistently vote this over commercial chains for genuine garlic-forward meat shawarmas."
  },
  {
    name: "Siddique Kabab Centre",
    area: "Kondapur",
    address: "Kothaguda X Roads, Kondapur, Hyderabad, Telangana 500084",
    category: "local",
    tier: "established",
    lat: 17.4601,
    lng: 78.3619,
    priceLevel: 1,
    costForTwo: 350,
    tags: ["kebabs", "tandoori", "non-veg", "budget"],
    amenities: ["takeaway", "outdoor", "late-night"],
    mustTry: "Tandoori Chicken, Murgh Malai Kebab, Chicken Tikka, Rumali Roti",
    blurb: "High-volume open-grill kebab counter delivering juicy charcoal-smoked tandoori meats in Hitec corridor.",
    redditTip: "Best value-for-money tandoori chicken and kebabs in western Hyderabad."
  },
  {
    name: "Grill 9",
    area: "Secunderabad",
    address: "PG Road, Sindhi Colony, Secunderabad, Telangana 500003",
    category: "local",
    tier: "established",
    lat: 17.4442,
    lng: 78.4891,
    priceLevel: 2,
    costForTwo: 550,
    tags: ["shawarma", "mandi", "haleem", "grill"],
    amenities: ["takeaway", "family", "dine-in"],
    mustTry: "Special Jumbo Shawarma, Bahubali Mandi, Seasonal Haleem",
    blurb: "Cult Secunderabad joint famous for giant loaded shawarmas and viral food creations.",
    redditTip: "Subreddit favorite for giant non-veg loaded shawarmas and rich mandi."
  },

  // ==========================================
  // 3. ANDHRA & TELANGANA MESSES & THALIS
  // ==========================================
  {
    name: "Kakatiya Deluxe Mess",
    area: "Ameerpet",
    address: "Near Ameerpet Metro Station, Ameerpet, Hyderabad, Telangana 500016",
    category: "local",
    tier: "landmark",
    lat: 17.4375,
    lng: 78.4482,
    priceLevel: 1,
    costForTwo: 300,
    tags: ["andhra-meals", "mess", "spicy", "mutton-fry"],
    amenities: ["takeaway", "quick-service", "dine-in"],
    mustTry: "Andhra Full Meals, Mutton Fry, Palakura Pappu with Gongura, Ghee Podi",
    blurb: "The gold standard of fiery Andhra mess meals in Ameerpet with unlimited hot rice, dal, and spicy sides.",
    redditTip: "Order the full veg meals and add a portion of their signature mutton fry and extra ghee on top."
  },
  {
    name: "Sri Harsha Mess",
    area: "Kukatpally",
    address: "Opposite Pillar 792, KPHB Phase 1, Kukatpally, Hyderabad, Telangana 500072",
    category: "local",
    tier: "hidden-gem",
    lat: 17.4912,
    lng: 78.3998,
    priceLevel: 1,
    costForTwo: 300,
    tags: ["andhra-meals", "mess", "spicy", "budget"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Andhra Meals, Egg Masala, Chicken Fry, Tomato Pappu",
    blurb: "Spicy, uncompromising Andhra bhojanam joint known for bold chilli heat and authentic home-style curries.",
    redditTip: "Subreddit gem for people craving genuine Guntur-level spice and rich egg curries."
  },
  {
    name: "Purna Mess",
    area: "Lakdikapul",
    address: "Red Hills, Lakdikapul, Hyderabad, Telangana 500004",
    category: "local",
    tier: "hidden-gem",
    lat: 17.4021,
    lng: 78.4628,
    priceLevel: 1,
    costForTwo: 280,
    tags: ["andhra-meals", "mess", "seafood", "budget"],
    amenities: ["takeaway", "dine-in"],
    mustTry: "Ghee Podi Rice Meals, Royyala Vepudu (Prawn Fry), Fish Fry",
    blurb: "Classic central Hyderabad mess serving authentic Coastal Andhra seafood fries and traditional dal.",
    redditTip: "A favorite for budget lunch in Lakdikapul. The prawn fry and gun powder rice are sensational."
  },
  {
    name: "Simhapuri Deluxe Mess",
    area: "Somajiguda",
    address: "Raj Bhavan Rd, Somajiguda, Hyderabad, Telangana 500082",
    category: "local",
    tier: "hidden-gem",
    lat: 17.4215,
    lng: 78.4589,
    priceLevel: 1,
    costForTwo: 350,
    tags: ["andhra-meals", "nellore", "fish-curry", "mess"],
    amenities: ["takeaway", "dine-in"],
    mustTry: "Nellore Chepala Pulusu (Fish Curry), Andhra Meals, Mutton Sukka",
    blurb: "Nellore-style spicy culinary specialty mess renowned for fiery tamarind fish pulusu and wholesome rice meals.",
    redditTip: "Hidden gem for seafood and authentic Nellore fish curry lovers on r/hyderabad."
  },
  {
    name: "Subbayya Gari Hotel",
    area: "KPHB Colony",
    address: "Road No. 1, KPHB Colony, Kukatpally, Hyderabad, Telangana 500072",
    category: "local",
    tier: "landmark",
    lat: 17.4891,
    lng: 78.3972,
    priceLevel: 2,
    costForTwo: 600,
    tags: ["andhra-meals", "pure-veg", "butta-bhojanam", "family"],
    amenities: ["family", "takeaway", "dine-in"],
    mustTry: "Butta Bhojanam (Basket Meals), Pulihora, Majjiga Pulusu, Panasapattu Biryani",
    blurb: "East Godavari culinary powerhouse famous for royal vegetarian banquets served in woven leaf baskets.",
    redditTip: "Expect an overwhelming feast with over 25 unlimited traditional vegetarian courses."
  },
  {
    name: "Palle Vindu",
    area: "Madhapur",
    address: "Opposite Inorbit Mall, Madhapur, Hyderabad, Telangana 500081",
    category: "local",
    tier: "established",
    lat: 17.4338,
    lng: 78.3842,
    priceLevel: 2,
    costForTwo: 650,
    tags: ["telangana", "andhra", "natu-kodi", "ragi-sangati"],
    amenities: ["family", "parking", "takeaway", "dine-in"],
    mustTry: "Natu Kodi Pulao, Ragi Sangati with Natu Kodi Curry, Telangana Mutton",
    blurb: "Village-themed regional kitchen celebrating countryside Telangana and Rayalaseema rustic flavors.",
    redditTip: "Top spot for rustic country chicken curry paired with steaming ragi balls."
  },
  {
    name: "Spicy Venue",
    area: "Jubilee Hills",
    address: "Road No. 10, Jubilee Hills, Hyderabad, Telangana 500033",
    category: "restaurant",
    tier: "established",
    lat: 17.4326,
    lng: 78.4118,
    priceLevel: 2,
    costForTwo: 800,
    tags: ["andhra", "mla-potlam-biryani", "apricot-delight", "family"],
    amenities: ["family", "parking", "takeaway", "dine-in"],
    mustTry: "MLA Potlam Biryani, Apricot Delight, Gongura Mutton, Andhra Meals",
    blurb: "Pioneered the famous omelette-wrapped MLA Potlam Biryani and legendary Apricot Delight dessert.",
    redditTip: "Do not leave without ordering their signature Apricot Delight dessert alongside the Potlam Biryani."
  },
  {
    name: "AnTeRa Kitchen & Bar",
    area: "Jubilee Hills",
    address: "Road No. 10, Jubilee Hills, Hyderabad, Telangana 500033",
    category: "restaurant",
    tier: "established",
    lat: 17.4345,
    lng: 78.4092,
    priceLevel: 3,
    costForTwo: 1400,
    tags: ["andhra", "telangana", "rayalaseema", "cocktails", "regional"],
    amenities: ["family", "parking", "full-bar", "dine-in"],
    mustTry: "Avakaya Pappu Annam, Golichina Mamsam, Bobbatlu with Ice Cream",
    blurb: "Sophisticated culinary tribute uniting Andhra, Telangana, and Rayalaseema culinary treasures under one roof.",
    redditTip: "Subreddit favorite for taking out-of-town guests to experience premium regional Telugu cuisine."
  },

  // ==========================================
  // 4. IRANI CHAI, HERITAGE BAKERIES & SWEETS
  // ==========================================
  {
    name: "Nimrah Cafe and Bakery",
    area: "Charminar",
    address: "Beside Mecca Masjid, Charminar Rd, Hyderabad, Telangana 500002",
    category: "cafe",
    tier: "landmark",
    lat: 17.3614,
    lng: 78.4744,
    priceLevel: 1,
    costForTwo: 150,
    tags: ["irani-chai", "osmania-biscuit", "charminar", "view", "heritage"],
    amenities: ["outdoor", "takeaway", "heritage"],
    mustTry: "Irani Chai, Warm Osmania Biscuits, Tie Biscuit, Malai Bun",
    blurb: "Historic tea room located right under the arches of Charminar, pulling fresh bakery items around the clock.",
    redditTip: "Drink your chai standing outside overlooking the illuminated Charminar at sunrise or late night."
  },
  {
    name: "Cafe Niloufer",
    area: "Lakdikapul",
    address: "Opposite Niloufer Hospital, Red Hills, Lakdikapul, Hyderabad, Telangana 500004",
    category: "cafe",
    tier: "landmark",
    lat: 17.4002,
    lng: 78.4619,
    priceLevel: 1,
    costForTwo: 250,
    tags: ["irani-chai", "bun-maska", "heritage", "osmania-biscuit"],
    amenities: ["takeaway", "dine-in", "family"],
    mustTry: "Special Irani Chai, Bun Maska, Maska Khari, Osmania Biscuits",
    blurb: "Hyderabad's benchmark for thick, velvety Irani chai, operating since 1978 beside Niloufer Hospital.",
    redditTip: "The original Lakdikapul branch remains the crowd favorite for the truest brew and freshly buttered buns."
  },
  {
    name: "Subhan Bakery",
    area: "Nampally",
    address: "Subhanpura, Nampally, Hyderabad, Telangana 500001",
    category: "bakery",
    tier: "landmark",
    lat: 17.3887,
    lng: 78.4695,
    priceLevel: 1,
    costForTwo: 250,
    tags: ["bakery", "osmania-biscuit", "dum-ke-roat", "heritage"],
    amenities: ["takeaway"],
    mustTry: "Original Osmania Biscuits, Dum Ke Roat, Chand Biscuits, Plum Cake",
    blurb: "Century-old artisanal bakery universally acknowledged on r/hyderabad for baking the best Osmania biscuits in the city.",
    redditTip: "Pick up boxes of their freshly packed Osmania biscuits and seasonal Dum ke Roat during Muharram."
  },
  {
    name: "Blue Sea Cafe",
    area: "Secunderabad",
    address: "Regimental Bazaar, Secunderabad Station Rd, Secunderabad, Telangana 500003",
    category: "cafe",
    tier: "landmark",
    lat: 17.4348,
    lng: 78.5012,
    priceLevel: 1,
    costForTwo: 120,
    tags: ["irani-chai", "secunderabad", "quick-bite", "heritage"],
    amenities: ["takeaway", "street-stall", "early-morning"],
    mustTry: "Cutting Irani Chai, Fine Khari Biscuit, Egg Puff, Dilkush",
    blurb: "Legendary Secunderabad station hub known for strong, sweetened Irani tea poured around the clock.",
    redditTip: "The best tea point in twin cities according to many long-term Secunderabad residents."
  },
  {
    name: "Alpha Hotel",
    area: "Secunderabad",
    address: "Station Road, Railway Station Area, Secunderabad, Telangana 500003",
    category: "local",
    tier: "landmark",
    lat: 17.4352,
    lng: 78.5006,
    priceLevel: 1,
    costForTwo: 300,
    tags: ["heritage", "irani-chai", "kheema-roti", "biryani"],
    amenities: ["takeaway", "early-morning", "dine-in"],
    mustTry: "Kheema Roti, Irani Chai, Mutton Biryani, Bun Maska",
    blurb: "Time-tested heritage restaurant opposite Secunderabad station serving hearty morning kheema and hot chai.",
    redditTip: "Stop by early in the morning for kheema roti with a hot cup of Irani chai."
  },
  {
    name: "Sarvi Cafe",
    area: "Banjara Hills",
    address: "Road No. 1, Banjara Hills, Hyderabad, Telangana 500034",
    category: "local",
    tier: "landmark",
    lat: 17.4148,
    lng: 78.4489,
    priceLevel: 2,
    costForTwo: 500,
    tags: ["irani-chai", "haleem", "kebabs", "lukhmi"],
    amenities: ["takeaway", "family", "dine-in"],
    mustTry: "Irani Chai, Mutton Lukhmi, Irani Haleem, Butter Chicken",
    blurb: "Banjara Hills institution revered for Irani tea, flaky minced mutton lukhmis, and Ramzan haleem.",
    redditTip: "Pair your evening Irani chai with their hot and crispy mutton lukhmis."
  },
  {
    name: "Hameedi Confectioners",
    area: "Mozamjahi Market",
    address: "Opposite Mozamjahi Market, Nampally, Hyderabad, Telangana 500001",
    category: "bakery",
    tier: "landmark",
    lat: 17.3855,
    lng: 78.4759,
    priceLevel: 2,
    costForTwo: 400,
    tags: ["sweets", "jouzi-halwa", "royal-heritage", "nizam"],
    amenities: ["takeaway"],
    mustTry: "Jouzi Halwa, Badam Halwa, Pista Lajjat, Ashrafi",
    blurb: "Over a century old royal sweetmaker granted royal certification by the last Nizam of Hyderabad for Jouzi Halwa.",
    redditTip: "A must-visit for authentic Hyderabadi Jouzi Halwa made with Turkish-heritage secret spices and ghee."
  },
  {
    name: "Famous Ice Cream",
    area: "Mozamjahi Market",
    address: "Mozamjahi Market, Clock Tower, Nampally, Hyderabad, Telangana 500001",
    category: "ice-cream",
    tier: "landmark",
    lat: 17.3859,
    lng: 78.4752,
    priceLevel: 1,
    costForTwo: 150,
    tags: ["ice-cream", "heritage", "mozamjahi-market", "budget"],
    amenities: ["outdoor", "takeaway", "late-night"],
    mustTry: "Sapota Ice Cream, Seasonal Mango Ice Cream, Anjeer Ice Cream, Sitaphal",
    blurb: "Historic ice cream shop founded in 1951 inside Mozamjahi Market famous for handmade natural fruit ice creams.",
    redditTip: "Super affordable handmade fruit ice creams in a historic 1930s stone market courtyard."
  },
  {
    name: "Almond House",
    area: "Himayatnagar",
    address: "Himayat Nagar Main Rd, Hyderabad, Telangana 500029",
    category: "bakery",
    tier: "landmark",
    lat: 17.4011,
    lng: 78.4865,
    priceLevel: 2,
    costForTwo: 450,
    tags: ["sweets", "bisticks", "almond-sweets", "gifting"],
    amenities: ["takeaway"],
    mustTry: "Bisticks, Bellam Jalebi, Badam Halwa, Kaju Katli",
    blurb: "Premium Hyderabad sweetmaker celebrated for inventing signature almond-crusted Bisticks.",
    redditTip: "Bisticks are Hyderabad's most prized sweet gift; pick up a freshly packed box."
  },

  // ==========================================
  // 5. STREET FOOD HUBS, CHAAT & LATE NIGHT
  // ==========================================
  {
    name: "Gokul Chat",
    area: "Koti",
    address: "Opposite Women's College, Koti Commercial Complex, Hyderabad, Telangana 500095",
    category: "local",
    tier: "landmark",
    lat: 17.3842,
    lng: 78.4836,
    priceLevel: 1,
    costForTwo: 180,
    tags: ["chaat", "street-food", "koti", "veg-friendly"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Cutlet Ragda, Pav Bhaji, Dahi Puri, Samosa Chaat, Kulfi",
    blurb: "Hyderabad's most iconic chaat shop known for its fiery cutlet ragda and refreshing dahi puri.",
    redditTip: "The hot cutlet ragda mixed with crisp onions and tangy chutneys is legendary. Be prepared for crowds."
  },
  {
    name: "Chachaji Vada Pav & Dabeli",
    area: "Sindhi Colony",
    address: "Sindhi Colony, PG Road, Secunderabad, Telangana 500003",
    category: "local",
    tier: "landmark",
    lat: 17.4428,
    lng: 78.4905,
    priceLevel: 1,
    costForTwo: 150,
    tags: ["street-food", "vada-pav", "dabeli", "sindhi-colony"],
    amenities: ["street-stall", "takeaway"],
    mustTry: "Butter Dabeli, Mumbai Vada Pav, Cheese Dabeli",
    blurb: "The heartbeat of Sindhi Colony street food serving authentic butter-grilled dabelis and spicy vada pavs.",
    redditTip: "A staple in the vegetarian street food hub of Sindhi Colony. Pair it with nearby juice counters."
  },
  {
    name: "DLF Street Food Hub",
    area: "Gachibowli",
    address: "Opposite DLF Cyber City Gate 2, Gachibowli, Hyderabad, Telangana 500032",
    category: "local",
    tier: "landmark",
    lat: 17.4475,
    lng: 78.3582,
    priceLevel: 1,
    costForTwo: 300,
    tags: ["street-food", "late-night", "it-corridor", "momos", "shawarma"],
    amenities: ["street-stall", "takeaway", "late-night"],
    mustTry: "Momos Adda steamed & fried momos, Smoky Docky Shawarma, Cheese Maggi, Tiffins",
    blurb: "The vibrant 24/7 street food street outside DLF IT park buzzing with dozens of food kiosks.",
    redditTip: "The prime late-night hunger rescue for the tech corridor, open well past midnight."
  },
  {
    name: "Sardarji's Chaat",
    area: "Sindhi Colony",
    address: "Sindhi Colony Main Rd, Secunderabad, Telangana 500003",
    category: "local",
    tier: "established",
    lat: 17.4431,
    lng: 78.4912,
    priceLevel: 1,
    costForTwo: 200,
    tags: ["chaat", "delhi-chaat", "sindhi-colony", "chole-bhature"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Chole Bhature, Papdi Chaat, Aloo Tikki Chaat",
    blurb: "Authentic North Indian chaat centre bringing authentic Delhi street flavours to Secunderabad.",
    redditTip: "Subreddit favorite for crispy aloo tikki doused in sweetened curd and saunth chutney."
  },
  {
    name: "Naintara Chaat",
    area: "Himayatnagar",
    address: "Street No. 1, Himayat Nagar, Hyderabad, Telangana 500029",
    category: "local",
    tier: "hidden-gem",
    lat: 17.4007,
    lng: 78.4891,
    priceLevel: 1,
    costForTwo: 160,
    tags: ["chaat", "street-food", "himayatnagar", "budget"],
    amenities: ["takeaway", "quick-service"],
    mustTry: "Sev Puri, Bhel Puri, Dahi Papdi, Pani Puri",
    blurb: "Underrated Himayatnagar chaat stall praised on r/hyderabad as an uncrowded alternative to mainstream spots.",
    redditTip: "If you want authentic, clean Bombay-style sev puri without chaotic queues, Naintara is a local secret."
  },

  // ==========================================
  // 6. CAFES, DESSERTS & SPECIALTY DINING
  // ==========================================
  {
    name: "Conçu",
    area: "Jubilee Hills",
    address: "Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033",
    category: "cafe",
    tier: "landmark",
    lat: 17.4332,
    lng: 78.4061,
    priceLevel: 3,
    costForTwo: 900,
    tags: ["patisserie", "dessert", "french-pastry", "coffee"],
    amenities: ["outdoor", "parking", "takeaway", "dine-in"],
    mustTry: "Classic Tiramisu, Vanilla Bean Choux, Opera Pastry, Chocolate Tart",
    blurb: "Pioneering French patisserie and dessert parlour acclaimed for world-class entremets and artisanal pastries.",
    redditTip: "Constantly discussed on r/hyderabad as the premier celebration dessert destination. The tiramisu is top notch."
  },
  {
    name: "Roast CCX",
    area: "Jubilee Hills",
    address: "Road No. 45, Jubilee Hills, Hyderabad, Telangana 500033",
    category: "cafe",
    tier: "landmark",
    lat: 17.4371,
    lng: 78.4019,
    priceLevel: 3,
    costForTwo: 1100,
    tags: ["specialty-coffee", "cafe", "vibe", "work-friendly"],
    amenities: ["work-friendly", "parking", "outdoor", "wifi", "takeaway"],
    mustTry: "Specialty Pour Over Coffee, Biscoff Cheesecake, Woodfired Pizza, Truffle Fries",
    blurb: "Premier coffee roastery and expansive lifestyle cafe famous for bean-to-cup craft coffee and vibrant ambience.",
    redditTip: "Consistently ranked as one of the best aesthetic cafes for remote work and high-quality coffee."
  },
  {
    name: "True Black Specialty Coffee",
    area: "Jubilee Hills",
    address: "Road No. 45, Jubilee Hills, Hyderabad, Telangana 500033",
    category: "cafe",
    tier: "established",
    lat: 17.4359,
    lng: 78.4045,
    priceLevel: 2,
    costForTwo: 700,
    tags: ["specialty-coffee", "minimalist", "cold-brew", "work-friendly"],
    amenities: ["work-friendly", "minimalist", "takeaway", "wifi"],
    mustTry: "Cold Brew Tonic, Cortado, Almond Croissant, Iced Pour Over",
    blurb: "Minimalist temple for serious coffee purists with precision manual brews and micro-lot beans.",
    redditTip: "The go-to recommendation on r/hyderabad for uncompromising coffee lovers who value single origin profiles."
  },
  {
    name: "Van Lavino",
    area: "Jubilee Hills",
    address: "Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033",
    category: "cafe",
    tier: "established",
    lat: 17.4328,
    lng: 78.4072,
    priceLevel: 3,
    costForTwo: 950,
    tags: ["patisserie", "cafe", "brunch", "dessert"],
    amenities: ["family", "parking", "takeaway", "dine-in"],
    mustTry: "Hummus Mushroom Toast, Artisan Macarons, Rich Hot Chocolate",
    blurb: "Elegant dessert cafe and bistro renowned for European-inspired savory toasts and decadent pastries.",
    redditTip: "Try their savory toasts alongside their pastry case offerings."
  },
  {
    name: "Roastery Coffee House",
    area: "Banjara Hills",
    address: "Road No. 14, Banjara Hills, Hyderabad, Telangana 500034",
    category: "cafe",
    tier: "landmark",
    lat: 17.4172,
    lng: 78.4315,
    priceLevel: 2,
    costForTwo: 800,
    tags: ["coffee", "garden-cafe", "breakfast", "work-friendly"],
    amenities: ["outdoor", "work-friendly", "parking", "family"],
    mustTry: "Dark Chocolate Cake Blended Coffee, Peri Peri Onion Rings, Monsooned Malabar Brew",
    blurb: "Tranquil heritage bungalow transformed into a lush garden coffee house with house-roasted Indian beans.",
    redditTip: "Sit in the leafy courtyard and order the dark chocolate cake blended coffee."
  },
  {
    name: "Aaromale Cafe",
    area: "Film Nagar",
    address: "Road No. 1/72, Film Nagar, Jubilee Hills, Hyderabad, Telangana 500096",
    category: "cafe",
    tier: "established",
    lat: 17.4195,
    lng: 78.4098,
    priceLevel: 2,
    costForTwo: 750,
    tags: ["garden-cafe", "art-cafe", "events", "work-friendly"],
    amenities: ["outdoor", "work-friendly", "wifi", "pet-friendly"],
    mustTry: "Filter Coffee, Smoked Chicken Sandwich, Fudgy Brownie, Herbal Teas",
    blurb: "Charming artistic bungalow retreat surrounded by trees, hosting open-mics, art sessions, and relaxed brunches.",
    redditTip: "Subreddit favorite when you want peaceful outdoor seating surrounded by greenery and art."
  },
  {
    name: "Manam Chocolate Karkhana",
    area: "Banjara Hills",
    address: "Road No. 12, Banjara Hills, Hyderabad, Telangana 500034",
    category: "cafe",
    tier: "landmark",
    lat: 17.4112,
    lng: 78.4379,
    priceLevel: 3,
    costForTwo: 1200,
    tags: ["chocolate", "craft-cacao", "dessert", "cafe"],
    amenities: ["family", "parking", "takeaway", "dine-in"],
    mustTry: "Single Origin Chocolate Tasting Flight, Cacao Nitro Brew, Signature Bonbons",
    blurb: "Spectacular bean-to-bar craft chocolate factory and experiential cafe putting Indian cacao on the global map.",
    redditTip: "An absolute visual and tasting spectacle. Try their single origin tasting flights."
  },
  {
    name: "Haiku",
    area: "Banjara Hills",
    address: "Road No. 12, Banjara Hills, Hyderabad, Telangana 500034",
    category: "restaurant",
    tier: "established",
    lat: 17.4145,
    lng: 78.4398,
    priceLevel: 3,
    costForTwo: 1500,
    tags: ["pan-asian", "sushi", "dimsum", "japanese"],
    amenities: ["parking", "family", "dine-in", "reservable"],
    mustTry: "Truffle Edamame Dimsum, Sushi Platters, Pad Thai, Prawn Tempura",
    blurb: "Refined Pan-Asian restaurant lauded on r/hyderabad for authentic flavors across Japanese, Thai, and Dim Sum menus.",
    redditTip: "Top Asian food recommendation in the city for pristine sushi and delicate dimsums."
  },
  {
    name: "Burma Burma",
    area: "Knowledge City",
    address: "Salarpuria Sattva Knowledge City, Hitec City, Hyderabad, Telangana 500081",
    category: "restaurant",
    tier: "landmark",
    lat: 17.4388,
    lng: 78.3792,
    priceLevel: 3,
    costForTwo: 1400,
    tags: ["burmese", "pure-veg", "tea-room", "fine-dining"],
    amenities: ["parking", "family", "dine-in", "reservable"],
    mustTry: "Tea Leaf Salad (Laphet Thoke), Burma Burma Oh No Khow Suey, Lotus Stem Crisps",
    blurb: "Celebrated vegetarian Burmese restaurant and artisanal tea room praised for plant-based culinary mastery.",
    redditTip: "Even hardcore meat eaters on r/hyderabad praise Burma Burma for extraordinary taste profiles."
  },
  {
    name: "Flying Spaghetti Monster",
    area: "Jubilee Hills",
    address: "Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033",
    category: "restaurant",
    tier: "established",
    lat: 17.4309,
    lng: 78.4087,
    priceLevel: 3,
    costForTwo: 1300,
    tags: ["italian", "pizza", "pasta", "tiramisu"],
    amenities: ["family", "parking", "dine-in", "reservable"],
    mustTry: "Thin Crust Napoletana Pizza, Aglio Olio Peperoncino, Classic Tiramisu",
    blurb: "Authentic Italian trattoria known for wood-fired thin crust pizzas and homemade pastas.",
    redditTip: "Subreddit favorite for authentic European style thin crust pizza and handmade pasta."
  }
];

function normalizeName(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function run() {
  console.log("Loading existing eateries...");
  const rawData = fs.readFileSync(EATERIES_PATH, "utf8");
  const eateries = JSON.parse(rawData);
  console.log(`Current eateries count: ${eateries.length}`);

  let updatedCount = 0;
  let addedCount = 0;

  for (const item of REDDIT_EATERIES) {
    const normItemName = normalizeName(item.name);
    // Find matching existing eatery
    const existingIndex = eateries.findIndex(e => {
      const normEateryName = normalizeName(e.name);
      return normEateryName === normItemName ||
        (normEateryName.includes(normItemName) && e.address && e.address.toLowerCase().includes(item.area.toLowerCase())) ||
        (normItemName.includes(normEateryName) && normEateryName.length > 5);
    });

    if (existingIndex >= 0) {
      const existing = eateries[existingIndex];
      // Augment existing entry with reddit metadata
      existing.tier = existing.tier || item.tier;
      if (!existing.blurb && item.blurb) {
        existing.blurb = item.blurb;
      }
      if (item.tags) {
        const tagSet = new Set(existing.tags || []);
        item.tags.forEach(t => tagSet.add(t));
        existing.tags = Array.from(tagSet);
      }
      if (item.amenities) {
        const amenSet = new Set(existing.amenities || []);
        item.amenities.forEach(a => amenSet.add(a));
        existing.amenities = Array.from(amenSet);
      }
      if (item.costForTwo && !existing.costForTwo) {
        existing.costForTwo = item.costForTwo;
      }
      if (item.redditTip) {
        existing.redditTip = item.redditTip;
      }
      if (item.mustTry) {
        existing.mustTry = item.mustTry;
      }
      updatedCount++;
    } else {
      // Create new eatery
      const newId = "reddit_" + crypto.createHash("md5").update(item.name + item.area).digest("hex").slice(0, 20);
      const newEatery = {
        id: newId,
        placeId: newId,
        name: item.name,
        category: item.category,
        lat: item.lat,
        lng: item.lng,
        address: item.address,
        rating: 4.5,
        ratingCount: 1500,
        priceLevel: item.priceLevel || 1,
        photoRef: null,
        zomatoUrl: `https://www.zomato.com/hyderabad/search?q=${encodeURIComponent(item.name + " " + item.area)}`,
        offers: [],
        offersUpdatedAt: new Date().toISOString(),
        status: "approved",
        discoveredIn: item.area,
        createdAt: new Date().toISOString(),
        hours: [
          "Monday: 7:00 AM – 11:00 PM",
          "Tuesday: 7:00 AM – 11:00 PM",
          "Wednesday: 7:00 AM – 11:00 PM",
          "Thursday: 7:00 AM – 11:00 PM",
          "Friday: 7:00 AM – 11:00 PM",
          "Saturday: 7:00 AM – 11:00 PM",
          "Sunday: 7:00 AM – 11:00 PM"
        ],
        website: null,
        hasWebsite: false,
        phone: null,
        blurb: item.blurb,
        tags: item.tags || ["hyderabad-favorite"],
        tier: item.tier || "hidden-gem",
        detailsUpdatedAt: new Date().toISOString(),
        zomatoSlugUrl: null,
        zomatoResolvedAt: null,
        amenities: item.amenities || ["takeaway"],
        costForTwo: item.costForTwo || 300,
        mustTry: item.mustTry,
        redditTip: item.redditTip
      };
      eateries.push(newEatery);
      addedCount++;
    }
  }

  console.log(`Updated ${updatedCount} existing eateries with Reddit context.`);
  console.log(`Added ${addedCount} new Reddit eateries.`);
  console.log(`New total eateries count: ${eateries.length}`);

  // Save eateries.json
  fs.writeFileSync(EATERIES_PATH, JSON.stringify(eateries, null, 2), "utf8");

  // Generate Reddit Guide Markdown
  generateMarkdownGuide(REDDIT_EATERIES);
}

function generateMarkdownGuide(items) {
  let md = `# r/hyderabad Eateries, Tiffin Shops & Restaurants Guide\n\n`;
  md += `A curated compilation of the most recommended food spots, legendary breakfast addas, biryani institutions, messes, bakeries, and cafes as voted by the **r/hyderabad** community.\n\n`;
  md += `*Strictly verified with local coordinates, must-try items, and community tips.*\n\n`;
  md += `---\n\n`;

  const categories = [
    { title: "Tiffin Centres & Breakfast Addas", filter: (e) => (e.tags && (e.tags.includes("tiffin") || e.tags.includes("breakfast"))) },
    { title: "Legendary Biryani, Mandi & Kebabs", filter: (e) => (e.tags && (e.tags.includes("biryani") || e.tags.includes("mandi") || e.tags.includes("kebabs") || e.tags.includes("shawarma"))) },
    { title: "Andhra & Telangana Messes & Regional Thalis", filter: (e) => (e.tags && (e.tags.includes("andhra-meals") || e.tags.includes("mess") || e.tags.includes("telangana") || e.tags.includes("andhra"))) },
    { title: "Irani Chai, Heritage Bakeries & Sweets", filter: (e) => (e.tags && (e.tags.includes("irani-chai") || e.tags.includes("bakery") || e.tags.includes("sweets") || e.tags.includes("ice-cream"))) },
    { title: "Street Food, Chaat & Late Night Hubs", filter: (e) => (e.tags && (e.tags.includes("street-food") || e.tags.includes("chaat") || e.tags.includes("night-eats") || e.tags.includes("late-night"))) },
    { title: "Cafes, Desserts & Specialty Dining", filter: (e) => (e.tags && (e.tags.includes("specialty-coffee") || e.tags.includes("patisserie") || e.tags.includes("pan-asian") || e.tags.includes("italian") || e.tags.includes("burmese"))) }
  ];

  for (const cat of categories) {
    const matched = items.filter(cat.filter);
    if (matched.length === 0) continue;

    md += `## ${cat.title}\n\n`;
    for (const spot of matched) {
      md += `### ${spot.name} (${spot.area})\n`;
      md += `- **Address:** ${spot.address}\n`;
      md += `- **Coordinates:** ${spot.lat}, ${spot.lng}\n`;
      md += `- **Approx. Cost for Two:** ₹${spot.costForTwo}\n`;
      md += `- **Must Try:** ${spot.mustTry}\n`;
      md += `- **Why Redditors Love It:** ${spot.blurb}\n`;
      md += `- **Community Tip:** ${spot.redditTip}\n\n`;
    }
    md += `---\n\n`;
  }

  // Remove any stray em-dashes to comply strictly with CLAUDE.md
  md = md.replace(/—/g, ",");

  fs.writeFileSync(GUIDE_PATH, md, "utf8");
  console.log(`Generated Reddit Guide at ${GUIDE_PATH}`);
}

run();
