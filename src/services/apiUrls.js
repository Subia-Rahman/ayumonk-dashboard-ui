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
  dashboardWellnessTrends: "/config/api/v1/dashboard/wellness-trends",
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
  cxoMetricMapping: (metricCode) =>
    `/config/api/v1/admin/cxo-metrics/${metricCode}/mapping`,
  cxoMetricReset: (metricCode) =>
    `/config/api/v1/admin/cxo-metrics/${metricCode}/reset`,
  cxoMetricsOptions: "/config/api/v1/admin/cxo-metrics/options",
};
