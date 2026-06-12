import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";

const initialState = {
  data: null,
  loading: true,
  error: "",
  mutating: false,
  mutationError: "",
  saved: false,
  toggleSnapshot: null,
  reminderLog: [],
  logStatus: "idle",
};

const runRequest = async (request, fallback, rejectWithValue) => {
  try {
    const response = await request();
    const payload = response?.data || {};
    if (payload?.success === false) {
      return rejectWithValue(payload?.message || fallback);
    }
    return payload?.data ?? null;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, fallback));
  }
};

export const fetchReminderSettings = createAsyncThunk(
  "reminderSettings/fetch",
  (_, { rejectWithValue }) =>
    runRequest(
      () => api.get(API_URLS.reminderSettings),
      "Failed to load reminder settings.",
      rejectWithValue,
    ),
);

export const updateReminderSettings = createAsyncThunk(
  "reminderSettings/update",
  (body, { rejectWithValue }) =>
    runRequest(
      () => api.put(API_URLS.reminderSettings, body),
      "Failed to update reminder settings.",
      rejectWithValue,
    ),
);

export const toggleReminderField = createAsyncThunk(
  "reminderSettings/toggleField",
  ({ field, value }, { rejectWithValue }) =>
    runRequest(
      () =>
        api.patch(API_URLS.reminderSettingsToggle, {
          field,
          ...(value !== undefined && { value }),
        }),
      "Failed to update reminder setting.",
      rejectWithValue,
    ),
);

export const snoozeReminders = createAsyncThunk(
  "reminderSettings/snooze",
  (duration, { rejectWithValue }) =>
    runRequest(
      () => api.post(API_URLS.reminderSettingsSnooze, { duration }),
      "Failed to snooze reminders.",
      rejectWithValue,
    ),
);

export const clearSnooze = createAsyncThunk(
  "reminderSettings/clearSnooze",
  (_, { rejectWithValue }) =>
    runRequest(
      () => api.delete(API_URLS.reminderSettingsSnooze),
      "Failed to clear snooze.",
      rejectWithValue,
    ),
);

export const fetchReminderLog = createAsyncThunk(
  "reminderSettings/fetchLog",
  (params = {}, { rejectWithValue }) =>
    runRequest(
      () => api.get(API_URLS.reminderSettingsLog, { params: { limit: params.limit ?? 10 } }),
      "Failed to load reminder history.",
      rejectWithValue,
    ),
);

const slice = createSlice({
  name: "reminderSettings",
  initialState,
  reducers: {
    clearSavedFlag(state) {
      state.saved = false;
    },
    clearMutationError(state) {
      state.mutationError = "";
    },
    flashSaved(state) {
      state.saved = true;
    },
    optimisticToggle(state, action) {
      const { field, value } = action.payload;
      if (state.data) {
        state.data = { ...state.data, [field]: value };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminderSettings.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchReminderSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchReminderSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load reminder settings.";
      })

      .addCase(updateReminderSettings.pending, (state) => {
        state.mutating = true;
        state.mutationError = "";
        state.saved = false;
      })
      .addCase(updateReminderSettings.fulfilled, (state, action) => {
        state.mutating = false;
        state.data = action.payload;
        state.saved = true;
      })
      .addCase(updateReminderSettings.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload || "Failed to update.";
      })

      .addCase(toggleReminderField.pending, (state, action) => {
        state.mutationError = "";
        const { field, value } = action.meta.arg || {};
        if (state.data && field !== undefined) {
          state.toggleSnapshot = { ...state.data };
          const next = value !== undefined ? value : !state.data[field];
          state.data = { ...state.data, [field]: next };
        }
      })
      .addCase(toggleReminderField.fulfilled, (state, action) => {
        state.toggleSnapshot = null;
        state.data = action.payload;
      })
      .addCase(toggleReminderField.rejected, (state, action) => {
        if (state.toggleSnapshot) {
          state.data = state.toggleSnapshot;
        }
        state.toggleSnapshot = null;
        state.mutationError =
          action.payload || "Failed to toggle setting.";
      })

      .addCase(snoozeReminders.pending, (state) => {
        state.mutating = true;
        state.mutationError = "";
      })
      .addCase(snoozeReminders.fulfilled, (state, action) => {
        state.mutating = false;
        state.data = action.payload;
      })
      .addCase(snoozeReminders.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload || "Failed to snooze.";
      })

      .addCase(clearSnooze.pending, (state) => {
        state.mutating = true;
        state.mutationError = "";
      })
      .addCase(clearSnooze.fulfilled, (state, action) => {
        state.mutating = false;
        state.data = action.payload;
      })
      .addCase(clearSnooze.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload || "Failed to clear snooze.";
      })

      .addCase(fetchReminderLog.pending, (state) => {
        state.logStatus = "loading";
      })
      .addCase(fetchReminderLog.fulfilled, (state, action) => {
        state.logStatus = "succeeded";
        state.reminderLog = action.payload?.items ?? action.payload ?? [];
      })
      .addCase(fetchReminderLog.rejected, (state) => {
        state.logStatus = "failed";
      });
  },
});

export const {
  clearSavedFlag,
  clearMutationError,
  flashSaved,
  optimisticToggle,
} = slice.actions;

export default slice.reducer;
