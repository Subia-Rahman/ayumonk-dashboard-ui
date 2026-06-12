import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";

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

export const submitMood = createAsyncThunk(
  "wellnessMood/submit",
  (score, { rejectWithValue }) =>
    runRequest(
      () => api.post(API_URLS.wellnessMood, { score }),
      "Failed to log mood.",
      rejectWithValue,
    ),
);

const todayStr = () => new Date().toISOString().slice(0, 10);

const wellnessMoodSlice = createSlice({
  name: "wellnessMood",
  initialState:
  {
    loggedAt: null,
    submittedScore: null,
    status: "idle",
    error: null
  },
  reducers: {
    resetMood(state) {
      state.loggedAt = null;
      state.submittedScore = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitMood.pending, (s) => { s.status = "loading"; })
      .addCase(submitMood.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.loggedAt = a.payload?.logged_at ?? null;
        s.submittedScore = a.payload?.score ?? null;
      })
      .addCase(fetchMoodToday.fulfilled, (s, a) => {
        if (a.payload?.logged) {
          s.loggedAt = a.payload?.logged_at ?? null;
          s.submittedScore = a.payload?.score ?? null;
        }
      })
      .addCase(submitMood.rejected, (s, a) => { s.status = "failed"; s.error = a.payload; });
  },
});

export const selectMoodLoggedToday = (state) => {
  const { loggedAt } = state.wellnessMood;
  return !!(loggedAt && loggedAt.slice(0, 10) === todayStr());
};

export const fetchMoodToday = createAsyncThunk(
  "wellnessMood/fetchToday",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.wellnessMoodToday);
      const payload = response?.data || {};
      if (payload?.success === false) return rejectWithValue(payload?.message);
      return payload?.data ?? null;
    } catch (error) {
      if (error?.response?.status === 404) return null;
      return rejectWithValue(getApiErrorMessage(error, "Failed to fetch mood."));
    }
  }
);

export const { resetMood } = wellnessMoodSlice.actions;
export default wellnessMoodSlice.reducer;
