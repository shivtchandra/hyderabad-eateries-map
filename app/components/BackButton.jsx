"use client";

import { useRouter } from "next/navigation";

/** History back when we came from this site; otherwise go to fallback. */
export default function BackButton({ fallback = "/" }) {
  const router = useRouter();

  function goBack() {
    if (typeof document !== "undefined") {
      try {
        const ref = document.referrer;
        if (ref && new URL(ref).origin === window.location.origin) {
          router.back();
          return;
        }
      } catch {
        /* ignore bad referrer */
      }
    }
    router.push(fallback);
  }

  return (
    <button type="button" className="site-back" onClick={goBack} aria-label="Back">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
    </button>
  );
}
