import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";

const initialState = {
  items: [],
  loading: false,
  error: "",
  actionLoadingById: {},
  actionErrorById: {},
  actionResultById: {},
  suggestions: {
    session_id: "",
    response_id: "",
    submitted_at: "",
    items: [],
  },
  suggestionsLoading: false,
  suggestionsError: "",
  trends: {
    period: "weekly",
    bucket_count: 0,
    overall: {
      kpi_key: null,
      kpi_name: "Overall",
      color: "#fb923c",
      points: [],
      delta_percent: 0,
    },
    series: [],
    top_improvements: [],
    insight: "",
  },
  trendsLoading: false,
  trendsError: "",
  badges: {
    earned_count: 0,
    total_count: 0,
    items: [],
  },
  badgesLoading: false,
  badgesError: "",
  leaderboard: {
    week_start: "",
    week_end: "",
    items: [],
    your_position: null,
  },
  leaderboardLoading: false,
  leaderboardError: "",
  // FIX 1: Added schedule to initialState
  schedule: {
    items: [],
    loading: false,
    error: "",
  },
};

const normalizeLeaderboardEntry = (entry = {}) => ({
  rank: Number(entry?.rank) || 0,
  rank_label: entry?.rank_label || "",
  user_id: entry?.user_id ?? null,
  display_name: entry?.display_name || "",
  subtext: entry?.subtext || "",
  xp_this_week: Number(entry?.xp_this_week) || 0,
  xp_last_week: Number(entry?.xp_last_week) || 0,
  display_change: entry?.display_change || "",
  change_type: entry?.change_type || "",
  current_level: Number(entry?.current_level) || 0,
  level_label: entry?.level_label || "",
  is_current_user: Boolean(entry?.is_current_user),
});

const normalizeBadge = (badge = {}) => ({
  badge_key: badge?.badge_key || "",
  label: badge?.label || "",
  icon: badge?.icon || "",
  level: String(badge?.level || "").toLowerCase(),
  trigger_type: badge?.trigger_type || "",
  trigger_value: Number(badge?.trigger_value) || 0,
  kpi_key: badge?.kpi_key ?? null,
  kpi_display_name: badge?.kpi_display_name || "",
  earned: Boolean(badge?.earned),
  earned_at: badge?.earned_at || null,
});

const normalizeTrendPoint = (point = {}) => ({
  bucket_label: point?.bucket_label || "",
  bucket_index: Number(point?.bucket_index) || 0,
  bucket_at: point?.bucket_at || "",
  average_score: Number(point?.average_score) || 0,
});

const normalizeTrendSeries = (series = {}) => ({
  kpi_key: series?.kpi_key ?? null,
  kpi_name: series?.kpi_name || "",
  color: series?.color || "#22d3ee",
  points: Array.isArray(series?.points)
    ? series.points.map(normalizeTrendPoint)
    : [],
  delta_percent: Number(series?.delta_percent) || 0,
});

const normalizeImprovement = (item = {}) => ({
  kpi_key: item?.kpi_key ?? null,
  kpi_name: item?.kpi_name || "",
  delta_percent: Number(item?.delta_percent) || 0,
});

const normalizeSuggestionTrigger = (item = {}) => ({
  trigger_mode: item?.trigger_mode || "",
  risk_level: item?.risk_level || "",
  kpi_key: item?.kpi_key || "",
  kpi_display_name: item?.kpi_display_name || "",
  kpi_average_score: Number(item?.kpi_average_score) || 0,
  question_key: item?.question_key || "",
  question_text: item?.question_text || "",
  question_score: Number(item?.question_score) || 0,
  score_threshold_below: Number(item?.score_threshold_below) || 0,
  priority: Number(item?.priority) || 0,
});

const normalizeSuggestionItem = (item = {}, index) => ({
  suggestion_id: item?.suggestion_id || `suggestion-${index + 1}`,
  suggestion_type: item?.suggestion_type || "",
  title: item?.title || "Lifestyle Suggestion",
  description: item?.description || "",
  url: item?.url || "",
  dosha_type: item?.dosha_type || "",
  difficulty: item?.difficulty || "",
  duration_mins: Number(item?.duration_mins) || 0,
  triggers: Array.isArray(item?.triggers)
    ? item.triggers.map(normalizeSuggestionTrigger)
    : [],
});

export const fetchDashboardKpis = createAsyncThunk(
  "dashboard/fetchDashboardKpis",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.dashboardKpis);
      const payload = response?.data || {};

      if (!payload?.success) {
        return rejectWithValue(payload?.message || "Failed to fetch dashboard KPIs.");
      }

      return Array.isArray(payload?.data?.items) ? payload.data.items : [];
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch dashboard KPIs due to server/network error."),
      );
    }
  },
);

export const postDashboardChallengeAction = createAsyncThunk(
  "dashboard/postDashboardChallengeAction",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URLS.dashboardChallengeAction, payload);
      const responsePayload = response?.data || {};

      if (!responsePayload?.success) {
        return rejectWithValue({
          challengeId: payload.challenge_id,
          message: responsePayload?.message || "Failed to submit challenge action.",
        });
      }

      return {
        challengeId: payload.challenge_id,
        payload: responsePayload?.data || {},
      };
    } catch (error) {
      return rejectWithValue({
        challengeId: payload.challenge_id,
        message: getApiErrorMessage(
          error,
          "Failed to submit challenge action due to server/network error.",
        ),
      });
    }
  },
);

export const postDashboardChallengeUndo = createAsyncThunk(
  "dashboard/postDashboardChallengeUndo",
  async ({ challenge_id }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URLS.dashboardChallengeUndo, {
        challenge_id,
      });
      const responsePayload = response?.data || {};

      if (!responsePayload?.success) {
        return rejectWithValue({
          challengeId: challenge_id,
          message: responsePayload?.message || "Failed to undo challenge.",
        });
      }

      return {
        challengeId: challenge_id,
        payload: responsePayload?.data || {},
      };
    } catch (error) {
      return rejectWithValue({
        challengeId: challenge_id,
        message: getApiErrorMessage(
          error,
          "Failed to undo challenge due to server/network error.",
        ),
      });
    }
  },
);

export const fetchWellnessTrends = createAsyncThunk(
  "dashboard/fetchWellnessTrends",
  async ({ period = "weekly", bucket_count } = {}, { rejectWithValue }) => {
    try {
      const params = { period };
      if (bucket_count) params.bucket_count = bucket_count;
      const response = await api.get(API_URLS.dashboardWellnessTrends, {
        params,
      });
      const payload = response?.data || {};
      if (!payload?.success) {
        return rejectWithValue(
          payload?.message || "Failed to fetch wellness trends.",
        );
      }
      const data = payload?.data || {};
      return {
        period: data?.period || period,
        bucket_count: Number(data?.bucket_count) || 0,
        overall: normalizeTrendSeries(data?.overall),
        series: Array.isArray(data?.series)
          ? data.series.map(normalizeTrendSeries)
          : [],
        top_improvements: Array.isArray(data?.top_improvements)
          ? data.top_improvements.map(normalizeImprovement)
          : [],
        insight: data?.insight || "",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch wellness trends due to server/network error.",
        ),
      );
    }
  },
);

export const fetchDashboardBadges = createAsyncThunk(
  "dashboard/fetchDashboardBadges",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.dashboardMyBadges);
      const payload = response?.data || {};
      const data = payload?.data || payload || {};

      return {
        earned_count: Number(data?.earned_count) || 0,
        total_count: Number(data?.total_count) || 0,
        items: Array.isArray(data?.badges) ? data.badges.map(normalizeBadge) : [],
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch badges due to server/network error."),
      );
    }
  },
);

export const fetchDashboardLeaderboard = createAsyncThunk(
  "dashboard/fetchDashboardLeaderboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.dashboardLeaderboard);
      const payload = response?.data || {};

      if (!payload?.success) {
        return rejectWithValue(payload?.message || "Failed to fetch leaderboard.");
      }

      const data = payload?.data || {};
      return {
        week_start: data?.week_start || "",
        week_end: data?.week_end || "",
        items: Array.isArray(data?.leaderboard)
          ? data.leaderboard.map(normalizeLeaderboardEntry)
          : [],
        your_position: data?.your_position
          ? normalizeLeaderboardEntry(data.your_position)
          : null,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch leaderboard due to server/network error."),
      );
    }
  },
);

export const fetchSessionSuggestions = createAsyncThunk(
  "dashboard/fetchSessionSuggestions",
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.sessionSuggestions(sessionId));
      const payload = response?.data || {};

      if (!payload?.success) {
        return rejectWithValue(
          payload?.message || "Failed to fetch session suggestions.",
        );
      }

      const data = payload?.data || {};

      return {
        session_id: data?.session_id || sessionId || "",
        response_id: data?.response_id || "",
        submitted_at: data?.submitted_at || "",
        items: Array.isArray(data?.items)
          ? data.items.map(normalizeSuggestionItem)
          : [],
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch session suggestions due to server/network error.",
        ),
      );
    }
  },
);

// KPI label → color mapping for schedule cards
const KPI_COLORS = {
  "Digital Index":    "#8B6FCB",
  "Hydration Goals":  "#4A90C4",
  "Nutrition Goals":  "#6DB33F",
  "Physical Health":  "#E8924A",
  "Sleep Index":      "#4A8C2A",
  "Social Queues":    "#D4A843",
};
const DEFAULT_SCHEDULE_COLOR = "#6DB33F";

// Normalize a raw schedule item from the API into the shape the component expects
const normalizeScheduleItem = (item = {}) => ({
  id:             item.kpi_challenge_id || "",
  label:          item.challenge_label  || "",
  icon:           item.challenge_icon   || "🔹",
  theme:          item.theme_label      || "",
  kpi_label:      item.kpi_label        || "",
  challenge_type: item.challenge_type   || "",
  start_date:     item.start_date       || "",
  end_date:       item.end_date         || "",
  status:         item.status           || "active",
  days_total:     Number(item.days_total)     || 0,
  days_elapsed:   Number(item.days_elapsed)   || 0,
  days_remaining: Number(item.days_remaining) || 0,
  progress_pct:   Number(item.progress_pct)   || 0,
  color:          KPI_COLORS[item.kpi_label]  || DEFAULT_SCHEDULE_COLOR,
});

// FIX 2: fetchChallengeSchedule moved to BEFORE createSlice
export const fetchChallengeSchedule = createAsyncThunk(
  "dashboard/fetchChallengeSchedule",
  async ({ status, kpi_key } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (status)  params.status  = status;
      if (kpi_key) params.kpi_key = kpi_key;
      // NOTE: company_id is intentionally omitted — the backend
      // derives the tenant from the JWT automatically.

      const response = await api.get(API_URLS.challengeSchedule, { params });
      const payload  = response?.data || {};

      if (!payload?.success) {
        return rejectWithValue(payload?.message || "Failed to fetch KPI schedule.");
      }

      const rawItems = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : (Array.isArray(payload?.data) ? payload.data : []);

      // Filter out soft-deleted / inactive items, then normalize field names
      return rawItems
        .filter((item) => item?.is_active === true)
        .map(normalizeScheduleItem);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch KPI schedule due to server/network error.")
      );
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardError(state) {
      state.error = "";
    },
    clearDashboardChallengeActionError(state, action) {
      if (action.payload) {
        delete state.actionErrorById[action.payload];
        return;
      }

      state.actionErrorById = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardKpis.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchDashboardKpis.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDashboardKpis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch dashboard KPIs.";
      })
      .addCase(postDashboardChallengeAction.pending, (state, action) => {
        const challengeId = action.meta.arg?.challenge_id;
        if (!challengeId) return;

        state.actionLoadingById[challengeId] = true;
        delete state.actionErrorById[challengeId];
      })
      .addCase(postDashboardChallengeAction.fulfilled, (state, action) => {
        const { challengeId, payload } = action.payload;
        state.actionLoadingById[challengeId] = false;
        state.actionResultById[challengeId] = payload;
      })
      .addCase(postDashboardChallengeAction.rejected, (state, action) => {
        const challengeId = action.payload?.challengeId || action.meta.arg?.challenge_id;
        if (!challengeId) return;

        state.actionLoadingById[challengeId] = false;
        state.actionErrorById[challengeId] =
          action.payload?.message || "Failed to submit challenge action.";
      })
      .addCase(postDashboardChallengeUndo.pending, (state, action) => {
        const challengeId = action.meta.arg?.challenge_id;
        if (!challengeId) return;

        state.actionLoadingById[challengeId] = true;
        delete state.actionErrorById[challengeId];
      })
      .addCase(postDashboardChallengeUndo.fulfilled, (state, action) => {
        const { challengeId, payload } = action.payload;
        state.actionLoadingById[challengeId] = false;
        state.actionResultById[challengeId] = payload;
      })
      .addCase(postDashboardChallengeUndo.rejected, (state, action) => {
        const challengeId = action.payload?.challengeId || action.meta.arg?.challenge_id;
        if (!challengeId) return;

        state.actionLoadingById[challengeId] = false;
        state.actionErrorById[challengeId] =
          action.payload?.message || "Failed to undo challenge.";
      })
      .addCase(fetchWellnessTrends.pending, (state) => {
        state.trendsLoading = true;
        state.trendsError = "";
      })
      .addCase(fetchWellnessTrends.fulfilled, (state, action) => {
        state.trendsLoading = false;
        state.trends = action.payload;
      })
      .addCase(fetchWellnessTrends.rejected, (state, action) => {
        state.trendsLoading = false;
        state.trendsError = action.payload || "Failed to fetch wellness trends.";
      })
      .addCase(fetchDashboardBadges.pending, (state) => {
        state.badgesLoading = true;
        state.badgesError = "";
      })
      .addCase(fetchDashboardBadges.fulfilled, (state, action) => {
        state.badgesLoading = false;
        state.badges = action.payload;
      })
      .addCase(fetchDashboardBadges.rejected, (state, action) => {
        state.badgesLoading = false;
        state.badgesError = action.payload || "Failed to fetch badges.";
      })
      .addCase(fetchDashboardLeaderboard.pending, (state) => {
        state.leaderboardLoading = true;
        state.leaderboardError = "";
      })
      .addCase(fetchDashboardLeaderboard.fulfilled, (state, action) => {
        state.leaderboardLoading = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchDashboardLeaderboard.rejected, (state, action) => {
        state.leaderboardLoading = false;
        state.leaderboardError = action.payload || "Failed to fetch leaderboard.";
      })
      .addCase(fetchSessionSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
        state.suggestionsError = "";
      })
      .addCase(fetchSessionSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestions = action.payload;
      })
      .addCase(fetchSessionSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestionsError =
          action.payload || "Failed to fetch session suggestions.";
      })
      // FIX 3: extraReducers cases for fetchChallengeSchedule
      .addCase(fetchChallengeSchedule.pending, (state) => {
        state.schedule.loading = true;
        state.schedule.error   = "";
      })
      .addCase(fetchChallengeSchedule.fulfilled, (state, action) => {
        state.schedule.loading = false;
        state.schedule.items   = action.payload;
      })
      .addCase(fetchChallengeSchedule.rejected, (state, action) => {
        state.schedule.loading = false;
        state.schedule.error   = action.payload || "Failed to fetch KPI schedule.";
      });
  },
});

export const { clearDashboardError, clearDashboardChallengeActionError } =
  dashboardSlice.actions;

export default dashboardSlice.reducer;