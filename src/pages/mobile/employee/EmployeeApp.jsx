import { useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import { C } from "../../../components/mobile/palette";
import Wellness from "./Wellness";
import Challenges from "./Challenges";
import Rewards from "./Rewards";
import Responses from "./Responses";
import Profile from "./Profile";

const NAV = [
  { id: "wellness", icon: "🌿", label: "Wellness" },
  { id: "challenges", icon: "🎯", label: "Challenges" },
  { id: "rewards", icon: "🏅", label: "Rewards" },
  { id: "responses", icon: "📝", label: "Responses" },
  { id: "profile", icon: "🧘", label: "Profile" },
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
        {tab === "rewards" && <Rewards />}
        {tab === "responses" && <Responses />}
        {tab === "profile" && <Profile />}
      </div>
    </MobileShell>
  );
}
