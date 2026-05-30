import { createContext, useContext } from "react";

// ── Light palette (primary / default) ────────────────────────────────────────
export const LIGHT = {
  bg:     "#F5F2EB",
  card:   "#FBF9F4",
  card2:  "#FFFFFF",
  border: "rgba(31,30,29,0.08)",
  // sage greens (replaces the vivid greens)
  g1: "#4F6048",
  g2: "#6B7F5C",
  g3: "#6B7F5C",
  g4: "#93A687",
  // text
  text:  "#1F1E1D",
  white: "#FFFFFF",
  muted: "#6B6760",
  // semantic accents — muted to suit light surfaces
  orange: "#B96B47",   // clay
  blue:   "#6B7F8C",
  purple: "#8B7FB0",
  gold:   "#B57F4A",
  teal:   "#5A9B96",
  red:    "#B85A4A",
  pink:   "#c4607a",
  dark:   "#1F1E1D",
};

// ── Dark palette (secondary / toggle) ────────────────────────────────────────
export const DARK = {
  bg:     "#0b160c",
  card:   "#111e12",
  card2:  "#162418",
  border: "#1e3d20",
  g1: "#2C5F2D",
  g2: "#4A8C2A",
  g3: "#6DB33F",
  g4: "#97C95C",
  text:  "#ffffff",
  white: "#ffffff",
  muted: "#5a7a50",
  orange: "#E8924A",
  blue:   "#4A90C4",
  purple: "#8B6FCB",
  gold:   "#D4A843",
  teal:   "#3AADA8",
  red:    "#E05050",
  pink:   "#f472b6",
  dark:   "#050c06",
};

// C is the convenience alias used by every mobile component.
// Light is the new default; switch happens via MobileThemeContext.
export const C  = LIGHT;
export const CD = DARK;

// ── Theme context ─────────────────────────────────────────────────────────────
export const MobileThemeContext = createContext({
  palette: LIGHT,
  isDark: false,
  toggle: () => {},
});

export function useMobileTheme() {
  return useContext(MobileThemeContext);
}

// ── Global CSS injected once by MobileShell ───────────────────────────────────
export const MOBILE_GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
.ayumonk-mobile *{box-sizing:border-box}
.ayumonk-mobile button{font-family:inherit}
.ayumonk-mobile ::-webkit-scrollbar{display:none}
@keyframes ayumonkFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes ayumonkPulse{0%,100%{opacity:1}50%{opacity:.35}}
.ayumonk-anim{animation:ayumonkFadeUp .28s ease both}
`;
