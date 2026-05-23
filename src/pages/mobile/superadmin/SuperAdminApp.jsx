import { useEffect, useMemo, useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import { C } from "../../../components/mobile/palette";
import Home from "./Home";
import Companies from "./Companies";
import Kpis from "./Kpis";
import Suggestions from "./Suggestions";
import Settings from "./Settings";
import usePermissions from "../../../hooks/usePermissions";
import { emojiForSlug } from "../slugIcons";

// Slug → mobile content component. Multiple admin slugs (roles/permissions/
// policies/etc.) deliberately share the Settings screen because the platform
// settings hub is a single page on mobile; tapping any of them lands there.
const SLUG_TO_CONTENT = {
  dashboard: Home,
  "company-data": Companies,
  "company-details": Companies,
  kpis: Kpis,
  "suggestion-master": Suggestions,
  "kpi-suggestion-mapping": Suggestions,
  roles: Settings,
  permissions: Settings,
  policies: Settings,
  "role-assignments": Settings,
  menus: Settings,
};

// Used until /accessible-menus resolves so the tab bar isn't empty on first
// paint. Same five slugs the previous hardcoded NAV implied.
const FALLBACK_NAV = [
  { id: "dashboard", icon: emojiForSlug("dashboard"), label: "Home" },
  { id: "company-data", icon: emojiForSlug("company-data"), label: "Companies" },
  { id: "kpis", icon: emojiForSlug("kpis"), label: "KPIs" },
  { id: "suggestion-master", icon: emojiForSlug("suggestion-master"), label: "Suggests" },
  { id: "roles", icon: emojiForSlug("roles"), label: "Settings" },
];

function Placeholder({ label }) {
  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        color: "rgba(255,255,255,.55)",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 10 }}>📱</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
        {label || "Section"}
      </div>
      <div style={{ fontSize: 11 }}>
        Mobile view for this section isn’t available yet — open it on desktop.
      </div>
    </div>
  );
}

export default function SuperAdminApp({ defaultTab = "dashboard" }) {
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

  // If the dynamic nav arrives and the active tab isn't in it, snap to the
  // first item so the user never sees an empty content area.
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
      accent={C.purple}
      roleLabel="SUPER ADMIN"
      roleLabelColor={C.purple}
      badgeColor={C.purple}
    >
      <div key={tab} className="ayumonk-anim">
        {ActiveContent ? <ActiveContent /> : <Placeholder label={activeMeta?.label} />}
      </div>
    </MobileShell>
  );
}
