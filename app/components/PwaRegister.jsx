"use client";

import { useEffect } from "react";

// Registers the service worker and keeps Chrome's install event for later, so the
// "Add to home screen" ask can come at a good moment instead of on first load.
export default function PwaRegister() {
  useEffect(() => {
    const hold = (e) => { e.preventDefault(); window.__eatsInstallEvent = e; };
    window.addEventListener("beforeinstallprompt", hold);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => window.removeEventListener("beforeinstallprompt", hold);
  }, []);
  return null;
}
