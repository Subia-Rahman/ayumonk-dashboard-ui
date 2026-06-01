import { createContext, useContext } from "react";

// ── Theme 1 · Sage (light, default) ──────────────────────────────────────────
export const LIGHT = {
  bg: "#F5F2EB", card: "#FBF9F4", card2: "#FFFFFF", border: "rgba(31,30,29,0.08)",
  g1: "#4F6048", g2: "#6B7F5C", g3: "#6B7F5C", g4: "#93A687",
  text: "#1F1E1D", white: "#FFFFFF", muted: "#6B6760",
  orange: "#B96B47", blue: "#6B7F8C", purple: "#8B7FB0", gold: "#B57F4A",
  teal: "#5A9B96", red: "#B85A4A", pink: "#c4607a", dark: "#1F1E1D",
  isDark: false,
};

// ── Theme 2 · Forest (dark) ──────────────────────────────────────────────────
export const DARK = {
  bg: "#0b160c", card: "#111e12", card2: "#162418", border: "#1e3d20",
  g1: "#2C5F2D", g2: "#4A8C2A", g3: "#6DB33F", g4: "#97C95C",
  text: "#ffffff", white: "#ffffff", muted: "#5a7a50",
  orange: "#E8924A", blue: "#4A90C4", purple: "#8B6FCB", gold: "#D4A843",
  teal: "#3AADA8", red: "#E05050", pink: "#f472b6", dark: "#050c06",
  isDark: true,
};

// ── Theme 3 · Saffron (light, warm clay + turmeric) ──────────────────────────
export const SAFFRON = {
  bg: "#F7F0E3", card: "#FDF8EE", card2: "#FFFFFF", border: "rgba(90,55,25,0.10)",
  g1: "#A8551F", g2: "#C97E2E", g3: "#C2772A", g4: "#E0A85C",
  text: "#2C2117", white: "#FFFFFF", muted: "#806C52",
  orange: "#C0604A", blue: "#5E828F", purple: "#9A7FB0", gold: "#C99A3F",
  teal: "#5A9B96", red: "#B85A4A", pink: "#c4607a", dark: "#2C2117",
  isDark: false,
};

// ── Theme 4 · Twilight (dark, indigo night + teal) ───────────────────────────
export const TWILIGHT = {
  bg: "#0b1020", card: "#141b30", card2: "#1b2540", border: "#28324f",
  g1: "#2C7A72", g2: "#359C90", g3: "#3FC9BB", g4: "#74E6D9",
  text: "#EAF0FA", white: "#ffffff", muted: "#7E8AAC",
  orange: "#E8924A", blue: "#6AA8E0", purple: "#9A8BF0", gold: "#D4A843",
  teal: "#3FC9BB", red: "#E0607A", pink: "#f472b6", dark: "#060a14",
  isDark: true,
};

// theme registry + ordered list for the picker
export const THEMES = { sage: LIGHT, forest: DARK, saffron: SAFFRON, twilight: TWILIGHT };
export const THEME_LIST = [
  { key: "sage",     label: "Sage",     sub: "Calm cream",    bg: "#F5F2EB", line: "#E4DCCB", accent: "#6B7F5C", dark: false },
  { key: "saffron",  label: "Saffron",  sub: "Warm clay",     bg: "#F7F0E3", line: "#E7D9C0", accent: "#C2772A", dark: false },
  { key: "forest",   label: "Forest",   sub: "Deep green",    bg: "#0b160c", line: "#1e3d20", accent: "#6DB33F", dark: true },
  { key: "twilight", label: "Twilight", sub: "Indigo & teal", bg: "#0b1020", line: "#28324f", accent: "#3FC9BB", dark: true },
];

// migrate older stored values ("light"/"dark") to theme keys
export const normalizeThemeKey = (v) => {
  if (v === "light") return "sage";
  if (v === "dark") return "forest";
  return THEMES[v] ? v : "sage";
};

// C is the convenience alias used by every mobile component (light defaults).
export const C = LIGHT;
export const CD = DARK;

// ── Theme context ─────────────────────────────────────────────────────────────
export const MobileThemeContext = createContext({
  palette: LIGHT,
  isDark: false,
  themeKey: "sage",
  setTheme: () => {},
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
@keyframes ayumonkFadeUp{from{opacity:0}to{opacity:1}}
@keyframes ayumonkPulse{0%,100%{opacity:1}50%{opacity:.35}}
.ayumonk-anim{animation:ayumonkFadeUp .28s ease both}
`;
