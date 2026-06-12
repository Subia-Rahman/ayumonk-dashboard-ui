import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchChallengeSchedule } from "../store/dashboardSlice";

const C = {
    g2: "#4A8C2A", g3: "#6DB33F",
    muted: "#6B8F60",
    blue: "#4A90C4", red: "#E05050",
    ended: "#B8A832", endedBg: "rgba(184,168,50,0.06)", endedBorder: "rgba(184,168,50,0.28)", endedBadgeBg: "rgba(184,168,50,0.15)", endedText: "rgba(184,168,50,0.9)", endedMuted: "rgba(184,168,50,0.55)",
};

function formatDateShort(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });
}

function SkeletonCard() {
    return (
        <div style={{
            borderRadius: 12, padding: "12px 14px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column", gap: 8,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <div style={{ height: 10, width: "60%", borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
                    <div style={{ height: 8, width: "40%", borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
                </div>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.05)" }} />
            <div style={{ height: 8, width: "50%", borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
        </div>
    );
}

function ActiveCard({ item }) {
    const pct = Math.min(Number(item.progress_pct) || 0, 100);
    const color = item.color || C.g3;

    return (
        <div style={{
            borderRadius: 12, padding: "12px 14px",
            background: `${color}0f`,
            border: `1px solid ${color}44`,
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color, lineHeight: 1.3 }}>
                            {item.label}
                        </div>
                        <span style={{
                            flexShrink: 0, fontSize: 8, fontWeight: 700,
                            background: "rgba(107,179,63,0.2)", color: C.g3,
                            borderRadius: 5, padding: "1px 7px",
                        }}>● ACTIVE</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                        <span style={{
                            fontSize: 8, color: "rgba(255,255,255,0.45)",
                            background: `${color}18`, borderRadius: 4, padding: "1px 6px",
                        }}>{item.kpi_label}</span>
                        <span style={{
                            fontSize: 8, color: C.muted,
                            background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "1px 6px",
                        }}>{item.challenge_type}</span>
                    </div>
                    <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>{item.theme}</div>
                </div>
            </div>

            <div style={{
                height: 5, borderRadius: 5,
                background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 7,
            }}>
                <div style={{
                    height: "100%", borderRadius: 5, width: `${pct}%`,
                    background: `linear-gradient(90deg,${C.g2},${color})`,
                    transition: "width 0.4s",
                }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
                    {formatDateShort(item.start_date)} → {formatDateShort(item.end_date)}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 8, color: C.muted }}>{item.days_remaining}d left</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color }}>{pct}% done</span>
                </div>
            </div>
        </div>
    );
}

function UpcomingCard({ item }) {
    return (
        <div style={{
            borderRadius: 12, padding: "12px 14px",
            background: "rgba(74,144,196,0.05)",
            border: "1px dashed rgba(74,144,196,0.35)",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22, lineHeight: 1, filter: "saturate(0.6)" }}>
                    {item.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, lineHeight: 1.3 }}>
                            {item.label}
                        </div>
                        <span style={{
                            flexShrink: 0, fontSize: 8, fontWeight: 700,
                            background: "rgba(74,144,196,0.15)", color: C.blue,
                            borderRadius: 5, padding: "1px 7px",
                        }}>⏳ UPCOMING</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                        <span style={{
                            fontSize: 8, color: "rgba(255,255,255,0.35)",
                            background: "rgba(74,144,196,0.1)", borderRadius: 4, padding: "1px 6px",
                        }}>{item.kpi_label}</span>
                        <span style={{
                            fontSize: 8, color: C.muted,
                            background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "1px 6px",
                        }}>{item.challenge_type}</span>
                    </div>
                    <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>{item.theme}</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", marginTop: 4 }}>
                        Starts {formatDateShort(item.start_date)}
                        {item.days_remaining > 0 && ` · in ${item.days_remaining} days`}
                    </div>
                </div>
            </div>
        </div>
    );
}

function EndedCard({ item }) {
    return (
        <div style={{
            borderRadius: 12, padding: "12px 14px",
            background: C.endedBg,
            border: `1px solid ${C.endedBorder}`,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22, lineHeight: 1, filter: "saturate(0.4)" }}>
                    {item.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.endedText, lineHeight: 1.3 }}>
                            {item.label}
                        </div>
                        <span style={{
                            flexShrink: 0, fontSize: 8, fontWeight: 700,
                            background: C.endedBadgeBg, color: C.endedText,
                            borderRadius: 5, padding: "1px 7px",
                        }}>✓ ENDED</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                        <span style={{
                            fontSize: 8, color: C.endedMuted,
                            background: "rgba(184,168,50,0.08)", borderRadius: 4, padding: "1px 6px",
                        }}>{item.kpi_label}</span>
                        <span style={{
                            fontSize: 8, color: C.endedMuted,
                            background: "rgba(184,168,50,0.08)", borderRadius: 4, padding: "1px 6px",
                        }}>{item.challenge_type}</span>
                    </div>
                    <div style={{ fontSize: 8, color: C.endedMuted, marginTop: 3 }}>{item.theme}</div>
                    <div style={{ fontSize: 8, color: C.endedMuted, marginTop: 4 }}>
                        Ended {formatDateShort(item.end_date)} · XP &amp; streaks preserved
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ label, count, color }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 10, marginTop: 18,
        }}>
            <div style={{ fontSize: 11, fontWeight: 700, color }}>{label}</div>
            <div style={{
                fontSize: 8, fontWeight: 700, color,
                background: `${color}18`, borderRadius: 5, padding: "1px 7px",
            }}>{count}</div>
            <div style={{ flex: 1, height: 1, background: `${color}22` }} />
        </div>
    );
}

export default function KpiScheduleTimeline() {
    const dispatch = useDispatch();
    const items = useSelector((state) => state.dashboard.schedule?.items ?? []);
    const loading = useSelector((state) => state.dashboard.schedule?.loading ?? true);
    const error = useSelector((state) => state.dashboard.schedule?.error ?? null);

    const refetch = () => dispatch(fetchChallengeSchedule());
    const [expanded, setExpanded] = useState(true);
    //const [activeFilter, setActiveFilter] = useState("all");
    const [activeFilter, setActiveFilter] = useState("active");


    useEffect(() => {
        dispatch(fetchChallengeSchedule());
    }, [dispatch]);

    const active = items.filter((i) => i.status === "active");
    const upcoming = items.filter((i) => i.status === "upcoming");
    const ended = items.filter((i) => i.status === "ended");

    const sort = (arr) => [...arr].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    return (
        <div style={{
            marginTop: 24, marginBottom: 24,
            background: "rgba(107,179,63,0.03)",
            border: "1px solid rgba(107,179,63,0.18)",
            borderRadius: 14, padding: "14px 16px",
        }}>
            {/* ── HEADER ── */}
            <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: expanded ? 4 : 0,
            }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.g3, marginBottom: 3 }}>
                        📅 KPI Program Schedule
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 400, color: C.muted }}>
                        Challenges appear and disappear based on these windows
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {error && expanded && (
                        <button onClick={refetch} style={{
                            padding: "4px 12px", borderRadius: 7, fontSize: 9, fontWeight: 600,
                            cursor: "pointer", background: "transparent",
                            border: `1px solid ${C.red}55`, color: C.red,
                        }}>↺ Retry</button>
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

            {/* ── FILTER PILLS ── */}
            {expanded && !loading && !error && (
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {/* <button onClick={() => setActiveFilter("all")} style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 9, fontWeight: 600,
                        cursor: "pointer",
                        border: `1px solid ${activeFilter === "all" ? C.g3 : "rgba(255,255,255,0.1)"}`,
                        background: activeFilter === "all" ? `${C.g3}18` : "transparent",
                        color: activeFilter === "all" ? C.g3 : "rgba(255,255,255,0.35)",
                    }}>
                        All ({items.length})
                    </button> */}
                    <button onClick={() => setActiveFilter("active")} style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 9, fontWeight: 600,
                        cursor: "pointer",
                        border: `1px solid ${activeFilter === "active" ? C.g3 : "rgba(255,255,255,0.1)"}`,
                        background: activeFilter === "active" ? `${C.g3}18` : "transparent",
                        color: activeFilter === "active" ? C.g3 : "rgba(255,255,255,0.35)",
                    }}>
                        Active ({active.length})
                    </button>
                    <button onClick={() => setActiveFilter("upcoming")} style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 9, fontWeight: 600,
                        cursor: "pointer",
                        border: `1px solid ${activeFilter === "upcoming" ? C.blue : "rgba(255,255,255,0.1)"}`,
                        background: activeFilter === "upcoming" ? `${C.blue}18` : "transparent",
                        color: activeFilter === "upcoming" ? C.blue : "rgba(255,255,255,0.35)",
                    }}>
                        Upcoming ({upcoming.length})
                    </button>
                    <button onClick={() => setActiveFilter("ended")} style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 9, fontWeight: 600,
                        cursor: "pointer",
                        border: `1px solid ${activeFilter === "ended" ? C.ended : "rgba(255,255,255,0.1)"}`,
                        background: activeFilter === "ended" ? `${C.ended}18` : "transparent",
                        color: activeFilter === "ended" ? C.ended : "rgba(255,255,255,0.35)",
                    }}>
                        Completed ({ended.length})
                    </button>
                </div>
            )}

            {expanded && (
                <>
                    {error && (
                        <div style={{
                            padding: "10px 14px", borderRadius: 9, marginBottom: 10,
                            background: "rgba(224,80,80,0.08)",
                            border: "1px solid rgba(224,80,80,0.25)",
                            fontSize: 9, color: C.red,
                        }}>⚠️ {error?.message ?? error}</div>
                    )}

                    {loading && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: 10, marginTop: 10,
                        }}>
                            {[1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)}
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            {(activeFilter === "all" || activeFilter === "active") && active.length > 0 && (
                                <>
                                    <SectionHeader label="Active Programs" count={active.length} color={C.g3} />
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                        gap: 10,
                                    }}>
                                        {sort(active).map((item) => <ActiveCard key={item.id} item={item} />)}
                                    </div>
                                </>
                            )}

                            {(activeFilter === "all" || activeFilter === "upcoming") && upcoming.length > 0 && (
                                <>
                                    <SectionHeader label="Upcoming Programs" count={upcoming.length} color={C.blue} />
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                        gap: 10,
                                    }}>
                                        {sort(upcoming).map((item) => <UpcomingCard key={item.id} item={item} />)}
                                    </div>
                                </>
                            )}

                            {(activeFilter === "all" || activeFilter === "ended") && ended.length > 0 && (
                                <>
                                    <SectionHeader label="Completed Programs" count={ended.length} color={C.ended} />
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                        gap: 10,
                                    }}>
                                        {sort(ended).map((item) => <EndedCard key={item.id} item={item} />)}
                                    </div>
                                </>
                            )}

                            {/* {active.length === 0 && upcoming.length === 0 && ended.length === 0 && ( */}
                            {((activeFilter === "active" && active.length === 0) ||
                                (activeFilter === "upcoming" && upcoming.length === 0) ||
                                (activeFilter === "ended" && ended.length === 0)) && (
                                    <div style={{
                                        textAlign: "center", padding: "24px 0",
                                        fontSize: 10, color: C.muted,
                                    }}>
                                        No KPI programs scheduled yet.
                                    </div>
                                )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}