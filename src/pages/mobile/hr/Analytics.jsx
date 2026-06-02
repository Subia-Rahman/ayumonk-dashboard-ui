import { useState } from "react";
import { useTokens } from "../../../components/mobile/useTokens";

// Population health analytics. Simulated breakdowns (matches the desktop
// HrAnalyticsDashboard) until a population-stats endpoint is exposed — swap
// the constants for selector data when it lands.
const BY_DEPT = {
  wellness: [
    { l: "Eng", v: 72, c: "#4A90C4" }, { l: "Mktg", v: 61, c: "#E0935C" },
    { l: "Fin", v: 64, c: "#C99A3F" }, { l: "HR", v: 68, c: "#4F9D5B" },
    { l: "Ops", v: 59, c: "#8B6FCB" }, { l: "Prod", v: 69, c: "#3AA8A0" },
  ],
  productivity: [
    { l: "Eng", v: 81, c: "#4A90C4" }, { l: "Mktg", v: 74, c: "#E0935C" },
    { l: "Fin", v: 70, c: "#C99A3F" }, { l: "HR", v: 72, c: "#4F9D5B" },
    { l: "Ops", v: 66, c: "#8B6FCB" }, { l: "Prod", v: 78, c: "#3AA8A0" },
  ],
  stress: [
    { l: "Eng", v: 38, c: "#4A90C4" }, { l: "Mktg", v: 52, c: "#E0935C" },
    { l: "Fin", v: 47, c: "#C99A3F" }, { l: "HR", v: 35, c: "#4F9D5B" },
    { l: "Ops", v: 58, c: "#8B6FCB" }, { l: "Prod", v: 41, c: "#3AA8A0" },
  ],
};
const BY_AGE = [
  { l: "20-25", v: 74 }, { l: "26-30", v: 71 }, { l: "31-35", v: 68 },
  { l: "36-40", v: 65 }, { l: "41-50", v: 62 }, { l: "50+", v: 58 },
];
const BY_GENDER = [
  ["Male", "#4A90C4", 68, 186],
  ["Female", "#C36FA8", 70, 112],
  ["Other", "#8FAE5A", 67, 26],
];
const METRIC_TABS = [["wellness", "Wellness"], ["productivity", "Productivity"], ["stress", "Stress"]];

export default function HrAnalytics() {
  const t = useTokens();
  const [metric, setMetric] = useState("wellness");
  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>📊 Analytics</div>
          <div style={{ fontSize: 12.5, color: t.muted }}>Population health · CXO metrics</div>
        </div>
        <Ghost t={t} style={{ marginTop: 6 }}>Filters ⌄</Ghost>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 12 }}>
          {["All Depts", "All Locations", "All Ages", "All Gender"].map((f) => (
            <Ghost key={f} t={t} style={{ flexShrink: 0, whiteSpace: "nowrap" }}>{f} ⌄</Ghost>
          ))}
        </div>

        {/* metric segmented control */}
        <div style={{ display: "flex", gap: 4, background: t.inset, borderRadius: 12, padding: 4, marginBottom: 14 }}>
          {METRIC_TABS.map(([id, l]) => {
            const on = metric === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMetric(id)}
                style={{
                  flex: 1,
                  padding: "8px 6px",
                  borderRadius: 9,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: on ? t.card2 : "transparent",
                  color: on ? t.blue : t.muted,
                  boxShadow: on ? "0 1px 3px rgba(31,30,29,0.1)" : "none",
                }}
              >
                {l}
              </button>
            );
          })}
        </div>

        <Card t={t} style={{ marginBottom: 12, padding: "16px 15px 13px" }}>
          <SecLabel t={t} style={{ marginBottom: 18 }}>By department</SecLabel>
          <Bars data={BY_DEPT[metric]} t={t} />
        </Card>

        <Card t={t} style={{ marginBottom: 12, padding: "16px 15px 13px" }}>
          <SecLabel t={t} style={{ marginBottom: 18 }}>By age band</SecLabel>
          <Bars data={BY_AGE.map((d) => ({ ...d, c: "#4A90C4" }))} t={t} />
        </Card>

        <Card t={t} style={{ marginBottom: 12 }}>
          <SecLabel t={t}>Gender breakdown</SecLabel>
          {BY_GENDER.map(([g, c, wi, n]) => (
            <div key={g} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: c, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: t.muted, width: 56, fontWeight: 600 }}>{g}</span>
              <div style={{ flex: 1, height: 7, background: t.track, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${wi}%`, background: c, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: c, width: 26, textAlign: "right" }}>{wi}</span>
              <span style={{ fontSize: 10.5, color: t.faint, width: 34, textAlign: "right" }}>n={n}</span>
            </div>
          ))}
        </Card>

        <div style={{ background: `${t.blue}14`, borderRadius: 16, padding: "14px 15px", border: `1px solid ${t.blue}40` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: t.blue, marginBottom: 5 }}>💡 CXO Insight</div>
          <div style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.55 }}>
            Departments with WI ≥ 70 show <b style={{ color: "#4F9D5B" }}>23% higher productivity</b> and{" "}
            <b style={{ color: "#4F9D5B" }}>−18% absenteeism</b>.
          </div>
        </div>
      </div>
    </div>
  );
}

function Bars({ data, t }) {
  const mx = Math.max(100, ...data.map((d) => d.v));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
      {data.map((d) => (
        <div key={d.l} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", borderRadius: "6px 6px 3px 3px", minHeight: 4, height: `${(d.v / mx) * 100}%`, background: d.c, position: "relative" }}>
              <span style={{ position: "absolute", top: -16, left: 0, right: 0, textAlign: "center", fontSize: 10, fontWeight: 800, color: d.c }}>{d.v}</span>
            </div>
          </div>
          <span style={{ fontSize: 10, color: t.muted, fontWeight: 600 }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

function Card({ children, t, style }) {
  return <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 18, padding: 14, ...style }}>{children}</div>;
}
function SecLabel({ children, t, style }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: t.faint, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 12px", ...style }}>{children}</div>;
}
function Ghost({ children, t, style }) {
  return (
    <button type="button" style={{ fontSize: 11, fontWeight: 600, color: t.muted, background: t.inset, border: `1px solid ${t.border}`, borderRadius: 8, padding: "5px 11px", cursor: "pointer", fontFamily: "inherit", ...style }}>
      {children}
    </button>
  );
}
