import { useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import { C } from "../../../components/mobile/palette";
import Home from "./Home";
import Companies from "./Companies";
import Kpis from "./Kpis";
import Suggestions from "./Suggestions";
import Settings from "./Settings";

const NAV = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "companies", icon: "🏢", label: "Companies" },
  { id: "kpi", icon: "🎯", label: "KPIs" },
  { id: "suggest", icon: "🌿", label: "Suggests" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export default function SuperAdminApp({ defaultTab = "home" }) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <MobileShell
      navItems={NAV}
      activeTab={tab}
      onNav={setTab}
      accent={C.purple}
    >
      <div key={tab} className="ayumonk-anim">
        {tab === "home" && <Home />}
        {tab === "companies" && <Companies />}
        {tab === "kpi" && <Kpis />}
        {tab === "suggest" && <Suggestions />}
        {tab === "settings" && <Settings />}
      </div>
    </MobileShell>
  );
}
