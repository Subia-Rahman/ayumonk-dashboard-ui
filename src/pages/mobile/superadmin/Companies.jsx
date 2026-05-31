import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { C } from "../../../components/mobile/palette";
import { Pill } from "../../../components/mobile/primitives";
import { fetchCompanies } from "../../../store/companySlice";

export default function SaCompanies() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { companies, companiesLoading } = useSelector((state) => state.company);

  useEffect(() => {
    dispatch(fetchCompanies({}));
  }, [dispatch]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (companies || []).filter((c) => {
      if (!q) return true;
      return (
        (c.company_name || "").toLowerCase().includes(q) ||
        (c.industry || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
      );
    });
  }, [companies, search]);

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
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1F1E1D" }}>
            🏢 Companies
          </div>
          <div style={{ fontSize: 8.5, color: C.muted }}>
            {companies?.length || 0} active corporate clients
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/super-admin/company-data/add")}
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
          + Add
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
          placeholder="Search company…"
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            outline: "none",
            color: "#1F1E1D",
            fontSize: 11,
          }}
        />
      </div>

      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 9 }}>
        {companiesLoading && !rows.length && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            Loading companies…
          </div>
        )}

        {!companiesLoading && rows.length === 0 && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            No companies match your search.
          </div>
        )}

        {rows.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/super-admin/company-data/${c.id}`)}
            style={{
              background: C.card,
              borderRadius: 17,
              padding: 12,
              border: `1px solid ${C.border}`,
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
              <div style={{ minWidth: 0, paddingRight: 8 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1F1E1D",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.company_name}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 8.5, color: C.muted }}>CL-{c.id}</span>
                  {c.industry && (
                    <span
                      style={{
                        fontSize: 8.5,
                        background: "rgba(31,30,29,0.06)",
                        color: "#5C5A57",
                        borderRadius: 4,
                        padding: "1px 5px",
                      }}
                    >
                      {c.industry}
                    </span>
                  )}
                </div>
              </div>
              <Pill
                label={c.is_active ? "✓ Active" : "○ Inactive"}
                color={c.is_active ? "#4ade80" : C.muted}
              />
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
              <span
                style={{
                  fontSize: 9,
                  background: "rgba(31,30,29,0.08)",
                  color: "#5C5A57",
                  borderRadius: 6,
                  padding: "2px 8px",
                }}
              >
                👥 {c.no_of_employees || 0}
              </span>
              {c.location_name && (
                <span
                  style={{
                    fontSize: 9,
                    background: "rgba(31,30,29,0.08)",
                    color: "#5C5A57",
                    borderRadius: 6,
                    padding: "2px 8px",
                  }}
                >
                  📍 {c.location_name}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/super-admin/company-data/${c.id}/edit`);
                }}
                style={{
                  marginLeft: "auto",
                  padding: "2px 10px",
                  borderRadius: 7,
                  background: `${C.blue}14`,
                  border: `1px solid ${C.blue}30`,
                  color: C.blue,
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
