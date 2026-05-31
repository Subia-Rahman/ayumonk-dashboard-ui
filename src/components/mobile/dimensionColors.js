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

// Accepts any of: "nidra", "Nidra", "Nidra Sleep Quality", "Vihara · Hydration"
// and returns the dimension hue (falls back to sage).
export const dimHue = (label = "") => {
  const slug = String(label).toLowerCase().trim().split(/[\s·]+/)[0];
  return DIMENSION_HUE[slug] || FALLBACK;
};

// Challenge colour now follows its PARENT KPI's dimension for cohesion,
// instead of a per-type rainbow.
export const challengeHue = (kpiName = "") => dimHue(kpiName);

// Soft tint of any hex (e.g. card backgrounds / pills) — alpha 00-ff.
export const tint = (hex, alpha = "18") => `${hex}${alpha}`;
