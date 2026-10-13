"use client";

import dynamic from "next/dynamic";

// Leaflet touches window, so the map only renders in the browser. Server
// pages pass plain points; this keeps the map chunk off their first load.
const SpotsMap = dynamic(() => import("./SpotsMap.jsx"), {
  ssr: false,
  loading: () => <div className="smap smap--loading" style={{ height: "100%" }} aria-hidden="true" />,
});

// The wrapper holds the height so the page doesn't jump when the map arrives.
export default function SpotsMapClient(props) {
  return <div style={{ height: props.height ?? 360 }}><SpotsMap {...props} /></div>;
}
