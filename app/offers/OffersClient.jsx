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

const value = (d) => (d ? (d.pct || 0) * 100 + (d.flat || 0) / 10 : 0);
const bestOf = (list) => [...(list || [])].sort((a, b) => value(b) - value(a))[0] || null;
const short = (d) => (d?.pct ? `${d.pct}% off` : d?.flat ? `${inr(d.flat)} off` : d?.title || "");

function platformDeals(item, now) {
  const out = [];
  const dd = bestOf(item.district?.deals);
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
    });
  }
  const sd = item.swiggy?.deal;
  if (item.swiggy) {
    out.push({
      key: "swiggy",
      name: "Swiggy Dineout",
      deal: sd,
      title: sd?.title || (item.swiggy.cardOffers?.length ? "Card offers only" : "No deal today"),
      sub: sd?.on || null,
      status: swiggyStatus(sd, item.swiggy.fetchedAt, now),
      url: item.swiggy.url,
      cta: "Pay bill",
    });
  }
  return out;
}

function allCardOffers(item) {
  const d = (item.district?.bankOffers || []).map((c) => ({ ...c, via: c.bank, src: "District" }));
  const s = (item.swiggy?.cardOffers || []).map((c) => ({ ...c, src: "Swiggy" }));
  return [...d, ...s].sort((a, b) => value(b) - value(a));
}

function OfferCard({ item, now }) {
  const rows = platformDeals(item, now);
  const cards = allCardOffers(item);
  const both = rows.length === 2 && rows.every((r) => r.deal);
  const winner = both ? [...rows].sort((a, b) => value(b.deal) - value(a.deal))[0] : null;
  const tie = both && value(rows[0].deal) === value(rows[1].deal);
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
          {item.slug ? <Link href={`/spot/${item.slug}`} className="of-card-name">{item.name}</Link> : <span className="of-card-name">{item.name}</span>}
          <span className="of-card-meta">{[item.area, item.rating ? `★ ${item.rating}` : null].filter(Boolean).join(" · ")}</span>
        </div>
      </header>

      {both && (
        <p className="of-verdict">
          {tie ? `Same ${short(winner.deal)} on both apps` : <>Better on <b>{winner.name}</b>: {short(winner.deal)}</>}
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
              </span>
            </div>
            {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="of-plat-cta">{r.cta} →</a>}
          </li>
        ))}
      </ul>

      {cards.length > 0 && (
        <details className="of-cards">
          <summary>
            <span><b>{cards.length}</b> card and coupon offer{cards.length === 1 ? "" : "s"}</span>
            <span className="of-cards-best">best {short(cards[0])}{cards[0].via ? ` · ${cards[0].via}` : ""}</span>
          </summary>
          <ul>
            {cards.map((c, i) => (
              <li key={i}>
                <span><em>{c.src}</em>{c.title}{c.code ? ` · code ${c.code}` : c.via && c.src === "Swiggy" ? ` · ${c.via}` : ""}</span>
                {c.minBill && <small>Bill {inr(c.minBill)}+</small>}
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
  { id: "both", label: "On both apps" },
  { id: "live", label: "Live now" },
  { id: "tonight", label: "Tonight" },
  { id: "cards", label: "Card offers" },
];

export default function OffersClient({ spotsList, updatedAt }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [now, setNow] = useState(null); // set after mount so server and client HTML match

  useEffect(() => {
    setNow(istNow());
    const t = setInterval(() => setNow(istNow()), 60000);
    return () => clearInterval(t);
  }, []);

  const checked = useMemo(() => {
    if (!updatedAt) return "";
    return new Date(updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  }, [updatedAt]);

  const isLive = (item) => platformDeals(item, now).some((r) => r.status?.state === "live");
  const onBoth = (item) => Boolean(item.district && item.swiggy);
  const bestValue = (item) => Math.max(...platformDeals(item, now).map((r) => value(r.deal)), value(bestOf(allCardOffers(item))) / 10);
  const liveCount = now ? spotsList.filter(isLive).length : 0;
  const bothCount = spotsList.filter(onBoth).length;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spotsList
      .filter((item) => {
        if (q && !`${item.name} ${item.area}`.toLowerCase().includes(q)) return false;
        if (filter === "both") return onBoth(item);
        if (filter === "live") return isLive(item);
        if (filter === "tonight") return (item.district?.deals || []).some((d) => (d.when?.from ?? 0) >= 17 * 60);
        if (filter === "cards") return allCardOffers(item).length > 0;
        return true;
      })
      .sort((a, b) => (onBoth(b) - onBoth(a)) || (isLive(b) - isLive(a)) || (bestValue(b) - bestValue(a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotsList, search, filter, now]);

  return (
    <div>
      <section className="of-pitch">
        <p className="of-pitch-lead">
          Why open Swiggy and District separately for the same restaurant? Every card here puts both apps side by side: the restaurant&apos;s discount on each, when it goes live, and all the card and coupon offers. Pick the cheaper one and go.
        </p>
        <div className="of-stats">
          <span><b>{spotsList.length}</b> spots with deals</span>
          <span><b>{bothCount}</b> on both apps</span>
          {now && <span><b>{liveCount}</b> live right now</span>}
          {checked && <span>Checked {checked}</span>}
        </div>
      </section>

      <div className="of-controls">
        <label className="of-search">
          <Icon name="search" size={16} color="var(--muted)" />
          <input type="search" placeholder="Search a restaurant or area" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <div className="of-chips" role="group" aria-label="Filter deals">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={filter === f.id ? "active" : undefined} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length > 0 ? (
        <div className="of-grid">
          {shown.map((item) => <OfferCard key={item.spotId} item={item} now={now} />)}
        </div>
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
