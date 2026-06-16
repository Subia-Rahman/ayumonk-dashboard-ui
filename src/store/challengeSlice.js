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
  mappingLoading: false,
  selectedChallenge: null,
  listError: "",
  createError: "",
  detailError: "",
  updateError: "",
  deleteError: "",
  mappingError: "",
  createMessage: "",
  updateMessage: "",
  deleteMessage: "",
  mappingMessage: "",
};

const normalizeChallenge = (item, index = 0) => ({
  id: String(item?.challenge_key || index),
  challenge_key: String(item?.challenge_key || index),
  company_id: String(item?.company_id || ""),
  name: item?.name || "Untitled Challenge",
  challenge_type: item?.challenge_type || "",
  description: item?.description || "",
  target_value: Number(item?.target_value) || 0,
  xp_reward: Number(item?.xp_reward) || 0,
  icon: item?.icon || "",
  is_daily: Boolean(item?.is_daily),
  is_active: Boolean(item?.is_active),
  options: Array.isArray(item?.options) ? item.options.map(String) : [],
  start_date: item?.start_date || "",
  end_date: item?.end_date || "",
  created_at: item?.created_at || "",
  updated_at: item?.updated_at || "",
});

const normalizeKpiMapping = (item, index = 0) => ({
  id: String(item?.id || `${item?.kpi_key || "mapping"}-${index}`),
  kpi_key: String(item?.kpi_key || ""),
  start_date: item?.start_date || "",
  end_date: item?.end_date || "",
  created_at: item?.created_at || "",
  updated_at: item?.updated_at || "",
});

const normalizeChallengeDetail = (payload) => ({
  ...normalizeChallenge(payload?.challenge),
  kpi_mappings: Array.isArray(payload?.kpi_mappings)
    ? payload.kpi_mappings.map(normalizeKpiMapping)
    : [],
});

export const fetchChallenges = createAsyncThunk(
  "challenge/fetchChallenges",
  async (
    { skip = 0, limit = 50, isActive = true, kpiKey, startDate, endDate, companyId } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get(API_URLS.challenges, {
        params: {
          skip,
          limit,
          ...(typeof isActive === "boolean" ? { is_active: isActive } : {}),
          ...(kpiKey ? { kpi_key: kpiKey } : {}),
          ...(startDate ? { start_date: startDate } : {}),
          ...(endDate ? { end_date: endDate } : {}),
          ...(companyId ? { company_id: companyId } : {}),
        },
      });

      const payload = response?.data || {};
      if (!payload?.success) {
        return rejectWithValue(
          payload?.message || "Failed to fetch challenges.",
        );
      }

      const data = payload?.data || {};
      const items = Array.isArray(data?.items) ? data.items : [];

      return {
        items: items.map(normalizeChallenge),
        total: Number(data?.total) || items.length,
        skip: Number(data?.skip) || skip,
        limit: Number(data?.limit) || limit,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch challenges due to server/network error.",
        ),
      );
    }
  },
);

export const createChallenge = createAsyncThunk(
  "challenge/createChallenge",
  async (
    {
      name,
      challengeType,
      description,
      targetValue,
      xpReward,
      icon,
      isDaily,
      options,
      kpiMappings,
      companyId,
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(API_URLS.challenges, {
        name,
        challenge_type: challengeType,
        description,
        target_value: targetValue,
        xp_reward: xpReward,
        icon,
        is_daily: isDaily,
        ...(Array.isArray(options) ? { options } : {}),
        kpi_mappings: kpiMappings,
        ...(companyId ? { company_id: companyId } : {}),
      });

      const payload = response?.data || {};
      const createdChallenge =
        payload?.data?.challenge ||
        payload?.data ||
        (payload?.name ? payload : null);

      if (!createdChallenge) {
        return rejectWithValue(
          payload?.message || "Challenge creation failed.",
        );
      }

      return {
        item: normalizeChallenge(createdChallenge),
        detail: {
          ...normalizeChallenge(createdChallenge),
          kpi_mappings: Array.isArray(createdChallenge?.kpi_mappings)
            ? createdChallenge.kpi_mappings.map(normalizeKpiMapping)
            : Array.isArray(kpiMappings)
              ? kpiMappings.map(normalizeKpiMapping)
              : [],
        },
        message: payload?.message || "Challenge created successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Challenge creation failed due to server/network error.",
        ),
      );
    }
  },
);

export const fetchChallengeById = createAsyncThunk(
  "challenge/fetchChallengeById",
  async (challengeKey, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.challengeById(challengeKey));
      const payload = response?.data || {};

      if (!payload?.success || !payload?.data?.challenge) {
        return rejectWithValue(
          payload?.message || "Failed to fetch challenge.",
        );
      }

      return normalizeChallengeDetail(payload.data);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch challenge due to server/network error.",
        ),
      );
    }
  },
);

export const updateChallenge = createAsyncThunk(
  "challenge/updateChallenge",
  async (
    {
      challengeKey,
      name,
      challengeType,
      description,
      targetValue,
      xpReward,
      icon,
      isDaily,
      isActive,
      options,
      kpiMappings,
      companyId,
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(API_URLS.challengeById(challengeKey), {
        name,
        challenge_type: challengeType,
        description,
        target_value: targetValue,
        xp_reward: xpReward,
        icon,
        is_daily: isDaily,
        is_active: isActive,
        ...(Array.isArray(options) ? { options } : {}),
        kpi_mappings: kpiMappings,
        ...(companyId ? { company_id: companyId } : {}),
      });

      const payload = response?.data || {};
      if (!payload?.success || !payload?.data) {
        return rejectWithValue(
          payload?.message || "Failed to update challenge.",
        );
      }

      return {
        item: normalizeChallenge(payload.data),
        message: payload?.message || "Challenge updated successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to update challenge due to server/network error.",
        ),
      );
    }
  },
);

export const deleteChallenge = createAsyncThunk(
  "challenge/deleteChallenge",
  async (challengeKey, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_URLS.challengeById(challengeKey));
      const payload = response?.data || {};

      if (!payload?.success || !payload?.data) {
        return rejectWithValue(
          payload?.message || "Failed to delete challenge.",
        );
      }

      return {
        item: normalizeChallenge(payload.data),
        message: payload?.message || "Challenge deleted successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to delete challenge due to server/network error.",
        ),
      );
    }
  },
);

export const addChallengeKpiMapping = createAsyncThunk(
  "challenge/addChallengeKpiMapping",
  async ({ challengeKey, kpiKey, startDate, endDate, companyId }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        API_URLS.challengeKpiMappings(challengeKey),
        {
          kpi_key: kpiKey,
          start_date: startDate,
          end_date: endDate,
          ...(companyId ? { company_id: companyId } : {}),
        },
      );

      const payload = response?.data || {};
      if (!payload?.success || !payload?.data) {
        return rejectWithValue(
          payload?.message || "Failed to add KPI mapping.",
        );
      }

      return {
        item: normalizeKpiMapping(payload.data),
        message: payload?.message || "KPI mapping added successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to add KPI mapping due to server/network error.",
        ),
      );
    }
  },
);

const replaceChallenge = (items, challenge) =>
  items.map((item) =>
    item.challenge_key === challenge.challenge_key ? challenge : item,
  );

const challengeSlice = createSlice({
  name: "challenge",
  initialState,
  reducers: {
    clearChallengeListError(state) {
      state.listError = "";
    },
    clearChallengeCreateState(state) {
      state.createError = "";
      state.createMessage = "";
      state.createLoading = false;
    },
    clearChallengeDetailState(state) {
      state.detailError = "";
      state.selectedChallenge = null;
      state.detailLoading = false;
    },
    clearChallengeUpdateState(state) {
      state.updateError = "";
      state.updateMessage = "";
      state.updateLoading = false;
    },
    clearChallengeDeleteState(state) {
      state.deleteError = "";
      state.deleteMessage = "";
      state.deleteLoading = false;
    },
    clearChallengeMappingState(state) {
      state.mappingError = "";
      state.mappingMessage = "";
      state.mappingLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChallenges.pending, (state) => {
        state.listLoading = true;
        state.listError = "";
      })
      .addCase(fetchChallenges.fulfilled, (state, action) => {
        state.listLoading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.skip = action.payload.skip;
        state.limit = action.payload.limit;
      })
      .addCase(fetchChallenges.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload || "Failed to fetch challenges.";
      })
      .addCase(createChallenge.pending, (state) => {
        state.createLoading = true;
        state.createError = "";
        state.createMessage = "";
      })
      .addCase(createChallenge.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createMessage = action.payload.message;
        state.selectedChallenge = action.payload.detail;
        state.items = [action.payload.item, ...state.items];
      })
      .addCase(createChallenge.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || "Challenge creation failed.";
      })
      .addCase(fetchChallengeById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = "";
        state.selectedChallenge = null;
      })
      .addCase(fetchChallengeById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedChallenge = action.payload;
      })
      .addCase(fetchChallengeById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload || "Failed to fetch challenge.";
      })
      .addCase(updateChallenge.pending, (state) => {
        state.updateLoading = true;
        state.updateError = "";
        state.updateMessage = "";
      })
      .addCase(updateChallenge.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateMessage = action.payload.message;
        state.items = replaceChallenge(state.items, action.payload.item);

        if (
          state.selectedChallenge?.challenge_key ===
          action.payload.item.challenge_key
        ) {
          state.selectedChallenge = {
            ...state.selectedChallenge,
            ...action.payload.item,
          };
        }
      })
      .addCase(updateChallenge.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || "Failed to update challenge.";
      })
      .addCase(deleteChallenge.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = "";
        state.deleteMessage = "";
      })
      .addCase(deleteChallenge.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteMessage = action.payload.message;
        state.items = replaceChallenge(state.items, action.payload.item);

        if (
          state.selectedChallenge?.challenge_key ===
          action.payload.item.challenge_key
        ) {
          state.selectedChallenge = {
            ...state.selectedChallenge,
            ...action.payload.item,
          };
        }
      })
      .addCase(deleteChallenge.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || "Failed to delete challenge.";
      })
      .addCase(addChallengeKpiMapping.pending, (state) => {
        state.mappingLoading = true;
        state.mappingError = "";
        state.mappingMessage = "";
      })
      .addCase(addChallengeKpiMapping.fulfilled, (state, action) => {
        state.mappingLoading = false;
        state.mappingMessage = action.payload.message;

        if (state.selectedChallenge) {
          state.selectedChallenge.kpi_mappings = [
            ...(state.selectedChallenge.kpi_mappings || []),
            action.payload.item,
          ];
        }
      })
      .addCase(addChallengeKpiMapping.rejected, (state, action) => {
        state.mappingLoading = false;
        state.mappingError = action.payload || "Failed to add KPI mapping.";
      });
  },
});

export const {
  clearChallengeListError,
  clearChallengeCreateState,
  clearChallengeDetailState,
  clearChallengeUpdateState,
  clearChallengeDeleteState,
  clearChallengeMappingState,
} = challengeSlice.actions;

export default challengeSlice.reducer;
