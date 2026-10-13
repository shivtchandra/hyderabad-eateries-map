// The app's opening, same move as the reels: clouds over a violet sky that
// part once the map and the spots are ready. The map placeholder (app/page.jsx)
// and MapCanvas both draw it in the same place, so the hand-off is seamless.
export default function Clouds({ parted = false }) {
  return (
    <div className={`map-clouds${parted ? " is-parted" : ""}`} aria-hidden="true">
      <Cloud className="map-cloud map-cloud--s" />
      <Cloud className="map-cloud map-cloud--l" />
      <Cloud className="map-cloud map-cloud--r" />
      <p className="map-clouds-line">Finding tasty spots…</p>
    </div>
  );
}

function Cloud({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 110">
      <g fill="#fff">
        <circle cx="50" cy="70" r="35" />
        <circle cx="95" cy="50" r="45" />
        <circle cx="145" cy="65" r="38" />
        <rect x="15" y="70" width="170" height="40" rx="20" />
      </g>
    </svg>
  );
}
