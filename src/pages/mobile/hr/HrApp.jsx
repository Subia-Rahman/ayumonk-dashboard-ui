import { useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import { C } from "../../../components/mobile/palette";
import Home from "./Home";
import Analytics from "./Analytics";
import People from "./People";
import Programs from "./Programs";

const NAV = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "analytics", icon: "📊", label: "Analytics" },
  { id: "people", icon: "👥", label: "People" },
  { id: "programs", icon: "📅", label: "Programs" },
];

export default function HrApp({ defaultTab = "home" }) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <MobileShell
      navItems={NAV}
      activeTab={tab}
      onNav={setTab}
      accent={C.blue}
    >
      <div key={tab} className="ayumonk-anim">
        {tab === "home" && <Home />}
        {tab === "analytics" && <Analytics />}
        {tab === "people" && <People />}
        {tab === "programs" && <Programs />}
      </div>
    </MobileShell>
  );
}
