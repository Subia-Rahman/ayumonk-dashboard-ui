import { useEffect, useState } from "react";
import { DARK, LIGHT, MOBILE_GLOBAL_CSS, MobileThemeContext } from "../../components/mobile/palette";
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
  roleLabel = "WELLNESS PLATFORM",
  roleLabelColor,
  badgeColor,
  onProfileShortcut,
  notch = false,
  centerBadge,
}) {
  const [isDark, setIsDark] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("ayumonk-theme") === "dark",
  );

  const palette = isDark ? DARK : LIGHT;

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("ayumonk-theme", next ? "dark" : "light");
      return next;
    });
  };

  useEffect(() => {
    injectGlobalStyles();
  }, []);

  const resolvedAccent = accent || palette.g3;

  return (
    <MobileThemeContext.Provider value={{ palette, isDark, toggle }}>
      <div
        className="ayumonk-mobile"
        style={{
          height: "100dvh",
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
            notch={notch}
            centerBadge={centerBadge}
          />
        )}
      </div>
    </MobileThemeContext.Provider>
  );
}
