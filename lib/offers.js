// Only offers we actually scraped carry `fetchedAt`. Older template records don't,
// so they are dropped instead of being shown as real deals. Collection runs at
// 07:00, 13:00, 19:00 and 23:00 IST; ten hours covers the overnight gap without
// allowing yesterday's prices to linger through another day.
const MAX_OFFER_AGE_MS = 10 * 60 * 60 * 1000;

export function verifiedOffers(entry, referenceTime = Date.now()) {
  if (!entry) return null;
  const fresh = (source) => {
    const fetchedAt = Date.parse(source?.fetchedAt || "");
    return Boolean(source?.hasOffers && fetchedAt && referenceTime - fetchedAt <= MAX_OFFER_AGE_MS);
  };
  const district = fresh(entry.district) ? entry.district : null;
  const swiggy = fresh(entry.swiggy) ? entry.swiggy : null;
  return district || swiggy ? { ...entry, district, swiggy } : null;
}
