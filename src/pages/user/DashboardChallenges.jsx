import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Box } from "@mui/material";
import {
  clearDashboardChallengeActionError,
  fetchDashboardKpis,
  postDashboardChallengeAction,
  postDashboardChallengeUndo,
} from "../../store/dashboardSlice";
import ReminderSettings from "./ReminderSettings";
import { ACCENT, useClientPalette } from "../../utils/clientPalette";

// Default dark palette retained for module-level helpers (leaderboard, badge
// level/icon maps) that need accent colour shorthand at parse time. Inside the
// component we shadow `C` with `useClientPalette()` so the outer wrapper
// adapts to the active theme mode.
const C = { ...ACCENT, bg: "#0b160c", card: "#111e12", border: "#1e3d20", muted: "#6B8F60" };

const BADGE_ICON_EMOJI = {
  sprout: "🌱",
  medal: "🏅",
  trophy: "🏆",
  star: "⭐",
  fire: "🔥",
  crown: "👑",
  heart: "❤️",
  leaf: "🍃",
  flame: "🔥",
  shield: "🛡️",
  water: "💧",
  moon: "🌙",
  meditation: "🧘",
  salad: "🥗",
  runner: "🏃",
  tree: "🌳",
  gem: "💎",
  lightning: "⚡",
  sun: "☀️",
};

const BADGE_LEVEL_COLOR = {
  bronze: "#b45309",
  silver: "#94a3b8",
  gold: "#D4A843",
  platinum: "#22d3ee",
  legend: "#ca8a04",
};

const getBadgeEmoji = (icon) => {
  const value = String(icon || "").trim();
  if (!value) return "🏅";
  // API returns the emoji directly (e.g. "🏆"). Use it as-is when it's not a
  // plain ASCII keyword that needs mapping.
  if (value.codePointAt(0) > 127) return value;
  return BADGE_ICON_EMOJI[value.toLowerCase()] || "🏅";
};

const getBadgeColor = (level) =>
  BADGE_LEVEL_COLOR[String(level || "").toLowerCase()] || "#6DB33F";

const formatBadgeLevel = (level) => {
  const value = String(level || "").trim();
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const LEADERBOARD_RANK_COLORS = {
  1: C.gold,
  2: "#94a3b8",
  3: C.orange,
};

const getLeaderboardRowColor = (entry) => {
  if (entry?.is_current_user) return C.g3;
  return LEADERBOARD_RANK_COLORS[entry?.rank] || "rgba(255,255,255,0.3)";
};

const getLeaderboardChangeColor = (entry) => {
  const change = String(entry?.display_change || "").trim();
  if (entry?.change_type === "absolute") return C.blue;
  if (change.startsWith("+") && change !== "+0%") return "#4ade80";
  if (change.startsWith("-")) return "#f87171";
  return "rgba(255,255,255,0.4)";
};

const formatLeaderboardWeekRange = (start, end) => {
  if (!start || !end) return "";
  try {
    const opts = { month: "short", day: "numeric" };
    const startLabel = new Date(start).toLocaleDateString(undefined, opts);
    const endLabel = new Date(end).toLocaleDateString(undefined, opts);
    return `${startLabel} – ${endLabel}`;
  } catch {
    return `${start} – ${end}`;
  }
};

const createChallengeStateFromItems = (challenges) =>
  challenges.reduce((accumulator, challenge) => {
    const challengeType = String(challenge.challenge_type || "").toLowerCase();
    const isCompleted = Boolean(challenge.is_completed_today);
    const loggedRaw = challenge.value_logged_today;
    const loggedNumber = Number(loggedRaw);
    const hasLogged =
      loggedRaw !== null && loggedRaw !== undefined && Number.isFinite(loggedNumber);
    const timerTarget = Math.max(1, Number(challenge.target_value) || 60);

    let count = 0;
    let done = false;
    let chosen = challengeType === "multi" ? [] : null;
    let timer = challengeType === "timer" ? timerTarget : 0;
    let rating = null;

    if (challengeType === "counter") {
      count = hasLogged ? Math.max(0, loggedNumber) : 0;
    } else if (challengeType === "toggle") {
      done = isCompleted;
    } else if (challengeType === "choice") {
      chosen = isCompleted && hasLogged ? loggedNumber : null;
    } else if (challengeType === "multi") {
      done = isCompleted;
    } else if (challengeType === "timer") {
      done = isCompleted;
      timer = isCompleted ? 0 : timerTarget;
    } else if (challengeType === "rating") {
      rating = isCompleted && hasLogged ? loggedNumber : null;
    }

    accumulator[challenge.challenge_key] = { count, done, chosen, timer, rating };

    return accumulator;
  }, {});

// Per-type fallbacks used only when the API hasn't populated `options` yet.
// Choice/Multi now receive `options: list[str]` from /dashboard/kpis via
// KPIChallengeBrief.options — when present, those labels are rendered directly.
const getChallengeTypeOptionsFallback = (challengeType) => {
  const type = String(challengeType || "").toLowerCase();

  if (type === "choice") return ["Option 1", "Option 2", "Option 3"];
  if (type === "multi") return ["Choice 1", "Choice 2", "Choice 3"];
  if (type === "rating") return ["😞", "😕", "😐", "🙂", "😄"];
  if (type === "toggle") return ["Mark Complete"];

  return [];
};

const resolveOptions = (challenge) => {
  const fromApi = Array.isArray(challenge?.options) ? challenge.options : [];
  if (fromApi.length > 0) return fromApi;
  return getChallengeTypeOptionsFallback(challenge?.challenge_type);
};

function ClientCard({ children, style = {}, borderColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${borderColor || "rgba(255,255,255,0.07)"}`,
        borderRadius: 14,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Btn({ children, active, color = C.g3, onClick, disabled, style = {} }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: active ? color : "transparent",
        color: active ? "#fff" : color,
        border: `1.5px solid ${color}`,
        borderRadius: 9,
        padding: "7px 14px",
        fontSize: 11,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "all 0.2s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default function DashboardChallenges({
  challenges,
  loading,
  error,
  badges,
  badgesLoading = false,
  badgesError = "",
  leaderboard,
  leaderboardLoading = false,
  leaderboardError = "",
}) {
  const dispatch = useDispatch();
  const themed = useClientPalette();
  const timerRef = useRef(null);
  const [activeTimerKey, setActiveTimerKey] = useState("");
  const [challengeState, setChallengeState] = useState({});
  // Per-challenge inline validation message (currently used by multi tiles
  // when the employee hits "Complete" without selecting every option).
  const [validationById, setValidationById] = useState({});
  const { actionLoadingById, actionErrorById, actionResultById } = useSelector(
    (state) => state.dashboard,
  );

  useEffect(() => {
    setChallengeState((current) => {
      const base = createChallengeStateFromItems(challenges);
      const merged = { ...base, ...current };
      // Force server state to win for challenges the API marks complete today
      // so the UI reflects the authoritative value_logged_today.
      for (const challenge of challenges) {
        if (challenge.is_completed_today) {
          merged[challenge.challenge_key] = base[challenge.challenge_key];
        }
      }
      return merged;
    });
  }, [challenges]);

  useEffect(() => {
    if (!activeTimerKey || !challengeState[activeTimerKey]?.timer) {
      return undefined;
    }

    timerRef.current = window.setInterval(() => {
      setChallengeState((current) => {
        const nextTimer = (current[activeTimerKey]?.timer || 0) - 1;

        if (nextTimer <= 0) {
          const completedChallenge = challenges.find(
            (item) => item.challenge_key === activeTimerKey,
          );
          setActiveTimerKey("");
          if (completedChallenge) {
            void handleChallengeAction(completedChallenge, {
              timer_seconds: Math.max(1, Number(completedChallenge.target_value) || 1),
              value_logged: Math.max(1, Number(completedChallenge.target_value) || 1),
            });
          }
          return {
            ...current,
            [activeTimerKey]: {
              ...current[activeTimerKey],
              timer: 0,
              done: true,
            },
          };
        }

        return {
          ...current,
          [activeTimerKey]: {
            ...current[activeTimerKey],
            timer: nextTimer,
          },
        };
      });
    }, 1000);

    return () => window.clearInterval(timerRef.current);
  }, [activeTimerKey, challengeState, challenges]);

  useEffect(() => () => window.clearInterval(timerRef.current), []);

  const updateChallenge = (id, payload) => {
    setChallengeState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...payload,
      },
    }));
  };

  const formatTimer = (seconds) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const handleChallengeAction = async (challenge, values) => {
    dispatch(clearDashboardChallengeActionError(challenge.challenge_key));

    const payload = {
      challenge_id: challenge.challenge_key,
      value_logged: 0,
      toggle_value: false,
      choice_value: 0,
      multi_values: [],
      timer_seconds: 0,
      rating_value: 0,
      ...values,
    };

    const result = await dispatch(postDashboardChallengeAction(payload));
    if (postDashboardChallengeAction.fulfilled.match(result)) {
      dispatch(fetchDashboardKpis());
    }
    return result;
  };

  // Undoes a previously-completed daily challenge. On success we revert the
  // local tile to "pending" and refresh the dashboard so the XP/level cards
  // pick up the (possibly decreased) values from the response's xp block.
  const handleChallengeUndo = async (challenge) => {
    dispatch(clearDashboardChallengeActionError(challenge.challenge_key));
    const result = await dispatch(
      postDashboardChallengeUndo({ challenge_id: challenge.challenge_key }),
    );
    if (postDashboardChallengeUndo.fulfilled.match(result)) {
      updateChallenge(challenge.challenge_key, {
        done: false,
        count: 0,
        chosen:
          String(challenge.challenge_type || "").toLowerCase() === "multi"
            ? []
            : null,
        rating: null,
        timer:
          String(challenge.challenge_type || "").toLowerCase() === "timer"
            ? Math.max(1, Number(challenge.target_value) || 60)
            : 0,
      });
      dispatch(fetchDashboardKpis());
    }
    return result;
  };

  const isDone = (challenge) => {
    if (challenge.is_completed_today) return true;

    const state = challengeState[challenge.challenge_key];
    const challengeType = String(challenge.challenge_type || "").toLowerCase();
    const targetValue = Math.max(1, Number(challenge.target_value) || 1);

    if (!state) return false;
    if (challengeType === "counter") return state.count >= targetValue;
    if (challengeType === "toggle") return state.done;
    if (challengeType === "choice") return state.chosen !== null;
    // Multi is only "done" after the server confirms (is_completed_today,
    // already handled above) — partial selections must NOT mark the tile
    // complete, otherwise the per-option taps would auto-finish it.
    if (challengeType === "multi") return state.done;
    if (challengeType === "timer") return state.done;
    if (challengeType === "rating") return state.rating !== null;
    return false;
  };

  const getXp = (challenge) => {
    if (!isDone(challenge)) return 0;

    if (String(challenge.challenge_type || "").toLowerCase() === "multi") {
      // Multi requires the employee to select every option before completing,
      // so once `done` the chosen array is full and we award full XP. The
      // proportional fallback below stays as a safety net for legacy state.
      const optionCount = Math.max(resolveOptions(challenge).length, 1);
      const chosenCount =
        challengeState[challenge.challenge_key]?.chosen?.length || optionCount;
      return Math.round(
        (Number(challenge.xp_reward) || 0) *
          Math.min(chosenCount / optionCount, 1),
      );
    }

    return Number(challenge.xp_reward) || 0;
  };

  const completedCount = challenges.filter((challenge) => isDone(challenge)).length;
  const earnedXp = challenges.reduce((sum, challenge) => sum + getXp(challenge), 0);

  const wrapperSx = {
    bgcolor: themed.bg,
    color: themed.text,
    borderRadius: 3,
    p: { xs: 1.5, md: 2 },
    fontFamily: "inherit",
    colorScheme: themed.isDark ? "dark" : "light",
  };

  if (loading) {
    return (
      <>
        <Box sx={wrapperSx}>
          <div style={{ fontSize: 11, color: C.muted }}>Loading challenges…</div>
        </Box>
        <ReminderSettings />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Box sx={wrapperSx}>
          <Alert severity="error">{error}</Alert>
        </Box>
        <ReminderSettings />
      </>
    );
  }

  if (!challenges.length) {
    return (
      <>
        <Box sx={wrapperSx}>
          <ClientCard
            style={{
              padding: "24px",
              textAlign: "center",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 4,
              }}
            >
              No active challenges right now
            </div>
            <div style={{ fontSize: 10, color: C.muted }}>
              Your company hasn&apos;t started any KPI programs yet.
            </div>
          </ClientCard>
        </Box>
        <ReminderSettings />
      </>
    );
  }

  return (
    <>
      <Box sx={wrapperSx}>
        {/* STATS BAR */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {[
            ["🔥 Streak", "7 Days", "Day 8 unlocks a badge!", C.orange],
            ["⭐ XP Today", `${earnedXp} pts`, "Complete all for bonus", C.gold],
            ["🌱 Level", "Banyan Sapling", "3 more days → Banyan Tree", C.g3],
            ["✅ Progress", `${completedCount} / ${challenges.length}`, "Active KPI challenges today", C.blue],
          ].map(([lbl, val, sub, col]) => (
            <ClientCard
              key={lbl}
              borderColor={col + "33"}
              style={{ padding: "12px 14px" }}
            >
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>{lbl}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: col }}>{val}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>
                {sub}
              </div>
            </ClientCard>
          ))}
        </div>

        {/* PROGRESS BAR */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9,
              color: C.muted,
              marginBottom: 5,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>Today&apos;s completion</span>
            <span>
              {completedCount}/{challenges.length} active challenges · {earnedXp} XP earned today
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.06)" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 6,
                width: `${challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0}%`,
                background: `linear-gradient(90deg,${C.g2},${C.g3})`,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>

        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>
            Today&apos;s Challenges
            <span
              style={{
                fontSize: 9,
                fontWeight: 400,
                color: "rgba(255,255,255,0.25)",
                marginLeft: 8,
              }}
            >
              — 1 to 3 taps each. Earn XP, build streaks, unlock badges.
            </span>
          </div>
          <div
            style={{
              marginLeft: "auto",
              background: "rgba(107,179,63,0.12)",
              border: "1px solid rgba(107,179,63,0.3)",
              borderRadius: 8,
              padding: "3px 10px",
              fontSize: 9,
              color: C.g3,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {challenges.length} active
          </div>
        </div>

        {/* CHALLENGE CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))",
            gap: 12,
            marginBottom: 22,
          }}
        >
          {challenges.map((challenge) => {
            const challengeType = String(challenge.challenge_type || "").toLowerCase();
            const options = resolveOptions(challenge);
            const targetValue = Math.max(1, Number(challenge.target_value) || 1);
            const state =
              challengeState[challenge.challenge_key] ||
              createChallengeStateFromItems([challenge])[challenge.challenge_key];
            const done = isDone(challenge);
            const xp = getXp(challenge);
            const color = challenge.displayColor || challenge.color || C.g3;
            const actionLoading = Boolean(actionLoadingById[challenge.challenge_key]);
            const actionError = actionErrorById[challenge.challenge_key];
            const actionResult = actionResultById[challenge.challenge_key];
            const completedToday = Boolean(challenge.is_completed_today);

            return (
              <ClientCard
                key={challenge.challenge_key}
                borderColor={done ? color + "66" : color + "22"}
                style={{
                  background: done ? color + "0e" : "rgba(255,255,255,0.025)",
                }}
              >
                {done && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 12,
                      fontSize: 10,
                      fontWeight: 700,
                      color,
                    }}
                  >
                    ✓ +{xp} XP
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                    paddingRight: done ? 56 : 0,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{challenge.icon || "🎯"}</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: done ? color : "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={challenge.name}
                    >
                      {challenge.name}
                    </div>
                    <div style={{ fontSize: 9, color, opacity: 0.7 }}>
                      {challenge.kpi_name ? `${challenge.kpi_name} KPI · ` : ""}
                      {Number(challenge.xp_reward) || 0} XP available
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.42)",
                    marginBottom: 10,
                    lineHeight: 1.5,
                  }}
                >
                  {challenge.description || "Complete this challenge to earn XP."}
                </div>

                {actionResult?.message && (
                  <div style={{ fontSize: 9, color: C.g3, fontWeight: 700, marginBottom: 6 }}>
                    {actionResult.message}
                  </div>
                )}
                {actionError && (
                  <Alert severity="error" sx={{ mb: 1, py: 0, fontSize: 11 }}>
                    {actionError}
                  </Alert>
                )}

                {/* COUNTER */}
                {challengeType === "counter" && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <Btn
                        active={state.count >= targetValue || completedToday}
                        color={color}
                        disabled={
                          completedToday ||
                          state.count >= targetValue ||
                          actionLoading
                        }
                        onClick={async () => {
                          const nextCount = Math.min(targetValue, state.count + 1);
                          updateChallenge(challenge.challenge_key, { count: nextCount });
                          await handleChallengeAction(challenge, {
                            value_logged: nextCount,
                          });
                        }}
                      >
                        {actionLoading ? "Saving…" : completedToday ? "Completed" : "+ 1"}
                      </Btn>
                      <span style={{ fontSize: 15, fontWeight: 800, color }}>
                        {state.count} / {targetValue}
                      </span>
                      {state.count > 0 && !completedToday && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={async () => {
                            const nextCount = Math.max(0, state.count - 1);
                            updateChallenge(challenge.challenge_key, { count: nextCount });
                            await handleChallengeAction(challenge, {
                              value_logged: nextCount,
                            });
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: C.muted,
                            borderRadius: 6,
                            padding: "4px 8px",
                            cursor: actionLoading ? "not-allowed" : "pointer",
                            fontSize: 10,
                          }}
                        >
                          −
                        </button>
                      )}
                    </div>
                    <div style={{ height: 5, borderRadius: 5, background: "rgba(255,255,255,0.06)" }}>
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 5,
                          width: `${(state.count / targetValue) * 100}%`,
                          background: color,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* TOGGLE */}
                {challengeType === "toggle" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Btn
                      active={state.done || completedToday}
                      color={color}
                      disabled={completedToday || state.done || actionLoading}
                      onClick={async () => {
                        updateChallenge(challenge.challenge_key, { done: true });
                        await handleChallengeAction(challenge, {
                          toggle_value: true,
                        });
                      }}
                    >
                      {actionLoading
                        ? "Saving…"
                        : completedToday || state.done
                          ? `✓ Completed`
                          : `⬜ ${options[0]}`}
                    </Btn>
                    {(completedToday || state.done) && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleChallengeUndo(challenge)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.18)",
                          color: "rgba(255,255,255,0.62)",
                          borderRadius: 9,
                          padding: "6px 12px",
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          opacity: actionLoading ? 0.5 : 1,
                        }}
                      >
                        ↩ Undo
                      </button>
                    )}
                  </div>
                )}

                {/* CHOICE */}
                {challengeType === "choice" && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {options.map((opt, i) => (
                      <Btn
                        key={opt}
                        active={state.chosen === i}
                        color={color}
                        disabled={completedToday || actionLoading}
                        onClick={async () => {
                          const nextChoice = state.chosen === i ? null : i;
                          updateChallenge(challenge.challenge_key, { chosen: nextChoice });
                          if (nextChoice !== null) {
                            await handleChallengeAction(challenge, { choice_value: nextChoice });
                          }
                        }}
                      >
                        {opt}
                      </Btn>
                    ))}
                  </div>
                )}

                {/* MULTI */}
                {challengeType === "multi" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {options.map((opt, i) => {
                        const selected = (state.chosen || []).includes(i);
                        return (
                          <Btn
                            key={opt}
                            active={selected || completedToday}
                            color={color}
                            disabled={completedToday || actionLoading}
                            onClick={() => {
                              const arr = state.chosen || [];
                              const nextValues = selected
                                ? arr.filter((x) => x !== i)
                                : [...arr, i];
                              updateChallenge(challenge.challenge_key, {
                                chosen: nextValues,
                              });
                              setValidationById((current) => {
                                if (!current[challenge.challenge_key]) return current;
                                const next = { ...current };
                                delete next[challenge.challenge_key];
                                return next;
                              });
                            }}
                          >
                            {opt}
                          </Btn>
                        );
                      })}
                    </div>
                    {!completedToday && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <Btn
                          color={color}
                          active
                          disabled={actionLoading}
                          onClick={async () => {
                            const chosenArr = state.chosen || [];
                            if (chosenArr.length === 0) {
                              setValidationById((current) => ({
                                ...current,
                                [challenge.challenge_key]:
                                  "Select at least one option that applies before completing.",
                              }));
                              return;
                            }
                            setValidationById((current) => {
                              if (!current[challenge.challenge_key]) return current;
                              const next = { ...current };
                              delete next[challenge.challenge_key];
                              return next;
                            });
                            const result = await handleChallengeAction(challenge, {
                              multi_values: chosenArr,
                            });
                            if (
                              postDashboardChallengeAction.fulfilled.match(result)
                            ) {
                              updateChallenge(challenge.challenge_key, { done: true });
                            }
                          }}
                        >
                          {actionLoading ? "Saving…" : "Complete"}
                        </Btn>
                        <span style={{ fontSize: 10, color: C.muted }}>
                          Select all that apply · {(state.chosen || []).length}/{options.length} chosen
                        </span>
                      </div>
                    )}
                    {validationById[challenge.challenge_key] && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "#fca5a5",
                          fontWeight: 600,
                        }}
                      >
                        {validationById[challenge.challenge_key]}
                      </div>
                    )}
                  </div>
                )}

                {/* TIMER */}
                {challengeType === "timer" && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
                  >
                    {!state.done && !completedToday ? (
                      <>
                        <Btn
                          active={activeTimerKey === challenge.challenge_key}
                          color={color}
                          disabled={
                            completedToday ||
                            Boolean(activeTimerKey) ||
                            actionLoading
                          }
                          onClick={() => setActiveTimerKey(challenge.challenge_key)}
                        >
                          {activeTimerKey === challenge.challenge_key
                            ? "Running…"
                            : "▶ Start Timer"}
                        </Btn>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 800,
                            fontSize: 22,
                            color,
                          }}
                        >
                          {formatTimer(state.timer)}
                        </span>
                      </>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          textAlign: "center",
                          padding: "12px 0",
                          background: "rgba(107,179,63,0.06)",
                          borderRadius: 12,
                          border: `1px solid ${C.g3}33`,
                        }}
                      >
                        <div style={{ fontSize: 22, marginBottom: 4 }}>🧘</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: C.g3 }}>
                          Session Complete!
                        </div>
                        <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>
                          +{Number(challenge.xp_reward) || 0} XP earned
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* RATING */}
                {challengeType === "rating" && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {options.map((em, i) => {
                      const ratingDisabled = completedToday || actionLoading;
                      return (
                        <button
                          key={em}
                          type="button"
                          disabled={ratingDisabled}
                          onClick={async () => {
                            updateChallenge(challenge.challenge_key, { rating: i });
                            await handleChallengeAction(challenge, {
                              rating_value: i,
                              value_logged: i,
                            });
                          }}
                          style={{
                            fontSize: 24,
                            border: "none",
                            background:
                              state.rating === i
                                ? "rgba(52,211,153,0.25)"
                                : "transparent",
                            cursor: ratingDisabled ? "not-allowed" : "pointer",
                            borderRadius: 8,
                            padding: "4px 6px",
                            outline:
                              state.rating === i ? `2px solid ${color}` : "none",
                            opacity: ratingDisabled && state.rating !== i ? 0.5 : 1,
                            transition: "all 0.15s",
                          }}
                        >
                          {em}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ClientCard>
            );
          })}
        </div>

        {/* BADGES + LEADERBOARD */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 14,
          }}
        >
          <ClientCard>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700 }}>🏅 My Badges</div>
              {badges && (badges.total_count || 0) > 0 && (
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: C.g3,
                    background: "rgba(107,179,63,0.12)",
                    border: "1px solid rgba(107,179,63,0.3)",
                    borderRadius: 8,
                    padding: "3px 8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {badges.earned_count || 0} / {badges.total_count} earned
                </div>
              )}
            </div>

            {badgesLoading && (
              <div style={{ fontSize: 11, color: C.muted }}>Loading badges…</div>
            )}

            {!badgesLoading && badgesError && (
              <Alert severity="error" sx={{ py: 0, fontSize: 11 }}>
                {badgesError}
              </Alert>
            )}

            {!badgesLoading && !badgesError && (!badges?.items || badges.items.length === 0) && (
              <div style={{ fontSize: 10, color: C.muted }}>
                No badges available yet.
              </div>
            )}

            {!badgesLoading && !badgesError && Array.isArray(badges?.items) && badges.items.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {badges.items.map((b) => {
                  const color = getBadgeColor(b.level);
                  const emoji = getBadgeEmoji(b.icon);
                  const sublabel =
                    b.kpi_display_name ||
                    formatBadgeLevel(b.level) ||
                    formatBadgeLevel(b.trigger_type);

                  return (
                    <div
                      key={b.badge_key}
                      title={
                        b.earned && b.earned_at
                          ? `Earned ${new Date(b.earned_at).toLocaleDateString()}`
                          : `Locked${b.trigger_value ? ` · target ${b.trigger_value}` : ""}`
                      }
                      style={{
                        background: b.earned ? color + "22" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${b.earned ? color + "55" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 10,
                        padding: "8px 12px",
                        textAlign: "center",
                        minWidth: 90,
                        opacity: b.earned ? 1 : 0.4,
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 3 }}>{emoji}</div>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: b.earned ? color : "rgba(255,255,255,0.35)",
                        }}
                      >
                        {b.label}
                      </div>
                      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)" }}>
                        {sublabel}
                        {!b.earned && " 🔒"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ClientCard>

          <ClientCard>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                🏆 Weekly Leaderboard
              </div>
              {leaderboard?.week_start && leaderboard?.week_end && (
                <div style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>
                  {formatLeaderboardWeekRange(
                    leaderboard.week_start,
                    leaderboard.week_end,
                  )}
                </div>
              )}
            </div>

            {leaderboardLoading && (
              <div style={{ fontSize: 11, color: C.muted }}>Loading leaderboard…</div>
            )}

            {!leaderboardLoading && leaderboardError && (
              <Alert severity="error" sx={{ py: 0, fontSize: 11 }}>
                {leaderboardError}
              </Alert>
            )}

            {!leaderboardLoading &&
              !leaderboardError &&
              (!leaderboard?.items || leaderboard.items.length === 0) && (
                <div style={{ fontSize: 10, color: C.muted }}>
                  No leaderboard data yet for this week.
                </div>
              )}

            {!leaderboardLoading &&
              !leaderboardError &&
              Array.isArray(leaderboard?.items) &&
              leaderboard.items.length > 0 && (
                <>
                  {leaderboard.items.map((entry) => {
                    const rowColor = getLeaderboardRowColor(entry);
                    const changeColor = getLeaderboardChangeColor(entry);
                    return (
                      <div
                        key={entry.user_id ?? `${entry.rank}-${entry.display_name}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "7px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          background: entry.is_current_user
                            ? "rgba(109,179,63,0.08)"
                            : "transparent",
                          borderRadius: entry.is_current_user ? 8 : 0,
                          paddingLeft: entry.is_current_user ? 8 : 0,
                          paddingRight: entry.is_current_user ? 8 : 0,
                        }}
                      >
                        <div
                          style={{
                            width: 80,
                            fontSize: 11,
                            fontWeight: 700,
                            color: rowColor,
                          }}
                        >
                          {entry.rank_label || `${entry.rank}`}
                          {entry.is_current_user && (
                            <span style={{ marginLeft: 6 }}>⬅ You</span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: entry.is_current_user ? C.g3 : "#fff",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={entry.display_name}
                          >
                            {entry.display_name}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: C.muted,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {entry.subtext || entry.level_label || ""}
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            minWidth: 60,
                          }}
                        >
                          <div
                            style={{ fontSize: 13, fontWeight: 700, color: changeColor }}
                          >
                            {entry.display_change || "—"}
                          </div>
                          <div style={{ fontSize: 9, color: C.muted }}>
                            {entry.xp_this_week} XP
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {leaderboard.your_position && (
                    <>
                      <div
                        style={{
                          fontSize: 9,
                          color: C.muted,
                          textAlign: "center",
                          padding: "8px 0 4px",
                          letterSpacing: 1,
                        }}
                      >
                        • • •
                      </div>
                      {(() => {
                        const entry = leaderboard.your_position;
                        const changeColor = getLeaderboardChangeColor(entry);
                        return (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px",
                              borderRadius: 8,
                              background: "rgba(109,179,63,0.1)",
                              border: `1px solid ${C.g3}55`,
                            }}
                          >
                            <div
                              style={{
                                width: 80,
                                fontSize: 11,
                                fontWeight: 700,
                                color: C.g3,
                              }}
                            >
                              {entry.rank_label || `${entry.rank}`}
                              <span style={{ marginLeft: 6 }}>⬅ You</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, color: C.g3 }}>
                                {entry.display_name}
                              </div>
                              <div style={{ fontSize: 9, color: C.muted }}>
                                {entry.subtext || entry.level_label || ""}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", minWidth: 60 }}>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: changeColor,
                                }}
                              >
                                {entry.display_change || "—"}
                              </div>
                              <div style={{ fontSize: 9, color: C.muted }}>
                                {entry.xp_this_week} XP
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </>
              )}
          </ClientCard>
        </div>
      </Box>

      <ReminderSettings />
    </>
  );
}
