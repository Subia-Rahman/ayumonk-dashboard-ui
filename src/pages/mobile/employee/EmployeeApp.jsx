import { useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import { C } from "../../../components/mobile/palette";
import Wellness from "./Wellness";
import Challenges from "./Challenges";
import Responses from "./Responses";

const NAV = [
  { id: "wellness", icon: "🌿", label: "Wellness" },
  { id: "challenges", icon: "🎯", label: "Challenges" },
  { id: "responses", icon: "📝", label: "Responses" },
];

export default function EmployeeApp({ defaultTab = "wellness" }) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <MobileShell
      navItems={NAV}
      activeTab={tab}
      onNav={setTab}
      accent={C.g3}
      roleLabel="WELLNESS PLATFORM"
      badgeColor={C.orange}
    >
      <div key={tab} className="ayumonk-anim">
        {tab === "wellness" && <Wellness />}
        {tab === "challenges" && <Challenges />}
        {tab === "responses" && <Responses />}
      </div>
    </MobileShell>
  );
}
