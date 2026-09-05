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
    <button type="button" className="site-back" onClick={goBack}>
      ← Back
    </button>
  );
}
