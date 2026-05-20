import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { C } from "../../../components/mobile/palette";
import { Pill } from "../../../components/mobile/primitives";
import { fetchAdminSuggestions } from "../../../store/adminSuggestionSlice";

const TYPE_PRESET = {
  aahar: { ic: "🥗", color: C.g3 },
  vihar: { ic: "🌅", color: C.blue },
  vihara: { ic: "🌅", color: C.blue },
  aushadh: { ic: "🌿", color: C.gold },
  nidra: { ic: "🌙", color: "#7c6af7" },
  manas: { ic: "🧠", color: C.purple },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "aahar", label: "🥗 Aahar" },
  { id: "vihar", label: "🌅 Vihar" },
  { id: "aushadh", label: "🌿 Aushadh" },
];

export default function SaSuggestions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const { items, listLoading } = useSelector((state) => state.adminSuggestion);

  useEffect(() => {
    dispatch(fetchAdminSuggestions({ limit: 100 }));
  }, [dispatch]);

  const rows = (items || []).filter((s) => {
    if (filter === "all") return true;
    return String(s.suggestion_type || "").toLowerCase().includes(filter);
  });

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
            🌿 Suggestion Master
          </div>
          <div style={{ fontSize: 9, color: C.muted }}>
            Aahar · Vihar · Aushadh per KPI
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/super-admin/suggestion-master/add")}
          style={{
            padding: "7px 13px",
            borderRadius: 10,
            background: `linear-gradient(135deg,${C.g2},${C.g3})`,
            border: "none",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Add
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "0 12px 10px",
          overflowX: "auto",
        }}
      >
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              style={{
                fontSize: 10,
                background: on ? `${C.g3}20` : C.card,
                color: on ? C.g3 : "rgba(255,255,255,.38)",
                borderRadius: 8,
                padding: "5px 11px",
                border: `1px solid ${on ? C.g3 + "44" : C.border}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
                cursor: "pointer",
                fontWeight: on ? 700 : 400,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 9 }}>
        {listLoading && !rows.length && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            Loading suggestions…
          </div>
        )}

        {!listLoading && rows.length === 0 && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            No suggestions match this filter.
          </div>
        )}

        {rows.map((s) => {
          const preset =
            TYPE_PRESET[String(s.suggestion_type || "").toLowerCase()] || {
              ic: "🌿",
              color: C.g3,
            };
          return (
            <div
              key={s.id}
              onClick={() => navigate(`/super-admin/suggestion-master/${s.id}`)}
              style={{
                background: C.card,
                borderRadius: 16,
                padding: 12,
                border: `1px solid ${preset.color}33`,
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
                <div style={{ display: "flex", gap: 7, alignItems: "center", minWidth: 0 }}>
                  <span style={{ fontSize: 15 }}>{preset.ic}</span>
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
                      {s.title || "Untitled"}
                    </div>
                    <div style={{ fontSize: 8.5, color: C.muted }}>
                      {String(s.suggestion_type || "general").toUpperCase()}
                      {s.dosha_type && s.dosha_type !== "all"
                        ? ` · ${s.dosha_type}`
                        : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <Pill
                    label={s.is_active ? "Active" : "Inactive"}
                    color={s.is_active ? "#4ade80" : C.muted}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/super-admin/suggestion-master/${s.id}/edit`);
                    }}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: `${preset.color}13`,
                      border: `1px solid ${preset.color}28`,
                      color: preset.color,
                      fontSize: 9,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
              {s.description && (
                <div
                  style={{
                    fontSize: 9.5,
                    color: "rgba(255,255,255,.45)",
                    lineHeight: 1.45,
                  }}
                >
                  {s.description.length > 110
                    ? `${s.description.slice(0, 110)}…`
                    : s.description}
                </div>
              )}
              <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                {s.difficulty && (
                  <span
                    style={{
                      fontSize: 8.5,
                      background: "rgba(255,255,255,.04)",
                      color: "rgba(255,255,255,.4)",
                      borderRadius: 5,
                      padding: "1px 7px",
                    }}
                  >
                    {s.difficulty}
                  </span>
                )}
                {s.duration_mins ? (
                  <span
                    style={{
                      fontSize: 8.5,
                      background: "rgba(255,255,255,.04)",
                      color: "rgba(255,255,255,.4)",
                      borderRadius: 5,
                      padding: "1px 7px",
                    }}
                  >
                    {s.duration_mins} mins
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
