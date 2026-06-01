import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTokens } from "../../../components/mobile/useTokens";
import { Pill } from "../../../components/mobile/primitives";
import { fetchUsers } from "../../../store/userSlice";
import { fetchCompanyById } from "../../../store/companySlice";
import { getCompanyId } from "../../../utils/roleHelper";

// Company dashboard — polished, theme-aware. Real employee count + company
// name come from redux when available; department/WI breakdowns stay as
// faithful demo values until a population-stats endpoint exists.
const HERO_BLUE_DARK = "#245680";
const HERO_BLUE = "#2F6E9E";

export default function HrHome() {
  const t = useTokens();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const { users, total, usersLoading } = useSelector((state) => state.user);
  const { selectedCompany } = useSelector((state) => state.company);
  const companyId = auth.user?.company_id || getCompanyId();

  useEffect(() => {
    if (companyId) {
      dispatch(fetchUsers({ companyId, limit: 500 }));
      dispatch(fetchCompanyById(companyId));
    }
  }, [dispatch, companyId]);

  const empCount = total || users?.length || 248;
  const companyName =
    selectedCompany?.company_name || auth.user?.company_name || "Company Workspace";

  const stats = [
    { l: "Employees", v: usersLoading ? "…" : empCount, i: "👥", c: t.blue },
    { l: "Avg WI", v: "68.4", i: "📊", c: "#4F9D5B" },
    { l: "Active KPIs", v: "6", i: "🎯", c: "#C99A3F" },
    { l: "Forms Due", v: "48", i: "📝", c: "#E0935C" },
    { l: "Completion", v: "92%", i: "✅", c: "#3AA8A0" },
    { l: "Absentee", v: "2.3%", i: "📉", c: "#8B6FCB" },
  ];

  const trend = [60, 63, 61, 65, 64, 67, 66, 68];
  const trendLabels = ["W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];

  const depts = useMemo(() => {
    const palette = ["#4A90C4", "#4F9D5B", "#C99A3F", "#E0935C", "#8B6FCB"];
    const counts = (users || []).reduce((acc, u) => {
      const d = u.department || "Other";
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const fallback = [
      ["Engineering", 86], ["Product", 42], ["Finance", 38],
      ["Marketing", 34], ["Operations", 28],
    ];
    return (top.length ? top : fallback).map(([name, n], i) => ({
      d: name, n, wi: [72, 69, 64, 61, 59][i] ?? 60, c: palette[i % palette.length],
    }));
  }, [users]);

  // mini area chart geometry
  const W = 300, H = 70, mn = Math.min(...trend) - 2, mx = Math.max(...trend) + 2;
  const pts = trend.map((v, i) => [
    (i / (trend.length - 1)) * W,
    H - ((v - mn) / (mx - mn)) * H,
  ]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${H} ${line} ${W},${H}`;

  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ fontSize: 11.5, color: t.faint, fontWeight: 600 }}>{companyName}</div>
        <div style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>
          🏠 Company Dashboard
        </div>
      </div>

      {/* hero */}
      <div
        style={{
          margin: "0 16px 20px",
          borderRadius: 24,
          padding: "18px 20px",
          display: "flex",
          gap: 16,
          alignItems: "center",
          background: `linear-gradient(135deg, ${HERO_BLUE_DARK} 0%, ${HERO_BLUE} 100%)`,
          boxShadow: "0 14px 34px -18px rgba(47,110,158,0.6)",
          color: "#fff",
        }}
      >
        <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
          <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="10" />
            <circle
              cx="48" cy="48" r="40" fill="none" stroke="#fff" strokeWidth="10"
              strokeLinecap="round" strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 * (1 - 0.684)}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800 }}>
            68.4
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, opacity: 0.78, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            Company Wellness Index
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, margin: "5px 0 8px", letterSpacing: "-0.02em" }}>
            Healthy
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.18)", borderRadius: 999, padding: "4px 10px" }}>▲ 6.2% this quarter</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.18)", borderRadius: 999, padding: "4px 10px" }}>{empCount} employees</span>
          </div>
        </div>
      </div>

      {/* stat grid */}
      <div style={{ padding: "0 16px", marginBottom: 22 }}>
        <SecLabel t={t}>Company pulse · today</SecLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {stats.map((s) => (
            <div
              key={s.l}
              style={{
                background: t.card,
                border: `1px solid ${s.c}44`,
                boxShadow: t.isDark ? "none" : "0 1px 2px rgba(31,30,29,0.04)",
                borderRadius: 16,
                padding: "13px 6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 19, marginBottom: 3 }}>{s.i}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: s.c, lineHeight: 1, letterSpacing: "-0.02em" }}>{s.v}</div>
              <div style={{ fontSize: 10, color: t.faint, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* trend */}
      <div style={{ padding: "0 16px", marginBottom: 22 }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 18, padding: "14px 15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Company Wellness Trend</div>
              <div style={{ fontSize: 11, color: t.faint }}>Last 8 weeks</div>
            </div>
            <Pill label="▲ 6.2%" color="#4F9D5B" />
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H + 16}`} preserveAspectRatio="none" style={{ display: "block" }}>
            <defs>
              <linearGradient id="hrTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.blue} stopOpacity="0.25" />
                <stop offset="100%" stopColor={t.blue} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={area} fill="url(#hrTrendFill)" />
            <polyline points={line} fill="none" stroke={t.blue} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map(([x], i) => (
              <text key={i} x={x} y={H + 13} textAnchor="middle" fontSize="8" fill={t.faint}>{trendLabels[i]}</text>
            ))}
          </svg>
        </div>
      </div>

      {/* top departments */}
      <div style={{ padding: "0 16px" }}>
        <SecLabel t={t}>Top departments · WI</SecLabel>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 18, padding: "6px 4px" }}>
          {depts.map((d, i) => (
            <div
              key={d.d}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 13px",
                borderBottom: i < depts.length - 1 ? `1px solid ${t.border}` : "none",
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: 3, background: d.c, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                  {d.d} <span style={{ color: t.faint, fontWeight: 500, fontSize: 11 }}>· {d.n}</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: t.track, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${d.wi}%`, background: d.c, borderRadius: 999 }} />
                </div>
              </div>
              <span style={{ fontSize: 17, fontWeight: 800, color: d.c, width: 32, textAlign: "right" }}>{d.wi}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecLabel({ children, t }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: t.faint, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 12px" }}>
      {children}
    </div>
  );
}
