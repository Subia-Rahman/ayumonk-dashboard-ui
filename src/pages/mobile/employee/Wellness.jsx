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
import { dimHue } from "../../../components/mobile/dimensionColors";
import { useTokens } from "../../../components/mobile/useTokens";


const fmtLabel = (n = "") =>
  n.replace(/\bKPI\b/gi, "").replace(/\s+/g, " ").trim() || "Wellness";
const fmtChange = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return `${n >= 0 ? "+" : ""}${n.toFixed(0)}%`;
};
const getSuggColor = (type) => dimHue(type);

// Derive a few sub-scores from a KPI's overall score so the detail sheet's
// "Question Scores" section is always populated. Swap in real per-question
// data when the API provides it (activeKpi.questions = [{ label, score, threshold }]).
const buildQuestionScores = (rawScore = 0) => {
  const raw = Number(rawScore) || 0;
  const s = raw > 5 ? raw / 20 : raw; // normalise 0-100 → 0-5 if needed
  const clamp = (n) => Math.max(1, Math.min(5, Number(n.toFixed(1))));
  return [
    { label: "Consistency this week", score: clamp(s), threshold: 3.5 },
    { label: "Self-reported quality", score: clamp(s - 0.4), threshold: 3.2 },
    { label: "Trend vs baseline", score: clamp(s + 0.3), threshold: 3 },
  ];
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
  DIMENSION_PILLS[label.toLowerCase().trim().split(/\s+/)[0]] ||
  { bg: "#E8F0E4", color: "#3D5C35" };

// Derive "Nidra · Sleep Quality" subtitle for KpiSheet from label like "Nidra Sleep Quality"
const getSubtitle = (label = "") => {
  const words = label.trim().split(/\s+/);
  const dim = words[0]?.toLowerCase();
  if (!dim || !DIMENSION_PILLS[dim]) return null;
  const rest = words.slice(1).join(" ");
  return rest ? `${words[0]} · ${rest}` : words[0];
};

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

export default function Wellness() {
  const t = useTokens();
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
        const label = fmtLabel(item.kpi_name);
        return {
          kpiKey: item.kpi_key,
          label,
          subtitle: getSubtitle(label),
          score: Number(item.latest_score) || 0,
          change: fmtChange(item.trend_percent),
          color: dimHue(item.kpi_name),
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
    <div style={{ background: t.bg, minHeight: "100%", paddingBottom: 16 }}>
      {/* Page header */}
      <div style={{ padding: "10px 16px 16px" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>
          🌿 Wellness
        </div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>
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
            <Donut pct={overallWi} size={106} stroke={12} color="#ffffff" track="rgba(255,255,255,0.22)" label="/ 100" />
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
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
                marginBottom: 6,
              }}
            >
              {overallWi > 0 ? `${overallWi} / 100` : loading ? "Loading…" : "— / 100"}
            </div>
            <div
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                background: "rgba(255,255,255,0.20)",
                borderRadius: 20,
                padding: "4px 11px",
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
            <div
              style={{
                marginTop: 10,
                marginLeft: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(255,255,255,.12)",
                borderRadius: 20,
                padding: "3px 10px",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                🔥 7-day streak
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prakriti · Dosha profile (conic ring) */}
      <div style={{ padding: "0 16px 20px" }}>
        <SectionLabel>Prakriti · your dosha profile</SectionLabel>
        <div
          style={{
            background: t.card,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            padding: 18,
            display: "flex",
            gap: 18,
            alignItems: "center",
          }}
        >
          {(() => {
            const data = [
              { l: "Vata", col: "#4A90C4", v: 30 },
              { l: "Pitta", col: "#E0935C", v: 34 },
              { l: "Kapha", col: "#4F9D5B", v: 36 },
            ];
            const size = 116;
            const sw = 14;
            const r = (size - sw) / 2;
            const cx = size / 2;
            const Circ = 2 * Math.PI * r;
            const total = data.reduce((acc, d) => acc + d.v, 0) || 1;
            const gap = 5;
            let pos = 0;
            const arcs = data.map((d) => {
              const len = (d.v / total) * Circ;
              const dash = Math.max(0.5, len - gap);
              const seg = { ...d, dash, rest: Circ - dash, offset: -pos };
              pos += len;
              return seg;
            });
            const dom = data.reduce((a, b) => (b.v > a.v ? b : a), data[0]);
            return (
              <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={cx} cy={cx} r={r} fill="none" stroke={t.track} strokeWidth={sw} />
                  {arcs.map((a) => (
                    <circle
                      key={a.l}
                      cx={cx}
                      cy={cx}
                      r={r}
                      fill="none"
                      stroke={a.col}
                      strokeWidth={sw}
                      strokeLinecap="round"
                      strokeDasharray={`${a.dash} ${a.rest}`}
                      strokeDashoffset={a.offset}
                    />
                  ))}
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: t.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {dom.l}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: dom.col, marginTop: 2, letterSpacing: "0.03em" }}>
                      Dominant
                    </div>
                    <div style={{ fontSize: 8.5, color: t.muted, marginTop: 1 }}>{dom.v}% balance</div>
                  </div>
                </div>
              </div>
            );
          })()}
          <div style={{ flex: 1, minWidth: 0 }}>
            {[
              { l: "Vata", col: "#4A90C4", v: 30 },
              { l: "Pitta", col: "#E0935C", v: 34 },
              { l: "Kapha", col: "#4F9D5B", v: 36 },
            ].map(({ l, col, v }) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: col, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: t.muted, fontWeight: 600 }}>{l}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: col }}>{v}%</span>
              </div>
            ))}
            <div style={{ marginTop: 3, fontSize: 11, color: t.muted, lineHeight: 1.45 }}>
              Balanced tridoshic constitution — favour cooling, grounding routines.
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics grid */}
      {loading && items.length === 0 && (
        <div style={{ padding: "0 16px 16px", fontSize: 12, color: t.muted }}>
          Loading wellness metrics…
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div
          style={{
            margin: "0 16px 16px",
            padding: "24px",
            background: t.card,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 4 }}>
            No KPI metrics yet
          </div>
          <div style={{ fontSize: 12, color: t.muted }}>
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
              scrollSnapType: "x proximity",
            }}
          >
            {metrics.map((m) => {
              const pos = m.change && m.change.startsWith("+");
              return (
                <div
                  key={m.kpiKey ?? m.label}
                  onClick={() => setActiveKpi(m)}
                  style={{
                    minWidth: 152,
                    maxWidth: 152,
                    flexShrink: 0,
                    scrollSnapAlign: "start",
                    background: t.card,
                    borderRadius: 14,
                    padding: "15px 13px",
                    border: `1px solid ${m.color}28`,
                    cursor: "pointer",
                    transition: "border-color .2s",
                  }}
                >
                  {/* Dimension name pill */}
                  <div style={{ marginBottom: 8 }}>
                    {(() => {
                      const pill = getDimensionPill(m.label);
                      return (
                        <span style={{
                          display: "inline-block",
                          fontSize: 10,
                          fontWeight: 700,
                          color: pill.color,
                          background: pill.bg,
                          padding: "2px 6px",
                          borderRadius: 99,
                          lineHeight: 1.4,
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {m.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Score */}
                  <div style={{ fontSize: 24, fontWeight: 800, color: m.color,
                    lineHeight: 1, marginBottom: 8 }}>
                    {m.score.toFixed(1)}
                    <span style={{ fontSize: 11, color: t.sub,
                      fontWeight: 400, marginLeft: 3 }}>/5</span>
                  </div>

                  {/* Trend + sparkline */}
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center" }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: m.change
                        ? pos ? "#16a34a" : "#dc2626"
                        : t.sub,
                    }}>
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

      {/* Lifestyle Suggestions */}
      {suggestionsLoading && (
        <div style={{ padding: "0 16px 16px", fontSize: 12, color: t.muted }}>
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
                    background: t.card,
                    borderRadius: 14,
                    padding: "15px 14px",
                    borderTop: `1px solid ${t.border}`,
                    borderRight: `1px solid ${t.border}`,
                    borderBottom: `1px solid ${t.border}`,
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
                      style={{ fontSize: 13, fontWeight: 700, color: t.text }}
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
                        color: t.sub,
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
                          background: "#F0EDE5",
                          color: t.sub,
                          border: "1px solid rgba(31,30,29,0.1)",
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
                          background: "#F0EDE5",
                          color: t.sub,
                          border: "1px solid rgba(31,30,29,0.1)",
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
                          background: "#F0EDE5",
                          color: t.sub,
                          border: "1px solid rgba(31,30,29,0.1)",
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
          kpi={{
            ...activeKpi,
            sparkValues: activeKpi.sparkVals,
            questions: activeKpi.questions || buildQuestionScores(activeKpi.score),
          }}
          onClose={() => setActiveKpi(null)}
        />
      )}
    </div>
  );
}
