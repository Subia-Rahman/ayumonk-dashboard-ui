import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

// Accent colors — vibrant + recognizable on both light and dark surfaces.
// These do not change with theme mode; only the surface / text colors do.
export const ACCENT = {
  g1: "#2C5F2D",
  g2: "#4A8C2A",
  g3: "#6DB33F",
  g4: "#97C95C",
  white: "#FFFFFF",
  cream: "#E8F0E0",
  orange: "#E8924A",
  blue: "#4A90C4",
  purple: "#8B6FCB",
  gold: "#D4A843",
  teal: "#3AADA8",
  red: "#E05050",
  pink: "#f472b6",
};

const DARK_PALETTE = {
  isDark: true,
  // Page / wrapper background
  bg: "#0b160c",
  card: "#111e12",
  // Card surface overlays drawn on top of bg
  surface1: "rgba(255,255,255,0.025)",
  surface2: "rgba(255,255,255,0.03)",
  surface3: "rgba(255,255,255,0.04)",
  surface4: "rgba(255,255,255,0.06)",
  surfaceInput: "rgba(255,255,255,0.06)",
  // Borders
  border: "rgba(255,255,255,0.07)",
  borderSoft: "rgba(255,255,255,0.06)",
  borderHard: "#1e3d20",
  borderInput: "rgba(255,255,255,0.12)",
  // Text
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.65)",
  textTertiary: "rgba(255,255,255,0.5)",
  textMuted: "#6B8F60",
  textVeryMuted: "rgba(255,255,255,0.3)",
  textFaint: "rgba(255,255,255,0.18)",
  // Inverse — for chips/pills that need contrast against the brand green
  textOnAccent: "#FFFFFF",
};

const LIGHT_PALETTE = {
  isDark: false,
  // A medium-dark slate-sage rather than a true white surface. The reason:
  // many components in the dashboard hardcode `color: "#fff"` and
  // `rgba(255,255,255,X)` overlays that were designed for a dark surface.
  // A true light bg would make all that white text invisible. This tone
  // keeps the wellness-product brand feel, gives existing white text a
  // ~7:1 contrast ratio (well above AA), and lets the rgba(255,255,255)
  // overlays continue to read as elevated cards.
  bg: "#34433a",
  card: "#3f4f44",
  // Same direction as dark mode — light overlays on a tinted surface — so
  // existing inline `rgba(255,255,255,X)` styles keep working.
  surface1: "rgba(255,255,255,0.04)",
  surface2: "rgba(255,255,255,0.06)",
  surface3: "rgba(255,255,255,0.08)",
  surface4: "rgba(255,255,255,0.12)",
  surfaceInput: "rgba(255,255,255,0.08)",
  // Borders use light tints so card edges read on the green-slate surface.
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",
  borderHard: "rgba(255,255,255,0.18)",
  borderInput: "rgba(255,255,255,0.22)",
  // Text — cream/white anchors for readability against the medium surface.
  text: "#f3f6ef",
  textSecondary: "rgba(243,246,239,0.72)",
  textTertiary: "rgba(243,246,239,0.58)",
  textMuted: "#a8b6a8",
  textVeryMuted: "rgba(243,246,239,0.4)",
  textFaint: "rgba(243,246,239,0.28)",
  textOnAccent: "#FFFFFF",
};

/**
 * Returns the theme-aware "client design" palette plus the accent colors.
 *
 * Components that previously referenced a module-level `C = { bg, muted, g3,
 * ... }` constant can replace it with:
 *
 *     const C = useClientPalette();
 *
 * and keep every existing `C.x` reference working — the hook merges the
 * theme-dependent surfaces / borders / text colors with the constant ACCENT
 * palette so a single object covers both.
 *
 * Backwards-compat keys (`muted`, `white`, plus all accent shorthands) are
 * intentionally aliased to the new keys so legacy inline styles keep working
 * without per-line edits.
 */
export const useClientPalette = () => {
  const theme = useTheme();
  const mode = theme.palette.mode;
  return useMemo(() => {
    const base = mode === "light" ? LIGHT_PALETTE : DARK_PALETTE;
    return {
      ...ACCENT,
      ...base,
      // Back-compat aliases — older code reads C.muted, not C.textMuted.
      muted: base.textMuted,
    };
  }, [mode]);
};

export default useClientPalette;
