// src/components/mobile/dimensionColors.js
//
// Brand colour system for the six Ayurvedic wellness dimensions.
// Drop this file in and import { dimHue } wherever a KPI / challenge / badge
// needs a colour — it REPLACES the rainbow KPI_COLORS / METRIC_COLORS /
// TYPE_COLORS index palettes so the whole app shares one cohesive hue set.
//
// These mid-tone hues are tuned to read on BOTH the cream light surface and
// the dark-forest surface, so you don't need a per-theme variant.

export const DIMENSION_HUE = {
  nidra:  "#8B6FCB", // Sleep      — violet
  manas:  "#C36FA8", // Mind       — rose
  aahar:  "#4F9D5B", // Nutrition  — green
  vihara: "#4A90C4", // Lifestyle  — blue
  charya: "#C99A3F", // Routine    — gold
  ojas:   "#3AA8A0", // Vitality   — teal
};

const FALLBACK = "#6B7F5C"; // sage — matches palette g3

// Brand palette used to give NON-dimension KPI names (e.g. "Physical Vitality",
// "Cognitive Focus") a stable, distinct, on-brand hue instead of all-sage.
const HUE_PALETTE = [
  "#4F9D5B", // green
  "#4A90C4", // blue
  "#8B6FCB", // violet
  "#C99A3F", // gold
  "#C36FA8", // rose
  "#3AA8A0", // teal
  "#B96B47", // clay
  "#5E62A6", // indigo
];

const hashStr = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

// Accepts any of: "nidra", "Nidra", "Nidra Sleep Quality", "Vihara · Hydration"
// Returns the dimension hue when the label maps to a known dimension; otherwise
// a stable distinct hue derived from the label so each KPI tile is colour-coded.
export const dimHue = (label = "") => {
  const raw = String(label).toLowerCase().trim();
  if (!raw) return FALLBACK;
  const slug = raw.split(/[\s·]+/)[0];
  if (DIMENSION_HUE[slug]) return DIMENSION_HUE[slug];
  return HUE_PALETTE[hashStr(raw) % HUE_PALETTE.length];
};

// Challenge colour now follows its PARENT KPI's dimension for cohesion,
// instead of a per-type rainbow.
export const challengeHue = (kpiName = "") => dimHue(kpiName);

// Soft tint of any hex (e.g. card backgrounds / pills) — alpha 00-ff.
export const tint = (hex, alpha = "18") => `${hex}${alpha}`;
