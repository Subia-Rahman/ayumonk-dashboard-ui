export const API_URLS = {
  authLogin: "/authentication/api/v1/auth/login",
  authLogout: "/authentication/api/v1/auth/logout",
  authMyPermissions: "/authentication/api/v1/auth/users/me/permissions",
  authMyEffectivePolicy: "/authentication/api/v1/auth/users/me/effective-policy",
  authMyAccessibleMenus: "/authentication/api/v1/auth/users/me/accessible-menus",

  roles: "/authentication/api/v1/auth/roles",
  roleById: (roleId) => `/authentication/api/v1/auth/roles/${roleId}`,

  permissionsMaster: "/authentication/api/v1/auth/permissions",
  permissionMasterById: (permissionId) =>
    `/authentication/api/v1/auth/permissions/${permissionId}`,

  // RBAC matrix — aggregated view of which roles can access which sections.
  //
  //   GET /authentication/api/v1/auth/rbac-matrix?company_id=<uuid>
  //
  // AuthZ:
  //   - Platform admins (`is_platform_admin: true` claim): may pass any
  //     `company_id`. Omitting it returns the platform-wide default matrix.
  //   - Company admins (role = "admin"): the `company_id` query param is
  //     IGNORED; the backend derives the tenant from the JWT (Spec §7).
  //   - All other roles (employee / hr / cxo / ...): 403 Forbidden.
  //
  // Response shape (see normalizeRbacMatrix in rbacMatrixSlice for parsing):
  //   {
  //     "success": true,
  //     "data": {
  //       "company_id": "<uuid>",
  //       "company_name": "TechCorp",
  //       "roles": [
  //         { "key": "employee",      "label": "Employee" },
  //         { "key": "hr",            "label": "HR Manager" },
  //         { "key": "cxo",           "label": "CXO" },
  //         { "key": "admin",         "label": "Company Admin" },
  //         { "key": "ayumonk_admin", "label": "Ayumonk Admin" },
  //         { "key": "super_admin",   "label": "Super Admin" }
  //       ],
  //       "sections": [
  //         {
  //           "key": "company_master",
  //           "label": "Company Master",
  //           "permissions": {
  //             "employee": "none", "hr": "none", "cxo": "none",
  //             "admin": "view", "ayumonk_admin": "full", "super_admin": "full"
  //           }
  //         },
  //         ... one entry per section ...
  //       ]
  //     }
  //   }
  // permission values: "none" (—), "view" (read-only), "full" (read + write).
  rbacMatrix: "/authentication/api/v1/auth/rbac-matrix",

  policies: "/authentication/api/v1/auth/policies",

  menusMaster: "/authentication/api/v1/auth/menus",
  menusMasterAll: "/authentication/api/v1/auth/menus/all",
  menuMasterById: (menuId) => `/authentication/api/v1/auth/menus/${menuId}`,

  roleAddPermissions: (roleId) =>
    `/authentication/api/v1/auth/roles/${roleId}/permissions/add`,
  roleRemovePermissions: (roleId) =>
    `/authentication/api/v1/auth/roles/${roleId}/permissions/remove`,
  roleListPermissions: (roleId) =>
    `/authentication/api/v1/auth/roles/${roleId}/permissions`,
  roleAddPolicies: (roleId) =>
    `/authentication/api/v1/auth/roles/${roleId}/policies/add`,
  roleRemovePolicies: (roleId) =>
    `/authentication/api/v1/auth/roles/${roleId}/policies/remove`,
  roleAddMenus: (roleId) =>
    `/authentication/api/v1/auth/roles/${roleId}/menus/add`,
  roleRemoveMenus: (roleId) =>
    `/authentication/api/v1/auth/roles/${roleId}/menus/remove`,
  roleListMenus: (roleId) =>
    `/authentication/api/v1/auth/roles/${roleId}/menus`,

  userOverrideMenus: (userId) =>
    `/authentication/api/v1/auth/users/${userId}/menus`,
  userOverridePermissions: (userId) =>
    `/authentication/api/v1/auth/users/${userId}/permissions`,
  userAddPolicies: (userId) =>
    `/authentication/api/v1/auth/users/${userId}/policies/add`,

  adminSuggestions: "/config/api/v1/admin/suggestions",
  adminSuggestionById: (suggestionId) =>
    `/config/api/v1/admin/suggestions/${suggestionId}`,

  challenges: "/config/api/v1/challenges",
  challengeById: (challengeKey) => `/config/api/v1/challenges/${challengeKey}`,
  challengeKpiMappings: (challengeKey) =>
    `/config/api/v1/challenges/${challengeKey}/kpi-mappings`,

  // Badge master — platform-level badge taxonomy. Five admin endpoints all
  // gated by RBAC permission strings (badges:read, badges:create,
  // badges:update, badges:delete). Soft-delete only — DELETE flips
  // is_active=false / is_deleted=true so user_badges.badge_id history is
  // preserved. badge_key is immutable on update. To clear kpi_key on an
  // update, send `clear_kpi_key: true` (Pydantic v1 cannot distinguish
  // "not sent" from "sent as null").
  //
  //   GET    /badges            ?skip=&limit=&kpi_key=&trigger_type=&level=&is_active=&search=
  //   GET    /badges/{badge_id}
  //   POST   /badges
  //   PUT    /badges/{badge_id}
  //   DELETE /badges/{badge_id}
  badges: "/config/api/v1/badges",
  badgeById: (badgeId) => `/config/api/v1/badges/${badgeId}`,

  departments: "/config/api/v1/departments",
  departmentById: (deptId) => `/config/api/v1/departments/${deptId}`,

  locations: "/config/api/v1/locations",

  companies: "/config/api/v1/companies",
  companyById: (companyId) => `/config/api/v1/companies/${companyId}`,
  companyAdmin: (companyId) => `/config/api/v1/companies/${companyId}/admin`,
  companyUpload: "/config/api/v1/companies/upload",
  companyMe: "/config/api/v1/companies/me",

  dashboardKpis: "/config/api/v1/dashboard/kpis",
  dashboardChallengeAction: "/config/api/v1/dashboard/challenges/action",
  // Undo a previously-completed daily challenge so the tile reverts to
  // "pending" and the user's XP/level is adjusted (the response carries an
  // `xp` block, possibly including a level decrease).
  //   POST /config/api/v1/dashboard/challenges/undo  body: { challenge_id }
  dashboardChallengeUndo: "/config/api/v1/dashboard/challenges/undo",
  dashboardWellnessTrends: "/config/api/v1/dashboard/wellness-trends",
  // Caller's badge cabinet (earned + locked). JWT-authenticated.
  //   GET /config/api/v1/dashboard/me/badges
  //   → { data: { earned_count, total_count, badges: [
  //       { badge_key, label, icon, level, trigger_type, trigger_value,
  //         kpi_key, kpi_display_name, earned, earned_at }
  //     ] } }
  dashboardMyBadges: "/config/api/v1/dashboard/me/badges",
  // Weekly leaderboard for the caller's company. JWT-authenticated.
  //   GET /config/api/v1/dashboard/leaderboard
  //   → { data: {
  //       week_start, week_end,
  //       leaderboard: [{ rank, rank_label, user_id, display_name, subtext,
  //         xp_this_week, xp_last_week, display_change, change_type,
  //         current_level, level_label, is_current_user }, ... up to 10],
  //       your_position: null | { ...same shape, is_current_user: true }
  //     } }
  dashboardLeaderboard: "/config/api/v1/dashboard/leaderboard",
  sessionSuggestions: (sessionId) => `/config/api/v1/sessions/${sessionId}/suggestions`,

  kpis: "/config/api/v1/kpi",
  kpiById: (kpiKey) => `/config/api/v1/kpi/${kpiKey}`,

  kpiSuggestionMappings: "/config/api/v1/admin/kpi-suggestion-mappings",
  kpiSuggestionMappingById: (mappingId) =>
    `/config/api/v1/admin/kpi-suggestion-mappings/${mappingId}`,

  questionHierarchy: "/config/api/v1/kpiquestions/hierarchy",
  questions: "/config/api/v1/kpi-questions",
  questionById: (questionId) => `/config/api/v1/kpi-questions/${questionId}`,
  questionUpload: "/config/api/v1/kpiquestions/upload",

  sessions: "/config/api/v1/sessions",
  sessionById: (sessionId) => `/config/api/v1/sessions/${sessionId}`,
  sessionQuestions: (sessionId) => `/config/api/v1/sessions/${sessionId}/questions`,
  sessionQuestionById: (sessionId, questionId) =>
    `/config/api/v1/sessions/${sessionId}/questions/${questionId}`,
  sessionQuestionsOrder: (sessionId) =>
    `/config/api/v1/sessions/${sessionId}/questions/order`,
  sessionMyLinks: "/config/api/v1/sessions/my-links",
  sessionMySubmissions: "/config/api/v1/sessions/my-submissions",
  sessionPreview: (sessionId) => `/config/api/v1/sessions/${sessionId}/form/preview`,
  sessionPublish: (sessionId) => `/config/api/v1/sessions/${sessionId}/publish`,
  sessionForm: (sessionId) => `/config/api/v1/sessions/${sessionId}/form`,
  sessionFormSubmit: (sessionId) =>
    `/config/api/v1/sessions/${sessionId}/form/submit`,

  themes: "/config/api/v1/themes",
  themeById: (themeKey) => `/config/api/v1/themes/${themeKey}`,

  users: "/config/api/v1/users",
  userById: (userId) => `/config/api/v1/users/${userId}`,
  userUpload: "/config/api/v1/users/upload",

  reminderSettings: "/config/api/v1/reminder-settings",
  reminderSettingsToggle: "/config/api/v1/reminder-settings/toggle",
  reminderSettingsSnooze: "/config/api/v1/reminder-settings/snooze",

  notifications: "/config/api/v1/notifications",
  notificationsUnreadCount: "/config/api/v1/notifications/unread-count",
  notificationsMarkAllRead: "/config/api/v1/notifications/mark-all-read",
  notificationRead: (id) => `/config/api/v1/notifications/${id}/read`,
  notificationDismiss: (id) => `/config/api/v1/notifications/${id}/dismiss`,
  notificationSnooze: (id) => `/config/api/v1/notifications/${id}/snooze`,
  notificationAction: (id) => `/config/api/v1/notifications/${id}/action`,

  // CXO Metrics configuration — how Productivity / Engagement / Absenteeism
  // are derived from wellness KPIs and signals, per company. All routed via
  // the gateway under the existing /config/api/v1 namespace.
  //   GET    /config/api/v1/admin/cxo-metrics                                          → metrics master
  //   GET    /config/api/v1/admin/cxo-metrics/{metric_code}?company_id={uuid}          → one metric's definition for one company
  //   PUT    /config/api/v1/admin/cxo-metrics/{metric_code}                            → partial update (only sent keys are applied)
  //   DELETE /config/api/v1/admin/cxo-metrics/{metric_code}?company_id={uuid}          → delete the company-scoped metric
  //   GET    /config/api/v1/admin/cxo-metrics/{metric_code}/mapping?company_id={uuid}  → one metric's mapping for one company
  //   PUT    /config/api/v1/admin/cxo-metrics/{metric_code}/mapping                    → atomic replace
  //   POST   /config/api/v1/admin/cxo-metrics/{metric_code}/reset                      → reset to platform default
  //   GET    /config/api/v1/admin/cxo-metrics/options?company_id={uuid}                → available KPIs/signals
  cxoMetricsMaster: "/config/api/v1/admin/cxo-metrics",
  cxoMetricByCode: (metricCode) =>
    `/config/api/v1/admin/cxo-metrics/${metricCode}`,
  // Same path shape as cxoMetricByCode, but the path param is the metric_id
  // (UUID). The new PUT / DELETE definition endpoints route by id rather
  // than by code, and don't need a company_id (metric_id is globally unique).
  cxoMetricById: (metricId) =>
    `/config/api/v1/admin/cxo-metrics/${metricId}`,
  cxoMetricMapping: (metricCode) =>
    `/config/api/v1/admin/cxo-metrics/${metricCode}/mapping`,
  cxoMetricReset: (metricCode) =>
    `/config/api/v1/admin/cxo-metrics/${metricCode}/reset`,
  cxoMetricsOptions: "/config/api/v1/admin/cxo-metrics",
  // CXO ↔ KPI mapping (per-row granular). The collection endpoint accepts
  // company_id + metric_id query params; per-row endpoints accept the row's
  // mapping_id in the path and the company_id query for tenant scoping.
  //   GET    /admin/cxo-kpi-mapping?company_id=&metric_id=&include_inactive= → list rows
  //   POST   /admin/cxo-kpi-mapping                                          → create rows
  //   GET    /admin/cxo-kpi-mapping/{mapping_id}?company_id=                 → one row
  //   PUT    /admin/cxo-kpi-mapping/{mapping_id}?company_id=                 → update weight
  //   PATCH  /admin/cxo-kpi-mapping/{mapping_id}/status?company_id=          → toggle is_active
  //   DELETE /admin/cxo-kpi-mapping/{mapping_id}?company_id=                 → soft-delete one
  //   DELETE /admin/cxo-kpi-mapping?company_id=&metric_id=                   → soft-delete all
  cxoKpiMapping: "/config/api/v1/admin/cxo-kpi-mapping",
  cxoKpiMappingById: (mappingId) =>
    `/config/api/v1/admin/cxo-kpi-mapping/${mappingId}`,
  cxoKpiMappingStatus: (mappingId) =>
    `/config/api/v1/admin/cxo-kpi-mapping/${mappingId}/status`,

  // Wellness Dimensions — platform-level dimension taxonomy plus KPI
  // mappings beneath each dimension. Two modules, same /dimensions prefix:
  //   GET    /dimensions                                        → list with kpi_count
  //   POST   /dimensions                                        → create
  //   PATCH  /dimensions/{id}                                   → update label / order / active
  //   DELETE /dimensions/{id}                                   → hard delete (rejects if mappings)
  //   GET    /dimensions/{id}/mappings                          → mappings (active + inactive)
  //   POST   /dimensions/{id}/mappings                          → add KPI to dimension
  //   PATCH  /dimensions/{id}/mappings/{mapping_id}             → update weight / order / active
  //   DELETE /dimensions/{id}/mappings/{mapping_id}             → hard delete
  dimensions: "/config/api/v1/dimensions",
  dimensionById: (dimensionId) => `/config/api/v1/dimensions/${dimensionId}`,
  dimensionMappings: (dimensionId) =>
    `/config/api/v1/dimensions/${dimensionId}/mappings`,
  dimensionMappingById: (dimensionId, mappingId) =>
    `/config/api/v1/dimensions/${dimensionId}/mappings/${mappingId}`,

  // HR-facing CXO metric read endpoints — used by the HR Analytics dashboard
  // to render the Productivity / Engagement / Absenteeism chart. Tenant is
  // derived from the JWT for company-tier callers (HR / admin / cxo); the
  // `company_id` query param is only honoured for platform admins.
  //   GET /config/api/v1/hr/cxo-metrics?metric=productivity        → by_department + by_age_band rows
  //   GET /config/api/v1/hr/cxo-metrics/definitions                → tabs (metrics with an active mapping)
  hrCxoMetrics: "/config/api/v1/hr/cxo-metrics",
  hrCxoMetricsDefinitions: "/config/api/v1/hr/cxo-metrics/definitions",

  // HR Analytics charts — three endpoints drive the "Wellness by Dimension"
  // and "Gender-wise Wellness & Productivity" cards. company_id is derived
  // from the JWT by the backend; the frontend never passes it.
  //   GET /config/api/v1/hr/wellness-dimensions
  //     → [{ key, label, order }, ...] with "wellnessindex" always first
  //   GET /config/api/v1/hr/wellness-by-dimension?dimension=<key>
  //     → { dimension, by_department: [...], by_location: [...] }
  //   GET /config/api/v1/hr/gender-wellness
  //     → [{ gender, wellness_score, productivity_score | null }, ...]
  hrWellnessDimensions: "/config/api/v1/hr/wellness-dimensions",
  hrWellnessByDimension: "/config/api/v1/hr/wellness-by-dimension",
  hrGenderWellness: "/config/api/v1/hr/gender-wellness",
  //   GET /config/api/v1/hr/heatmap/location-department
  //     → 2D wellness scores. Accepts several response shapes; the slice
  //       normalizes to { locations: [...], departments: [...], cells: [{location, department, value}] }
  hrHeatmapLocationDept: "/config/api/v1/hr/heatmap/location-department",

  // HR Analytics summary tiles, employee count and headcount breakdowns.
  // All three accept the same demographic filter set as the chart endpoints
  // (department, location, age_band, gender) and derive company_id from JWT.
  //   GET /config/api/v1/hr/summary-cards
  //     → { avg_wellness:{value,unit,label,subtext}, productivity:{...},
  //         engagement:{...}, absenteeism:{...}, sleep_score:{...},
  //         stress_score:{...} } — value is null when the dimension isn't
  //       configured or the filtered set is empty.
  //   GET /config/api/v1/hr/employee-count
  //     → { total: int, filtered: int } — rendered as
  //       "{filtered} of {total} employees in scope".
  //   GET /config/api/v1/hr/headcount
  //     → { by_department: [{label,count}], by_location: [{label,count}] }
  //       used for scatter bubble sizing and any per-segment headcount label.
  hrSummaryCards: "/config/api/v1/hr/summary-cards",
  hrEmployeeCount: "/config/api/v1/hr/employee-count",
  hrHeadcount: "/config/api/v1/hr/headcount",

  challengeSchedule: "/config/api/v1/challenges/schedule",

  reminderSettingsLog: "/config/api/v1/reminder-settings/log",

  // Wellness Index — GET caller's computed wellness score + risk band
  wellnessIndex: "/config/api/v1/wellness/index",

  // Wellness Mood — POST a daily mood check-in (score 1–5)
  wellnessMood: "/config/api/v1/wellness/mood",
  wellnessMoodToday: "/config/api/v1/wellness/mood/today",

  // User Suggestions — GET personalised suggestions, POST an action on one
  userSuggestionsMy:    "/config/api/v1/suggestions/my",
  userSuggestionAction: (logId) => `/config/api/v1/suggestions/${logId}/action`,
};