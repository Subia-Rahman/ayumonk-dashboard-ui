
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
    data && typeof data === "object" && (data.data || data.cells || data.rows)
      ? data.data || data
      : data || {};

  // Pre-declared header arrays in the response take precedence — those keep
  // the column / row order the backend intends.
  const declaredLocations = Array.isArray(root?.locations)
    ? root.locations.map((l) => (typeof l === "string" ? l : l?.name || l?.label || ""))
    : [];
  const declaredDepartments = Array.isArray(root?.departments)
    ? root.departments.map((d) =>
        typeof d === "string" ? d : d?.name || d?.label || "",
      )
    : [];

  let cells = [];

  // Shape A: cells: [{ location, department, value }]
  if (Array.isArray(root?.cells)) {
    cells = root.cells.map((c) => ({
      location: c?.location || c?.location_label || c?.l || "",
      department: c?.department || c?.department_label || c?.d || "",
      value:
        c?.value == null || Number.isNaN(Number(c.value))
          ? null
          : Number(c.value),
    }));
  }
  // Shape B: rows: [{ location, cells: { department: value } }]
  // Shape C: rows: [{ location, departments: [{ name, value }] }]
  else if (Array.isArray(root?.rows)) {
    root.rows.forEach((row) => {
      const location = row?.location || row?.label || row?.name || "";
      if (Array.isArray(row?.departments)) {
        row.departments.forEach((dept) => {
          cells.push({
            location,
            department: dept?.name || dept?.label || dept?.department || "",
            value:
              dept?.value == null || Number.isNaN(Number(dept.value))
                ? null
                : Number(dept.value),
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
  }
  // Shape D: raw array at the root.
  else if (Array.isArray(data)) {
    cells = data.map((c) => ({
      location: c?.location || "",
      department: c?.department || "",
      value:
        c?.value == null || Number.isNaN(Number(c.value))
          ? null
          : Number(c.value),
    }));
  }

  // Derive headers from cells if the backend didn't declare them. Insertion
  // order via Set preserves whatever the backend returned first.
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
const buildFilterParams = (filters) => {
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

const slice = createSlice({
  name: "hrAnalytics",
  initialState,
  reducers: {
    clearHrAnalyticsErrors(state) {
      state.dimensionsError = "";
      state.dimensionDataError = "";
      state.genderError = "";
      state.heatmapError = "";
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
      });
  },
});

export const { clearHrAnalyticsErrors } = slice.actions;
export default slice.reducer;
