import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import EmployeeApp from "../pages/mobile/employee/EmployeeApp";
import AdminApp from "../pages/mobile/admin/AdminApp";
import HrApp from "../pages/mobile/hr/HrApp";
import SuperAdminApp from "../pages/mobile/superadmin/SuperAdminApp";
import Login from "../pages/auth/Login";
import AccessDenied from "../pages/common/AccessDenied";
import AppRoutes from "./AppRoutes";
import RouteGuard from "./RouteGuard";
import {
  getHomePath,
  isOtherRoleHomePath,
  isPathAllowedForRole,
} from "../utils/roleHelper";

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
  const rawRole = useSelector((state) => state.auth.rawRole);
  const fromPath = location.state?.from?.pathname;
  const honorFrom =
    fromPath &&
    isPathAllowedForRole(fromPath, { role, isPlatformAdmin }) &&
    !isOtherRoleHomePath(fromPath, { isPlatformAdmin, role, rawRole });
  const redirectTarget = honorFrom
    ? `${fromPath}${location.state.from.search || ""}${location.state.from.hash || ""}`
    : fallback;
  return authenticated ? <Navigate to={redirectTarget} replace /> : <Login />;
}

// super-admin slug → SuperAdminApp defaultTab. Every super-admin URL gets a
// mobile route so it renders SuperAdminApp (full mobile UX) instead of falling
// through to the squeezed desktop pages via the wildcard.
const SA_TABS = {
  dashboard: "dashboard",
  "company-data": "company-data",
  "company-users": "company-users",
  departments: "departments",
  questions: "questions",
  themes: "themes",
  kpis: "kpis",
  challenges: "challenges",
  sessions: "sessions",
  "suggestion-master": "suggestion-master",
  "kpi-suggestion-mapping": "kpi-suggestion-mapping",
  roles: "roles",
  permissions: "permissions",
  policies: "policies",
  "role-assignments": "role-assignments",
  "cxo-metrics": "cxo-metrics",
  "wellness-dimensions": "wellness-dimensions",
  menus: "menus",
};

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

      {/* Employee — Wellness / Challenges / Responses (mobile-specific UX). */}
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

      {/* Admin — mobile-specific UX. */}
      <Route
        path="/admin/dashboard"
        element={
          <Protected>
            <AdminApp />
          </Protected>
        }
      />

      {/* HR — mobile-specific UX. */}
      <Route
        path="/admin/hr-dashboard"
        element={
          <Protected>
            <HrApp />
          </Protected>
        }
      />

      {/* Super Admin — mobile-specific UX. Each list/detail URL renders
          SuperAdminApp with the matching tab so the bottom nav + screens work.
          Add/edit sub-paths (e.g. /super-admin/questions/add) also land on the
          parent tab where the mobile Add sheet lives. */}
      {Object.entries(SA_TABS).map(([slug, tab]) => (
        <Route
          key={slug}
          path={`/super-admin/${slug}/*`}
          element={
            <Protected>
              <SuperAdminApp defaultTab={tab} />
            </Protected>
          }
        />
      ))}
      <Route
        path="/super-admin"
        element={<Navigate to="/super-admin/dashboard" replace />}
      />

      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Anything else falls through to the responsive desktop AppRoutes. */}
      <Route
        path="*"
        element={
          authenticated ? <AppRoutes /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}
