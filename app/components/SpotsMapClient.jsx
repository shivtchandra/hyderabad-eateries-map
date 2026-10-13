"use client";

import dynamic from "next/dynamic";

// Leaflet touches window, so the map only renders in the browser. Server
// pages pass plain points; this keeps the map chunk off their first load.
const SpotsMap = dynamic(() => import("./SpotsMap.jsx"), {
  ssr: false,
  loading: () => <div className="smap smap--loading" style={{ height: 360 }} aria-hidden="true" />,
});

export default function SpotsMapClient(props) {
  return <SpotsMap {...props} />;
}
