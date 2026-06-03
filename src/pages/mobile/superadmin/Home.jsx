import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { C } from "../../../components/mobile/palette";
import { fetchCompanies } from "../../../store/companySlice";

// hex + alpha helper
const ha = (hex, a) => {
  const h = String(hex || "#000").replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${a})`;
};

// Quick-manage tiles → real super-admin routes
const TILES = [
  { ic: "🏢", name: "Companies", desc: "Add and manage corporate clients", c: C.blue, path: "/super-admin/company-data" },
  { ic: "👥", name: "Users & Roles", desc: "Assign employees, HR, admins & CXOs", c: C.g3, path: "/super-admin/company-users" },
  { ic: "🎨", name: "Themes", desc: "Create wellness program themes", c: C.purple, path: "/super-admin/themes" },
  { ic: "❓", name: "Questions", desc: "Manage assessment questions per KPI", c: C.gold, path: "/super-admin/questions" },
  { ic: "🎯", name: "Challenges", desc: "Configure daily challenges per KPI", c: C.orange, path: "/super-admin/challenges" },
  { ic: "🌿", name: "Suggestion Master", desc: "Aahar / Vihar / Aushadh library", c: C.teal, path: "/super-admin/suggestion-master" },
  { ic: "📅", name: "Sessions / KPI Windows", desc: "Schedule KPI programs per company", c: C.purple, path: "/super-admin/sessions" },
  { ic: "📈", name: "CXO Metrics", desc: "Productivity / Engagement mappings", c: C.g3, path: "/super-admin/cxo-metrics" },
];

// RBAC summary for the current Super Admin role (full access everywhere)
const RBAC = [
  "Company Master", "Company Users", "Themes", "KPIs & Questions",
  "Challenges", "Suggestion Master", "Sessions / Windows", "HR Analytics", "Platform Settings",
];
const RBAC_ROLES = ["Employee", "HR Manager", "CXO", "Company Admin", "Ayumonk Admin", "Super Admin"];
const RBAC_FULL = [
  ["Company Master", "—", "—", "—", "View", "Full", "Full"],
  ["Company Users", "—", "View", "—", "Full", "Full", "Full"],
  ["Themes", "—", "—", "—", "View", "Full", "Full"],
  ["KPIs & Questions", "—", "—", "—", "—", "Full", "Full"],
  ["Challenges", "—", "View", "—", "View", "Full", "Full"],
  ["Suggestion Master", "—", "—", "—", "—", "Full", "Full"],
  ["Sessions / Windows", "—", "Full", "View", "Full", "Full", "Full"],
  ["HR Analytics", "—", "Full", "Full", "—", "View", "Full"],
  ["Platform Settings", "—", "—", "—", "—", "—", "Full"],
];

export default function SaHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { companies, companiesLoading } = useSelector((state) => state.company);
  const [matrix, setMatrix] = useState(false);

  useEffect(() => {
    dispatch(fetchCompanies({}));
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = companies?.length || 0;
    const totalUsers = (companies || []).reduce(
      (sum, c) => sum + (Number(c.no_of_employees) || 0), 0,
    );
    const userLabel = totalUsers >= 1000 ? `${(totalUsers / 1000).toFixed(1)}K` : String(totalUsers);
    return { companies: total, users: userLabel };
  }, [companies]);

  const recent = (companies || []).slice(0, 4);

  return (
    <div style={{ background: C.bg, minHeight: "100%" }}>
      {/* Hero */}
      <div style={{ margin: "12px 14px 18px", borderRadius: 18, padding: "16px 16px 6px", background: `linear-gradient(150deg, ${C.g1}, ${C.g3})`, color: "#fff", boxShadow: "0 12px 26px -16px rgba(61,107,72,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 800 }}>⚙️ Admin Panel</span>
          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.08em", background: "rgba(255,255,255,0.22)", borderRadius: 999, padding: "3px 8px" }}>SUPER ADMIN</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", lineHeight: 1.5 }}>
          Manage companies, users, content &amp; program configuration across the platform.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "14px -2px 0" }}>
          {[
            [companiesLoading && !stats.companies ? "…" : stats.companies, "Companies"],
            [stats.users, "Users"],
            ["23", "Sessions"],
            ["33", "KPIs"],
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{n}</div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RBAC summary */}
      <div style={{ margin: "0 14px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#1F1E1D" }}>🔐 Your Access · Super Admin</span>
          <button type="button" onClick={() => setMatrix(true)} style={{ border: "none", background: "transparent", color: C.g3, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>View full matrix →</button>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 14px" }}>
          {RBAC.map((s, i) => (
            <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", fontSize: 12.5, color: C.muted, borderBottom: i < RBAC.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span>{s}</span><span style={{ color: "#2f7d4f", fontWeight: 800, fontSize: 12 }}>✓ Full</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Manage tiles */}
      <div style={{ margin: "0 14px 22px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1F1E1D", marginBottom: 11 }}>⚡ Quick Manage</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {TILES.map((t) => (
            <button key={t.name} type="button" onClick={() => navigate(t.path)} style={{ textAlign: "left", border: `1px solid ${C.border}`, background: C.card, borderRadius: 13, padding: 13, cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, minHeight: 108 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", fontSize: 19, marginBottom: 5, background: ha(t.c, 0.14), color: t.c }}>{t.ic}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1F1E1D" }}>{t.name}</span>
              <span style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.4 }}>{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Companies cards */}
      <div style={{ margin: "0 14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#1F1E1D" }}>📋 Companies · {stats.companies}</span>
          <button type="button" onClick={() => navigate("/super-admin/company-data")} style={{ border: "none", background: "transparent", color: C.g3, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Open →</button>
        </div>
        {companiesLoading && !recent.length && (
          <div style={{ fontSize: 11.5, color: C.muted, padding: "8px 0" }}>Loading companies…</div>
        )}
        {!companiesLoading && recent.length === 0 && (
          <div style={{ fontSize: 11.5, color: C.muted, padding: "8px 0" }}>No companies yet.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recent.map((c) => (
            <div key={c.id} onClick={() => navigate(`/super-admin/company-data/${c.id}`)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#1F1E1D" }}>{c.company_name}</span>
                <span style={{ fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "3px 11px", background: "#e7f3ea", color: "#2f7d4f" }}>Active</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: C.muted }}>Industry</span><b style={{ color: "#1F1E1D", fontWeight: 600 }}>{c.industry || "—"}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: C.muted }}>Employees</span><b style={{ color: "#1F1E1D", fontWeight: 600 }}>{c.no_of_employees || 0}</b>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full RBAC matrix sheet */}
      {matrix && (
        <div onClick={() => setMatrix(false)} style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(20,30,16,0.45)" }} />
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: C.card, borderRadius: "22px 22px 0 0", maxHeight: "86%", display: "flex", flexDirection: "column" }}>
            <div style={{ width: 38, height: 4.5, borderRadius: 999, background: C.border, margin: "10px auto 4px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 18px 14px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 15.5, fontWeight: 700 }}>Role-Based Access Control</span>
              <button type="button" onClick={() => setMatrix(false)} style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "14px 18px 26px", overflow: "auto" }}>
              <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 12 }}>Scroll horizontally to compare all roles.</div>
              <div style={{ overflowX: "auto", margin: "0 -4px" }}>
                <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "max-content", fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, color: C.muted, fontWeight: 700, position: "sticky", left: 0, background: C.card }}>Section</th>
                      {RBAC_ROLES.map((r) => (
                        <th key={r} style={{ padding: "8px 10px", fontSize: 10, color: C.muted, fontWeight: 700, whiteSpace: "nowrap" }}>{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RBAC_FULL.map((row) => (
                      <tr key={row[0]}>
                        <td style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#1F1E1D", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}`, position: "sticky", left: 0, background: C.card }}>{row[0]}</td>
                        {row.slice(1).map((v, i) => (
                          <td key={i} style={{ padding: "8px 10px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
                            {v === "Full" ? <span style={{ color: "#2f7d4f", fontWeight: 800 }}>✓</span> : v === "View" ? <span style={{ color: C.blue }}>👁</span> : <span style={{ color: C.muted }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
