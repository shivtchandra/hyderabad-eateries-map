"use client";

import { useEffect, useState } from "react";

// After a vote: "want the results every week?" One email field, two clear
// opt-ins, nothing pre-sent. Shown once per device; "Not now" hides it for
// 30 days; a sign-up hides it for good. Posts to /api/subscribe.
const KEY = "eats-email-ask";
const LATER_MS = 30 * 24 * 60 * 60 * 1000;

export function shouldAskEmail() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!v) return true;
    if (v.done) return false;
    return Date.now() - (v.later || 0) > LATER_MS;
  } catch { return true; }
}

export default function VoteFollowUp({ themeTitle = "", source = "vote" }) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [weekly, setWeekly] = useState(true);
  const [picks, setPicks] = useState(true);
  const [state, setState] = useState("idle"); // idle | sending | done | error
  useEffect(() => { setShow(shouldAskEmail()); }, []);
  if (!show) return null;

  const remember = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
  const dish = themeTitle.replace(/^best\s+/i, "").replace(/\s+in\s+hyderabad$/i, "").toLowerCase();

  const submit = async (ev) => {
    ev.preventDefault();
    const topics = [weekly && "weekly", picks && "picks"].filter(Boolean);
    if (!topics.length) return;
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topics, source, theme: themeTitle, website: ev.target.website?.value || "" }),
      });
      if (!res.ok) throw new Error("bad");
      setState("done");
      remember({ done: true });
    } catch { setState("error"); }
  };

  if (state === "done") {
    return (
      <div className="vfu vfu--done" role="status">
        <b>You&apos;re in.</b>
        <span>{weekly ? "Results land in your inbox every Sunday." : "We'll send new picks when they're worth it."} Unsubscribe any time.</span>
      </div>
    );
  }

  return (
    <form className="vfu" onSubmit={submit}>
      <div className="vfu-head">
        <b>Vote counted! Want the results?</b>
        <button type="button" className="vfu-later" onClick={() => { remember({ later: Date.now() }); setShow(false); }}>Not now</button>
      </div>
      <p className="vfu-sub">{dish ? `See where ${dish} lands, ` : ""}one email a week. Unsubscribe any time.</p>
      <div className="vfu-row">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" aria-label="Your email" autoComplete="email" />
        <button type="submit" disabled={state === "sending" || (!weekly && !picks)}>{state === "sending" ? "…" : "Notify me"}</button>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="vfu-hp" aria-hidden="true" />
      <label className="vfu-opt"><input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} /> Weekly results and new rankings</label>
      <label className="vfu-opt"><input type="checkbox" checked={picks} onChange={(e) => setPicks(e.target.checked)} /> New spots and picks near me</label>
      {state === "error" && <p className="vfu-err" role="alert">That didn&apos;t go through. Check the email and try again.</p>}
    </form>
  );
}
