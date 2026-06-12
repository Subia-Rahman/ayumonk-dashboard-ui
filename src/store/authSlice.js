import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";
import authService from "../services/authService";

import {
  canonicaliseRawRole,
  clearAuthSession,
  decodeJwtPayload,
  getCompanyId,
  getIsPlatformAdmin,
  getRawRole,
  getRole,
  getToken,
  getUserProfile,
  isAuthenticated,
  normalizeRole,
  setAuthSession,
  setCompanyId,
  setIsPlatformAdmin,
  updateStoredProfile,
} from "../utils/roleHelper";

const initialState = {
  isAuthenticated: isAuthenticated(),
  role: getRole(),
  rawRole: getRawRole(),
  token: getToken(),
  user: getUserProfile(),
  isPlatformAdmin: getIsPlatformAdmin(),
  jwtTenantId: decodeJwtPayload(getToken())?.tenant_id || "",
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URLS.authLogin, {
        username,
        password,
      });

      const { access_token: accessToken, user } = response.data || {};
      if (!accessToken || !user) {
        return rejectWithValue("Login response is invalid.");
      }

      const claims = decodeJwtPayload(accessToken) || {};
      const normalizedRole = normalizeRole(user.role);
      const rawRole = canonicaliseRawRole(user.role);
      const isPlatformAdmin = Boolean(claims.is_platform_admin);
      const jwtTenantId = claims.tenant_id || "";
      const payload = {
        token: accessToken,
        role: normalizedRole,
        rawRole,
        isPlatformAdmin,
        jwtTenantId,
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          role: normalizedRole,
          rawRole,
          company_id:
            user.company_id || jwtTenantId || getCompanyId() || "",
        },
      };

      setAuthSession({
        token: payload.token,
        role: payload.role,
        rawRole: payload.rawRole,
        name: payload.user.name,
        email: payload.user.email,
        id: payload.user.id,
        companyId: payload.user.company_id,
      });
      setCompanyId(payload.user.company_id);
      setIsPlatformAdmin(isPlatformAdmin);

      authService.clear();
      try {
        await authService.loadAuthorization({ force: true });
      } catch {
        // Authorization fetch failures should not block login; the slice will retry on demand.
      }

      return payload;
    } catch (requestError) {
      return rejectWithValue(
        getApiErrorMessage(
          requestError,
          "Invalid credentials or server unavailable.",
        ),
      );
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await api.post(API_URLS.authLogout);
    } catch {
      // Intentionally ignore: see comment above.
    } finally {
      dispatch(authSlice.actions.clearAuthState());
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState(state) {
      clearAuthSession();
      authService.clear();
      delete api.defaults.headers.common['Authorization'];
      window.dispatchEvent(new StorageEvent('storage', { key: 'token', newValue: null }));
      state.isAuthenticated = false;
      state.role = null;
      state.rawRole = "";
      state.token = null;
      state.user = null;
      state.isPlatformAdmin = false;
      state.jwtTenantId = "";
      state.loading = false;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    setAuthError(state, action) {
      state.error = action.payload;
    },
    updateProfile(state, action) {
      const { name, email, companyId } = action.payload;
      if (!state.user) return;
      state.user = {
        ...state.user,
        name,
        email,
        ...(companyId !== undefined ? { company_id: companyId } : {}),
      };
      updateStoredProfile({
        name,
        email,
        companyId,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.isAuthenticated = true;
        state.role = action.payload.role;
        state.rawRole = action.payload.rawRole || "";
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isPlatformAdmin = action.payload.isPlatformAdmin;
        state.jwtTenantId = action.payload.jwtTenantId;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed.";
      });
  },
});

export const { clearAuthState, clearAuthError, setAuthError, updateProfile } = authSlice.actions;
export default authSlice.reducer;