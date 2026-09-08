/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep venue JSON in every serverless/page bundle that reads it at runtime
  // (rankings are force-dynamic; without this the Google baseline list is empty).
  outputFileTracingIncludes: {
    "/rankings/**/*": ["./data/eateries.json", "./data/venue-content.json"],
    "/areas/**/*": ["./data/eateries.json", "./data/venue-content.json"],
    "/explore/**/*": ["./data/eateries.json", "./data/venue-content.json"],
    "/spot/**/*": ["./data/eateries.json", "./data/venue-content.json"],
    "/stories/**/*": ["./data/eateries.json", "./data/venue-content.json"],
    "/api/**/*": ["./data/eateries.json", "./data/venue-content.json"],
  },
  async redirects() {
    return [
      // Common search URL patterns → ranking pages
      { source: "/best-biryani-in-hyderabad", destination: "/rankings/best-biryani-in-hyderabad", permanent: true },
      { source: "/best-biryani-hyderabad", destination: "/rankings/best-biryani-in-hyderabad", permanent: true },
      { source: "/best-chicken-biryani-in-hyderabad", destination: "/rankings/best-chicken-biryani-in-hyderabad", permanent: true },
      { source: "/best-restaurants-in-hyderabad", destination: "/rankings/best-restaurants-in-hyderabad", permanent: true },
      { source: "/best-restaurants-hyderabad", destination: "/rankings/best-restaurants-in-hyderabad", permanent: true },
      { source: "/best-cafes-in-hyderabad", destination: "/rankings/best-cafe-in-hyderabad", permanent: true },
      { source: "/best-cafe-in-hyderabad", destination: "/rankings/best-cafe-in-hyderabad", permanent: true },
      { source: "/best-cafes-hyderabad", destination: "/rankings/best-cafe-in-hyderabad", permanent: true },
      { source: "/new-cafes-in-hyderabad", destination: "/rankings/best-new-cafe-in-hyderabad", permanent: true },
      { source: "/best-haleem-in-hyderabad", destination: "/rankings/best-haleem-in-hyderabad", permanent: true },
      { source: "/best-bakery-hyderabad", destination: "/rankings/best-bakery-in-hyderabad", permanent: true },
      { source: "/best-ice-cream-hyderabad", destination: "/rankings/best-ice-cream-in-hyderabad", permanent: true },
      { source: "/late-night-cafes-hyderabad", destination: "/rankings/best-late-night-cafe-in-hyderabad", permanent: true },
      // Category shortcuts
      { source: "/cafes-in-hyderabad", destination: "/explore/cafes", permanent: true },
      { source: "/cafes-hyderabad", destination: "/explore/cafes", permanent: true },
      { source: "/biryani-in-hyderabad", destination: "/explore/biryani-and-local", permanent: true },
      { source: "/restaurants-in-hyderabad", destination: "/rankings/best-restaurants-in-hyderabad", permanent: true },
      // Area shortcuts
      { source: "/cafes-in-jubilee-hills", destination: "/areas/jubilee-hills", permanent: true },
      { source: "/cafes-in-gachibowli", destination: "/areas/gachibowli", permanent: true },
      // Alias / typo area & explore slugs (Ahrefs 4XX)
      { source: "/areas/madhapur", destination: "/areas/madhapur-hitec", permanent: true },
      { source: "/areas/hitec-city", destination: "/areas/madhapur-hitec", permanent: true },
      { source: "/areas/hitech-city", destination: "/areas/madhapur-hitec", permanent: true },
      { source: "/areas/dilshuknagar", destination: "/areas/dilsukhnagar", permanent: true },
      { source: "/areas/road-no-36-jh", destination: "/areas/jubilee-hills", permanent: true },
      { source: "/explore/restro-bars", destination: "/explore/bars", permanent: true },
      { source: "/explore/street-food", destination: "/rankings/best-street-food-in-hyderabad", permanent: true },
      { source: "/explore/fine-dining", destination: "/rankings/best-fine-dining-in-hyderabad", permanent: true },
      { source: "/food-in-hyderabad", destination: "/explore", permanent: false },
      { source: "/ranking", destination: "/rankings", permanent: true },
      { source: "/ranking/:slug", destination: "/rankings/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
