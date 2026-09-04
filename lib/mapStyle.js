// Custom vector basemap style.
//
// Raster tiles couldn't satisfy both requirements at once: POI icons (the red
// "+" hospital/pharmacy marks) are painted into the image, and CARTO's clean
// no-label style watermarks every tile without a paid key. With vector tiles we
// simply never draw the poi/label layers, and every colour is ours, so the map
// reads as one artefact with the cream palette instead of fighting it.
//
// Source: OpenFreeMap (free, keyless), OpenMapTiles schema.

// Colour is kept, parks read green, water reads blue, arterials read yellow, // just warmed and desaturated enough to sit under the cream UI rather than
// fight it. Muting these to near-grey was tried and made the city vanish.
const C = {
  bg: "#f4ecdd",
  water: "#a9cbdd",
  park: "#cfe0b8",
  wood: "#c4d9ac",
  sand: "#f0e4c8",
  building: "#e9dfcb",
  buildingLine: "#ded2ba",
  minor: "#fffdf7",
  minorCase: "#e5d9c4",
  major: "#fdeec7",
  majorCase: "#e6cf9c",
  motorway: "#fbdf9e",
  motorwayCase: "#dcb96a",
  rail: "#cdc0aa",
};

export const mapStyle = {
  version: 8,
  sources: {
    ofm: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
  },
  // Fonts are only needed if labels are drawn; we draw none.
  layers: [
    { id: "bg", type: "background", paint: { "background-color": C.bg } },

    {
      id: "landcover-wood",
      type: "fill",
      source: "ofm",
      "source-layer": "landcover",
      filter: ["in", "class", "wood", "forest", "grass"],
      paint: { "fill-color": C.wood, "fill-opacity": 0.7 },
    },
    {
      id: "landuse-park",
      type: "fill",
      source: "ofm",
      "source-layer": "park",
      paint: { "fill-color": C.park, "fill-opacity": 0.8 },
    },
    {
      id: "landuse-sand",
      type: "fill",
      source: "ofm",
      "source-layer": "landcover",
      filter: ["in", "class", "sand"],
      paint: { "fill-color": C.sand },
    },

    {
      id: "water",
      type: "fill",
      source: "ofm",
      "source-layer": "water",
      paint: { "fill-color": C.water },
    },
    {
      id: "waterway",
      type: "line",
      source: "ofm",
      "source-layer": "waterway",
      paint: { "line-color": C.water, "line-width": 1.2 },
    },

    {
      id: "building",
      type: "fill",
      source: "ofm",
      "source-layer": "building",
      minzoom: 14,
      paint: {
        "fill-color": C.building,
        "fill-outline-color": C.buildingLine,
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15.5, 0.75],
      },
    },

    // ---- Roads: casing then fill, so the network reads as structure ----
    {
      id: "road-minor-case",
      type: "line",
      source: "ofm",
      "source-layer": "transportation",
      filter: ["in", "class", "minor", "service", "track", "path"],
      minzoom: 13,
      paint: {
        "line-color": C.minorCase,
        "line-width": ["interpolate", ["linear"], ["zoom"], 13, 1.4, 18, 8],
      },
    },
    {
      id: "road-minor",
      type: "line",
      source: "ofm",
      "source-layer": "transportation",
      filter: ["in", "class", "minor", "service", "track", "path"],
      minzoom: 13,
      paint: {
        "line-color": C.minor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.6, 18, 6],
      },
    },

    {
      id: "road-major-case",
      type: "line",
      source: "ofm",
      "source-layer": "transportation",
      filter: ["in", "class", "secondary", "tertiary"],
      paint: {
        "line-color": C.majorCase,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.6, 18, 12],
      },
    },
    {
      id: "road-major",
      type: "line",
      source: "ofm",
      "source-layer": "transportation",
      filter: ["in", "class", "secondary", "tertiary"],
      paint: {
        "line-color": C.major,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 18, 9],
      },
    },

    {
      id: "road-trunk-case",
      type: "line",
      source: "ofm",
      "source-layer": "transportation",
      filter: ["in", "class", "motorway", "trunk", "primary"],
      paint: {
        "line-color": C.motorwayCase,
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.8, 18, 16],
      },
    },
    {
      id: "road-trunk",
      type: "line",
      source: "ofm",
      "source-layer": "transportation",
      filter: ["in", "class", "motorway", "trunk", "primary"],
      paint: {
        "line-color": C.motorway,
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 18, 12],
      },
    },

    {
      id: "rail",
      type: "line",
      source: "ofm",
      "source-layer": "transportation",
      filter: ["==", "class", "rail"],
      minzoom: 12,
      paint: { "line-color": C.rail, "line-width": 1.1, "line-dasharray": [3, 3] },
    },
  ],
  // No `poi`, `place`, `transportation_name` or `*_label` layers, that is the
  // whole point. Nothing on the basemap competes with the photo pins.
};
