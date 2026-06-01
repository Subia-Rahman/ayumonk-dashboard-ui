import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { C } from "../../../components/mobile/palette";
import {
  clearDashboardChallengeActionError,
  fetchDashboardKpis,
  postDashboardChallengeAction,
} from "../../../store/dashboardSlice";
import { dimHue } from "../../../components/mobile/dimensionColors";
import { useTokens } from "../../../components/mobile/useTokens";


const BADGES = [
  { id: "h1", label: "Hydration Hero", icon: "💧", earned: true, level: "Gold", color: "#4A90C4" },
  { id: "s1", label: "Sleep Master", icon: "🌙", earned: true, level: "Silver", color: "#8B6FCB" },
  { id: "st", label: "Stress Buster", icon: "🧘", earned: false, level: "Bronze", color: "#C36FA8" },
  { id: "g1", label: "Green Eater", icon: "🥗", earned: true, level: "Bronze", color: "#4F9D5B" },
  { id: "a1", label: "Active Star", icon: "🏃", earned: false, level: "Silver", color: "#4A90C4" },
  { id: "b1", label: "Banyan Legend", icon: "🌳", earned: false, level: "Legend", color: "#3AA8A0" },
];

const LEADERBOARD = [
  { rank: "1st", name: "Priya S.", dept: "Engineering", pct: "+42%", col: C.gold },
  { rank: "2nd", name: "Rahul M.", dept: "Product", pct: "+38%", col: "#94a3b8" },
  { rank: "3rd", name: "Anjali K.", dept: "HR", pct: "+35%", col: C.orange },
  { rank: "4th ← You", name: "Amit R.", dept: "Finance", pct: "+31%", col: C.g3, current: true },
  { rank: "5th", name: "Sneha P.", dept: "Marketing", pct: "+28%", col: "#9E9B97" },
];

// Shown when the company has not configured any challenges yet, so the screen
// always demonstrates the full experience. These are local-only (demo: true) —
// they update UI state but never hit the API. Replace once real data flows.
const FALLBACK_CHALLENGES = [
  { demo: true, challenge_key: "demo_water", challenge_type: "counter", name: "Hydration Mission", description: "Drink 8 glasses of water before evening.", icon: "💧", xp_reward: 50, target_value: 8, kpi_name: "Hydration", displayColor: "#4A90C4" },
  { demo: true, challenge_key: "demo_sleep", challenge_type: "toggle", name: "Sleep Before 10", description: "Commit to a consistent recovery window tonight.", icon: "🌙", xp_reward: 40, target_value: 1, kpi_name: "Sleep", displayColor: "#8B6FCB", options: ["I'll wind down by 10 PM"] },
  { demo: true, challenge_key: "demo_move", challenge_type: "choice", name: "Move Your Body", description: "Pick one form of movement for today.", icon: "🏃", xp_reward: 45, target_value: 1, kpi_name: "Movement", displayColor: "#4F9D5B", options: ["Walk", "Yoga", "Workout"] },
  { demo: true, challenge_key: "demo_breathe", challenge_type: "timer", name: "Mindful Breathing", description: "Two minutes of box breathing to reset.", icon: "🧘", xp_reward: 60, target_value: 120, kpi_name: "Calm", displayColor: "#C36FA8" },
  { demo: true, challenge_key: "demo_mood", challenge_type: "rating", name: "Mood Check-In", description: "How are you feeling right now?", icon: "🪷", xp_reward: 30, target_value: 1, kpi_name: "Mind", displayColor: "#3AA8A0" },
  { demo: true, challenge_key: "demo_greens", challenge_type: "multi", name: "Eat Your Greens", description: "Add greens to each meal you log today.", icon: "🥗", xp_reward: 55, target_value: 1, kpi_name: "Nutrition", displayColor: "#C99A3F", options: ["Breakfast", "Lunch", "Dinner"] },
];

const getOptions = (type) => {
  const t = String(type || "").toLowerCase();
  if (t === "choice") return ["Option 1", "Option 2", "Option 3"];
  if (t === "multi") return ["Choice 1", "Choice 2", "Choice 3"];
  if (t === "rating") return ["😞", "😕", "😐", "🙂", "😄"];
  if (t === "toggle") return ["Mark Complete"];
  return [];
};

const initState = (challenges) =>
  challenges.reduce((acc, ch) => {
    const t = String(ch.challenge_type || "").toLowerCase();
    acc[ch.challenge_key] = {
      count: 0,
      done: false,
      chosen: t === "multi" ? [] : null,
      timer: t === "timer" ? Math.max(1, Number(ch.target_value) || 60) : 0,
      rating: null,
    };
    return acc;
  }, {});

const fmtTimer = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#6B7F5C",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function ActionBtn({ children, active, color = C.g3, onClick, disabled, style = {} }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: active ? color : "transparent",
        color: active ? "#fff" : color,
        border: `1.5px solid ${color}`,
        borderRadius: 10,
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "all 0.2s",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Step-sync keyframes (injected once).
let stepStylesInjected = false;
function injectStepStyles() {
  if (stepStylesInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.dataset.ayumonkSteps = "true";
  tag.textContent =
    "@keyframes ayuStepPulse{0%{transform:scale(.7);opacity:.5}100%{transform:scale(1.7);opacity:0}}" +
    "@keyframes ayuRunnerBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}" +
    "@keyframes ayuPhoneShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}" +
    "@keyframes ayuLiveBlink{0%,100%{opacity:1}50%{opacity:.25}}";
  document.head.appendChild(tag);
  stepStylesInjected = true;
}

// Step Sync sheet — connects "phone health data" and reveals the day live.
// Demo numbers for now (6,240 / 8,000); wire to Apple Health / Health Connect
// or your backend step field when available.
function StepsSheet({ t, onClose }) {
  injectStepStyles();
  const GOAL = 8000;
  const TARGET = 6240;
  const [phase, setPhase] = useState("idle"); // idle | connecting | synced
  const [steps, setSteps] = useState(0);
  const connect = () => {
    if (phase !== "idle") return;
    setPhase("connecting");
    setTimeout(() => setPhase("synced"), 1500);
  };
  useEffect(() => {
    if (phase !== "synced") return undefined;
    let raf;
    const t0 = performance.now();
    const dur = 1700;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setSteps(Math.round(TARGET * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);
  const synced = phase === "synced";
  const pct = Math.min(100, (steps / GOAL) * 100);
  const SIZE = 200;
  const TH = 18;
  const R = (SIZE - TH) / 2;
  const CIRC = 2 * Math.PI * R;
  const off = CIRC - (pct / 100) * CIRC;
  const ang = ((-90 + (pct / 100) * 360) * Math.PI) / 180;
  const mx = SIZE / 2 + R * Math.cos(ang);
  const my = SIZE / 2 + R * Math.sin(ang);
  const dist = (steps * 0.000762).toFixed(2);
  const kcal = Math.round(steps * 0.04);
  const activeMin = Math.round(steps / 130);
  const toGo = Math.max(0, GOAL - steps);
  const hourly = [1, 2, 4, 3, 6, 9, 5, 12, 8, 14, 7, 4];
  const hmax = Math.max(...hourly);
  const stats = [
    { l: "Distance", v: synced ? dist : "0.00", u: "km", c: "#4A90C4" },
    { l: "Calories", v: synced ? kcal : 0, u: "kcal", c: "#E0935C" },
    { l: "Active", v: synced ? activeMin : 0, u: "min", c: "#4F9D5B" },
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,20,12,0.5)" }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          background: t.card2, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: "92%", overflowY: "auto", paddingBottom: 26,
        }}
      >
        <div style={{ width: 38, height: 4.5, borderRadius: 999, background: t.border, margin: "10px auto 6px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 20px 14px" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 8 }}>
              🏃 Step Sync
              {synced && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: "#4F9D5B", background: "rgba(79,157,91,0.14)", borderRadius: 999, padding: "2px 8px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F9D5B", animation: "ayuLiveBlink 1.4s ease-in-out infinite" }} />
                  LIVE
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: t.faint, marginTop: 2 }}>
              {synced ? "Streaming from Apple Health · today" : "Connect your phone to auto-track"}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${t.border}`, background: t.inset, color: t.muted, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ display: "grid", placeItems: "center", padding: "6px 0 14px" }}>
          <div style={{ position: "relative", width: SIZE, height: SIZE }}>
            <svg width={SIZE} height={SIZE}>
              <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={t.inset} strokeWidth={TH} />
              <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#E0935C" strokeWidth={TH} strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={off} transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} style={{ transition: "stroke-dashoffset .2s linear" }} />
            </svg>
            {synced && (
              <div style={{ position: "absolute", left: mx - 17, top: my - 17, width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#E0935C,#C99A3F)", display: "grid", placeItems: "center", fontSize: 17, boxShadow: "0 4px 12px rgba(224,147,92,0.6)", animation: "ayuRunnerBob 1s ease-in-out infinite" }}>🏃</div>
            )}
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
              {!synced ? (
                <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
                  <span style={{ position: "absolute", width: 64, height: 64, borderRadius: "50%", border: `2px solid ${C.g3}`, opacity: 0, animation: "ayuStepPulse 2.2s ease-out infinite" }} />
                  <span style={{ position: "absolute", width: 64, height: 64, borderRadius: "50%", border: `2px solid ${C.g3}`, opacity: 0, animation: "ayuStepPulse 2.2s ease-out infinite", animationDelay: "1.1s" }} />
                  <div style={{ fontSize: 46, position: "relative", animation: phase === "connecting" ? "ayuPhoneShake .4s ease-in-out infinite" : "none" }}>📱</div>
                  <div style={{ fontSize: 11, color: t.faint, marginTop: 6, fontWeight: 600 }}>{phase === "connecting" ? "Connecting…" : "Not synced"}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: t.text, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{steps.toLocaleString()}</div>
                  <div style={{ fontSize: 11.5, color: t.faint, marginTop: 4, fontWeight: 600 }}>steps · {Math.round(pct)}% of {GOAL.toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: "4px 20px 0" }}>
          {!synced ? (
            <button type="button" onClick={connect} disabled={phase === "connecting"} style={{ width: "100%", border: "none", cursor: "pointer", fontFamily: "inherit", background: "linear-gradient(135deg,#E0935C,#C99A3F)", color: "#fff", fontSize: 14, fontWeight: 800, borderRadius: 13, padding: 14, boxShadow: "0 10px 22px -8px rgba(224,147,92,0.7)", opacity: phase === "connecting" ? 0.7 : 1 }}>
              {phase === "connecting" ? "Connecting to Health…" : "🔗 Connect Health"}
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(79,157,91,0.1)", border: "1px solid rgba(79,157,91,0.3)", borderRadius: 13, padding: "12px 15px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 12.5, color: "#4F9D5B" }}><span style={{ fontSize: 15 }}>✓</span> Synced with Apple Health</span>
              <button type="button" onClick={() => { setPhase("idle"); setSteps(0); }} style={{ background: "transparent", border: "none", color: t.faint, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>Disconnect</button>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "16px 20px 8px" }}>
          {stats.map((st) => (
            <div key={st.l} style={{ background: t.inset, borderRadius: 13, padding: "13px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: st.c, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{st.v}</div>
              <div style={{ fontSize: 9.5, color: t.faint, marginTop: 3 }}>{st.u}</div>
              <div style={{ fontSize: 10.5, color: t.muted, fontWeight: 600, marginTop: 1 }}>{st.l}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "4px 20px 8px" }}>
          <SectionLabel>Today's activity · hourly</SectionLabel>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 76, padding: "6px 2px 0" }}>
            {hourly.map((h, i) => (
              <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", borderRadius: "5px 5px 2px 2px", minHeight: 4, background: "linear-gradient(180deg,#E0935C,#C99A3F)", height: (synced ? (h / hmax) * 100 : 5) + "%", opacity: synced ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: t.faint, marginTop: 5 }}>
            <span>6a</span><span>12p</span><span>6p</span><span>now</span>
          </div>
        </div>
        <div style={{ margin: "8px 20px 8px", padding: "13px 15px", borderRadius: 14, background: `${C.g3}1a`, display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ fontSize: 22 }}>{synced ? "🎯" : "💤"}</span>
          <div style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.45 }}>
            {synced ? (
              <>You're <b style={{ color: C.g3 }}>{Math.round(pct)}%</b> to goal — <b style={{ color: C.g3 }}>{toGo.toLocaleString()}</b> steps to auto-complete the challenge.</>
            ) : (
              <>Enable sync and your steps auto-complete this challenge — no manual logging.</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Challenges() {
  const t = useTokens();
  const dispatch = useDispatch();
  const timerRef = useRef(null);
  const [activeTimerKey, setActiveTimerKey] = useState("");
  const [challengeState, setChallengeState] = useState({});
  const [stepsOpen, setStepsOpen] = useState(false);

  const {
    items: dashboardItems,
    loading,
    error,
    actionLoadingById,
    actionErrorById,
    actionResultById,
  } = useSelector((s) => s.dashboard);

  const apiChallengeItems = dashboardItems.flatMap((item) =>
    (Array.isArray(item.challenges) ? item.challenges : []).map(
      (ch, idx) => ({
        ...ch,
        kpi_name: item.kpi_name,
        displayColor: dimHue(item.kpi_name),
      }),
    ),
  );
  // Fall back to the demo set so the screen is never empty during rollout.
  const challengeItems =
    apiChallengeItems.length > 0 ? apiChallengeItems : FALLBACK_CHALLENGES;

  useEffect(() => {
    dispatch(fetchDashboardKpis());
  }, [dispatch]);

  useEffect(() => {
    setChallengeState((cur) => ({ ...initState(challengeItems), ...cur }));
  }, [dashboardItems]);

  useEffect(() => {
    if (!activeTimerKey || !challengeState[activeTimerKey]?.timer) return undefined;
    timerRef.current = window.setInterval(() => {
      setChallengeState((cur) => {
        const next = (cur[activeTimerKey]?.timer || 0) - 1;
        if (next <= 0) {
          const ch = challengeItems.find((c) => c.challenge_key === activeTimerKey);
          setActiveTimerKey("");
          if (ch && !ch.demo) {
            void dispatch(
              postDashboardChallengeAction({
                challenge_id: ch.challenge_key,
                timer_seconds: Math.max(1, Number(ch.target_value) || 1),
                value_logged: Math.max(1, Number(ch.target_value) || 1),
                toggle_value: false, choice_value: 0, multi_values: [], rating_value: 0,
              }),
            );
          }
          return { ...cur, [activeTimerKey]: { ...cur[activeTimerKey], timer: 0, done: true } };
        }
        return { ...cur, [activeTimerKey]: { ...cur[activeTimerKey], timer: next } };
      });
    }, 1000);
    return () => window.clearInterval(timerRef.current);
  }, [activeTimerKey]);

  useEffect(() => () => window.clearInterval(timerRef.current), []);

  const patch = (id, payload) =>
    setChallengeState((cur) => ({ ...cur, [id]: { ...cur[id], ...payload } }));

  const act = async (ch, values) => {
    if (ch.demo) return undefined; // demo items are local-only
    dispatch(clearDashboardChallengeActionError(ch.challenge_key));
    const result = await dispatch(
      postDashboardChallengeAction({
        challenge_id: ch.challenge_key,
        value_logged: 0, toggle_value: false,
        choice_value: 0, multi_values: [],
        timer_seconds: 0, rating_value: 0,
        ...values,
      }),
    );
    if (postDashboardChallengeAction.fulfilled.match(result)) dispatch(fetchDashboardKpis());
    return result;
  };

  const isDone = (ch) => {
    const st = challengeState[ch.challenge_key];
    if (!st) return false;
    const t = String(ch.challenge_type || "").toLowerCase();
    const tv = Math.max(1, Number(ch.target_value) || 1);
    if (t === "counter") return st.count >= tv;
    if (t === "toggle") return st.done;
    if (t === "choice") return st.chosen !== null;
    if (t === "multi") return st.chosen.length > 0;
    if (t === "timer") return st.done;
    if (t === "rating") return st.rating !== null;
    return false;
  };

  const getXp = (ch) => {
    if (!isDone(ch)) return 0;
    if (String(ch.challenge_type || "").toLowerCase() === "multi") {
      const opts = Math.max((ch.options || getOptions(ch.challenge_type)).length, 1);
      return Math.round(
        (Number(ch.xp_reward) || 0) *
          ((challengeState[ch.challenge_key]?.chosen?.length || 0) / opts),
      );
    }
    return Number(ch.xp_reward) || 0;
  };

  const completedCount = challengeItems.filter(isDone).length;
  const earnedXp = challengeItems.reduce((s, ch) => s + getXp(ch), 0);
  const pctDone = challengeItems.length > 0 ? (completedCount / challengeItems.length) * 100 : 0;

  if (loading && challengeItems.length === 0) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: t.muted }}>Loading challenges…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ margin: "16px", padding: "14px", background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 12, color: "#fca5a5", fontSize: 12 }}>
        {error}
      </div>
    );
  }

  if (!loading && challengeItems.length === 0) {
    return (
      <div style={{ margin: "16px" }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "28px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.sub, marginBottom: 6 }}>
            No active challenges
          </div>
          <div style={{ fontSize: 12, color: t.muted }}>
            Your company hasn't started any KPI programs yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, minHeight: "100%", paddingBottom: 16 }}>
      {/* Page header */}
      <div style={{ padding: "10px 16px 16px" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>
          🎯 Challenges
        </div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>
          Earn XP · build streaks · unlock badges
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "0 16px 16px" }}>
        {[
          { l: "Streak", v: "7 Days", i: "🔥", c: C.orange },
          { l: "XP Today", v: `${earnedXp} pts`, i: "⭐", c: C.gold },
          { l: "Progress", v: `${completedCount}/${challengeItems.length}`, i: "✅", c: C.blue },
        ].map((s) => (
          <div
            key={s.l}
            style={{ background: t.card, border: `1px solid ${s.c}28`, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}
          >
            <div style={{ fontSize: 18, marginBottom: 5 }}>{s.i}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: s.c, lineHeight: 1.1 }}>
              {s.v}
            </div>
            <div style={{ fontSize: 10, color: t.muted, marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ margin: "0 16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
          <span style={{ fontSize: 12, color: t.muted }}>Today's completion</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.g3 }}>
            {completedCount}/{challengeItems.length}
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 7, background: "rgba(31,30,29,0.08)" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 7,
              width: `${pctDone}%`,
              background: `linear-gradient(90deg, ${C.g2}, ${C.g3})`,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Step sync — connected activity */}
      <div style={{ padding: "0 16px 20px" }}>
        <SectionLabel>📲 Connected activity</SectionLabel>
        <div
          onClick={() => setStepsOpen(true)}
          role="button"
          tabIndex={0}
          style={{ background: t.card, border: "1px solid rgba(224,147,92,0.32)", borderRadius: 16, padding: "15px 16px", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: "linear-gradient(135deg, rgba(224,147,92,0.18), rgba(201,154,63,0.18))", display: "grid", placeItems: "center", fontSize: 24 }}>🏃</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>8,000 Steps</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#E0935C", lineHeight: 1 }}>6,240<span style={{ fontSize: 11, color: t.faint, fontWeight: 600 }}> /8,000</span></span>
              </div>
              <span style={{ display: "inline-block", marginTop: 5, fontSize: 11, fontWeight: 600, color: "#C0844A", background: "rgba(224,147,92,0.12)", borderRadius: 6, padding: "2px 8px" }}>▢ Enable sync to auto-complete</span>
            </div>
          </div>
          <div style={{ height: 9, borderRadius: 7, background: t.track, marginTop: 13, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "78%", borderRadius: 7, background: "linear-gradient(90deg,#C99A3F,#E0935C)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9, gap: 8 }}>
            <span style={{ fontSize: 10.5, color: t.faint }}>Manual tracking not available — enable health sync</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.g3, whiteSpace: "nowrap" }}>Tap to sync →</span>
          </div>
        </div>
      </div>

      {/* Challenge cards */}
      <div style={{ padding: "0 16px 20px" }}>
        <SectionLabel>Today's Challenges · {challengeItems.length} active</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {challengeItems.map((ch) => {
            const type = String(ch.challenge_type || "").toLowerCase();
            const opts = ch.options || getOptions(ch.challenge_type);
            const tv = Math.max(1, Number(ch.target_value) || 1);
            const st = challengeState[ch.challenge_key] || initState([ch])[ch.challenge_key];
            const done = isDone(ch);
            const xp = getXp(ch);
            const color = ch.displayColor || C.g3;
            const busy = Boolean(actionLoadingById[ch.challenge_key]);
            const aErr = actionErrorById[ch.challenge_key];
            const aOk = actionResultById[ch.challenge_key];

            return (
              <div
                key={ch.challenge_key}
                style={{
                  background: done ? `${color}0a` : t.card,
                  borderRadius: 16,
                  border: `1px solid ${done ? color + "55" : color + "22"}`,
                  padding: "16px 16px",
                  position: "relative",
                }}
              >
                {done && (
                  <div
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      fontSize: 12,
                      fontWeight: 700,
                      color,
                    }}
                  >
                    ✓ +{xp} XP
                  </div>
                )}

                {/* Title row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10, paddingRight: done ? 64 : 0 }}>
                  <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>
                    {ch.icon || "🎯"}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: done ? color : t.text,
                        marginBottom: 3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ch.name}
                    </div>
                    <div style={{ fontSize: 11, color, opacity: 0.75 }}>
                      {ch.kpi_name ? `${ch.kpi_name} · ` : ""}
                      {Number(ch.xp_reward) || 0} XP
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: 12,
                    color: t.sub,
                    lineHeight: 1.55,
                    marginBottom: 14,
                  }}
                >
                  {ch.description || "Complete this challenge to earn XP."}
                </div>

                {/* Feedback */}
                {aOk?.message && (
                  <div style={{ fontSize: 12, color: C.g3, fontWeight: 700, marginBottom: 8 }}>
                    {aOk.message}
                  </div>
                )}
                {aErr && (
                  <div
                    style={{
                      marginBottom: 10,
                      padding: "8px 12px",
                      background: "rgba(248,113,113,.08)",
                      border: "1px solid rgba(248,113,113,.3)",
                      borderRadius: 10,
                      color: "#fca5a5",
                      fontSize: 12,
                    }}
                  >
                    {aErr}
                  </div>
                )}

                {/* ── COUNTER ── */}
                {type === "counter" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <ActionBtn
                        active={st.count >= tv}
                        color={color}
                        disabled={st.count >= tv || busy}
                        onClick={async () => {
                          const next = Math.min(tv, st.count + 1);
                          patch(ch.challenge_key, { count: next });
                          await act(ch, { value_logged: next });
                        }}
                      >
                        {busy ? "Saving…" : "+ 1"}
                      </ActionBtn>
                      <span style={{ fontSize: 16, fontWeight: 800, color }}>
                        {st.count} / {tv}
                      </span>
                      {st.count > 0 && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            const next = Math.max(0, st.count - 1);
                            patch(ch.challenge_key, { count: next });
                            await act(ch, { value_logged: next });
                          }}
                          style={{
                            background: "transparent",
                            border: `1px solid ${t.border}`,
                            color: t.muted,
                            borderRadius: 8,
                            padding: "6px 10px",
                            cursor: busy ? "not-allowed" : "pointer",
                            fontSize: 13,
                            fontFamily: "inherit",
                          }}
                        >
                          −
                        </button>
                      )}
                    </div>
                    <div style={{ height: 6, borderRadius: 6, background: "rgba(31,30,29,0.06)" }}>
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 6,
                          width: `${(st.count / tv) * 100}%`,
                          background: color,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* ── TOGGLE ── */}
                {type === "toggle" && (
                  <ActionBtn
                    active={st.done}
                    color={color}
                    disabled={busy}
                    onClick={async () => {
                      const next = !st.done;
                      patch(ch.challenge_key, { done: next });
                      await act(ch, { toggle_value: next });
                    }}
                  >
                    {busy ? "Saving…" : st.done ? `✓ ${opts[0]}` : `⬜ ${opts[0]}`}
                  </ActionBtn>
                )}

                {/* ── CHOICE ── */}
                {type === "choice" && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {opts.map((opt, i) => (
                      <ActionBtn
                        key={opt}
                        active={st.chosen === i}
                        color={color}
                        disabled={busy}
                        onClick={async () => {
                          const next = st.chosen === i ? null : i;
                          patch(ch.challenge_key, { chosen: next });
                          if (next !== null) await act(ch, { choice_value: next });
                        }}
                      >
                        {opt}
                      </ActionBtn>
                    ))}
                  </div>
                )}

                {/* ── MULTI ── */}
                {type === "multi" && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {opts.map((opt, i) => {
                      const sel = (st.chosen || []).includes(i);
                      return (
                        <ActionBtn
                          key={opt}
                          active={sel}
                          color={color}
                          disabled={busy}
                          onClick={async () => {
                            const arr = st.chosen || [];
                            const next = sel ? arr.filter((x) => x !== i) : [...arr, i];
                            patch(ch.challenge_key, { chosen: next });
                            await act(ch, { multi_values: next });
                          }}
                        >
                          {opt}
                        </ActionBtn>
                      );
                    })}
                  </div>
                )}

                {/* ── TIMER ── */}
                {type === "timer" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    {!st.done ? (
                      <>
                        <ActionBtn
                          active={activeTimerKey === ch.challenge_key}
                          color={color}
                          disabled={Boolean(activeTimerKey) || busy}
                          onClick={() => setActiveTimerKey(ch.challenge_key)}
                        >
                          {activeTimerKey === ch.challenge_key ? "Running…" : "▶ Start Timer"}
                        </ActionBtn>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 800,
                            fontSize: 24,
                            color,
                          }}
                        >
                          {fmtTimer(st.timer)}
                        </span>
                      </>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          textAlign: "center",
                          padding: "14px 0",
                          background: "rgba(107,179,63,.06)",
                          borderRadius: 12,
                          border: `1px solid ${C.g3}33`,
                        }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 5 }}>🧘</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.g3 }}>
                          Session Complete!
                        </div>
                        <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>
                          +{Number(ch.xp_reward) || 0} XP earned
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── RATING ── */}
                {type === "rating" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {opts.map((em, i) => (
                      <button
                        key={em}
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          patch(ch.challenge_key, { rating: i });
                          await act(ch, { rating_value: i, value_logged: i });
                        }}
                        style={{
                          fontSize: 26,
                          border: "none",
                          background: st.rating === i ? `${color}1f` : "transparent",
                          cursor: busy ? "not-allowed" : "pointer",
                          borderRadius: 10,
                          padding: "4px 6px",
                          outline: st.rating === i ? `2px solid ${color}` : "none",
                          transition: "all 0.15s",
                          fontFamily: "inherit",
                        }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div style={{ padding: "0 16px 20px" }}>
        <SectionLabel>🏅 My Badges</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {BADGES.map((b) => (
            <div
              key={b.id}
              style={{
                background: b.earned ? `${b.color}18` : t.inset,
                border: `1px solid ${b.earned ? b.color + "44" : t.border}`,
                borderRadius: 12,
                padding: "12px 8px",
                textAlign: "center",
                opacity: b.earned ? 1 : 0.45,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 5 }}>{b.icon}</div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: b.earned ? b.color : t.faint,
                  marginBottom: 2,
                }}
              >
                {b.label}
              </div>
              <div style={{ fontSize: 10, color: t.faint }}>
                {b.level}
                {!b.earned && " 🔒"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ padding: "0 16px 16px" }}>
        <SectionLabel>🏆 Weekly Leaderboard</SectionLabel>
        <div
          style={{
            background: t.card,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            overflow: "hidden",
          }}
        >
          {LEADERBOARD.map((row, i) => (
            <div
              key={row.rank}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 16px",
                borderBottom: i < LEADERBOARD.length - 1 ? `1px solid rgba(31,30,29,0.06)` : "none",
                background: row.current ? "rgba(109,179,63,.04)" : "transparent",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: row.col,
                  minWidth: 56,
                }}
              >
                {row.rank}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: row.current ? 700 : 400,
                    color: row.current ? C.g3 : t.text,
                    marginBottom: 2,
                  }}
                >
                  {row.name}
                </div>
                <div style={{ fontSize: 11, color: t.muted }}>{row.dept}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: row.col }}>
                {row.pct}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Sync sheet */}
      {stepsOpen && <StepsSheet t={t} onClose={() => setStepsOpen(false)} />}
    </div>
  );
}
