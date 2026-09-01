/** @type {import('next').NextConfig} */
const nextConfig = {
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
      { source: "/food-in-hyderabad", destination: "/explore", permanent: false },
      { source: "/ranking", destination: "/rankings", permanent: true },
      { source: "/ranking/:slug", destination: "/rankings/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
