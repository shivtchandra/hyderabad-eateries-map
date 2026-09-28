// Home-screen install helpers. Chrome/Android fire `beforeinstallprompt`, which we
// hold until a good moment (after a few stamps). iPhone has no such event, so there
// we show the Share -> Add to Home Screen steps instead.
const DISMISS_KEY = "hyd-eats-install-dismissed";

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

export function canOfferInstall() {
  if (isStandalone()) return false;
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - t < 14 * 864e5) return false; // asked in the last 2 weeks
  } catch {}
  return Boolean(window.__eatsInstallEvent) || isIOS();
}

export function dismissInstall() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
}

export async function runInstall() {
  const ev = window.__eatsInstallEvent;
  if (!ev) return "unsupported";
  ev.prompt();
  const choice = await ev.userChoice.catch(() => null);
  window.__eatsInstallEvent = null;
  return choice?.outcome || "dismissed";
}
