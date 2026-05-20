import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { C } from "../../../components/mobile/palette";
import {
  Logo,
  Spark,
  Donut,
  DoshaRing,
  Pill,
  KpiSheet,
} from "../../../components/mobile/primitives";
import {
  fetchDashboardKpis,
  fetchSessionSuggestions,
  fetchWellnessTrends,
} from "../../../store/dashboardSlice";
import { fetchMySubmissions } from "../../../store/sessionSlice";

// Icon + accent per known KPI name. Falls back to neutral set when the
// backend hands us a name we haven't styled yet.
const KPI_PRESETS = {
  sleep: { icon: "🌙", color: "#7c6af7", sf: "Mental Health" },
  stress: { icon: "🧘", color: C.orange, sf: "Role Emotional" },
  nutrition: { icon: "🥗", color: "#22c55e", sf: "General Health" },
  hydration: { icon: "💧", color: "#38bdf8", sf: "Vitality" },
  activity: { icon: "🏃", color: C.orange, sf: "Physical Func." },
  energy: { icon: "⚡", color: C.gold, sf: "Role Physical" },
  posture: { icon: "🦴", color: C.pink, sf: "Bodily Pain" },
  pain: { icon: "🦴", color: C.pink, sf: "Bodily Pain" },
  digestion: { icon: "🫐", color: "#a3e635", sf: "General Health" },
};
const DEFAULT_KPI = { icon: "🌿", color: C.g3, sf: "General Health" };

function presetFor(name) {
  const key = String(name || "").toLowerCase();
  return (
    Object.entries(KPI_PRESETS).find(([k]) => key.includes(k))?.[1] ||
    DEFAULT_KPI
  );
}

function formatGreeting(name) {
  const first = String(name || "").split(" ")[0] || "there";
  const hour = new Date().getHours();
  const tod = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return { tod, first };
}

export default function Wellness() {
  const dispatch = useDispatch();
  const [selKpi, setSelKpi] = useState(null);
  const [mood, setMood] = useState(null);

  const user = useSelector((state) => state.auth.user);
  const {
    items,
    loading,
    error,
    trends,
    suggestions,
  } = useSelector((state) => state.dashboard);
  const { mySubmissions } = useSelector((state) => state.session);

  useEffect(() => {
    dispatch(fetchDashboardKpis());
    dispatch(fetchWellnessTrends({ period: "weekly" }));
    dispatch(fetchMySubmissions());
  }, [dispatch]);

  const latestSessionId = mySubmissions?.[0]?.session_id || "";
  useEffect(() => {
    if (latestSessionId) {
      dispatch(fetchSessionSuggestions(latestSessionId));
    }
  }, [dispatch, latestSessionId]);

  // KPI tiles mapped from the slice — adds icon/color presets and a precomputed
  // sparkline pulled from the matching trend series.
  const kpis = useMemo(() => {
    const sparkByName = {};
    (trends.series || []).forEach((s) => {
      if (s.kpi_name) {
        sparkByName[String(s.kpi_name).toLowerCase()] = (s.points || []).map(
          (p) => Number(p.average_score) || 0,
        );
      }
    });

    return (items || []).map((it) => {
      const preset = presetFor(it.kpi_name);
      const id = String(it.kpi_key ?? it.kpi_name);
      const sparkValues =
        sparkByName[String(it.kpi_name || "").toLowerCase()] || [];
      return {
        id,
        label: String(it.kpi_name || "KPI").replace(/\bKPI\b/gi, "").trim(),
        score: Number(it.latest_score) || 0,
        delta: Number(it.trend_percent) || 0,
        icon: preset.icon,
        color: preset.color,
        sf: preset.sf,
        sparkValues,
        questions: Array.isArray(it.questions)
          ? it.questions.map((q) => ({
              label: q.question_text || q.label || "Question",
              score: Number(q.score ?? q.average_score) || 0,
              threshold: Number(q.threshold) || 3,
            }))
          : [],
      };
    });
  }, [items, trends.series]);

  const wellnessIndex = useMemo(() => {
    if (!kpis.length) return 0;
    const avg = kpis.reduce((s, k) => s + k.score, 0) / kpis.length;
    return Math.round(avg * 20); // 0–5 → 0–100
  }, [kpis]);

  const overallSpark = useMemo(() => {
    const series = trends.overall?.points || [];
    return series.map((p) => Number(p.average_score) || 0);
  }, [trends.overall]);

  const overallDelta = Math.round(trends.overall?.delta_percent || 0);

  const tipItems = useMemo(() => {
    const items = (suggestions?.items || []).slice(0, 2);
    if (items.length) {
      return items.map((s) => ({
        ic: String(s.suggestion_type || "").toLowerCase().includes("vihar")
          ? "🌅"
          : "🥗",
        t:
          String(s.suggestion_type || "").charAt(0).toUpperCase() +
            String(s.suggestion_type || "").slice(1) || "Tip",
        s: s.description || s.title || "",
      }));
    }
    return [
      {
        ic: "🥗",
        t: "Aahar",
        s: "Warm turmeric milk at bedtime — supports sleep recovery",
      },
      {
        ic: "🌅",
        t: "Vihar",
        s: "5-min Anulom Vilom at 10 AM · drink 8 glasses today",
      },
    ];
  }, [suggestions]);

  const selectedKpi = kpis.find((k) => k.id === selKpi) || null;
  const { tod, first } = formatGreeting(user?.name);

  return (
    <div style={{ position: "relative" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 16px 6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo s={22} />
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                background: "linear-gradient(90deg,#4a7c2f,#6db33f)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AYUMONK
            </div>
            <div
              style={{
                fontSize: 7.5,
                color: "rgba(255,255,255,.2)",
                letterSpacing: 0.8,
              }}
            >
              WELLNESS PLATFORM
            </div>
          </div>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `linear-gradient(135deg,${C.g1},${C.g3})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          {(first[0] || "U").toUpperCase()}
        </div>
      </div>

      <div style={{ padding: "2px 16px 10px" }}>
        <div style={{ fontSize: 9, color: C.muted }}>{tod},</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
          {first} 👋
        </div>
      </div>

      {error && (
        <div
          style={{
            margin: "0 12px 10px",
            padding: "8px 12px",
            background: "rgba(248,113,113,.08)",
            border: "1px solid rgba(248,113,113,.3)",
            borderRadius: 12,
            color: "#fca5a5",
            fontSize: 10,
          }}
        >
          {error}
        </div>
      )}

      {/* Wellness Index hero */}
      <div
        style={{
          margin: "0 12px 12px",
          background: `linear-gradient(135deg,${C.card},#192a1a)`,
          borderRadius: 20,
          padding: 16,
          border: `1px solid ${C.border}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -16,
            top: -16,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: `${C.g3}07`,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 3,
              }}
            >
              Wellness Index
            </div>
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {loading && !wellnessIndex ? "—" : wellnessIndex}
              <span
                style={{
                  fontSize: 14,
                  color: C.muted,
                  fontWeight: 500,
                }}
              >
                /100
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {overallDelta !== 0 && (
                <Pill
                  label={`${overallDelta >= 0 ? "▲" : "▼"} ${Math.abs(overallDelta)}% this week`}
                  color={overallDelta >= 0 ? "#4ade80" : "#f87171"}
                />
              )}
              <Pill label="WHO SF-12" color={C.muted} />
            </div>
            {overallSpark.length >= 2 && (
              <div style={{ marginTop: 8 }}>
                <Spark vals={overallSpark} color={C.g3} w={110} h={20} />
              </div>
            )}
          </div>
          <Donut pct={wellnessIndex} size={84} color={C.g3} label="GOOD" />
        </div>
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: "1px solid rgba(255,255,255,.05)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.g3,
              animation: "ayumonkPulse 2s infinite",
            }}
          />
          <span style={{ fontSize: 9, color: C.muted }}>
            Auto-synced · Google Health · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Mood + Dosha */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          margin: "0 12px 12px",
        }}
      >
        <div
          style={{
            background: C.card,
            borderRadius: 16,
            padding: 12,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 8,
            }}
          >
            Today's Mood
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            {["😞", "😕", "😐", "🙂", "😄"].map((e, i) => (
              <button
                key={e}
                type="button"
                onClick={() => setMood(mood === i ? null : i)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  border:
                    mood === i ? `2px solid ${C.g3}` : "2px solid transparent",
                  background:
                    mood === i ? `${C.g3}18` : "rgba(255,255,255,.04)",
                  fontSize: 18,
                  cursor: "pointer",
                  transition: "all .15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {e}
              </button>
            ))}
          </div>
          {mood !== null && (
            <div
              style={{ fontSize: 9, color: C.g3, textAlign: "center", marginTop: 4 }}
            >
              ✓ Mood logged
            </div>
          )}
        </div>

        <div
          style={{
            background: C.card,
            borderRadius: 16,
            padding: 10,
            border: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 4,
            }}
          >
            Prakriti · Dosha
          </div>
          <DoshaRing vata={30} pitta={34} kapha={36} size={78} />
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 4,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {[
              ["Vata", "#38bdf8", 30],
              ["Pitta", "#f97316", 34],
              ["Kapha", "#22c55e", 36],
            ].map(([n, c, v]) => (
              <div
                key={n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 8,
                  color: "rgba(255,255,255,.45)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 1,
                    background: c,
                    display: "inline-block",
                  }}
                />
                {n} {v}%
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ padding: "0 12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>
            KPI Overview
          </span>
          <span style={{ fontSize: 9, color: C.g3 }}>Tap any tile →</span>
        </div>

        {loading && !kpis.length ? (
          <div
            style={{
              padding: "20px 0",
              color: C.muted,
              fontSize: 10,
              textAlign: "center",
            }}
          >
            Loading wellness metrics…
          </div>
        ) : kpis.length === 0 ? (
          <div
            style={{
              padding: "20px 0",
              color: C.muted,
              fontSize: 10,
              textAlign: "center",
            }}
          >
            No KPI metrics available yet.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 7,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {kpis.map((k) => (
              <div
                key={k.id}
                onClick={() => setSelKpi(k.id)}
                style={{
                  minWidth: 76,
                  background: C.card,
                  borderRadius: 14,
                  padding: "10px 6px",
                  border: `1px solid ${k.color}33`,
                  textAlign: "center",
                  flexShrink: 0,
                  cursor: "pointer",
                  transition: "all .15s",
                  boxShadow: selKpi === k.id ? `0 0 16px ${k.color}33` : "none",
                  borderColor: selKpi === k.id ? k.color : `${k.color}33`,
                }}
              >
                <div style={{ fontSize: 19, marginBottom: 2 }}>{k.icon}</div>
                <div
                  style={{
                    fontSize: 8,
                    color: "rgba(255,255,255,.3)",
                    marginBottom: 1,
                    lineHeight: 1.2,
                  }}
                >
                  {k.label}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: k.color,
                    lineHeight: 1,
                  }}
                >
                  {k.score.toFixed(1)}
                </div>
                {k.delta !== 0 && (
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      marginTop: 2,
                      color: k.delta > 0 ? "#4ade80" : "#f87171",
                    }}
                  >
                    {k.delta > 0 ? "▲" : "▼"}
                    {Math.abs(k.delta)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lifestyle suggestions */}
      <div
        style={{
          margin: "12px 12px 0",
          background: "rgba(109,179,63,.04)",
          borderRadius: 16,
          padding: 12,
          border: "1px solid rgba(109,179,63,.12)",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: C.g3, marginBottom: 8 }}>
          🌿 Today's Ayumonk Tips
        </div>
        {tipItems.map((s, i) => (
          <div
            key={`${s.t}-${i}`}
            style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: `${C.g3}14`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {s.ic}
            </div>
            <div>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.g3 }}>
                {s.t} →{" "}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,.42)",
                  lineHeight: 1.4,
                }}
              >
                {s.s}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selKpi && <KpiSheet kpi={selectedKpi} onClose={() => setSelKpi(null)} />}
    </div>
  );
}
