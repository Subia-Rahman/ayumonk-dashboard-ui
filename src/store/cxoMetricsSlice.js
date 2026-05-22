import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";

const cacheKey = (companyId, metricCode) =>
  `${companyId || ""}::${metricCode || ""}`;

const initialState = {
  metricsMaster: [],
  metricsMasterLoading: false,
  metricsMasterError: "",

  mappingsByKey: {},
  mappingLoading: false,
  mappingError: "",
  mappingErrorStatus: null,

  optionsByCompany: {},
  optionsLoading: false,
  optionsError: "",

  saveLoading: false,
  saveError: "",
  saveMessage: "",

  resetLoading: false,
  resetError: "",
  resetMessage: "",

  // Create-metric (POST /admin/cxo-metrics) — drives the "Create metric"
  // dialog on the config page. createdId is set on success so the UI can
  // auto-switch to the new tab after the dialog closes.
  createLoading: false,
  createError: "",
  createMessage: "",
  createdMetricCode: "",

  // Per-(company, metric) definition fetched from
  // GET /admin/cxo-metrics/{metric_code}?company_id={uuid}. This may
  // shadow the platform-master values (display_name, baseline, ...) with
  // company-scoped overrides applied via the PUT endpoint.
  metricByKey: {},
  metricDetailLoading: false,
  metricDetailError: "",

  updateLoading: false,
  updateError: "",
  updateMessage: "",

  deleteLoading: false,
  deleteError: "",
  deleteMessage: "",
};

const normalizeMetric = (item) => ({
  id: item?.id || "",
  metric_code: item?.metric_code || "",
  display_name: item?.display_name || item?.metric_code || "",
  unit: item?.unit || "",
  formula_type: item?.formula_type || "",
  baseline: item?.baseline ?? null,
  methodology_ref: item?.methodology_ref || "",
});

const normalizeKpiMapping = (item) => ({
  kpi_key: item?.kpi_key || "",
  kpi_name: item?.kpi_name || "",
  weight: Number(item?.weight ?? 0),
  threshold: item?.threshold == null ? null : Number(item.threshold),
});

const normalizeSignalMapping = (item) => ({
  signal_code: item?.signal_code || "",
  signal_name: item?.signal_name || item?.display_name || "",
  weight: Number(item?.weight ?? 0),
});

const normalizeMappingResponse = (data) => ({
  metric: data?.metric ? normalizeMetric(data.metric) : null,
  kpi_mappings: Array.isArray(data?.kpi_mappings)
    ? data.kpi_mappings.map(normalizeKpiMapping)
    : [],
  signal_mappings: Array.isArray(data?.signal_mappings)
    ? data.signal_mappings.map(normalizeSignalMapping)
    : [],
  validation: data?.validation || null,
});

const normalizeOptions = (data) => ({
  kpis: Array.isArray(data?.kpis)
    ? data.kpis.map((kpi) => ({
        kpi_key: kpi?.kpi_key || "",
        display_name: kpi?.display_name || kpi?.kpi_name || kpi?.kpi_key || "",
      }))
    : [],
  signals: Array.isArray(data?.signals)
    ? data.signals.map((signal) => ({
        signal_code: signal?.signal_code || "",
        display_name:
          signal?.display_name || signal?.signal_name || signal?.signal_code || "",
      }))
    : [],
});

export const fetchCxoMetricsMaster = createAsyncThunk(
  "cxoMetrics/fetchMaster",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.cxoMetricsMaster);
      const payload = response?.data || {};
      if (!payload?.success) {
        return rejectWithValue(payload?.message || "Failed to fetch CXO metrics.");
      }
      const items = Array.isArray(payload?.data) ? payload.data : [];
      return items.map(normalizeMetric);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch CXO metrics."),
      );
    }
  },
);

export const fetchCxoMapping = createAsyncThunk(
  "cxoMetrics/fetchMapping",
  async ({ metricCode, companyId }, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.cxoMetricMapping(metricCode), {
        params: { company_id: companyId },
      });
      const payload = response?.data || {};
      if (!payload?.success) {
        return rejectWithValue(
          payload?.message || "Failed to fetch mapping.",
        );
      }
      return {
        key: cacheKey(companyId, metricCode),
        data: normalizeMappingResponse(payload?.data || {}),
      };
    } catch (error) {
      const status = error?.response?.status;
      return rejectWithValue({
        message: getApiErrorMessage(error, "Failed to fetch mapping."),
        status,
      });
    }
  },
);

export const fetchCxoOptions = createAsyncThunk(
  "cxoMetrics/fetchOptions",
  async ({ companyId }, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.cxoMetricsOptions, {
        params: { company_id: companyId },
      });
      const payload = response?.data || {};
      if (!payload?.success) {
        return rejectWithValue(
          payload?.message || "Failed to fetch options.",
        );
      }
      return {
        companyId,
        data: normalizeOptions(payload?.data || {}),
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch options."),
      );
    }
  },
);

export const saveCxoMapping = createAsyncThunk(
  "cxoMetrics/saveMapping",
  async (
    { metricCode, companyId, kpi_mappings, signal_mappings },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(API_URLS.cxoMetricMapping(metricCode), {
        company_id: companyId,
        kpi_mappings: kpi_mappings || [],
        signal_mappings: signal_mappings || [],
      });
      const payload = response?.data || {};
      if (!payload?.success) {
        return rejectWithValue(
          payload?.error?.message || payload?.message || "Failed to save mapping.",
        );
      }
      return {
        key: cacheKey(companyId, metricCode),
        data: normalizeMappingResponse(payload?.data || {}),
        message: payload?.message || "Mapping saved successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to save mapping."),
      );
    }
  },
);

export const createCxoMetric = createAsyncThunk(
  "cxoMetrics/createMetric",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URLS.cxoMetricsMaster, payload);
      const body = response?.data || {};
      if (!body?.success) {
        return rejectWithValue(
          body?.error?.message ||
            body?.message ||
            "Failed to create metric.",
        );
      }
      return {
        message: body?.message || "Metric created successfully.",
        metric: normalizeMetric(body?.data || {}),
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create metric."),
      );
    }
  },
);

export const fetchCxoMetric = createAsyncThunk(
  "cxoMetrics/fetchMetric",
  async ({ metricCode, companyId }, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.cxoMetricByCode(metricCode), {
        params: { company_id: companyId },
      });
      const payload = response?.data || {};
      if (!payload?.success) {
        return rejectWithValue(
          payload?.message || "Failed to fetch metric.",
        );
      }
      return {
        key: cacheKey(companyId, metricCode),
        data: normalizeMetric(payload?.data || {}),
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch metric."),
      );
    }
  },
);

// Partial update — only the keys present in `fields` are sent. The backend
// applies just those keys; absent keys keep their current value. company_id
// is mandatory because the override is scoped to a tenant.
export const updateCxoMetric = createAsyncThunk(
  "cxoMetrics/updateMetric",
  async ({ metricCode, companyId, fields }, { rejectWithValue }) => {
    try {
      const body = { company_id: companyId, ...(fields || {}) };
      const response = await api.put(API_URLS.cxoMetricByCode(metricCode), body);
      const payload = response?.data || {};
      if (!payload?.success) {
        return rejectWithValue(
          payload?.error?.message || payload?.message || "Failed to update metric.",
        );
      }
      return {
        key: cacheKey(companyId, metricCode),
        metricCode,
        data: payload?.data ? normalizeMetric(payload.data) : null,
        message: payload?.message || "Metric updated successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update metric."),
      );
    }
  },
);

export const deleteCxoMetric = createAsyncThunk(
  "cxoMetrics/deleteMetric",
  async ({ metricCode, companyId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_URLS.cxoMetricByCode(metricCode), {
        params: { company_id: companyId },
      });
      const payload = response?.data || {};
      // DELETE responses often have no body — treat empty as success.
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message || payload?.message || "Failed to delete metric.",
        );
      }
      return {
        key: cacheKey(companyId, metricCode),
        metricCode,
        message: payload?.message || "Metric deleted successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to delete metric."),
      );
    }
  },
);

export const resetCxoMapping = createAsyncThunk(
  "cxoMetrics/resetMapping",
  async ({ metricCode, companyId }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URLS.cxoMetricReset(metricCode), {
        company_id: companyId,
      });
      const payload = response?.data || {};
      if (!payload?.success) {
        return rejectWithValue(
          payload?.error?.message || payload?.message || "Failed to reset mapping.",
        );
      }
      return {
        key: cacheKey(companyId, metricCode),
        data: payload?.data ? normalizeMappingResponse(payload.data) : null,
        message: payload?.message || "Mapping reset to platform defaults.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to reset mapping."),
      );
    }
  },
);

const cxoMetricsSlice = createSlice({
  name: "cxoMetrics",
  initialState,
  reducers: {
    clearCxoMappingError(state) {
      state.mappingError = "";
    },
    clearCxoSaveState(state) {
      state.saveError = "";
      state.saveMessage = "";
      state.saveLoading = false;
    },
    clearCxoResetState(state) {
      state.resetError = "";
      state.resetMessage = "";
      state.resetLoading = false;
    },
    clearCxoCreateState(state) {
      state.createError = "";
      state.createMessage = "";
      state.createLoading = false;
      state.createdMetricCode = "";
    },
    clearCxoUpdateState(state) {
      state.updateError = "";
      state.updateMessage = "";
      state.updateLoading = false;
    },
    clearCxoDeleteState(state) {
      state.deleteError = "";
      state.deleteMessage = "";
      state.deleteLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCxoMetricsMaster.pending, (state) => {
        state.metricsMasterLoading = true;
        state.metricsMasterError = "";
      })
      .addCase(fetchCxoMetricsMaster.fulfilled, (state, action) => {
        state.metricsMasterLoading = false;
        state.metricsMaster = action.payload || [];
      })
      .addCase(fetchCxoMetricsMaster.rejected, (state, action) => {
        state.metricsMasterLoading = false;
        state.metricsMasterError =
          action.payload || "Failed to fetch CXO metrics.";
      })
      .addCase(fetchCxoMapping.pending, (state) => {
        state.mappingLoading = true;
        state.mappingError = "";
        state.mappingErrorStatus = null;
      })
      .addCase(fetchCxoMapping.fulfilled, (state, action) => {
        state.mappingLoading = false;
        const { key, data } = action.payload;
        state.mappingsByKey[key] = data;
      })
      .addCase(fetchCxoMapping.rejected, (state, action) => {
        state.mappingLoading = false;
        const payload = action.payload || {};
        state.mappingError =
          payload?.message || payload || "Failed to fetch mapping.";
        state.mappingErrorStatus = payload?.status;
      })
      .addCase(fetchCxoOptions.pending, (state) => {
        state.optionsLoading = true;
        state.optionsError = "";
      })
      .addCase(fetchCxoOptions.fulfilled, (state, action) => {
        state.optionsLoading = false;
        const { companyId, data } = action.payload;
        state.optionsByCompany[companyId] = data;
      })
      .addCase(fetchCxoOptions.rejected, (state, action) => {
        state.optionsLoading = false;
        state.optionsError = action.payload || "Failed to fetch options.";
      })
      .addCase(saveCxoMapping.pending, (state) => {
        state.saveLoading = true;
        state.saveError = "";
        state.saveMessage = "";
      })
      .addCase(saveCxoMapping.fulfilled, (state, action) => {
        state.saveLoading = false;
        const { key, data, message } = action.payload;
        if (data) state.mappingsByKey[key] = data;
        state.saveMessage = message;
      })
      .addCase(saveCxoMapping.rejected, (state, action) => {
        state.saveLoading = false;
        state.saveError = action.payload || "Failed to save mapping.";
      })
      .addCase(resetCxoMapping.pending, (state) => {
        state.resetLoading = true;
        state.resetError = "";
        state.resetMessage = "";
      })
      .addCase(resetCxoMapping.fulfilled, (state, action) => {
        state.resetLoading = false;
        const { key, data, message } = action.payload;
        if (data) state.mappingsByKey[key] = data;
        state.resetMessage = message;
      })
      .addCase(resetCxoMapping.rejected, (state, action) => {
        state.resetLoading = false;
        state.resetError = action.payload || "Failed to reset mapping.";
      })
      .addCase(createCxoMetric.pending, (state) => {
        state.createLoading = true;
        state.createError = "";
        state.createMessage = "";
        state.createdMetricCode = "";
      })
      .addCase(createCxoMetric.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createMessage = action.payload?.message || "";
        const metric = action.payload?.metric;
        if (metric?.metric_code) {
          state.createdMetricCode = metric.metric_code;
          // Splice the new metric into the master list so the tabs update
          // immediately — no extra round-trip needed.
          const exists = state.metricsMaster.some(
            (m) => m.metric_code === metric.metric_code,
          );
          if (!exists) state.metricsMaster.push(metric);
        }
      })
      .addCase(createCxoMetric.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || "Failed to create metric.";
      })
      .addCase(fetchCxoMetric.pending, (state) => {
        state.metricDetailLoading = true;
        state.metricDetailError = "";
      })
      .addCase(fetchCxoMetric.fulfilled, (state, action) => {
        state.metricDetailLoading = false;
        const { key, data } = action.payload;
        state.metricByKey[key] = data;
      })
      .addCase(fetchCxoMetric.rejected, (state, action) => {
        state.metricDetailLoading = false;
        state.metricDetailError = action.payload || "Failed to fetch metric.";
      })
      .addCase(updateCxoMetric.pending, (state) => {
        state.updateLoading = true;
        state.updateError = "";
        state.updateMessage = "";
      })
      .addCase(updateCxoMetric.fulfilled, (state, action) => {
        state.updateLoading = false;
        const { key, metricCode, data, message } = action.payload;
        state.updateMessage = message;
        if (data) {
          state.metricByKey[key] = data;
          // Reflect display_name / baseline updates in the master list so
          // tabs and headers stay in sync without a refetch.
          const idx = state.metricsMaster.findIndex(
            (m) => m.metric_code === metricCode,
          );
          if (idx >= 0) {
            state.metricsMaster[idx] = { ...state.metricsMaster[idx], ...data };
          }
        }
      })
      .addCase(updateCxoMetric.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || "Failed to update metric.";
      })
      .addCase(deleteCxoMetric.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = "";
        state.deleteMessage = "";
      })
      .addCase(deleteCxoMetric.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const { key, metricCode, message } = action.payload;
        state.deleteMessage = message;
        delete state.metricByKey[key];
        delete state.mappingsByKey[key];
        state.metricsMaster = state.metricsMaster.filter(
          (m) => m.metric_code !== metricCode,
        );
      })
      .addCase(deleteCxoMetric.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || "Failed to delete metric.";
      });
  },
});

export const {
  clearCxoMappingError,
  clearCxoSaveState,
  clearCxoResetState,
  clearCxoCreateState,
  clearCxoUpdateState,
  clearCxoDeleteState,
} = cxoMetricsSlice.actions;

export default cxoMetricsSlice.reducer;
