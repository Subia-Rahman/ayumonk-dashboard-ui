import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";

const initialState = {
  items: [],
  total: 0,
  skip: 0,
  limit: 50,
  listLoading: false,
  createLoading: false,
  detailLoading: false,
  updateLoading: false,
  deleteLoading: false,
  selectedBadge: null,
  listError: "",
  createError: "",
  detailError: "",
  updateError: "",
  deleteError: "",
  createMessage: "",
  updateMessage: "",
  deleteMessage: "",
};

const normalizeBadge = (item, index = 0) => ({
  id: String(item?.badge_id || item?.id || item?.badge_key || index),
  badge_id: String(item?.badge_id || item?.id || ""),
  badge_key: String(item?.badge_key || ""),
  label: item?.label || "",
  description: item?.description || "",
  icon: item?.icon || "",
  level: String(item?.level || "").toLowerCase(),
  trigger_type: item?.trigger_type || "",
  trigger_value: Number(item?.trigger_value) || 0,
  kpi_key: item?.kpi_key ?? null,
  kpi_display_name: item?.kpi_display_name || "",
  is_active: item?.is_active !== undefined ? Boolean(item.is_active) : true,
  is_deleted: Boolean(item?.is_deleted),
  created_at: item?.created_at || "",
  updated_at: item?.updated_at || "",
});

export const fetchBadges = createAsyncThunk(
  "badge/fetchBadges",
  async (
    {
      skip = 0,
      limit = 50,
      kpiKey,
      triggerType,
      level,
      isActive,
      search,
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get(API_URLS.badges, {
        params: {
          skip,
          limit,
          ...(kpiKey ? { kpi_key: kpiKey } : {}),
          ...(triggerType ? { trigger_type: triggerType } : {}),
          ...(level ? { level } : {}),
          ...(typeof isActive === "boolean" ? { is_active: isActive } : {}),
          ...(search ? { search } : {}),
        },
      });

      const payload = response?.data || {};
      const data = payload?.data || payload || {};
      const rawItems = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.badges)
          ? data.badges
          : Array.isArray(data)
            ? data
            : [];

      return {
        items: rawItems.map(normalizeBadge),
        total: Number(data?.total) || rawItems.length,
        skip: Number(data?.skip) || skip,
        limit: Number(data?.limit) || limit,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch badges due to server/network error.",
        ),
      );
    }
  },
);

export const fetchBadgeById = createAsyncThunk(
  "badge/fetchBadgeById",
  async (badgeId, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.badgeById(badgeId));
      const payload = response?.data || {};
      const data = payload?.data || payload || null;

      if (!data) {
        return rejectWithValue(payload?.message || "Failed to fetch badge.");
      }

      return normalizeBadge(data?.badge || data);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch badge due to server/network error.",
        ),
      );
    }
  },
);

export const createBadge = createAsyncThunk(
  "badge/createBadge",
  async (
    {
      badgeKey,
      label,
      description,
      icon,
      level,
      triggerType,
      triggerValue,
      kpiKey,
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(API_URLS.badges, {
        badge_key: badgeKey,
        label,
        description,
        icon,
        level,
        trigger_type: triggerType,
        trigger_value: triggerValue,
        kpi_key: kpiKey || null,
      });

      const payload = response?.data || {};
      const created = payload?.data?.badge || payload?.data || payload || null;

      if (!created || (payload?.success === false)) {
        return rejectWithValue(payload?.message || "Badge creation failed.");
      }

      return {
        item: normalizeBadge(created),
        message: payload?.message || "Badge created successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Badge creation failed due to server/network error.",
        ),
      );
    }
  },
);

export const updateBadge = createAsyncThunk(
  "badge/updateBadge",
  async (
    {
      badgeId,
      label,
      description,
      icon,
      level,
      triggerType,
      triggerValue,
      kpiKey,
      clearKpiKey,
      isActive,
    },
    { rejectWithValue },
  ) => {
    try {
      const body = {};
      if (label !== undefined) body.label = label;
      if (description !== undefined) body.description = description;
      if (icon !== undefined) body.icon = icon;
      if (level !== undefined) body.level = level;
      if (triggerType !== undefined) body.trigger_type = triggerType;
      if (triggerValue !== undefined) body.trigger_value = triggerValue;
      if (clearKpiKey) {
        body.clear_kpi_key = true;
      } else if (kpiKey !== undefined && kpiKey !== "") {
        body.kpi_key = kpiKey;
      }
      if (isActive !== undefined) body.is_active = isActive;

      const response = await api.put(API_URLS.badgeById(badgeId), body);
      const payload = response?.data || {};
      const updated = payload?.data?.badge || payload?.data || payload || null;

      if (!updated || payload?.success === false) {
        return rejectWithValue(payload?.message || "Failed to update badge.");
      }

      return {
        item: normalizeBadge(updated),
        message: payload?.message || "Badge updated successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to update badge due to server/network error.",
        ),
      );
    }
  },
);

export const deleteBadge = createAsyncThunk(
  "badge/deleteBadge",
  async (badgeId, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_URLS.badgeById(badgeId));
      const payload = response?.data || {};
      const deleted = payload?.data?.badge || payload?.data || payload || null;

      if (payload?.success === false) {
        return rejectWithValue(payload?.message || "Failed to delete badge.");
      }

      return {
        badgeId,
        item: deleted ? normalizeBadge(deleted) : null,
        message: payload?.message || "Badge deleted successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to delete badge due to server/network error.",
        ),
      );
    }
  },
);

const replaceBadge = (items, badge) =>
  items.map((item) =>
    (item.badge_id && item.badge_id === badge.badge_id) ||
    item.badge_key === badge.badge_key
      ? { ...item, ...badge }
      : item,
  );

const badgeSlice = createSlice({
  name: "badge",
  initialState,
  reducers: {
    clearBadgeListError(state) {
      state.listError = "";
    },
    clearBadgeCreateState(state) {
      state.createError = "";
      state.createMessage = "";
      state.createLoading = false;
    },
    clearBadgeDetailState(state) {
      state.detailError = "";
      state.selectedBadge = null;
      state.detailLoading = false;
    },
    clearBadgeUpdateState(state) {
      state.updateError = "";
      state.updateMessage = "";
      state.updateLoading = false;
    },
    clearBadgeDeleteState(state) {
      state.deleteError = "";
      state.deleteMessage = "";
      state.deleteLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBadges.pending, (state) => {
        state.listLoading = true;
        state.listError = "";
      })
      .addCase(fetchBadges.fulfilled, (state, action) => {
        state.listLoading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.skip = action.payload.skip;
        state.limit = action.payload.limit;
      })
      .addCase(fetchBadges.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload || "Failed to fetch badges.";
      })
      .addCase(fetchBadgeById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = "";
        state.selectedBadge = null;
      })
      .addCase(fetchBadgeById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedBadge = action.payload;
      })
      .addCase(fetchBadgeById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload || "Failed to fetch badge.";
      })
      .addCase(createBadge.pending, (state) => {
        state.createLoading = true;
        state.createError = "";
        state.createMessage = "";
      })
      .addCase(createBadge.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createMessage = action.payload.message;
        state.items = [action.payload.item, ...state.items];
        state.selectedBadge = action.payload.item;
      })
      .addCase(createBadge.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || "Badge creation failed.";
      })
      .addCase(updateBadge.pending, (state) => {
        state.updateLoading = true;
        state.updateError = "";
        state.updateMessage = "";
      })
      .addCase(updateBadge.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateMessage = action.payload.message;
        state.items = replaceBadge(state.items, action.payload.item);

        if (
          state.selectedBadge &&
          (state.selectedBadge.badge_id === action.payload.item.badge_id ||
            state.selectedBadge.badge_key === action.payload.item.badge_key)
        ) {
          state.selectedBadge = {
            ...state.selectedBadge,
            ...action.payload.item,
          };
        }
      })
      .addCase(updateBadge.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || "Failed to update badge.";
      })
      .addCase(deleteBadge.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = "";
        state.deleteMessage = "";
      })
      .addCase(deleteBadge.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteMessage = action.payload.message;

        if (action.payload.item) {
          state.items = replaceBadge(state.items, action.payload.item);

          if (
            state.selectedBadge &&
            (state.selectedBadge.badge_id === action.payload.item.badge_id ||
              state.selectedBadge.badge_key === action.payload.item.badge_key)
          ) {
            state.selectedBadge = {
              ...state.selectedBadge,
              ...action.payload.item,
            };
          }
        }
      })
      .addCase(deleteBadge.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || "Failed to delete badge.";
      });
  },
});

export const {
  clearBadgeListError,
  clearBadgeCreateState,
  clearBadgeDetailState,
  clearBadgeUpdateState,
  clearBadgeDeleteState,
} = badgeSlice.actions;

export default badgeSlice.reducer;
