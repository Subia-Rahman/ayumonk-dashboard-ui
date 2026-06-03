import { useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import { C } from "../../../components/mobile/palette";
import SuperAdminMasters from "./SuperAdminMasters";

// Pinned bottom-nav tabs (max 5; last is the ☰ More drawer opener).
const PINNED = [
  { id: "dashboard", icon: "🛡", label: "Home" },
  { id: "company-data", icon: "🏢", label: "Companies" },
  { id: "sessions", icon: "📅", label: "Sessions" },
  { id: "kpis", icon: "📊", label: "KPIs" },
  { id: "more", icon: "☰", label: "More" },
];

// Full grouped section list shown in the ☰ More drawer.
const DRAWER = [
  { group: "Master Data", items: [["company-data", "🏢", "Company Data"], ["company-users", "👥", "Company Users"], ["departments", "🏬", "Departments"]] },
  { group: "Content", items: [["questions", "❓", "Questions"], ["themes", "🎨", "Themes"], ["kpis", "📊", "KPIs"], ["challenges", "🎯", "Challenges"], ["sessions", "📅", "Sessions"], ["suggestion-master", "🌿", "Suggestion Master"], ["kpi-suggestion-mapping", "🔗", "KPI Suggestion Mapping"]] },
  { group: "Access", items: [["roles", "🪪", "Roles"], ["permissions", "🔑", "Permissions"], ["policies", "🛡", "Policies"], ["role-assignments", "🧩", "Role Assignments"]] },
  { group: "Configuration", items: [["cxo-metrics", "📈", "CXO Metrics"], ["wellness-dimensions", "🌱", "Wellness Dimensions"], ["menus", "📑", "Menus"]] },
  { group: "Account", items: [["dashboard", "🛡", "Dashboard"]] },
];

export default function SuperAdminApp({ defaultTab = "dashboard" }) {
  const [tab, setTab] = useState(defaultTab);
  const [drawer, setDrawer] = useState(false);

  const route = (id) => { setDrawer(false); setTab(id); };
  const onNav = (id) => { if (id === "more") setDrawer(true); else route(id); };

  // Pinned-tab highlight: "more" when the drawer is open, else the active tab.
  const activeTab = drawer ? "more" : tab;

  return (
    <MobileShell
      navItems={PINNED}
      activeTab={activeTab}
      onNav={onNav}
      accent={C.purple}
      roleLabel="SUPER ADMIN"
      roleLabelColor={C.purple}
      badgeColor={C.purple}
      onProfileShortcut={() => route("dashboard")}
    >
      <div key={tab} className="ayumonk-anim">
        <SuperAdminMasters slug={tab} />
      </div>

      {drawer && (
        <div
          onClick={() => setDrawer(false)}
          style={{ position: "fixed", inset: 0, zIndex: 120 }}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(20,30,16,0.45)" }} />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 60, background: C.bg, borderRadius: "22px 22px 0 0", display: "flex", flexDirection: "column" }}
          >
            <div style={{ width: 38, height: 4.5, borderRadius: 999, background: C.border, margin: "10px auto 4px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 18px 14px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: C.text }}>All Sections</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close" style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.muted, fontSize: 13, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "16px 16px 30px", overflowY: "auto" }}>
              {DRAWER.map((g) => (
                <div key={g.group} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 9 }}>{g.group}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {g.items.map(([id, ic, label]) => {
                      const on = tab === id;
                      return (
                        <button key={id + label} type="button" onClick={() => route(id)} style={{ display: "flex", alignItems: "center", gap: 9, border: `1px solid ${on ? C.g3 : C.border}`, background: on ? `${C.g3}1f` : C.card, borderRadius: 11, padding: 12, fontSize: 12.5, fontWeight: 600, color: on ? C.g1 : C.text, cursor: "pointer", fontFamily: "inherit", textAlign: "left", minHeight: 48 }}>
                          <span style={{ fontSize: 16 }}>{ic}</span><span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
