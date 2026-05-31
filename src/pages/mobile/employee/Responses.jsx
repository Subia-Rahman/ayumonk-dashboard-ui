import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { C } from "../../../components/mobile/palette";
import { Pill } from "../../../components/mobile/primitives";
import { useTokens } from "../../../components/mobile/useTokens";
import {
  clearMyLinksState,
  clearMySubmissionsState,
  fetchMyLinks,
  fetchMySubmissions,
} from "../../../store/sessionSlice";
import { formatDateIST, formatDateTimeIST } from "../../../utils/dateTime";

const KPI_ICONS = ["🧠", "🔥", "💧", "🧘", "🌙", "🏃", "🥗", "💪", "❤️"];
const KPI_COLORS = [
  "#8B6FCB", "#E0935C", "#4F9D5B", "#4A90C4",
  "#8FAE5A", "#C99A3F", "#C36FA8", "#C99A3F", "#3AA8A0",
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
        fontSize: 9,
        fontWeight: 700,
        background: `${r.color}28`,
        color: r.color,
        borderRadius: 5,
        padding: "2px 7px",
        textTransform: "uppercase",
      }}
    >
      {r.label}
    </span>
  );
}

function ScoreBar({ score, color }) {
  const t = useTokens();
  const pct = Math.max(0, Math.min(100, ((score - 1) / 4) * 100));
  return (
    <div
      style={{
        flex: 1,
        height: 5,
        borderRadius: 5,
        background: t.track,
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

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#6B7F5C",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 0,
      }}
    >
      {children}
    </div>
  );
}

function SubmissionDetail({ session, response, expandedKpiKey, onExpandKpi }) {
  const t = useTokens();
  const wi = toWi100(response.weighted_index ?? 0);
  const band = wiBandOf(wi);
  const kpis = response.kpi_scores || [];
  const weight = kpis.length > 0 ? 1 / kpis.length : 0;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Hero gradient */}
      <div
        style={{
          background: `linear-gradient(135deg,${C.g1},${C.g2})`,
          borderRadius: 14,
          padding: "16px",
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
                fontSize: 10,
                color: "rgba(255,255,255,.55)",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 4,
              }}
            >
              {session.title}
            </div>
            <div
              style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 3 }}
            >
              Wellness Check-in
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>
              Submitted {formatDateTimeIST(response.submitted_at)}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", marginBottom: 3 }}>
              Wellness Index
            </div>
            <div
              style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1 }}
            >
              {wi}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 3 }}>
              {band.label}
            </div>
          </div>
        </div>

        {/* WI progress bar */}
        <div
          style={{
            marginTop: 12,
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
            marginTop: 4,
            fontSize: 9,
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

      {/* KPI cards */}
      <div
        style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}
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
                background: t.card2,
                borderRadius: 12,
                border: `1px solid ${isExp ? `${color}55` : t.border}`,
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color .2s",
              }}
            >
              <div
                style={{
                  padding: "12px 13px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 20 }}>{getKpiIcon(index)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.text,
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
                        gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <RiskBadge avg={avg} />
                      <span style={{ fontSize: 14, fontWeight: 800, color }}>
                        {avg.toFixed(2)}
                      </span>
                      <span style={{ fontSize: 10, color: t.muted }}>/5</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <ScoreBar score={avg} color={color} />
                    <span style={{ fontSize: 10, color: t.muted }}>{pct}%</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: t.muted }}>
                  {isExp ? "▲" : "▼"}
                </span>
              </div>

              {isExp && (
                <div
                  style={{
                    borderTop: `1px solid ${t.border}`,
                    padding: "12px 13px",
                    background: t.inset,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: t.muted,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 10,
                    }}
                  >
                    KPI Details
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 6,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ color: t.sub }}>Total Score</div>
                    <div style={{ textAlign: "right", fontWeight: 700, color: t.text }}>
                      {k.total_score}
                    </div>
                    <div style={{ color: t.sub }}>Questions</div>
                    <div style={{ textAlign: "right", fontWeight: 700, color: t.text }}>
                      {k.question_count}
                    </div>
                    <div style={{ color: t.sub }}>Average</div>
                    <div style={{ textAlign: "right", fontWeight: 700, color }}>
                      {avg.toFixed(2)} / 5
                    </div>
                  </div>
                  <div
                    style={{
                      borderTop: `1px solid ${t.border}`,
                      paddingTop: 6,
                      marginTop: 8,
                      fontSize: 10,
                      color: t.sub,
                      fontFamily: "monospace",
                    }}
                  >
                    KPI avg = {k.total_score} / {k.question_count} = {avg.toFixed(2)}
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
            padding: "14px",
          }}
        >
          <div
            style={{ fontSize: 12, fontWeight: 700, color: C.g3, marginBottom: 5 }}
          >
            📊 Wellness Index Breakdown
          </div>
          <div
            style={{
              fontSize: 10,
              color: t.muted,
              marginBottom: 12,
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
                key={`${k.kpi_key}-bd`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "16px 1fr auto",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13 }}>{getKpiIcon(index)}</span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: t.sub,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: 3,
                    }}
                  >
                    {k.kpi_name}
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 4,
                      background: t.track,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 4,
                        width: `${Math.max(0, norm * 100)}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: t.muted,
                      fontFamily: "monospace",
                      marginTop: 3,
                    }}
                  >
                    {avg.toFixed(2)} → {Math.round(norm * 100)}% × {Math.round(weight * 100)}%
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color, textAlign: "right" }}>
                  +{contrib.toFixed(1)}
                </span>
              </div>
            );
          })}

          <div
            style={{
              borderTop: `1px solid ${t.border}`,
              paddingTop: 8,
              marginTop: 8,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 11, color: t.muted }}>Wellness Index =</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: C.g3 }}>{wi}</span>
            <span style={{ fontSize: 11, color: t.muted }}>/ 100</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Responses() {
  const t = useTokens();
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
          (responses.reduce((sum, r) => sum + (Number(r.weighted_index) || 0), 0) /
            responses.length) *
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

  const visibleTab =
    !submittedSessions.length && pendingSessions.length ? "pending" : tab;

  const handleSelectSession = (id) => {
    setSelectedSessionId(id);
    setExpandedKpiKey(null);
  };

  return (
    <div style={{ background: t.bg, minHeight: "100%" }}>
      {/* Page header */}
      <div style={{ padding: "10px 16px 14px" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>
          📝 My Responses
        </div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>
          Wellness forms · submitted &amp; pending
        </div>
      </div>

      {/* Error banners */}
      {mySubmissionsError && (
        <div
          style={{
            margin: "0 16px 12px",
            padding: "10px 14px",
            background: "rgba(248,113,113,.08)",
            border: "1px solid rgba(248,113,113,.3)",
            borderRadius: 10,
            color: "#fca5a5",
            fontSize: 12,
          }}
        >
          {mySubmissionsError}
        </div>
      )}
      {myLinksError && (
        <div
          style={{
            margin: "0 16px 12px",
            padding: "10px 14px",
            background: "rgba(248,113,113,.08)",
            border: "1px solid rgba(248,113,113,.3)",
            borderRadius: 10,
            color: "#fca5a5",
            fontSize: 12,
          }}
        >
          {myLinksError}
        </div>
      )}

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          margin: "0 16px 16px",
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
            c: summary.overdue > 0 ? "#f87171" : t.muted,
            i: "⚠️",
          },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              background: t.card,
              borderRadius: 14,
              padding: "13px 14px",
              border: `1px solid ${s.c}22`,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 5 }}>{s.i}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, lineHeight: 1 }}>
              {s.v}
            </div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div
        style={{
          margin: "0 16px 16px",
          display: "flex",
          gap: 4,
          background: t.inset,
          borderRadius: 12,
          padding: 4,
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
                padding: "8px 16px",
                borderRadius: 9,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: active
                  ? `linear-gradient(135deg,${C.g1},${C.g2})`
                  : "transparent",
                color: active ? "#fff" : t.muted,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all .2s",
                fontFamily: "inherit",
              }}
            >
              {label}
              <span
                style={{
                  fontSize: 10,
                  background: active ? "rgba(255,255,255,.25)" : t.border,
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
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

      {/* ── SUBMITTED LIST ── */}
      {visibleTab === "submitted" && (
        <div
          style={{
            padding: "0 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {mySubmissionsLoading && !submittedSessions.length && (
            <div style={{ fontSize: 12, color: t.muted, padding: "10px 0" }}>
              Loading submissions…
            </div>
          )}

          {!mySubmissionsLoading && submittedSessions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "36px 0",
                color: t.muted,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.text,
                  marginBottom: 5,
                }}
              >
                No submissions yet
              </div>
              <div style={{ fontSize: 12, color: t.muted }}>
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
                  background: t.card,
                  borderRadius: 14,
                  border: `1px solid ${isSelected ? `${C.g3}55` : t.border}`,
                  padding: "14px 14px",
                  cursor: "pointer",
                  transition: "border-color .2s",
                }}
              >
                {/* Card header row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  {/* Left: title + date + KPI pills */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 5,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          background: "rgba(107,179,63,.15)",
                          color: C.g3,
                          borderRadius: 5,
                          padding: "2px 7px",
                          fontWeight: 700,
                        }}
                      >
                        ✅ SUBMITTED
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: t.text,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 150,
                        }}
                      >
                        {session.title}
                      </span>
                    </div>

                    {latest?.submitted_at && (
                      <div
                        style={{ fontSize: 11, color: t.sub, marginBottom: 8 }}
                      >
                        {formatDateTimeIST(latest.submitted_at)}
                      </div>
                    )}

                    {/* KPI pills */}
                    {kpiScores.length > 0 && (
                      <div
                        style={{ display: "flex", gap: 5, flexWrap: "wrap" }}
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
                                  fontSize: 10,
                                  background: `${color}14`,
                                  color,
                                  borderRadius: 5,
                                  padding: "2px 7px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                {getKpiIcon(idx)}{" "}
                                {k.kpi_name.replace(/\bKPI\b/gi, "").trim()}{" "}
                                <span style={{ fontWeight: 700 }}>
                                  {Number(k.average_score || 0).toFixed(1)}
                                </span>
                              </span>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Right: WI score */}
                  <div
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 900,
                        color: band.color,
                        lineHeight: 1,
                      }}
                    >
                      {wi}
                    </div>
                    <div style={{ fontSize: 10, color: band.color, fontWeight: 600 }}>
                      {band.label}
                    </div>
                    <div style={{ fontSize: 10, color: t.muted }}>
                      {isSelected ? "▲ collapse" : "▼ expand"}
                    </div>
                  </div>
                </div>

                {/* WI mini bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <span style={{ fontSize: 10, color: t.muted, flexShrink: 0 }}>WI</span>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 4,
                      background: t.track,
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
                  <span style={{ fontSize: 11, color: t.sub, flexShrink: 0 }}>
                    /100
                  </span>
                </div>

                {/* Expanded detail */}
                {isSelected && latest && (
                  <div style={{ marginTop: 14 }}>
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

      {/* ── PENDING LIST ── */}
      {visibleTab === "pending" && (
        <div
          style={{
            padding: "0 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {myLinksLoading && !pendingSessions.length && (
            <div style={{ fontSize: 12, color: t.muted, padding: "10px 0" }}>
              Loading pending forms…
            </div>
          )}

          {!myLinksLoading && pendingSessions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "36px 0",
                color: t.muted,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.text,
                  marginBottom: 5,
                }}
              >
                All caught up!
              </div>
              <div style={{ fontSize: 12, color: t.muted }}>
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
                  background: t.card,
                  borderRadius: 14,
                  padding: "14px 14px",
                  border: `1px solid ${accent}44`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <Pill
                        label={isOverdue ? "⚠️ OVERDUE" : "⏳ PENDING"}
                        color={accent}
                      />
                    </div>
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}
                    >
                      {session.title}
                    </div>
                    {session.published_at && (
                      <div
                        style={{
                          fontSize: 11,
                          color: isOverdue ? "#f87171" : t.muted,
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
                  onClick={() => navigate(`/sessions/${session.session_id}/form`)}
                  style={{
                    width: "100%",
                    padding: 13,
                    borderRadius: 12,
                    background: `linear-gradient(135deg,${C.g2},${C.g3})`,
                    border: "none",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Fill Form Now →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom spacer */}
      <div style={{ height: 16 }} />
    </div>
  );
}
