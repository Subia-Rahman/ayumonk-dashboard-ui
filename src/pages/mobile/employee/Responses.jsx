import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { C } from "../../../components/mobile/palette";
import { Pill } from "../../../components/mobile/primitives";
import {
  clearMyLinksState,
  clearMySubmissionsState,
  fetchMyLinks,
  fetchMySubmissions,
} from "../../../store/sessionSlice";
import { formatDateIST, formatDateTimeIST } from "../../../utils/dateTime";

const KPI_ICONS = ["🧠", "🔥", "💧", "🧘", "🌙", "🏃", "🥗", "💪", "❤️"];
const KPI_COLORS = [
  "#7c6af7",
  "#f97316",
  "#22c55e",
  "#38bdf8",
  "#a3e635",
  "#facc15",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
];

const getKpiIcon = (i) => KPI_ICONS[i % KPI_ICONS.length];
const getKpiColor = (i) => KPI_COLORS[i % KPI_COLORS.length];

const toWi100 = (score0to5) =>
  Math.max(0, Math.min(100, Math.round((Number(score0to5) || 0) * 20)));

const wiBandOf = (wi) => {
  if (wi >= 80) return { label: "Excellent", color: C.g3 };
  if (wi >= 60) return { label: "Good", color: C.g4 };
  if (wi >= 40) return { label: "Moderate", color: C.gold };
  return { label: "Needs Attention", color: "#f87171" };
};

const riskBandOf = (avg) => {
  if (avg >= 4) return { label: "good", color: C.g3 };
  if (avg >= 3) return { label: "moderate", color: C.gold };
  if (avg >= 2) return { label: "risk", color: C.orange };
  return { label: "critical", color: "#f87171" };
};

const getDaysSince = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
};

function RiskBadge({ avg }) {
  const r = riskBandOf(avg);
  return (
    <span
      style={{
        fontSize: 7,
        fontWeight: 700,
        background: `${r.color}28`,
        color: r.color,
        borderRadius: 4,
        padding: "1px 6px",
        textTransform: "uppercase",
      }}
    >
      {r.label}
    </span>
  );
}

function ScoreBar({ score, color }) {
  const pct = Math.max(0, Math.min(100, ((score - 1) / 4) * 100));
  return (
    <div
      style={{
        flex: 1,
        height: 5,
        borderRadius: 5,
        background: "rgba(255,255,255,0.07)",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 5,
          width: `${pct}%`,
          background: color,
          transition: "width .4s",
        }}
      />
    </div>
  );
}

// Expanded session detail — mirrors the desktop SubmissionDetail layout but
// stacks the KPI cards in a single column for mobile width.
function SubmissionDetail({
  session,
  response,
  expandedKpiKey,
  onExpandKpi,
}) {
  const wi = toWi100(response.weighted_index ?? 0);
  const band = wiBandOf(wi);
  const kpis = response.kpi_scores || [];
  const weight = kpis.length > 0 ? 1 / kpis.length : 0;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Gradient hero */}
      <div
        style={{
          background: `linear-gradient(135deg,${C.g1},${C.g2})`,
          borderRadius: 14,
          padding: "14px 14px",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,.55)",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 3,
              }}
            >
              {session.title}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 2,
              }}
            >
              Wellness Check-in
            </div>
            <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.55)" }}>
              Submitted {formatDateTimeIST(response.submitted_at)}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: 7.5,
                color: "rgba(255,255,255,.5)",
                marginBottom: 2,
              }}
            >
              Wellness Index
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {wi}
            </div>
            <div
              style={{
                fontSize: 8.5,
                color: "rgba(255,255,255,.55)",
                marginTop: 2,
              }}
            >
              {band.label}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            height: 5,
            borderRadius: 5,
            background: "rgba(255,255,255,.18)",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 5,
              width: `${wi}%`,
              background: "rgba(255,255,255,.9)",
              transition: "width .6s",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 3,
            fontSize: 6.5,
            color: "rgba(255,255,255,.4)",
          }}
        >
          <span>0</span>
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>100</span>
        </div>
      </div>

      {/* KPI cards — single column on mobile */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {kpis.map((k, index) => {
          const color = getKpiColor(index);
          const isExp = expandedKpiKey === k.kpi_key;
          const avg = Number(k.average_score || 0);
          const pct = Math.round(((avg - 1) / 4) * 100);

          return (
            <div
              key={k.kpi_key}
              onClick={() => onExpandKpi(isExp ? null : k.kpi_key)}
              style={{
                background: "rgba(255,255,255,.025)",
                borderRadius: 12,
                border: `1px solid ${isExp ? `${color}55` : C.border}`,
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color .2s",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>{getKpiIcon(index)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 5,
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {k.kpi_name}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <RiskBadge avg={avg} />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color,
                        }}
                      >
                        {avg.toFixed(2)}
                      </span>
                      <span style={{ fontSize: 8, color: C.muted }}>/5</span>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <ScoreBar score={avg} color={color} />
                    <span style={{ fontSize: 8, color: C.muted }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: C.muted }}>
                  {isExp ? "▲" : "▼"}
                </span>
              </div>
              {isExp && (
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,.06)",
                    padding: "10px 12px",
                    background: "rgba(0,0,0,.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 8,
                    }}
                  >
                    KPI Details
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 6,
                      fontSize: 9,
                    }}
                  >
                    <div style={{ color: "rgba(255,255,255,.45)" }}>
                      Total Score
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {k.total_score}
                    </div>
                    <div style={{ color: "rgba(255,255,255,.45)" }}>
                      Questions
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {k.question_count}
                    </div>
                    <div style={{ color: "rgba(255,255,255,.45)" }}>
                      Average
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color,
                      }}
                    >
                      {avg.toFixed(2)} / 5
                    </div>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,.05)",
                      paddingTop: 5,
                      marginTop: 7,
                      fontSize: 7.5,
                      color: "rgba(255,255,255,.25)",
                      fontFamily: "monospace",
                    }}
                  >
                    KPI avg = {k.total_score} / {k.question_count} ={" "}
                    {avg.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Wellness Index breakdown */}
      {kpis.length > 0 && (
        <div
          style={{
            background: "rgba(109,179,63,.04)",
            border: "1px solid rgba(109,179,63,.12)",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.g3,
              marginBottom: 4,
            }}
          >
            📊 Wellness Index Breakdown
          </div>
          <div
            style={{
              fontSize: 7.5,
              color: C.muted,
              marginBottom: 10,
              fontFamily: "monospace",
            }}
          >
            Formula: Σ[(KPI score − 1) / 4 × weight] × 100
          </div>
          {kpis.map((k, index) => {
            const color = getKpiColor(index);
            const avg = Number(k.average_score || 0);
            const norm = (avg - 1) / 4;
            const contrib = norm * weight * 100;
            return (
              <div
                key={`${k.kpi_key}-breakdown`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "14px 1fr auto",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 11 }}>{getKpiIcon(index)}</span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 8.5,
                      color: "rgba(255,255,255,.55)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: 2,
                    }}
                  >
                    {k.kpi_name}
                  </div>
                  <div
                    style={{
                      height: 3,
                      borderRadius: 3,
                      background: "rgba(255,255,255,.06)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        width: `${Math.max(0, norm * 100)}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 7,
                      color: C.muted,
                      fontFamily: "monospace",
                      marginTop: 2,
                    }}
                  >
                    {avg.toFixed(2)} → {Math.round(norm * 100)}% × {Math.round(weight * 100)}%
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color,
                    textAlign: "right",
                  }}
                >
                  +{contrib.toFixed(1)}
                </span>
              </div>
            );
          })}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,.08)",
              paddingTop: 7,
              marginTop: 6,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 8.5, color: C.muted }}>
              Wellness Index =
            </span>
            <span style={{ fontSize: 20, fontWeight: 900, color: C.g3 }}>
              {wi}
            </span>
            <span style={{ fontSize: 9, color: C.muted }}>/ 100</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Responses() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tab, setTab] = useState("submitted");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [expandedKpiKey, setExpandedKpiKey] = useState(null);
  const {
    mySubmissions,
    myLinks,
    mySubmissionsLoading,
    myLinksLoading,
    mySubmissionsError,
    myLinksError,
  } = useSelector((state) => state.session);

  useEffect(() => {
    dispatch(fetchMySubmissions());
    dispatch(fetchMyLinks({ skip: 0, limit: 50 }));
    return () => {
      dispatch(clearMySubmissionsState());
      dispatch(clearMyLinksState());
    };
  }, [dispatch]);

  const submittedSessions = useMemo(
    () =>
      (mySubmissions || []).filter(
        (s) => Array.isArray(s.responses) && s.responses.length,
      ),
    [mySubmissions],
  );

  const pendingSessions = useMemo(() => {
    const submittedIds = new Set(submittedSessions.map((s) => s.session_id));
    return (myLinks || []).filter((l) => !submittedIds.has(l.session_id));
  }, [myLinks, submittedSessions]);

  const summary = useMemo(() => {
    const responses = submittedSessions.flatMap((s) => s.responses || []);
    const avgWi = responses.length
      ? Math.round(
          responses.reduce(
            (sum, r) => sum + (Number(r.weighted_index) || 0),
            0,
          ) /
            responses.length *
            20,
        )
      : 0;
    const overdue = pendingSessions.filter((l) => {
      const days = getDaysSince(l.published_at);
      return days !== null && days >= 7;
    }).length;
    return {
      submitted: submittedSessions.length,
      pending: pendingSessions.length,
      avgWi,
      overdue,
    };
  }, [submittedSessions, pendingSessions]);

  // If there's nothing submitted but pending forms exist, default tab to
  // Pending — matches the desktop UX.
  const visibleTab =
    !submittedSessions.length && pendingSessions.length ? "pending" : tab;

  const handleSelectSession = (id) => {
    setSelectedSessionId(id);
    setExpandedKpiKey(null);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100%" }}>
      <div style={{ padding: "8px 16px 10px" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
          📝 My Responses
        </div>
        <div style={{ fontSize: 8.5, color: C.muted }}>
          Wellness forms · submitted &amp; pending
        </div>
      </div>

      {mySubmissionsError && (
        <div
          style={{
            margin: "0 12px 10px",
            padding: "8px 12px",
            background: "rgba(248,113,113,.08)",
            border: "1px solid rgba(248,113,113,.3)",
            borderRadius: 10,
            color: "#fca5a5",
            fontSize: 9.5,
          }}
        >
          {mySubmissionsError}
        </div>
      )}
      {myLinksError && (
        <div
          style={{
            margin: "0 12px 10px",
            padding: "8px 12px",
            background: "rgba(248,113,113,.08)",
            border: "1px solid rgba(248,113,113,.3)",
            borderRadius: 10,
            color: "#fca5a5",
            fontSize: 9.5,
          }}
        >
          {myLinksError}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 9,
          margin: "0 12px 12px",
        }}
      >
        {[
          { l: "Submitted", v: summary.submitted, c: C.g3, i: "✅" },
          {
            l: "Pending",
            v: summary.pending,
            c: summary.overdue > 0 ? "#f87171" : C.orange,
            i: "⏳",
          },
          { l: "Avg WI Score", v: summary.avgWi || "—", c: C.blue, i: "📊" },
          {
            l: "Overdue",
            v: summary.overdue,
            c: summary.overdue > 0 ? "#f87171" : C.muted,
            i: "⚠️",
          },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              background: C.card,
              borderRadius: 14,
              padding: "11px 12px",
              border: `1px solid ${s.c}22`,
            }}
          >
            <div style={{ fontSize: 15, marginBottom: 3 }}>{s.i}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>
              {s.v}
            </div>
            <div style={{ fontSize: 8.5, color: C.muted }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div
        style={{
          margin: "0 12px 12px",
          display: "flex",
          gap: 4,
          background: "rgba(0,0,0,.3)",
          borderRadius: 10,
          padding: 3,
          width: "fit-content",
        }}
      >
        {[
          ["submitted", "✅ Submitted", summary.submitted],
          ["pending", "⏳ Pending", summary.pending],
        ].map(([id, label, count]) => {
          const active = visibleTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                border: "none",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                background: active
                  ? `linear-gradient(135deg,${C.g1},${C.g2})`
                  : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,.4)",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all .2s",
              }}
            >
              {label}
              <span
                style={{
                  fontSize: 8,
                  background: "rgba(255,255,255,.15)",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUBMITTED LIST */}
      {visibleTab === "submitted" && (
        <div
          style={{
            padding: "0 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {mySubmissionsLoading && !submittedSessions.length && (
            <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
              Loading submissions…
            </div>
          )}

          {!mySubmissionsLoading && submittedSessions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: C.muted,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,.55)",
                }}
              >
                No submissions yet
              </div>
              <div style={{ fontSize: 9, marginTop: 4 }}>
                Submitted sessions show up here.
              </div>
            </div>
          )}

          {submittedSessions.map((session) => {
            const latest = session.responses?.[0];
            const wi = toWi100(latest?.weighted_index ?? 0);
            const band = wiBandOf(wi);
            const isSelected = selectedSessionId === session.session_id;
            const kpiScores = latest?.kpi_scores || [];

            return (
              <div
                key={session.session_id}
                onClick={() =>
                  handleSelectSession(isSelected ? null : session.session_id)
                }
                style={{
                  background: C.card,
                  borderRadius: 14,
                  border: `1px solid ${isSelected ? `${C.g3}55` : C.border}`,
                  padding: "12px 14px",
                  cursor: "pointer",
                  transition: "border-color .2s",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 7.5,
                          background: "rgba(107,179,63,.15)",
                          color: C.g3,
                          borderRadius: 4,
                          padding: "1px 6px",
                          fontWeight: 700,
                        }}
                      >
                        ✅ SUBMITTED
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: "#fff",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 140,
                        }}
                      >
                        {session.title}
                      </span>
                    </div>
                    {latest?.submitted_at && (
                      <div
                        style={{
                          fontSize: 8,
                          color: "rgba(255,255,255,.4)",
                          marginBottom: 6,
                        }}
                      >
                        {formatDateTimeIST(latest.submitted_at)}
                      </div>
                    )}

                    {kpiScores.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          flexWrap: "wrap",
                          marginBottom: 6,
                        }}
                      >
                        {Array.from(
                          new Map(
                            kpiScores.map((k) => [
                              k.kpi_name.replace(/\bKPI\b/gi, "").trim(),
                              k,
                            ]),
                          ).values(),
                        )
                          .slice(0, 4)
                          .map((k, idx) => {
                            const color = getKpiColor(idx);
                            return (
                              <span
                                key={k.kpi_key}
                                style={{
                                  fontSize: 7.5,
                                  background: `${color}14`,
                                  color,
                                  borderRadius: 4,
                                  padding: "1px 6px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                {getKpiIcon(idx)}{" "}
                                {k.kpi_name
                                  .replace(/\bKPI\b/gi, "")
                                  .trim()}{" "}
                                <span style={{ fontWeight: 700 }}>
                                  {Number(k.average_score || 0).toFixed(1)}
                                </span>
                              </span>
                            );
                          })}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 8,
                          color: C.muted,
                        }}
                      >
                        WI
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 4,
                          background: "rgba(255,255,255,.07)",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 4,
                            width: `${wi}%`,
                            background: `linear-gradient(90deg,${C.g2},${band.color})`,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: band.color,
                        }}
                      >
                        {wi}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 2,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: band.color,
                        lineHeight: 1,
                      }}
                    >
                      {wi}
                    </div>
                    <div style={{ fontSize: 7, color: C.muted }}>
                      {isSelected ? "Tap to collapse ▲" : "Tap to expand →"}
                    </div>
                  </div>
                </div>

                {isSelected && latest && (
                  <div style={{ marginTop: 12 }}>
                    <SubmissionDetail
                      session={session}
                      response={latest}
                      expandedKpiKey={expandedKpiKey}
                      onExpandKpi={setExpandedKpiKey}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PENDING LIST */}
      {visibleTab === "pending" && (
        <div
          style={{
            padding: "0 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {myLinksLoading && !pendingSessions.length && (
            <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
              Loading pending forms…
            </div>
          )}

          {!myLinksLoading && pendingSessions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: C.muted,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,.55)",
                }}
              >
                All caught up
              </div>
              <div style={{ fontSize: 9, marginTop: 4 }}>
                No pending forms right now.
              </div>
            </div>
          )}

          {pendingSessions.map((session) => {
            const days = getDaysSince(session.published_at);
            const isOverdue = days !== null && days >= 7;
            const accent = isOverdue ? "#f87171" : C.orange;
            return (
              <div
                key={session.session_id}
                style={{
                  background: C.card,
                  borderRadius: 14,
                  padding: "12px 14px",
                  border: `1px solid ${accent}44`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 9,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <Pill
                        label={isOverdue ? "⚠️ OVERDUE" : "⏳ PENDING"}
                        color={accent}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {session.title}
                    </div>
                    {session.published_at && (
                      <div
                        style={{
                          fontSize: 8.5,
                          color: isOverdue ? "#f87171" : C.muted,
                          marginTop: 2,
                        }}
                      >
                        Published {formatDateIST(session.published_at)}
                        {days !== null && (
                          <span>
                            {" "}
                            · {days} day{days === 1 ? "" : "s"} open
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/sessions/${session.session_id}/form`)
                  }
                  style={{
                    width: "100%",
                    padding: 11,
                    borderRadius: 12,
                    background: `linear-gradient(135deg,${C.g2},${C.g3})`,
                    border: "none",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Fill Form Now →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
