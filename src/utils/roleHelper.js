const AUTH_KEY = "isAuthenticated";
const ROLE_KEY = "role";
const RAW_ROLE_KEY = "rawRole";
const TOKEN_KEY = "token";
const USER_KEY = "userProfile";
const COMPANY_ID_KEY = "companyId";
const PLATFORM_ADMIN_KEY = "isPlatformAdmin";

const USER_ROLE_NAMES = new Set(["user", "employee"]);
const SUPER_ADMIN_ROLE_NAMES = new Set(["superadmin", "ayumonkadmin"]);
const COMPANY_ADMIN_RAW_NAMES = new Set(["admin", "companyadmin"]);

// Strip whitespace / underscores / hyphens and lowercase so backend role
// strings like "Company Admin", "company_admin", "company-admin" all collapse
// to the same canonical key for comparison.
const canonicaliseRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");

export const normalizeRole = (role) => {
  const cleaned = canonicaliseRole(role);
  if (!cleaned) return "";
  if (USER_ROLE_NAMES.has(cleaned)) return "user";
  if (SUPER_ADMIN_ROLE_NAMES.has(cleaned)) return "superadmin";
  return "admin";
};

// Preserve the original role string the backend sent so downstream code can
// distinguish between Company Admin / HR Manager / CXO / etc. — `normalizeRole`
// collapses all of these to "admin" and loses the distinction.
export const canonicaliseRawRole = canonicaliseRole;

export const isCompanyAdminRawRole = (rawRole) =>
  COMPANY_ADMIN_RAW_NAMES.has(canonicaliseRole(rawRole));

export const getRole = () => localStorage.getItem(ROLE_KEY);

// Raw (unnormalized) role string from the backend, preserved so we can tell
// Company Admin apart from HR / CXO / Manager — they all collapse to "admin"
// under normalizeRole.
export const getRawRole = () => localStorage.getItem(RAW_ROLE_KEY) || "";

export const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      base64 + "===".slice((base64.length + 3) % 4).slice(0, 0);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const getIsPlatformAdmin = () =>
  localStorage.getItem(PLATFORM_ADMIN_KEY) === "true";

export const setIsPlatformAdmin = (value) => {
  if (value === true) {
    localStorage.setItem(PLATFORM_ADMIN_KEY, "true");
  } else {
    localStorage.removeItem(PLATFORM_ADMIN_KEY);
  }
};

export const getHomePath = ({ isPlatformAdmin, role, rawRole } = {}) => {
  // 1. Platform admins (is_platform_admin claim from JWT) — Super Admin /
  //    Ayumonk Admin land on the super-admin workspace.
  if (isPlatformAdmin) return "/super-admin/dashboard";

  // 2. Employees / users land on the user wellness dashboard.
  const rawCanonical = canonicaliseRole(rawRole);
  if (role === "user" || USER_ROLE_NAMES.has(rawCanonical)) {
    return "/user/dashboard";
  }

  // 3. Company Admin lands on the admin dashboard. We rely on rawRole here
  //    because normalizeRole collapses Company Admin, HR, CXO, Manager all
  //    into "admin". Without rawRole we can't tell them apart.
  if (COMPANY_ADMIN_RAW_NAMES.has(rawCanonical)) {
    return "/admin/dashboard";
  }

  // 4. Everything else under the admin umbrella (HR Manager, CXO, generic
  //    managers, …) lands on the HR analytics dashboard.
  return "/admin/hr-dashboard";
};

// Used by Login + LoginRoute to decide whether to honor a `from` redirect
// after authentication. Without this, a stale `from` set by RouteGuard while
// the previous user was logging out would bounce the next user back into the
// previous role's URL (e.g. a freshly-logged-in super admin landing on
// /user/submissions because the previous employee session left that URL
// stamped onto the login route's history state).
//
// Note: we do NOT grant platform admins blanket access here even though
// they technically *can* render every page — for the redirect decision we
// only honor a `from` path that lives in the new user's primary URL space,
// so a fresh login always anchors on the user's natural home unless the
// `from` URL belongs to that user's own area.
export const isPathAllowedForRole = (pathname, { role, isPlatformAdmin } = {}) => {
  if (!pathname || typeof pathname !== "string") return false;
  if (pathname === "/" || pathname === "/login") return false;
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return true;
  if (role === "user") return pathname.startsWith("/user/");
  if (isPlatformAdmin || role === "superadmin") {
    return (
      pathname.startsWith("/super-admin/") || pathname.startsWith("/admin/")
    );
  }
  if (role === "admin") return pathname.startsWith("/admin/");
  return false;
};

// Back-compat shim used by older callers; prefer getHomePath above.
export const getHomePathForRole = (role) =>
  getHomePath({ isPlatformAdmin: role === "superadmin", role });

export const isAuthenticated = () => localStorage.getItem(AUTH_KEY) === "true";

export const setAuthSession = ({
  role,
  rawRole,
  name,
  email,
  token,
  id,
  companyId,
}) => {
  const normalizedRole = normalizeRole(role);
  const accessToken = token || `fake-jwt-${normalizedRole}-${Date.now()}`;
  // Preserve the original role string so /admin/dashboard vs /admin/hr-dashboard
  // routing can tell Company Admin apart from HR / CXO / Manager.
  const preservedRawRole = canonicaliseRole(rawRole ?? role);
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(ROLE_KEY, normalizedRole);
  if (preservedRawRole) {
    localStorage.setItem(RAW_ROLE_KEY, preservedRawRole);
  } else {
    localStorage.removeItem(RAW_ROLE_KEY);
  }
  localStorage.setItem(TOKEN_KEY, accessToken);

  if (companyId !== undefined && companyId !== null && companyId !== "") {
    localStorage.setItem(COMPANY_ID_KEY, String(companyId));
  }

  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id,
      name,
      email,
      role: normalizedRole,
      token: accessToken,
      company_id:
        companyId !== undefined && companyId !== null && companyId !== ""
          ? String(companyId)
          : undefined,
    }),
  );
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(RAW_ROLE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(COMPANY_ID_KEY);
  localStorage.removeItem(PLATFORM_ADMIN_KEY);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getCompanyId = () =>
  localStorage.getItem(COMPANY_ID_KEY) || getUserProfile()?.company_id || "";

export const setCompanyId = (companyId) => {
  if (companyId === undefined || companyId === null || companyId === "") {
    localStorage.removeItem(COMPANY_ID_KEY);
    return;
  }

  localStorage.setItem(COMPANY_ID_KEY, String(companyId));

  const profile = getUserProfile();
  if (!profile) return;

  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      ...profile,
      company_id: String(companyId),
    }),
  );
};

export const getUserProfile = () => {
  const profile = localStorage.getItem(USER_KEY);
  if (!profile) return null;

  try {
    return JSON.parse(profile);
  } catch {
    return null;
  }
};

export const updateStoredProfile = ({ name, email, companyId }) => {
  const profile = getUserProfile();
  if (!profile) return;

  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      ...profile,
      name,
      email,
      ...(companyId !== undefined ? { company_id: String(companyId) } : {}),
    }),
  );

  if (companyId !== undefined) {
    setCompanyId(companyId);
  }
};
