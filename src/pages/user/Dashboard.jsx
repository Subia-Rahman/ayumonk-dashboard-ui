import { useEffect, useMemo, useRef, useState } from "react";
import BedtimeRoundedIcon from "@mui/icons-material/BedtimeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LocalDiningRoundedIcon from "@mui/icons-material/LocalDiningRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SelfImprovementRoundedIcon from "@mui/icons-material/SelfImprovementRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import StarsRoundedIcon from "@mui/icons-material/StarsRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Layout from "../../layouts/commonLayout/Layout";
import DashboardChallenges from "./DashboardChallenges";
import DashboardWellness from "./DashboardWellness";
import { fetchDashboardKpis } from "../../store/dashboardSlice";
import { getRaisedGradient, getSurfaceBackground } from "../../theme";

const METRIC_ICON_SET = [
  <BedtimeRoundedIcon fontSize="small" />,
  <PsychologyRoundedIcon fontSize="small" />,
  <LocalDiningRoundedIcon fontSize="small" />,
  <WaterDropRoundedIcon fontSize="small" />,
  <SpaRoundedIcon fontSize="small" />,
  <DirectionsRunRoundedIcon fontSize="small" />,
  <SelfImprovementRoundedIcon fontSize="small" />,
  <BoltRoundedIcon fontSize="small" />,
  <FavoriteRoundedIcon fontSize="small" />,
];

const METRIC_COLOR_SET = [
  "#7c3aed",
  "#ea580c",
  "#0f766e",
  "#0284c7",
  "#ca8a04",
  "#c026d3",
  "#16a34a",
  "#d946ef",
  "#2563eb",
];

const CHALLENGE_TYPE_COLORS = {
  counter: "#f97316",
  toggle: "#ec4899",
  choice: "#2563eb",
  multi: "#eab308",
  timer: "#8b5cf6",
  rating: "#14b8a6",
};

const formatMetricLabel = (name = "") =>
  name
    .replace(/\bKPI\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "Wellness KPI";

const clampPercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, number));
};

const formatChange = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "No trend";
  return `${number >= 0 ? "+" : ""}${number.toFixed(0)}%`;
};

const getMetricIcon = (index) => METRIC_ICON_SET[index % METRIC_ICON_SET.length];
const getMetricColor = (index) => METRIC_COLOR_SET[index % METRIC_COLOR_SET.length];
const getChallengeColor = (challengeType, index) =>
  CHALLENGE_TYPE_COLORS[String(challengeType || "").toLowerCase()] ||
  METRIC_COLOR_SET[index % METRIC_COLOR_SET.length];

const SUGGESTION_TYPE_COLORS = {
  aahar: "#16a34a",
  vihara: "#2563eb",
  nidra: "#7c3aed",
  charya: "#f59e0b",
  manas: "#c026d3",
  ojas: "#0f766e",
};

const getSuggestionColor = (type, index) =>
  SUGGESTION_TYPE_COLORS[String(type || "").toLowerCase()] ||
  METRIC_COLOR_SET[index % METRIC_COLOR_SET.length];

const getChallengeTypeOptions = (challengeType) => {
  const type = String(challengeType || "").toLowerCase();

  if (type === "choice") {
    return ["Option 1", "Option 2", "Option 3"];
  }

  if (type === "multi") {
    return ["Choice 1", "Choice 2", "Choice 3"];
  }

  if (type === "rating") {
    return ["😞", "😕", "😐", "🙂", "😄"];
  }

  if (type === "toggle") {
    return ["Mark Complete"];
  }

  return [];
};

const createChallengeStateFromItems = (challenges) =>
  challenges.reduce((accumulator, challenge) => {
    const challengeType = String(challenge.challenge_type || "").toLowerCase();

    accumulator[challenge.challenge_key] = {
      count: 0,
      done: false,
      chosen: challengeType === "multi" ? [] : null,
      timer: challengeType === "timer" ? Math.max(1, Number(challenge.target_value) || 60) : 0,
      rating: null,
    };

    return accumulator;
  }, {});

const highlightStats = [
  {
    label: "Wellness score",
    value: "92.5",
    note: "Up from last check-in",
    color: "#0f766e",
    icon: <MonitorHeartRoundedIcon fontSize="small" />,
  },
  {
    label: "XP today",
    value: "340 pts",
    note: "6 of 8 focus steps complete",
    color: "#c2410c",
    icon: <StarsRoundedIcon fontSize="small" />,
  },
  {
    label: "Current level",
    value: "Banyan Sapling",
    note: "3 more days to next milestone",
    color: "#4d7c0f",
    icon: <WorkspacePremiumRoundedIcon fontSize="small" />,
  },
  {
    label: "Active streak",
    value: "7 days",
    note: "Consistency is driving recovery",
    color: "#1d4ed8",
    icon: <EmojiEventsRoundedIcon fontSize="small" />,
  },
];

const trendData = [
  { name: "W1", social: 2.8, hydration: 3.2, energy: 3.4 },
  { name: "W2", social: 3.0, hydration: 3.5, energy: 3.6 },
  { name: "W3", social: 3.2, hydration: 3.7, energy: 3.8 },
  { name: "W4", social: 3.5, hydration: 4.0, energy: 4.0 },
  { name: "W5", social: 3.8, hydration: 4.2, energy: 4.1 },
  { name: "W6", social: 4.0, hydration: 4.4, energy: 4.3 },
  { name: "W7", social: 4.3, hydration: 4.5, energy: 4.4 },
  { name: "W8", social: 4.6, hydration: 4.7, energy: 4.5 },
];

const focusActions = [
  {
    title: "Hydration Mission",
    caption: "Progress KPI",
    detail: "Drink 8 glasses today. You're almost there.",
    accent: "#0284c7",
    progress: 75,
    value: "6 / 8",
  },
  {
    title: "Sleep Before 10 PM",
    caption: "Recovery KPI",
    detail: "One focused habit is improving your sleep consistency.",
    accent: "#7c3aed",
    progress: 68,
    value: "Committed",
  },
  {
    title: "Move Your Body",
    caption: "Activity KPI",
    detail: "Add one quick walk or light session before evening.",
    accent: "#f59e0b",
    progress: 52,
    value: "15 min",
  },
];

const leaderboard = [
  { name: "Priya S.", team: "Engineering - Delhi", delta: "+42%" },
  { name: "Rahul M.", team: "Product - Mumbai", delta: "+38%" },
  { name: "Anjali K.", team: "HR - BLR", delta: "+35%" },
  { name: "Amit R.", team: "Finance - Delhi", delta: "+31%", current: true },
  { name: "Sneha P.", team: "Marketing - Pune", delta: "+28%" },
];

const challengeBadges = [
  { id: "h1", label: "Hydration Hero", icon: "💧", earned: true, level: "Gold", color: "#0284c7" },
  { id: "s1", label: "Sleep Master", icon: "🌙", earned: true, level: "Silver", color: "#7c3aed" },
  { id: "st", label: "Stress Buster", icon: "🧘", earned: false, level: "Bronze", color: "#ea580c" },
  { id: "g1", label: "Green Eater", icon: "🥗", earned: true, level: "Bronze", color: "#16a34a" },
  { id: "a1", label: "Active Star", icon: "🏃", earned: false, level: "Silver", color: "#f59e0b" },
  { id: "b1", label: "Banyan Legend", icon: "🌳", earned: false, level: "Legend", color: "#ca8a04" },
];

function SectionCard({ children, sx }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: getSurfaceBackground(theme),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

const CLIENT_PALETTE = {
  bg: "#0b160c",
  card: "#111e12",
  border: "#1e3d20",
  g1: "#2C5F2D",
  g2: "#4A8C2A",
  g3: "#6DB33F",
  g4: "#97C95C",
  white: "#FFFFFF",
  cream: "#E8F0E0",
  muted: "#6B8F60",
  orange: "#E8924A",
  blue: "#4A90C4",
  purple: "#8B6FCB",
  gold: "#D4A843",
  teal: "#3AADA8",
  red: "#E05050",
  pink: "#f472b6",
};

const C = CLIENT_PALETTE;

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
      onMouseEnter={
        onClick
          ? (e) => {
              e.currentTarget.style.borderColor = (borderColor || C.g3) + "88";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          : undefined
      }
      onMouseLeave={
        onClick
          ? (e) => {
              e.currentTarget.style.borderColor =
                borderColor || "rgba(255,255,255,0.07)";
              e.currentTarget.style.transform = "";
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

function Sparkline({ values = [], color = C.g3, w = 74, h = 16 }) {
  if (!Array.isArray(values) || values.length < 2) {
    return <svg width={w} height={h} />;
  }
  const mn = Math.min(...values) - 0.2;
  const mx = Math.max(...values) + 0.2;
  const range = mx - mn || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - ((v - mn) / range) * h,
  ]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pts[0][0]},${h} ${line} ${pts[pts.length - 1][0]},${h}`;
  return (
    <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
      <polygon points={area} fill={color} opacity="0.1" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="2.4"
        fill={color}
      />
    </svg>
  );
}

function computeDonutArcs(slices) {
  const total = slices.reduce((a, s) => a + (Number(s.v) || 0), 0) || 1;
  let cursor = -Math.PI / 2;
  const arcs = [];
  for (const s of slices) {
    const sw = ((Number(s.v) || 0) / total) * 2 * Math.PI;
    arcs.push({ slice: s, start: cursor, end: cursor + sw, sw });
    cursor += sw;
  }
  return arcs;
}

function DonutChart({ slices, size = 130, cVal, cSub }) {
  if (!slices || slices.length === 0) {
    return <svg width={size} height={size} />;
  }
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const ir = size / 2 - 30;
  const arcs = computeDonutArcs(slices);
  return (
    <svg width={size} height={size}>
      {arcs.map(({ slice: s, start, end, sw }, i) => {
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        const ix1 = cx + ir * Math.cos(start);
        const iy1 = cy + ir * Math.sin(start);
        const ix2 = cx + ir * Math.cos(end);
        const iy2 = cy + ir * Math.sin(end);
        const lg = sw > Math.PI ? 1 : 0;
        return (
          <path
            key={`${s.l}-${i}`}
            d={`M${ix1},${iy1}L${x1},${y1}A${r},${r} 0 ${lg},1 ${x2},${y2}L${ix2},${iy2}A${ir},${ir} 0 ${lg},0 ${ix1},${iy1}Z`}
            fill={s.c}
            stroke={C.bg}
            strokeWidth="2"
          />
        );
      })}
      {cVal !== undefined && cVal !== null && (
        <>
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize="22"
            fontWeight="800"
            fill="#fff"
          >
            {cVal}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill={C.muted}>
            {cSub}
          </text>
        </>
      )}
    </svg>
  );
}

function MultiLine({ series, labels, h = 90, highlighted = [] }) {
  if (!series || !series.length || !series[0].vals?.length) {
    return (
      <div
        style={{
          height: h,
          display: "grid",
          placeItems: "center",
          color: C.muted,
          fontSize: 10,
          border: "1px dashed rgba(255,255,255,0.08)",
          borderRadius: 8,
        }}
      >
        No trend data yet
      </div>
    );
  }
  const all = series.flatMap((s) => s.vals);
  const mn = Math.min(...all) - 0.3;
  const mx = Math.max(...all) + 0.3;
  const W = 460;
  const H = h;
  const px = (i) => 16 + (i / Math.max(1, series[0].vals.length - 1)) * (W - 24);
  const py = (v) => 6 + ((mx - v) / (mx - mn || 1)) * (H - 14);
  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ overflow: "visible" }}
    >
      {series.map((s, si) => {
        const pts = s.vals.map((v, i) => [px(i), py(v)]);
        const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
        const area = `${pts[0][0]},${H} ${line} ${pts[pts.length - 1][0]},${H}`;
        const hi = highlighted.includes(s.id);
        return (
          <g key={`${s.id}-${si}`}>
            {hi && <polygon points={area} fill={s.c} opacity="0.06" />}
            <polyline
              points={line}
              fill="none"
              stroke={s.c}
              strokeWidth={hi ? 2.5 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={hi ? 1 : 0.28}
            />
            <circle
              cx={pts[pts.length - 1][0]}
              cy={pts[pts.length - 1][1]}
              r={hi ? 4 : 2.5}
              fill={s.c}
              opacity={hi ? 1 : 0.4}
            />
          </g>
        );
      })}
      {labels &&
        labels
          .filter((_, i) => i % Math.ceil(labels.length / 7) === 0)
          .map((l, i) => {
            const idx = labels.indexOf(l);
            return (
              <text
                key={`${l}-${i}`}
                x={px(idx)}
                y={H + 2}
                fontSize="7"
                fill="rgba(255,255,255,0.2)"
                textAnchor="middle"
              >
                {l}
              </text>
            );
          })}
    </svg>
  );
}

function KpiTile({ item, sparkValues, selected = false, onClick }) {
  const trend = item.change === "No trend" ? null : item.change;
  const trendPos = trend && trend.startsWith("+");
  return (
    <div
      onClick={onClick}
      style={{
        minWidth: 88,
        flexShrink: 0,
        background: selected ? item.color + "22" : "rgba(255,255,255,0.03)",
        border: `1px solid ${selected ? item.color : item.color + "33"}`,
        borderRadius: 12,
        padding: "10px 8px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 3, color: item.color }}>
        {item.icon}
      </div>
      <div
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 3,
          letterSpacing: 0.2,
          height: 22,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
        title={item.label}
      >
        {item.label}
      </div>
      <div
        style={{ fontSize: 16, fontWeight: 800, color: item.color, lineHeight: 1 }}
      >
        {Number(item.score).toFixed(1)}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          marginTop: 3,
          color: trend ? (trendPos ? "#4ade80" : "#f87171") : "rgba(255,255,255,0.3)",
        }}
      >
        {trend
          ? `${trendPos ? "▲" : "▼"}${trend.replace(/^[+-]/, "")}`
          : "—"}
      </div>
      <div style={{ marginTop: 4, display: "flex", justifyContent: "center" }}>
        <Sparkline values={sparkValues} color={item.color} w={74} h={16} />
      </div>
    </div>
  );
}

function HighlightStat({ item }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(item.color, 0.18),
        bgcolor: alpha(item.color, 0.04),
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Avatar
          sx={{
            bgcolor: alpha(item.color, 0.14),
            color: item.color,
            width: 36,
            height: 36,
          }}
        >
          {item.icon}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {item.label}
          </Typography>
          <Typography
            sx={{
              fontWeight: 800,
              color: item.color,
              fontSize: item.value.length > 10 ? 22 : 30,
              lineHeight: 1.15,
            }}
          >
            {item.value}
          </Typography>
        </Box>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2 }}>
        {item.note}
      </Typography>
    </Paper>
  );
}

function ChallengeActionButton({
  active = false,
  color,
  children,
  disabled = false,
  onClick,
}) {
  return (
    <Button
      variant={active ? "contained" : "outlined"}
      onClick={onClick}
      disabled={disabled}
      sx={{
        textTransform: "none",
        fontWeight: 700,
        borderRadius: 2.5,
        color: active ? "#fff" : color,
        borderColor: alpha(color, 0.35),
        bgcolor: active ? color : alpha(color, 0.06),
        "&:hover": {
          borderColor: color,
          bgcolor: active ? color : alpha(color, 0.12),
        },
      }}
    >
      {children}
    </Button>
  );
}

function ChallengeDashboardContent() {
  const theme = useTheme();
  const timerRef = useRef(null);
  const [timerOn, setTimerOn] = useState(false);
  const [challengeState, setChallengeState] = useState({
    water: { count: 0 },
    sleep: { done: false },
    activity: { chosen: null },
    nutrition: { chosen: [] },
    breathing: { timer: 120, done: false },
    mood: { rating: null },
  });

  useEffect(() => {
    if (!timerOn || challengeState.breathing.timer <= 0) {
      return undefined;
    }

    timerRef.current = window.setInterval(() => {
      setChallengeState((current) => {
        const nextTimer = current.breathing.timer - 1;
        if (nextTimer <= 0) {
          setTimerOn(false);
          return {
            ...current,
            breathing: {
              ...current.breathing,
              timer: 0,
              done: true,
            },
          };
        }

        return {
          ...current,
          breathing: {
            ...current.breathing,
            timer: nextTimer,
          },
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(timerRef.current);
    };
  }, [challengeState.breathing.timer, timerOn]);

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

  const isDone = (id) => {
    const value = challengeState[id];
    if (id === "water") return value.count >= 8;
    if (id === "sleep") return value.done;
    if (id === "activity") return value.chosen !== null;
    if (id === "nutrition") return value.chosen.length > 0;
    if (id === "breathing") return value.done;
    if (id === "mood") return value.rating !== null;
    return false;
  };

  const getXp = (challenge) => {
    if (!isDone(challenge.id)) return 0;
    if (challenge.id === "nutrition") {
      return Math.round(
        challenge.xp *
          ((challengeState.nutrition.chosen?.length || 0) / challenge.options.length),
      );
    }
    return challenge.xp;
  };

  const completedCount = CHALLENGE_DEFS.filter((challenge) => isDone(challenge.id)).length;
  const earnedXp = CHALLENGE_DEFS.reduce((sum, challenge) => sum + getXp(challenge), 0);

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        {[
          {
            label: "Active streak",
            value: "7 Days",
            note: "Day 8 unlocks a badge",
            color: "#ea580c",
          },
          {
            label: "XP today",
            value: `${340 + earnedXp} pts`,
            note: "Complete all 6 for a bonus",
            color: "#ca8a04",
          },
          {
            label: "Current level",
            value: "Banyan Sapling",
            note: "3 more days to Banyan Tree",
            color: "#4d7c0f",
          },
          {
            label: "Progress",
            value: `${completedCount} / 6`,
            note: "Challenges completed today",
            color: "#1d4ed8",
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha(item.color, 0.22),
                background: getRaisedGradient(theme, item.color),
                height: "100%",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 28, fontWeight: 800, color: item.color }}>
                {item.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {item.note}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <SectionCard>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Today&apos;s Challenges
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Inspired by the client reference: quick daily actions, XP, streaks, and badges.
            </Typography>
          </Box>
          <Chip
            label={`${earnedXp} XP earned today`}
            sx={{
              fontWeight: 700,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
            }}
          />
        </Stack>

        <Box sx={{ mb: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 0.75 }}
          >
            <Typography variant="caption" color="text.secondary">
              Today&apos;s completion
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {completedCount}/6 challenges
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(completedCount / CHALLENGE_DEFS.length) * 100}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
              },
            }}
          />
        </Box>

        <Grid container spacing={2}>
          {CHALLENGE_DEFS.map((challenge) => {
            const state = challengeState[challenge.id];
            const done = isDone(challenge.id);
            const xp = getXp(challenge);

            return (
              <Grid key={challenge.id} size={{ xs: 12, md: 6, xl: 4 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    borderColor: alpha(challenge.color, done ? 0.4 : 0.18),
                    background: done
                      ? `linear-gradient(180deg, ${alpha(challenge.color, 0.08)} 0%, ${getSurfaceBackground(theme, theme.palette.mode === "dark" ? 0.98 : 0.94)} 100%)`
                      : getSurfaceBackground(theme),
                    height: "100%",
                  }}
                >
                  <Stack spacing={1.5} sx={{ height: "100%" }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Typography sx={{ fontSize: 24, lineHeight: 1 }}>{challenge.icon}</Typography>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: done ? challenge.color : "text.primary" }}>
                            {challenge.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: challenge.color, fontWeight: 700 }}>
                            {challenge.kpi} · {challenge.xp} XP
                          </Typography>
                        </Box>
                      </Stack>
                      {done && (
                        <Chip
                          size="small"
                          label={`+${xp} XP`}
                          sx={{
                            bgcolor: alpha(challenge.color, 0.12),
                            color: challenge.color,
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {challenge.desc}
                    </Typography>

                    {challenge.type === "counter" && (
                      <Stack spacing={1.25}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <ChallengeActionButton
                            active={state.count >= challenge.target}
                            color={challenge.color}
                            disabled={state.count >= challenge.target}
                            onClick={() =>
                              updateChallenge(challenge.id, {
                                count: Math.min(challenge.target, state.count + 1),
                              })
                            }
                          >
                            {challenge.actionLabel}
                          </ChallengeActionButton>
                          {state.count > 0 && (
                            <Button
                              variant="outlined"
                              onClick={() =>
                                updateChallenge(challenge.id, {
                                  count: Math.max(0, state.count - 1),
                                })
                              }
                              sx={{ minWidth: 0, px: 1.25, borderRadius: 2.5 }}
                            >
                              -
                            </Button>
                          )}
                          <Typography sx={{ fontWeight: 800, color: challenge.color }}>
                            {state.count} / {challenge.target}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={(state.count / challenge.target) * 100}
                          sx={{
                            height: 7,
                            borderRadius: 999,
                            bgcolor: alpha(challenge.color, 0.12),
                            "& .MuiLinearProgress-bar": {
                              bgcolor: challenge.color,
                              borderRadius: 999,
                            },
                          }}
                        />
                      </Stack>
                    )}

                    {challenge.type === "toggle" && (
                      <ChallengeActionButton
                        active={state.done}
                        color={challenge.color}
                        onClick={() => updateChallenge(challenge.id, { done: !state.done })}
                      >
                        {state.done ? `✓ ${challenge.options[0]}` : challenge.options[0]}
                      </ChallengeActionButton>
                    )}

                    {challenge.type === "choice" && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {challenge.options.map((option, index) => (
                          <ChallengeActionButton
                            key={option}
                            active={state.chosen === index}
                            color={challenge.color}
                            onClick={() =>
                              updateChallenge(challenge.id, {
                                chosen: state.chosen === index ? null : index,
                              })
                            }
                          >
                            {option}
                          </ChallengeActionButton>
                        ))}
                      </Stack>
                    )}

                    {challenge.type === "multi" && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {challenge.options.map((option, index) => {
                          const selected = state.chosen.includes(index);
                          return (
                            <ChallengeActionButton
                              key={option}
                              active={selected}
                              color={challenge.color}
                              onClick={() =>
                                updateChallenge(challenge.id, {
                                  chosen: selected
                                    ? state.chosen.filter((value) => value !== index)
                                    : [...state.chosen, index],
                                })
                              }
                            >
                              {option}
                            </ChallengeActionButton>
                          );
                        })}
                      </Stack>
                    )}

                    {challenge.type === "timer" && (
                      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                        {!state.done ? (
                          <>
                            <ChallengeActionButton
                              active={timerOn}
                              color={challenge.color}
                              disabled={timerOn}
                              onClick={() => setTimerOn(true)}
                            >
                              {timerOn ? "Breathing..." : "Start Timer"}
                            </ChallengeActionButton>
                            <Typography
                              sx={{
                                fontFamily: "monospace",
                                fontWeight: 800,
                                fontSize: 24,
                                color: challenge.color,
                              }}
                            >
                              {formatTimer(state.timer)}
                            </Typography>
                          </>
                        ) : (
                          <Typography sx={{ fontWeight: 700, color: challenge.color }}>
                            Breathing complete. Well done.
                          </Typography>
                        )}
                      </Stack>
                    )}

                    {challenge.type === "rating" && (
                      <Stack direction="row" spacing={1}>
                        {challenge.options.map((emoji, index) => (
                          <Button
                            key={emoji}
                            variant={state.rating === index ? "contained" : "outlined"}
                            onClick={() => updateChallenge(challenge.id, { rating: index })}
                            sx={{
                              minWidth: 0,
                              px: 1.2,
                              fontSize: 24,
                              lineHeight: 1,
                              borderRadius: 2.5,
                              borderColor: alpha(challenge.color, 0.3),
                              bgcolor:
                                state.rating === index
                                  ? alpha(challenge.color, 0.14)
                                  : "transparent",
                            }}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </SectionCard>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard sx={{ height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              My Badges
            </Typography>
            <Grid container spacing={1.5}>
              {challengeBadges.map((badge) => (
                <Grid key={badge.id} size={{ xs: 6, sm: 4 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      textAlign: "center",
                      borderColor: badge.earned ? alpha(badge.color, 0.35) : "divider",
                      bgcolor: badge.earned ? alpha(badge.color, 0.08) : "transparent",
                      opacity: badge.earned ? 1 : 0.45,
                      height: "100%",
                    }}
                  >
                    <Typography sx={{ fontSize: 26 }}>{badge.icon}</Typography>
                    <Typography sx={{ mt: 0.75, fontWeight: 700, color: badge.earned ? badge.color : "text.secondary" }}>
                      {badge.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {badge.level}
                      {!badge.earned ? " Locked" : ""}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard sx={{ height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Weekly Leaderboard
            </Typography>
            <Stack spacing={1.2}>
              {leaderboard.map((item, index) => (
                <Paper
                  key={item.name}
                  variant="outlined"
                  sx={{
                    p: 1.4,
                    borderRadius: 2.5,
                    borderColor: item.current ? alpha("#0f766e", 0.3) : "divider",
                    bgcolor: item.current ? alpha("#0f766e", 0.06) : "transparent",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Typography
                        sx={{
                          width: 24,
                          fontWeight: 800,
                          color: index < 3 ? "#c2410c" : "text.secondary",
                        }}
                      >
                        {index + 1}
                      </Typography>
                      <Box>
                        <Typography sx={{ fontWeight: item.current ? 800 : 700 }}>
                          {item.current ? `You (${item.name})` : item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.team}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: item.current ? "#15803d" : "#0f766e",
                      }}
                    >
                      {item.delta}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "challenges" ? "challenges" : "wellness";
  const {
    items: dashboardItems,
    loading: dashboardLoading,
    error: dashboardError,
  } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardKpis());
  }, [dispatch]);

  const challengeItems = useMemo(
    () =>
      dashboardItems.flatMap((item) =>
        (Array.isArray(item.challenges) ? item.challenges : []).map((challenge, challengeIndex) => ({
          ...challenge,
          kpi_name: item.kpi_name,
          displayColor: getChallengeColor(challenge.challenge_type, challengeIndex),
        })),
      ),
    [dashboardItems],
  );
  return (
    <Layout role="user" title="Wellness Dashboard">
      <Stack spacing={2.5}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: C.muted,
            fontSize: 12,
            fontWeight: 600,
            mt: -0.5,
          }}
        >
          <Box component="span" sx={{ fontSize: 14 }}>🌿</Box>
          <Box component="span">
            {activeTab === "challenges"
              ? "Daily Challenges — 1 to 3 taps to complete · Earn XP · Build Streaks · Unlock Badges"
              : "Your Personal Wellness Journey — Nutrition · Lifestyle · Wellness · Dosha-aligned Ayurveda"}
          </Box>
        </Box>

        {activeTab === "wellness" && <DashboardWellness />}

        {activeTab === "challenges" && (
          <DashboardChallenges
            challenges={challengeItems}
            loading={dashboardLoading}
            error={dashboardError}
          />
        )}
      </Stack>
    </Layout>
  );
}
