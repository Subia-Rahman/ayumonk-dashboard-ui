import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearMySubmissionsState,
  clearMyLinksState,
  fetchMyLinks,
  fetchMySubmissions,
} from "../../store/sessionSlice";
import { formatDateIST, formatDateTimeIST } from "../../utils/dateTime";
import { ACCENT, useClientPalette } from "../../utils/clientPalette";

// Dark defaults retained for module-level helpers (SubmittedList /
// PendingList / SubmissionDetail) — they keep the brand dark green look
// when consumed inside the theme-aware wrapper below.
const C = { ...ACCENT, bg: "#0b160c", card: "#111e12", border: "#1e3d20", muted: "#6B8F60" };

const KPI_ICONS = ["🧠", "🔥", "💧", "🧘", "🌙", "🏃", "🥗", "💪", "❤️"];
const KPI_COLORS = [
  "#7c6af7", // sleep
  "#f97316", // stress
  "#22c55e", // nutrition
  "#38bdf8", // hydration
  "#a3e635", // activity
  "#facc15", // digestion
  "#ec4899", // pain
  "#f59e0b", // energy
  "#06b6d4",
];

const getKpiIcon = (index) => KPI_ICONS[index % KPI_ICONS.length];
const getKpiColor = (index) => KPI_COLORS[index % KPI_COLORS.length];

function getDaysSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

// Risk band by average score (1-5 scale)
const riskBandOf = (avg) => {
  if (avg >= 4) return { label: "good", color: C.g3 };
  if (avg >= 3) return { label: "moderate", color: C.gold };
  if (avg >= 2) return { label: "risk", color: C.orange };
  return { label: "critical", color: C.red };
};

// Wellness index colour band (0-100 scale)
const wiBandOf = (wi) => {
  if (wi >= 80) return { label: "Excellent", color: C.g3 };
  if (wi >= 60) return { label: "Good", color: C.g4 };
  if (wi >= 40) return { label: "Moderate", color: C.gold };
  return { label: "Needs Attention", color: C.red };
};

const toWi100 = (score0to5) =>
  Math.max(0, Math.min(100, Math.round((Number(score0to5) || 0) * 20)));

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
          transition: "width 0.5s",
        }}
      />
    </div>
  );
}

function Notice({ tone = "info", children }) {
  const palette = {
    info: { bg: "rgba(74,144,196,0.08)", border: "rgba(74,144,196,0.3)", color: C.blue },
    error: { bg: "rgba(240,80,80,0.08)", border: "rgba(240,80,80,0.3)", color: "#f87171" },
    success: { bg: "rgba(107,179,63,0.08)", border: "rgba(107,179,63,0.3)", color: C.g3 },
  }[tone];
  return (
    <div
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        borderRadius: 9,
        padding: "8px 14px",
        fontSize: 10,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

export default function MyResponses() {
  const dispatch = useDispatch();
  const themed = useClientPalette();
  const [activeTab, setActiveTab] = useState("submitted");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [expandedKpiKey, setExpandedKpiKey] = useState(null);
  const {
    mySubmissions,
    mySubmissionsLoading,
    mySubmissionsError,
    mySubmissionsMessage,
    myLinks,
    myLinksLoading,
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

  const unansweredLinks = useMemo(() => {
    const submittedIds = new Set(
      mySubmissions
        .filter((session) => (session.responses || []).length)
        .map((session) => session.session_id),
    );
    return myLinks.filter((item) => !submittedIds.has(item.session_id));
  }, [myLinks, mySubmissions]);

  const summary = useMemo(() => {
    const responses = mySubmissions.flatMap(
      (session) => session.responses || [],
    );
    const averageScore = responses.length
      ? Number(
          (
            responses.reduce(
              (total, item) => total + (item.weighted_index || 0),
              0,
            ) / responses.length
          ).toFixed(2),
        )
      : 0;
    const overdueForms = unansweredLinks.filter((item) => {
      const daysOpen = getDaysSince(item.published_at);
      return daysOpen !== null && daysOpen >= 7;
    });

    return {
      submittedForms: mySubmissions.length,
      pendingForms: unansweredLinks.length,
      overdueForms: overdueForms.length,
      averageScore,
      averageWi: toWi100(averageScore),
    };
  }, [mySubmissions, unansweredLinks]);

  const visibleTab =
    !mySubmissions.length && unansweredLinks.length ? "pending" : activeTab;

  return (
    <Layout role="user" title="My Responses">
      <div
        style={{
          background: themed.bg,
          color: themed.text,
          borderRadius: 14,
          padding: 16,
          fontFamily: "inherit",
          colorScheme: themed.isDark ? "dark" : "light",
        }}
      >
        {/* Subtitle strip */}
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.32)",
            marginBottom: 14,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            paddingBottom: 10,
          }}
        >
          📋 My Responses — View submitted wellness forms with KPI scores, and
          fill pending forms
        </div>

        {mySubmissionsError && <Notice tone="error">{mySubmissionsError}</Notice>}
        {myLinksError && <Notice tone="error">{myLinksError}</Notice>}
        {!mySubmissionsError && mySubmissionsMessage && (
          <Notice tone="success">{mySubmissionsMessage}</Notice>
        )}

        {/* SUMMARY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {[
            [
              "📋",
              "Forms Submitted",
              summary.submittedForms,
              "Total completed",
              C.g3,
            ],
            [
              "⏳",
              "Pending",
              summary.pendingForms,
              "Awaiting response",
              summary.overdueForms > 0 ? C.red : C.gold,
            ],
            [
              "⚠️",
              "Overdue",
              summary.overdueForms,
              "Submit immediately",
              summary.overdueForms > 0 ? C.red : C.muted,
            ],
            [
              "📈",
              "Avg WI Score",
              summary.averageWi,
              "Across submissions",
              C.g3,
            ],
          ].map(([icon, lbl, val, sub, col]) => (
            <div
              key={lbl}
              style={{
                background: "rgba(255,255,255,0.025)",
                borderRadius: 12,
                padding: "12px 14px",
                border: `1px solid ${col}22`,
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
              <div style={{ fontSize: 8.5, color: C.muted, marginBottom: 2 }}>
                {lbl}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: col }}>
                {val}
              </div>
              <div
                style={{
                  fontSize: 7.5,
                  color: "rgba(255,255,255,0.22)",
                  marginTop: 2,
                }}
              >
                {sub}
              </div>
            </div>
          ))}
        </div>

        {(mySubmissionsLoading || myLinksLoading) && (
          <Notice tone="info">Loading your wellness responses…</Notice>
        )}

        {/* TAB TOGGLE */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "rgba(0,0,0,0.3)",
            borderRadius: 10,
            padding: 3,
            marginBottom: 14,
            width: "fit-content",
          }}
        >
          {[
            ["submitted", "✅ Submitted", summary.submittedForms],
            ["pending", "⏳ Pending", summary.pendingForms],
          ].map(([id, label, count]) => {
            const active = visibleTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 7,
                  border: "none",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: active
                    ? `linear-gradient(135deg, ${C.g1}, ${C.g2})`
                    : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.4)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {label}
                <span
                  style={{
                    fontSize: 8,
                    background: "rgba(255,255,255,0.15)",
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
          <SubmittedList
            sessions={mySubmissions}
            loading={mySubmissionsLoading}
            selectedSessionId={selectedSessionId}
            onSelect={(id) => {
              setSelectedSessionId(id);
              setExpandedKpiKey(null);
            }}
            expandedKpiKey={expandedKpiKey}
            onExpandKpi={setExpandedKpiKey}
          />
        )}

        {/* PENDING LIST */}
        {visibleTab === "pending" && (
          <PendingList
            links={unansweredLinks}
            loading={myLinksLoading}
          />
        )}
      </div>
    </Layout>
  );
}

function SubmittedList({
  sessions,
  loading,
  selectedSessionId,
  onSelect,
  expandedKpiKey,
  onExpandKpi,
}) {
  if (!loading && !sessions.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 0",
          color: C.muted,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
          No submissions yet
        </div>
        <div style={{ fontSize: 10, marginTop: 4 }}>
          Once you submit session forms, they will appear here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sessions.map((session) => {
        const latestResponse = session.responses?.[0];
        const latestScore = latestResponse?.weighted_index ?? 0;
        const wi = toWi100(latestScore);
        const band = wiBandOf(wi);
        const isSelected = selectedSessionId === session.session_id;
        const kpiScores = latestResponse?.kpi_scores || [];

        return (
          <div
            key={session.session_id}
            onClick={() => onSelect(isSelected ? null : session.session_id)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = `${C.g3}44`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
              }
            }}
            style={{
              background: "rgba(255,255,255,0.025)",
              borderRadius: 12,
              border: `1px solid ${isSelected ? `${C.g3}55` : "rgba(255,255,255,0.07)"}`,
              padding: "14px 16px",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0 }}>
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
                      fontSize: 8,
                      background: "rgba(107,179,63,0.15)",
                      color: C.g3,
                      borderRadius: 5,
                      padding: "1px 7px",
                      fontWeight: 700,
                    }}
                  >
                    ✅ SUBMITTED
                  </span>
                  <span style={{ fontSize: 8.5, color: C.muted }}>
                    {session.title}
                  </span>
                  {latestResponse?.submitted_at && (
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
                      · {formatDateTimeIST(latestResponse.submitted_at)}
                    </span>
                  )}
                </div>

                {kpiScores.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    {kpiScores.map((k, index) => {
                      const color = getKpiColor(index);
                      const avg = Number(k.average_score || 0);
                      return (
                        <span
                          key={k.kpi_key}
                          style={{
                            fontSize: 7.5,
                            background: `${color}12`,
                            color,
                            borderRadius: 5,
                            padding: "2px 7px",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          {getKpiIcon(index)} {k.kpi_name}{" "}
                          <span style={{ fontWeight: 700 }}>
                            {avg.toFixed(1)}
                          </span>
                          <RiskBadge avg={avg} />
                        </span>
                      );
                    })}
                  </div>
                )}

                <div
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span
                    style={{
                      fontSize: 8,
                      color: C.muted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    WI
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 4,
                        width: `${wi}%`,
                        background: `linear-gradient(90deg, ${C.g2}, ${band.color})`,
                      }}
                    />
                  </div>
                  <span
                    style={{ fontSize: 13, fontWeight: 800, color: band.color }}
                  >
                    {wi}
                  </span>
                  <span style={{ fontSize: 8, color: C.muted }}>{band.label}</span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
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
                <div style={{ fontSize: 7.5, color: C.muted, marginTop: 3 }}>
                  {isSelected ? "Tap to collapse ▲" : "Tap to expand →"}
                </div>
              </div>
            </div>

            {isSelected && latestResponse && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ marginTop: 14 }}
              >
                <SubmissionDetail
                  session={session}
                  response={latestResponse}
                  expandedKpiKey={expandedKpiKey}
                  onExpandKpi={onExpandKpi}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SubmissionDetail({ session, response, expandedKpiKey, onExpandKpi }) {
  const wi = toWi100(response.weighted_index ?? 0);
  const band = wiBandOf(wi);
  const kpis = response.kpi_scores || [];

  // Equal-weight contribution per KPI for breakdown formula
  const weight = kpis.length > 0 ? 1 / kpis.length : 0;

  return (
    <div>
      {/* GRADIENT HEADER */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.g1}, ${C.g2})`,
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 8.5,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 3,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {session.title}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 2,
              }}
            >
              Wellness Check-in
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>
              Submitted {formatDateTimeIST(response.submitted_at)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.45)",
                marginBottom: 2,
              }}
            >
              Wellness Index
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {wi}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.55)",
                marginTop: 2,
              }}
            >
              {band.label}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 12,
            height: 6,
            borderRadius: 6,
            background: "rgba(255,255,255,0.15)",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 6,
              width: `${wi}%`,
              background: "rgba(255,255,255,0.85)",
              transition: "width 0.8s",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 3,
            fontSize: 7,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <span>0</span>
          <span>40 Moderate</span>
          <span>60 Good</span>
          <span>80 Excellent</span>
          <span>100</span>
        </div>
      </div>

      {/* KPI EXPANDABLE CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 10,
          marginBottom: 14,
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
                background: "rgba(255,255,255,0.025)",
                borderRadius: 12,
                border: `1px solid ${isExp ? `${color}55` : C.border}`,
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
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
                      marginBottom: 5,
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {k.kpi_name}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <RiskBadge avg={avg} />
                      <span
                        style={{
                          fontSize: 14,
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
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    <ScoreBar score={avg} color={color} />
                    <span style={{ fontSize: 8, color: C.muted }}>{pct}%</span>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: C.muted }}>
                  {isExp ? "▲" : "▼"}
                </span>
              </div>
              {isExp && (
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.15)",
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
                    <div style={{ color: "rgba(255,255,255,0.45)" }}>
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
                    <div style={{ color: "rgba(255,255,255,0.45)" }}>
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
                    <div style={{ color: "rgba(255,255,255,0.45)" }}>
                      Average Score
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
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      paddingTop: 5,
                      marginTop: 7,
                      fontSize: 7.5,
                      color: "rgba(255,255,255,0.25)",
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

      {/* WI BREAKDOWN */}
      {kpis.length > 0 && (
        <div
          style={{
            background: "rgba(107,179,63,0.04)",
            border: "1px solid rgba(107,179,63,0.12)",
            borderRadius: 12,
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.g3,
              marginBottom: 10,
            }}
          >
            📊 Wellness Index Breakdown
            <span
              style={{
                fontSize: 8,
                color: C.muted,
                fontWeight: 400,
                marginLeft: 6,
              }}
            >
              Formula: Σ[(KPI score − 1) / 4 × weight] × 100
            </span>
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
                  gridTemplateColumns: "18px 100px 1fr 90px 50px 60px",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 5,
                }}
              >
                <span style={{ fontSize: 11 }}>{getKpiIcon(index)}</span>
                <span
                  style={{
                    fontSize: 8,
                    color: "rgba(255,255,255,0.45)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {k.kpi_name}
                </span>
                <div
                  style={{
                    height: 4,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.06)",
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
                <span
                  style={{
                    fontSize: 7.5,
                    color: C.muted,
                    textAlign: "center",
                    fontFamily: "monospace",
                  }}
                >
                  {avg.toFixed(2)}→{Math.round(norm * 100)}%
                </span>
                <span
                  style={{
                    fontSize: 7.5,
                    color: C.muted,
                    textAlign: "center",
                  }}
                >
                  ×{Math.round(weight * 100)}%
                </span>
                <span
                  style={{
                    fontSize: 9,
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
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 6,
              marginTop: 4,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 8.5, color: C.muted }}>
              Wellness Index =
            </span>
            <span style={{ fontSize: 24, fontWeight: 900, color: C.g3 }}>
              {wi}
            </span>
            <span style={{ fontSize: 9, color: C.muted }}>/ 100</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PendingList({ links, loading }) {
  if (!loading && !links.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 0",
          color: C.muted,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          All forms submitted — you&apos;re up to date!
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {links.map((item) => {
        const daysOpen = getDaysSince(item.published_at);
        const isOverdue = daysOpen !== null && daysOpen >= 7;
        const accent = isOverdue ? C.red : C.gold;
        const borderRest = isOverdue
          ? "rgba(224,80,80,0.3)"
          : "rgba(232,160,32,0.2)";

        return (
          <div
            key={item.session_id}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = borderRest;
            }}
            style={{
              background: "rgba(255,255,255,0.025)",
              borderRadius: 12,
              border: `1px solid ${borderRest}`,
              padding: "14px 16px",
              transition: "border-color 0.2s",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    background: isOverdue
                      ? "rgba(224,80,80,0.15)"
                      : "rgba(232,160,32,0.15)",
                    color: accent,
                    borderRadius: 5,
                    padding: "1px 8px",
                  }}
                >
                  {isOverdue ? "⚠️ OVERDUE" : "⏳ PENDING"}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#fff" }}>
                  {item.title}
                </span>
              </div>
              <span
                style={{
                  fontSize: 8,
                  color: isOverdue ? C.red : C.muted,
                  whiteSpace: "nowrap",
                }}
              >
                Published {formatDateIST(item.published_at)}
                {daysOpen !== null && (
                  <>
                    {" "}
                    · Open {daysOpen} day{daysOpen === 1 ? "" : "s"}
                  </>
                )}
              </span>
            </div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.45)",
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              {item.description || "No description provided."}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 8.5, color: C.muted }}>
                Review the form and submit it when you are ready.
              </span>
              <a
                href={item.form_url || undefined}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (!item.form_url) e.preventDefault();
                }}
                style={{
                  padding: "7px 18px",
                  borderRadius: 9,
                  border: "none",
                  fontWeight: 700,
                  fontSize: 10,
                  textDecoration: "none",
                  color: item.form_url ? "#fff" : "rgba(255,255,255,0.3)",
                  background: item.form_url
                    ? isOverdue
                      ? `linear-gradient(135deg, #991B1B, ${C.red})`
                      : `linear-gradient(135deg, ${C.g1}, ${C.g2})`
                    : "rgba(255,255,255,0.06)",
                  cursor: item.form_url ? "pointer" : "not-allowed",
                  pointerEvents: item.form_url ? "auto" : "none",
                  display: "inline-block",
                }}
              >
                {isOverdue ? "Submit Now →" : "Open Form →"}
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
