import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTokens } from "../../../components/mobile/useTokens";
import { fetchUsers } from "../../../store/userSlice";
import { getCompanyId } from "../../../utils/roleHelper";
import { EmployeeSheet } from "./People";

// Risk + pending-action surface. At-risk list is derived from the same
// deterministic pseudo-WI used by People (until real per-employee WI ships);
// pending-forms breakdown is a faithful demo.
function pseudoWi(id) {
  const seed = String(id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 45 + (seed % 45);
}
const initials = (name) =>
  String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() || "").join("") || "U";

const DEMO = [
  { id: "d7", full_name: "Meera Joshi", department: "Operations" },
  { id: "d8", full_name: "Karan Verma", department: "Engineering" },
  { id: "d9", full_name: "Divya Rao", department: "Marketing" },
  { id: "d10", full_name: "Sanjay Gupta", department: "Operations" },
];

const FORMS_DUE = [
  { dept: "Operations", n: 18, due: "Overdue", overdue: true },
  { dept: "Marketing", n: 14, due: "Due in 2 days", overdue: false },
  { dept: "Finance", n: 16, due: "Due in 5 days", overdue: false },
];

export default function HrAlerts() {
  const t = useTokens();
  const dispatch = useDispatch();
  const [active, setActive] = useState(null);
  const { users } = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    const companyId = auth.user?.company_id || getCompanyId();
    if (companyId) dispatch(fetchUsers({ companyId, limit: 500 }));
  }, [dispatch, auth.user?.company_id]);

  const atRisk = useMemo(() => {
    const source = users && users.length ? users : DEMO;
    return source
      .map((u) => {
        const wi = pseudoWi(u.id);
        const seed = String(u.id || "").charCodeAt(0) || 0;
        return { ...u, wi, trend: (seed % 11) - 5 };
      })
      .filter((u) => u.wi < 55)
      .sort((a, b) => a.wi - b.wi)
      .slice(0, 8);
  }, [users]);

  const stats = [
    { l: "At Risk", v: atRisk.length, i: "⚠️", c: "#C0604A" },
    { l: "Forms Due", v: 48, i: "📝", c: "#E0935C" },
    { l: "Absentee↑", v: "2 dept", i: "📉", c: "#8B6FCB" },
  ];

  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>🔔 Alerts</div>
        <div style={{ fontSize: 12.5, color: t.muted }}>Risk signals & pending actions</div>
      </div>

      <div style={{ padding: "0 16px", marginBottom: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {stats.map((s) => (
            <div key={s.l} style={{ background: t.card, border: `1px solid ${s.c}4d`, borderRadius: 16, padding: "13px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 19, marginBottom: 4 }}>{s.i}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: t.faint, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px", marginBottom: 22 }}>
        <SecLabel t={t}>⚠️ Employees at risk · WI &lt; 55</SecLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {atRisk.length === 0 && (
            <div style={{ fontSize: 12.5, color: t.faint, padding: "6px 0" }}>No employees currently flagged. 🎉</div>
          )}
          {atRisk.map((e) => (
            <div
              key={e.id}
              onClick={() => setActive(e)}
              style={{ background: t.card, border: `1px solid ${t.border}`, borderLeft: "3px solid #C0604A", borderRadius: 15, padding: "11px 13px", display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(192,96,74,0.16)", display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 800, color: "#C0604A", flexShrink: 0 }}>
                {initials(e.full_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{e.full_name || e.email || "—"}</div>
                <div style={{ fontSize: 11, color: t.faint }}>{e.department || "—"} · ▼ {Math.abs(e.trend)}% this month</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C0604A", background: "rgba(192,96,74,0.12)", border: "1px solid rgba(192,96,74,0.4)", borderRadius: 7, padding: "4px 9px" }}>WI {e.wi}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <SecLabel t={t}>📝 Pending forms by department</SecLabel>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 18, padding: "6px 4px" }}>
          {FORMS_DUE.map((f, i) => {
            const c = f.overdue ? "#C0604A" : "#C99A3F";
            return (
              <div key={f.dept} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", borderBottom: i < FORMS_DUE.length - 1 ? `1px solid ${t.border}` : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{f.dept}</div>
                  <div style={{ fontSize: 11, color: c, fontWeight: 600 }}>{f.due}</div>
                </div>
                <span style={{ fontSize: 17, fontWeight: 800, color: c }}>{f.n}</span>
                <span style={{ fontSize: 11, color: t.faint }}>forms</span>
              </div>
            );
          })}
        </div>
      </div>

      {active && <EmployeeSheet emp={active} t={t} onClose={() => setActive(null)} />}
    </div>
  );
}

function SecLabel({ children, t }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: t.faint, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 12px" }}>{children}</div>;
}
