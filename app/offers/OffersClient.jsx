"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "../components/Icons.jsx";
import { photoPathToCdn } from "../../lib/photos.js";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function istNow() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", year: "numeric", month: "2-digit", day: "2-digit", hour12: false }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return { day: `${get("year")}-${get("month")}-${get("day")}`, min: Number(get("hour")) * 60 + Number(get("minute")) };
}
function istDay(iso) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(iso));
}
function clock(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

// District slot deal right now: live | later | over | anytime. "today" windows are only
// trusted if the page was read today (IST); otherwise we just show the hours.
function districtStatus(deal, fetchedAt, now) {
  const w = deal?.when;
  if (!w || (w.from == null && w.to == null)) return { state: "anytime", label: "Any time" };
  const range = w.from != null && w.to != null ? `${clock(w.from)} to ${clock(w.to)}` : w.from != null ? `From ${clock(w.from)}` : `Till ${clock(w.to)}`;
  if (!now || istDay(fetchedAt) !== now.day || (w.day && w.day !== "today")) return { state: "later", label: range };
  const started = w.from == null || now.min >= w.from;
  const ended = w.to != null && now.min >= w.to;
  if (started && !ended) return { state: "live", label: w.to != null ? `Live till ${clock(w.to)}` : "Live now" };
  if (ended) return { state: "over", label: "Over for today" };
  return { state: "later", label: range };
}
function swiggyStatus(deal, fetchedAt, now) {
  if (!deal) return null;
  if (deal.allDay && now && istDay(fetchedAt) === now.day) return { state: "live", label: "All day today" };
  if (deal.allDay) return { state: "anytime", label: "All day" };
  return { state: "anytime", label: deal.on || "On the bill" };
}

function savingFor(deal, bill) {
  if (!deal || (deal.minBill && bill < deal.minBill)) return 0;
  const raw = deal.flat || (deal.pct ? bill * deal.pct / 100 : 0);
  return Math.round(deal.cap ? Math.min(raw, deal.cap) : raw);
}

const looksLikeCardOffer = (deal) =>
  /\b(card|credit|debit|bank|visa|mastercard|upi|paytm|hdfc|kotak|rbl|hsbc|idfc|dbs|jupiter|au)\b/i.test(deal?.title || "");

const districtPublicDeals = (item) =>
  (item.district?.deals || []).filter((deal) => !looksLikeCardOffer(deal));

const bestOf = (list, bill = 3000) =>
  [...(list || [])].sort((a, b) => savingFor(b, bill) - savingFor(a, bill))[0] || null;

const short = (d) => (d?.pct ? `${d.pct}% off` : d?.flat ? `${inr(d.flat)} off` : d?.title || "");

function platformDeals(item, now, bill = 3000) {
  const out = [];
  const dd = bestOf(districtPublicDeals(item), bill);
  if (item.district) {
    out.push({
      key: "district",
      name: "District",
      deal: dd,
      title: dd?.title || (item.district.bankOffers?.length ? "Card offers only" : "No deal today"),
      sub: dd ? [dd.slotsLeft ? `${dd.slotsLeft} slots left` : null, "pre-book"].filter(Boolean).join(" · ") : null,
      status: dd ? districtStatus(dd, item.district.fetchedAt, now) : null,
      url: item.district.url,
      cta: "Book",
      saving: savingFor(dd, bill),
      payable: bill - savingFor(dd, bill),
      checkedAt: item.district.fetchedAt,
    });
  }
  const sd = item.swiggy?.deal;
  if (item.swiggy) {
    out.push({
      key: "swiggy",
      name: "Swiggy Dineout",
      deal: sd,
      title: sd?.title || (item.swiggy.cardOffers?.length ? "Card offers only" : "No deal today"),
      sub: sd?.allDay ? sd.on : null,
      status: swiggyStatus(sd, item.swiggy.fetchedAt, now),
      url: item.swiggy.url,
      cta: "Pay bill",
      saving: savingFor(sd, bill),
      payable: bill - savingFor(sd, bill),
      checkedAt: item.swiggy.fetchedAt,
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
    .map((offer) => ({ ...offer, saving: savingFor(offer, bill), eligible: !offer.minBill || bill >= offer.minBill }))
    .sort((a, b) => b.saving - a.saving);
}

function OfferCard({ item, now, bill, onSelectSpot }) {
  const rows = platformDeals(item, now, bill);
  const cards = allCardOffers(item, bill);
  const both = rows.length === 2 && rows.every((row) => row.deal);
  const winner = both ? [...rows].sort((a, b) => b.saving - a.saving)[0] : null;
  const tie = both && rows[0].saving === rows[1].saving;
  const bestCard = cards.find((card) => card.saving > 0);
  const img = item.photo ? (item.photo.startsWith("http") ? item.photo : photoPathToCdn(item.photo)) : null;

  return (
    <article className="of-card">
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

      {both && (
        <p className="of-verdict">
          {tie
            ? <>Both apps save about <b>{inr(winner.saving)}</b> on this bill</>
            : <><b>{winner.name}</b> saves about {inr(winner.saving)} on this bill</>}
        </p>
      )}

      <ul className="of-platforms">
        {rows.map((r) => (
          <li key={r.key} className={`of-plat ${winner && !tie && winner.key === r.key ? "win" : ""}`}>
            <div className="of-plat-main">
              <span className="of-plat-name">{r.name}</span>
              <span className="of-plat-title">{r.title}</span>
              <span className="of-plat-sub">
                {r.status && <span className={`of-when ${r.status.state}`}>{r.status.label}</span>}
                {r.sub && <span>{r.sub}</span>}
                {r.checkedAt && <span>checked {new Date(r.checkedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}</span>}
              </span>
            </div>
            <span className="of-plat-side">
              {r.saving > 0 && <span className="of-plat-price"><b>Save {inr(r.saving)}</b><small>Pay {inr(r.payable)}</small></span>}
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="of-plat-cta">{r.cta} →</a>}
            </span>
          </li>
        ))}
      </ul>

      {cards.length > 0 && (
        <details className="of-cards">
          <summary>
            <span><b>{cards.length}</b> card and coupon offer{cards.length === 1 ? "" : "s"}</span>
            {bestCard && <span className="of-cards-best">up to {inr(bestCard.saving)} more with an eligible card</span>}
          </summary>
          <ul>
            {cards.map((c, i) => (
              <li key={i}>
                <span><em>{c.src}</em>{c.title}{c.code ? ` · code ${c.code}` : c.via && c.src === "Swiggy" ? ` · ${c.via}` : ""}</span>
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
  { id: "tonight", label: "Tonight" },
  { id: "cards", label: "Card offers" },
];

const BILL_PRESETS = [1500, 3000, 5000];

export default function OffersClient({ spotsList, updatedAt, embedded = false, onSelectSpot = null }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [bill, setBill] = useState(3000);
  const [area, setArea] = useState("all");
  const [visibleCount, setVisibleCount] = useState(30);
  const [now, setNow] = useState(null); // set after mount so server and client HTML match

  useEffect(() => {
    setNow(istNow());
    const t = setInterval(() => setNow(istNow()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setVisibleCount(30);
  }, [search, filter, area, bill]);

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
  const liveCount = now ? spotsList.filter(isLive).length : 0;
  const bothCount = spotsList.filter(onBoth).length;
  const areas = useMemo(() => [...new Set(spotsList.map((item) => item.area).filter(Boolean))].sort(), [spotsList]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spotsList
      .filter((item) => {
        if (q && !`${item.name} ${item.area}`.toLowerCase().includes(q)) return false;
        if (area !== "all" && item.area !== area) return false;
        if (filter === "both") return onBoth(item);
        if (filter === "nocard") return publicDeals(item);
        if (filter === "live") return isLive(item);
        if (filter === "tonight") return districtPublicDeals(item).some((deal) => (deal.when?.from ?? 0) >= 17 * 60) || Boolean(item.swiggy?.deal);
        if (filter === "cards") return allCardOffers(item, bill).some((offer) => offer.eligible);
        return true;
      })
      .sort((a, b) => (onBoth(b) - onBoth(a)) || (bestValue(b) - bestValue(a)) || (isLive(b) - isLive(a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotsList, search, filter, area, bill, now]);

  return (
    <div className={embedded ? "of-app" : undefined}>
      <section className="of-pitch">
        {!embedded && (
          <p className="of-pitch-lead">
            Why open Swiggy and District separately for the same restaurant? Every card here puts both apps side by side: the restaurant&apos;s discount on each, when it goes live, and all the card and coupon offers. Pick the cheaper one and go.
          </p>
        )}
        <div className="of-stats">
          <span><b>{spotsList.length}</b> spots with deals</span>
          <span><b>{bothCount}</b> on both apps</span>
          {now && <span><b>{liveCount}</b> live right now</span>}
          {checked && <span>Checked {checked}</span>}
        </div>
      </section>

      <section className="of-calculator" aria-labelledby="deal-bill-title">
        <div className="of-calculator-copy">
          <span>{embedded ? "Set your bill" : "Make the comparison real"}</span>
          <h2 id="deal-bill-title">{embedded ? "See your real saving" : "What will your table spend?"}</h2>
          <p>We rank offers by estimated rupees saved—not the loudest percentage.</p>
        </div>
        <div className="of-bill-control">
          <label htmlFor="expected-bill">Expected bill</label>
          <span className="of-bill-input"><b>₹</b><input id="expected-bill" type="number" min="100" step="100" inputMode="numeric" value={bill} onChange={(event) => setBill(Math.max(100, Number(event.target.value) || 100))} /></span>
          <div className="of-bill-presets" aria-label="Expected bill presets">
            {BILL_PRESETS.map((amount) => (
              <button key={amount} type="button" className={bill === amount ? "active" : undefined} onClick={() => setBill(amount)}>{inr(amount)}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="of-controls">
        <div className="of-control-row">
          <label className="of-search">
            <Icon name="search" size={16} color="var(--muted)" />
            <input type="search" placeholder="Search restaurant or area" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label className="of-area">
            <span>Area</span>
            <select value={area} onChange={(event) => setArea(event.target.value)}>
              <option value="all">All Hyderabad</option>
              {areas.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        </div>
        <div className="of-chips" role="group" aria-label="Filter deals">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={filter === f.id ? "active" : undefined} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="of-results-head">
        <b>{shown.length} restaurants</b>
        <span>ranked for a {inr(bill)} bill</span>
      </div>

      {shown.length > 0 ? (
        <>
          <div className="of-grid">
            {shown.slice(0, visibleCount).map((item) => <OfferCard key={item.spotId} item={item} now={now} bill={bill} onSelectSpot={onSelectSpot} />)}
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
          <span>{filter === "live" ? "Nothing is live this minute. Try Tonight or All deals." : "Try another name or clear the filter."}</span>
        </div>
      )}

      <p className="of-note">
        Offers are read from each restaurant&apos;s Swiggy Dineout and District pages and can change during the day. Confirm in the app before you pay.
      </p>
    </div>
  );
}
