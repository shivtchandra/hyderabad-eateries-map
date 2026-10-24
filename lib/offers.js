// Only offers we actually scraped carry `fetchedAt`. Older template records don't,
// so they are dropped instead of being shown as real deals.
export function verifiedOffers(entry) {
  // Offers commented out for now
  return null;
  /*
  if (!entry) return null;
  const district = entry.district?.fetchedAt && entry.district.hasOffers ? entry.district : null;
  const swiggy = entry.swiggy?.fetchedAt && entry.swiggy.hasOffers ? entry.swiggy : null;
  return district || swiggy ? { ...entry, district, swiggy } : null;
  */
}
