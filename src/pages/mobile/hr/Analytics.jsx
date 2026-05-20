import { useState } from "react";
import { C } from "../../../components/mobile/palette";
import { Bar } from "../../../components/mobile/primitives";

// Population health analytics. Today this uses simulated breakdowns because
// the desktop HrAnalyticsDashboard does the same — a real population-stats
// endpoint isn't exposed yet. Swap the constants for selector data when it
// lands and the layout will fill in automatically.

const METRIC_TABS = [
  ["wellness", "Wellness"],
  ["productivity", "Productivity"],
  ["stress", "Stress"],
];

const BY_DEPT = [
  { l: "Eng", v: 72 },
  { l: "Mktg", v: 61 },
  { l: "Fin", v: 64 },
  { l: "HR", v: 68 },
  { l: "Ops", v: 59 },
  { l: "Prod", v: 69 },
];

const BY_AGE = [
  { l: "20-25", v: 74 },
  { l: "26-30", v: 71 },
  { l: "31-35", v: 68 },
  { l: "36-40", v: 65 },
  { l: "41-50", v: 62 },
  { l: "50+", v: 58 },
];

const BY_GENDER = [
  ["Male", C.blue, 68, 186],
  ["Female", C.pink, 70, 112],
  ["Other", "#a3e635", 67, 26],
];

export default function HrAnalytics() {
  const [metric, setMetric] = useState("wellness");
  return (
    <div>
      <div
        style={{
          padding: "12px 16px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
            📊 Analytics
          </div>
          <div style={{ fontSize: 9, color: C.muted }}>
            Population health · CXO metrics
          </div>
        </div>
        <button
          type="button"
          style={{
            padding: "6px 11px",
            borderRadius: 9,
            background: C.card,
            border: `1px solid ${C.border}`,
            color: "rgba(255,255,255,.45)",
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          Filters ⌄
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: "0 12px 10px",
        }}
      >
        {["All Depts", "All Locations", "All Ages", "All Gender"].map((f) => (
          <span
            key={f}
            style={{
              fontSize: 9,
              background: C.card,
              color: "rgba(255,255,255,.38)",
              borderRadius: 8,
              padding: "5px 10px",
              border: `1px solid ${C.border}`,
              whiteSpace: "nowrap",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            {f} ⌄
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 5,
          margin: "0 12px 12px",
          background: C.card,
          borderRadius: 12,
          padding: 4,
          border: `1px solid ${C.border}`,
        }}
      >
        {METRIC_TABS.map(([id, l]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMetric(id)}
            style={{
              flex: 1,
              padding: 7,
              borderRadius: 8,
              border: "none",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              background:
                metric === id
                  ? `linear-gradient(135deg,${C.g2},${C.g3})`
                  : "transparent",
              color: metric === id ? "#fff" : "rgba(255,255,255,.32)",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div
        style={{
          margin: "0 12px 12px",
          background: C.card,
          borderRadius: 18,
          padding: 13,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
          By Department
        </div>
        <Bar data={BY_DEPT} color={C.g3} h={65} />
      </div>

      <div
        style={{
          margin: "0 12px 12px",
          background: C.card,
          borderRadius: 18,
          padding: 13,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
          By Age Band
        </div>
        <Bar data={BY_AGE} color={C.blue} h={55} />
      </div>

      <div
        style={{
          margin: "0 12px 12px",
          background: C.card,
          borderRadius: 18,
          padding: 13,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
          Gender Breakdown
        </div>
        {BY_GENDER.map(([g, c, wi, n]) => (
          <div
            key={g}
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 2,
                background: c,
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.55)", width: 42 }}>
              {g}
            </span>
            <div
              style={{
                flex: 1,
                height: 4,
                background: "rgba(255,255,255,.04)",
                borderRadius: 3,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${wi}%`,
                  background: c,
                  borderRadius: 3,
                }}
              />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: c, width: 22 }}>
              {wi}
            </span>
            <span style={{ fontSize: 9, color: C.muted, width: 28 }}>{n}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          margin: "0 12px",
          background: "rgba(74,144,196,.06)",
          borderRadius: 16,
          padding: 12,
          border: `1px solid ${C.blue}33`,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, marginBottom: 3 }}>
          💡 CXO Insight
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", lineHeight: 1.55 }}>
          Depts with WI ≥ 70 show{" "}
          <span style={{ color: "#4ade80", fontWeight: 700 }}>23% higher productivity</span>{" "}
          and{" "}
          <span style={{ color: "#4ade80", fontWeight: 700 }}>−18% absenteeism</span>.
        </div>
      </div>
    </div>
  );
}
