import { useEffect, useMemo, useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import { C } from "../../../components/mobile/palette";
import Home from "./Home";
import Analytics from "./Analytics";
import People from "./People";
import Programs from "./Programs";
import usePermissions from "../../../hooks/usePermissions";
import { emojiForSlug } from "../slugIcons";

// Slug → mobile content component. Themes/challenges/sessions all land on the
// Programs screen since the mobile HR workspace consolidates them.
const SLUG_TO_CONTENT = {
  dashboard: Home,
  "hr-dashboard": Analytics,
  "company-users": People,
  departments: People,
  kpis: Programs,
  themes: Programs,
  challenges: Programs,
  sessions: Programs,
};

const FALLBACK_NAV = [
  { id: "dashboard", icon: emojiForSlug("dashboard"), label: "Home" },
  { id: "hr-dashboard", icon: emojiForSlug("hr-dashboard"), label: "Analytics" },
  { id: "company-users", icon: emojiForSlug("company-users"), label: "People" },
  { id: "kpis", icon: emojiForSlug("kpis"), label: "Programs" },
];

function Placeholder({ label }) {
  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        color: "#5C5A57",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 10 }}>📱</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1F1E1D", marginBottom: 6 }}>
        {label || "Section"}
      </div>
      <div style={{ fontSize: 11 }}>
        Mobile view for this section isn’t available yet — open it on desktop.
      </div>
    </div>
  );
}

export default function HrApp({ defaultTab = "dashboard" }) {
  const { menus, loaded } = usePermissions();

  const nav = useMemo(() => {
    if (!loaded || !Array.isArray(menus) || menus.length === 0) return FALLBACK_NAV;
    return menus
      .slice()
      .sort((a, b) => {
        const aOrder =
          a?.order_no == null ? Number.POSITIVE_INFINITY : Number(a.order_no);
        const bOrder =
          b?.order_no == null ? Number.POSITIVE_INFINITY : Number(b.order_no);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a?.menu_name || "").localeCompare(
          String(b?.menu_name || ""),
        );
      })
      .map((menu) => ({
        id: menu.slug,
        icon: emojiForSlug(menu.slug),
        label: menu.menu_name,
      }));
  }, [menus, loaded]);

  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    if (nav.length && !nav.some((item) => item.id === tab)) {
      setTab(nav[0].id);
    }
  }, [nav, tab]);

  const ActiveContent = SLUG_TO_CONTENT[tab];
  const activeMeta = nav.find((item) => item.id === tab);

  return (
    <MobileShell
      navItems={nav}
      activeTab={tab}
      onNav={setTab}
      accent={C.blue}
      roleLabel="HR PORTAL"
      roleLabelColor={C.blue}
      badgeColor={C.red}
    >
      <div key={tab} className="ayumonk-anim">
        {ActiveContent ? <ActiveContent /> : <Placeholder label={activeMeta?.label} />}
      </div>
    </MobileShell>
  );
}
