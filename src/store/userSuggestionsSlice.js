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

export const fetchMySuggestions = createAsyncThunk(
  "userSuggestions/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.userSuggestionsMy);
      const payload = response?.data || {};
      if (payload?.success === false) return rejectWithValue(payload?.message);
      return payload?.data ?? null;
    } catch (error) {
      if (error?.response?.status === 404) return null;
      if (error?.response?.status === 401) return null;
      return rejectWithValue(getApiErrorMessage(error, "Failed to load suggestions."));
    }
  }
);

export const recordAction = createAsyncThunk(
  "userSuggestions/recordAction",
  async ({ logId, action }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URLS.userSuggestionAction(logId), { action });
      const payload = response?.data || {};
      if (payload?.success === false) {
        return rejectWithValue({ logId, error: payload?.message || "Failed to record action." });
      }
      return payload?.data ?? null;
    } catch (error) {
      // Return logId in the rejection so the optimistic update can be reverted
      return rejectWithValue({ logId, error: getApiErrorMessage(error, "Failed to record action.") });
    }
  },
);

const userSuggestionsSlice = createSlice({
  name: "userSuggestions",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMySuggestions.pending,   (s) => { s.status = "loading"; })
      .addCase(fetchMySuggestions.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.items = a.payload?.items ?? [];
      })
      .addCase(fetchMySuggestions.rejected,  (s, a) => { s.status = "failed"; s.error = a.payload; })

      // Optimistic update: stamp the action immediately
      .addCase(recordAction.pending, (s, a) => {
        const { logId, action } = a.meta.arg;
        const item = s.items.find((i) => i.log_id === logId);
        if (item) { item._prevAction = item.action; item.action = action; }
      })
      .addCase(recordAction.fulfilled, (s, a) => {
        const { log_id, action, actioned_at } = a.payload ?? {};
        const item = s.items.find((i) => i.log_id === log_id);
        if (item) { item.action = action; item.actioned_at = actioned_at; delete item._prevAction; }
      })
      // Revert on 404 / 422
      .addCase(recordAction.rejected, (s, a) => {
        const logId = a.payload?.logId;
        const item = s.items.find((i) => i.log_id === logId);
        if (item) { item.action = item._prevAction ?? null; delete item._prevAction; }
      });
  },
});

export default userSuggestionsSlice.reducer;
