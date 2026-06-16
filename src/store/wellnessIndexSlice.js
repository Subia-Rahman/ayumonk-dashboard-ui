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

export const fetchWellnessIndex = createAsyncThunk(
  "wellnessIndex/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.wellnessIndex);
      const payload = response?.data || {};
      if (payload?.success === false) return rejectWithValue(payload?.message);
      return payload?.data ?? null;
    } catch (error) {
      if (error?.response?.status === 404) return null; // ← treat as empty, not error
      return rejectWithValue(getApiErrorMessage(error, "Failed to load wellness index."));
    }
  }
);

const wellnessIndexSlice = createSlice({
  name: "wellnessIndex",
  initialState: { data: null, status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWellnessIndex.pending,   (s) => { s.status = "loading"; })
      .addCase(fetchWellnessIndex.fulfilled, (s, a) => { s.status = "succeeded"; s.data = a.payload; })
      .addCase(fetchWellnessIndex.rejected,  (s, a) => { s.status = "failed";   s.error = a.payload; });
  },
});

export default wellnessIndexSlice.reducer;
