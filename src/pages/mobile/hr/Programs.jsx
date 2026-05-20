import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { C } from "../../../components/mobile/palette";
import { Pill } from "../../../components/mobile/primitives";
import { fetchKpis } from "../../../store/kpiSlice";

// KPI preset icon/color shared with the Wellness screen — keeps the visual
// language consistent when the same KPI shows up in different contexts.
const KPI_PRESETS = {
  sleep: { icon: "🌙", color: "#7c6af7" },
  stress: { icon: "🧘", color: C.orange },
  nutrition: { icon: "🥗", color: "#22c55e" },
  hydration: { icon: "💧", color: "#38bdf8" },
  activity: { icon: "🏃", color: C.orange },
  energy: { icon: "⚡", color: C.gold },
  posture: { icon: "🦴", color: C.pink },
  pain: { icon: "🦴", color: C.pink },
  digestion: { icon: "🫐", color: "#a3e635" },
};
const DEFAULT_KPI = { icon: "🌿", color: C.g3 };
const presetFor = (name) => {
  const k = String(name || "").toLowerCase();
  return Object.entries(KPI_PRESETS).find(([n]) => k.includes(n))?.[1] || DEFAULT_KPI;
};

export default function HrPrograms() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth.role);
  const { items: kpis, listLoading } = useSelector((state) => state.kpi);

  useEffect(() => {
    dispatch(fetchKpis());
  }, [dispatch]);

  // Until a "KPI program window" endpoint exists, derive per-KPI demo
  // window data deterministically from the KPI name. Layout-faithful to
  // the design — visible enrollment + completion stats remain placeholders.
  const programs = (kpis || []).slice(0, 6).map((k, i) => {
    const preset = presetFor(k.display_name);
    return {
      id: k.kpi_key || `kpi-${i}`,
      kpi: k.display_name || "KPI",
      icon: preset.icon,
      c: preset.color,
      end: ["31 Dec", "31 Dec", "31 Dec", "30 Jun", "30 Jun", "30 Jun"][i] || "31 Dec",
      pct: [35, 35, 35, 68, 68, 68][i] || 50,
      en: [298, 312, 267, 245, 198, 152][i] || 200,
      comp: ["82%", "74%", "91%", "67%", "58%", "44%"][i] || "70%",
    };
  });

  return (
    <div>
      <div style={{ padding: "12px 16px 12px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>📅 KPI Programs</div>
        <div style={{ fontSize: 9, color: C.muted }}>
          Manage company KPI windows
        </div>
      </div>

      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 9 }}>
        {listLoading && !programs.length && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            Loading programs…
          </div>
        )}

        {!listLoading && programs.length === 0 && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            No active KPI programs.
          </div>
        )}

        {programs.map((p) => (
          <div
            key={p.id}
            style={{
              background: C.card,
              borderRadius: 17,
              padding: 13,
              border: `1px solid ${p.c}33`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    background: `${p.c}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                    {p.kpi} KPI
                  </div>
                  <div style={{ fontSize: 9, color: C.muted }}>Ends {p.end}</div>
                </div>
              </div>
              <Pill label="✓ ACTIVE" color="#4ade80" />
            </div>
            <div
              style={{
                height: 4,
                background: "rgba(255,255,255,.04)",
                borderRadius: 3,
                marginBottom: 5,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${p.pct}%`,
                  background: p.c,
                  borderRadius: 3,
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
              <span style={{ color: C.muted }}>{p.pct}% elapsed</span>
              <span style={{ color: "rgba(255,255,255,.38)" }}>
                {p.en} enrolled · {p.comp} completion
              </span>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            const base = role === "superadmin" ? "/super-admin" : "/admin";
            navigate(`${base}/kpis/add`);
          }}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 13,
            background: `linear-gradient(135deg,${C.g2},${C.g3})`,
            border: "none",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          + Schedule New KPI Program
        </button>
      </div>
    </div>
  );
}
