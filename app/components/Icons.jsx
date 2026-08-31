"use client";

import { CATEGORY_GLYPH, UI_GLYPH, TAG_ICON, TIER_ICON } from "../../lib/iconPaths.js";

// One drawing language for the whole app: 24×24, stroke-based, round joins.
// Replaces every emoji — emoji render differently per platform and read cheap.
export function Icon({ name, size = 20, width = 1.75, color = "currentColor", style, className }) {
  const paths = UI_GLYPH[name] ?? CATEGORY_GLYPH[name];
  if (!paths) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function CategoryIcon({ category, size = 20, width = 1.75, color = "currentColor", style }) {
  const paths = CATEGORY_GLYPH[category];
  if (!paths) return <Icon name="utensils" size={size} width={width} color={color} style={style} />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function TagIcon(props) {
  return <Icon {...props} name={TAG_ICON[props.tag] ?? "sparkle"} />;
}

export function TierIcon(props) {
  return <Icon {...props} name={TIER_ICON[props.tier] ?? "sparkle"} />;
}

// Loose looping ribbons, the "good things are coming" motif — decoration for
// empty states and panel backgrounds.
export function Squiggles({ color = "var(--periwinkle)", opacity = 0.55, style }) {
  return (
    <svg viewBox="0 0 300 200" style={{ display: "block", width: "100%", ...style }} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" opacity={opacity}>
        <path d="M-10 40c40-34 74 26 116 4s52-52 96-34 66 44 108 20" />
        <path d="M-10 104c44-30 70 30 114 10s56-48 100-30 62 46 106 22" />
        <path d="M-10 168c40-32 78 28 120 6s50-50 94-32 64 44 106 20" />
      </g>
    </svg>
  );
}

// Groovy flowing ribbon — the poster motif, used as decoration in empty states
// and the passport header.
export function Wave({ height = 90, color = "var(--pop)", flip = false, style }) {
  return (
    <svg
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%", height, transform: flip ? "scaleY(-1)" : "none", ...style }}
      aria-hidden="true"
    >
      <path
        d="M0 62c48-40 96 22 148 6s70-58 122-46 88 54 130 30v70H0z"
        fill={color}
        opacity="0.9"
      />
      <path
        d="M0 78c52-32 92 18 148 4s78-46 128-34 82 44 124 26v36H0z"
        fill={color}
        opacity="0.45"
      />
    </svg>
  );
}
