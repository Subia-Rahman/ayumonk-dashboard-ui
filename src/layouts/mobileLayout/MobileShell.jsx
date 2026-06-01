import { useEffect, useState } from "react";
import { THEMES, LIGHT, normalizeThemeKey, MOBILE_GLOBAL_CSS, MobileThemeContext } from "../../components/mobile/palette";
import BottomNav from "./BottomNav";
import MobileHeader from "./MobileHeader";

let stylesInjected = false;
function injectGlobalStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.dataset.ayumonkMobile = "true";
  tag.textContent = MOBILE_GLOBAL_CSS;
  document.head.appendChild(tag);
  stylesInjected = true;
}

export default function MobileShell({
  children,
  navItems,
  activeTab,
  onNav,
  accent,
  accentDark,
  roleLabel = "WELLNESS PLATFORM",
  roleLabelColor,
  badgeColor,
  onProfileShortcut,
  notch = false,
  centerBadge,
}) {
  const [themeKey, setThemeKey] = useState(() =>
    normalizeThemeKey(
      typeof localStorage !== "undefined" ? localStorage.getItem("ayumonk-theme") : "sage",
    ),
  );

  const palette = THEMES[themeKey] || LIGHT;
  const isDark = palette.isDark;

  const setTheme = (key) => {
    const k = normalizeThemeKey(key);
    if (typeof localStorage !== "undefined") localStorage.setItem("ayumonk-theme", k);
    setThemeKey(k);
  };

  // header button toggles between the two base themes (Sage ↔ Forest)
  const toggle = () => setTheme(isDark ? "sage" : "forest");

  useEffect(() => {
    injectGlobalStyles();
  }, []);

  const resolvedAccent = accent || palette.g3;

  return (
    <MobileThemeContext.Provider value={{ palette, isDark, themeKey, setTheme, toggle }}>
      <div
        className="ayumonk-mobile"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: palette.bg,
          color: palette.text,
          fontFamily: "'Inter', system-ui, sans-serif",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: 24,
          }}
        >
          <MobileHeader
            roleLabel={roleLabel}
            roleLabelColor={roleLabelColor}
            accent={resolvedAccent}
            badgeColor={badgeColor}
            onProfileShortcut={onProfileShortcut}
          />
          {children}
        </div>
        {navItems && (
          <BottomNav
            items={navItems}
            active={activeTab}
            onNav={onNav}
            accent={resolvedAccent}
            accentDark={accentDark}
            notch={notch}
            centerBadge={centerBadge}
          />
        )}
      </div>
    </MobileThemeContext.Provider>
  );
}
