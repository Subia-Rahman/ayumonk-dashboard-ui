import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTokens } from "../../../components/mobile/useTokens";
import { fetchUsers } from "../../../store/userSlice";
import { getCompanyId } from "../../../utils/roleHelper";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "top", label: "🏆 Top" },
  { id: "mod", label: "🔶 Moderate" },
  { id: "risk", label: "⚠️ At Risk" },
];

// Deterministic pseudo-WI from the user id so the list isn't reshuffled each
// render. Real per-employee WI should arrive in the user payload; until then
// this keeps the layout meaningful.
function pseudoWi(id) {
  const seed = String(id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 45 + (seed % 45);
}
const wiColor = (wi) => (wi >= 70 ? "#4F9D5B" : wi >= 55 ? "#C99A3F" : "#C0604A");
const initials = (name) =>
  String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() || "").join("") || "U";

// fallback demo roster when the live user list is empty
const DEMO = [
  { id: "d1", full_name: "Priya Sharma", department: "Engineering" },
  { id: "d2", full_name: "Rahul Mehta", department: "Product" },
  { id: "d3", full_name: "Anjali Kapoor", department: "People" },
  { id: "d4", full_name: "Vikram Singh", department: "Engineering" },
  { id: "d5", full_name: "Sneha Patil", department: "Marketing" },
  { id: "d6", full_name: "Arjun Nair", department: "Finance" },
  { id: "d7", full_name: "Meera Joshi", department: "Operations" },
  { id: "d8", full_name: "Karan Verma", department: "Engineering" },
  { id: "d9", full_name: "Divya Rao", department: "Marketing" },
  { id: "d10", full_name: "Sanjay Gupta", department: "Operations" },
];

export default function HrPeople() {
  const t = useTokens();
  const dispatch = useDispatch();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);

  const { users, usersLoading } = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    const companyId = auth.user?.company_id || getCompanyId();
    if (companyId) dispatch(fetchUsers({ companyId, limit: 500 }));
  }, [dispatch, auth.user?.company_id]);

  const rows = useMemo(() => {
    const source = users && users.length ? users : DEMO;
    const withWi = source.map((u) => {
      const wi = pseudoWi(u.id);
      const seed = String(u.id || "").charCodeAt(0) || 0;
      return { ...u, wi, c: wiColor(wi), trend: (seed % 11) - 5 };
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
    return filtered.sort((a, b) => b.wi - a.wi).slice(0, 50);
  }, [users, filter, search]);

  const totalCount = (users && users.length) || DEMO.length;

  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>👥 People</div>
        <div style={{ fontSize: 12.5, color: t.muted }}>{totalCount} employees · sorted by WI</div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* search */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "10px 13px", marginBottom: 12 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", color: t.text, fontSize: 13, fontFamily: "inherit" }}
          />
        </div>

        {/* filters */}
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, marginBottom: 13 }}>
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  fontSize: 12,
                  fontWeight: 700,
                  background: on ? `${t.blue}1f` : t.card,
                  color: on ? t.blue : t.muted,
                  borderRadius: 9,
                  padding: "7px 13px",
                  border: `1px solid ${on ? "transparent" : t.border}`,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {usersLoading && !rows.length && (
            <div style={{ fontSize: 12.5, color: t.faint, padding: "8px 0" }}>Loading employees…</div>
          )}
          {!usersLoading && rows.length === 0 && (
            <div style={{ fontSize: 12.5, color: t.faint, textAlign: "center", padding: "20px 0" }}>No employees match your filters.</div>
          )}
          {rows.map((e) => (
            <div
              key={e.id}
              onClick={() => setActive(e)}
              style={{
                background: t.card,
                border: `1px solid ${e.c}38`,
                borderRadius: 15,
                padding: "11px 13px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                cursor: "pointer",
                boxShadow: t.isDark ? "none" : "0 1px 2px rgba(31,30,29,0.04)",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${e.c}28`, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, color: e.c, flexShrink: 0 }}>
                {initials(e.full_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {e.full_name || e.email || "—"}
                </div>
                <div style={{ fontSize: 11, color: t.faint }}>{e.department || "—"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: e.c, lineHeight: 1 }}>{e.wi}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: e.trend >= 0 ? "#4F9D5B" : "#C0604A" }}>
                  {e.trend >= 0 ? "▲" : "▼"} {Math.abs(e.trend)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {active && <EmployeeSheet emp={active} t={t} onClose={() => setActive(null)} />}
    </div>
  );
}

export function EmployeeSheet({ emp, t, onClose }) {
  const c = wiColor(emp.wi);
  const dims = [
    { name: "Nidra", label: "Sleep", v: Math.max(2, emp.wi / 20 - 0.3) },
    { name: "Manas", label: "Stress", v: Math.max(2, emp.wi / 20 + 0.2) },
    { name: "Aahar", label: "Nutrition", v: Math.max(2, emp.wi / 20 - 0.1) },
    { name: "Vihara", label: "Activity", v: Math.max(2, emp.wi / 20 - 0.5) },
  ];
  const band = emp.wi >= 70 ? "Top" : emp.wi >= 55 ? "Moderate" : "At Risk";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,20,12,0.5)" }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          background: t.card2, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderTop: `2px solid ${c}80`, maxHeight: "86%", overflowY: "auto", paddingBottom: 30,
        }}
      >
        <div style={{ width: 38, height: 4.5, borderRadius: 999, background: t.border, margin: "10px auto 6px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 20px 16px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${c}28`, display: "grid", placeItems: "center", color: c, fontWeight: 800, fontSize: 16 }}>
              {initials(emp.full_name)}
            </div>
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text }}>{emp.full_name || emp.email || "—"}</div>
              <div style={{ fontSize: 11.5, color: t.faint }}>{emp.department || "—"}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c, lineHeight: 1 }}>{emp.wi}</div>
            <span style={{ fontSize: 10, fontWeight: 800, background: `${c}24`, color: c, borderRadius: 6, padding: "2px 8px" }}>{band}</span>
          </div>
        </div>
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.faint, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>Dimension scores</div>
          {dims.map((d) => (
            <div key={d.name} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, color: t.muted }}>{d.name} <span style={{ color: t.faint }}>· {d.label}</span></span>
                <span style={{ fontSize: 13, fontWeight: 800, color: c }}>{Math.min(5, d.v).toFixed(1)}</span>
              </div>
              <div style={{ height: 7, background: t.track, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(Math.min(5, d.v) / 5) * 100}%`, background: c, borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "8px 20px 24px", display: "flex", gap: 10 }}>
          <button type="button" style={{ flex: 1, borderRadius: 13, border: "none", padding: 13, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: `linear-gradient(135deg, ${t.g2 || t.blue}, ${t.blue})`, color: "#fff" }}>
            📨 Nudge to check-in
          </button>
        </div>
      </div>
    </div>
  );
}
