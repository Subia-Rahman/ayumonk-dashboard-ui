
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";

const initialState = {
  // Toggle definitions for the "Wellness by Dimension" card. WellnessIndex is
  // hardcoded by the backend as the first entry.
  dimensions: [],
  dimensionsLoading: false,
  dimensionsError: "",

  // GET /hr/wellness-by-dimension?dimension=<key> — keyed by dimension_key.
  dataByDimension: {},
  dimensionDataLoading: false,
  dimensionDataError: "",

  // GET /hr/gender-wellness — single flat list, fixed Male / Female / Other order.
  gender: [],
  genderLoading: false,
  genderError: "",

  // GET /hr/heatmap/location-department — { locations, departments, cells }
  // where each cell is { location, department, value }.
  heatmap: { locations: [], departments: [], cells: [] },
  heatmapLoading: false,
  heatmapError: "",

  // GET /hr/summary-cards — six KPI tiles. value may be null when the
  // underlying dimension/metric isn't configured for this company or when
  // the filtered set is empty.
  summary: {
    avg_wellness: null,
    productivity: null,
    engagement: null,
    absenteeism: null,
    sleep_score: null,
    stress_score: null,
  },
  summaryLoading: false,
  summaryError: "",

  // GET /hr/employee-count — { total, filtered } headcount counters.
  employeeCount: { total: null, filtered: null },
  employeeCountLoading: false,
  employeeCountError: "",

  // GET /hr/headcount — per-segment headcount used as bubble size in the
  // wellness ↔ productivity scatter and as denominators elsewhere.
  headcount: { by_department: [], by_location: [] },
  headcountLoading: false,
  headcountError: "",
};

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

const normalizeDimensionDef = (item) => ({
  key: item?.key || "",
  label: item?.label || item?.key || "",
  order: Number(item?.order ?? 0),
});

const normalizeBucket = (item) => ({
  label: item?.label || "",
  value:
    item?.value == null || Number.isNaN(Number(item.value))
      ? null
      : Number(item.value),
});

const firstPresent = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const toNumberOrNull = (...values) => {
  const value = firstPresent(...values);
  return value == null || Number.isNaN(Number(value)) ? null : Number(value);
};

const getLocationLabel = (item) =>
  firstPresent(
    typeof item === "string" ? item : null,
    item?.location,
    item?.location_name,
    item?.location_label,
    item?.locationName,
    item?.label,
    item?.name,
    item?.l,
  ) || "";

const getDepartmentLabel = (item) =>
  firstPresent(
    typeof item === "string" ? item : null,
    item?.department,
    item?.department_name,
    item?.department_label,
    item?.departmentName,
    item?.label,
    item?.name,
    item?.d,
  ) || "";

const getHeatmapValue = (item) =>
  toNumberOrNull(
    item?.value,
    item?.wellness_score,
    item?.wellnessScore,
    item?.wellness_index,
    item?.wellnessIndex,
    item?.score,
    item?.avg_score,
    item?.average_score,
    item?.avg_wellness_score,
    item?.average_wellness_score,
  );

const normalizeByDimensionPayload = (data, fallbackKey) => {
  const root =
    data && typeof data === "object" && (data.data || data.items)
      ? data.data || data
      : data || {};
  return {
    dimension: root?.dimension || fallbackKey || "",
    by_department: Array.isArray(root?.by_department)
      ? root.by_department.map(normalizeBucket)
      : [],
    by_location: Array.isArray(root?.by_location)
      ? root.by_location.map(normalizeBucket)
      : [],
  };
};

// The heatmap can land in a few shapes depending on backend serialization.
// We collapse all of them into a single { locations, departments, cells }
// structure so the table renderer doesn't have to branch.
const normalizeHeatmapPayload = (data) => {
  const root =
    data && typeof data === "object" && !Array.isArray(data) && data.data
      ? data.data
      : data || {};
  const source =
    root && typeof root === "object" && !Array.isArray(root) && root.heatmap
      ? root.heatmap
      : root;

  const declaredLocations = Array.isArray(source?.locations)
    ? source.locations.map(getLocationLabel).filter(Boolean)
    : [];
  const declaredDepartments = Array.isArray(source?.departments)
    ? source.departments.map(getDepartmentLabel).filter(Boolean)
    : [];

  let cells = [];

  if (Array.isArray(source?.cells)) {
    cells = source.cells.map((c) => ({
      location: getLocationLabel(c),
      department: getDepartmentLabel(c),
      value: getHeatmapValue(c),
    }));
  } else if (Array.isArray(source?.items) || Array.isArray(source?.results)) {
    const items = Array.isArray(source?.items) ? source.items : source.results;
    cells = items.map((c) => ({
      location: getLocationLabel(c),
      department: getDepartmentLabel(c),
      value: getHeatmapValue(c),
    }));
  } else if (Array.isArray(source?.rows)) {
    source.rows.forEach((row) => {
      const location = getLocationLabel(row);
      if (Array.isArray(row?.departments)) {
        row.departments.forEach((dept) => {
          cells.push({
            location,
            department: getDepartmentLabel(dept),
            value: getHeatmapValue(dept),
          });
        });
      } else if (row?.cells && typeof row.cells === "object") {
        Object.entries(row.cells).forEach(([department, value]) => {
          cells.push({
            location,
            department,
            value:
              value == null || Number.isNaN(Number(value))
                ? null
                : Number(value),
          });
        });
      }
    });
  } else if (source?.matrix && typeof source.matrix === "object") {
    Object.entries(source.matrix).forEach(([location, departments]) => {
      if (!departments || typeof departments !== "object") return;
      Object.entries(departments).forEach(([department, value]) => {
        cells.push({
          location,
          department,
          value:
            value == null || Number.isNaN(Number(value)) ? null : Number(value),
        });
      });
    });
  } else if (Array.isArray(source)) {
    cells = source.map((c) => ({
      location: getLocationLabel(c),
      department: getDepartmentLabel(c),
      value: getHeatmapValue(c),
    }));
  }

  const locations =
    declaredLocations.length > 0
      ? declaredLocations
      : Array.from(new Set(cells.map((c) => c.location).filter(Boolean)));
  const departments =
    declaredDepartments.length > 0
      ? declaredDepartments
      : Array.from(new Set(cells.map((c) => c.department).filter(Boolean)));

  return { locations, departments, cells };
};
// Build a query-param object from the page's filter state. Any value left as
// "All" / "" is dropped so the backend sees a clean filter set.
export const buildFilterParams = (filters) => {
  const out = {};
  if (!filters) return out;
  if (filters.department) out.department = filters.department;
  if (filters.location) out.location = filters.location;
  if (filters.ageBand) out.age_band = filters.ageBand;
  if (filters.gender) out.gender = filters.gender;
  return out;
};

const normalizeGenderRow = (item) => ({
  gender: item?.gender || "",
  wellness_score:
    item?.wellness_score == null ? null : Number(item.wellness_score),
  productivity_score:
    item?.productivity_score == null
      ? null
      : Number(item.productivity_score),
});

const normalizeSummaryCard = (card) => {
  if (!card || typeof card !== "object") return null;
  return {
    value:
      card.value == null || Number.isNaN(Number(card.value))
        ? null
        : Number(card.value),
    unit: card.unit || "",
    label: card.label || "",
    subtext: card.subtext || "",
  };
};

const normalizeSummaryPayload = (data) => {
  const root =
    data && typeof data === "object" && data.data && typeof data.data === "object"
      ? data.data
      : data || {};
  return {
    avg_wellness: normalizeSummaryCard(root.avg_wellness),
    productivity: normalizeSummaryCard(root.productivity),
    engagement: normalizeSummaryCard(root.engagement),
    absenteeism: normalizeSummaryCard(root.absenteeism),
    sleep_score: normalizeSummaryCard(root.sleep_score),
    stress_score: normalizeSummaryCard(root.stress_score),
  };
};

const toIntOrNull = (value) =>
  value == null || Number.isNaN(Number(value)) ? null : Number(value);

const normalizeEmployeeCountPayload = (data) => {
  const root =
    data && typeof data === "object" && data.data && typeof data.data === "object"
      ? data.data
      : data || {};
  return {
    total: toIntOrNull(root.total),
    filtered: toIntOrNull(root.filtered),
  };
};

const normalizeCountBucket = (item) => ({
  label: item?.label || "",
  count: toIntOrNull(item?.count) ?? 0,
});

const normalizeHeadcountPayload = (data) => {
  const root =
    data && typeof data === "object" && data.data && typeof data.data === "object"
      ? data.data
      : data || {};
  return {
    by_department: Array.isArray(root.by_department)
      ? root.by_department.map(normalizeCountBucket)
      : [],
    by_location: Array.isArray(root.by_location)
      ? root.by_location.map(normalizeCountBucket)
      : [],
  };
};

export const fetchHrWellnessDimensions = createAsyncThunk(
  "hrAnalytics/fetchDimensions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.hrWellnessDimensions);
      const payload = response?.data;
      const failure = rejectIfFailed(
        payload,
        "Failed to fetch wellness dimensions.",
      );
      if (failure) return rejectWithValue(failure);
      return extractArray(payload).map(normalizeDimensionDef);
    } catch (error) {
      console.error(
        "fetchHrWellnessDimensions failed:",
        error?.response || error,
      );
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch wellness dimensions."),
      );
    }
  },
);

export const fetchHrWellnessByDimension = createAsyncThunk(
  "hrAnalytics/fetchByDimension",
  async ({ dimension, filters }, { rejectWithValue }) => {
    if (!dimension) {
      return rejectWithValue("Dimension key is required.");
    }
    try {
      const response = await api.get(API_URLS.hrWellnessByDimension, {
        params: { dimension, ...buildFilterParams(filters) },
      });
      const payload = response?.data;
      const failure = rejectIfFailed(
        payload,
        "Failed to fetch wellness-by-dimension data.",
      );
      if (failure) return rejectWithValue(failure);
      const root = payload?.data && typeof payload.data === "object"
        ? payload.data
        : payload || {};
      return {
        dimension,
        data: normalizeByDimensionPayload(root, dimension),
      };
    } catch (error) {
      const status = error?.response?.status;
      console.error(
        "fetchHrWellnessByDimension failed:",
        error?.response || error,
      );
      // 404 = dimension not configured. Surface a clear message but keep the
      // shape sane so the chart can render an empty state.
      if (status === 404) {
        return rejectWithValue(
          error?.response?.data?.message ||
            `Dimension "${dimension}" is not configured.`,
        );
      }
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch wellness-by-dimension data.",
        ),
      );
    }
  },
);

export const fetchHrHeatmapLocationDept = createAsyncThunk(
  "hrAnalytics/fetchHeatmapLocationDept",
  async ({ filters } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.hrHeatmapLocationDept, {
        params: buildFilterParams(filters),
      });
      const payload = response?.data;
      const failure = rejectIfFailed(
        payload,
        "Failed to fetch wellness heatmap.",
      );
      if (failure) return rejectWithValue(failure);
      const root = payload?.data && typeof payload.data === "object"
        ? payload.data
        : payload;
      return normalizeHeatmapPayload(root);
    } catch (error) {
      console.error(
        "fetchHrHeatmapLocationDept failed:",
        error?.response || error,
      );
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch wellness heatmap."),
      );
    }
  },
);

export const fetchHrGenderWellness = createAsyncThunk(
  "hrAnalytics/fetchGender",
  async ({ filters } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.hrGenderWellness, {
        params: buildFilterParams(filters),
      });
      const payload = response?.data;
      const failure = rejectIfFailed(
        payload,
        "Failed to fetch gender-wellness data.",
      );
      if (failure) return rejectWithValue(failure);
      return extractArray(payload).map(normalizeGenderRow);
    } catch (error) {
      console.error(
        "fetchHrGenderWellness failed:",
        error?.response || error,
      );
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch gender-wellness data."),
      );
    }
  },
);

export const fetchHrSummaryCards = createAsyncThunk(
  "hrAnalytics/fetchSummary",
  async ({ filters } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.hrSummaryCards, {
        params: buildFilterParams(filters),
      });
      const payload = response?.data;
      const failure = rejectIfFailed(
        payload,
        "Failed to fetch summary cards.",
      );
      if (failure) return rejectWithValue(failure);
      return normalizeSummaryPayload(payload);
    } catch (error) {
      console.error("fetchHrSummaryCards failed:", error?.response || error);
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch summary cards."),
      );
    }
  },
);

export const fetchHrEmployeeCount = createAsyncThunk(
  "hrAnalytics/fetchEmployeeCount",
  async ({ filters } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.hrEmployeeCount, {
        params: buildFilterParams(filters),
      });
      const payload = response?.data;
      const failure = rejectIfFailed(
        payload,
        "Failed to fetch employee count.",
      );
      if (failure) return rejectWithValue(failure);
      return normalizeEmployeeCountPayload(payload);
    } catch (error) {
      console.error("fetchHrEmployeeCount failed:", error?.response || error);
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch employee count."),
      );
    }
  },
);

export const fetchHrHeadcount = createAsyncThunk(
  "hrAnalytics/fetchHeadcount",
  async ({ filters } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.hrHeadcount, {
        params: buildFilterParams(filters),
      });
      const payload = response?.data;
      const failure = rejectIfFailed(payload, "Failed to fetch headcount.");
      if (failure) return rejectWithValue(failure);
      return normalizeHeadcountPayload(payload);
    } catch (error) {
      console.error("fetchHrHeadcount failed:", error?.response || error);
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch headcount."),
      );
    }
  },
);

const slice = createSlice({
  name: "hrAnalytics",
  initialState,
  reducers: {
    clearHrAnalyticsErrors(state) {
      state.dimensionsError = "";
      state.dimensionDataError = "";
      state.genderError = "";
      state.heatmapError = "";
      state.summaryError = "";
      state.employeeCountError = "";
      state.headcountError = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHrWellnessDimensions.pending, (state) => {
        state.dimensionsLoading = true;
        state.dimensionsError = "";
      })
      .addCase(fetchHrWellnessDimensions.fulfilled, (state, action) => {
        state.dimensionsLoading = false;
        state.dimensions = action.payload || [];
      })
      .addCase(fetchHrWellnessDimensions.rejected, (state, action) => {
        state.dimensionsLoading = false;
        state.dimensionsError =
          action.payload || "Failed to fetch wellness dimensions.";
      })
      .addCase(fetchHrWellnessByDimension.pending, (state) => {
        state.dimensionDataLoading = true;
        state.dimensionDataError = "";
      })
      .addCase(fetchHrWellnessByDimension.fulfilled, (state, action) => {
        state.dimensionDataLoading = false;
        const { dimension, data } = action.payload || {};
        if (dimension) state.dataByDimension[dimension] = data;
      })
      .addCase(fetchHrWellnessByDimension.rejected, (state, action) => {
        state.dimensionDataLoading = false;
        state.dimensionDataError =
          action.payload || "Failed to fetch wellness-by-dimension data.";
      })
      .addCase(fetchHrGenderWellness.pending, (state) => {
        state.genderLoading = true;
        state.genderError = "";
      })
      .addCase(fetchHrGenderWellness.fulfilled, (state, action) => {
        state.genderLoading = false;
        state.gender = action.payload || [];
      })
      .addCase(fetchHrGenderWellness.rejected, (state, action) => {
        state.genderLoading = false;
        state.genderError =
          action.payload || "Failed to fetch gender-wellness data.";
      })
      .addCase(fetchHrHeatmapLocationDept.pending, (state) => {
        state.heatmapLoading = true;
        state.heatmapError = "";
      })
      .addCase(fetchHrHeatmapLocationDept.fulfilled, (state, action) => {
        state.heatmapLoading = false;
        state.heatmap = action.payload || {
          locations: [],
          departments: [],
          cells: [],
        };
      })
      .addCase(fetchHrHeatmapLocationDept.rejected, (state, action) => {
        state.heatmapLoading = false;
        state.heatmapError =
          action.payload || "Failed to fetch wellness heatmap.";
      })
      .addCase(fetchHrSummaryCards.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = "";
      })
      .addCase(fetchHrSummaryCards.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload || state.summary;
      })
      .addCase(fetchHrSummaryCards.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError =
          action.payload || "Failed to fetch summary cards.";
      })
      .addCase(fetchHrEmployeeCount.pending, (state) => {
        state.employeeCountLoading = true;
        state.employeeCountError = "";
      })
      .addCase(fetchHrEmployeeCount.fulfilled, (state, action) => {
        state.employeeCountLoading = false;
        state.employeeCount = action.payload || { total: null, filtered: null };
      })
      .addCase(fetchHrEmployeeCount.rejected, (state, action) => {
        state.employeeCountLoading = false;
        state.employeeCountError =
          action.payload || "Failed to fetch employee count.";
      })
      .addCase(fetchHrHeadcount.pending, (state) => {
        state.headcountLoading = true;
        state.headcountError = "";
      })
      .addCase(fetchHrHeadcount.fulfilled, (state, action) => {
        state.headcountLoading = false;
        state.headcount = action.payload || { by_department: [], by_location: [] };
      })
      .addCase(fetchHrHeadcount.rejected, (state, action) => {
        state.headcountLoading = false;
        state.headcountError =
          action.payload || "Failed to fetch headcount.";
      });
  },
});

export const { clearHrAnalyticsErrors } = slice.actions;
export default slice.reducer;

