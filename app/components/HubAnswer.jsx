// The proof under a hub's answer-first subtitle (the subtitle is the quotable
// sentence): the real numbers as a small chip row, and when it was updated.
// `answer` is optional, for pages without a subtitle. Server component.
export default function HubAnswer({ answer, stats = [], updated = null }) {
  const when = updated ? new Date(`${updated}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;
  return (
    <section className="hub-answer" aria-label="In short">
      {answer && <p className="hub-answer-text">{answer}</p>}
      {stats.length > 0 && (
        <ul className="hub-stats">
          {stats.map((s) => (
            <li key={s.label}><b>{s.value}</b><span>{s.label}</span></li>
          ))}
        </ul>
      )}
      {when && <p className="hub-updated">Updated {when} · Hyderabad, Telangana</p>}
    </section>
  );
}

export function HubFaq({ faqs = [] }) {
  if (!faqs.length) return null;
  return (
    <section className="hub-faq" aria-label="Questions">
      <h2 className="site-section-title">Questions</h2>
      {faqs.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </section>
  );
}
