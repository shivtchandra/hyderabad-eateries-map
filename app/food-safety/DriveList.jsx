"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const ACTION_LABEL = {
  "licence-suspended": "Licence suspended",
  closed: "Operations stopped",
  notice: "Notice issued",
  penalty: "Penalty",
  "no-action": "No action",
};
const STATUS_LABEL = {
  "action-taken": "Action taken",
  "reinspection-due": "Re-inspection due",
  resumed: "Resumed after re-inspection",
};

// Timeline of drives with area + action filters. Data comes pre-shaped from the server page.
export default function DriveList({ drives }) {
  const [area, setArea] = useState("All");
  const [action, setAction] = useState("All");
  const areas = useMemo(() => ["All", ...new Set(drives.flatMap((d) => (d.entries || []).map((e) => e.area).filter(Boolean)))], [drives]);
  const actions = useMemo(() => ["All", ...new Set(drives.flatMap((d) => (d.entries || []).map((e) => e.action)))], [drives]);

  const shown = drives
    .map((d) => ({ ...d, list: (d.entries || []).filter((e) => (area === "All" || e.area === area) && (action === "All" || e.action === action)) }))
    .filter((d) => d.list.length || (area === "All" && action === "All"));

  return (
    <>
      {(areas.length > 2 || actions.length > 2) && (
        <div className="fs-filters">
          {areas.length > 2 && (
            <div className="fs-chiprow" aria-label="Filter by area">
              {areas.map((a) => (
                <button key={a} className={`fs-chip${area === a ? " is-on" : ""}`} onClick={() => setArea(a)}>{a}</button>
              ))}
            </div>
          )}
          {actions.length > 2 && (
            <div className="fs-chiprow" aria-label="Filter by action">
              {actions.map((a) => (
                <button key={a} className={`fs-chip${action === a ? " is-on" : ""}`} onClick={() => setAction(a)}>{a === "All" ? "All actions" : ACTION_LABEL[a] || a}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <ol className="fs-timeline">
        {shown.map((d) => (
          <li key={d.id} className="site-card fs-drive">
            <div className="fs-drive-head">
              <time dateTime={d.date}>{d.dateLabel}</time>
              <h2>{d.title}</h2>
              <div className="fs-drive-meta">
                {(d.areas || []).join(", ")}
                {d.inspected ? ` · ${d.inspected} inspected` : ""}
                {d.samples ? ` · ${d.samples} samples lifted` : ""}
              </div>
              {d.summary && <p className="fs-drive-summary">{d.summary}</p>}
            </div>

            {d.list.length > 0 && (
              <ul className="fs-entries">
                {d.list.map((e, i) => (
                  <li key={`${e.name}-${i}`} className="fs-entry">
                    <div className="fs-entry-top">
                      <div>
                        <div className="fs-entry-name">{e.href ? <Link href={e.href}>{e.name}</Link> : e.name}</div>
                        {e.area && <div className="fs-entry-area">{e.area}</div>}
                      </div>
                      <span className={`fs-pill fs-pill--${e.action}`}>{ACTION_LABEL[e.action] || e.action}</span>
                    </div>
                    {e.findings?.length > 0 && <div className="fs-findings">{e.findings.join(" · ")}</div>}
                    <div className="fs-status">
                      <span className={`fs-dot fs-dot--${e.status}`} />
                      {STATUS_LABEL[e.status] || e.status}
                      {e.statusDateLabel ? `, ${e.statusDateLabel}` : ""}
                      {e.statusNote ? `. ${e.statusNote}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="fs-sources">
              <span>Sources:</span>
              {(d.sources || []).map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.label || new URL(s.url).hostname}</a>
              ))}
              <span className="fs-authority">{d.authority}</span>
            </div>
          </li>
        ))}
      </ol>
      {!shown.length && <p className="fs-note">No restaurants match these filters.</p>}
    </>
  );
}
