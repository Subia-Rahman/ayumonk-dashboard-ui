import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";

// Default role columns shown on the matrix when the API hasn't loaded yet.
// The UI mirrors what the backend should return; keeping them here lets the
// component render an initial / fallback grid even before the request resolves
// (or if the endpoint isn't deployed yet in a given environment).
const DEFAULT_ROLES = [
  { key: "employee", label: "Employee" },
  { key: "hr", label: "HR Manager" },
  { key: "cxo", label: "CXO" },
  { key: "admin", label: "Company Admin" },
  { key: "ayumonk_admin", label: "Ayumonk Admin" },
  { key: "super_admin", label: "Super Admin" },
];

// Fallback sections matching the hand-drawn matrix from the client design.
const DEFAULT_SECTIONS = [
  {
    key: "company_master",
    label: "Company Master",
    permissions: {
      employee: "none", hr: "none", cxo: "none",
      admin: "view", ayumonk_admin: "full", super_admin: "full",
    },
  },
  {
    key: "company_users",
    label: "Company Users",
    permissions: {
      employee: "none", hr: "view", cxo: "none",
      admin: "full", ayumonk_admin: "full", super_admin: "full",
    },
  },
  {
    key: "themes",
    label: "Themes",
    permissions: {
      employee: "none", hr: "none", cxo: "none",
      admin: "view", ayumonk_admin: "full", super_admin: "full",
    },
  },
  {
    key: "kpis_questions",
    label: "KPIs & Questions",
    permissions: {
      employee: "none", hr: "none", cxo: "none",
      admin: "none", ayumonk_admin: "full", super_admin: "full",
    },
  },
  {
    key: "challenges",
    label: "Challenges",
    permissions: {
      employee: "none", hr: "view", cxo: "none",
      admin: "view", ayumonk_admin: "full", super_admin: "full",
    },
  },
  {
    key: "suggestion_master",
    label: "Suggestion Master",
    permissions: {
      employee: "none", hr: "none", cxo: "none",
      admin: "none", ayumonk_admin: "full", super_admin: "full",
    },
  },
  {
    key: "sessions_windows",
    label: "Sessions / Windows",
    permissions: {
      employee: "none", hr: "full", cxo: "view",
      admin: "full", ayumonk_admin: "full", super_admin: "full",
    },
  },
  {
    key: "hr_analytics",
    label: "HR Analytics",
    permissions: {
      employee: "none", hr: "full", cxo: "full",
      admin: "none", ayumonk_admin: "view", super_admin: "full",
    },
  },
  {
    key: "ayufinity_products",
    label: "Ayufinity / Products",
    permissions: {
      employee: "none", hr: "none", cxo: "none",
      admin: "none", ayumonk_admin: "full", super_admin: "full",
    },
  },
  {
    key: "platform_settings",
    label: "Platform Settings",
    permissions: {
      employee: "none", hr: "none", cxo: "none",
      admin: "none", ayumonk_admin: "none", super_admin: "full",
    },
  },
];

const VALID_LEVELS = new Set(["none", "view", "full"]);

const normalizeRole = (role, index = 0) => ({
  key: String(role?.key || role?.role_key || `role-${index}`),
  label: String(role?.label || role?.role_name || role?.key || `Role ${index + 1}`),
});

const normalizePermissionLevel = (value) => {
  // Accept the canonical "none" / "view" / "full" strings, plus a few common
  // backend aliases (booleans, "read", "rw", null) so a backend that uses a
  // slightly different vocabulary still renders correctly.
  if (value === true) return "full";
  if (value === false || value === null || value === undefined) return "none";
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (VALID_LEVELS.has(v)) return v;
    if (v === "read" || v === "readonly" || v === "read_only" || v === "r") return "view";
    if (v === "rw" || v === "write" || v === "manage" || v === "admin") return "full";
    if (v === "" || v === "-" || v === "—" || v === "no" || v === "deny") return "none";
  }
  return "none";
};

const normalizeSection = (section, index = 0, roleKeys = []) => {
  const key = String(section?.key || section?.section_key || `section-${index}`);
  const label = String(
    section?.label || section?.section_name || section?.name || key,
  );
  const rawPerms = section?.permissions || section?.perms || {};
  const permissions = {};
  for (const roleKey of roleKeys) {
    permissions[roleKey] = normalizePermissionLevel(rawPerms[roleKey]);
  }
  // Preserve any unexpected role keys returned by the backend so we don't
  // silently drop them — the UI ignores unknown keys but they remain in the
  // store for debugging / future role columns.
  for (const k of Object.keys(rawPerms)) {
    if (!(k in permissions)) {
      permissions[k] = normalizePermissionLevel(rawPerms[k]);
    }
  }
  return { key, label, permissions };
};

const normalizeRbacMatrix = (payload = {}) => {
  const data = payload?.data || payload || {};
  const rolesIn = Array.isArray(data.roles) ? data.roles : [];
  const sectionsIn = Array.isArray(data.sections) ? data.sections : [];

  const roles = rolesIn.length
    ? rolesIn.map((role, index) => normalizeRole(role, index))
    : DEFAULT_ROLES;
  const roleKeys = roles.map((role) => role.key);
  const sections = sectionsIn.length
    ? sectionsIn.map((section, index) => normalizeSection(section, index, roleKeys))
    : DEFAULT_SECTIONS;

  return {
    company_id: String(data.company_id || ""),
    company_name: String(data.company_name || ""),
    roles,
    sections,
  };
};

const initialState = {
  data: {
    company_id: "",
    company_name: "",
    roles: DEFAULT_ROLES,
    sections: DEFAULT_SECTIONS,
  },
  loading: false,
  error: "",
  loadedCompanyId: "",
};

export const fetchRbacMatrix = createAsyncThunk(
  "rbacMatrix/fetch",
  async (arg = "", { rejectWithValue }) => {
    // Back-compat: accept either a bare companyId string or an options object.
    const { companyId } =
      typeof arg === "object" && arg !== null ? arg : { companyId: arg };

    try {
      const params = {};
      const cid = String(companyId || "").trim();
      if (cid) params.company_id = cid;

      const response = await api.get(API_URLS.rbacMatrix, { params });
      const payload = response?.data || {};

      if (payload?.success === false) {
        return rejectWithValue(
          payload?.message || "Failed to fetch RBAC matrix.",
        );
      }

      return {
        matrix: normalizeRbacMatrix(payload),
        requestedCompanyId: cid,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch RBAC matrix due to server/network error.",
        ),
      );
    }
  },
);

const rbacMatrixSlice = createSlice({
  name: "rbacMatrix",
  initialState,
  reducers: {
    clearRbacMatrix(state) {
      state.data = initialState.data;
      state.loading = false;
      state.error = "";
      state.loadedCompanyId = "";
    },
    clearRbacMatrixError(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRbacMatrix.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchRbacMatrix.fulfilled, (state, action) => {
        state.loading = false;
        state.error = "";
        state.data = action.payload.matrix;
        state.loadedCompanyId =
          action.payload.matrix.company_id ||
          action.payload.requestedCompanyId ||
          "";
      })
      .addCase(fetchRbacMatrix.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch RBAC matrix.";
        // Keep the fallback DEFAULT_* in state so the UI still renders.
      });
  },
});

export const { clearRbacMatrix, clearRbacMatrixError } = rbacMatrixSlice.actions;
export { DEFAULT_ROLES, DEFAULT_SECTIONS };
export default rbacMatrixSlice.reducer;
