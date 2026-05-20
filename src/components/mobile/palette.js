// Shared dark-mode palette used across every mobile screen. Pulled directly
// from the design reference so the UI matches 1:1.
export const C = {
  bg: "#0b160c",
  card: "#111e12",
  card2: "#162418",
  border: "#1e3d20",
  g1: "#2C5F2D",
  g2: "#4A8C2A",
  g3: "#6DB33F",
  g4: "#97C95C",
  white: "#fff",
  muted: "#5a7a50",
  orange: "#E8924A",
  blue: "#4A90C4",
  purple: "#8B6FCB",
  gold: "#D4A843",
  teal: "#3AADA8",
  red: "#E05050",
  pink: "#f472b6",
  dark: "#050c06",
};

// Injected once by MobileShell. Keeps mobile screens visually consistent
// without competing with the MUI theme used by the desktop surface.
export const MOBILE_GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
.ayumonk-mobile *{box-sizing:border-box}
.ayumonk-mobile button{font-family:inherit}
.ayumonk-mobile ::-webkit-scrollbar{display:none}
@keyframes ayumonkFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes ayumonkPulse{0%,100%{opacity:1}50%{opacity:.35}}
.ayumonk-anim{animation:ayumonkFadeUp .28s ease both}
`;
