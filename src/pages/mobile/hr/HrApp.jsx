import { useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import Home from "./Home";
import Analytics from "./Analytics";
import People from "./People";
import Programs from "./Programs";
import Alerts from "./Alerts";

// HR portal — blue identity, notch bottom nav with Home as the centre anchor.
// Five fixed sections: Analytics · People · Home · Programs · Alerts.
const HR_BLUE = "#2F6E9E";
const HR_BLUE_DARK = "#245680";
const RISK_RED = "#C0604A";

// Order matters: the notch centres the middle item (index 2 = Home).
const NAV = [
  { id: "analytics", icon: "📊", label: "Analytics" },
  { id: "people", icon: "👥", label: "People" },
  { id: "home", icon: "🏠", label: "Home" },
  { id: "programs", icon: "📅", label: "Programs" },
  // Demo alert count — wire to live at-risk + forms-due totals when available.
  { id: "alerts", icon: "🔔", label: "Alerts", badge: 4 },
];

const CONTENT = {
  home: Home,
  analytics: Analytics,
  people: People,
  programs: Programs,
  alerts: Alerts,
};

export default function HrApp({ defaultTab = "home" }) {
  const [tab, setTab] = useState(defaultTab);
  const ActiveContent = CONTENT[tab] || Home;

  return (
    <MobileShell
      navItems={NAV}
      activeTab={tab}
      onNav={setTab}
      accent={HR_BLUE}
      accentDark={HR_BLUE_DARK}
      roleLabel="HR PORTAL"
      roleLabelColor={HR_BLUE}
      badgeColor={RISK_RED}
      notch
    >
      <div key={tab} className="ayumonk-anim">
        <ActiveContent />
      </div>
    </MobileShell>
  );
}
