import { useState } from "react";
import MobileShell from "../../../layouts/mobileLayout/MobileShell";
import { ManageHub, MasterListScreen } from "./masterAdapters";
import { AdminDashboard, CompanyUsersScreen, AdminAnalytics, AdminProfile } from "./adminBespoke";

// Admin / HR-Manager console — green identity, notch nav with Home (Dashboard)
// as the centre anchor. Five fixed sections; Manage drills into the masters.
const NAV = [
  { id: "analytics", icon: "📊", label: "Analytics" },
  { id: "manage", icon: "🗂", label: "Manage" },
  { id: "dashboard", icon: "🏠", label: "Home" },
  { id: "users", icon: "👥", label: "Users" },
  { id: "profile", icon: "🧑‍💼", label: "Profile" },
];

export default function AdminApp({ defaultTab = "dashboard" }) {
  const [tab, setTab] = useState(defaultTab);
  const [section, setSection] = useState(null);

  const openSection = (key) => { setSection(key); setTab("manage-section"); };
  const goTab = (id) => { setSection(null); setTab(id); };
  const navActive = tab === "manage-section" ? "manage" : tab;

  return (
    <MobileShell
      navItems={NAV}
      activeTab={navActive}
      onNav={goTab}
      roleLabel="ADMIN CONSOLE"
      notch
    >
      <div key={tab + (section || "")} className="ayumonk-anim">
        {tab === "dashboard" && <AdminDashboard onOpenSection={openSection} onOpenUsers={() => goTab("users")} />}
        {tab === "analytics" && <AdminAnalytics />}
        {tab === "manage" && <ManageHub onOpen={openSection} />}
        {tab === "manage-section" && section && <MasterListScreen sectionKey={section} onBack={() => goTab("manage")} />}
        {tab === "users" && <CompanyUsersScreen />}
        {tab === "profile" && <AdminProfile />}
      </div>
    </MobileShell>
  );
}
