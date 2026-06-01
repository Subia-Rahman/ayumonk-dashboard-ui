import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import AdminDashboard from "../pages/admin/Dashboard";
import HrAnalyticsDashboard from "../pages/admin/HrAnalyticsDashboard";
import CompanyData from "../pages/superadmin/CompanyData";
import CompanyDataForm from "../pages/superadmin/CompanyDataForm";
import CompanyDataView from "../pages/superadmin/CompanyDataView";
import CompanyUsers from "../pages/admin/CompanyUsers";
import CompanyUsersForm from "../pages/admin/CompanyUsersForm";
import CompanyUsersView from "../pages/admin/CompanyUsersView";
import Questions from "../pages/admin/Questions";
import QuestionsForm from "../pages/admin/QuestionsForm";
import QuestionsView from "../pages/admin/QuestionsView";
import Sessions from "../pages/admin/Sessions";
import SessionEditor from "../pages/admin/SessionEditor";
import SessionManagement from "../pages/admin/SessionManagement";
import Themes from "../pages/admin/Themes";
import ThemeForm from "../pages/admin/ThemeForm";
import ThemeView from "../pages/admin/ThemeView";
import Kpis from "../pages/admin/Kpis";
import KpiForm from "../pages/admin/KpiForm";
import KpiView from "../pages/admin/KpiView";
import Challenges from "../pages/admin/Challenges";
import ChallengeForm from "../pages/admin/ChallengeForm";
import ChallengeView from "../pages/admin/ChallengeView";
import Login from "../pages/auth/Login";
import Profile from "../pages/common/Profile";
import SessionForm from "../pages/common/SessionForm";
import SketchLab from "../pages/hidden/SketchLab";
import UserDashboard from "../pages/user/Dashboard";
import MyResponses from "../pages/user/MyResponses";
import SuperAdminDashboard from "../pages/superadmin/Dashboard";
import SuggestionMaster from "../pages/superadmin/SuggestionMaster";
import SuggestionForm from "../pages/superadmin/SuggestionForm";
import SuggestionView from "../pages/superadmin/SuggestionView";
import KpiSuggestionMapping from "../pages/superadmin/KpiSuggestionMapping";
import KpiSuggestionMappingForm from "../pages/superadmin/KpiSuggestionMappingForm";
import KpiSuggestionMappingView from "../pages/superadmin/KpiSuggestionMappingView";
import Roles from "../pages/superadmin/Roles";
import RoleForm from "../pages/superadmin/RoleForm";
import RoleView from "../pages/superadmin/RoleView";
import Permissions from "../pages/superadmin/Permissions";
import PermissionForm from "../pages/superadmin/PermissionForm";
import PermissionView from "../pages/superadmin/PermissionView";
import Policies from "../pages/superadmin/Policies";
import PolicyForm from "../pages/superadmin/PolicyForm";
import PolicyView from "../pages/superadmin/PolicyView";
import RoleAssignment from "../pages/superadmin/RoleAssignment";
import Menus from "../pages/superadmin/Menus";
import MenuForm from "../pages/superadmin/MenuForm";
import MenuView from "../pages/superadmin/MenuView";
import Departments from "../pages/superadmin/Departments";
import CxoMetricsConfig from "../pages/superadmin/CxoMetricsConfig";
import WellnessDimensionsConfig from "../pages/superadmin/WellnessDimensionsConfig";
import ClientPage from "../pages/hidden/ClientPage";
import PwaMobile from "../pages/hidden/PwaMobile";
import AccessDenied from "../pages/common/AccessDenied";
import RouteGuard from "./RouteGuard";
import {
  getHomePath,
  isOtherRoleHomePath,
  isPathAllowedForRole,
} from "../utils/roleHelper";

// Spec §3: every CRUD route is gated on `<resource>:read` so direct
// navigation / deep links fail-safe via <AccessDenied /> instead of
// rendering the page shell and waiting for the first 403. Add/Edit
// routes use the same `:read` codename — Save buttons inside the form
// gate on `:create` / `:update` separately. Dashboard, Profile, and
// public share routes pass no codename (auth check only).
function ProtectedRoute({ children, codename, bypass }) {
  return (
    <RouteGuard codename={codename} bypass={bypass}>
      {children}
    </RouteGuard>
  );
}

function LoginRoute({ fallback }) {
  const location = useLocation();
  const authenticated = useSelector((state) => state.auth.isAuthenticated);
  const role = useSelector((state) => state.auth.role);
  const rawRole = useSelector((state) => state.auth.rawRole);
  const isPlatformAdmin = useSelector((state) => state.auth.isPlatformAdmin);
  const fromPath = location.state?.from?.pathname;
  // Only honor `from` redirects when the current user can actually access
  // that path — otherwise a stale `from` left over from a previous role's
  // session would bounce the new user into a route they don't belong on.
  // Also reject `from` paths that are *another* role's home: Company Admin
  // and HR Manager both have role="admin" but live on /admin/dashboard vs
  // /admin/hr-dashboard, so isPathAllowedForRole can't catch the bleed-over.
  const honorFrom =
    fromPath &&
    isPathAllowedForRole(fromPath, { role, isPlatformAdmin }) &&
    !isOtherRoleHomePath(fromPath, { isPlatformAdmin, role, rawRole });
  const redirectTarget = honorFrom
    ? `${fromPath}${location.state.from.search || ""}${location.state.from.hash || ""}`
    : fallback;

  return authenticated ? <Navigate to={redirectTarget} replace /> : <Login />;
}

export default function AppRoutes() {
  const role = useSelector((state) => state.auth.role);
  const rawRole = useSelector((state) => state.auth.rawRole);
  const isPlatformAdmin = useSelector((state) => state.auth.isPlatformAdmin);
  const authenticated = useSelector((state) => state.auth.isAuthenticated);
  const fallback = getHomePath({ isPlatformAdmin, role, rawRole });

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={authenticated ? fallback : "/login"} replace />}
      />
      <Route path="/login" element={<LoginRoute fallback={fallback} />} />

      {/* ---------- Admin ---------- */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/hr-dashboard"
        element={
          <ProtectedRoute>
            <HrAnalyticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/company-details"
        element={
          <ProtectedRoute codename="company_master:read">
            <CompanyDataForm mode="edit" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/company-users"
        element={
          <ProtectedRoute codename="company_users:read">
            <CompanyUsers role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/company-users/add"
        element={
          <ProtectedRoute codename="company_users:read">
            <CompanyUsersForm mode="add" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/company-users/:id"
        element={
          <ProtectedRoute codename="company_users:read">
            <CompanyUsersView role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/company-users/:id/edit"
        element={
          <ProtectedRoute codename="company_users:read">
            <CompanyUsersForm mode="edit" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/themes"
        element={
          <ProtectedRoute codename="themes:read">
            <Themes role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/themes/:id"
        element={
          <ProtectedRoute codename="themes:read">
            <ThemeView role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kpis"
        element={
          <ProtectedRoute codename="kpis:read">
            <Kpis role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kpis/:id"
        element={
          <ProtectedRoute codename="kpis:read">
            <KpiView role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/challenges"
        element={
          <ProtectedRoute codename="challenges:read">
            <Challenges role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/challenges/:id"
        element={
          <ProtectedRoute codename="challenges:read">
            <ChallengeView role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions"
        element={
          <ProtectedRoute codename="kpis:read">
            <Questions role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions/:id"
        element={
          <ProtectedRoute codename="kpis:read">
            <QuestionsView role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/themes/add"
        element={
          <ProtectedRoute codename="themes:read">
            <ThemeForm mode="add" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/themes/:id/edit"
        element={
          <ProtectedRoute codename="themes:read">
            <ThemeForm mode="edit" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kpis/add"
        element={
          <ProtectedRoute codename="kpis:read">
            <KpiForm mode="add" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kpis/:id/edit"
        element={
          <ProtectedRoute codename="kpis:read">
            <KpiForm mode="edit" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/challenges/add"
        element={
          <ProtectedRoute codename="challenges:read">
            <ChallengeForm mode="add" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/challenges/:id/edit"
        element={
          <ProtectedRoute codename="challenges:read">
            <ChallengeForm mode="edit" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sessions"
        element={
          <ProtectedRoute codename="sessions:read">
            <Sessions role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sessions/add"
        element={
          <ProtectedRoute codename="sessions:read">
            <SessionEditor mode="add" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sessions/:id/edit"
        element={
          <ProtectedRoute codename="sessions:read">
            <SessionEditor mode="edit" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sessions/:id/manage"
        element={
          <ProtectedRoute codename="sessions:read">
            <SessionManagement role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions/add"
        element={
          <ProtectedRoute codename="kpis:read">
            <QuestionsForm mode="add" role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions/:id/edit"
        element={
          <ProtectedRoute codename="kpis:read">
            <QuestionsForm mode="edit" role="admin" />
          </ProtectedRoute>
        }
      />

      {/* ---------- Super Admin ---------- */}
      <Route
        path="/super-admin/dashboard"
        element={
          <ProtectedRoute>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/company-data"
        element={
          <ProtectedRoute codename="company_master:read">
            <CompanyData />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/departments"
        element={
          <ProtectedRoute codename="company_users:read">
            <Departments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/company-data/add"
        element={
          <ProtectedRoute codename="company_master:read">
            <CompanyDataForm mode="add" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/company-data/:id"
        element={
          <ProtectedRoute codename="company_master:read">
            <CompanyDataView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/company-data/:id/edit"
        element={
          <ProtectedRoute codename="company_master:read">
            <CompanyDataForm mode="edit" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/company-users"
        element={
          <ProtectedRoute codename="company_users:read">
            <CompanyUsers role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/company-users/add"
        element={
          <ProtectedRoute codename="company_users:read">
            <CompanyUsersForm mode="add" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/company-users/:id"
        element={
          <ProtectedRoute codename="company_users:read">
            <CompanyUsersView role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/company-users/:id/edit"
        element={
          <ProtectedRoute codename="company_users:read">
            <CompanyUsersForm mode="edit" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/questions"
        element={
          <ProtectedRoute codename="kpis:read">
            <Questions role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/questions/add"
        element={
          <ProtectedRoute codename="kpis:read">
            <QuestionsForm mode="add" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/questions/:id"
        element={
          <ProtectedRoute codename="kpis:read">
            <QuestionsView role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/questions/:id/edit"
        element={
          <ProtectedRoute codename="kpis:read">
            <QuestionsForm mode="edit" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/themes"
        element={
          <ProtectedRoute codename="themes:read">
            <Themes role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/themes/add"
        element={
          <ProtectedRoute codename="themes:read">
            <ThemeForm mode="add" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/themes/:id"
        element={
          <ProtectedRoute codename="themes:read">
            <ThemeView role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/themes/:id/edit"
        element={
          <ProtectedRoute codename="themes:read">
            <ThemeForm mode="edit" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/kpis"
        element={
          <ProtectedRoute codename="kpis:read">
            <Kpis role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/kpis/add"
        element={
          <ProtectedRoute codename="kpis:read">
            <KpiForm mode="add" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/kpis/:id"
        element={
          <ProtectedRoute codename="kpis:read">
            <KpiView role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/kpis/:id/edit"
        element={
          <ProtectedRoute codename="kpis:read">
            <KpiForm mode="edit" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/challenges"
        element={
          <ProtectedRoute codename="challenges:read">
            <Challenges role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/challenges/add"
        element={
          <ProtectedRoute codename="challenges:read">
            <ChallengeForm mode="add" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/challenges/:id"
        element={
          <ProtectedRoute codename="challenges:read">
            <ChallengeView role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/challenges/:id/edit"
        element={
          <ProtectedRoute codename="challenges:read">
            <ChallengeForm mode="edit" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/sessions"
        element={
          <ProtectedRoute codename="sessions:read">
            <Sessions role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/sessions/add"
        element={
          <ProtectedRoute codename="sessions:read">
            <SessionEditor mode="add" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/sessions/:id/edit"
        element={
          <ProtectedRoute codename="sessions:read">
            <SessionEditor mode="edit" role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/sessions/:id/manage"
        element={
          <ProtectedRoute codename="sessions:read">
            <SessionManagement role="superadmin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/suggestion-master"
        element={
          <ProtectedRoute codename="suggestion:read">
            <SuggestionMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/suggestion-master/add"
        element={
          <ProtectedRoute codename="suggestion:read">
            <SuggestionForm mode="add" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/suggestion-master/:id"
        element={
          <ProtectedRoute codename="suggestion:read">
            <SuggestionView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/suggestion-master/:id/edit"
        element={
          <ProtectedRoute codename="suggestion:read">
            <SuggestionForm mode="edit" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/kpi-suggestion-mapping"
        element={
          <ProtectedRoute codename="suggestion:read">
            <KpiSuggestionMapping />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/kpi-suggestion-mapping/add"
        element={
          <ProtectedRoute codename="suggestion:read">
            <KpiSuggestionMappingForm mode="add" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/kpi-suggestion-mapping/:id"
        element={
          <ProtectedRoute codename="suggestion:read">
            <KpiSuggestionMappingView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/kpi-suggestion-mapping/:id/edit"
        element={
          <ProtectedRoute codename="suggestion:read">
            <KpiSuggestionMappingForm mode="edit" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/roles"
        element={
          <ProtectedRoute codename="platform:read">
            <Roles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/roles/add"
        element={
          <ProtectedRoute codename="platform:read">
            <RoleForm mode="add" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/roles/:id"
        element={
          <ProtectedRoute codename="platform:read">
            <RoleView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/roles/:id/edit"
        element={
          <ProtectedRoute codename="platform:read">
            <RoleForm mode="edit" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/permissions"
        element={
          <ProtectedRoute codename="platform:read">
            <Permissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/permissions/add"
        element={
          <ProtectedRoute codename="platform:read">
            <PermissionForm mode="add" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/permissions/:id"
        element={
          <ProtectedRoute codename="platform:read">
            <PermissionView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/permissions/:id/edit"
        element={
          <ProtectedRoute codename="platform:read">
            <PermissionForm mode="edit" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/policies"
        element={
          <ProtectedRoute codename="platform:read">
            <Policies />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/policies/add"
        element={
          <ProtectedRoute codename="platform:read">
            <PolicyForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/policies/:id"
        element={
          <ProtectedRoute codename="platform:read">
            <PolicyView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/role-assignments"
        element={
          <ProtectedRoute codename="platform:read">
            <RoleAssignment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/cxo-metrics"
        element={
          <ProtectedRoute codename="cxo_metrics:read">
            <CxoMetricsConfig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/wellness-dimensions"
        element={
          <ProtectedRoute codename="wellness_dimensions:read">
            <WellnessDimensionsConfig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/menus"
        element={
          <ProtectedRoute codename="platform:read">
            <Menus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/menus/add"
        element={
          <ProtectedRoute codename="platform:read">
            <MenuForm mode="add" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/menus/:id"
        element={
          <ProtectedRoute codename="platform:read">
            <MenuView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/menus/:id/edit"
        element={
          <ProtectedRoute codename="platform:read">
            <MenuForm mode="edit" />
          </ProtectedRoute>
        }
      />

      {/* ---------- User ---------- */}
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      {/* Spec §"Special cases": self-scoped submissions gate on sessions:read,
          NOT on submissions:* — the submissions menu slug exists for sidebar
          visibility only. */}
      <Route
        path="/user/submissions"
        element={
          <ProtectedRoute codename="sessions:read">
            <MyResponses />
          </ProtectedRoute>
        }
      />

      {/* ---------- Public / shared ---------- */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions/:id/form"
        element={
          <ProtectedRoute bypass>
            <SessionForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute bypass>
            <ClientPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/pwa"
        element={
          <ProtectedRoute bypass>
            <PwaMobile />
          </ProtectedRoute>
        }
      />
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route path="/vault/ink-room-7f3a" element={<SketchLab />} />

      <Route
        path="*"
        element={<Navigate to={authenticated ? fallback : "/login"} replace />}
      />
    </Routes>
  );
}
