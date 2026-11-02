import Link from "next/link";

export default function RankingDiscovery({ discovery, venues, links }) {
  return <section className="rk-section" aria-labelledby="ranking-visit-heading">
    <h2 id="ranking-visit-heading" className="site-section-title">{discovery.heading}</h2>
    <p className="rk-method">{discovery.intro}</p>
    <ul className="rk-visit-checks">
      {discovery.checks.map((check) => <li key={check}>{check}</li>)}
    </ul>
    {venues.length > 0 && <>
      <table className="rk-visit-table">
        <caption>Compare branches with local votes</caption>
        <thead><tr><th scope="col">Venue and branch address</th><th scope="col">Budget for two</th></tr></thead>
        <tbody>{venues.map((venue) => <tr key={venue.href}>
          <th scope="row"><Link href={venue.href}>{venue.name}</Link>
            {venue.address && <span className="rk-visit-address">{venue.address}</span>}
          </th>
          <td>{venue.budget ? `Approx. ₹${venue.budget.toLocaleString("en-IN")}` : "Check with venue"}</td>
        </tr>)}</tbody>
      </table>
      <p className="rk-method">Budgets are estimates, not menu prices or fixed packages. Confirm current prices and availability with the branch.</p>
    </>}
    <div className="rk-faq">
      {discovery.faqs.map(({ q, a }) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </div>
    {links.length > 0 && <nav aria-label="Related food guides and rankings">
      <h3 className="site-section-title">Narrow your search</h3>
      <ul className="rk-visit-links">{links.map(({ href, label }) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul>
    </nav>}
  </section>;
}
