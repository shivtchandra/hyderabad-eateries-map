"use client";

import { useState } from "react";
import { Icon } from "./Icons.jsx";
import { dismissInstall, isIOS, runInstall } from "../../lib/install.js";

// Shown after a few stamps: people who have logged real visits are the ones worth
// asking to keep the app on their home screen.
export default function InstallPrompt({ stamps, onClose }) {
  const [iosSteps, setIosSteps] = useState(false);
  const close = () => { dismissInstall(); onClose(); };

  const install = async () => {
    if (isIOS()) { setIosSteps(true); return; }
    const outcome = await runInstall();
    if (outcome !== "accepted") dismissInstall();
    onClose();
  };

  return (
    <div className="install-card material" role="dialog" aria-label="Add Hyderabad Eats to your home screen">
      <img src="/icon-192.png" alt="" width={48} height={48} />
      <div className="install-copy">
        <b>Keep your passport one tap away</b>
        {iosSteps ? (
          <span>Tap <Icon name="share" size={13} width={2} color="var(--violet)" /> Share, then <b>Add to Home Screen</b>.</span>
        ) : (
          <span>{stamps} spots stamped. Add Hyderabad Eats to your home screen, it opens like an app.</span>
        )}
      </div>
      <div className="install-actions">
        {!iosSteps && <button type="button" className="install-yes" onClick={install}>Add</button>}
        <button type="button" className="install-no" onClick={close}>{iosSteps ? "Got it" : "Not now"}</button>
      </div>
    </div>
  );
}
