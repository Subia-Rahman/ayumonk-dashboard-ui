import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";
import Layout from "../../layouts/commonLayout/Layout";
import useTenantContext from "../../hooks/useTenantContext";
import { fetchRbacMatrix } from "../../store/rbacMatrixSlice";
import { fetchCompanies } from "../../store/companySlice";
import { ACCENT, useClientPalette } from "../../utils/clientPalette";

// Mock preview rows mirroring the client AdminDashboard sample data
const ADMIN_DATA = {
  companies: [
    { id: 1, name: "TechCorp Pvt Ltd", industry: "IT", size: "Medium", employees: 320, status: "active", created: "Jan 2025" },
    { id: 2, name: "RetailCo Ltd", industry: "Retail", size: "Large", employees: 850, status: "active", created: "Feb 2025" },
    { id: 3, name: "PharmaCorp", industry: "Pharma", size: "Medium", employees: 210, status: "active", created: "Mar 2025" },
    { id: 4, name: "StartupXYZ", industry: "Tech", size: "Small", employees: 45, status: "trial", created: "Apr 2025" },
  ],
  users: [
    { id: 1, name: "Rahul Sharma", email: "rahul@techcorp.com", company: "TechCorp", role: "employee", dept: "Engineering", status: "active" },
    { id: 2, name: "Priya Mehta", email: "priya@techcorp.com", company: "TechCorp", role: "hr", dept: "HR", status: "active" },
    { id: 3, name: "Ananya Singh", email: "ananya@retailco.com", company: "RetailCo", role: "employee", dept: "Marketing", status: "active" },
    { id: 4, name: "Karan Nair", email: "karan@pharmaco.com", company: "PharmaCorp", role: "cxo", dept: "Leadership", status: "active" },
    { id: 5, name: "Sneha Iyer", email: "sneha@startupxyz.com", company: "StartupXYZ", role: "hr", dept: "Operations", status: "inactive" },
  ],
  themes: [
    { key: "STRESS_RECOVERY", name: "Stress & Recovery", kpis: ["Sleep", "Stress", "Emotional"], companies: 3, status: "active" },
    { key: "CORPORATE_VITALITY", name: "Corporate Vitality", kpis: ["Hydration", "Activity", "Energy"], companies: 2, status: "active" },
    { key: "METABOLISM_RESET", name: "Metabolism Reset", kpis: ["Nutrition", "Digestion", "Activity"], companies: 1, status: "active" },
    { key: "MIND_MOOD", name: "Mind & Mood", kpis: ["Emotional", "Stress", "Social"], companies: 0, status: "draft" },
  ],
  questions: [
    { key: "SLEEP_Q1", kpi: "SLEEP_KPI", label: "How well do you fall asleep at night?", type: "Likert 1–5", reverse: false, status: "active" },
    { key: "SLEEP_Q2", kpi: "SLEEP_KPI", label: "How many hours of sleep do you get?", type: "Likert 1–5", reverse: false, status: "active" },
    { key: "STRESS_Q1", kpi: "STRESS_KPI", label: "How often do you feel overwhelmed at work?", type: "Likert 1–5", reverse: true, status: "active" },
    { key: "STRESS_Q2", kpi: "STRESS_KPI", label: "Does work stress affect your sleep?", type: "Likert 1–5", reverse: false, status: "active" },
    { key: "HYDRATION_Q1", kpi: "HYDRATION_KPI", label: "How many glasses of water do you drink daily?", type: "Likert 1–5", reverse: false, status: "active" },
  ],
  challenges: [
    { id: 1, label: "Hydration Mission", kpi: "HYDRATION_KPI", type: "counter", xp: 20, status: "active", companies: 4 },
    { id: 2, label: "Sleep Before 10PM", kpi: "SLEEP_KPI", type: "toggle", xp: 25, status: "active", companies: 4 },
    { id: 3, label: "Move Your Body", kpi: "ACTIVITY_KPI", type: "choice", xp: 30, status: "active", companies: 3 },
    { id: 4, label: "4-7-8 Breathing", kpi: "STRESS_KPI", type: "timer", xp: 20, status: "active", companies: 4 },
    { id: 5, label: "Daily Mood Check", kpi: "EMOTIONAL_KPI", type: "rating", xp: 10, status: "active", companies: 2 },
    { id: 6, label: "Gratitude Journal", kpi: "EMOTIONAL_KPI", type: "toggle", xp: 15, status: "draft", companies: 0 },
  ],
  suggestions: [
    { id: 1, type: "aahar", kpi: "SLEEP_KPI", dosha: "all", title: "Warm turmeric milk at bedtime", trigger: "kpi_risk", status: "active" },
    { id: 2, type: "vihar", kpi: "SLEEP_KPI", dosha: "vata", title: "Digital detox from 9PM", trigger: "kpi_risk", status: "active" },
    { id: 3, type: "aushadh", kpi: "SLEEP_KPI", dosha: "pitta", title: "Brahmi + Ashwagandha capsule", trigger: "kpi_risk", status: "active" },
    { id: 4, type: "aahar", kpi: "STRESS_KPI", dosha: "all", title: "Cut all caffeine after noon", trigger: "question_score", status: "active" },
    { id: 5, type: "vihar", kpi: "STRESS_KPI", dosha: "pitta", title: "5-min Anulom Vilom morning", trigger: "kpi_risk", status: "active" },
    { id: 6, type: "aushadh", kpi: "STRESS_KPI", dosha: "all", title: "Shankhpushpi syrup — 2 tsp twice daily", trigger: "kpi_risk", status: "draft" },
  ],
  sessions: [
    { id: 1, company: "TechCorp", theme: "Stress & Recovery", startDate: "1 Feb 2025", endDate: "31 Oct 2025", status: "active", employees: 320 },
    { id: 2, company: "TechCorp", theme: "Metabolism Reset", startDate: "1 Apr 2025", endDate: "30 Jun 2025", status: "completed", employees: 118 },
    { id: 3, company: "RetailCo", theme: "Corporate Vitality", startDate: "1 Jun 2025", endDate: "31 Dec 2025", status: "active", employees: 850 },
    { id: 4, company: "PharmaCorp", theme: "Stress & Recovery", startDate: "1 Jan 2025", endDate: "31 Dec 2025", status: "active", employees: 210 },
  ],
};

const ADMIN_SECTIONS = [
  { id: "companies", icon: "🏢", label: "Companies", desc: "Add and manage corporate clients", color: "#4A90C4", route: "/super-admin/company-data" },
  { id: "users", icon: "👥", label: "Users & Roles", desc: "Assign employees, HR managers, admins and CXOs", color: "#6DB33F", route: "/super-admin/company-users" },
  { id: "themes", icon: "🎨", label: "Themes", desc: "Create wellness program themes and assign KPIs", color: "#8B6FCB", route: "/super-admin/themes" },
  { id: "questions", icon: "❓", label: "Questions", desc: "Manage assessment questions per KPI", color: "#E8A020", route: "/super-admin/questions" },
  { id: "challenges", icon: "🎯", label: "Challenges", desc: "Create and configure daily challenges per KPI", color: "#f97316", route: "/super-admin/challenges" },
  { id: "suggestions", icon: "🌿", label: "Suggestion Master", desc: "Manage Aahar / Vihar / Aushadh suggestion library", color: "#22c55e", route: "/super-admin/suggestion-master" },
  { id: "sessions", icon: "📅", label: "Sessions / KPI Windows", desc: "Schedule KPI programs per company (start + end dates)", color: "#38bdf8", route: "/super-admin/sessions" },
  { id: "cxo_metrics", icon: "📊", label: "CXO Metrics", desc: "Configure Productivity / Engagement / Absenteeism mappings per company", color: "#0ea5e9", route: "/super-admin/cxo-metrics" },
];

const COLS = {
  companies: [["ID", "id", 40], ["Company Name", "name", 220], ["Industry", "industry", 90], ["Size", "size", 70], ["Employees", "employees", 80], ["Status", "status", 70], ["Created", "created", 80]],
  users: [["ID", "id", 40], ["Name", "name", 150], ["Email", "email", 200], ["Company", "company", 100], ["Role", "role", 110], ["Dept", "dept", 100], ["Status", "status", 70]],
  themes: [["Key", "key", 160], ["Theme Name", "name", 180], ["KPIs", "kpis", 200], ["Companies", "companies", 80], ["Status", "status", 70]],
  questions: [["Key", "key", 120], ["KPI", "kpi", 120], ["Question", "label", 280], ["Type", "type", 80], ["Reverse", "reverse", 60], ["Status", "status", 70]],
  challenges: [["ID", "id", 40], ["Label", "label", 180], ["KPI", "kpi", 120], ["Type", "type", 80], ["XP", "xp", 50], ["Companies", "companies", 80], ["Status", "status", 70]],
  suggestions: [["ID", "id", 40], ["Type", "type", 70], ["KPI", "kpi", 120], ["Dosha", "dosha", 60], ["Title", "title", 240], ["Trigger", "trigger", 110], ["Status", "status", 70]],
  sessions: [["ID", "id", 40], ["Company", "company", 120], ["Theme", "theme", 160], ["Start", "startDate", 90], ["End", "endDate", 90], ["Employees", "employees", 80], ["Status", "status", 70]],
};

const FORM_FIELDS = {
  companies: [["Company Name", "name", "text"], ["Industry", "industry", "text"], ["Size", "size", "select:Small|Medium|Large|Enterprise"], ["No. of Employees", "employees", "number"]],
  users: [["Full Name", "name", "text"], ["Email", "email", "email"], ["Company", "company", "text"], ["Role", "role", "select:employee|hr|cxo|admin|ayumonk_admin|super_admin"], ["Department", "dept", "text"]],
  themes: [["Theme Key", "key", "text"], ["Display Name", "name", "text"], ["Description", "desc", "text"]],
  questions: [["Question Key", "key", "text"], ["KPI Key", "kpi", "text"], ["Question Text", "label", "textarea"], ["Reverse Scoring", "reverse", "select:false|true"]],
  challenges: [["Label", "label", "text"], ["KPI Key", "kpi", "text"], ["Type", "type", "select:counter|toggle|choice|multi|timer|rating"], ["XP Reward", "xp", "number"]],
  suggestions: [["Type", "type", "select:aahar|vihar|aushadh"], ["KPI Key", "kpi", "text"], ["Dosha", "dosha", "select:all|vata|pitta|kapha"], ["Title", "title", "text"], ["Description", "desc", "textarea"], ["Trigger Mode", "trigger", "select:kpi_risk|question_score|both"]],
  sessions: [["Company", "company", "text"], ["Theme Key", "theme", "text"], ["KPI Start Date", "startDate", "date"], ["KPI End Date", "endDate", "date"]],
};

const ROLE_LABELS = { employee: "Employee", hr: "HR Manager", cxo: "CXO", admin: "Company Admin", ayumonk_admin: "Ayumonk Admin", super_admin: "Super Admin", superadmin: "Super Admin" };
const ROLE_COLORS = { employee: "#6B8F6D", hr: "#4A90C4", cxo: "#D4A843", admin: "#8B6FCB", ayumonk_admin: "#6DB33F", super_admin: "#f97316", superadmin: "#f97316" };

// Note: the static RBAC rows that previously lived here have moved to
// `DEFAULT_SECTIONS` in src/store/rbacMatrixSlice.js. The slice exposes them
// as the initial / fallback matrix shown before the API resolves (or if it
// fails), keeping the UI identical without duplicating data here.

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
  const isPlatformAdmin = useSelector((state) => state.auth.isPlatformAdmin);
  const effectiveRole = stateRole || "superadmin";
  const C = useClientPalette();
  const { companyIdForRequest } = useTenantContext();
  const {
    data: rbacData,
    loading: rbacLoading,
    error: rbacError,
  } = useSelector((state) => state.rbacMatrix);
  const { companies, companiesLoading } = useSelector((state) => state.company);

  // Explicit filter set via the dropdown above the matrix. Empty string =
  // "use the globally-selected tenant" (companyIdForRequest from the tenant
  // context) so the matrix follows the top-bar tenant switcher by default.
  const [rbacCompanyFilter, setRbacCompanyFilter] = useState("");

  // Show the company-filter dropdown only when the current user can actually
  // pick another company. Tenant users (e.g. company admins) are locked to
  // their own company — the backend ignores any company_id they send.
  const canFilterByCompany =
    isPlatformAdmin ||
    effectiveRole === "superadmin" ||
    effectiveRole === "super_admin" ||
    effectiveRole === "ayumonk_admin";

  // Fetch the company list (used to populate the filter dropdown). Only the
  // roles that are actually allowed to switch companies need it.
  useEffect(() => {
    if (canFilterByCompany) {
      dispatch(fetchCompanies());
    }
  }, [dispatch, canFilterByCompany]);

  // Fetch the RBAC matrix:
  //   - Platform admins / super admins: explicit dropdown filter wins, falls
  //     back to the active tenant from the top-bar switcher, and finally to
  //     the platform-default matrix when nothing is selected.
  //   - Company admins: backend ignores any company_id and uses the JWT.
  const effectiveRbacCompanyId = canFilterByCompany
    ? (rbacCompanyFilter || "").trim() || companyIdForRequest || ""
    : "";

  useEffect(() => {
    dispatch(fetchRbacMatrix({ companyId: effectiveRbacCompanyId }));
  }, [dispatch, effectiveRbacCompanyId]);

  const [section, setSection] = useState("companies");
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

  const adminBadgeLabel = isPlatformAdmin
    ? "SUPER ADMIN"
    : effectiveRole === "super_admin" || effectiveRole === "superadmin"
      ? "SUPER ADMIN"
      : "ADMIN";
  const myRoleLabel = ROLE_LABELS[effectiveRole] || effectiveRole.toUpperCase();
  const myRoleColor = ROLE_COLORS[effectiveRole] || C.g3;

  return (
    <Layout role="superadmin" title="Admin Panel">
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
          ⚙️ Admin Panel — Manage companies, users, themes, questions, challenges, suggestions and KPI sessions
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
                  background: "rgba(240,80,80,0.12)",
                  color: "#f87171",
                  borderRadius: 5,
                  padding: "2px 8px",
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}
              >
                {adminBadgeLabel}
              </span>
            </div>
            <div style={{ fontSize: 9, color: C.muted }}>
              Manage all platform entities — companies, users, content, and program configuration.
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
            Logged in as {myRoleLabel} · Full access
          </div>
        </div>

        {/* RBAC COMPANY FILTER — only shown to roles that can switch companies */}
        {canFilterByCompany && (
          <div
            style={{
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Filter access matrix by company
            </span>
            <select
              value={rbacCompanyFilter}
              onChange={(e) => setRbacCompanyFilter(e.target.value)}
              disabled={companiesLoading}
              style={{
                background: "rgba(30,50,30,0.9)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                outline: "none",
                minWidth: 240,
                cursor: companiesLoading ? "wait" : "pointer",
              }}
            >
              <option value="">
                {companyIdForRequest
                  ? "Use globally-selected tenant"
                  : "All companies (platform default)"}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
            {rbacCompanyFilter && (
              <button
                type="button"
                onClick={() => setRbacCompanyFilter("")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: C.muted,
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
            {companiesLoading && (
              <span style={{ fontSize: 9, color: C.muted }}>Loading companies…</span>
            )}
          </div>
        )}

        {/* RBAC MATRIX */}
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
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
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
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8 }}>
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
                      background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
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
                      const col = p === "full" ? C.g3 : p === "view" ? C.blue : "rgba(255,255,255,0.1)";
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
                            {p === "none" ? "—" : p === "full" ? "✓ Full" : "👁 View"}
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
          {/* Table header */}
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

          {/* Inline form */}
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

          {/* Data table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
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
                      background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
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
