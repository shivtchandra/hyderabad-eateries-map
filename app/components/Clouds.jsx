// The app's opening, after the reels' clouds-open hook: a light violet sky
// with a soft sun, the logo in the middle, two layers of clouds drifting. It
// covers the whole screen, search bar and tabs included. When the map and spots are
// ready (`parted`), the logo shrinks away and the clouds fly outward as if
// you broke through them (MapCanvas settles the map in at the same time).
// The map placeholder (app/page.jsx) and MapCanvas draw the same scene, so
// the hand-off is seamless.
export default function Clouds({ parted = false }) {
  return (
    <div className={`map-clouds${parted ? " is-parted" : ""}`} aria-hidden="true">
      <span className="mc-sun" />
      <Cloud className="mc mc--a" />
      <Cloud className="mc mc--b" />
      <span className="mc-center">
        <span className="mc-logo">E</span>
        <b className="mc-name">Hyderabad Eats</b>
        <span className="mc-line">Finding tasty spots<span className="mc-dots"><i /><i /><i /></span></span>
      </span>
      <Cloud className="mc mc--c" />
      <Cloud className="mc mc--d" />
      <Cloud className="mc mc--e" />
    </div>
  );
}

// A fluffy cloud: white puffs over a violet-tinted underside.
function Cloud({ className }) {
  const puffs = [[62, 64, 30], [108, 46, 40], [156, 58, 33], [194, 76, 24], [36, 82, 22]];
  return (
    <svg className={className} viewBox="0 0 240 120">
      <g fill="#e4dcfb" transform="translate(0 7)">
        {puffs.map(([cx, cy, r]) => <circle key={`s${cx}`} cx={cx} cy={cy} r={r} />)}
        <rect x="16" y="70" width="204" height="40" rx="20" />
      </g>
      <g fill="#fff">
        {puffs.map(([cx, cy, r]) => <circle key={cx} cx={cx} cy={cy} r={r} />)}
        <rect x="16" y="70" width="204" height="38" rx="19" />
      </g>
      <circle cx="96" cy="34" r="14" fill="#fff" opacity="0.9" />
    </svg>
  );
}
