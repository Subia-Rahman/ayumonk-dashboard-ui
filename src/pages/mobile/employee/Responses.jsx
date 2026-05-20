import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { C } from "../../../components/mobile/palette";
import { Pill } from "../../../components/mobile/primitives";
import {
  fetchMyLinks,
  fetchMySubmissions,
} from "../../../store/sessionSlice";
import { formatDateIST } from "../../../utils/dateTime";

const toWi100 = (score0to5) =>
  Math.max(0, Math.min(100, Math.round((Number(score0to5) || 0) * 20)));

const colorForWi = (wi) => {
  if (wi >= 75) return C.g3;
  if (wi >= 55) return C.gold;
  return "#f87171";
};

export default function Responses() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mySubmissions, myLinks, mySubmissionsLoading, myLinksLoading } =
    useSelector((state) => state.session);

  useEffect(() => {
    dispatch(fetchMySubmissions());
    dispatch(fetchMyLinks());
  }, [dispatch]);

  // mySubmissions is a list of sessions; each carries a responses[] array
  // sorted newest-first by the slice normalizer.
  const submittedSessions = useMemo(
    () =>
      (mySubmissions || []).filter((s) => Array.isArray(s.responses) && s.responses.length),
    [mySubmissions],
  );

  const pendingSessions = useMemo(() => {
    const submittedIds = new Set(submittedSessions.map((s) => s.session_id));
    return (myLinks || []).filter((l) => !submittedIds.has(l.session_id));
  }, [myLinks, submittedSessions]);

  const stats = useMemo(() => {
    const submittedCount = submittedSessions.length;
    const pendingCount = pendingSessions.length;
    const responses = submittedSessions.flatMap((s) => s.responses || []);
    const avgWi = responses.length
      ? Math.round(
          responses.reduce((sum, r) => {
            const kpis = r.kpi_scores || [];
            if (!kpis.length) return sum;
            const sessionAvg =
              kpis.reduce((a, k) => a + (Number(k.average_score) || 0), 0) /
              kpis.length;
            return sum + sessionAvg * 20;
          }, 0) / responses.length,
        )
      : 0;
    return { submittedCount, pendingCount, avgWi };
  }, [submittedSessions, pendingSessions]);

  return (
    <div>
      <div style={{ padding: "12px 16px 10px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
          📝 My Responses
        </div>
        <div style={{ fontSize: 9, color: C.muted }}>
          Wellness forms · submitted &amp; pending
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 9,
          margin: "0 12px 12px",
        }}
      >
        {[
          {
            l: "Submitted",
            v: stats.submittedCount,
            c: C.g3,
            i: "✅",
          },
          {
            l: "Pending",
            v: stats.pendingCount,
            c: C.orange,
            i: "⏳",
          },
          {
            l: "Avg WI Score",
            v: stats.avgWi || "—",
            c: C.blue,
            i: "📊",
          },
          {
            l: "Overdue",
            v: 0,
            c: "#f87171",
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
            <div style={{ fontSize: 9, color: C.muted }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 12px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,.4)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 9,
          }}
        >
          Recent Submissions
        </div>

        {mySubmissionsLoading && !submittedSessions.length && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            Loading submissions…
          </div>
        )}

        {!mySubmissionsLoading && submittedSessions.length === 0 && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            No submissions yet.
          </div>
        )}

        {submittedSessions.map((session) => {
          const latest = session.responses?.[0];
          const kpiScores = latest?.kpi_scores || [];
          const avg = kpiScores.length
            ? kpiScores.reduce(
                (a, k) => a + (Number(k.average_score) || 0),
                0,
              ) / kpiScores.length
            : 0;
          const wi = toWi100(avg);
          const wiColor = colorForWi(wi);
          return (
            <div
              key={session.session_id}
              style={{
                background: C.card,
                borderRadius: 16,
                padding: 12,
                border: `1px solid ${C.border}`,
                marginBottom: 9,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 7,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                    {session.title}
                  </div>
                  <div style={{ fontSize: 9, color: C.muted }}>
                    {latest?.submitted_at
                      ? formatDateIST(latest.submitted_at)
                      : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: wiColor,
                      lineHeight: 1,
                    }}
                  >
                    {wi || "—"}
                  </div>
                  <div style={{ fontSize: 8, color: C.muted }}>WI Score</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {kpiScores.slice(0, 4).map((k) => (
                  <Pill
                    key={k.kpi_key}
                    label={k.kpi_name.replace(/\bKPI\b/gi, "").trim()}
                    color={C.g3}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,.4)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 9,
            marginTop: 6,
          }}
        >
          Pending
        </div>

        {myLinksLoading && !pendingSessions.length && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            Loading pending forms…
          </div>
        )}

        {!myLinksLoading && pendingSessions.length === 0 && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            No pending forms.
          </div>
        )}

        {pendingSessions.map((session) => (
          <div
            key={session.session_id}
            style={{
              background: C.card,
              borderRadius: 16,
              padding: 12,
              border: `1px solid ${C.orange}44`,
              marginBottom: 9,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 9,
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                  {session.title}
                </div>
                {session.published_at && (
                  <div style={{ fontSize: 9, color: C.muted }}>
                    Published {formatDateIST(session.published_at)}
                  </div>
                )}
              </div>
              <Pill label="PENDING" color={C.orange} />
            </div>
            <button
              type="button"
              onClick={() => navigate(`/sessions/${session.session_id}/form`)}
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
        ))}
      </div>
    </div>
  );
}
