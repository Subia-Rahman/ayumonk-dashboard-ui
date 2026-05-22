import { useEffect } from "react";
import { C, MOBILE_GLOBAL_CSS } from "../../components/mobile/palette";
import BottomNav from "./BottomNav";
import MobileHeader from "./MobileHeader";

// Wraps every mobile screen with the dark background, font stack, persistent
// brand header, and shared bottom nav. The phone-frame chrome from the
// design mockup is intentionally dropped on real devices — that frame was
// just preview art.

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
  accent = C.g3,
  roleLabel = "WELLNESS PLATFORM",
  roleLabelColor,
  badgeColor,
}) {
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  return (
    <div
      className="ayumonk-mobile"
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: "#fff",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          paddingBottom: 72,
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <MobileHeader
          roleLabel={roleLabel}
          roleLabelColor={roleLabelColor}
          accent={accent}
          badgeColor={badgeColor}
        />
        {children}
      </div>
      {navItems && (
        <BottomNav
          items={navItems}
          active={activeTab}
          onNav={onNav}
          accent={accent}
        />
      )}
    </div>
  );
}
