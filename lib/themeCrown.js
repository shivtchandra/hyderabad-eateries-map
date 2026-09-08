/**
 * After endDate, keep a crown on the live #1 without locking votes.
 * winnerId/winnerName track the current leader so ranking pages stay in sync.
 */

export function isPastEndDate(theme, today = new Date().toISOString().slice(0, 10)) {
  return Boolean(theme?.endDate && today >= theme.endDate);
}

/** Returns updated theme fields if crown should move; null if no write needed. */
export function nextCrownUpdate(theme, results, today = new Date().toISOString().slice(0, 10)) {
  if (!isPastEndDate(theme, today)) return null;
  const lead = results?.[0];
  if (!lead?.spotId) return null;
  const name = (lead.name || "").slice(0, 100);
  if (theme.winnerId === lead.spotId && (theme.winnerName || "") === name) return null;
  return { winnerId: lead.spotId, winnerName: name };
}
