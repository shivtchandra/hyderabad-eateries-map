"use client";

import Link from "next/link";

// Catches a failed page render anywhere under the root layout. One calm card,
// one purple button, a way back to the map. No stack traces, no red.
export default function RouteError({ reset }) {
  return (
    <main className="route-error">
      <div className="route-error-card">
        <span className="route-error-sticker" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8h11l-1.5 11a2 2 0 0 1-2 1.7H9.5a2 2 0 0 1-2-1.7z" />
            <path d="M9 4c0 1 1 1 1 2M13 4c0 1 1 1 1 2" />
          </svg>
        </span>
        <h1>Couldn’t load this right now.</h1>
        <p>Check your connection, or try again.</p>
        <div className="route-error-actions">
          <button type="button" className="route-error-retry" onClick={() => reset()}>Try again</button>
          <Link href="/" className="route-error-home">Back to the map</Link>
        </div>
      </div>
    </main>
  );
}
