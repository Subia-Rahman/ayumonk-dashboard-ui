import authService from "../services/authService";

// Canonical menu paths as stored in the backend (platform-admin namespace).
// Add a slug here whenever the backend introduces a new menu.
export const SLUG_TO_ROUTE = {
  dashboard: "/super-admin/dashboard",
  "company-data": "/super-admin/company-data",
  "company-details": "/super-admin/company-details",
  "company-users": "/super-admin/company-users",
  questions: "/super-admin/questions",
  themes: "/super-admin/themes",
  kpis: "/super-admin/kpis",
  challenges: "/super-admin/challenges",
  sessions: "/super-admin/sessions",
  "suggestion-master": "/super-admin/suggestion-master",
  "kpi-suggestion-mapping": "/super-admin/kpi-suggestion-mapping",
  roles: "/super-admin/roles",
  permissions: "/super-admin/permissions",
  policies: "/super-admin/policies",
  menus: "/super-admin/menus",
  "role-assignments": "/super-admin/role-assignments",
  "cxo-metrics": "/super-admin/cxo-metrics",
  "wellness-dimensions": "/super-admin/wellness-dimensions",
  "my-responses": "/user/submissions",
  submissions: "/user/submissions",
  profile: "/profile",
};

// Slugs that always live outside the /super-admin/ namespace and must
// not be rewritten for tenant users.
const SHARED_PREFIXES = ["/profile", "/user/"];

// Slugs that DO have a parallel route under /admin/* registered in
// AppRoutes. For these, we rewrite /super-admin/* → /admin/* so tenant
// users get the tenant-flavoured page. Slugs without an admin variant
// keep the canonical /super-admin/* path; the backend scopes the data.
const SLUGS_WITH_ADMIN_VARIANT = new Set([
  "dashboard",
  "company-details",
  "company-users",
  "themes",
  "kpis",
  "challenges",
  "questions",
]);

const isSharedPath = (path) =>
  SHARED_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));

const rewriteForTenant = (path, slug) => {
  if (!path || isSharedPath(path)) return path;
  if (slug && !SLUGS_WITH_ADMIN_VARIANT.has(slug)) return path;
  if (path.startsWith("/super-admin/")) {
    return path.replace(/^\/super-admin\//, "/admin/");
  }
  return path;
};

export const ROUTE_TO_SLUG = Object.entries(SLUG_TO_ROUTE).reduce(
  (acc, [slug, route]) => {
    acc[route] = slug;
    acc[rewriteForTenant(route, slug)] = slug;
    return acc;
  },
  {},
);

export const resolveRouteForSlug = (slug, role, options = {}) => {
  const canonical = SLUG_TO_ROUTE[slug] || `/${slug}`;
  // The single signal we trust for routing namespace.
  const isPlatformAdmin =
    options.isPlatformAdmin !== undefined
      ? Boolean(options.isPlatformAdmin)
      : role === "superadmin";

  if (isPlatformAdmin) return canonical;
  return rewriteForTenant(canonical, slug);
};

export const resolveSlugForRoute = (pathname) => {
  if (!pathname) return null;
  const exact = ROUTE_TO_SLUG[pathname];
  if (exact) return exact;

  return (
    Object.entries(ROUTE_TO_SLUG).find(([route]) =>
      pathname.startsWith(`${route}/`),
    )?.[1] || null
  );
};

export const hasPermission = (codename) => authService.hasPermission(codename);
export const canCreate = (module) => authService.canCreate(module);
export const canEdit = (module) => authService.canEdit(module);
export const canDelete = (module) => authService.canDelete(module);
export const canView = (module) => authService.canView(module);

export const hasMenu = (slug) => authService.hasMenu(slug);
export const getMenuAccessLevel = (slug) => authService.getMenuAccessLevel(slug);
export const isReadOnly = (slug) => authService.isReadOnly(slug);
export const hasFullAccess = (slug) => authService.hasFullAccess(slug);
