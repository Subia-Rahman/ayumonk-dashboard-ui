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

  // POST /admin/cxo-kpi-mapping — separate state from saveLoading so the
  // dialog's button and the page-level Save button don't toggle each other.
  kpiMappingLoading: false,
  kpiMappingError: "",
  kpiMappingMessage: "",

  // GET /admin/cxo-kpi-mapping?company_id&metric_id — per-(company, metric)
  // row list, keyed the same way as mappingsByKey. Stored alongside the older
  // mapping summary so row-level ops (PUT/PATCH/DELETE) can look up mapping_id.
  kpiMappingListByKey: {},
  kpiMappingListLoading: false,
  kpiMappingListError: "",

  // PUT /admin/cxo-kpi-mapping/{id} — weight update
  kpiMappingUpdateLoading: false,
  kpiMappingUpdateError: "",
  kpiMappingUpdateMessage: "",

  // PATCH /admin/cxo-kpi-mapping/{id}/status — is_active toggle
  kpiMappingStatusLoading: false,
  kpiMappingStatusError: "",
  kpiMappingStatusMessage: "",

  // DELETE /admin/cxo-kpi-mapping/{id} — single row soft-delete
  kpiMappingDeleteLoading: false,
  kpiMappingDeleteError: "",
  kpiMappingDeleteMessage: "",

  // DELETE /admin/cxo-kpi-mapping?company_id&metric_id — bulk soft-delete
  kpiMappingBulkDeleteLoading: false,
  kpiMappingBulkDeleteError: "",
  kpiMappingBulkDeleteMessage: "",

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

  // PUT /admin/cxo-metrics/{metric_id} (partial) and DELETE by metric_id.
  // Kept separate from updateLoading / deleteLoading because the legacy
  // company-scoped flows above use those slots and the definition CRUD
  // section is a different surface.
  definitionUpdateLoading: false,
  definitionUpdateError: "",
  definitionUpdateMessage: "",
  definitionDeleteLoading: false,
  definitionDeleteError: "",
  definitionDeleteMessage: "",
  definitionDeleteKpiCount: 0,
};

const normalizeMetric = (item) => ({
  id: item?.id || "",
  metric_code: item?.metric_code || "",
  display_name: item?.display_name || item?.metric_code || "",
  description: item?.description || "",
  unit: item?.unit || "",
  formula_type: item?.formula_type || "",
  baseline: item?.baseline ?? null,
  methodology_ref: item?.methodology_ref || "",
  is_active: item?.is_active == null ? true : Boolean(item.is_active),
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

// Row returned by GET /admin/cxo-kpi-mapping[...]. Wider than
// normalizeKpiMapping because per-row ops need mapping_id and is_active.
const normalizeKpiMappingRow = (item) => ({
  mapping_id: item?.mapping_id || item?.id || "",
  kpi_key: item?.kpi_key || "",
  kpi_name: item?.kpi_name || item?.display_name || "",
  weight: Number(item?.weight ?? 0),
  is_active: item?.is_active == null ? true : Boolean(item.is_active),
  is_deleted: Boolean(item?.is_deleted),
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
  async ({ companyId } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.cxoMetricsMaster, {
        params: companyId ? { company_id: companyId } : {},
      });
      const payload = response?.data;
      // Only reject on an explicit `success: false` envelope. The backend
      // may return a raw array, a {data:[...]}, a {items:[...]}, or a
      // success-wrapped shape — accept all of them.
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to fetch CXO metrics.",
        );
      }
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.items)
        ? payload.items
        : [];
      return items.map(normalizeMetric);
    } catch (error) {
      console.error("fetchCxoMetricsMaster failed:", error?.response || error);
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
      const payload = response?.data;
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to fetch options.",
        );
      }
      // Accept either {data:{kpis,signals}} or a flat {kpis,signals}.
      const source = payload?.data && typeof payload.data === "object"
        ? payload.data
        : payload || {};
      return {
        companyId,
        data: normalizeOptions(source),
      };
    } catch (error) {
      const status = error?.response?.status;
      // 404 means the endpoint isn't deployed on this backend — the new
      // theme-scoped KPI flow (fetchKpis) covers the create dialog, so we
      // treat it as "no options" rather than a fatal page error.
      if (status === 404) {
        return { companyId, data: { kpis: [], signals: [] } };
      }
      console.error("fetchCxoOptions failed:", error?.response || error);
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

export const createCxoKpiMapping = createAsyncThunk(
  "cxoMetrics/createKpiMapping",
  async ({ companyId, metricId, kpi_mappings }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URLS.cxoKpiMapping, {
        company_id: companyId,
        metric_id: metricId,
        kpi_mappings: (kpi_mappings || []).map((row) => ({
          kpi_key: row.kpi_key,
          weight: Number(row.weight) || 0,
        })),
      });
      const payload = response?.data || {};
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to save KPI mapping.",
        );
      }
      return {
        message: payload?.message || "KPI mapping saved successfully.",
        data: payload?.data || null,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to save KPI mapping."),
      );
    }
  },
);

export const fetchCxoKpiMappingList = createAsyncThunk(
  "cxoMetrics/fetchKpiMappingList",
  async (
    { companyId, metricId, includeInactive = false },
    { rejectWithValue },
  ) => {
    if (!companyId || !metricId) {
      // The endpoint marks both query params as required — short-circuit so we
      // don't waste a guaranteed-422 round-trip on initial render.
      return { key: cacheKey(companyId, metricId), rows: [] };
    }
    try {
      const params = {
        company_id: companyId,
        metric_id: metricId,
      };
      // The default on the server is `false`. Omit it on the wire when we
      // want the default so the query string stays minimal.
      if (includeInactive) params.include_inactive = true;
      const response = await api.get(API_URLS.cxoKpiMapping, { params });
      const payload = response?.data;
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to fetch KPI mapping rows.",
        );
      }
      // Accept raw array, {data:[...]}, {data:{items:[...]}}, or {items:[...]}.
      const raw = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.items)
        ? payload.items
        : [];
      return {
        key: cacheKey(companyId, metricId),
        rows: raw.map(normalizeKpiMappingRow),
      };
    } catch (error) {
      console.error(
        "fetchCxoKpiMappingList failed:",
        error?.response || error,
      );
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch KPI mapping rows."),
      );
    }
  },
);

export const fetchCxoKpiMappingById = createAsyncThunk(
  "cxoMetrics/fetchKpiMappingById",
  async ({ mappingId, companyId }, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.cxoKpiMappingById(mappingId), {
        params: { company_id: companyId },
      });
      const payload = response?.data || {};
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to fetch KPI mapping row.",
        );
      }
      return normalizeKpiMappingRow(payload?.data || payload);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch KPI mapping row."),
      );
    }
  },
);

export const updateCxoKpiMappingWeight = createAsyncThunk(
  "cxoMetrics/updateKpiMappingWeight",
  async (
    { mappingId, companyId, metricId, weight },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(
        API_URLS.cxoKpiMappingById(mappingId),
        { weight: Number(weight) || 0 },
        { params: { company_id: companyId } },
      );
      const payload = response?.data || {};
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to update weight.",
        );
      }
      return {
        key: cacheKey(companyId, metricId),
        mappingId,
        row: payload?.data ? normalizeKpiMappingRow(payload.data) : null,
        message: payload?.message || "Weight updated.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update weight."),
      );
    }
  },
);

export const patchCxoKpiMappingStatus = createAsyncThunk(
  "cxoMetrics/patchKpiMappingStatus",
  async (
    { mappingId, companyId, metricId, isActive },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(
        API_URLS.cxoKpiMappingStatus(mappingId),
        { is_active: Boolean(isActive) },
        { params: { company_id: companyId } },
      );
      const payload = response?.data || {};
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to update status.",
        );
      }
      return {
        key: cacheKey(companyId, metricId),
        mappingId,
        row: payload?.data ? normalizeKpiMappingRow(payload.data) : null,
        isActive: Boolean(isActive),
        message: payload?.message || "Status updated.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update status."),
      );
    }
  },
);

export const deleteCxoKpiMappingById = createAsyncThunk(
  "cxoMetrics/deleteKpiMappingById",
  async ({ mappingId, companyId, metricId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_URLS.cxoKpiMappingById(mappingId), {
        params: { company_id: companyId },
      });
      const payload = response?.data || {};
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to delete KPI mapping.",
        );
      }
      return {
        key: cacheKey(companyId, metricId),
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

export const deleteCxoKpiMappingBulk = createAsyncThunk(
  "cxoMetrics/deleteKpiMappingBulk",
  async ({ companyId, metricId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_URLS.cxoKpiMapping, {
        params: { company_id: companyId, metric_id: metricId },
      });
      const payload = response?.data || {};
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to drop KPI mappings.",
        );
      }
      const data = payload?.data || payload || {};
      return {
        key: cacheKey(companyId, metricId),
        deletedCount: Number(data?.deleted_count ?? 0),
        message:
          payload?.message ||
          `Dropped ${Number(data?.deleted_count ?? 0)} mapping row(s).`,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to drop KPI mappings."),
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

export const updateCxoMetricById = createAsyncThunk(
  "cxoMetrics/updateMetricById",
  async ({ metricId, fields }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        API_URLS.cxoMetricById(metricId),
        fields || {},
      );
      const payload = response?.data || {};
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to update metric.",
        );
      }
      return {
        metricId,
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

export const deleteCxoMetricById = createAsyncThunk(
  "cxoMetrics/deleteMetricById",
  async ({ metricId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_URLS.cxoMetricById(metricId));
      const payload = response?.data || {};
      if (payload && payload.success === false) {
        return rejectWithValue(
          payload?.error?.message ||
            payload?.message ||
            "Failed to delete metric.",
        );
      }
      const kpiMappingsDeleted = Number(
        payload?.data?.kpi_mappings_deleted ?? 0,
      );
      return {
        metricId,
        kpiMappingsDeleted,
        message:
          payload?.message ||
          `CXO metric deleted (cascade removed ${kpiMappingsDeleted} mapping row(s)).`,
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
    clearCxoKpiMappingState(state) {
      state.kpiMappingError = "";
      state.kpiMappingMessage = "";
      state.kpiMappingLoading = false;
    },
    clearCxoKpiMappingListError(state) {
      state.kpiMappingListError = "";
    },
    clearCxoKpiMappingMutationState(state) {
      state.kpiMappingUpdateError = "";
      state.kpiMappingUpdateMessage = "";
      state.kpiMappingUpdateLoading = false;
      state.kpiMappingStatusError = "";
      state.kpiMappingStatusMessage = "";
      state.kpiMappingStatusLoading = false;
      state.kpiMappingDeleteError = "";
      state.kpiMappingDeleteMessage = "";
      state.kpiMappingDeleteLoading = false;
      state.kpiMappingBulkDeleteError = "";
      state.kpiMappingBulkDeleteMessage = "";
      state.kpiMappingBulkDeleteLoading = false;
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
    clearCxoDefinitionUpdateState(state) {
      state.definitionUpdateError = "";
      state.definitionUpdateMessage = "";
      state.definitionUpdateLoading = false;
    },
    clearCxoDefinitionDeleteState(state) {
      state.definitionDeleteError = "";
      state.definitionDeleteMessage = "";
      state.definitionDeleteLoading = false;
      state.definitionDeleteKpiCount = 0;
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
      .addCase(createCxoKpiMapping.pending, (state) => {
        state.kpiMappingLoading = true;
        state.kpiMappingError = "";
        state.kpiMappingMessage = "";
      })
      .addCase(createCxoKpiMapping.fulfilled, (state, action) => {
        state.kpiMappingLoading = false;
        state.kpiMappingMessage = action.payload?.message || "";
      })
      .addCase(createCxoKpiMapping.rejected, (state, action) => {
        state.kpiMappingLoading = false;
        state.kpiMappingError = action.payload || "Failed to save KPI mapping.";
      })
      .addCase(fetchCxoKpiMappingList.pending, (state) => {
        state.kpiMappingListLoading = true;
        state.kpiMappingListError = "";
      })
      .addCase(fetchCxoKpiMappingList.fulfilled, (state, action) => {
        state.kpiMappingListLoading = false;
        const { key, rows } = action.payload;
        state.kpiMappingListByKey[key] = rows;
      })
      .addCase(fetchCxoKpiMappingList.rejected, (state, action) => {
        state.kpiMappingListLoading = false;
        state.kpiMappingListError =
          action.payload || "Failed to fetch KPI mapping rows.";
      })
      .addCase(fetchCxoKpiMappingById.pending, (state) => {
        // Single-row fetch is incidental; reuse the list error slot rather
        // than adding another loading flag for what is usually a follow-up
        // call after a mutation.
        state.kpiMappingListError = "";
      })
      .addCase(fetchCxoKpiMappingById.rejected, (state, action) => {
        state.kpiMappingListError =
          action.payload || "Failed to fetch KPI mapping row.";
      })
      .addCase(updateCxoKpiMappingWeight.pending, (state) => {
        state.kpiMappingUpdateLoading = true;
        state.kpiMappingUpdateError = "";
        state.kpiMappingUpdateMessage = "";
      })
      .addCase(updateCxoKpiMappingWeight.fulfilled, (state, action) => {
        state.kpiMappingUpdateLoading = false;
        state.kpiMappingUpdateMessage = action.payload?.message || "";
        const { key, mappingId, row } = action.payload;
        const list = state.kpiMappingListByKey[key];
        if (list && row) {
          state.kpiMappingListByKey[key] = list.map((r) =>
            r.mapping_id === mappingId ? { ...r, ...row } : r,
          );
        }
      })
      .addCase(updateCxoKpiMappingWeight.rejected, (state, action) => {
        state.kpiMappingUpdateLoading = false;
        state.kpiMappingUpdateError =
          action.payload || "Failed to update weight.";
      })
      .addCase(patchCxoKpiMappingStatus.pending, (state) => {
        state.kpiMappingStatusLoading = true;
        state.kpiMappingStatusError = "";
        state.kpiMappingStatusMessage = "";
      })
      .addCase(patchCxoKpiMappingStatus.fulfilled, (state, action) => {
        state.kpiMappingStatusLoading = false;
        state.kpiMappingStatusMessage = action.payload?.message || "";
        const { key, mappingId, row, isActive } = action.payload;
        const list = state.kpiMappingListByKey[key];
        if (list) {
          state.kpiMappingListByKey[key] = list.map((r) =>
            r.mapping_id === mappingId
              ? { ...r, ...(row || {}), is_active: isActive }
              : r,
          );
        }
      })
      .addCase(patchCxoKpiMappingStatus.rejected, (state, action) => {
        state.kpiMappingStatusLoading = false;
        state.kpiMappingStatusError =
          action.payload || "Failed to update status.";
      })
      .addCase(deleteCxoKpiMappingById.pending, (state) => {
        state.kpiMappingDeleteLoading = true;
        state.kpiMappingDeleteError = "";
        state.kpiMappingDeleteMessage = "";
      })
      .addCase(deleteCxoKpiMappingById.fulfilled, (state, action) => {
        state.kpiMappingDeleteLoading = false;
        state.kpiMappingDeleteMessage = action.payload?.message || "";
        const { key, mappingId } = action.payload;
        const list = state.kpiMappingListByKey[key];
        if (list) {
          state.kpiMappingListByKey[key] = list.filter(
            (r) => r.mapping_id !== mappingId,
          );
        }
      })
      .addCase(deleteCxoKpiMappingById.rejected, (state, action) => {
        state.kpiMappingDeleteLoading = false;
        state.kpiMappingDeleteError =
          action.payload || "Failed to delete KPI mapping.";
      })
      .addCase(deleteCxoKpiMappingBulk.pending, (state) => {
        state.kpiMappingBulkDeleteLoading = true;
        state.kpiMappingBulkDeleteError = "";
        state.kpiMappingBulkDeleteMessage = "";
      })
      .addCase(deleteCxoKpiMappingBulk.fulfilled, (state, action) => {
        state.kpiMappingBulkDeleteLoading = false;
        state.kpiMappingBulkDeleteMessage = action.payload?.message || "";
        const { key } = action.payload;
        state.kpiMappingListByKey[key] = [];
      })
      .addCase(deleteCxoKpiMappingBulk.rejected, (state, action) => {
        state.kpiMappingBulkDeleteLoading = false;
        state.kpiMappingBulkDeleteError =
          action.payload || "Failed to drop KPI mappings.";
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
      })
      .addCase(updateCxoMetricById.pending, (state) => {
        state.definitionUpdateLoading = true;
        state.definitionUpdateError = "";
        state.definitionUpdateMessage = "";
      })
      .addCase(updateCxoMetricById.fulfilled, (state, action) => {
        state.definitionUpdateLoading = false;
        state.definitionUpdateMessage = action.payload?.message || "";
        const { metricId, data } = action.payload;
        if (data) {
          // Merge by id so the master table reflects the new display_name /
          // is_active immediately. metric_code is immutable so the existing
          // tabs/cards keyed by code remain valid.
          const idx = state.metricsMaster.findIndex((m) => m.id === metricId);
          if (idx >= 0) {
            state.metricsMaster[idx] = {
              ...state.metricsMaster[idx],
              ...data,
            };
          }
        }
      })
      .addCase(updateCxoMetricById.rejected, (state, action) => {
        state.definitionUpdateLoading = false;
        state.definitionUpdateError =
          action.payload || "Failed to update metric.";
      })
      .addCase(deleteCxoMetricById.pending, (state) => {
        state.definitionDeleteLoading = true;
        state.definitionDeleteError = "";
        state.definitionDeleteMessage = "";
        state.definitionDeleteKpiCount = 0;
      })
      .addCase(deleteCxoMetricById.fulfilled, (state, action) => {
        state.definitionDeleteLoading = false;
        state.definitionDeleteMessage = action.payload?.message || "";
        state.definitionDeleteKpiCount =
          Number(action.payload?.kpiMappingsDeleted) || 0;
        const { metricId } = action.payload;
        // Cascade-soft-delete on the server — drop the row locally so the
        // table and any tabs reflect that the metric is gone.
        state.metricsMaster = state.metricsMaster.filter(
          (m) => m.id !== metricId,
        );
      })
      .addCase(deleteCxoMetricById.rejected, (state, action) => {
        state.definitionDeleteLoading = false;
        state.definitionDeleteError =
          action.payload || "Failed to delete metric.";
      });
  },
});

export const {
  clearCxoMappingError,
  clearCxoSaveState,
  clearCxoResetState,
  clearCxoCreateState,
  clearCxoKpiMappingState,
  clearCxoKpiMappingListError,
  clearCxoKpiMappingMutationState,
  clearCxoUpdateState,
  clearCxoDeleteState,
  clearCxoDefinitionUpdateState,
  clearCxoDefinitionDeleteState,
} = cxoMetricsSlice.actions;

export default cxoMetricsSlice.reducer;
