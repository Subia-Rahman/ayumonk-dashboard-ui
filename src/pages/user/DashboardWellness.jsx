import { useEffect, useMemo, useState } from "react";
import { Alert, Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import BedtimeRoundedIcon from "@mui/icons-material/BedtimeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import LocalDiningRoundedIcon from "@mui/icons-material/LocalDiningRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SelfImprovementRoundedIcon from "@mui/icons-material/SelfImprovementRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import {
  fetchDashboardKpis,
  fetchSessionSuggestions,
  fetchWellnessTrends,
} from "../../store/dashboardSlice";
import { fetchMySubmissions } from "../../store/sessionSlice";
import { useClientPalette } from "../../utils/clientPalette";

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

const SUGGESTION_TYPE_COLORS = {
  aahar: "#16a34a",
  vihara: "#2563eb",
  nidra: "#7c3aed",
  charya: "#f59e0b",
  manas: "#c026d3",
  ojas: "#0f766e",
};

const C = {
  bg:      "#FBF9F4",
  card:    "#FBF9F4",
  border:  "rgba(31,30,29,0.08)",
  g1:      "#4F6048",
  g2:      "#5E7350",
  g3:      "#6B7F5C",
  g4:      "#93A687",
  white:   "#FFFFFF",
  cream:   "#F5F2EB",
  text:    "#1F1E1D",
  textSub: "#5C5A57",
  muted:   "#6B7F5C",
  orange:  "#B96B47",
  blue:    "#4A7F8C",
  purple:  "#8B7FB0",
  gold:    "#B57F4A",
  teal:    "#5A9B96",
  red:     "#B85A4A",
  pink:    "#c4607a",
};

const DIMENSION_PILLS = {
  nidra:  { bg: "#E8F0E4", color: "#3D5C35" },
  manas:  { bg: "#EDE8F5", color: "#5B3D8A" },
  aahar:  { bg: "#FFF3E0", color: "#8A5C00" },
  vihara: { bg: "#E0F2F1", color: "#006064" },
  charya: { bg: "#FBE9E7", color: "#8A2500" },
  ojas:   { bg: "#F3E5F5", color: "#6A1B9A" },
};

const getDimensionPill = (label = "") =>
  DIMENSION_PILLS[label.toLowerCase().trim().split(/\s+/)[0]] || null;

const formatMetricLabel = (name = "") =>
  name.replace(/\bKPI\b/gi, "").replace(/\s+/g, " ").trim() || "Wellness KPI";

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
const getSuggestionColor = (type, index) =>
  SUGGESTION_TYPE_COLORS[String(type || "").toLowerCase()] ||
  METRIC_COLOR_SET[index % METRIC_COLOR_SET.length];

function ClientCard({ children, style = {}, borderColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#FBF9F4",
        border: `1px solid ${borderColor || "rgba(31,30,29,0.08)"}`,
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
                borderColor || "rgba(31,30,29,0.08)";
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

function WellnessRing({ score = 0, color = "#6DB33F", size = 136 }) {
  const strokeW = 11;
  const r = (size - strokeW) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(107,127,92,0.18)" strokeWidth={strokeW} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

function wellnessStatus(score) {
  if (score >= 85) return { label: "Excellent",       color: "#4ade80" };
  if (score >= 70) return { label: "Great",           color: "#86efac" };
  if (score >= 55) return { label: "Good",            color: "#6DB33F" };
  if (score >= 40) return { label: "Fair",            color: "#D4A843" };
  return              { label: "Needs Attention", color: "#f87171" };
}

function TrendLine({ vals = [], labels = [], color = "#6DB33F", h = 100 }) {
  if (vals.length < 2) {
    return (
      <div style={{ height: h, display: "grid", placeItems: "center",
        color: C.muted, fontSize: 10,
        border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 8 }}>
        No trend data yet
      </div>
    );
  }
  const W = 460, H = h;
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const pad = (mx - mn) * 0.15 || 0.5;
  const lo = mn - pad, hi = mx + pad;
  const px = (i) => 16 + (i / (vals.length - 1)) * (W - 32);
  const py = (v) => 8 + ((hi - v) / (hi - lo)) * (H - 18);
  const pts = vals.map((v, i) => [px(i), py(v)]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pts[0][0]},${H} ${line} ${pts[pts.length - 1][0]},${H}`;
  const baseY = py(vals[0]);
  const step = Math.ceil(labels.length / 6) || 1;
  return (
    <svg width="100%" height={H + 14} viewBox={`0 0 ${W} ${H + 14}`}
      preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="ayumonkTrendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <line x1={16} y1={baseY} x2={W - 16} y2={baseY}
        stroke="rgba(107,127,92,0.35)" strokeWidth="1"
        strokeDasharray="4 4" strokeLinecap="round" />
      <polygon points={area} fill="url(#ayumonkTrendGrad)" />
      <polyline points={line} fill="none"
        stroke={color} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]}
        r="8" fill={color} opacity="0.15" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]}
        r="3.5" fill={color} />
      {labels
        .map((l, i) => ({ l, i }))
        .filter(({ i }) => i % step === 0)
        .map(({ l, i }) => (
          <text key={`lbl-${i}`} x={px(i)} y={H + 12}
            fontSize="8" fill="rgba(107,127,92,0.6)" textAnchor="middle">
            {l}
          </text>
        ))}
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

function KpiTile({ item, sparkValues, onClick }) {
  const trend = item.change === "No trend" ? null : item.change;
  const trendPos = trend && trend.startsWith("+");
  const dimPill = getDimensionPill(item.label);
  return (
    <div
      onClick={onClick}
      style={{
        background: "#FBF9F4",
        border: `1px solid ${item.color}33`,
        borderRadius: 16,
        padding: "13px 14px 11px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
      }}
    >
      {/* Header: icon pill + dimension name pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: item.color + "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            color: item.color,
            flexShrink: 0,
          }}
        >
          {item.icon}
        </span>
        {dimPill ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: dimPill.color,
              background: dimPill.bg,
              padding: "2px 6px",
              borderRadius: 99,
              letterSpacing: 0.15,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </span>
        ) : (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#6B7F5C",
              background: "#E8F0E4",
              padding: "2px 6px",
              borderRadius: 99,
              letterSpacing: 0.15,
              lineHeight: 1.4,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
            }}
            title={item.label}
          >
            {item.label}
          </span>
        )}
      </div>
      {/* Body: score + trend (left) | sparkline (right) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: item.color, lineHeight: 1 }}>
            {Number(item.score).toFixed(1)}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              marginTop: 5,
              color: trend
                ? trendPos ? "#16a34a" : "#dc2626"
                : "#5C5A57",
            }}
          >
            {trend ? `${trendPos ? "▲" : "▼"} ${trend.replace(/^[+-]/, "")}` : "—"}
          </div>
        </div>
        <Sparkline values={sparkValues} color={item.color} w={68} h={30} />
      </div>
      {/* Accent bar */}
      <div
        style={{
          marginTop: 10,
          height: 2,
          borderRadius: 2,
          background: `linear-gradient(to right, ${item.color}66, transparent)`,
        }}
      />
    </div>
  );
}

export default function DashboardWellness() {
  const dispatch = useDispatch();
  const themed = useClientPalette();
  const [trendsPeriod, setTrendsPeriod] = useState("weekly");
  const [moodIndex, setMoodIndex] = useState(null);

  const {
    items: dashboardItems,
    loading: dashboardLoading,
    error: dashboardError,
    suggestions,
    suggestionsLoading,
    suggestionsError,
    trends,
    trendsLoading,
    trendsError,
  } = useSelector((state) => state.dashboard);
  const { mySubmissions } = useSelector((state) => state.session);

  useEffect(() => {
    dispatch(fetchDashboardKpis());
    dispatch(fetchMySubmissions());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchWellnessTrends({ period: trendsPeriod }));
  }, [dispatch, trendsPeriod]);

  const latestSubmissionSessionId = useMemo(() => {
    if (!mySubmissions.length) return "";
    return mySubmissions[0]?.session_id || "";
  }, [mySubmissions]);

  useEffect(() => {
    if (!latestSubmissionSessionId) return;
    dispatch(fetchSessionSuggestions(latestSubmissionSessionId));
  }, [dispatch, latestSubmissionSessionId]);

  const metrics = useMemo(
    () =>
      dashboardItems.map((item, index) => ({
        kpiKey: item.kpi_key ?? null,
        kpiName: item.kpi_name || "",
        label: formatMetricLabel(item.kpi_name),
        score: Number(item.latest_score) || 0,
        progress: clampPercent(item.latest_score),
        change: formatChange(item.trend_percent),
        color: getMetricColor(index),
        icon: getMetricIcon(index),
      })),
    [dashboardItems],
  );

  const sparkValuesByKpi = useMemo(() => {
    const map = {};
    (trends.series || []).forEach((series) => {
      const values = (series.points || []).map((p) => Number(p.average_score) || 0);
      if (series.kpi_key != null) map[`key:${series.kpi_key}`] = values;
      if (series.kpi_name) map[`name:${series.kpi_name}`] = values;
    });
    return map;
  }, [trends.series]);

  const getSparkValues = (metric) =>
    (metric.kpiKey != null && sparkValuesByKpi[`key:${metric.kpiKey}`]) ||
    (metric.kpiName && sparkValuesByKpi[`name:${metric.kpiName}`]) ||
    [];

  const suggestionItems = useMemo(() => {
    return Array.isArray(suggestions?.items) ? suggestions.items : [];
  }, [suggestions]);

  const suggestionTierLabels = useMemo(() => {
    const triggerModes = new Set(
      suggestionItems.flatMap((item) =>
        (item.triggers || []).map((trigger) => trigger.trigger_mode),
      ),
    );

    return {
      hasKpiRisk: triggerModes.has("kpi_risk"),
      hasQuestionScore: triggerModes.has("question_score"),
    };
  }, [suggestionItems]);

  const latestResponse = useMemo(() => {
    return mySubmissions?.[0]?.responses?.[0] || null;
  }, [mySubmissions]);

  const dynamicWellnessData = useMemo(() => {
    if (!latestResponse) return [];
    return latestResponse.kpi_scores.map((kpi, index) => ({
      name: kpi.kpi_name,
      value: Number((kpi.average_score * 20).toFixed(1)),
      rawScore: kpi.average_score,
      color: getMetricColor(index),
    }));
  }, [latestResponse]);

  const overallWellnessScore = useMemo(() => {
    if (!latestResponse) return 0;
    const scores = latestResponse.kpi_scores.map((k) => k.average_score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Number((avg * 20).toFixed(1));
  }, [latestResponse]);

  const trendsMultiSeries = useMemo(
    () =>
      (trends.series || [])
        .map((s) => ({
          id: s.kpi_key ?? s.kpi_name,
          c: s.color || C.g3,
          vals: (s.points || []).map((p) => Number(p.average_score) || 0),
        }))
        .filter((s) => s.vals.length >= 2),
    [trends.series],
  );

  const trendsLabels = useMemo(() => {
    const first = (trends.series || []).find((s) => (s.points || []).length);
    return (first?.points || []).map((p) => p.bucket_label || "");
  }, [trends.series]);

  const topImprovementIds = useMemo(() => {
    return (trends.top_improvements || [])
      .filter((t) => t.delta_percent > 0)
      .slice(0, 2)
      .map((t) => t.kpi_key ?? t.kpi_name);
  }, [trends.top_improvements]);

  return (
    <Box
      sx={{
        bgcolor: themed.bg,
        color: themed.text,
        borderRadius: 3,
        p: { xs: 1.5, md: 2 },
        fontFamily: "inherit",
        colorScheme: themed.isDark ? "dark" : "light",
      }}
    >
      {dashboardError && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {dashboardError}
        </Alert>
      )}

      {!dashboardError && dashboardLoading && (
        <Box sx={{ p: 1, color: C.muted, fontSize: 11 }}>
          Loading wellness metrics…
        </Box>
      )}

      {!dashboardError && !dashboardLoading && metrics.length === 0 && (
        <Box sx={{ p: 1, color: C.muted, fontSize: 11 }}>
          No KPI metrics are available for your dashboard yet.
        </Box>
      )}

      <Box sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: "#6B7F5C",
        textTransform: "uppercase", mb: "12px" }}>
        Wellness Dimensions · Tap for Details
      </Box>

      {!dashboardError && !dashboardLoading && metrics.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: "10px",
            mb: "18px",
          }}
        >
          {metrics.map((item) => (
            <KpiTile
              key={`${item.kpiKey ?? item.label}`}
              item={item}
              sparkValues={getSparkValues(item)}
            />
          ))}
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "190px 1fr 210px" },
          gap: "14px",
          mb: "16px",
        }}
      >
        {/* Wellness Index */}
        <ClientCard>
          <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 12, textAlign: "center" }}>
            Wellness Index
          </div>

          {/* Progress ring with score overlay */}
          <div style={{ position: "relative", display: "flex",
            justifyContent: "center", alignItems: "center" }}>
            <WellnessRing score={overallWellnessScore} color={C.g3} size={136} />
            <div style={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#1F1E1D", lineHeight: 1 }}>
                {overallWellnessScore || "—"}
              </div>
              <div style={{ fontSize: 9, color: "#6B7F5C", marginTop: 3, letterSpacing: 0.5 }}>
                / 100
              </div>
            </div>
          </div>

          {/* Status label */}
          {overallWellnessScore > 0 && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: wellnessStatus(overallWellnessScore).color,
                letterSpacing: 0.2,
              }}>
                {wellnessStatus(overallWellnessScore).label}
              </span>
            </div>
          )}

          {/* Delta pill */}
          {trends.overall?.delta_percent != null && trends.overall.delta_percent !== 0 && (() => {
            const pos = trends.overall.delta_percent > 0;
            return (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <span style={{
                  background: pos ? "#16a34a22" : "#f8717122",
                  border: `1px solid ${pos ? "#4ade8033" : "#f8717133"}`,
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: pos ? "#4ade80" : "#f87171",
                }}>
                  {pos ? "▲" : "▼"} {Math.abs(Math.round(trends.overall.delta_percent))}% from baseline
                </span>
              </div>
            );
          })()}
        </ClientCard>

        {/* Wellness Trends */}
        <ClientCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1F1E1D" }}>Wellness Trends</div>
            <div
              style={{
                display: "flex",
                gap: 3,
                background: "rgba(31,30,29,0.05)",
                border: "1px solid rgba(31,30,29,0.08)",
                borderRadius: 20,
                padding: 3,
              }}
            >
              {["daily", "weekly", "monthly"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTrendsPeriod(v)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "none",
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: trendsPeriod === v ? C.g3 : "transparent",
                    color: trendsPeriod === v ? "#fff" : "#6B7F5C",
                    textTransform: "capitalize",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {trendsError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {trendsError}
            </Alert>
          )}

          {trendsLoading && trendsMultiSeries.length === 0 ? (
            <div
              style={{
                height: 100,
                display: "grid",
                placeItems: "center",
                color: C.muted,
                fontSize: 10,
              }}
            >
              Loading wellness trends…
            </div>
          ) : (
            <TrendLine
              h={100}
              labels={trendsLabels}
              color={C.g3}
              vals={
                trendsMultiSeries.length
                  ? trendsMultiSeries[0].vals.map((_, i) =>
                      trendsMultiSeries.reduce((s, ser) => s + (ser.vals[i] ?? 0), 0) /
                      trendsMultiSeries.length
                    )
                  : []
              }
            />
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 10,
              alignItems: "center",
            }}
          >
            {trends.top_improvements
              .filter((item) => item.delta_percent > 0)
              .slice(0, 2)
              .map((item) => {
                const matched = trends.series.find(
                  (series) =>
                    series.kpi_key === item.kpi_key ||
                    series.kpi_name === item.kpi_name,
                );
                const accent = matched?.color || C.g3;
                return (
                  <div
                    key={`${item.kpi_key || item.kpi_name}-improve`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: accent + "22",
                      borderRadius: 8,
                      padding: "3px 9px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: accent,
                        fontWeight: 700,
                      }}
                    >
                      {item.kpi_name} ▲{Math.round(item.delta_percent)}%
                    </span>
                  </div>
                );
              })}
            {trends.insight && (
              <span style={{ fontSize: 9, color: C.muted }}>{trends.insight}</span>
            )}
          </div>
        </ClientCard>

        {/* Dosha + Mood */}
        <ClientCard>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
            textTransform: "uppercase", color: "#6B7F5C", marginBottom: 6 }}>
            Prakriti · Dosha Balance
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <DonutChart
              slices={[
                { l: "Vata", v: 30, c: "#38bdf8" },
                { l: "Pitta", v: 34, c: "#f97316" },
                { l: "Kapha", v: 36, c: "#22c55e" },
              ]}
              size={108}
            />
          </div>
          {[
            ["Vata", "#38bdf8", 30],
            ["Pitta", "#f97316", 34],
            ["Kapha", "#22c55e", 36],
          ].map(([l, col, v]) => (
            <div
              key={l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 5,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 2,
                    background: col,
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: 10, color: "#1F1E1D" }}>
                  {l}
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: col }}>
                {v}%
              </span>
            </div>
          ))}
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid rgba(31,30,29,0.08)",
            }}
          >
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>
              Today&apos;s Mood Check
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
              {["😞", "😕", "😐", "🙂", "😄"].map((em, i) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setMoodIndex(moodIndex === i ? null : i)}
                  style={{
                    fontSize: 20,
                    border: "none",
                    background:
                      moodIndex === i ? "rgba(107,179,63,0.3)" : "transparent",
                    cursor: "pointer",
                    borderRadius: 6,
                    padding: "2px 4px",
                    outline: moodIndex === i ? `2px solid ${C.g3}` : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
            {moodIndex !== null && (
              <div
                style={{
                  fontSize: 9,
                  color: C.g3,
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                ✓ Mood logged!
              </div>
            )}
          </div>
        </ClientCard>
      </Box>

      {/* Lifestyle Suggestions */}
      <ClientCard
        style={{ background: "#F5F2EB", borderColor: "rgba(107,127,92,0.2)" }}
        borderColor="rgba(107,127,92,0.2)"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12, gap: 6, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
            textTransform: "uppercase", color: "#6B7F5C" }}>
            🌿 Suggestions This Week
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {suggestionTierLabels.hasKpiRisk && (
              <span style={{ fontSize: 8, background: "#E8F0E4", color: "#3D5C35",
                borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>
                Tier 1 = KPI risk
              </span>
            )}
            {suggestionTierLabels.hasQuestionScore && (
              <span style={{ fontSize: 8, background: "#FFF3E0", color: "#8A5C00",
                borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>
                Tier 2 = Question score
              </span>
            )}
          </div>
        </div>

        {suggestionsError && (
          <Alert severity="error" sx={{ mb: 1 }}>{suggestionsError}</Alert>
        )}

        {suggestionsLoading && (
          <div style={{ fontSize: 10, color: "#6B7F5C", padding: "8px 0" }}>
            Loading lifestyle suggestions…
          </div>
        )}

        {!suggestionsLoading && suggestionItems.length === 0 && (
          <div style={{ fontSize: 10, color: "#6B7F5C", padding: "8px 0" }}>
            No lifestyle suggestions are available yet.
          </div>
        )}

        {!suggestionsLoading && suggestionItems.length > 0 && (
          <div style={{ display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
            {suggestionItems.map((item, index) => {
              const accent = getSuggestionColor(item.suggestion_type, index);
              const triggerBadges = (item.triggers || [])
                .slice()
                .sort((left, right) => (left.priority || 0) - (right.priority || 0))
                .slice(0, 2);
              const hasKpiRisk = triggerBadges.some((t) => t.trigger_mode === "kpi_risk");
              const hasQscore  = triggerBadges.some((t) => t.trigger_mode === "question_score");
              return (
                <div
                  key={item.suggestion_id || item.title}
                  style={{ background: "#FBF9F4", borderRadius: 10,
                    padding: "12px 14px", borderLeft: `3px solid ${accent}`,
                    display: "flex", flexDirection: "column", gap: 0 }}
                >
                  {/* Title row */}
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 6, gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1F1E1D" }}>
                      {item.title}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap",
                      justifyContent: "flex-end" }}>
                      {hasKpiRisk && (
                        <span style={{ fontSize: 7.5, background: "rgba(220,38,38,0.08)",
                          color: "#dc2626", borderRadius: 4, padding: "1px 6px",
                          fontWeight: 700 }}>
                          T1 · KPI risk
                        </span>
                      )}
                      {hasQscore && (
                        <span style={{ fontSize: 7.5, background: "#FFF3E0",
                          color: "#8A5C00", borderRadius: 4, padding: "1px 6px",
                          fontWeight: 700 }}>
                          T2 · Q flagged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {!!(item.description || item.body) && (
                    <div style={{ fontSize: 11, color: "#5C5A57", lineHeight: 1.55,
                      marginBottom: 10 }}>
                      {item.description || item.body}
                    </div>
                  )}

                  {/* Trigger badges */}
                  {triggerBadges.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                      {triggerBadges.map((trig, ti) => (
                        <span key={`${item.suggestion_id}-trig-${ti}`}
                          style={{ fontSize: 7.5, background: "#FFF3E0", color: "#8A5C00",
                            borderRadius: 4, padding: "1px 6px",
                            border: "1px solid rgba(181,127,74,0.25)" }}>
                          ⚡{" "}
                          {trig.trigger_mode === "kpi_risk"
                            ? `${trig.kpi_display_name || trig.kpi_key} · ${trig.risk_level || "risk"}`
                            : `${(trig.question_text || trig.question_key || "").slice(0, 28)}${(trig.question_text || "").length > 28 ? "…" : ""} (${trig.question_score || 0})`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom row: time + category pills | Add to plan */}
                  <div style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 6, marginTop: "auto", paddingTop: 4 }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {!!item.duration_mins && (
                        <span style={{ fontSize: 9, background: "#F0EDE5",
                          color: "#5C5A57", borderRadius: 99, padding: "2px 8px",
                          fontWeight: 600 }}>
                          {item.duration_mins} min
                        </span>
                      )}
                      {item.suggestion_type && (
                        <span style={{ fontSize: 9, background: "#E8F0E4",
                          color: "#3D5C35", borderRadius: 99, padding: "2px 8px",
                          fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>
                          {item.suggestion_type}
                        </span>
                      )}
                      {item.difficulty && (
                        <span style={{ fontSize: 9, background: "#F0EDE5",
                          color: "#5C5A57", borderRadius: 99, padding: "2px 8px",
                          fontWeight: 600 }}>
                          {item.difficulty}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      style={{ fontSize: 9, fontWeight: 700, color: "#6B7F5C",
                        background: "transparent", border: "1px solid #6B7F5C",
                        borderRadius: 99, padding: "3px 10px", cursor: "pointer",
                        whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      Add to plan →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ClientCard>
    </Box>
  );
}
