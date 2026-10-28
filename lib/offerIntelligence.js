const IST = "Asia/Kolkata";
const HISTORY_DAYS = 28;

const partsFor = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value instanceof Date ? value : new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return {
    year: get("year"), month: get("month"), day: get("day"),
    hour: Number(get("hour")) % 24, minute: Number(get("minute")),
  };
};

export function hyderabadNow(value = new Date()) {
  const parts = partsFor(value);
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    min: parts.hour * 60 + parts.minute,
  };
}

export function hyderabadDateKey(value) {
  if (!value) return null;
  return hyderabadNow(value).day;
}

export function addDateDays(dateKey, amount) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount, 12));
  return date.toISOString().slice(0, 10);
}

export function weekdayFor(dateKey, style = "short") {
  return new Intl.DateTimeFormat("en-IN", { weekday: style, timeZone: "UTC" })
    .format(new Date(`${dateKey}T12:00:00Z`));
}

export function clockLabel(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

export function mealPeriod(min) {
  if (min == null) return null;
  if (min < 12 * 60) return "morning";
  if (min < 17 * 60) return "afternoon";
  return "evening";
}

export function offerMode(deal, platform) {
  if (!deal) return "unknown";
  const terms = `${deal.on || ""} ${deal.note || ""} ${deal.bookingText || ""}`;
  if (deal.bookingMode === "walkin" || /walk-?in|no booking required|instant offer/i.test(terms)) return "walkin";
  if (deal.bookingMode === "prebook" || /pre-?book|booking required/i.test(terms)
    || platform === "district" && (deal.when || deal.slotsLeft)) return "prebook";
  return "unknown";
}

export const modeLabel = (mode) => mode === "prebook"
  ? "Pre-book"
  : mode === "walkin" ? "Walk-in / instant" : "Check booking terms";

export function savingFor(deal, bill) {
  if (!deal || (deal.minBill && bill < deal.minBill)) return 0;
  const raw = deal.flat || (deal.pct ? bill * deal.pct / 100 : 0);
  return Math.round(deal.cap ? Math.min(raw, deal.cap) : raw);
}

export function districtStatus(deal, fetchedAt, now = hyderabadNow()) {
  const when = deal?.when;
  if (!when || (when.from == null && when.to == null)) {
    return { state: "anytime", label: offerMode(deal, "district") === "walkin" ? "All day" : "Any time" };
  }
  const period = mealPeriod(when.from ?? when.to);
  const prettyPeriod = period ? period.charAt(0).toUpperCase() + period.slice(1) : null;
  const range = when.from != null && when.to != null
    ? `${clockLabel(when.from)} to ${clockLabel(when.to)}`
    : when.from != null ? `From ${clockLabel(when.from)}` : `Till ${clockLabel(when.to)}`;
  const timedRange = [prettyPeriod, range].filter(Boolean).join(" · ");
  const scheduled = when.day === "tomorrow" ? `Tomorrow · ${timedRange}` : timedRange;
  if (!now || hyderabadDateKey(fetchedAt) !== now.day || (when.day && when.day !== "today")) {
    return { state: "later", label: scheduled };
  }
  const started = when.from == null || now.min >= when.from;
  const ended = when.to != null && now.min >= when.to;
  if (started && !ended) return {
    state: "live",
    label: when.to != null
      ? `${prettyPeriod ? `${prettyPeriod} · ` : ""}Live till ${clockLabel(when.to)}`
      : `${prettyPeriod ? `${prettyPeriod} · ` : ""}Live now`,
  };
  if (ended) return { state: "over", label: "Over for today" };
  return {
    state: "later",
    label: when.from != null
      ? `${prettyPeriod ? `${prettyPeriod} · ` : ""}Starts ${clockLabel(when.from)}`
      : timedRange,
  };
}

export function swiggyStatus(deal, fetchedAt, now = hyderabadNow()) {
  if (!deal) return null;
  if (deal.allDay && now && hyderabadDateKey(fetchedAt) === now.day) return { state: "live", label: "All day today" };
  if (deal.allDay) return { state: "anytime", label: "All day" };
  return { state: deal.applicableNow === false ? "later" : "anytime", label: deal.on || "On the bill" };
}

export function comparisonResult(rows, bill) {
  const eligible = (rows || []).filter((row) => row?.deal);
  if (eligible.length !== 2) return { comparable: false, reason: "single-platform", rows: eligible };
  if (eligible.some((row) => !row.branchVerified)) return { comparable: false, reason: "branch-unverified", rows: eligible };
  if (eligible.some((row) => row.available === false)) return { comparable: false, reason: "not-currently-eligible", rows: eligible };
  if (eligible.some((row) => savingFor(row.deal, bill) <= 0)) return { comparable: false, reason: "not-currently-eligible", rows: eligible };
  if (eligible[0].mode === "unknown" || eligible[0].mode !== eligible[1].mode) {
    return { comparable: false, reason: "booking-mode", rows: eligible };
  }
  if (eligible[0].period && eligible[1].period && eligible[0].period !== eligible[1].period) {
    return { comparable: false, reason: "meal-period", rows: eligible };
  }
  const ranked = eligible.map((row) => ({
    ...row,
    saving: savingFor(row.deal, bill),
    payable: bill - savingFor(row.deal, bill),
  })).sort((a, b) => b.saving - a.saving);
  return {
    comparable: true,
    reason: null,
    winner: ranked[0],
    runnerUp: ranked[1],
    tie: ranked[0].saving === ranked[1].saving,
  };
}

const cleanText = (value) => value ? String(value).replace(/\s+/g, " ").trim() : null;

export function normalizePlatformOffers(spotId, platform, source) {
  if (!source) return [];
  const match = source.match || { status: source.url ? "verified" : "unknown" };
  const venue = {
    id: source.id || source.venue?.id || null,
    name: source.name || source.venue?.name || null,
    locality: source.locality || source.venue?.locality || null,
    lat: source.lat ?? source.venue?.lat ?? null,
    lng: source.lng ?? source.venue?.lng ?? null,
    url: source.url || null,
    match,
  };
  const restaurantDeals = platform === "district" ? source.deals || [] : source.deal ? [source.deal] : [];
  const cardDeals = platform === "district" ? source.bankOffers || [] : source.cardOffers || [];
  const fetchedDate = hyderabadDateKey(source.fetchedAt);
  const normalized = restaurantDeals.map((deal) => ({
    spotId, platform, kind: "restaurant", venue,
    title: cleanText(deal.title), pct: deal.pct ?? null, flat: deal.flat ?? null,
    cap: deal.cap ?? null, minBill: deal.minBill ?? null,
    bookingMode: offerMode(deal, platform),
    day: deal.when?.day || null,
    date: deal.when?.day === "tomorrow" && fetchedDate ? addDateDays(fetchedDate, 1) : deal.when?.day === "today" || deal.allDay || offerMode(deal, platform) === "walkin" ? fetchedDate : null,
    from: deal.when?.from ?? null, to: deal.when?.to ?? null,
    mealPeriod: mealPeriod(deal.when?.from ?? deal.when?.to),
    slotsLeft: deal.slotsLeft ?? null, partySize: deal.partySize ?? null,
    exclusions: deal.exclusions || [], note: cleanText(deal.note || deal.on),
    applicableNow: deal.applicableNow ?? null, allDay: deal.allDay ?? null,
    sourceUrl: source.url || null, fetchedAt: source.fetchedAt || null,
  }));
  for (const deal of cardDeals) normalized.push({
    spotId, platform, kind: "card", venue,
    title: cleanText(deal.title), pct: deal.pct ?? null, flat: deal.flat ?? null,
    cap: deal.cap ?? null, minBill: deal.minBill ?? null,
    bookingMode: "card", day: null, date: null, from: null, to: null, mealPeriod: null,
    slotsLeft: null, partySize: null, exclusions: [], note: cleanText(deal.desc || deal.via),
    sourceUrl: source.url || null, fetchedAt: source.fetchedAt || null,
  });
  return normalized;
}

export function offerSignature(offer) {
  return [offer.platform, offer.kind, offer.title, offer.pct, offer.flat, offer.cap, offer.minBill,
    offer.bookingMode, offer.from, offer.to, offer.mealPeriod].map((value) => value ?? "-").join("|");
}

export function updateOfferHistory(previous, offersData, observedAt = new Date().toISOString()) {
  const observedDate = hyderabadDateKey(observedAt);
  const cutoff = addDateDays(observedDate, -(HISTORY_DAYS - 1));
  const history = previous && previous.version === 1
    ? structuredClone(previous)
    : { version: 1, retentionDays: HISTORY_DAYS, updatedAt: observedAt, spots: {} };

  for (const [spotId, entry] of Object.entries(offersData?.spots || {})) {
    for (const platform of ["district", "swiggy"]) {
      const source = entry?.[platform];
      if (!source?.hasOffers || source.match?.status !== "verified") continue;
      const offers = normalizePlatformOffers(spotId, platform, source).filter((offer) => offer.kind === "restaurant");
      if (!offers.length) continue;
      const platformHistory = history.spots[spotId]?.[platform] || {};
      for (const offer of offers) {
        const signature = offerSignature(offer);
        const old = platformHistory[signature] || {
          offer: { ...offer, fetchedAt: undefined },
          firstSeenAt: observedAt,
          lastSeenAt: observedAt,
          dates: [],
        };
        old.lastSeenAt = observedAt;
        old.offer = { ...old.offer, ...offer, fetchedAt: undefined };
        old.dates = [...new Set([...(old.dates || []).filter((date) => date >= cutoff), observedDate])].sort();
        platformHistory[signature] = old;
      }
      history.spots[spotId] = { ...(history.spots[spotId] || {}), [platform]: platformHistory };
    }
  }

  for (const [spotId, platforms] of Object.entries(history.spots)) {
    for (const [platform, records] of Object.entries(platforms)) {
      for (const [signature, record] of Object.entries(records)) {
        record.dates = (record.dates || []).filter((date) => date >= cutoff);
        if (!record.dates.length) delete records[signature];
      }
      if (!Object.keys(records).length) delete platforms[platform];
    }
    if (!Object.keys(platforms).length) delete history.spots[spotId];
  }
  history.updatedAt = observedAt;
  history.retentionDays = HISTORY_DAYS;
  return history;
}

function confirmedOffersForDate(item, dateKey) {
  const out = [];
  for (const platform of ["district", "swiggy"]) {
    const source = item?.[platform];
    const fetchedDate = hyderabadDateKey(source?.fetchedAt);
    if (!source || !fetchedDate || source.match?.status !== "verified") continue;
    for (const offer of normalizePlatformOffers(item.spotId, platform, source).filter((row) => row.kind === "restaurant")) {
      let confirmedDate = null;
      if (offer.day === "today") confirmedDate = fetchedDate;
      else if (offer.day === "tomorrow") confirmedDate = addDateDays(fetchedDate, 1);
      else if (offer.allDay || offer.bookingMode === "walkin") confirmedDate = fetchedDate;
      if (confirmedDate === dateKey) out.push(offer);
    }
  }
  return out;
}

function observedPattern(history, spotId, dateKey) {
  const weekday = weekdayFor(dateKey, "long");
  let best = null;
  for (const records of Object.values(history?.spots?.[spotId] || {})) {
    for (const record of Object.values(records || {})) {
      if (record.offer?.venue?.match?.status !== "verified") continue;
      const matchingDates = (record.dates || []).filter((date) => weekdayFor(date, "long") === weekday);
      if (matchingDates.length < 2) continue;
      const strength = (record.offer?.pct || 0) * 10000 + (record.offer?.flat || 0);
      if (!best || matchingDates.length > best.count || matchingDates.length === best.count && strength > best.strength) {
        best = { count: matchingDates.length, offer: record.offer, strength };
      }
    }
  }
  return best;
}

export function buildDealWeek(item, history, start = hyderabadNow().day) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDateDays(start, index);
    const confirmed = confirmedOffersForDate(item, date);
    if (confirmed.length) {
      const offer = [...confirmed].sort((a, b) => (b.pct || 0) - (a.pct || 0) || (b.flat || 0) - (a.flat || 0))[0];
      return { date, day: weekdayFor(date), state: "confirmed", offer, label: "Confirmed" };
    }
    if (index > 1) {
      const observed = observedPattern(history, item.spotId, date);
      if (observed) return {
        date, day: weekdayFor(date), state: "observed", offer: observed.offer,
        count: observed.count, label: `Seen on ${observed.count} recent ${weekdayFor(date, "long")}s`,
      };
    }
    return { date, day: weekdayFor(date), state: "none", offer: null, label: "No verified offer" };
  });
}

export function coverageStats(spots = {}, extra = {}) {
  const entries = Object.values(spots);
  const listedDistrict = entries.filter((entry) => entry.district?.url);
  const listedSwiggy = entries.filter((entry) => entry.swiggy?.url);
  const district = entries.filter((entry) => entry.district?.url && entry.district?.match?.status === "verified");
  const swiggy = entries.filter((entry) => entry.swiggy?.url && entry.swiggy?.match?.status === "verified");
  const both = entries.filter((entry) => entry.district?.match?.status === "verified" && entry.swiggy?.match?.status === "verified");
  const activeDistrict = entries.filter((entry) => entry.district?.hasOffers);
  const activeSwiggy = entries.filter((entry) => entry.swiggy?.hasOffers);
  return {
    ...extra,
    candidates: entries.length,
    listed: { district: listedDistrict.length, swiggy: listedSwiggy.length },
    discovered: {
      district: extra.districtDiscovery?.discovered ?? listedDistrict.length,
      swiggy: extra.swiggyDiscovery?.discovered ?? listedSwiggy.length,
    },
    matched: { district: district.length, swiggy: swiggy.length, both: both.length },
    active: {
      district: activeDistrict.length,
      swiggy: activeSwiggy.length,
      both: entries.filter((entry) => entry.district?.hasOffers && entry.swiggy?.hasOffers).length,
    },
    singlePlatform: {
      district: listedDistrict.filter((entry) => !entry.swiggy?.url).length,
      swiggy: listedSwiggy.filter((entry) => !entry.district?.url).length,
    },
    unmatched: {
      district: extra.districtDiscovery?.unmatched ?? Math.max(0, listedDistrict.length - district.length),
      swiggy: extra.swiggyDiscovery?.unmatched ?? Math.max(0, listedSwiggy.length - swiggy.length),
    },
    rejectedMatches: {
      district: extra.districtDiscovery?.rejectedMatches ?? 0,
      swiggy: extra.swiggyDiscovery?.rejectedMatches ?? 0,
    },
  };
}
