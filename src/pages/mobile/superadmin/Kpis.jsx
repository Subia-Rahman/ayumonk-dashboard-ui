import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { C } from "../../../components/mobile/palette";
import { Pill } from "../../../components/mobile/primitives";
import { fetchKpis } from "../../../store/kpiSlice";

const KPI_PRESETS = {
  sleep: { icon: "🌙", color: "#7c6af7", sf: "Mental Health" },
  stress: { icon: "🧘", color: C.orange, sf: "Role Emotional" },
  nutrition: { icon: "🥗", color: "#22c55e", sf: "Gen. Health" },
  hydration: { icon: "💧", color: "#38bdf8", sf: "Vitality" },
  activity: { icon: "🏃", color: C.orange, sf: "Physical Func." },
  energy: { icon: "⚡", color: C.gold, sf: "Role Physical" },
  posture: { icon: "🦴", color: C.pink, sf: "Bodily Pain" },
  digestion: { icon: "🫐", color: "#a3e635", sf: "Gen. Health" },
};
const DEFAULT_KPI = { icon: "🌿", color: C.g3, sf: "General Health" };
const presetFor = (name) => {
  const k = String(name || "").toLowerCase();
  return Object.entries(KPI_PRESETS).find(([n]) => k.includes(n))?.[1] || DEFAULT_KPI;
};

export default function SaKpis() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { items, listLoading } = useSelector((state) => state.kpi);

  useEffect(() => {
    dispatch(fetchKpis());
  }, [dispatch]);

  const rows = (items || []).filter((k) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (k.display_name || "").toLowerCase().includes(q);
  });

  return (
    <div style={{ background: C.bg, minHeight: "100%" }}>
      <div
        style={{
          padding: "8px 16px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
            🎯 KPI Master
          </div>
          <div style={{ fontSize: 8.5, color: C.muted }}>
            Weights · questions · SF-12 mapping
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/super-admin/kpis/add")}
          style={{
            padding: "7px 13px",
            borderRadius: 10,
            background: `linear-gradient(135deg,${C.g2},${C.g3})`,
            border: "none",
            color: "#fff",
            fontSize: 9.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + New
        </button>
      </div>

      <div
        style={{
          margin: "0 12px 10px",
          background: C.card,
          borderRadius: 12,
          padding: "8px 12px",
          border: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13 }}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search KPIs…"
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            outline: "none",
            color: "#fff",
            fontSize: 11,
          }}
        />
      </div>

      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 9 }}>
        {listLoading && !rows.length && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            Loading KPIs…
          </div>
        )}

        {!listLoading && rows.length === 0 && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            No KPIs found.
          </div>
        )}

        {rows.map((k) => {
          const p = presetFor(k.display_name);
          const weight =
            k.wi_weight !== null && k.wi_weight !== undefined
              ? `${Math.round(Number(k.wi_weight) * 100)}%`
              : "—";
          return (
            <div
              key={k.kpi_key}
              onClick={() => navigate(`/super-admin/kpis/${k.kpi_key}`)}
              style={{
                background: C.card,
                borderRadius: 16,
                padding: 12,
                border: `1px solid ${p.color}33`,
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
                <div style={{ display: "flex", gap: 9, alignItems: "center", minWidth: 0 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      background: `${p.color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {p.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {k.display_name}
                    </div>
                    <div style={{ fontSize: 9, color: C.muted }}>SF-12: {p.sf}</div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 3,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 800, color: p.color }}>
                    {weight}
                  </span>
                  <Pill
                    label={k.is_active ? "Active" : "Inactive"}
                    color={k.is_active ? "#4ade80" : C.muted}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {k.theme_key && (
                  <span
                    style={{
                      fontSize: 9,
                      background: "rgba(255,255,255,.04)",
                      color: "rgba(255,255,255,.38)",
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}
                  >
                    {k.theme_key}
                  </span>
                )}
                {k.domain_category && (
                  <span
                    style={{
                      fontSize: 9,
                      background: "rgba(255,255,255,.04)",
                      color: "rgba(255,255,255,.38)",
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}
                  >
                    {k.domain_category}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/super-admin/kpis/${k.kpi_key}/edit`);
                  }}
                  style={{
                    marginLeft: "auto",
                    padding: "2px 9px",
                    borderRadius: 7,
                    background: `${p.color}13`,
                    border: `1px solid ${p.color}30`,
                    color: p.color,
                    fontSize: 9,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
