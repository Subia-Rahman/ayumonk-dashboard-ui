import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import sessionReducer from "./sessionSlice";
import companyReducer from "./companySlice";
import userReducer from "./userSlice";
import questionReducer from "./questionSlice";
import userUploadReducer from "./userUploadSlice";
import questionHierarchyReducer from "./questionHierarchySlice";
import themeReducer from "./themeSlice";
import kpiReducer from "./kpiSlice";
import challengeReducer from "./challengeSlice";
import badgeReducer from "./badgeSlice";
import dashboardReducer from "./dashboardSlice";
import adminSuggestionReducer from "./adminSuggestionSlice";
import kpiSuggestionMappingReducer from "./kpiSuggestionMappingSlice";
import permissionReducer from "./permissionSlice";
import roleReducer from "./roleSlice";
import permissionMasterReducer from "./permissionMasterSlice";
import policyReducer from "./policySlice";
import roleAssignmentReducer from "./roleAssignmentSlice";
import userOverridesReducer from "./userOverridesSlice";
import menuMasterReducer from "./menuMasterSlice";
import departmentReducer from "./departmentSlice";
import locationReducer from "./locationSlice";
import tenantContextReducer from "./tenantContextSlice";
import reminderSettingsReducer from "./reminderSettingsSlice";
import notificationsReducer from "./notificationsSlice";
import rbacMatrixReducer from "./rbacMatrixSlice";
import cxoMetricsReducer from "./cxoMetricsSlice";
import wellnessDimensionsReducer from "./wellnessDimensionsSlice";
import hrAnalyticsReducer from "./hrAnalyticsSlice";
import rbacInvalidationMiddleware from "./middleware/rbacInvalidation";

const store = configureStore({
  reducer: {
    auth: authReducer,
    permission: permissionReducer,
    session: sessionReducer,
    company: companyReducer,
    user: userReducer,
    question: questionReducer,
    userUpload: userUploadReducer,
    questionHierarchy: questionHierarchyReducer,
    theme: themeReducer,
    kpi: kpiReducer,
    challenge: challengeReducer,
    badge: badgeReducer,
    dashboard: dashboardReducer,
    adminSuggestion: adminSuggestionReducer,
    kpiSuggestionMapping: kpiSuggestionMappingReducer,
    role: roleReducer,
    permissionMaster: permissionMasterReducer,
    policy: policyReducer,
    roleAssignment: roleAssignmentReducer,
    userOverrides: userOverridesReducer,
    menuMaster: menuMasterReducer,
    department: departmentReducer,
    location: locationReducer,
    tenantContext: tenantContextReducer,
    reminderSettings: reminderSettingsReducer,
    notifications: notificationsReducer,
    rbacMatrix: rbacMatrixReducer,
    cxoMetrics: cxoMetricsReducer,
    wellnessDimensions: wellnessDimensionsReducer,
    hrAnalytics: hrAnalyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(rbacInvalidationMiddleware),
});

export default store;
