"use client";

import Link from "next/link";

// Catches a failed page render anywhere under the root layout. One calm card,
// one purple button, a way back to the map. No stack traces, no red.
export default function RouteError({ reset }) {
  return (
    <main className="route-error">
      <div className="route-error-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="route-error-art" src="/stickers/irani-chai.webp" alt="" width={112} height={112} />
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
