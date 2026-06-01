// adminBespoke.jsx — Dashboard, Company Users, HR Analytics, Profile (real APIs).
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTokens } from "../../../components/mobile/useTokens";
import { getCompanyId } from "../../../utils/roleHelper";
import { fetchUsers, createUser, updateUser } from "../../../store/userSlice";
import { fetchDepartments } from "../../../store/departmentSlice";
import { fetchLocations } from "../../../store/locationSlice";
import { SectionLabel, StatusChip, Dropdown, DetailSheet, FormSheet, Toast } from "./MasterFramework";

// Reference RBAC matrix (platform default — same as the desktop fallback).
const RBAC_ROLES = ["Emp", "HR", "CXO", "Co.Adm", "AyuAdm", "Super"];
const RBAC_ROWS = [
  ["Company Master", ["—", "—", "—", "V", "F", "F"]],
  ["Company Users", ["—", "V", "—", "F", "F", "F"]],
  ["Themes", ["—", "—", "—", "V", "F", "F"]],
  ["KPIs & Questions", ["—", "—", "—", "F", "F", "F"]],
  ["Challenges", ["—", "V", "—", "V", "F", "F"]],
  ["Suggestion Master", ["—", "—", "—", "F", "F", "F"]],
  ["Sessions / Windows", ["—", "F", "V", "F", "F", "F"]],
  ["HR Analytics", ["—", "F", "F", "—", "V", "F"]],
  ["Ayufinity / Products", ["—", "—", "—", "F", "F", "F"]],
  ["Platform Settings", ["—", "—", "—", "—", "—", "F"]],
];
const CATS = [
  { key: "users", icon: "👥", label: "Users & Roles", desc: "Employees, HR, CXOs", accent: "#8B6FCB" },
  { key: "themes", icon: "🎨", label: "Themes", desc: "Program themes", accent: "#C36FA8" },
  { key: "questions", icon: "❓", label: "Questions", desc: "Assessment questions", accent: "#C99A3F" },
  { key: "challenges", icon: "🎯", label: "Challenges", desc: "Daily challenges", accent: "#E0935C" },
  { key: "sessions", icon: "🗓", label: "Sessions", desc: "KPI session windows", accent: "#4A90C4" },
];
const initials = (n) => String(n || "U").split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("");

// ── Dashboard ────────────────────────────────────────────────────────────────
export function AdminDashboard({ onOpenSection, onOpenUsers }) {
  const t = useTokens();
  const dispatch = useDispatch();
  const companyId = getCompanyId();
  const users = useSelector((s) => s.user.users) || [];
  useEffect(() => { if (companyId) dispatch(fetchUsers({ companyId, limit: 100 })); }, [companyId]);
  const cell = (v) => v === "F" ? <span style={{ fontSize: 9.5, fontWeight: 800, color: "#4F9D5B" }}>✓</span> : v === "V" ? <span style={{ fontSize: 9.5, fontWeight: 700, color: "#4A90C4" }}>👁</span> : <span style={{ fontSize: 10, color: t.faint }}>—</span>;
  const mini = users.slice(0, 6);
  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>⚙️ Admin Panel</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#8B6FCB", background: "rgba(139,111,203,0.16)", borderRadius: 6, padding: "3px 8px" }}>COMPANY ADMIN</span>
        </div>
        <div style={{ fontSize: 12.5, color: t.muted, marginTop: 3 }}>Manage your company's wellness program</div>
      </div>

      <div style={{ padding: "0 16px", marginBottom: 22 }}>
        <SectionLabel t={t}>🔐 Role-Based Access Control</SectionLabel>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: "6px 0 10px" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%" }}>
              <thead><tr>
                <th style={{ textAlign: "left", fontSize: 9.5, color: t.faint, fontWeight: 700, padding: "8px 12px", position: "sticky", left: 0, background: t.card }}>Section</th>
                {RBAC_ROLES.map((r) => <th key={r} style={{ fontSize: 9.5, color: t.faint, fontWeight: 700, padding: "8px 9px", whiteSpace: "nowrap" }}>{r}</th>)}
              </tr></thead>
              <tbody>
                {RBAC_ROWS.map(([sec, vals]) => (
                  <tr key={sec} style={{ borderTop: `1px solid ${t.border}` }}>
                    <td style={{ fontSize: 11, fontWeight: 600, color: t.text, padding: "9px 12px", whiteSpace: "nowrap", position: "sticky", left: 0, background: t.card }}>{sec}</td>
                    {vals.map((v, i) => <td key={i} style={{ textAlign: "center", padding: "9px 9px" }}>{cell(v)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px", marginBottom: 22 }}>
        <SectionLabel t={t}>Quick manage</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {CATS.map((c) => (
            <div key={c.key} onClick={() => (c.key === "users" ? onOpenUsers() : onOpenSection(c.key))} style={{ background: t.card, border: `1px solid ${c.accent}4d`, borderRadius: 16, padding: 14, cursor: "pointer" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${c.accent}28`, display: "grid", placeItems: "center", fontSize: 19, marginBottom: 9 }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{c.label}</div>
              <div style={{ fontSize: 10.5, color: t.faint, marginTop: 2 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel t={t} style={{ margin: 0 }}>👥 Users &amp; Roles · {users.length}</SectionLabel>
          <button onClick={onOpenUsers} style={{ padding: "6px 12px", borderRadius: 9, border: "none", background: `linear-gradient(135deg, ${t.g2 || t.g3}, ${t.g3})`, color: "#fff", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Open →</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {mini.map((u) => (
            <div key={u.id} onClick={onOpenUsers} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: "11px 13px", display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${t.g3}28`, display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 800, color: t.g3, flexShrink: 0 }}>{initials(u.full_name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.full_name || u.email}</div>
                <div style={{ fontSize: 10.5, color: t.faint }}>{u.department || "—"} · {u.role_name || "—"}</div>
              </div>
              <StatusChip active={u.is_active} t={t} />
            </div>
          ))}
          {mini.length === 0 && <div style={{ fontSize: 12, color: t.faint, padding: "8px 0" }}>Loading users…</div>}
        </div>
      </div>
    </div>
  );
}

// ── Company Users (real fetch + filters + edit/disable) ──────────────────────
export function CompanyUsersScreen() {
  const t = useTokens();
  const dispatch = useDispatch();
  const companyId = getCompanyId();
  const users = useSelector((s) => s.user.users) || [];
  const loading = useSelector((s) => s.user.usersLoading);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const flash = (msg, error) => { setToast({ msg, error }); setTimeout(() => setToast(null), 2000); };

  useEffect(() => { if (companyId) dispatch(fetchUsers({ companyId, limit: 200, search: q, isActive: status === "active" ? true : status === "inactive" ? false : undefined })); }, [companyId, q, status]);

  const rows = users;
  const fields = (u) => [["Employee ID", u.emp_id], ["Full Name", u.full_name], ["Department", u.department], ["Gender", u.gender], ["Age Band", u.age_band], ["Phone", u.phone], ["Email", u.email], ["Role", u.role_name], ["Status", u.is_active ? "Active" : "Inactive"]];
  const schema = [
    { key: "emp_id", label: "Employee ID", type: "text" }, { key: "full_name", label: "Full Name", type: "text" },
    { key: "department", label: "Department", type: "text" }, { key: "gender", label: "Gender", type: "select", options: ["male", "female", "other"] },
    { key: "age_band", label: "Age Band", type: "select", options: ["20-25", "26-30", "31-35", "36-40", "41-50", "50+"] },
    { key: "phone", label: "Phone", type: "text" }, { key: "email", label: "Email", type: "text" }, { key: "is_active", label: "Active", type: "toggle" },
  ];
  const fromRow = (u) => ({ emp_id: u.emp_id, full_name: u.full_name, department: u.department, gender: u.gender, age_band: u.age_band, phone: u.phone, email: u.email, is_active: u.is_active });

  const onSave = async (v) => {
    setBusy(true);
    try {
      const body = { emp_id: v.emp_id, full_name: v.full_name, department: v.department, gender: v.gender, age_band: v.age_band, phone: String(v.phone), email: v.email, is_active: !!v.is_active, company_id: companyId };
      if (form.mode === "add") await dispatch(createUser(body)).unwrap();
      else await dispatch(updateUser({ userId: form.row.id, user: body })).unwrap();
      flash(form.mode === "add" ? "User added ✓" : "Saved ✓"); setForm(null); setDetail(null);
      dispatch(fetchUsers({ companyId, limit: 200 }));
    } catch (e) { flash(String(e || "Save failed"), true); }
    setBusy(false);
  };
  const onDisable = async (u) => {
    setBusy(true);
    try { await dispatch(updateUser({ userId: u.id, user: { is_active: !u.is_active } })).unwrap(); flash("Status updated ✓"); setDetail(null); dispatch(fetchUsers({ companyId, limit: 200 })); }
    catch (e) { flash(String(e || "Update failed"), true); }
    setBusy(false);
  };

  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>👥 Company Users</div>
        <div style={{ fontSize: 12.5, color: t.muted }}>{users.length} users · review &amp; update</div>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "10px 13px", marginBottom: 11 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", color: t.text, fontSize: 13, fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 13, alignItems: "center" }}>
          <Dropdown label="Status" value={draft} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} onChange={setDraft} t={t} accent={t.g3} />
          <button onClick={() => setStatus(draft)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: `${t.g3}1a`, color: t.g3, fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Apply</button>
          <button onClick={() => { setDraft(""); setStatus(""); }} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.inset, color: t.muted, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Reset</button>
          <button onClick={() => setForm({ mode: "add", row: null })} style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: 10, border: `1px solid ${t.g3}`, background: "transparent", color: t.g3, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Add</button>
        </div>
        <SectionLabel t={t} style={{ marginBottom: 10 }}>{loading ? "Loading…" : `Showing ${rows.length}`}</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((u) => (
            <div key={u.id} onClick={() => setDetail(u)} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: "11px 13px", display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${t.g3}28`, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color: t.g3, flexShrink: 0 }}>{initials(u.full_name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.full_name || u.email || "—"}</div>
                <div style={{ fontSize: 11, color: t.faint }}>{u.emp_id || "—"} · {u.department || "—"}</div>
                <div style={{ fontSize: 10.5, color: t.g3, fontWeight: 600, marginTop: 1 }}>{u.role_name || "—"}</div>
              </div>
              <StatusChip active={u.is_active} t={t} />
            </div>
          ))}
          {!loading && rows.length === 0 && <div style={{ fontSize: 12.5, color: t.faint, textAlign: "center", padding: "24px 0" }}>No users found.</div>}
        </div>
      </div>
      {detail && <DetailSheet title={detail.full_name || detail.email} accent="#8B6FCB" fields={fields(detail)} t={t} onClose={() => setDetail(null)} onEdit={() => setForm({ mode: "edit", row: detail })} onDisable={() => onDisable(detail)} busy={busy} />}
      {form && <FormSheet title={form.mode === "add" ? "Add User" : "Edit — " + (form.row.full_name || "User")} accent="#8B6FCB" schema={schema} initial={form.row ? fromRow(form.row) : null} t={t} onSave={onSave} onClose={() => setForm(null)} busy={busy} />}
      {toast && <Toast msg={toast.msg} error={toast.error} />}
    </div>
  );
}

// ── HR Analytics (metrics + real filter options) ────────────────────────────
const METRICS = [
  { l: "Avg Wellness", v: "73.4", u: "/ 100", i: "🌿", c: "#4F9D5B" },
  { l: "Productivity", v: "74.9%", u: "self-reported", i: "🎯", c: "#C36FA8" },
  { l: "Engagement", v: "71.7%", u: "Gallup Q12", i: "💬", c: "#4A90C4" },
  { l: "Absenteeism", v: "4.6d", u: "per month", i: "🗓", c: "#E0935C" },
  { l: "Sleep Score", v: "3.6", u: "out of 5", i: "🌙", c: "#8B6FCB" },
  { l: "Stress Score", v: "3.4", u: "lower is better", i: "🧘", c: "#C0604A" },
];
const DEPT_BARS = [{ l: "Eng", v: 76, c: "#4A90C4" }, { l: "Prod", v: 72, c: "#4F9D5B" }, { l: "Fin", v: 68, c: "#C99A3F" }, { l: "Mktg", v: 65, c: "#E0935C" }, { l: "Ops", v: 61, c: "#8B6FCB" }];
export function AdminAnalytics() {
  const t = useTokens();
  const dispatch = useDispatch();
  const companyId = getCompanyId();
  const depts = useSelector((s) => s.department.items) || [];
  const locs = useSelector((s) => s.location.items) || [];
  const [dept, setDept] = useState(""); const [loc, setLoc] = useState(""); const [age, setAge] = useState(""); const [gender, setGender] = useState("");
  useEffect(() => { if (companyId) { dispatch(fetchDepartments({ companyId, isActive: true })); dispatch(fetchLocations(companyId)).catch?.(() => {}); } }, [companyId]);
  const deptOpts = depts.length ? depts.map((d) => ({ label: d.name, value: d.id })) : DEPT_BARS.map((d) => d.l);
  const locOpts = locs.length ? locs.map((l) => ({ label: l.name || l.location_name || l, value: l.id || l })) : ["Bengaluru", "Mumbai", "Delhi", "Pune"];
  const Bars = ({ data }) => {
    const mx = Math.max(100, ...data.map((d) => d.v));
    return <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>{data.map((d) => (
      <div key={d.l} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
        <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}><div style={{ width: "100%", borderRadius: "6px 6px 3px 3px", minHeight: 4, height: `${(d.v / mx) * 100}%`, background: d.c, position: "relative" }}><span style={{ position: "absolute", top: -16, left: 0, right: 0, textAlign: "center", fontSize: 10, fontWeight: 800, color: d.c }}>{d.v}</span></div></div>
        <span style={{ fontSize: 9.5, color: t.muted, fontWeight: 600 }}>{d.l}</span>
      </div>))}</div>;
  };
  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>📊 HR Intelligence</div>
        <div style={{ fontSize: 12.5, color: t.muted }}>Population health · CXO metrics</div>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 12 }}>
          <Dropdown label="Department" value={dept} options={deptOpts} onChange={setDept} t={t} accent={t.g3} />
          <Dropdown label="Location" value={loc} options={locOpts} onChange={setLoc} t={t} accent={t.g3} />
          <Dropdown label="Age Band" value={age} options={["20-25", "26-30", "31-35", "36-40", "41-50", "50+"]} onChange={setAge} t={t} accent={t.g3} />
          <Dropdown label="Gender" value={gender} options={["Male", "Female", "Other"]} onChange={setGender} t={t} accent={t.g3} />
        </div>
        <div style={{ fontSize: 12, color: t.muted, fontWeight: 700, marginBottom: 14 }}><b style={{ color: t.g3 }}>240</b> employees selected</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          {METRICS.map((m) => (
            <div key={m.l} style={{ background: t.card, border: `1px solid ${m.c}44`, borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><span style={{ fontSize: 17 }}>{m.i}</span><span style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{m.l}</span></div>
              <div style={{ fontSize: 26, fontWeight: 800, color: m.c, letterSpacing: "-0.02em", lineHeight: 1 }}>{m.v}</div>
              <div style={{ fontSize: 10, color: t.faint, marginTop: 3 }}>{m.u}</div>
            </div>
          ))}
        </div>
        <SectionLabel t={t}>Wellness by department</SectionLabel>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 18, padding: "16px 15px 13px", marginBottom: 8 }}><Bars data={dept ? DEPT_BARS.filter((d) => d.l === dept || depts.find((x) => x.id === dept)?.name?.startsWith(d.l)) : DEPT_BARS} /></div>
        <div style={{ fontSize: 10.5, color: t.faint, lineHeight: 1.5 }}>Metric values are representative; connect the HR analytics endpoints to populate live figures.</div>
      </div>
    </div>
  );
}

// ── Profile ──────────────────────────────────────────────────────────────────
export function AdminProfile() {
  const t = useTokens();
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth.user) || {};
  const [name, setName] = useState(authUser.full_name || authUser.name || "");
  const [email, setEmail] = useState(authUser.email || "");
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      if (authUser.id) await dispatch(updateUser({ userId: authUser.id, user: { full_name: name, email } })).unwrap();
      setToast({ msg: "Profile saved ✓" });
    } catch (e) { setToast({ msg: String(e || "Save failed"), error: true }); }
    setTimeout(() => setToast(null), 2000); setBusy(false);
  };
  const inp = { width: "100%", padding: "13px 14px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>🧑‍💼 My Profile</div>
        <div style={{ fontSize: 12.5, color: t.muted }}>Manage your account</div>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, display: "flex", gap: 14, alignItems: "center", padding: 18, marginBottom: 16 }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: `linear-gradient(135deg, ${t.g1 || t.g3}, ${t.g3})`, display: "grid", placeItems: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>{initials(name || email)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{name || "—"}</div>
            <div style={{ fontSize: 12, color: t.muted }}>{email || "—"}</div>
            <span style={{ marginTop: 6, display: "inline-block", fontSize: 11, fontWeight: 700, color: t.g3, background: `${t.g3}1a`, borderRadius: 999, padding: "3px 10px" }}>Role: {authUser.role_name || authUser.role || "Admin"}</span>
          </div>
        </div>
        <SectionLabel t={t}>Account details</SectionLabel>
        <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, color: t.faint, fontWeight: 600, display: "block", marginBottom: 6 }}>Full Name</label><input value={name} onChange={(e) => setName(e.target.value)} style={inp} /></div>
        <div style={{ marginBottom: 18 }}><label style={{ fontSize: 11, color: t.faint, fontWeight: 600, display: "block", marginBottom: 6 }}>Email Address</label><input value={email} onChange={(e) => setEmail(e.target.value)} style={inp} /></div>
        <button onClick={save} disabled={busy} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${t.g1 || t.g3}, ${t.g3})`, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : "Save Changes"}</button>
      </div>
      {toast && <Toast msg={toast.msg} error={toast.error} />}
    </div>
  );
}
