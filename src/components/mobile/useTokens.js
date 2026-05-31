// src/components/mobile/useTokens.js
//
// One theme-aware token object so screens recolor with the MobileShell
// light/dark toggle instead of being hardwired to the light palette.
//
//   const t = useTokens();
//   <div style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}` }}>
//
// Surface + ink tokens come from the live palette; accent/semantic tokens
// (g3, orange, blue…) stay available straight off the palette too.

import { useMobileTheme } from "./palette";

export function useTokens() {
  const { palette: p, isDark } = useMobileTheme();
  return {
    ...p,                       // bg, card, card2, border, g1..g4, orange, blue, …
    isDark,
    // ink scale (the dark palette only ships `text` + `muted`, so derive the rest)
    text: p.text,                                   // primary
    sub:  isDark ? "#AFC4A4" : "#5C5A57",           // secondary body
    faint:isDark ? "#6E8A63" : "#9E9B97",           // tertiary / captions
    muted: p.muted,
    // common translucent fills, theme-correct
    track: isDark ? "rgba(255,255,255,0.08)" : "rgba(31,30,29,0.08)",
    hair:  p.border,
    // a recessed surface a touch darker than `card` (no `inset` in base palette)
    inset: isDark ? "#0D180E" : "#ECE7DC",
  };
}
