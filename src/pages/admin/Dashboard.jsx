import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";
import Layout from "../../layouts/commonLayout/Layout";
import { fetchRbacMatrix } from "../../store/rbacMatrixSlice";
import { ACCENT, useClientPalette } from "../../utils/clientPalette";

// Mock preview rows mirroring the client AdminDashboard sample data — scoped
// to a single company's perspective (Company Admin sees their own tenant).
const ADMIN_DATA = {
  users: [
    { id: 1, name: "Rahul Sharma", email: "rahul@company.com", company: "Your Company", role: "employee", dept: "Engineering", status: "active" },
    { id: 2, name: "Priya Mehta", email: "priya@company.com", company: "Your Company", role: "hr", dept: "HR", status: "active" },
    { id: 3, name: "Ananya Singh", email: "ananya@company.com", company: "Your Company", role: "employee", dept: "Marketing", status: "active" },
    { id: 4, name: "Karan Nair", email: "karan@company.com", company: "Your Company", role: "cxo", dept: "Leadership", status: "active" },
  ],
  themes: [
    { key: "STRESS_RECOVERY", name: "Stress & Recovery", kpis: ["Sleep", "Stress", "Emotional"], companies: 1, status: "active" },
    { key: "CORPORATE_VITALITY", name: "Corporate Vitality", kpis: ["Hydration", "Activity", "Energy"], companies: 1, status: "active" },
    { key: "METABOLISM_RESET", name: "Metabolism Reset", kpis: ["Nutrition", "Digestion", "Activity"], companies: 1, status: "active" },
  ],
  questions: [
    { key: "SLEEP_Q1", kpi: "SLEEP_KPI", label: "How well do you fall asleep at night?", type: "Likert 1–5", reverse: false, status: "active" },
    { key: "SLEEP_Q2", kpi: "SLEEP_KPI", label: "How many hours of sleep do you get?", type: "Likert 1–5", reverse: false, status: "active" },
    { key: "STRESS_Q1", kpi: "STRESS_KPI", label: "How often do you feel overwhelmed at work?", type: "Likert 1–5", reverse: true, status: "active" },
    { key: "HYDRATION_Q1", kpi: "HYDRATION_KPI", label: "How many glasses of water do you drink daily?", type: "Likert 1–5", reverse: false, status: "active" },
  ],
  challenges: [
    { id: 1, label: "Hydration Mission", kpi: "HYDRATION_KPI", type: "counter", xp: 20, status: "active", companies: 1 },
    { id: 2, label: "Sleep Before 10PM", kpi: "SLEEP_KPI", type: "toggle", xp: 25, status: "active", companies: 1 },
    { id: 3, label: "Move Your Body", kpi: "ACTIVITY_KPI", type: "choice", xp: 30, status: "active", companies: 1 },
    { id: 4, label: "4-7-8 Breathing", kpi: "STRESS_KPI", type: "timer", xp: 20, status: "active", companies: 1 },
    { id: 5, label: "Daily Mood Check", kpi: "EMOTIONAL_KPI", type: "rating", xp: 10, status: "active", companies: 1 },
  ],
  sessions: [
    { id: 1, company: "Your Company", theme: "Stress & Recovery", startDate: "1 Feb 2025", endDate: "31 Oct 2025", status: "active", employees: 320 },
    { id: 2, company: "Your Company", theme: "Metabolism Reset", startDate: "1 Apr 2025", endDate: "30 Jun 2025", status: "completed", employees: 118 },
    { id: 3, company: "Your Company", theme: "Corporate Vitality", startDate: "1 Jun 2025", endDate: "31 Dec 2025", status: "active", employees: 850 },
  ],
};

// Sections visible to a Company Admin — these are the only /admin/* CRUD
// routes that exist (no platform-wide sections like Suggestion Master or
// KPI Suggestion Mapping; those live under super-admin).
const ADMIN_SECTIONS = [
  { id: "users", icon: "👥", label: "Users & Roles", desc: "Manage employees, HR managers, CXOs, and company admins", color: "#6DB33F", route: "/admin/company-users" },
  { id: "themes", icon: "🎨", label: "Themes", desc: "Wellness program themes assigned to your company", color: "#8B6FCB", route: "/admin/themes" },
  { id: "questions", icon: "❓", label: "Questions", desc: "Assessment questions per KPI for your sessions", color: "#E8A020", route: "/admin/questions" },
  { id: "challenges", icon: "🎯", label: "Challenges", desc: "Daily challenges configured per KPI", color: "#f97316", route: "/admin/challenges" },
  { id: "sessions", icon: "📅", label: "Sessions / KPI Windows", desc: "Schedule KPI programs (start + end dates)", color: "#38bdf8", route: "/admin/sessions" },
];

const COLS = {
  users: [["ID", "id", 40], ["Name", "name", 150], ["Email", "email", 200], ["Dept", "dept", 110], ["Role", "role", 110], ["Status", "status", 70]],
  themes: [["Key", "key", 160], ["Theme Name", "name", 180], ["KPIs", "kpis", 220], ["Status", "status", 70]],
  questions: [["Key", "key", 120], ["KPI", "kpi", 120], ["Question", "label", 280], ["Type", "type", 80], ["Reverse", "reverse", 60], ["Status", "status", 70]],
  challenges: [["ID", "id", 40], ["Label", "label", 180], ["KPI", "kpi", 120], ["Type", "type", 80], ["XP", "xp", 50], ["Status", "status", 70]],
  sessions: [["ID", "id", 40], ["Theme", "theme", 160], ["Start", "startDate", 90], ["End", "endDate", 90], ["Employees", "employees", 80], ["Status", "status", 70]],
};

const FORM_FIELDS = {
  users: [["Full Name", "name", "text"], ["Email", "email", "email"], ["Role", "role", "select:employee|hr|cxo|admin"], ["Department", "dept", "text"]],
  themes: [["Theme Key", "key", "text"], ["Display Name", "name", "text"], ["Description", "desc", "text"]],
  questions: [["Question Key", "key", "text"], ["KPI Key", "kpi", "text"], ["Question Text", "label", "textarea"], ["Reverse Scoring", "reverse", "select:false|true"]],
  challenges: [["Label", "label", "text"], ["KPI Key", "kpi", "text"], ["Type", "type", "select:counter|toggle|choice|multi|timer|rating"], ["XP Reward", "xp", "number"]],
  sessions: [["Theme Key", "theme", "text"], ["KPI Start Date", "startDate", "date"], ["KPI End Date", "endDate", "date"]],
};

const ROLE_LABELS = { employee: "Employee", hr: "HR Manager", cxo: "CXO", admin: "Company Admin", ayumonk_admin: "Ayumonk Admin", super_admin: "Super Admin", superadmin: "Super Admin" };
const ROLE_COLORS = { employee: "#6B8F6D", hr: "#4A90C4", cxo: "#D4A843", admin: "#8B6FCB", ayumonk_admin: "#6DB33F", super_admin: "#f97316", superadmin: "#f97316" };

function StatusBadge({ s, mutedColor }) {
  const col =
    s === "active" ? ACCENT.g3
      : s === "draft" ? ACCENT.gold
        : s === "completed" ? ACCENT.blue
          : s === "trial" ? ACCENT.orange
            : mutedColor;
  return (
    <span
      style={{
        fontSize: 7.5,
        fontWeight: 700,
        background: `${col}28`,
        color: col,
        borderRadius: 5,
        padding: "1px 7px",
      }}
    >
      {s?.toUpperCase()}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stateRole = useSelector((state) => state.auth.role);
  const stateRawRole = useSelector((state) => state.auth.rawRole);
  const C = useClientPalette();
  const userName = useSelector(
    (state) => state.auth.user?.name || state.auth.user?.email || "",
  );
  const effectiveRole = stateRole || "admin";
  const {
    data: rbacData,
    loading: rbacLoading,
    error: rbacError,
  } = useSelector((state) => state.rbacMatrix);

  // Company admins cannot pick a different company — the backend uses their
  // JWT-derived tenant and ignores any company_id query param (Spec §7).
  useEffect(() => {
    dispatch(fetchRbacMatrix({ companyId: "" }));
  }, [dispatch]);

  const [section, setSection] = useState("users");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [formData, setFormData] = useState({});

  const sec = ADMIN_SECTIONS.find((s) => s.id === section);
  const cols = COLS[section] || [];
  const formFields = FORM_FIELDS[section] || [];

  const filtered = useMemo(() => {
    const rows = ADMIN_DATA[section] || [];
    return rows.filter(
      (r) =>
        !searchQ ||
        Object.values(r).some((v) =>
          String(v).toLowerCase().includes(searchQ.toLowerCase()),
        ),
    );
  }, [section, searchQ]);

  const handleSectionClick = (s) => {
    setSection(s.id);
    setShowForm(false);
    setSearchQ("");
    setEditItem(null);
    setFormData({});
  };

  const handleOpenInEditor = () => {
    if (sec?.route) navigate(sec.route);
  };

  const myRoleLabel =
    ROLE_LABELS[stateRawRole] ||
    ROLE_LABELS[effectiveRole] ||
    "Company Admin";
  const myRoleColor =
    ROLE_COLORS[stateRawRole] || ROLE_COLORS[effectiveRole] || C.purple;

  return (
    <Layout role="admin" title="Admin Panel">
      <Box
        sx={{
          bgcolor: C.bg,
          color: C.text,
          borderRadius: 3,
          p: { xs: 1.5, md: 2 },
          fontFamily: "inherit",
          colorScheme: C.isDark ? "dark" : "light",
        }}
      >
        {/* Subtitle strip */}
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.32)",
            marginBottom: 14,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            paddingBottom: 10,
          }}
        >
          ⚙️ Admin Panel — Manage users, themes, questions, challenges, and
          KPI sessions for your company
        </div>

        {/* ADMIN HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 18 }}>⚙️</span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>Admin Panel</span>
              <span
                style={{
                  fontSize: 8,
                  background: "rgba(139,111,203,0.14)",
                  color: "#a78bfa",
                  borderRadius: 5,
                  padding: "2px 8px",
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}
              >
                COMPANY ADMIN
              </span>
            </div>
            <div style={{ fontSize: 9, color: C.muted }}>
              Manage your company's wellness program — users, themes, questions,
              challenges, and KPI session windows.
            </div>
          </div>
          <div
            style={{
              fontSize: 8,
              background: "rgba(107,179,63,0.08)",
              border: "1px solid rgba(107,179,63,0.2)",
              borderRadius: 8,
              padding: "6px 12px",
              color: C.g3,
              whiteSpace: "nowrap",
            }}
          >
            Logged in as {myRoleLabel}
            {userName ? ` (${userName})` : ""} · Tenant-scoped access
          </div>
        </div>

        {/* RBAC MATRIX — admins see their own company's matrix only */}
        <div
          style={{
            marginBottom: 16,
            background: "rgba(255,255,255,0.02)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              🔐 Role-Based Access Control Matrix
              {rbacData.company_name && (
                <span style={{ fontWeight: 400, color: C.muted, marginLeft: 6 }}>
                  · {rbacData.company_name}
                </span>
              )}
              {rbacLoading && (
                <span style={{ fontWeight: 400, color: C.muted, marginLeft: 6 }}>
                  · loading…
                </span>
              )}
            </span>
            <span style={{ fontSize: 8, color: C.muted }}>
              Your role:{" "}
              <span style={{ color: myRoleColor, fontWeight: 700 }}>
                {myRoleLabel}
              </span>
            </span>
          </div>
          {rbacError && (
            <div
              style={{
                padding: "6px 14px",
                fontSize: 9,
                color: "#f87171",
                background: "rgba(240,80,80,0.06)",
                borderBottom: "1px solid rgba(240,80,80,0.18)",
              }}
            >
              {rbacError} — showing the default platform matrix below.
            </div>
          )}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 8 }}
            >
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  <th
                    style={{
                      padding: "6px 10px",
                      textAlign: "left",
                      color: C.muted,
                      fontWeight: 600,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Section
                  </th>
                  {rbacData.roles.map((role) => (
                    <th
                      key={role.key}
                      style={{
                        padding: "6px 10px",
                        textAlign: "center",
                        color: C.muted,
                        fontWeight: 600,
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {role.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rbacData.sections.map((sectionRow, ri) => (
                  <tr
                    key={sectionRow.key}
                    style={{
                      background:
                        ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    }}
                  >
                    <td
                      style={{
                        padding: "5px 10px",
                        color: "rgba(255,255,255,0.65)",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sectionRow.label}
                    </td>
                    {rbacData.roles.map((role) => {
                      const p = sectionRow.permissions?.[role.key] || "none";
                      const col =
                        p === "full"
                          ? C.g3
                          : p === "view"
                            ? C.blue
                            : "rgba(255,255,255,0.1)";
                      const bg =
                        p === "full"
                          ? "rgba(107,179,63,0.1)"
                          : p === "view"
                            ? "rgba(74,144,196,0.08)"
                            : "transparent";
                      return (
                        <td
                          key={role.key}
                          style={{
                            padding: "5px 10px",
                            textAlign: "center",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 7.5,
                              fontWeight: 700,
                              color: col,
                              background: bg,
                              borderRadius: 4,
                              padding: "1px 7px",
                            }}
                          >
                            {p === "none"
                              ? "—"
                              : p === "full"
                                ? "✓ Full"
                                : "👁 View"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION NAV */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {ADMIN_SECTIONS.map((s) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSectionClick(s)}
                onDoubleClick={() => s.route && navigate(s.route)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${active ? s.color : "rgba(255,255,255,0.08)"}`,
                  background: active ? `${s.color}12` : "rgba(255,255,255,0.025)",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  color: "inherit",
                  font: "inherit",
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: active ? s.color : "rgba(255,255,255,0.7)",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 7.5,
                    color: C.muted,
                    marginTop: 2,
                    lineHeight: 1.3,
                  }}
                >
                  {s.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* SECTION TABLE */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{sec?.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{sec?.label}</div>
                <div style={{ fontSize: 8.5, color: C.muted }}>
                  {filtered.length} records
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search…"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 10,
                  outline: "none",
                  width: 140,
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setShowForm((p) => !p);
                  setEditItem(null);
                  setFormData({});
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${C.g1}, ${C.g2})`,
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                + Add New
              </button>
              {sec?.route && (
                <button
                  type="button"
                  onClick={handleOpenInEditor}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: 600,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                  title={`Open full ${sec.label} editor`}
                >
                  Open Full Editor →
                </button>
              )}
            </div>
          </div>

          {showForm && (
            <div
              style={{
                padding: "14px 16px",
                background: "rgba(107,179,63,0.04)",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  marginBottom: 10,
                  color: C.g3,
                }}
              >
                {editItem
                  ? `Edit #${editItem.id || editItem.key || ""}`
                  : `Add New ${sec?.label.replace(/s$/, "") || "Item"}`}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                {formFields.map(([label, field, type]) => (
                  <div key={field}>
                    <div
                      style={{
                        fontSize: 8,
                        color: C.muted,
                        marginBottom: 3,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {label}
                    </div>
                    {type === "textarea" ? (
                      <textarea
                        rows={2}
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, [field]: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#fff",
                          borderRadius: 7,
                          padding: "5px 9px",
                          fontSize: 10,
                          resize: "vertical",
                          outline: "none",
                          boxSizing: "border-box",
                          fontFamily: "inherit",
                        }}
                      />
                    ) : type.startsWith("select:") ? (
                      <select
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, [field]: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          background: "rgba(30,50,30,0.9)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#fff",
                          borderRadius: 7,
                          padding: "6px 9px",
                          fontSize: 10,
                          outline: "none",
                        }}
                      >
                        <option value="">Select…</option>
                        {type
                          .split(":")[1]
                          .split("|")
                          .map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <input
                        type={type}
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, [field]: e.target.value }))
                        }
                        placeholder={label}
                        style={{
                          width: "100%",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#fff",
                          borderRadius: 7,
                          padding: "6px 9px",
                          fontSize: 10,
                          outline: "none",
                          boxSizing: "border-box",
                          colorScheme: "dark",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (sec?.route) navigate(sec.route);
                    else setShowForm(false);
                  }}
                  style={{
                    padding: "7px 20px",
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${C.g1}, ${C.g2})`,
                    border: "none",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  {editItem ? "Update in Editor →" : "Continue in Editor →"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditItem(null);
                    setFormData({});
                  }}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: C.muted,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}
            >
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {cols.map(([h, , w]) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: C.muted,
                        fontSize: 8,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        minWidth: w,
                        borderBottom: `1px solid ${C.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: C.muted,
                      fontSize: 8,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, ri) => (
                  <tr
                    key={ri}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      background:
                        ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    }}
                  >
                    {cols.map(([, field]) => (
                      <td
                        key={field}
                        style={{
                          padding: "8px 12px",
                          color: "rgba(255,255,255,0.65)",
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {field === "status" ? (
                          <StatusBadge s={row[field]} mutedColor={C.muted} />
                        ) : field === "role" ? (
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 700,
                              color: ROLE_COLORS[row[field]] || C.muted,
                            }}
                          >
                            {ROLE_LABELS[row[field]] || row[field]}
                          </span>
                        ) : field === "kpis" ? (
                          <span>
                            {Array.isArray(row[field])
                              ? row[field].join(", ")
                              : row[field]}
                          </span>
                        ) : field === "reverse" ? (
                          <span
                            style={{
                              color: row[field] ? C.orange : C.g3,
                              fontWeight: 700,
                            }}
                          >
                            {row[field] ? "Yes" : "No"}
                          </span>
                        ) : field === "type" ? (
                          <span
                            style={{
                              fontSize: 8,
                              background: "rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.5)",
                              borderRadius: 4,
                              padding: "1px 6px",
                            }}
                          >
                            {row[field]}
                          </span>
                        ) : (
                          String(row[field] ?? "")
                        )}
                      </td>
                    ))}
                    <td
                      style={{
                        padding: "8px 12px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditItem(row);
                          setFormData({ ...row });
                          setShowForm(true);
                        }}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: C.blue,
                          borderRadius: 5,
                          padding: "2px 9px",
                          cursor: "pointer",
                          fontSize: 8,
                          marginRight: 5,
                          fontWeight: 600,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenInEditor}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(240,80,80,0.3)",
                          color: "#f87171",
                          borderRadius: 5,
                          padding: "2px 9px",
                          cursor: "pointer",
                          fontSize: 8,
                          fontWeight: 600,
                        }}
                      >
                        {row.status === "active" ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={cols.length + 1}
                      style={{
                        padding: 30,
                        textAlign: "center",
                        color: C.muted,
                        fontSize: 10,
                      }}
                    >
                      No records found{searchQ ? ` for "${searchQ}"` : ""}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Box>
    </Layout>
  );
}
