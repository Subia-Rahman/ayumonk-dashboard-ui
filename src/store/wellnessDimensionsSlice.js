import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";

const initialState = {
  // Module 1 — dimensions list
  dimensions: [],
  dimensionsLoading: false,
  dimensionsError: "",

  dimensionCreateLoading: false,
  dimensionCreateError: "",
  dimensionCreateMessage: "",

  dimensionUpdateLoading: false,
  dimensionUpdateError: "",
  dimensionUpdateMessage: "",

  dimensionDeleteLoading: false,
  dimensionDeleteError: "",
  dimensionDeleteMessage: "",

  // Module 2 — mappings keyed by dimension_id
  mappingsByDimension: {},
  mappingsLoading: false,
  mappingsError: "",

  mappingCreateLoading: false,
  mappingCreateError: "",
  mappingCreateMessage: "",

  mappingUpdateLoading: false,
  mappingUpdateError: "",
  mappingUpdateMessage: "",

  mappingDeleteLoading: false,
  mappingDeleteError: "",
  mappingDeleteMessage: "",
};

const normalizeDimension = (item) => ({
  id: item?.id || "",
  company_id: item?.company_id || "",
  dimension_key: item?.dimension_key || "",
  dimension_label: item?.dimension_label || item?.dimension_key || "",
  display_order:
    item?.display_order == null ? 0 : Number(item.display_order),
  is_active: item?.is_active == null ? true : Boolean(item.is_active),
  kpi_count: Number(item?.kpi_count ?? 0),
  created_by: item?.created_by ?? null,
  created_at: item?.created_at || "",
  updated_at: item?.updated_at || "",
});

const normalizeMapping = (item) => ({
  id: item?.id || item?.mapping_id || "",
  dimension_id: item?.dimension_id || "",
  kpi_key: item?.kpi_key || "",
  // Joined from KPI catalog by the GET endpoint:
  display_name: item?.display_name || item?.kpi_name || "",
  wi_weight: item?.wi_weight == null ? null : Number(item.wi_weight),
  weight: Number(item?.weight ?? 0),
  display_order:
    item?.display_order == null ? 0 : Number(item.display_order),
  is_active: item?.is_active == null ? true : Boolean(item.is_active),
  created_at: item?.created_at || "",
  updated_at: item?.updated_at || "",
});

// Common envelope-unwrapping logic — accept raw arrays, {data:[...]},
// {data:{items:[...]}}, or {items:[...]}.
const extractArray = (payload) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.items)
    ? payload.data.items
    : Array.isArray(payload?.items)
    ? payload.items
    : [];

const rejectIfFailed = (payload, fallback) => {
  if (payload && payload.success === false) {
    return payload?.error?.message || payload?.message || fallback;
  }
  return null;
};

// ---------- Module 1 — dimensions ----------

export const fetchDimensions = createAsyncThunk(
  "wellnessDimensions/fetchDimensions",
  async ({ companyId } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.dimensions, {
        params: companyId ? { company_id: companyId } : {},
      });
      const payload = response?.data;
      const failure = rejectIfFailed(payload, "Failed to fetch dimensions.");
      if (failure) return rejectWithValue(failure);
      return extractArray(payload).map(normalizeDimension);
    } catch (error) {
      console.error("fetchDimensions failed:", error?.response || error);
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch dimensions."),
      );
    }
  },
);

export const createDimension = createAsyncThunk(
  "wellnessDimensions/createDimension",
  async (
    { companyId, dimension_key, dimension_label, display_order, is_active },
    { rejectWithValue },
  ) => {
    try {
      // company_id is a QUERY param (spec), not a body field — required for
      // platform admins, ignored for company-tier callers.
      const response = await api.post(
        API_URLS.dimensions,
        {
          dimension_key,
          dimension_label,
          ...(display_order != null ? { display_order } : {}),
          ...(is_active != null ? { is_active } : {}),
        },
        { params: companyId ? { company_id: companyId } : {} },
      );
      const payload = response?.data;
      const failure = rejectIfFailed(payload, "Failed to create dimension.");
      if (failure) return rejectWithValue(failure);
      return {
        item: normalizeDimension(payload?.data || payload || {}),
        message: payload?.message || "Dimension created successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create dimension."),
      );
    }
  },
);

export const updateDimension = createAsyncThunk(
  "wellnessDimensions/updateDimension",
  async ({ id, companyId, fields }, { rejectWithValue }) => {
    try {
      // Same shape as POST — company_id rides in the query string.
      const response = await api.patch(
        API_URLS.dimensionById(id),
        fields || {},
        { params: companyId ? { company_id: companyId } : {} },
      );
      const payload = response?.data;
      const failure = rejectIfFailed(payload, "Failed to update dimension.");
      if (failure) return rejectWithValue(failure);
      return {
        id,
        item: normalizeDimension(payload?.data || payload || {}),
        message: payload?.message || "Dimension updated.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update dimension."),
      );
    }
  },
);

export const deleteDimension = createAsyncThunk(
  "wellnessDimensions/deleteDimension",
  async ({ id, companyId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_URLS.dimensionById(id), {
        params: companyId ? { company_id: companyId } : {},
      });
      const payload = response?.data;
      const failure = rejectIfFailed(payload, "Failed to delete dimension.");
      if (failure) return rejectWithValue(failure);
      return { id, message: payload?.message || "Dimension deleted." };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to delete dimension."),
      );
    }
  },
);

// ---------- Module 2 — dimension KPI mappings ----------

export const fetchDimensionMappings = createAsyncThunk(
  "wellnessDimensions/fetchMappings",
  async ({ dimensionId, companyId }, { rejectWithValue }) => {
    if (!dimensionId) return { dimensionId, rows: [] };
    try {
      const response = await api.get(API_URLS.dimensionMappings(dimensionId), {
        params: companyId ? { company_id: companyId } : {},
      });
      const payload = response?.data;
      const failure = rejectIfFailed(payload, "Failed to fetch mappings.");
      if (failure) return rejectWithValue(failure);
      return {
        dimensionId,
        rows: extractArray(payload).map(normalizeMapping),
      };
    } catch (error) {
      console.error("fetchDimensionMappings failed:", error?.response || error);
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch mappings."),
      );
    }
  },
);

export const createDimensionMapping = createAsyncThunk(
  "wellnessDimensions/createMapping",
  async (
    { dimensionId, companyId, kpi_key, weight, display_order },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        API_URLS.dimensionMappings(dimensionId),
        {
          kpi_key,
          weight: Number(weight),
          ...(display_order != null ? { display_order } : {}),
        },
        { params: companyId ? { company_id: companyId } : {} },
      );
      const payload = response?.data;
      const failure = rejectIfFailed(payload, "Failed to add KPI mapping.");
      if (failure) return rejectWithValue(failure);
      return {
        dimensionId,
        item: normalizeMapping(payload?.data || payload || {}),
        message: payload?.message || "KPI mapping added.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to add KPI mapping."),
      );
    }
  },
);

export const updateDimensionMapping = createAsyncThunk(
  "wellnessDimensions/updateMapping",
  async (
    { dimensionId, mappingId, companyId, fields },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(
        API_URLS.dimensionMappingById(dimensionId, mappingId),
        fields || {},
        { params: companyId ? { company_id: companyId } : {} },
      );
      const payload = response?.data;
      const failure = rejectIfFailed(payload, "Failed to update KPI mapping.");
      if (failure) return rejectWithValue(failure);
      return {
        dimensionId,
        mappingId,
        item: payload?.data ? normalizeMapping(payload.data) : null,
        message: payload?.message || "KPI mapping updated.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update KPI mapping."),
      );
    }
  },
);

export const deleteDimensionMapping = createAsyncThunk(
  "wellnessDimensions/deleteMapping",
  async ({ dimensionId, mappingId, companyId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        API_URLS.dimensionMappingById(dimensionId, mappingId),
        { params: companyId ? { company_id: companyId } : {} },
      );
      const payload = response?.data;
      const failure = rejectIfFailed(payload, "Failed to delete KPI mapping.");
      if (failure) return rejectWithValue(failure);
      return {
        dimensionId,
        mappingId,
        message: payload?.message || "KPI mapping deleted.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to delete KPI mapping."),
      );
    }
  },
);

// ---------- slice ----------

const slice = createSlice({
  name: "wellnessDimensions",
  initialState,
  reducers: {
    clearDimensionCreateState(state) {
      state.dimensionCreateError = "";
      state.dimensionCreateMessage = "";
      state.dimensionCreateLoading = false;
    },
    clearDimensionUpdateState(state) {
      state.dimensionUpdateError = "";
      state.dimensionUpdateMessage = "";
      state.dimensionUpdateLoading = false;
    },
    clearDimensionDeleteState(state) {
      state.dimensionDeleteError = "";
      state.dimensionDeleteMessage = "";
      state.dimensionDeleteLoading = false;
    },
    clearMappingMutationState(state) {
      state.mappingCreateError = "";
      state.mappingCreateMessage = "";
      state.mappingCreateLoading = false;
      state.mappingUpdateError = "";
      state.mappingUpdateMessage = "";
      state.mappingUpdateLoading = false;
      state.mappingDeleteError = "";
      state.mappingDeleteMessage = "";
      state.mappingDeleteLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDimensions
      .addCase(fetchDimensions.pending, (state) => {
        state.dimensionsLoading = true;
        state.dimensionsError = "";
      })
      .addCase(fetchDimensions.fulfilled, (state, action) => {
        state.dimensionsLoading = false;
        state.dimensions = action.payload || [];
      })
      .addCase(fetchDimensions.rejected, (state, action) => {
        state.dimensionsLoading = false;
        state.dimensionsError =
          action.payload || "Failed to fetch dimensions.";
      })
      // createDimension
      .addCase(createDimension.pending, (state) => {
        state.dimensionCreateLoading = true;
        state.dimensionCreateError = "";
        state.dimensionCreateMessage = "";
      })
      .addCase(createDimension.fulfilled, (state, action) => {
        state.dimensionCreateLoading = false;
        state.dimensionCreateMessage = action.payload?.message || "";
        const item = action.payload?.item;
        if (item?.id && !state.dimensions.some((d) => d.id === item.id)) {
          state.dimensions.push(item);
        }
      })
      .addCase(createDimension.rejected, (state, action) => {
        state.dimensionCreateLoading = false;
        state.dimensionCreateError =
          action.payload || "Failed to create dimension.";
      })
      // updateDimension
      .addCase(updateDimension.pending, (state) => {
        state.dimensionUpdateLoading = true;
        state.dimensionUpdateError = "";
        state.dimensionUpdateMessage = "";
      })
      .addCase(updateDimension.fulfilled, (state, action) => {
        state.dimensionUpdateLoading = false;
        state.dimensionUpdateMessage = action.payload?.message || "";
        const { id, item } = action.payload || {};
        if (id && item) {
          const idx = state.dimensions.findIndex((d) => d.id === id);
          if (idx >= 0) {
            state.dimensions[idx] = { ...state.dimensions[idx], ...item };
          }
        }
      })
      .addCase(updateDimension.rejected, (state, action) => {
        state.dimensionUpdateLoading = false;
        state.dimensionUpdateError =
          action.payload || "Failed to update dimension.";
      })
      // deleteDimension
      .addCase(deleteDimension.pending, (state) => {
        state.dimensionDeleteLoading = true;
        state.dimensionDeleteError = "";
        state.dimensionDeleteMessage = "";
      })
      .addCase(deleteDimension.fulfilled, (state, action) => {
        state.dimensionDeleteLoading = false;
        state.dimensionDeleteMessage = action.payload?.message || "";
        const { id } = action.payload || {};
        state.dimensions = state.dimensions.filter((d) => d.id !== id);
        if (id) delete state.mappingsByDimension[id];
      })
      .addCase(deleteDimension.rejected, (state, action) => {
        state.dimensionDeleteLoading = false;
        state.dimensionDeleteError =
          action.payload || "Failed to delete dimension.";
      })
      // fetchDimensionMappings
      .addCase(fetchDimensionMappings.pending, (state) => {
        state.mappingsLoading = true;
        state.mappingsError = "";
      })
      .addCase(fetchDimensionMappings.fulfilled, (state, action) => {
        state.mappingsLoading = false;
        const { dimensionId, rows } = action.payload || {};
        if (dimensionId) state.mappingsByDimension[dimensionId] = rows;
      })
      .addCase(fetchDimensionMappings.rejected, (state, action) => {
        state.mappingsLoading = false;
        state.mappingsError = action.payload || "Failed to fetch mappings.";
      })
      // createDimensionMapping
      .addCase(createDimensionMapping.pending, (state) => {
        state.mappingCreateLoading = true;
        state.mappingCreateError = "";
        state.mappingCreateMessage = "";
      })
      .addCase(createDimensionMapping.fulfilled, (state, action) => {
        state.mappingCreateLoading = false;
        state.mappingCreateMessage = action.payload?.message || "";
        const { dimensionId, item } = action.payload || {};
        if (dimensionId && item?.id) {
          const existing = state.mappingsByDimension[dimensionId] || [];
          if (!existing.some((r) => r.id === item.id)) {
            state.mappingsByDimension[dimensionId] = [...existing, item];
          }
          // Bump kpi_count locally so the dimensions table refreshes without a
          // round-trip.
          const dim = state.dimensions.find((d) => d.id === dimensionId);
          if (dim) dim.kpi_count = (dim.kpi_count || 0) + 1;
        }
      })
      .addCase(createDimensionMapping.rejected, (state, action) => {
        state.mappingCreateLoading = false;
        state.mappingCreateError =
          action.payload || "Failed to add KPI mapping.";
      })
      // updateDimensionMapping
      .addCase(updateDimensionMapping.pending, (state) => {
        state.mappingUpdateLoading = true;
        state.mappingUpdateError = "";
        state.mappingUpdateMessage = "";
      })
      .addCase(updateDimensionMapping.fulfilled, (state, action) => {
        state.mappingUpdateLoading = false;
        state.mappingUpdateMessage = action.payload?.message || "";
        const { dimensionId, mappingId, item } = action.payload || {};
        const list = state.mappingsByDimension[dimensionId];
        if (list && mappingId) {
          state.mappingsByDimension[dimensionId] = list.map((r) =>
            r.id === mappingId ? { ...r, ...(item || {}) } : r,
          );
        }
      })
      .addCase(updateDimensionMapping.rejected, (state, action) => {
        state.mappingUpdateLoading = false;
        state.mappingUpdateError =
          action.payload || "Failed to update KPI mapping.";
      })
      // deleteDimensionMapping
      .addCase(deleteDimensionMapping.pending, (state) => {
        state.mappingDeleteLoading = true;
        state.mappingDeleteError = "";
        state.mappingDeleteMessage = "";
      })
      .addCase(deleteDimensionMapping.fulfilled, (state, action) => {
        state.mappingDeleteLoading = false;
        state.mappingDeleteMessage = action.payload?.message || "";
        const { dimensionId, mappingId } = action.payload || {};
        const list = state.mappingsByDimension[dimensionId];
        if (list) {
          state.mappingsByDimension[dimensionId] = list.filter(
            (r) => r.id !== mappingId,
          );
        }
        // Decrement kpi_count for the affected dimension.
        const dim = state.dimensions.find((d) => d.id === dimensionId);
        if (dim && dim.kpi_count > 0) dim.kpi_count -= 1;
      })
      .addCase(deleteDimensionMapping.rejected, (state, action) => {
        state.mappingDeleteLoading = false;
        state.mappingDeleteError =
          action.payload || "Failed to delete KPI mapping.";
      });
  },
});

export const {
  clearDimensionCreateState,
  clearDimensionUpdateState,
  clearDimensionDeleteState,
  clearMappingMutationState,
} = slice.actions;

export default slice.reducer;
