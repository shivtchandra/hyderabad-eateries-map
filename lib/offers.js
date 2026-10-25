// Only offers we actually scraped carry `fetchedAt`. Older template records don't,
// so they are dropped instead of being shown as real deals.
export function verifiedOffers(entry, referenceTime = Date.now()) {
  if (!entry) return null;
  const fresh = (source) => {
    const fetchedAt = Date.parse(source?.fetchedAt || "");
    return Boolean(source?.hasOffers && fetchedAt && referenceTime - fetchedAt <= 72 * 60 * 60 * 1000);
  };
  const district = fresh(entry.district) ? entry.district : null;
  const swiggy = fresh(entry.swiggy) ? entry.swiggy : null;
  return district || swiggy ? { ...entry, district, swiggy } : null;
}
