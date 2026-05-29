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

      {!dashboardError && !dashboardLoading && metrics.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: "8px",
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
          <div
            style={{
              fontSize: 9,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Wellness Index
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <DonutChart
              slices={dynamicWellnessData.map((d) => ({
                l: d.name,
                v: d.value,
                c: d.color,
              }))}
              size={130}
              cVal={overallWellnessScore || "—"}
              cSub="/ 100"
            />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "center",
              marginTop: 8,
            }}
          >
            {dynamicWellnessData.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  fontSize: 8,
                  color: "rgba(255,255,255,0.38)",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 1,
                    background: s.color,
                    display: "inline-block",
                  }}
                />
                {s.name}
              </div>
            ))}
          </div>
          {trends.overall?.delta_percent ? (
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <span
                style={{
                  background: "#16a34a22",
                  borderRadius: 8,
                  padding: "3px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4ade80",
                }}
              >
                {trends.overall.delta_percent >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(Math.round(trends.overall.delta_percent))}% from baseline
              </span>
            </div>
          ) : null}
        </ClientCard>

        {/* Wellness Trends */}
        <ClientCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Wellness Trends</div>
              <div style={{ fontSize: 9, color: C.muted }}>
                Bold lines = most improved recently
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 3,
                background: "rgba(0,0,0,0.3)",
                borderRadius: 8,
                padding: 3,
              }}
            >
              {["daily", "weekly", "monthly"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTrendsPeriod(v)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: trendsPeriod === v ? C.g3 : "transparent",
                    color: trendsPeriod === v ? "#fff" : "rgba(255,255,255,0.4)",
                    textTransform: "capitalize",
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
                height: 96,
                display: "grid",
                placeItems: "center",
                color: C.muted,
                fontSize: 10,
              }}
            >
              Loading wellness trends…
            </div>
          ) : (
            <MultiLine
              h={96}
              labels={trendsLabels}
              series={trendsMultiSeries}
              highlighted={topImprovementIds}
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
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            Dosha Profile
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
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
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
              borderTop: "1px solid rgba(255,255,255,0.06)",
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
        style={{
          background: "rgba(107,179,63,0.04)",
          borderColor: "rgba(107,179,63,0.14)",
        }}
        borderColor="rgba(107,179,63,0.14)"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.g3 }}>
            🌿 Ayumonk Lifestyle Suggestions — Focus Areas This Week
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {suggestionTierLabels.hasKpiRisk && (
              <span
                style={{
                  fontSize: 8,
                  background: "rgba(107,179,63,0.15)",
                  color: C.g3,
                  borderRadius: 5,
                  padding: "2px 8px",
                  fontWeight: 700,
                }}
              >
                Tier 1 = KPI risk
              </span>
            )}
            {suggestionTierLabels.hasQuestionScore && (
              <span
                style={{
                  fontSize: 8,
                  background: "rgba(212,168,67,0.15)",
                  color: C.gold,
                  borderRadius: 5,
                  padding: "2px 8px",
                  fontWeight: 700,
                }}
              >
                Tier 2 = Question score
              </span>
            )}
          </div>
        </div>

        {suggestionsError && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {suggestionsError}
          </Alert>
        )}

        {suggestionsLoading && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            Loading lifestyle suggestions…
          </div>
        )}

        {!suggestionsLoading && suggestionItems.length === 0 && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            No lifestyle suggestions are available yet.
          </div>
        )}

        {!suggestionsLoading && suggestionItems.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 10,
            }}
          >
            {suggestionItems.map((item, index) => {
              const accent = getSuggestionColor(item.suggestion_type, index);
              const triggerBadges = (item.triggers || [])
                .slice()
                .sort(
                  (left, right) => (left.priority || 0) - (right.priority || 0),
                )
                .slice(0, 2);
              const hasKpiRisk = triggerBadges.some(
                (t) => t.trigger_mode === "kpi_risk",
              );
              const hasQscore = triggerBadges.some(
                (t) => t.trigger_mode === "question_score",
              );
              return (
                <div
                  key={item.suggestion_id || item.title}
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    borderLeft: `3px solid ${accent}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 6,
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: accent,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      {hasKpiRisk && (
                        <span
                          style={{
                            fontSize: 7.5,
                            background: "rgba(248,113,113,0.18)",
                            color: "#f87171",
                            borderRadius: 4,
                            padding: "1px 6px",
                            fontWeight: 700,
                          }}
                        >
                          T1 · KPI risk
                        </span>
                      )}
                      {hasQscore && (
                        <span
                          style={{
                            fontSize: 7.5,
                            background: "rgba(212,168,67,0.18)",
                            color: C.gold,
                            borderRadius: 4,
                            padding: "1px 6px",
                            fontWeight: 700,
                          }}
                        >
                          T2 · Q flagged
                        </span>
                      )}
                    </div>
                  </div>
                  {!!item.description && (
                    <div
                      style={{
                        fontSize: 8.5,
                        color: "rgba(255,255,255,0.55)",
                        lineHeight: 1.55,
                        marginBottom: 6,
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                  {(item.suggestion_type ||
                    item.difficulty ||
                    item.duration_mins ||
                    item.dosha_type) && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      {item.suggestion_type && (
                        <span
                          style={{
                            fontSize: 7.5,
                            background: accent + "22",
                            color: accent,
                            borderRadius: 4,
                            padding: "1px 6px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.3,
                          }}
                        >
                          {item.suggestion_type}
                        </span>
                      )}
                      {item.difficulty && (
                        <span
                          style={{
                            fontSize: 7.5,
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.55)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 4,
                            padding: "1px 6px",
                            fontWeight: 600,
                          }}
                        >
                          {item.difficulty}
                        </span>
                      )}
                      {!!item.duration_mins && (
                        <span
                          style={{
                            fontSize: 7.5,
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.55)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 4,
                            padding: "1px 6px",
                            fontWeight: 600,
                          }}
                        >
                          {item.duration_mins} mins
                        </span>
                      )}
                      {item.dosha_type && (
                        <span
                          style={{
                            fontSize: 7.5,
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.55)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 4,
                            padding: "1px 6px",
                            fontWeight: 600,
                          }}
                        >
                          Dosha: {item.dosha_type}
                        </span>
                      )}
                    </div>
                  )}
                  {triggerBadges.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                        marginTop: 6,
                      }}
                    >
                      {triggerBadges.map((trig, ti) => (
                        <span
                          key={`${item.suggestion_id}-trig-${ti}`}
                          style={{
                            fontSize: 7.5,
                            background: "rgba(251,191,36,0.1)",
                            color: C.gold,
                            borderRadius: 4,
                            padding: "1px 6px",
                            border: "1px solid rgba(251,191,36,0.2)",
                          }}
                        >
                          ⚡{" "}
                          {trig.trigger_mode === "kpi_risk"
                            ? `${trig.kpi_display_name || trig.kpi_key} · ${trig.risk_level || "risk"}`
                            : `${(trig.question_text || trig.question_key || "").slice(0, 28)}${(trig.question_text || "").length > 28 ? "…" : ""} (${trig.question_score || 0})`}
                        </span>
                      ))}
                    </div>
                  )}
                  {!!item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: 8,
                        fontSize: 9,
                        color: accent,
                        fontWeight: 700,
                        textDecoration: "none",
                        border: `1px solid ${accent}55`,
                        padding: "3px 8px",
                        borderRadius: 6,
                      }}
                    >
                      View Resource →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ClientCard>
    </Box>
  );
}
