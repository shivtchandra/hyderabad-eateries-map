"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "../components/Icons.jsx";
import { photoPathToCdn } from "../../lib/photos.js";
import {
  buildDealWeek,
  clockLabel as clock,
  comparisonResult,
  districtStatus,
  hyderabadDateKey as istDay,
  hyderabadNow as istNow,
  mealPeriod,
  modeLabel,
  normalizePlatformOffers,
  offerMode,
  savingFor,
  swiggyStatus,
} from "../../lib/offerIntelligence.js";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const looksLikeCardOffer = (deal) =>
  /\b(card|credit|debit|bank|visa|mastercard|upi|paytm|hdfc|kotak|rbl|hsbc|idfc|dbs|jupiter|au)\b/i.test(deal?.title || "");

const districtPublicDeals = (item) =>
  (item.district?.deals || []).filter((deal) => !looksLikeCardOffer(deal));

const bestOf = (list, bill = 3000) =>
  [...(list || [])].sort((a, b) => savingFor(b, bill) - savingFor(a, bill))[0] || null;

const short = (d) => (d?.pct ? `${d.pct}% off` : d?.flat ? `${inr(d.flat)} off` : d?.title || "");

function districtDealAtThisTime(item, now, bill) {
  const deals = districtPublicDeals(item);
  if (!deals.length) return null;
  if (!now) return bestOf(deals.filter((deal) => !deal.when?.day), bill);
  // A slot labelled "today" belongs to the scrape date. Never carry that timed
  // promise into another day; keep only genuinely untimed offers until refresh.
  if (istDay(item.district?.fetchedAt) !== now.day) {
    return bestOf(deals.filter((deal) => !deal.when?.day), bill);
  }
  const available = deals.filter((deal) => {
    const state = districtStatus(deal, item.district?.fetchedAt, now).state;
    return state === "live" || state === "anytime";
  });
  return bestOf(available, bill);
}

function nextDistrictDeal(item, now, bill, current) {
  if (!now || istDay(item.district?.fetchedAt) !== now.day) return null;
  const future = districtPublicDeals(item)
    .filter((deal) => {
      if (deal === current || deal.when?.from == null) return false;
      if (deal.when.day === "tomorrow") return true;
      return deal.when.day === "today" && deal.when.from > now.min;
    })
    .sort((a, b) => {
      const aDay = a.when.day === "tomorrow" ? 1 : 0;
      const bDay = b.when.day === "tomorrow" ? 1 : 0;
      return (aDay - bDay) || (a.when.from - b.when.from) || (savingFor(b, bill) - savingFor(a, bill));
    });
  if (!future.length) return null;
  const nextDay = future[0].when.day;
  const nextTime = future[0].when.from;
  return bestOf(future.filter((deal) => deal.when.day === nextDay && deal.when.from === nextTime), bill);
}

function nextDealLabel(deal) {
  if (!deal?.when) return null;
  const day = deal.when.day === "tomorrow" ? "tomorrow at " : "at ";
  const period = mealPeriod(deal.when.from)?.toLowerCase();
  return `Next: ${short(deal)}${period ? ` · ${period}` : ""} ${day}${clock(deal.when.from)}`;
}

// Swiggy offers change by weekday; re-pick from the scraped schedule for today
// (IST) so a deal stays right after midnight, before the next scrape.
function swiggyDealForDay(swiggy, now) {
  const schedule = swiggy?.schedule;
  if (!schedule?.length || !now?.day) return swiggy?.deal || null;
  const weekday = new Date(`${now.day}T00:00:00Z`).getUTCDay();
  const value = (o) => (o.pct || 0) * 100 + (o.flat || 0) / 10;
  const pick = (mode) => schedule.filter((o) => o.mode === mode && o.days.includes(weekday)).sort((a, b) => value(b) - value(a))[0];
  const o = pick("prebook") || pick("walkin");
  if (!o) return null;
  return { ...swiggy.deal, title: o.title, on: o.mode === "walkin" ? "on walk-in" : "on pre-booking", pct: o.pct, flat: o.flat, note: o.note, bookingMode: o.mode, allDay: true, applicableNow: null, fee: o.fee };
}

function platformDeals(item, now, bill = 3000) {
  const out = [];
  const currentDd = districtDealAtThisTime(item, now, bill);
  const nextDd = nextDistrictDeal(item, now, bill, currentDd);
  const dd = currentDd || nextDd;
  const ddStatus = dd ? districtStatus(dd, item.district?.fetchedAt, now) : null;
  const ddAvailable = ddStatus?.state === "live" || ddStatus?.state === "anytime";
  const ddSaving = ddAvailable ? savingFor(dd, bill) : 0;
  if (item.district) {
    const mode = offerMode(dd, "district");
    out.push({
      key: "district",
      name: "District",
      deal: dd,
      title: dd?.title || (item.district.bankOffers?.length ? "Card offers only" : "No deal today"),
      sub: dd ? [
        dd.slotsLeft ? `${dd.slotsLeft} slots left` : null,
        modeLabel(mode),
        currentDd && nextDd ? nextDealLabel(nextDd) : null,
      ].filter(Boolean).join(" · ") : null,
      status: ddStatus,
      url: item.district.url,
      cta: "Book",
      saving: ddSaving,
      payable: bill - ddSaving,
      checkedAt: item.district.fetchedAt,
      mode,
      period: mealPeriod(dd?.when?.from ?? dd?.when?.to),
      available: ddAvailable,
      branchVerified: !["uncertain", "rejected"].includes(item.district.match?.status),
    });
  }
  const sd = swiggyDealForDay(item.swiggy, now);
  if (item.swiggy) {
    const mode = offerMode(sd, "swiggy");
    out.push({
      key: "swiggy",
      name: "Swiggy Dineout",
      deal: sd,
      title: sd?.title || (item.swiggy.cardOffers?.length ? "Card offers only" : "No deal today"),
      sub: sd ? modeLabel(mode) : null,
      status: swiggyStatus(sd, item.swiggy.fetchedAt, now),
      url: item.swiggy.url,
      cta: mode === "prebook" ? "Book" : "Pay bill",
      saving: savingFor(sd, bill),
      payable: bill - savingFor(sd, bill),
      checkedAt: item.swiggy.fetchedAt,
      mode,
      period: sd?.mealPeriod || null,
      available: !["over", "later"].includes(swiggyStatus(sd, item.swiggy.fetchedAt, now)?.state),
      branchVerified: !["uncertain", "rejected"].includes(item.swiggy.match?.status),
    });
  }
  return out;
}

function allCardOffers(item, bill = 3000) {
  const embedded = (item.district?.deals || []).filter(looksLikeCardOffer);
  const district = [...(item.district?.bankOffers || []), ...embedded]
    .filter((offer, index, list) => list.findIndex((candidate) => candidate.title === offer.title) === index)
    .map((offer) => ({ ...offer, via: offer.bank, src: "District" }));
  const swiggy = (item.swiggy?.cardOffers || []).map((offer) => ({ ...offer, src: "Swiggy" }));
  return [...district, ...swiggy]
    .map((offer) => {
      const card = cardIdentity(offer);
      return { ...offer, cardKey: card?.key || null, cardLabel: card?.label || null, saving: savingFor(offer, bill), eligible: !offer.minBill || bill >= offer.minBill };
    })
    .sort((a, b) => b.saving - a.saving);
}

const CARD_CODE_LABELS = {
  HDFCINFINIA: "HDFC Infinia",
  HDFCCCEMI: "HDFC credit-card EMI",
  HDFCDINERS: "HDFC Diners",
  HDFCCARDS: "HDFC cards",
};

function cardIdentity(offer) {
  const via = String(offer?.via || "").replace(/&amp;/g, "&").trim();
  const alias = CARD_CODE_LABELS[via.toUpperCase()];
  const text = `${via} ${offer?.title || ""}`;
  const looksLikeCard = /\b(card|credit|debit|bank|visa|mastercard|hdfc|icici|axis|sbi|rbl|hsbc|kotak|idfc|dbs|indusind|yes bank|pnb|cub|au)\b/i.test(text);
  if (!looksLikeCard) return null;
  let label = alias || via;
  if (!label || /^(select |eligible |premier |credit |debit |visa )/i.test(label)) {
    label = String(offer?.title || "")
      .replace(/^.*?(?:using|on)\s+/i, "")
      .replace(/\s+(?:credit|debit)?\s*cards?.*$/i, "")
      .trim();
  }
  if (!label || label.length > 52) return null;
  return { key: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), label };
}

const comparisonReason = {
  "branch-unverified": "The exact branch could not be verified on both apps.",
  "not-currently-eligible": "One offer starts later or the bill does not qualify yet.",
  "booking-mode": "One offer requires pre-booking while the other is walk-in or instant.",
  "meal-period": "The offers apply to different meal periods.",
};

function OfferCard({ item, now, bill, history, selectedCards, onSelectSpot }) {
  const rows = platformDeals(item, now, bill);
  const cards = allCardOffers(item, bill);
  const both = rows.length === 2 && rows.every((row) => row.deal);
  const comparison = comparisonResult(rows, bill);
  const winner = comparison.winner || null;
  const runnerUp = comparison.runnerUp || null;
  const tie = comparison.tie || false;
  const savingGap = comparison.comparable ? Math.max(0, winner.saving - runnerUp.saving) : 0;
  const hasComparison = comparison.comparable;
  const week = buildDealWeek(item, history, now?.day);
  const showFullWeek = week.slice(1).some((day) => day.state !== "none");
  const visibleWeek = showFullWeek ? week : week.slice(0, 2);
  const bestCard = cards.find((card) => card.saving > 0);
  const matchingCards = cards.filter((card) => card.cardKey && selectedCards.includes(card.cardKey));
  const bestMatchingCard = matchingCards.find((card) => card.eligible && card.saving > 0);
  const img = item.photo ? (item.photo.startsWith("http") ? item.photo : photoPathToCdn(item.photo)) : null;

  return (
    <article className="of-card" id={`deal-${item.spotId}`}>
      <header className="of-card-head">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" width={56} height={56} loading="lazy" decoding="async" />
        ) : (
          <span className="of-card-ph" aria-hidden="true"><Icon name="ticket" size={20} color="var(--violet)" /></span>
        )}
        <div className="of-card-id">
          {onSelectSpot ? (
            <button type="button" className="of-card-name of-card-name-button" onClick={() => onSelectSpot(item.spotId)}>{item.name}</button>
          ) : item.slug ? (
            <Link href={`/spot/${item.slug}`} className="of-card-name">{item.name}</Link>
          ) : (
            <span className="of-card-name">{item.name}</span>
          )}
          <span className="of-card-meta">{[item.area, item.rating ? `★ ${item.rating}` : null].filter(Boolean).join(" · ")}</span>
        </div>
      </header>

      {hasComparison && (
        <div className={`of-verdict${tie ? " tie" : ""}`}>
          <span className="of-verdict-label">{tie ? "Same saving" : "Best for this bill"}</span>
          {tie ? (
            <><strong>Both save {inr(winner.saving)}</strong><small>You pay {inr(winner.payable)} either way</small></>
          ) : (
            <><strong>{winner.name} saves {inr(savingGap)} more</strong><small>Pay {inr(winner.payable)} instead of {inr(runnerUp.payable)}</small></>
          )}
        </div>
      )}
      {both && !comparison.comparable && (
        <p className="of-single">{comparisonReason[comparison.reason] || "Booking terms differ, so compare before you book."}</p>
      )}

      {showFullWeek && <div className="of-week" aria-label="Seven day offer view">
        {visibleWeek.map((day, index) => (
          <span key={day.date} className={`of-week-day ${day.state}`} title={day.label}>
            <b>{showFullWeek ? day.day : index === 0 ? "Today" : "Tomorrow"}</b>
            <small>{day.state === "confirmed" ? (day.offer.pct ? `${day.offer.pct}%` : day.offer.flat ? `${inr(day.offer.flat)}` : "Yes") : day.state === "observed" ? "Observed" : "None"}</small>
          </span>
        ))}
      </div>}

      <ul className="of-platforms">
        {rows.map((r) => (
          <li key={r.key} className={`of-plat ${r.key}${winner && !tie && winner.key === r.key ? " win" : ""}`}>
            <div className="of-plat-main">
              <span className="of-plat-top"><span className="of-plat-name">{r.name}</span>{winner && !tie && winner.key === r.key && <span className="of-plat-winner">Best price</span>}</span>
              <span className="of-plat-title">{r.title}</span>
              <span className="of-plat-sub">
                {r.status && <span className={`of-when ${r.status.state}`}>{r.status.label}</span>}
                {r.sub && <span>{r.sub}</span>}
                {r.checkedAt && <span>checked {new Date(r.checkedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}</span>}
              </span>
            </div>
            <span className="of-plat-side">
              {r.saving > 0 && <span className="of-plat-price"><b>Save {inr(r.saving)}</b><small>Pay {inr(r.payable)}</small></span>}
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="of-plat-cta"><span>{r.cta}</span><span className="of-plat-arrow" aria-hidden="true">↗</span></a>}
            </span>
          </li>
        ))}
      </ul>

      {bestMatchingCard && (
        <p className="of-card-match"><b>Your {bestMatchingCard.cardLabel} matches</b><span>{bestMatchingCard.src} estimates {inr(bestMatchingCard.saving)} card saving. Stacking is not confirmed.</span></p>
      )}

      {cards.length > 0 && (
        <details className="of-cards">
          <summary>
            <span><b>{cards.length}</b> card and coupon offer{cards.length === 1 ? "" : "s"}</span>
            {bestCard && <span className="of-cards-best">card estimate up to {inr(bestCard.saving)} · stacking unconfirmed</span>}
          </summary>
          <ul>
            {cards.map((c, i) => (
              <li key={i} className={c.cardKey && selectedCards.includes(c.cardKey) ? "match" : undefined}>
                <span><em>{c.cardKey && selectedCards.includes(c.cardKey) ? "Your card" : c.src}</em>{c.title}{c.code ? ` · code ${c.code}` : c.via && c.src === "Swiggy" ? ` · ${c.via}` : ""}</span>
                <small>{c.saving > 0 ? `Save ${inr(c.saving)}` : `Bill ${inr(c.minBill)}+`}</small>
              </li>
            ))}
          </ul>
        </details>
      )}

      {item.district?.hours && <p className="of-hours">Open {item.district.hours}</p>}
    </article>
  );
}

const FILTERS = [
  { id: "all", label: "All deals" },
  { id: "both", label: "Compare both apps" },
  { id: "nocard", label: "No card needed" },
  { id: "live", label: "Available now" },
  { id: "lunch", label: "Lunch / afternoon" },
  { id: "dinner", label: "Dinner / evening" },
  { id: "cards", label: "Card offers" },
];

const BILL_PRESETS = [1000, 1500, 2000, 3000, 5000, 8000];
const CARD_WALLET_KEY = "hyd-eats-offer-cards-v1";

// Some spots carry the discovery query ("text:cafe kondapur") instead of an area.
// Pull the locality out of it, or drop it when the query is city-wide.
const AREA_FIXES = { "hitech city": "HITEC City" };
function cleanArea(area) {
  if (!area || !area.startsWith("text:")) return area;
  const place = area.slice(5).replace(/\b(cafe|bistro|eatery|bar|bakery|breakfast|artisan|cocktail|dessert|microbrewery|specialty|coffee|hyderabad)\b/gi, "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!place) return null;
  return AREA_FIXES[place] || place.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OffersClient({
  spotsList: rawSpotsList,
  updatedAt,
  history = { spots: {} },
  embedded = false,
  onSelectSpot = null,
  initialFilter = "all",
  initialArea = "all",
  initialPlatform = "all",
  initialBookingMode = "all",
  initialDate = "all",
  initialSpotId = null,
  landingLinks = [],
}) {
  const spotsList = useMemo(() => rawSpotsList.map((item) => item.area?.startsWith("text:") ? { ...item, area: cleanArea(item.area) } : item), [rawSpotsList]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [bill, setBill] = useState(3000);
  const [area, setArea] = useState(initialArea);
  const [platform, setPlatform] = useState(initialPlatform);
  const [bookingMode, setBookingMode] = useState(initialBookingMode);
  const [dateFilter, setDateFilter] = useState(initialDate);
  const [requestedSpot, setRequestedSpot] = useState(initialSpotId);
  const [selectedCards, setSelectedCards] = useState([]);
  const [cardOnly, setCardOnly] = useState(false);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);
  const [moreOpen, setMoreOpen] = useState(false);
  const extraActive = [dateFilter !== "all", platform !== "all", bookingMode !== "all", selectedCards.length > 0].filter(Boolean).length;
  const [now, setNow] = useState(null); // set after mount so server and client HTML match

  useEffect(() => {
    setNow(istNow());
    const t = setInterval(() => setNow(istNow()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (initialSpotId || typeof window === "undefined") return;
    const spot = new URLSearchParams(window.location.search).get("deal");
    if (spot) setRequestedSpot(spot);
  }, [initialSpotId]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CARD_WALLET_KEY) || "{}");
      if (Array.isArray(saved.cards)) setSelectedCards(saved.cards);
      if (typeof saved.only === "boolean") setCardOnly(saved.only);
    } catch {}
    setWalletLoaded(true);
  }, []);

  useEffect(() => {
    if (!walletLoaded) return;
    window.localStorage.setItem(CARD_WALLET_KEY, JSON.stringify({ cards: selectedCards, only: cardOnly }));
  }, [selectedCards, cardOnly, walletLoaded]);

  useEffect(() => {
    setVisibleCount(30);
  }, [search, filter, area, bill, platform, bookingMode, dateFilter, requestedSpot, selectedCards, cardOnly]);

  const checked = useMemo(() => {
    if (!updatedAt) return "";
    return new Date(updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  }, [updatedAt]);

  const isLive = (item) => platformDeals(item, now, bill).some((row) => row.status?.state === "live");
  const onBoth = (item) => Boolean(item.district && item.swiggy);
  const publicDeals = (item) => platformDeals(item, now, bill).some((row) => row.deal && row.saving > 0);
  const bestValue = (item) => Math.max(
    0,
    ...platformDeals(item, now, bill).map((row) => row.saving),
    ...allCardOffers(item, bill).map((offer) => offer.saving)
  );
  const clearWin = (item) => {
    const result = comparisonResult(platformDeals(item, now, bill), bill);
    return Boolean(result.comparable && !result.tie);
  };
  const freshness = (item) => Math.max(
    Date.parse(item.district?.fetchedAt || "") || 0,
    Date.parse(item.swiggy?.fetchedAt || "") || 0
  );
  const liveCount = now ? spotsList.filter(isLive).length : 0;
  const bothCount = spotsList.filter(onBoth).length;
  const areas = useMemo(() => [...new Set(spotsList.map((item) => item.area).filter(Boolean))].sort(), [spotsList]);
  const cardOptions = useMemo(() => {
    const options = new Map();
    for (const item of spotsList) {
      for (const offer of allCardOffers(item)) if (offer.cardKey && offer.cardLabel) options.set(offer.cardKey, offer.cardLabel);
    }
    return [...options].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [spotsList]);
  const addCard = (key) => key && setSelectedCards((cards) => cards.includes(key) ? cards : [...cards, key]);
  const removeCard = (key) => setSelectedCards((cards) => {
    const next = cards.filter((card) => card !== key);
    if (!next.length) setCardOnly(false);
    return next;
  });

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spotsList
      .filter((item) => {
        if (requestedSpot && item.spotId !== requestedSpot) return false;
        if (q && !`${item.name} ${item.area}`.toLowerCase().includes(q)) return false;
        if (area !== "all" && item.area !== area) return false;
        if (platform !== "all" && !item[platform]?.url) return false;
        if (cardOnly) {
          if (!selectedCards.length) return false;
          if (!allCardOffers(item, bill).some((offer) => offer.eligible && offer.cardKey && selectedCards.includes(offer.cardKey))) return false;
        }
        if (bookingMode !== "all") {
          const modes = ["district", "swiggy"].flatMap((source) => normalizePlatformOffers(item.spotId, source, item[source]))
            .filter((offer) => offer.kind === "restaurant").map((offer) => offer.bookingMode);
          if (!modes.includes(bookingMode)) return false;
        }
        if (dateFilter !== "all") {
          const week = buildDealWeek(item, history, now?.day);
          if (dateFilter === "today" && week[0]?.state !== "confirmed") return false;
          if (dateFilter === "tomorrow" && week[1]?.state !== "confirmed") return false;
          if (dateFilter === "weekend" && !week.some((day) => ["Sat", "Sun"].includes(day.day) && day.state !== "none")) return false;
        }
        if (filter === "both") return onBoth(item);
        if (filter === "nocard") return publicDeals(item);
        if (filter === "live") return isLive(item);
        if (filter === "lunch") return districtPublicDeals(item).some((deal) => mealPeriod(deal.when?.from) === "afternoon") || Boolean(item.swiggy?.deal?.allDay);
        if (filter === "dinner") return districtPublicDeals(item).some((deal) => mealPeriod(deal.when?.from) === "evening") || Boolean(item.swiggy?.deal?.allDay);
        if (filter === "cards") return allCardOffers(item, bill).some((offer) => offer.eligible && offer.cardKey);
        return true;
      })
      // Clear "this app is cheaper" answers lead; then biggest rupee saving.
      .sort((a, b) => (Number(clearWin(b)) - Number(clearWin(a))) || (bestValue(b) - bestValue(a)) || (freshness(b) - freshness(a)) || a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotsList, search, filter, area, bill, now, platform, bookingMode, dateFilter, requestedSpot, history, selectedCards, cardOnly]);

  // The single clearest "this app is cheaper" answer, shown above the list.
  const spotlight = useMemo(() => {
    if (requestedSpot || search.trim()) return null;
    for (const item of shown.slice(0, 20)) {
      const result = comparisonResult(platformDeals(item, now, bill), bill);
      if (result.comparable && !result.tie) {
        const winner = { ...result.winner, saving: savingFor(result.winner.deal, bill) };
        const runnerUp = { ...result.runnerUp, saving: savingFor(result.runnerUp.deal, bill) };
        return { item, winner, runnerUp, gap: winner.saving - runnerUp.saving };
      }
    }
    return null;
  }, [shown, now, bill, requestedSpot, search]);

  return (
    <div className={embedded ? "of-app" : undefined}>
      {!embedded && (
        <section className="of-pitch">
          <p className="of-pitch-lead">
            Compare Swiggy Dineout and District for the exact restaurant branch. We keep pre-book, walk-in, lunch, afternoon and evening offers separate, then compare prices only when the booking conditions match.
          </p>
          <ul className="of-stats">
            <li><b>{spotsList.length}</b> spots with deals</li>
            <li><b>{bothCount}</b> on both apps</li>
            {now && liveCount > 0 && <li><b>{liveCount}</b> live right now</li>}
          </ul>
          {checked && <p className="of-checked">Prices checked {checked}</p>}
        </section>
      )}

      <div className="of-controls">
        {requestedSpot && (
          <div className="of-exact">
            <span>Showing this exact restaurant branch</span>
            <button type="button" onClick={() => setRequestedSpot(null)}>Show all</button>
          </div>
        )}
        <div className="of-control-row">
          <label className="of-search">
            <Icon name="search" size={16} color="var(--muted)" />
            <input type="search" placeholder="Search restaurant or area" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <button type="button" className={`of-filter-btn${moreOpen ? " open" : ""}`} aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}>
            Filters{extraActive > 0 && <b>{extraActive}</b>}
          </button>
        </div>
        <div className="of-chips" role="group" aria-label="Filter deals">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={filter === f.id ? "active" : undefined} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {moreOpen && (
      <div className="of-more">
        <div className="of-filter-row">
          <label>
            <span>Area</span>
            <select value={area} onChange={(event) => setArea(event.target.value)}>
              <option value="all">All Hyderabad</option>
              {areas.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            <span>Date</span>
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
              <option value="all">Any day</option>
              <option value="today">Confirmed today</option>
              <option value="tomorrow">Confirmed tomorrow</option>
              <option value="weekend">Weekend: confirmed or observed</option>
            </select>
          </label>
          <label>
            <span>Platform</span>
            <select value={platform} onChange={(event) => setPlatform(event.target.value)}>
              <option value="all">Both platforms</option>
              <option value="district">District</option>
              <option value="swiggy">Swiggy Dineout</option>
            </select>
          </label>
          <label>
            <span>Booking</span>
            <select value={bookingMode} onChange={(event) => setBookingMode(event.target.value)}>
              <option value="all">Any booking type</option>
              <option value="prebook">Pre-book</option>
              <option value="walkin">Walk-in / instant</option>
            </select>
          </label>
        </div>
      <section className="of-wallet" aria-labelledby="card-wallet-title">
        <div>
          <h2 id="card-wallet-title">Cards I have</h2>
          <p>Add your bank card to see which restaurants give it an extra discount. Saved only on this device.</p>
        </div>
        <div className="of-wallet-controls">
          <select aria-label="Add a card" value="" onChange={(event) => addCard(event.target.value)}>
            <option value="">Add a card…</option>
            {cardOptions.filter((option) => !selectedCards.includes(option.key)).map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
          </select>
          <label className="of-wallet-only">
            <input type="checkbox" checked={cardOnly} disabled={!selectedCards.length} onChange={(event) => setCardOnly(event.target.checked)} />
            Only matching restaurants
          </label>
        </div>
        {selectedCards.length > 0 && (
          <div className="of-wallet-cards">
            {selectedCards.map((key) => <button type="button" key={key} onClick={() => removeCard(key)}>{cardOptions.find((option) => option.key === key)?.label || key}<span aria-hidden="true">×</span></button>)}
          </div>
        )}
      </section>
      </div>
      )}

      {spotlight && (
        <a className="of-spotlight" href={`#deal-${spotlight.item.spotId}`}>
          <span className="of-spotlight-kicker">Biggest saving right now</span>
          <span className="of-spotlight-name">{spotlight.item.name}</span>
          <span className="of-spotlight-row">
            <b>{inr(spotlight.winner.saving)}</b>
            <span>off on {spotlight.winner.name}<small>{inr(spotlight.gap)} more than {spotlight.runnerUp.name}</small></span>
          </span>
        </a>
      )}

      <div className="of-results-head">
        <b>{shown.length} restaurants</b>
        <label className="of-bill-pick">
          for a
          <select value={bill} onChange={(event) => setBill(Number(event.target.value))} aria-label="Your bill">
            {BILL_PRESETS.map((amount) => <option key={amount} value={amount}>{inr(amount)}</option>)}
          </select>
          bill
        </label>
      </div>

      {shown.length > 0 ? (
        <>
          <div className="of-grid">
            {shown.slice(0, visibleCount).map((item) => <OfferCard key={item.spotId} item={item} now={now} bill={bill} history={history} selectedCards={selectedCards} onSelectSpot={onSelectSpot} />)}
          </div>
          {visibleCount < shown.length && (
            <button className="of-load-more" type="button" onClick={() => setVisibleCount((count) => count + 30)}>
              Show 30 more <span>{shown.length - visibleCount} remaining</span>
            </button>
          )}
        </>
      ) : (
        <div className="of-empty">
          <b>No deals match</b>
          <span>{filter === "live" ? "Nothing is live this minute. Try Dinner / evening or All deals." : "Try another name or clear the filters."}</span>
        </div>
      )}

      <p className="of-note">
        Offers are read from each restaurant&apos;s Swiggy Dineout and District pages and can change during the day. Confirm in the app before you pay.
      </p>
      {!embedded && landingLinks.length > 0 && (
        <nav className="of-landing-links" aria-label="Browse verified restaurant deals">
          {landingLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
      )}
    </div>
  );
}
