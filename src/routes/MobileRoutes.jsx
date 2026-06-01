import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import EmployeeApp from "../pages/mobile/employee/EmployeeApp";
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
  // See Login.jsx for the same guard — `from` may be a stale URL pointing at
  // a different role's home, in which case we anchor on the new user's own
  // fallback instead of bouncing them onto the previous account's dashboard.
  const honorFrom =
    fromPath &&
    isPathAllowedForRole(fromPath, { role, isPlatformAdmin }) &&
    !isOtherRoleHomePath(fromPath, { isPlatformAdmin, role, rawRole });
  const redirectTarget = honorFrom
    ? `${fromPath}${location.state.from.search || ""}${location.state.from.hash || ""}`
    : fallback;
  return authenticated ? <Navigate to={redirectTarget} replace /> : <Login />;
}

// Mobile route tree. The only paths handled here are the ones with a
// hand-designed mobile UX (the employee Wellness/Challenges/Responses tabs)
// and the login surface. Everything else falls through to <AppRoutes /> via
// the wildcard route below, so admin and super-admin URLs render the same
// desktop pages they do on a wide viewport — Layout / AdminTopLayout already
// adapt to narrow viewports and include a mobile bottom nav driven by the
// same /accessible-menus list the desktop sidebar uses.
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

      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Anything else (every /admin/* and /super-admin/* path, /profile,
          /sessions/:id/form, etc.) is routed by the regular AppRoutes — the
          desktop components are already responsive and the layouts now render
          a mobile bottom nav in place of the sidebar on narrow viewports. */}
      <Route
        path="*"
        element={
          authenticated ? <AppRoutes /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}
