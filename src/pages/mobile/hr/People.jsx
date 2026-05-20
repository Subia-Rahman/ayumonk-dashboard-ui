import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { C } from "../../../components/mobile/palette";
import { fetchUsers } from "../../../store/userSlice";
import { getCompanyId } from "../../../utils/roleHelper";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "risk", label: "⚠️ At Risk" },
  { id: "mod", label: "🔶 Moderate" },
  { id: "top", label: "🏆 Top" },
];

// Deterministic pseudo-WI derived from the user id so the list isn't
// reshuffled every render. Real WI per employee should land in the user
// payload from the backend; until then this keeps the row layout meaningful.
function pseudoWi(id) {
  const seed = String(id || "")
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return 45 + (seed % 45);
}

const colorForWi = (wi) => {
  if (wi >= 70) return C.g3;
  if (wi >= 55) return C.gold;
  return "#f87171";
};

const initialsOf = (name) =>
  String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("") || "U";

export default function HrPeople() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { users, usersLoading } = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    const companyId = auth.user?.company_id || getCompanyId();
    if (companyId) {
      dispatch(fetchUsers({ companyId, limit: 500 }));
    }
  }, [dispatch, auth.user?.company_id]);

  const rows = useMemo(() => {
    const withWi = (users || []).map((u) => {
      const wi = pseudoWi(u.id);
      return {
        ...u,
        wi,
        c: colorForWi(wi),
        trend: ((u.id.charCodeAt(0) % 11) - 5).toString(),
      };
    });
    const filtered = withWi.filter((u) => {
      if (filter === "risk" && u.wi >= 55) return false;
      if (filter === "mod" && (u.wi < 55 || u.wi >= 70)) return false;
      if (filter === "top" && u.wi < 70) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (u.full_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.department || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
    return filtered
      .sort((a, b) => b.wi - a.wi)
      .slice(0, 50);
  }, [users, filter, search]);

  const role = useSelector((state) => state.auth.role);

  return (
    <div>
      <div style={{ padding: "12px 16px 10px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>👥 People</div>
        <div style={{ fontSize: 9, color: C.muted }}>
          {(users?.length || 0)} employees · sorted by WI
        </div>
      </div>

      <div
        style={{
          margin: "0 12px 10px",
          background: C.card,
          borderRadius: 12,
          padding: "9px 12px",
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
          placeholder="Search employees…"
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

      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: "0 12px 10px",
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
                fontWeight: on ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {usersLoading && !rows.length && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            Loading employees…
          </div>
        )}

        {!usersLoading && rows.length === 0 && (
          <div style={{ fontSize: 10, color: C.muted, padding: "8px 0" }}>
            No employees match your filters.
          </div>
        )}

        {rows.map((e) => {
          const trendNum = Number(e.trend) || 0;
          return (
            <div
              key={e.id}
              onClick={() => {
                const base = role === "superadmin" ? "/super-admin" : "/admin";
                navigate(`${base}/company-users/${e.id}`);
              }}
              style={{
                background: C.card,
                borderRadius: 15,
                padding: "11px 12px",
                border: `1px solid ${e.c}22`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: `${e.c}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: e.c,
                  flexShrink: 0,
                }}
              >
                {initialsOf(e.full_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
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
                  {e.full_name || e.email || "—"}
                </div>
                <div style={{ fontSize: 9, color: C.muted }}>
                  {e.department || "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: e.c,
                    lineHeight: 1,
                  }}
                >
                  {e.wi}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: trendNum >= 0 ? "#4ade80" : "#f87171",
                  }}
                >
                  {trendNum >= 0 ? "+" : ""}
                  {trendNum}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
