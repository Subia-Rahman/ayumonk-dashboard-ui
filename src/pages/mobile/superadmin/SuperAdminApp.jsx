import { useEffect, useMemo, useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import { C } from "../../../components/mobile/palette";
import SuperAdminMasters from "./SuperAdminMasters";
import usePermissions from "../../../hooks/usePermissions";
import { emojiForSlug } from "../slugIcons";

// Every super-admin slug now renders through the full SuperAdminMasters module
// (dashboard, all master lists + forms, Roles, CXO Metrics, Role Assignments,
// Wellness Dimensions, Departments). Slug aliases are handled inside the module.

const FALLBACK_NAV = [
  { id: "dashboard", icon: emojiForSlug("dashboard"), label: "Home" },
  { id: "company-data", icon: emojiForSlug("company-data"), label: "Companies" },
  { id: "sessions", icon: emojiForSlug("sessions"), label: "Sessions" },
  { id: "kpis", icon: emojiForSlug("kpis"), label: "KPIs" },
  { id: "suggestion-master", icon: emojiForSlug("suggestion-master"), label: "Suggests" },
];

export default function SuperAdminApp({ defaultTab = "dashboard" }) {
  const { menus, loaded } = usePermissions();

  const nav = useMemo(() => {
    if (!loaded || !Array.isArray(menus) || menus.length === 0) return FALLBACK_NAV;
    return menus
      .slice()
      .sort((a, b) => {
        const aOrder = a?.order_no == null ? Number.POSITIVE_INFINITY : Number(a.order_no);
        const bOrder = b?.order_no == null ? Number.POSITIVE_INFINITY : Number(b.order_no);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a?.menu_name || "").localeCompare(String(b?.menu_name || ""));
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
        <SuperAdminMasters slug={tab} />
      </div>
    </MobileShell>
  );
}
