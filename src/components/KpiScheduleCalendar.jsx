import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchChallengeSchedule } from "../store/dashboardSlice";

const C = {
  bg: "#0b160c", card: "#111e12", border: "#1e3d20",
  g1: "#2C5F2D", g2: "#4A8C2A", g3: "#6DB33F",
  muted: "#6B8F60", orange: "#E8924A", blue: "#4A90C4",
  purple: "#8B6FCB", gold: "#D4A843", red: "#E05050",
};

function formatDateShort(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function calcProgress(startIso, endIso) {
  const now = Date.now();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function calcDaysLeft(endIso) {
  const diff = new Date(endIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function calcDaysUntil(startIso) {
  const diff = new Date(startIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

//STATUS CONFIG
const STATUS_CONFIG = {
  active: {
    label: "● ACTIVE",
    bg: "rgba(107,179,63,0.2)",
    color: "#6DB33F",
  },
  upcoming: {
    label: "⏳ UPCOMING",
    bg: "rgba(74,144,196,0.2)",
    color: "#4A90C4",
  },
  ended: {
    label: "✓ ENDED",
    bg: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.3)",
  },
  paused: {
    label: "⏸ PAUSED",
    bg: "rgba(212,168,67,0.2)",
    color: "#D4A843",
  },
};

//SKELETON ROW
function SkeletonRow() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "32px 1fr 180px 90px 80px 70px",
      alignItems: "center", gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ height: 10, width: "55%", borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
        <div style={{ height: 8, width: "35%", borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
      </div>
      <div style={{ height: 5, borderRadius: 5, background: "rgba(255,255,255,0.05)" }} />
      <div style={{ height: 8, width: 80, borderRadius: 4, background: "rgba(255,255,255,0.04)", margin: "0 auto" }} />
      <div style={{ height: 8, width: 50, borderRadius: 4, background: "rgba(255,255,255,0.04)", margin: "0 auto" }} />
      <div style={{ height: 18, width: 60, borderRadius: 5, background: "rgba(255,255,255,0.05)", marginLeft: "auto" }} />
    </div>
  );
}

//CALENDAR ROW
function CalendarRow({ item }) {
  const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.ended;
  const pct = calcProgress(item.start_date, item.end_date);
  const color = item.color || C.g3;

  const metaText =
    item.status === "active"
      ? `${calcDaysLeft(item.end_date)}d left`
      : item.status === "upcoming"
        ? `Starts in ${calcDaysUntil(item.start_date)}d`
        : item.status === "paused"
          ? "Paused"
          : "Ended";

  const isEnded = item.status === "ended";
  const isUpcoming = item.status === "upcoming";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "32px 1fr 180px 90px 80px 70px",
      alignItems: "center", gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      opacity: isEnded ? 0.45 : 1,
      transition: "opacity 0.2s",
    }}>
      {/* Icon */}
      <span style={{
        fontSize: 20, lineHeight: 1, textAlign: "center",
        filter: isEnded ? "grayscale(1)" : "none",
      }}>
        {item.icon ?? "🔹"}
      </span>

      {/* Label + theme */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: isEnded ? "rgba(255,255,255,0.35)" : color,
          marginBottom: 2,
        }}>
          {item.label}
        </div>
        <div style={{ fontSize: 8, color: C.muted }}>{item.theme}</div>
      </div>

      {/* Progress bar + % */}
      <div>
        <div style={{
          height: 5, borderRadius: 5,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden", marginBottom: 4,
        }}>
          <div style={{
            height: "100%", borderRadius: 5,
            width: `${pct}%`,
            background: isEnded
              ? "rgba(255,255,255,0.15)"
              : isUpcoming
                ? "transparent"
                : `linear-gradient(90deg,${C.g2},${color})`,
            transition: "width 0.4s",
          }} />
        </div>
        <div style={{
          fontSize: 7.5, color: "rgba(255,255,255,0.25)", textAlign: "right",
        }}>
          {isUpcoming ? "Not started" : `${pct}%`}
        </div>
      </div>

      {/* Date window */}
      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.6 }}>
        <div>{formatDateShort(item.start_date)}</div>
        <div style={{ color: "rgba(255,255,255,0.15)" }}>→</div>
        <div>{formatDateShort(item.end_date)}</div>
      </div>

      {/* Days left / until */}
      <div style={{
        fontSize: 9, fontWeight: 700, textAlign: "center",
        color: item.status === "active" ? color : "rgba(255,255,255,0.25)",
      }}>
        {metaText}
      </div>

      {/* Status badge */}
      <div style={{ textAlign: "right" }}>
        <span style={{
          fontSize: 8, fontWeight: 700,
          background: st.bg, color: st.color,
          borderRadius: 5, padding: "2px 8px",
          whiteSpace: "nowrap",
        }}>
          {st.label}
        </span>
      </div>
    </div>
  );
}

//FILTER PILL
function FilterPill({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 12px", borderRadius: 20, fontSize: 9, fontWeight: 600,
      cursor: "pointer", border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
      background: active ? `${color}18` : "transparent",
      color: active ? color : "rgba(255,255,255,0.35)",
      transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}

//SUMMARY STAT
function SummaryStat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>{label}</div>
    </div>
  );
}

//MAIN COMPONENT

export default function KpiScheduleCalendar({ companyId }) {
  const dispatch = useDispatch();
  const [activeFilter, setActiveFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const items = useSelector((state) => state.dashboard.schedule?.items ?? []);
  const loading = useSelector((state) => state.dashboard.schedule?.loading ?? true);
  const error = useSelector((state) => state.dashboard.schedule?.error ?? null);

  useEffect(() => {
    if (!companyId) return;
    dispatch(fetchChallengeSchedule({ company_id: companyId }));
  }, [dispatch, companyId]);

  const refetch = () => {
    if (companyId) dispatch(fetchChallengeSchedule({ company_id: companyId }));
  };

  const STATUS_ORDER = { active: 0, upcoming: 1, paused: 2, ended: 3 };
  const sorted = [...items].sort((a, b) => {
    const statusDiff =
      (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.start_date) - new Date(b.start_date);
  });

  const filtered = activeFilter === "all"
    ? sorted
    : sorted.filter((i) => i.status === activeFilter);

  const counts = {
    active: items.filter((i) => i.status === "active").length,
    upcoming: items.filter((i) => i.status === "upcoming").length,
    ended: items.filter((i) => i.status === "ended").length,
    paused: items.filter((i) => i.status === "paused").length,
  };

  return (
    <div style={{
      marginTop: 16,
      background: "rgba(107,179,63,0.03)",
      border: "1px solid rgba(107,179,63,0.18)",
      borderRadius: 14, padding: "16px 18px",
    }}>

      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: expanded ? 14 : 0, flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.g3, marginBottom: 3 }}>
            📅 KPI Schedule Calendar
          </div>
          <div style={{ fontSize: 9, color: C.muted }}>
            All active, upcoming and ended KPI program windows for your company
          </div>
        </div>

        {!loading && !error && items.length > 0 && (
          <div style={{ display: "flex", gap: 24, alignItems: "center", marginLeft: "auto", marginRight: 16 }}>
            <SummaryStat label="Active" value={counts.active} color={C.g3} />
            <SummaryStat label="Upcoming" value={counts.upcoming} color={C.blue} />
            <SummaryStat label="Ended" value={counts.ended} color="rgba(255,255,255,0.25)" />
            {counts.paused > 0 && (
              <SummaryStat label="Paused" value={counts.paused} color={C.gold} />
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {error && expanded && (
            <button onClick={refetch} style={{
              padding: "4px 12px", borderRadius: 7, fontSize: 9, fontWeight: 600,
              cursor: "pointer", background: "transparent",
              border: `1px solid ${C.red}55`, color: C.red,
            }}>
              ↺ Retry
            </button>
          )}
          <button onClick={() => setExpanded((p) => !p)} style={{
            padding: "4px 14px", borderRadius: 8, fontSize: 9, fontWeight: 600,
            cursor: "pointer", background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)", color: C.muted,
          }}>
            {expanded ? "▲ Collapse" : "▼ Expand"}
          </button>
        </div>
      </div>

      {expanded && (<>
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 9, marginBottom: 12,
            background: "rgba(224,80,80,0.08)",
            border: "1px solid rgba(224,80,80,0.25)",
            fontSize: 9, color: C.red,
          }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <FilterPill label={`All (${items.length})`} active={activeFilter === "all"} color={C.g3} onClick={() => setActiveFilter("all")} />
            <FilterPill label={`Active (${counts.active})`} active={activeFilter === "active"} color={C.g3} onClick={() => setActiveFilter("active")} />
            <FilterPill label={`Upcoming (${counts.upcoming})`} active={activeFilter === "upcoming"} color={C.blue} onClick={() => setActiveFilter("upcoming")} />
            <FilterPill label={`Ended (${counts.ended})`} active={activeFilter === "ended"} color="rgba(255,255,255,0.3)" onClick={() => setActiveFilter("ended")} />
            {counts.paused > 0 && (
              <FilterPill label={`Paused (${counts.paused})`} active={activeFilter === "paused"} color={C.gold} onClick={() => setActiveFilter("paused")} />
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "32px 1fr 180px 90px 80px 70px",
            gap: 12, marginBottom: 2, paddingBottom: 6,
            borderBottom: `1px solid rgba(255,255,255,0.06)`,
          }}>
            {["", "KPI Program", "Progress", "Window", "Timeline", "Status"].map((h) => (
              <div key={h} style={{
                fontSize: 8, fontWeight: 700,
                color: "rgba(255,255,255,0.2)",
                textTransform: "uppercase", letterSpacing: 0.6,
                textAlign: h === "Status" ? "right" : h === "Window" || h === "Timeline" ? "center" : "left",
              }}>
                {h}
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div>
            {[1, 2, 3, 4, 5].map((n) => <SkeletonRow key={n} />)}
          </div>
        )}

        {!loading && !error && filtered.map((item) => (
          <CalendarRow key={item.id} item={item} />
        ))}

        {!loading && !error && filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: "30px 0",
            fontSize: 10, color: C.muted,
          }}>
            {activeFilter === "all"
              ? "No KPI programs scheduled yet."
              : `No ${activeFilter} programs.`}
          </div>
        )}

        {!companyId && !loading && (
          <div style={{
            textAlign: "center", padding: "30px 0",
            fontSize: 10, color: C.muted,
          }}>
            Company not resolved yet — schedule will load shortly.
          </div>
        )}
      </>)}
    </div>
  );
}