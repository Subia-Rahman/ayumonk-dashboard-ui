import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { C } from "../../../components/mobile/palette";
import { Donut, KpiSheet, Spark } from "../../../components/mobile/primitives";
import {
  fetchDashboardKpis,
  fetchSessionSuggestions,
  fetchWellnessTrends,
} from "../../../store/dashboardSlice";
import { fetchMySubmissions } from "../../../store/sessionSlice";

const KPI_ICONS = ["🧠", "🔥", "💧", "🧘", "🌙", "🏃", "🥗", "💪", "❤️"];
const KPI_COLORS = [
  "#7c6af7", "#f97316", "#22c55e", "#38bdf8",
  "#a3e635", "#facc15", "#ec4899", "#f59e0b", "#06b6d4",
];
const SUGG_COLORS = {
  aahar: "#16a34a", vihara: "#2563eb", nidra: "#7c3aed",
  charya: "#f59e0b", manas: "#c026d3", ojas: "#0f766e",
};

const getKpiIcon = (i) => KPI_ICONS[i % KPI_ICONS.length];
const getKpiColor = (i) => KPI_COLORS[i % KPI_COLORS.length];
const fmtLabel = (n = "") =>
  n.replace(/\bKPI\b/gi, "").replace(/\s+/g, " ").trim() || "Wellness";
const fmtChange = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return `${n >= 0 ? "+" : ""}${n.toFixed(0)}%`;
};
const getSuggColor = (type, i) =>
  SUGG_COLORS[String(type || "").toLowerCase()] || KPI_COLORS[i % KPI_COLORS.length];

const wiBand = (wi) => {
  if (wi >= 80) return { label: "Excellent", color: C.g3 };
  if (wi >= 60) return { label: "Good", color: C.g4 };
  if (wi >= 40) return { label: "Moderate", color: C.gold };
  return { label: "Needs Attention", color: "#f87171" };
};

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(255,255,255,.3)",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

export default function Wellness() {
  const dispatch = useDispatch();
  const [activeKpi, setActiveKpi] = useState(null);

  const { items, loading, error, suggestions, suggestionsLoading, trends } =
    useSelector((s) => s.dashboard);
  const { mySubmissions } = useSelector((s) => s.session);

  useEffect(() => {
    dispatch(fetchDashboardKpis());
    dispatch(fetchMySubmissions());
    dispatch(fetchWellnessTrends({ period: "weekly" }));
  }, [dispatch]);

  const latestResponse = useMemo(
    () => mySubmissions?.[0]?.responses?.[0] || null,
    [mySubmissions],
  );

  useEffect(() => {
    const sid = mySubmissions?.[0]?.session_id;
    if (sid) dispatch(fetchSessionSuggestions(sid));
  }, [dispatch, mySubmissions]);

  const overallWi = useMemo(() => {
    if (!latestResponse?.kpi_scores?.length) return 0;
    const avg =
      latestResponse.kpi_scores.reduce(
        (s, k) => s + (Number(k.average_score) || 0),
        0,
      ) / latestResponse.kpi_scores.length;
    return Number((avg * 20).toFixed(1));
  }, [latestResponse]);

  const band = wiBand(overallWi);

  const sparkByKpi = useMemo(() => {
    const map = {};
    (trends.series || []).forEach((s) => {
      const vals = (s.points || []).map((p) => Number(p.average_score) || 0);
      if (s.kpi_key != null) map[`key:${s.kpi_key}`] = vals;
      if (s.kpi_name) map[`name:${s.kpi_name}`] = vals;
    });
    return map;
  }, [trends.series]);

  const metrics = useMemo(
    () =>
      items.map((item, i) => {
        const sparkVals =
          (item.kpi_key != null && sparkByKpi[`key:${item.kpi_key}`]) ||
          (item.kpi_name && sparkByKpi[`name:${item.kpi_name}`]) ||
          [];
        return {
          kpiKey: item.kpi_key,
          label: fmtLabel(item.kpi_name),
          score: Number(item.latest_score) || 0,
          change: fmtChange(item.trend_percent),
          color: getKpiColor(i),
          icon: getKpiIcon(i),
          sparkVals,
        };
      }),
    [items, sparkByKpi],
  );

  const suggItems = useMemo(
    () => (Array.isArray(suggestions?.items) ? suggestions.items : []),
    [suggestions],
  );

  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 16 }}>
      {/* Page header */}
      <div style={{ padding: "10px 16px 16px" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>
          🌿 Wellness
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
          Your Ayurvedic health overview
        </div>
      </div>

      {error && (
        <div
          style={{
            margin: "0 16px 14px",
            padding: "12px 14px",
            background: "rgba(248,113,113,.08)",
            border: "1px solid rgba(248,113,113,.3)",
            borderRadius: 12,
            color: "#fca5a5",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {/* Wellness Index hero card */}
      <div style={{ margin: "0 16px 20px" }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${C.g1} 0%, ${C.g2} 100%)`,
            borderRadius: 20,
            padding: "20px 22px",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <Donut pct={overallWi} size={90} color={band.color} label="/ 100" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,.6)",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 6,
              }}
            >
              Wellness Index
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 4,
              }}
            >
              {overallWi > 0 ? `${overallWi} / 100` : loading ? "Loading…" : "— / 100"}
            </div>
            <div
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 700,
                color: band.color,
                background: `${band.color}22`,
                borderRadius: 20,
                padding: "3px 10px",
              }}
            >
              {band.label}
            </div>
            {trends.overall?.delta_percent != null && (
              <div
                style={{
                  marginTop: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "rgba(255,255,255,.12)",
                  borderRadius: 20,
                  padding: "3px 10px",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                  {trends.overall.delta_percent >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(Math.round(trends.overall.delta_percent))}% from
                  baseline
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metrics grid */}
      {loading && items.length === 0 && (
        <div style={{ padding: "0 16px 16px", fontSize: 12, color: C.muted }}>
          Loading wellness metrics…
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div
          style={{
            margin: "0 16px 16px",
            padding: "24px",
            background: C.card,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.5)", marginBottom: 4 }}>
            No KPI metrics yet
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            Your company hasn't set up any KPI programs yet.
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <div style={{ padding: "0 0 20px" }}>
          <div style={{ padding: "0 16px" }}>
            <SectionLabel>KPI Metrics · tap for details</SectionLabel>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              overflowX: "auto",
              gap: 10,
              padding: "0 16px 4px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {metrics.map((m) => {
              const pos = m.change && m.change.startsWith("+");
              return (
                <div
                  key={m.kpiKey ?? m.label}
                  onClick={() => setActiveKpi(m)}
                  style={{
                    minWidth: 140,
                    maxWidth: 140,
                    flexShrink: 0,
                    background: C.card,
                    borderRadius: 14,
                    padding: "15px 13px",
                    border: `1px solid ${m.color}28`,
                    cursor: "pointer",
                    transition: "border-color .2s",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,.45)",
                      lineHeight: 1.35,
                      marginBottom: 8,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: m.color,
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    {m.score.toFixed(1)}
                    <span
                      style={{
                        fontSize: 11,
                        color: C.muted,
                        fontWeight: 400,
                        marginLeft: 3,
                      }}
                    >
                      /5
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: m.change
                          ? pos
                            ? "#4ade80"
                            : "#f87171"
                          : "rgba(255,255,255,.25)",
                      }}
                    >
                      {m.change
                        ? `${pos ? "▲" : "▼"}${m.change.replace(/^[+-]/, "")}`
                        : "—"}
                    </span>
                    {m.sparkVals.length >= 2 && (
                      <Spark vals={m.sparkVals} color={m.color} w={46} h={18} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dosha Profile (static) */}
      <div style={{ padding: "0 16px 20px" }}>
        <SectionLabel>Dosha Profile</SectionLabel>
        <div
          style={{
            background: C.card,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            padding: "16px 16px",
          }}
        >
          {[
            { l: "Vata", col: "#38bdf8", v: 30 },
            { l: "Pitta", col: "#f97316", v: 34 },
            { l: "Kapha", col: "#22c55e", v: 36 },
          ].map(({ l, col, v }) => (
            <div
              key={l}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: col,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: "rgba(255,255,255,.55)",
                }}
              >
                {l}
              </div>
              <div
                style={{
                  width: 120,
                  height: 6,
                  borderRadius: 6,
                  background: "rgba(255,255,255,.07)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${v}%`,
                    background: col,
                    borderRadius: 6,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: col,
                  width: 34,
                  textAlign: "right",
                }}
              >
                {v}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lifestyle Suggestions */}
      {suggestionsLoading && (
        <div style={{ padding: "0 16px 16px", fontSize: 12, color: C.muted }}>
          Loading suggestions…
        </div>
      )}

      {!suggestionsLoading && suggItems.length > 0 && (
        <div style={{ padding: "0 16px 16px" }}>
          <SectionLabel>🌿 Suggestions this week</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {suggItems.map((item, i) => {
              const accent = getSuggColor(item.suggestion_type, i);
              const hasKpiRisk = (item.triggers || []).some(
                (t) => t.trigger_mode === "kpi_risk",
              );
              return (
                <div
                  key={item.suggestion_id ?? item.title}
                  style={{
                    background: C.card,
                    borderRadius: 14,
                    padding: "15px 14px",
                    borderTop: `1px solid ${C.border}`,
                    borderRight: `1px solid ${C.border}`,
                    borderBottom: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${accent}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                      gap: 8,
                    }}
                  >
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: accent }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        flexShrink: 0,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      {hasKpiRisk && (
                        <span
                          style={{
                            fontSize: 9,
                            background: "rgba(248,113,113,.15)",
                            color: "#f87171",
                            borderRadius: 5,
                            padding: "2px 7px",
                            fontWeight: 700,
                          }}
                        >
                          T1
                        </span>
                      )}
                      {item.suggestion_type && (
                        <span
                          style={{
                            fontSize: 9,
                            background: `${accent}18`,
                            color: accent,
                            borderRadius: 5,
                            padding: "2px 7px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {item.suggestion_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,.5)",
                        lineHeight: 1.55,
                        marginBottom: 10,
                      }}
                    >
                      {item.description}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {item.difficulty && (
                      <span
                        style={{
                          fontSize: 11,
                          background: "rgba(255,255,255,.04)",
                          color: "rgba(255,255,255,.45)",
                          border: "1px solid rgba(255,255,255,.08)",
                          borderRadius: 6,
                          padding: "3px 9px",
                        }}
                      >
                        {item.difficulty}
                      </span>
                    )}
                    {!!item.duration_mins && (
                      <span
                        style={{
                          fontSize: 11,
                          background: "rgba(255,255,255,.04)",
                          color: "rgba(255,255,255,.45)",
                          border: "1px solid rgba(255,255,255,.08)",
                          borderRadius: 6,
                          padding: "3px 9px",
                        }}
                      >
                        {item.duration_mins} min
                      </span>
                    )}
                    {item.dosha_type && (
                      <span
                        style={{
                          fontSize: 11,
                          background: "rgba(255,255,255,.04)",
                          color: "rgba(255,255,255,.45)",
                          border: "1px solid rgba(255,255,255,.08)",
                          borderRadius: 6,
                          padding: "3px 9px",
                        }}
                      >
                        {item.dosha_type}
                      </span>
                    )}
                  </div>

                  {!!item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: 12,
                        fontSize: 12,
                        color: accent,
                        fontWeight: 700,
                        textDecoration: "none",
                        border: `1px solid ${accent}44`,
                        padding: "5px 12px",
                        borderRadius: 8,
                      }}
                    >
                      View Resource →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI detail bottom sheet */}
      {activeKpi && (
        <KpiSheet
          kpi={{ ...activeKpi, sparkValues: activeKpi.sparkVals }}
          onClose={() => setActiveKpi(null)}
        />
      )}
    </div>
  );
}
