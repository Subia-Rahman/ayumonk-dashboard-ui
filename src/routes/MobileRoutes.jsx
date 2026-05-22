import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import EmployeeApp from "../pages/mobile/employee/EmployeeApp";
import HrApp from "../pages/mobile/hr/HrApp";
import SuperAdminApp from "../pages/mobile/superadmin/SuperAdminApp";
import AdminDashboard from "../pages/admin/Dashboard";
import Login from "../pages/auth/Login";
import Profile from "../pages/common/Profile";
import SessionForm from "../pages/common/SessionForm";
import AccessDenied from "../pages/common/AccessDenied";
import RouteGuard from "./RouteGuard";
import { getHomePath, isPathAllowedForRole } from "../utils/roleHelper";

function Protected({ children, codename, bypass }) {
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
  const isPlatformAdmin = useSelector((state) => state.auth.isPlatformAdmin);
  const fromPath = location.state?.from?.pathname;
  const honorFrom =
    fromPath && isPathAllowedForRole(fromPath, { role, isPlatformAdmin });
  const redirectTarget = honorFrom
    ? `${fromPath}${location.state.from.search || ""}${location.state.from.hash || ""}`
    : fallback;
  return authenticated ? <Navigate to={redirectTarget} replace /> : <Login />;
}

// Mobile route tree. URLs match the desktop tree where possible so the
// authentication guards, RBAC, and deep links keep working — only the
// rendered surface differs. Bottom-nav tab switching happens inside each
// role's *App component without changing the URL.
export default function MobileRoutes() {
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

      {/* Employee — Wellness / Challenges / Responses */}
      <Route
        path="/user/dashboard"
        element={
          <Protected>
            <EmployeeApp defaultTab="wellness" />
          </Protected>
        }
      />
      <Route
        path="/user/submissions"
        element={
          <Protected codename="sessions:read">
            <EmployeeApp defaultTab="responses" />
          </Protected>
        }
      />

      {/* HR / Company Admin — Home / Analytics / People / Programs */}
      {/* /admin/dashboard renders the same Admin Panel (RBAC matrix + section
          cards) as desktop; the Layout shell + MUI breakpoints already adapt
          to narrow viewports, so we deliberately bypass the HrApp surface
          here. The other /admin/* routes still flow into HrApp's tabs. */}
      <Route
        path="/admin/dashboard"
        element={
          <Protected>
            <AdminDashboard />
          </Protected>
        }
      />
      <Route
        path="/admin/hr-dashboard"
        element={
          <Protected>
            <HrApp defaultTab="analytics" />
          </Protected>
        }
      />
      <Route
        path="/admin/company-users"
        element={
          <Protected codename="company_users:read">
            <HrApp defaultTab="people" />
          </Protected>
        }
      />
      <Route
        path="/admin/kpis"
        element={
          <Protected codename="kpis:read">
            <HrApp defaultTab="programs" />
          </Protected>
        }
      />
      {/* Anything else under /admin/* routes back to the HR home; the desktop
          surface owns the CRUD forms — the mobile design doesn't model them. */}
      <Route
        path="/admin/*"
        element={
          <Protected>
            <HrApp defaultTab="home" />
          </Protected>
        }
      />

      {/* Super Admin — 5-tab workspace */}
      <Route
        path="/super-admin/dashboard"
        element={
          <Protected>
            <SuperAdminApp defaultTab="home" />
          </Protected>
        }
      />
      <Route
        path="/super-admin/company-data"
        element={
          <Protected codename="company_master:read">
            <SuperAdminApp defaultTab="companies" />
          </Protected>
        }
      />
      <Route
        path="/super-admin/kpis"
        element={
          <Protected codename="kpis:read">
            <SuperAdminApp defaultTab="kpi" />
          </Protected>
        }
      />
      <Route
        path="/super-admin/suggestion-master"
        element={
          <Protected codename="suggestion:read">
            <SuperAdminApp defaultTab="suggest" />
          </Protected>
        }
      />
      <Route
        path="/super-admin/roles"
        element={
          <Protected codename="platform:read">
            <SuperAdminApp defaultTab="settings" />
          </Protected>
        }
      />
      <Route
        path="/super-admin/*"
        element={
          <Protected>
            <SuperAdminApp defaultTab="home" />
          </Protected>
        }
      />

      {/* Shared */}
      <Route
        path="/profile"
        element={
          <Protected>
            <Profile />
          </Protected>
        }
      />
      <Route
        path="/sessions/:id/form"
        element={
          <Protected bypass>
            <SessionForm />
          </Protected>
        }
      />
      <Route path="/access-denied" element={<AccessDenied />} />

      <Route
        path="*"
        element={<Navigate to={authenticated ? fallback : "/login"} replace />}
      />
    </Routes>
  );
}
