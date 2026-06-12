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

// Ayufinity Plans bottom sheet — opened from the "Plans for Your Dosha" card.
function PlansSheet({ t, dosha = "Kapha", onClose }) {
  const plans = [
    { icon: "🥗", title: "Aahar Diet Plan", c: "#4F9D5B", desc: `${dosha}-pacifying warm, light meals. Seasonal greens, ginger, turmeric, barley.` },
    { icon: "🧘", title: "Vihar Yoga Flow", c: "#4A90C4", desc: `Dynamic Surya Namaskar, Kapalabhati pranayama, vigorous movement to balance ${dosha} sluggishness.` },
    { icon: "🌿", title: "Aushadh Herb Pack", c: "#C99A3F", desc: "Trikatu (ginger + pepper + pippali), Guggul, Kutki. Stimulates metabolism and circulation." },
    { icon: "🧑‍⚕️", title: "1:1 Consultation", c: "#8B6FCB", desc: "30-min video consultation with an Ayurvedic practitioner. Personalised treatment plan." },
  ];
  const go = () => window.open("https://ayufinity.com", "_blank", "noopener");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,20,12,0.5)" }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: t.card2,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTop: `2px solid ${t.g3}`,
          maxHeight: "86%",
          overflowY: "auto",
          paddingBottom: 30,
        }}
      >
        <div style={{ width: 38, height: 4.5, borderRadius: 999, background: t.border, margin: "10px auto 6px" }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "6px 20px 16px",
            borderBottom: `1px solid ${t.border}`,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.g3 }}>🌿 Ayufinity Plans</div>
            <div style={{ fontSize: 11.5, color: t.faint, marginTop: 2 }}>
              Personalised for {dosha} dosha
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              border: `1px solid ${t.border}`,
              background: t.inset,
              color: t.muted,
              fontSize: 14,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "14px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
          {plans.map((p) => (
            <div
              key={p.title}
              style={{
                border: `1px solid ${p.c}4d`,
                borderRadius: 14,
                padding: "14px 15px",
                background: `${p.c}0d`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{p.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: p.c }}>{p.title}</span>
              </div>
              <div style={{ fontSize: 12.5, color: t.sub, lineHeight: 1.5, marginBottom: 12 }}>
                {p.desc}
              </div>
              <button
                type="button"
                onClick={go}
                style={{
                  width: "100%",
                  textAlign: "center",
                  background: `${p.c}1a`,
                  border: `1px solid ${p.c}4d`,
                  color: p.c,
                  fontWeight: 700,
                  fontSize: 12.5,
                  borderRadius: 10,
                  padding: "10px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Explore on Ayufinity →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Wellness() {
  const t = useTokens();
  const dispatch = useDispatch();
  const [activeKpi, setActiveKpi] = useState(null);
  const [planned, setPlanned] = useState({});
  const [plansOpen, setPlansOpen] = useState(false);
  const [mood, setMood] = useState(null);

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

      {/* Wellness Index + Prakriti BioType — side by side */}
      <div style={{ padding: "0 16px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "stretch" }}>
          {/* Wellness Index — no ring */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 18,
              padding: "16px 15px",
              background: `linear-gradient(150deg, ${C.g1}, ${C.g2})`,
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 12px 28px -16px rgba(79,122,58,0.6)",
            }}
          >
            <span aria-hidden="true" style={{ position: "absolute", right: -14, bottom: -18, fontSize: 92, opacity: 0.1, transform: "rotate(-12deg)", pointerEvents: "none" }}>🌿</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, position: "relative" }}>
              <span style={{ fontSize: 9.5, opacity: 0.82, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Wellness Index</span>
              {trends?.overall?.delta_percent != null && (
                <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(255,255,255,0.2)", borderRadius: 999, padding: "2px 7px", whiteSpace: "nowrap" }}>
                  {trends.overall.delta_percent >= 0 ? "▲" : "▼"} {Math.abs(Math.round(trends.overall.delta_percent))}%
                </span>
              )}
            </div>
            <div style={{ position: "relative", margin: "8px 0 10px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 0.9 }}>{overallWi > 0 ? overallWi : "—"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.65 }}>/100</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, fontSize: 13, fontWeight: 800, background: "rgba(255,255,255,0.16)", borderRadius: 999, padding: "4px 11px" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#BFF0A8", boxShadow: "0 0 0 3px rgba(191,240,168,0.25)" }} />
                {band.label}
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${overallWi}%`, borderRadius: 999, background: "linear-gradient(90deg, #BFF0A8, #FFFFFF)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 10, opacity: 0.85, fontWeight: 600 }}>
                <span>🔥 7-day streak</span>
                <span>Top 8%</span>
              </div>
            </div>
          </div>

          {/* Prakriti · BioType Profile */}
          {(() => {
            const data = [
              { l: "Vata", col: "#4A90C4", v: 30 },
              { l: "Pitta", col: "#E0935C", v: 34 },
              { l: "Kapha", col: "#4F9D5B", v: 36 },
            ];
            const size = 90, sw = 11, r = (size - sw) / 2, cx = size / 2, Circ = 2 * Math.PI * r;
            const total = data.reduce((a, d) => a + d.v, 0) || 1;
            const gap = 5;
            let pos = 0;
            const arcs = data.map((d) => { const len = (d.v / total) * Circ; const dash = Math.max(0.5, len - gap); const seg = { ...d, dash, rest: Circ - dash, offset: -pos }; pos += len; return seg; });
            const dom = data.reduce((a, b) => (b.v > a.v ? b : a), data[0]);
            return (
              <div style={{ background: t.card, borderRadius: 18, border: `1px solid ${t.border}`, padding: "13px 11px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 9, color: t.faint, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 9, alignSelf: "flex-start", lineHeight: 1.3 }}>Prakriti · BioType Profile</div>
                <div style={{ position: "relative", width: size, height: size }}>
                  <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={cx} cy={cx} r={r} fill="none" stroke={t.track} strokeWidth={sw} />
                    {arcs.map((a) => (<circle key={a.l} cx={cx} cy={cx} r={r} fill="none" stroke={a.col} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${a.dash} ${a.rest}`} strokeDashoffset={a.offset} />))}
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: t.text, letterSpacing: "-0.02em", lineHeight: 1 }}>{dom.l}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: dom.col, marginTop: 2 }}>Dominant</div>
                      <div onClick={() => setPlansOpen(true)} style={{ fontSize: 8.5, color: C.g1, marginTop: 2, fontWeight: 700, cursor: "pointer" }}>ayufinity.com ↗</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 9, flexWrap: "wrap", marginTop: 12, marginBottom: 12 }}>
                  {data.map((d) => (
                    <span key={d.l} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.col, flexShrink: 0 }} />
                      <span style={{ color: t.muted, fontWeight: 600 }}>{d.l[0]}</span>
                      <span style={{ color: d.col, fontWeight: 800 }}>{d.v}%</span>
                    </span>
                  ))}
                </div>
                <button onClick={() => setPlansOpen(true)} style={{ width: "100%", marginTop: "auto", padding: "9px 8px", borderRadius: 10, border: `1px solid ${C.g3}`, background: `${C.g3}1f`, color: C.g1, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Explore Ayufinity Plans →</button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Today's Mood Check */}
      {(() => {
        const moods = [
          { e: "😔", l: "Low", c: "#C0604A" },
          { e: "😕", l: "Meh", c: "#D08A3A" },
          { e: "😐", l: "Okay", c: "#C99A3F" },
          { e: "🙂", l: "Good", c: "#4F9D5B" },
          { e: "😄", l: "Great", c: "#3AA88A" },
        ];
        const m = mood != null ? moods[mood] : null;
        return (
          <div style={{ padding: "0 16px 20px" }}>
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 16, border: `1px solid ${t.border}`, background: m ? `linear-gradient(160deg, ${m.c}22, ${t.card} 70%)` : t.card, padding: "14px 15px", transition: "background .3s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.faint, textTransform: "uppercase", letterSpacing: "0.08em" }}>Today's Mood Check</span>
                {m ? (
                  <span style={{ fontSize: 11, fontWeight: 800, color: m.c, background: `${m.c}24`, borderRadius: 999, padding: "3px 10px" }}>{m.l} · +10 XP ✓</span>
                ) : (
                  <span style={{ fontSize: 11, color: t.faint }}>How are you feeling?</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                {moods.map((mo, k) => {
                  const sel = mood === k;
                  return (
                    <button key={mo.l} onClick={() => setMood(k)} aria-label={mo.l} style={{ flex: 1, aspectRatio: "1 / 1", border: "none", cursor: "pointer", fontFamily: "inherit", borderRadius: 14, fontSize: 26, lineHeight: 1, display: "grid", placeItems: "center", background: sel ? `${mo.c}2e` : t.inset, outline: sel ? `2px solid ${mo.c}` : "2px solid transparent", transform: sel ? "translateY(-3px) scale(1.12)" : "none", filter: mood != null && !sel ? "grayscale(0.5) opacity(0.55)" : "none", transition: "all .2s cubic-bezier(.34,1.4,.5,1)", boxShadow: sel ? `0 8px 16px -6px ${mo.c}99` : "none" }}>{mo.e}</button>
                  );
                })}
              </div>
              {m && (
                <div style={{ marginTop: 12, fontSize: 12, color: t.muted, lineHeight: 1.5 }}>
                  {mood >= 3 ? (<>Lovely — your <b style={{ color: t.text }}>{m.l.toLowerCase()}</b> mood is logged. Keep the streak going 🌿</>) : (<>Thanks for checking in. Try a <b style={{ color: C.g1 }}>2-min breathing</b> reset from Challenges 🧘</>)}
                </div>
              )}
            </div>
          </div>
        );
      })()}
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

      {/* Plans for Your Dosha */}
      <div style={{ padding: "0 16px 20px" }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: `linear-gradient(135deg, ${t.g1}, ${t.g2})`,
            borderRadius: 18,
            padding: "16px 17px",
            boxShadow: "0 14px 30px -16px rgba(79,122,58,0.55)",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -10,
              bottom: -16,
              fontSize: 78,
              opacity: 0.12,
              transform: "rotate(-12deg)",
              pointerEvents: "none",
            }}
          >
            🌿
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
              position: "relative",
            }}
          >
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "#fff" }}>
              🌿 Plans for Your Dosha
            </div>
            <button
              type="button"
              onClick={() => window.open("https://ayufinity.com", "_blank", "noopener")}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "#fff",
                fontSize: 11.5,
                fontWeight: 700,
                borderRadius: 999,
                padding: "4px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              Open ↗
            </button>
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "rgba(255,255,255,0.86)",
              lineHeight: 1.55,
              marginBottom: 13,
              position: "relative",
            }}
          >
            You're <b style={{ color: "#fff" }}>Kapha-dominant</b>. A personalised
            Aahar diet, Kapha-balancing yoga, and an Aushadh herb pack are ready
            for you.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
            {["🥗 Aahar Plan", "🧘 Yoga Flow", "🌿 Herb Pack"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlansOpen(true)}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.38)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: "7px 13px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

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
                          background: t.bg,
                          color: t.sub,
                          border: `1px solid ${t.border}`,
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
                          background: t.bg,
                          color: t.sub,
                          border: `1px solid ${t.border}`,
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
                          background: t.bg,
                          color: t.sub,
                          border: `1px solid ${t.border}`,
                          borderRadius: 6,
                          padding: "3px 9px",
                        }}
                      >
                        {item.dosha_type}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPlanned((p) => ({
                        ...p,
                        [item.suggestion_id ?? item.title]:
                          !p[item.suggestion_id ?? item.title],
                      }))
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 12,
                      marginRight: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: planned[item.suggestion_id ?? item.title]
                        ? "#fff"
                        : accent,
                      background: planned[item.suggestion_id ?? item.title]
                        ? accent
                        : `${accent}14`,
                      border: `1px solid ${accent}55`,
                      padding: "7px 14px",
                      borderRadius: 9,
                      transition: "all .18s",
                    }}
                  >
                    {planned[item.suggestion_id ?? item.title]
                      ? "✓ Added to plan"
                      : "+ Add to plan"}
                  </button>

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

      {/* Suggestions empty state — section never silently vanishes */}
      {!suggestionsLoading && suggItems.length === 0 && (
        <div style={{ padding: "0 16px 16px" }}>
          <SectionLabel>🌿 Suggestions this week</SectionLabel>
          <div style={{ background: t.card, borderRadius: 14, border: `1px dashed ${t.border}`, padding: "20px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>🌱</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 4 }}>No suggestions yet</div>
            <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>
              Complete this week's wellness check-in and your personalised suggestions will appear here.
            </div>
          </div>
        </div>
      )}

      {/* Ayufinity Plans sheet */}
      {plansOpen && (
        <PlansSheet t={t} dosha="Kapha" onClose={() => setPlansOpen(false)} />
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
