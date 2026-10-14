// Ask Eats chatbot mark: a little robot head. Sits on the violet .ask-bot tile,
// body in currentColor (white), face cut out in violet.
export default function BotIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="3" r="1.7" fill="currentColor" />
      <path d="M12 4.6V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="3.6" y="7" width="16.8" height="13" rx="5" fill="currentColor" />
      <rect x="1.2" y="11.4" width="2.4" height="4.6" rx="1.2" fill="currentColor" />
      <rect x="20.4" y="11.4" width="2.4" height="4.6" rx="1.2" fill="currentColor" />
      <ellipse cx="9" cy="12.7" rx="1.6" ry="2" fill="var(--violet)" />
      <ellipse cx="15" cy="12.7" rx="1.6" ry="2" fill="var(--violet)" />
      <path d="M9.6 16.4q2.4 1.5 4.8 0" stroke="var(--violet)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
