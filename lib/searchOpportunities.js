// Search Console landing pages that already have meaningful demand. These
// profiles keep the venue entity unambiguous and give thin-but-ranking pages
// a factual, query-matched answer without turning third-party ratings into our
// editorial opinion. Revalidate against the next 28-day GSC export.
export const SPOT_SEARCH_PROFILES = {
  /* Between Brewhouse has full review content now */
  "ChIJ6w9jdlyVyzsRTfcyz9wWIIg": {
    title: "The KOP Specialty Coffee, Financial District",
    primaryQuery: "the kop specialty coffee",
    secondaryQueries: ["the kop specialty coffee financial district", "the kop specialty coffee menu"],
    answer: "The KOP Specialty Coffee is a specialty-coffee cafe near Hyderabad's Financial District. Its published menu includes pour-overs, cold brews, matcha and open toasts; this page identifies the branch, location, timings and map pin.",
    facts: [
      "The published drinks range covers pour-overs, cold brews and matcha.",
      "The food listing includes savoury open toasts such as hummus, mushroom and egg options.",
    ],
    source: { label: "The KOP menu listing", url: "https://www.swiggy.com/city/hyderabad/the-kop-specialty-coffee-nanakramguda-rest1432220" },
  },
  "ChIJicyF8HiZyzsRjKsneXKgZN0": {
    title: "Amritsar Haveli Abids & Samroze Coffee",
    primaryQuery: "amritsar haveli abids and samroze coffee",
    secondaryQueries: ["amritsar haveli abids and samroze coffee reviews", "amritsar haveli abids"],
    answer: "This is the Amritsar Haveli Abids and Samroze Coffee listing in Abids, Hyderabad, also associated with Hanuman Tekdi in directory searches. It combines a Punjabi restaurant identity with a coffee offering; use this page for the exact branch, official link, timings and map pin.",
    source: { label: "Official Amritsar Haveli locations", url: "https://amritsarhaveligroup.com/locations/" },
  },
  "ChIJwQ0uD-yRyzsR9q9IuM9k88k": {
    title: "Enugu Cafe: Menu & Specialty Coffee",
    primaryQuery: "enugu cafe",
    secondaryQueries: ["enugu speciality coffee shop space", "enugu speciality coffee menu", "enugu cafe kothapet"],
    answer: "ENUGU Speciality Coffee | Shop | Space is the Kothapet garden cafe in the LB Nagar area commonly searched as Enugu Cafe. One local visit report describes a compact, morning-focused menu, espresso drinks, a matcha station and a slow-coffee bar in a leafy courtyard.",
    facts: [
      "A local visit report describes breakfast-focused morning service and a limited menu.",
      "The same report mentions cortado, a matcha station, a slow-coffee bar and compact indoor seating.",
    ],
    source: { label: "Local Enugu visit report", url: "https://www.reddit.com/r/hyderabad/comments/1syuj2w/enugu_speciality_coffee_kothapet/" },
  },
  "ChIJtzSzBgCVyzsRROrBh6uC4aE": {
    title: "Alley 91 Bowling Bar: Bowling & Venue Guide",
    primaryQuery: "alley 91 bowling bar",
    secondaryQueries: ["alley 91 bowling bar reviews", "alley 91 bowling price", "alley 91 financial district"],
    answer: "Alley 91 Bowling Bar in Financial District combines bowling and games with food and a bar. This page keeps the venue identity, official site, location and timings together; event tickets and bowling prices can change by session.",
    facts: [
      "The venue combines bowling and games with a food-and-bar format.",
      "Check the official source before visiting because event slots, ticket rules and bowling prices can change.",
    ],
    source: { label: "Official Alley 91 site", url: "https://alley91.com/" },
  },
  "ChIJt0qENzGRyzsRaUL4xBEt-QE": {
    title: "Tori's Speciality Coffee, Jubilee Hills",
    primaryQuery: "tori's speciality coffee hyderabad",
    secondaryQueries: ["tori's speciality coffee menu", "tori's coffee jubilee hills"],
    answer: "Tori's Speciality Coffee is a Road No. 36, Jubilee Hills cafe. Mapping HYD tags this branch for specialty coffee, breakfast, outdoor seating and dates; this page identifies the location, timings and map pin.",
  },
  "ChIJD2xTlR-XyzsRBrWHH2jDPGg": {
    title: "Parampara Banjara Hills: Veg Dining Guide",
    primaryQuery: "parampara flavours of india reviews",
    secondaryQueries: ["parampara banjara hills", "parampara flavours of india menu"],
  },
  "ChIJV47u-zeTyzsRg1GyNX8ogOQ": {
    title: "Windmills Madhapur: Dishes + Piyush's Review",
    primaryQuery: "windmills craftworks madhapur menu",
    secondaryQueries: ["windmills madhapur review", "what to order at windmills madhapur"],
  },
  "ChIJW3FaQfeRyzsRGlbKzHEnmWE": {
    title: "Arabian Affairs Jubilee Hills: Venue Guide",
    primaryQuery: "arabian affairs jubilee hills",
    secondaryQueries: ["arabian affairs reviews", "arabian affairs menu"],
    answer: "Arabian Affairs is an Arabian restaurant in Jubilee Hills, Hyderabad. This branch page groups its address, opening hours, approximate cost, map pin and any Mapping HYD community-ranking status without presenting a third-party star score as our verdict.",
  },
  "ChIJn42YEgCTyzsRv0nbLAZvC88": {
    title: "Hyderabad Spicy Kitchen & Bar: Venue Guide",
    primaryQuery: "hyderabad spicy kitchen and bar reviews",
    secondaryQueries: ["hyderabad spicy kitchen gachibowli", "hyderabad spicy kitchen menu"],
    answer: "Hyderabad Spicy Kitchen and Bar is a Gachibowli restro-bar. This page identifies the exact branch and brings its location, opening hours, map pin and Mapping HYD community-ranking status into one place.",
  },
  "ChIJQX3oRACTyzsRYITnjwROO9U": {
    title: "Big Plate Mandi HITEC City: Shiva's Review",
    primaryQuery: "big plate mandi hitech city reviews",
    secondaryQueries: ["big plate mandi juicy chicken mandi", "big plate mandi apollo fish starter", "what to order at big plate mandi"],
  },
  "ChIJrxGfWTqRyzsRIPrqg0b3Zfg": {
    title: "AK Tea Point Borabanda: Timings & Location",
    primaryQuery: "ak tea point",
    secondaryQueries: ["ak tea point madhapur", "ak tea point hitec city", "ak tea point timings"],
    answer: "AK Tea Point is a chai-focused cafe in Borabanda, mapped under Mapping HYD's broader Madhapur and HITEC area. This page identifies the exact outlet and keeps its long opening hours, location and map pin easy to verify.",
  },
  "ChIJ6ewhtAeVyzsRyRg6IV-NXuI": {
    title: "Biryani Katha, Financial District: Venue Guide",
    primaryQuery: "biryani katha",
    secondaryQueries: ["biryani katha financial district", "biryani katha menu"],
    answer: "Biryani Katha is a biryani-focused local eatery near Hyderabad's Financial District, with its stored address in the Manchirevula and Gandipet side. This page identifies the branch and links its official site alongside opening hours, location and map pin.",
  },
  "ChIJiRR93K6XyzsRbV_aVQP2o5I": {
    title: "Accha Telugu Kitchen & Bar: Venue Guide",
    primaryQuery: "accha telugu kitchen and bar reviews",
    secondaryQueries: ["accha telugu kitchen somajiguda", "accha telugu kitchen menu"],
    answer: "Accha Telugu Kitchen and Bar is the Somajiguda branch of the Telugu dining brand. This page keeps the official link, exact location, opening hours, approximate cost and map pin together.",
  },
  "ChIJ8w36d0qTyzsR6-LhPp4FYFY": {
    title: "Chittor Naidu Drive-In (Formerly Cafe Southern)",
    primaryQuery: "chittor naidu drive in previously cafe southern",
    secondaryQueries: ["cafe southern madhapur", "chittor naidu drive in menu"],
    answer: "Chittor Naidu Drive-In is the Madhapur and HITEC City venue formerly known as Cafe Southern. Keeping both names on this page resolves the renamed place while preserving its location, evening timings and map pin.",
  },
  "ChIJI9FVuseRyzsR5qrFwoKDbkw": {
    title: "Mirthy Cafe Jubilee Hills: Dessert Visit Notes",
    primaryQuery: "mirthy cafe reviews",
    secondaryQueries: ["mirthy cafe jubilee hills", "mirthy hot chocolate", "mirthy the pistachio dessert"],
  },
};

export function getSpotSearchProfile(spotId) {
  return SPOT_SEARCH_PROFILES[spotId] || null;
}

export function getSearchOpportunitySpotIds() {
  return Object.keys(SPOT_SEARCH_PROFILES);
}
