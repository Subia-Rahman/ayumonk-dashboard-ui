import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";

const initialState = {
  items: [],
  selectedRole: null,
  selectedTenantId: "",
  listLoading: false,
  detailLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  listError: "",
  detailError: "",
  createError: "",
  updateError: "",
  deleteError: "",
  createMessage: "",
  updateMessage: "",
  deleteMessage: "",
};

const pickList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const pickItem = (payload) => {
  if (!payload) return null;
  if (payload?.data && typeof payload.data === "object") return payload.data;
  return payload;
};

const normalizeRole = (item, index = 0) => ({
  id: String(item?.id ?? index),
  name: item?.name || item?.role_name || "",
  role_name: item?.role_name || item?.name || "",
  tenant_id: item?.tenant_id || "",
  tenant_name: item?.tenant_name || "",
  is_active: item?.is_active ?? true,
});

export const fetchRolesByTenant = createAsyncThunk(
  "role/fetchRolesByTenant",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.roles, {
        params: { tenant_id: tenantId },
      });
      const list = pickList(response?.data);
      return {
        tenantId,
        items: list.map(normalizeRole),
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch roles due to server/network error.",
        ),
      );
    }
  },
);

export const fetchRoleById = createAsyncThunk(
  "role/fetchRoleById",
  async (arg, { getState, rejectWithValue }) => {
    const roleId =
      typeof arg === "object" && arg !== null ? arg.roleId : arg;
    const tenantId =
      typeof arg === "object" && arg !== null
        ? arg.tenantId
        : getState()?.role?.selectedTenantId;

    if (!roleId) {
      return rejectWithValue("Role id is required.");
    }
    if (!tenantId) {
      return rejectWithValue("Company id is required to fetch role.");
    }

    try {
      const response = await api.get(API_URLS.roleById(roleId), {
        params: { tenant_id: tenantId },
      });
      const item = pickItem(response?.data);
      if (!item) {
        return rejectWithValue("Failed to fetch role.");
      }
      return normalizeRole(item);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch role due to server/network error.",
        ),
      );
    }
  },
);

export const createRole = createAsyncThunk(
  "role/createRole",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URLS.roles, payload);
      const item = pickItem(response?.data);
      if (!item) {
        return rejectWithValue("Failed to create role.");
      }
      return {
        item: normalizeRole(item),
        message: "Role created successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to create role due to server/network error.",
        ),
      );
    }
  },
);

export const updateRole = createAsyncThunk(
  "role/updateRole",
  async ({ roleId, payload }, { rejectWithValue }) => {
    try {
      const response = await api.put(API_URLS.roleById(roleId), payload);
      const item = pickItem(response?.data);
      if (!item) {
        return rejectWithValue("Failed to update role.");
      }
      return {
        item: normalizeRole(item),
        message: "Role updated successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to update role due to server/network error.",
        ),
      );
    }
  },
);

export const deleteRole = createAsyncThunk(
  "role/deleteRole",
  async (arg, { getState, rejectWithValue }) => {
    const roleId =
      typeof arg === "object" && arg !== null ? arg.roleId : arg;
    const tenantId =
      typeof arg === "object" && arg !== null
        ? arg.tenantId
        : getState()?.role?.selectedTenantId;

    if (!roleId) {
      return rejectWithValue("Role id is required.");
    }
    if (!tenantId) {
      return rejectWithValue("Company id is required to delete role.");
    }

    try {
      await api.delete(API_URLS.roleById(roleId), {
        params: { tenant_id: tenantId },
      });
      return {
        id: String(roleId),
        message: "Role deleted successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to delete role due to server/network error.",
        ),
      );
    }
  },
);

const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    setSelectedTenantId(state, action) {
      state.selectedTenantId = action.payload || "";
    },
    selectRoleById(state, action) {
      const id = String(action.payload || "");
      state.selectedRole =
        state.items.find((item) => item.id === id) || null;
    },
    clearRoleListState(state) {
      state.items = [];
      state.listError = "";
      state.createError = "";
      state.createMessage = "";
      state.updateError = "";
      state.updateMessage = "";
      state.deleteError = "";
      state.deleteMessage = "";
    },
    clearRoleCreateState(state) {
      state.createLoading = false;
      state.createError = "";
      state.createMessage = "";
    },
    clearRoleUpdateState(state) {
      state.updateLoading = false;
      state.updateError = "";
      state.updateMessage = "";
    },
    clearRoleDeleteState(state) {
      state.deleteLoading = false;
      state.deleteError = "";
      state.deleteMessage = "";
    },
    clearRoleDetailState(state) {
      state.detailLoading = false;
      state.detailError = "";
    },
    clearSelectedRole(state) {
      state.selectedRole = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRolesByTenant.pending, (state) => {
        state.listLoading = true;
        state.listError = "";
      })
      .addCase(fetchRolesByTenant.fulfilled, (state, action) => {
        state.listLoading = false;
        state.items = action.payload.items;
        state.selectedTenantId = action.payload.tenantId;
      })
      .addCase(fetchRolesByTenant.rejected, (state, action) => {
        state.listLoading = false;
        state.items = [];
        state.listError = action.payload || "Failed to fetch roles.";
      })
      .addCase(fetchRoleById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = "";
      })
      .addCase(fetchRoleById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedRole = action.payload;
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload || "Failed to fetch role.";
      })
      .addCase(createRole.pending, (state) => {
        state.createLoading = true;
        state.createError = "";
        state.createMessage = "";
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createMessage = action.payload.message;
        state.items = [action.payload.item, ...state.items];
      })
      .addCase(createRole.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || "Failed to create role.";
      })
      .addCase(updateRole.pending, (state) => {
        state.updateLoading = true;
        state.updateError = "";
        state.updateMessage = "";
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateMessage = action.payload.message;
        state.selectedRole = action.payload.item;
        state.items = state.items.map((item) =>
          item.id === action.payload.item.id ? action.payload.item : item,
        );
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || "Failed to update role.";
      })
      .addCase(deleteRole.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = "";
        state.deleteMessage = "";
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteMessage = action.payload.message;
        state.items = state.items.filter(
          (item) => item.id !== action.payload.id,
        );
        if (state.selectedRole?.id === action.payload.id) {
          state.selectedRole = null;
        }
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || "Failed to delete role.";
      });
  },
});

export const {
  setSelectedTenantId,
  selectRoleById,
  clearRoleListState,
  clearRoleCreateState,
  clearRoleUpdateState,
  clearRoleDeleteState,
  clearRoleDetailState,
  clearSelectedRole,
} = roleSlice.actions;

export default roleSlice.reducer;
