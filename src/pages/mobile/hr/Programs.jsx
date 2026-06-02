import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTokens } from "../../../components/mobile/useTokens";
import { fetchKpis } from "../../../store/kpiSlice";

const KPI_PRESETS = {
  sleep: { icon: "🌙", color: "#8B6FCB" },
  stress: { icon: "🧘", color: "#C36FA8" },
  nutrition: { icon: "🥗", color: "#4F9D5B" },
  hydration: { icon: "💧", color: "#4A90C4" },
  activity: { icon: "🏃", color: "#E0935C" },
  energy: { icon: "⚡", color: "#C99A3F" },
  posture: { icon: "🦴", color: "#C36FA8" },
  digestion: { icon: "🫐", color: "#8FAE5A" },
};
const DEFAULT_KPI = { icon: "🌿", color: "#6B7F5C" };
const presetFor = (name) => {
  const k = String(name || "").toLowerCase();
  return Object.entries(KPI_PRESETS).find(([n]) => k.includes(n))?.[1] || DEFAULT_KPI;
};

const DEMO_WINDOWS = [
  { end: "31 Dec", pct: 35, en: 298, comp: "82%" },
  { end: "31 Dec", pct: 35, en: 312, comp: "74%" },
  { end: "31 Dec", pct: 35, en: 267, comp: "91%" },
  { end: "30 Jun", pct: 68, en: 245, comp: "67%" },
];
const DEMO_KPIS = [
  { kpi_key: "sleep", display_name: "Sleep Quality" },
  { kpi_key: "stress", display_name: "Stress / Calm" },
  { kpi_key: "hydration", display_name: "Hydration" },
  { kpi_key: "activity", display_name: "Movement" },
];

export default function HrPrograms() {
  const t = useTokens();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth.role);
  const { items: kpis, listLoading } = useSelector((state) => state.kpi);

  useEffect(() => {
    dispatch(fetchKpis());
  }, [dispatch]);

  const programs = useMemo(() => {
    const source = kpis && kpis.length ? kpis : DEMO_KPIS;
    return source.slice(0, 4).map((k, i) => {
      const preset = presetFor(k.display_name);
      return {
        id: k.kpi_key || `kpi-${i}`,
        kpi: k.display_name || "KPI",
        icon: preset.icon,
        c: preset.color,
        ...(DEMO_WINDOWS[i] || DEMO_WINDOWS[0]),
      };
    });
  }, [kpis]);

  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>📅 KPI Programs</div>
        <div style={{ fontSize: 12.5, color: t.muted }}>Manage company KPI windows</div>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 11 }}>
        {listLoading && !programs.length && (
          <div style={{ fontSize: 12.5, color: t.faint, padding: "8px 0" }}>Loading programs…</div>
        )}

        {programs.map((p) => (
          <div key={p.id} style={{ background: t.card, border: `1px solid ${p.c}4d`, borderRadius: 17, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 11 }}>
              <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${p.c}26`, display: "grid", placeItems: "center", fontSize: 20 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{p.kpi}</div>
                  <div style={{ fontSize: 11, color: t.faint }}>Ends {p.end}</div>
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(79,157,91,0.16)", color: "#4F9D5B", borderRadius: 6, padding: "3px 8px" }}>✓ ACTIVE</span>
            </div>
            <div style={{ height: 7, background: t.track, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${p.pct}%`, background: p.c, borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
              <span style={{ color: t.faint }}>{p.pct}% elapsed</span>
              <span style={{ color: t.muted, fontWeight: 600 }}>{p.en} enrolled · {p.comp} completion</span>
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
            padding: 14,
            borderRadius: 13,
            border: "none",
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: 2,
            background: `linear-gradient(135deg, ${t.g2 || t.blue}, ${t.blue})`,
          }}
        >
          + Schedule New KPI Program
        </button>
      </div>
    </div>
  );
}
