import { useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import { C } from "../../../components/mobile/palette";
import Wellness from "./Wellness";
import Challenges from "./Challenges";
import Rewards from "./Rewards";
import Responses from "./Responses";
import Profile from "./Profile";

// Wellness sits in the CENTRE so it becomes the fixed notch anchor.
// centerBadge below is a demo streak — wire it to your real streak value
// (dashboard / gamification slice) when available.
const NAV = [
  { id: "challenges", icon: "🎯", label: "Challenges" },
  { id: "rewards", icon: "🏅", label: "Rewards" },
  { id: "wellness", icon: "🌿", label: "Wellness" },
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
      onProfileShortcut={() => setTab("profile")}
      notch
      centerBadge={7}
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
