// masterAdapters.jsx — per-section adapters + the generic MasterListScreen.
import {
  useEffect, useMemo, useState, useDispatch, useSelector, useTokens, getCompanyId,
  SectionLabel, StatusChip, Dropdown, DetailSheet, FormSheet, Toast, isActiveParam, STATUS_OPTS,
  fetchQuestions, createQuestion, updateQuestion, deleteQuestion,
  fetchThemes, createTheme, updateTheme, deleteTheme,
  fetchKpis, createKpi, updateKpi, deleteKpi,
  fetchChallenges, createChallenge, updateChallenge, deleteChallenge,
  fetchSessions,
  fetchAdminSuggestions, createAdminSuggestion, updateAdminSuggestion, deleteAdminSuggestion,
  fetchKpiSuggestionMappings, createKpiSuggestionMapping, updateKpiSuggestionMapping, deleteKpiSuggestionMapping,
  fetchDepartments, createDepartment, updateDepartment, deleteDepartment,
} from "./MasterFramework";

// each adapter is plain data + functions; thunks come from the slices.
export const ADAPTERS = {
  questions: {
    label: "Question Bank", sub: "Questions scoped to a company", icon: "❓", accent: "#C99A3F",
    slice: "question", needsThemes: true, needsKpis: true,
    fetch: fetchQuestions,
    buildParams: ({ companyId, applied, search }) => ({ companyId, limit: 200, search, themeKey: applied.theme || "", kpiKey: applied.kpi || "", isActive: isActiveParam(applied.status) }),
    filterDefs: [{ key: "theme", label: "Theme", kind: "theme" }, { key: "kpi", label: "KPI", kind: "kpi" }, { key: "status", label: "Status", kind: "status" }],
    card: (r) => ({ title: r.question_text, sub: `${r.question_code} · ${r.kpi_key}`, badges: [["Opt " + (r.options ? r.options.length : 0), "#4A90C4"], [r.reverse_code ? "Reverse" : "Normal", r.reverse_code ? "#C0604A" : "#6B7F5C"]], active: r.is_active }),
    detail: (r) => [["Question Code", r.question_code], ["Question", r.question_text], ["Theme", r.theme_key], ["KPI", r.kpi_key], ["Reverse Code", r.reverse_code ? "Yes" : "No"], ["Options", r.options ? r.options.length : 0], ["Status", r.is_active ? "Active" : "Inactive"]],
    form: [{ key: "question_code", label: "Question Code", type: "text" }, { key: "question_text", label: "Question", type: "text" }, { key: "theme_key", label: "Theme", type: "themeSelect" }, { key: "kpi_key", label: "KPI", type: "kpiSelect" }, { key: "reverse_code", label: "Reverse Code", type: "toggle" }, { key: "is_active", label: "Active", type: "toggle" }],
    fromRow: (r) => ({ question_code: r.question_code, question_text: r.question_text, theme_key: r.theme_key, kpi_key: r.kpi_key, reverse_code: r.reverse_code, is_active: r.is_active }),
    create: createQuestion, toCreate: ({ values, companyId, row }) => ({ companyId, question_code: values.question_code, question_text: values.question_text, theme_key: values.theme_key, kpi_key: values.kpi_key, reverse_code: !!values.reverse_code, is_active: !!values.is_active, options: (row && row.options) || [] }),
    update: updateQuestion, toUpdate: ({ values, row, companyId }) => ({ questionId: row.id, companyId, question: { question_code: values.question_code, question_text: values.question_text, theme_key: values.theme_key, kpi_key: values.kpi_key, reverse_code: !!values.reverse_code, is_active: !!values.is_active, options: row.options || [] } }),
    del: deleteQuestion, toDelete: (r) => r.id,
  },
  themes: {
    label: "Theme Master", sub: "Wellness program themes", icon: "🎨", accent: "#C36FA8",
    slice: "theme", fetch: fetchThemes,
    buildParams: ({ companyId, applied, search }) => ({ companyId, limit: 200, search, isActive: isActiveParam(applied.status) }),
    filterDefs: [{ key: "status", label: "Status", kind: "status" }],
    card: (r) => ({ title: r.theme_display_name, sub: r.description || `Updated ${(r.updated_at || "").slice(0, 10)}`, badges: r.duration_days ? [[r.duration_days + "d", "#4A90C4"]] : [], active: r.is_active }),
    detail: (r) => [["Theme Name", r.theme_display_name], ["Description", r.description], ["Duration (Days)", r.duration_days], ["Target Audience", r.target_audience], ["Status", r.is_active ? "Active" : "Inactive"], ["Created", (r.created_at || "").slice(0, 10)], ["Updated", (r.updated_at || "").slice(0, 10)]],
    form: [{ key: "theme_display_name", label: "Theme Name", type: "text" }, { key: "description", label: "Description", type: "text" }, { key: "duration_days", label: "Duration (Days)", type: "number" }, { key: "target_audience", label: "Target Audience", type: "text" }, { key: "is_active", label: "Active", type: "toggle" }],
    fromRow: (r) => ({ theme_display_name: r.theme_display_name, description: r.description, duration_days: r.duration_days || 0, target_audience: r.target_audience, is_active: r.is_active }),
    create: createTheme, toCreate: ({ values, companyId }) => ({ companyId, themeDisplayName: values.theme_display_name, description: values.description, durationDays: values.duration_days || null, targetAudience: values.target_audience }),
    update: updateTheme, toUpdate: ({ values, row, companyId }) => ({ companyId, themeKey: row.theme_key, themeDisplayName: values.theme_display_name, description: values.description, durationDays: values.duration_days || null, targetAudience: values.target_audience, isActive: !!values.is_active }),
    del: deleteTheme, toDelete: (r) => r.theme_key,
  },
  kpis: {
    label: "KPI Master", sub: "KPIs via the admin flow", icon: "📈", accent: "#4F9D5B",
    slice: "kpi", needsThemes: true, fetch: fetchKpis,
    buildParams: ({ companyId, applied, search }) => ({ companyId, limit: 200, search, themeKey: applied.theme || "", isActive: isActiveParam(applied.status) }),
    filterDefs: [{ key: "theme", label: "Theme", kind: "theme" }, { key: "status", label: "Status", kind: "status" }],
    card: (r) => ({ title: r.display_name, sub: r.theme_key, badges: [["WI " + (r.wi_weight ?? "—"), "#4F9D5B"], [`${(r.start_date || "").slice(0, 10)}→${(r.end_date || "").slice(0, 10)}`, "#4A90C4"]], active: r.is_active }),
    detail: (r) => [["KPI Name", r.display_name], ["Theme", r.theme_key], ["Domain Category", r.domain_category], ["WI Weight", r.wi_weight], ["Start Date", (r.start_date || "").slice(0, 10)], ["End Date", (r.end_date || "").slice(0, 10)], ["Status", r.is_active ? "Active" : "Inactive"]],
    form: [{ key: "display_name", label: "KPI Name", type: "text" }, { key: "theme_key", label: "Theme", type: "themeSelect" }, { key: "domain_category", label: "Domain Category", type: "text" }, { key: "wi_weight", label: "WI Weight", type: "number" }, { key: "start_date", label: "Start Date", type: "date" }, { key: "end_date", label: "End Date", type: "date" }, { key: "is_active", label: "Active", type: "toggle" }],
    fromRow: (r) => ({ display_name: r.display_name, theme_key: r.theme_key, domain_category: r.domain_category, wi_weight: r.wi_weight || 0, start_date: (r.start_date || "").slice(0, 10), end_date: (r.end_date || "").slice(0, 10), is_active: r.is_active }),
    create: createKpi, toCreate: ({ values, companyId }) => ({ companyId, displayName: values.display_name, themeKey: values.theme_key, domainCategory: values.domain_category, wiWeight: values.wi_weight || null, startDate: values.start_date, endDate: values.end_date }),
    update: updateKpi, toUpdate: ({ values, row, companyId }) => ({ companyId, kpiKey: row.kpi_key, displayName: values.display_name, themeKey: values.theme_key, domainCategory: values.domain_category, wiWeight: values.wi_weight || null, startDate: values.start_date, endDate: values.end_date, isActive: !!values.is_active }),
    del: deleteKpi, toDelete: (r) => r.kpi_key,
  },
  challenges: {
    label: "Challenge Master", sub: "Challenges with KPI mappings", icon: "🎯", accent: "#E0935C",
    slice: "challenge", needsKpis: true, fetch: fetchChallenges,
    buildParams: ({ companyId, applied, search }) => ({ companyId, limit: 200, kpiKey: applied.kpi || "", isActive: applied.status ? isActiveParam(applied.status) : undefined }),
    filterDefs: [{ key: "kpi", label: "KPI", kind: "kpi" }, { key: "status", label: "Status", kind: "status" }, { key: "type", label: "Type", kind: "value", get: (r) => r.challenge_type }],
    card: (r) => ({ title: r.name, sub: r.description, badges: [[r.challenge_type || "—", "#8B6FCB"], ["XP " + r.xp_reward, "#C99A3F"], [r.is_daily ? "Daily" : "—", "#4F9D5B"]], active: r.is_active }),
    detail: (r) => [["Name", r.name], ["Description", r.description], ["Type", r.challenge_type], ["Target", r.target_value], ["XP Reward", r.xp_reward], ["Daily", r.is_daily ? "Yes" : "No"], ["Start Date", (r.start_date || "").slice(0, 10)], ["End Date", (r.end_date || "").slice(0, 10)], ["Status", r.is_active ? "Active" : "Inactive"]],
    form: [{ key: "name", label: "Challenge Name", type: "text" }, { key: "challenge_type", label: "Type", type: "select", options: ["Daily", "Monthly", "Counter", "Toggle"] }, { key: "description", label: "Description", type: "text" }, { key: "target_value", label: "Target", type: "number" }, { key: "xp_reward", label: "XP Reward", type: "number" }, { key: "is_daily", label: "Daily", type: "toggle" }],
    fromRow: (r) => ({ name: r.name, challenge_type: r.challenge_type, description: r.description, target_value: r.target_value, xp_reward: r.xp_reward, is_daily: r.is_daily }),
    create: createChallenge, toCreate: ({ values, companyId }) => ({ companyId, name: values.name, challengeType: values.challenge_type, description: values.description, targetValue: values.target_value, xpReward: values.xp_reward, icon: "", isDaily: !!values.is_daily, kpiMappings: [] }),
    update: updateChallenge, toUpdate: ({ values, row, companyId }) => ({ companyId, challengeKey: row.challenge_key, name: values.name, challengeType: values.challenge_type, description: values.description, targetValue: values.target_value, xpReward: values.xp_reward, icon: row.icon || "", isDaily: !!values.is_daily, isActive: row.is_active }),
    del: deleteChallenge, toDelete: (r) => r.challenge_key,
  },
  sessions: {
    label: "Sessions Listing", sub: "Company KPI session windows", icon: "🗓", accent: "#4A90C4",
    slice: "session", itemsKey: "sessions", fetch: fetchSessions,
    buildParams: ({ companyId }) => ({ companyId }),
    filterDefs: [{ key: "status", label: "Status", kind: "value", get: (r) => (r.is_active ? "active" : "inactive"), options: STATUS_OPTS }],
    card: (r) => ({ title: r.title, sub: r.description, badges: [["Created " + (r.created_at || "").slice(0, 10), "#4A90C4"]], active: r.is_active }),
    detail: (r) => [["Title", r.title], ["Description", r.description], ["Active", r.is_active ? "Yes" : "No"], ["Created", (r.created_at || "").slice(0, 16).replace("T", " ")]],
    readOnly: true,
  },
  suggestions: {
    label: "Suggestion Library", sub: "Live suggestion records", icon: "💡", accent: "#C99A3F",
    slice: "adminSuggestion", fetch: fetchAdminSuggestions,
    buildParams: ({ applied, search }) => ({ limit: 200, search, suggestion_type: applied.type || "", is_active: isActiveParam(applied.status) }),
    filterDefs: [{ key: "type", label: "Type", kind: "value", get: (r) => r.suggestion_type, server: "suggestion_type" }, { key: "dosha", label: "Dosha", kind: "value", get: (r) => r.dosha_type }, { key: "difficulty", label: "Difficulty", kind: "value", get: (r) => r.difficulty }, { key: "status", label: "Status", kind: "status" }],
    card: (r) => ({ title: r.title, sub: r.description, badges: [[r.suggestion_type || "—", "#B96B47"], [r.dosha_type, "#4A90C4"], [r.difficulty, r.difficulty === "easy" ? "#4F9D5B" : "#C99A3F"]], active: r.is_active }),
    detail: (r) => [["Type", r.suggestion_type], ["Title", r.title], ["Description", r.description], ["Dosha", r.dosha_type], ["Difficulty", r.difficulty], ["Duration (min)", r.duration_mins], ["URL", r.url], ["Status", r.is_active ? "Active" : "Inactive"]],
    form: [{ key: "suggestion_type", label: "Type", type: "select", options: ["Aahar", "Vihar", "Nidra", "Achar"] }, { key: "title", label: "Title", type: "text" }, { key: "description", label: "Description", type: "text" }, { key: "dosha_type", label: "Dosha", type: "select", options: [{ label: "All", value: "all" }, { label: "Vata", value: "vata" }, { label: "Pitta", value: "pitta" }, { label: "Kapha", value: "kapha" }] }, { key: "difficulty", label: "Difficulty", type: "select", options: [{ label: "Easy", value: "easy" }, { label: "Moderate", value: "moderate" }, { label: "Hard", value: "hard" }] }, { key: "duration_mins", label: "Duration (min)", type: "number" }, { key: "url", label: "URL", type: "text" }, { key: "is_active", label: "Active", type: "toggle" }],
    fromRow: (r) => ({ suggestion_type: r.suggestion_type, title: r.title, description: r.description, dosha_type: r.dosha_type, difficulty: r.difficulty, duration_mins: r.duration_mins || 0, url: r.url, is_active: r.is_active }),
    create: createAdminSuggestion, toCreate: ({ values }) => ({ suggestion_type: values.suggestion_type, title: values.title, description: values.description, dosha_type: values.dosha_type, difficulty: values.difficulty, duration_mins: values.duration_mins || 0, url: values.url, is_active: !!values.is_active }),
    update: updateAdminSuggestion, toUpdate: ({ values, row }) => ({ suggestionId: row.id, suggestion: { suggestion_type: values.suggestion_type, title: values.title, description: values.description, dosha_type: values.dosha_type, difficulty: values.difficulty, duration_mins: values.duration_mins || 0, url: values.url, is_active: !!values.is_active } }),
    del: deleteAdminSuggestion, toDelete: (r) => r.id,
  },
  mapping: {
    label: "KPI Suggestion Mapping", sub: "KPI-to-suggestion trigger rules", icon: "🔗", accent: "#3AA8A0",
    slice: "kpiSuggestionMapping", needsKpis: true, fetch: fetchKpiSuggestionMappings,
    buildParams: ({ applied }) => ({ limit: 200, kpi_key: applied.kpi || "", trigger_mode: applied.trigger || "", is_active: isActiveParam(applied.status) }),
    filterDefs: [{ key: "kpi", label: "KPI", kind: "kpi" }, { key: "trigger", label: "Trigger", kind: "value", get: (r) => r.trigger_mode, server: "trigger_mode" }, { key: "status", label: "Status", kind: "status" }],
    card: (r) => ({ title: r.kpi_name || r.kpi_key, sub: r.question_text || r.question_code, badges: [[r.trigger_mode || "—", "#3AA8A0"], ["P" + r.priority, "#C99A3F"]], active: r.is_active }),
    detail: (r) => [["KPI", r.kpi_name || r.kpi_key], ["Trigger Mode", r.trigger_mode], ["Risk Level", r.risk_level], ["Question", r.question_text || r.question_code], ["Suggestion", r.suggestion_title], ["Priority", r.priority], ["Status", r.is_active ? "Active" : "Inactive"]],
    form: [{ key: "kpi_key", label: "KPI", type: "kpiSelect" }, { key: "trigger_mode", label: "Trigger Mode", type: "select", options: [{ label: "Question score", value: "question_score" }, { label: "KPI score", value: "kpi_score" }] }, { key: "suggestion_id", label: "Suggestion ID", type: "text" }, { key: "priority", label: "Priority", type: "number" }, { key: "is_active", label: "Active", type: "toggle" }],
    fromRow: (r) => ({ kpi_key: r.kpi_key, trigger_mode: r.trigger_mode, suggestion_id: r.suggestion_id, priority: r.priority, is_active: r.is_active }),
    create: createKpiSuggestionMapping, toCreate: ({ values }) => ({ kpi_key: values.kpi_key, trigger_mode: values.trigger_mode, suggestion_id: values.suggestion_id, priority: values.priority || 1, is_active: !!values.is_active }),
    update: updateKpiSuggestionMapping, toUpdate: ({ values, row }) => ({ mappingId: row.id, mapping: { kpi_key: values.kpi_key, trigger_mode: values.trigger_mode, suggestion_id: values.suggestion_id, priority: values.priority || 1, is_active: !!values.is_active } }),
    del: deleteKpiSuggestionMapping, toDelete: (r) => r.id,
  },
  departments: {
    label: "Departments", sub: "Company department structure", icon: "🏢", accent: "#8B6FCB",
    slice: "department", fetch: fetchDepartments,
    buildParams: ({ companyId, applied, search }) => ({ companyId, search, isActive: isActiveParam(applied.status) }),
    filterDefs: [{ key: "status", label: "Status", kind: "status" }],
    card: (r) => ({ title: r.name, sub: r.description, badges: [], active: r.is_active }),
    detail: (r) => [["Department", r.name], ["Description", r.description], ["Status", r.is_active ? "Active" : "Inactive"]],
    form: [{ key: "name", label: "Department Name", type: "text" }, { key: "description", label: "Description", type: "text" }],
    fromRow: (r) => ({ name: r.name, description: r.description }),
    create: createDepartment, toCreate: ({ values, companyId }) => ({ name: values.name, description: values.description, company_id: companyId }),
    update: updateDepartment, toUpdate: ({ values, row, companyId }) => ({ id: row.id, company_id: companyId, name: values.name, description: values.description }),
    del: deleteDepartment, toDelete: (r, companyId) => ({ id: r.id, company_id: companyId }),
  },
};
export const MANAGE_ORDER = ["questions", "themes", "kpis", "challenges", "sessions", "suggestions", "mapping", "departments"];

// ── Manage hub ──────────────────────────────────────────────────────────────
export function ManageHub({ onOpen }) {
  const t = useTokens();
  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>🗂 Manage</div>
        <div style={{ fontSize: 12.5, color: t.muted }}>All masters & configuration</div>
      </div>
      <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {MANAGE_ORDER.map((k) => {
          const a = ADAPTERS[k];
          return (
            <div key={k} onClick={() => onOpen(k)} style={{ background: t.card, border: `1px solid ${a.accent}4d`, borderRadius: 16, padding: 14, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: `${a.accent}28`, display: "grid", placeItems: "center", fontSize: 19, marginBottom: 9 }}>{a.icon}</div>
                <span style={{ color: t.faint, fontSize: 18 }}>›</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{a.label}</div>
              <div style={{ fontSize: 10.5, color: t.faint, marginTop: 2 }}>{a.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Generic master list (real API) ──────────────────────────────────────────
export function MasterListScreen({ sectionKey, onBack }) {
  const a = ADAPTERS[sectionKey];
  const t = useTokens();
  const dispatch = useDispatch();
  const companyId = getCompanyId();

  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({});
  const [applied, setApplied] = useState({});
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  const sliceState = useSelector((s) => s[a.slice]) || {};
  const items = sliceState[a.itemsKey || "items"] || [];
  const loading = sliceState.listLoading || sliceState.usersLoading || false;

  const themeItems = useSelector((s) => s.theme.items) || [];
  const kpiItems = useSelector((s) => s.kpi.items) || [];

  // load option lists once if needed
  useEffect(() => { if (a.needsThemes && themeItems.length === 0) dispatch(fetchThemes({ companyId, limit: 200 })); }, [a.needsThemes]);
  useEffect(() => { if (a.needsKpis && kpiItems.length === 0) dispatch(fetchKpis({ companyId, limit: 200 })); }, [a.needsKpis]);

  // (re)fetch on applied filter / search change
  useEffect(() => {
    dispatch(a.fetch(a.buildParams({ companyId, applied, search: q })));
    // eslint-disable-next-line
  }, [sectionKey, applied, q]);

  const reload = () => dispatch(a.fetch(a.buildParams({ companyId, applied, search: q })));
  const flash = (msg, error) => { setToast({ msg, error }); setTimeout(() => setToast(null), 2000); };

  // client-side filters for defs not handled by the server
  const clientFilter = (r) => {
    for (const def of a.filterDefs || []) {
      if (def.kind === "value" && !def.server && applied[def.key]) {
        if (def.get(r) !== applied[def.key]) return false;
      }
    }
    return true;
  };
  const rows = items.filter(clientFilter);

  const optionsFor = (def) => {
    if (def.kind === "theme") return themeItems.map((x) => ({ label: x.theme_display_name, value: x.theme_key }));
    if (def.kind === "kpi") return kpiItems.map((x) => ({ label: x.display_name, value: x.kpi_key }));
    if (def.kind === "status") return STATUS_OPTS;
    if (def.options) return def.options;
    return [...new Set(items.map(def.get).filter(Boolean))];
  };
  const setFilter = (k, v) => { const nd = { ...draft, [k]: v }; setDraft(nd); if (!a.apply) setApplied(nd); };

  const formSchema = (a.form || []).map((f) => {
    if (f.type === "themeSelect") return { ...f, type: "select", options: themeItems.map((x) => ({ label: x.theme_display_name, value: x.theme_key })) };
    if (f.type === "kpiSelect") return { ...f, type: "select", options: kpiItems.map((x) => ({ label: x.display_name, value: x.kpi_key })) };
    return f;
  });

  const onSave = async (values) => {
    setBusy(true);
    try {
      if (form.mode === "add") await dispatch(a.create(a.toCreate({ values, companyId, row: null }))).unwrap();
      else await dispatch(a.update(a.toUpdate({ values, row: form.row, companyId }))).unwrap();
      flash(form.mode === "add" ? "Created ✓" : "Saved ✓");
      setForm(null); setDetail(null); reload();
    } catch (e) { flash(String(e || "Save failed"), true); }
    setBusy(false);
  };
  const onDisable = async (row) => {
    setBusy(true);
    try { await dispatch(a.del(a.toDelete(row, companyId))).unwrap(); flash("Removed ✓"); setDetail(null); reload(); }
    catch (e) { flash(String(e || "Delete failed"), true); }
    setBusy(false);
  };

  return (
    <div style={{ paddingBottom: 18 }}>
      <div style={{ padding: "8px 16px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.muted, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>{a.icon} {a.label}</div>
          <div style={{ fontSize: 12, color: t.muted }}>{a.sub}</div>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 11 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "10px 13px" }}>
            <span style={{ fontSize: 14 }}>🔍</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", color: t.text, fontSize: 13, fontFamily: "inherit" }} />
          </div>
          {!a.readOnly && <button onClick={() => setForm({ mode: "add", row: null })} style={{ padding: "0 14px", borderRadius: 11, border: "none", background: `linear-gradient(135deg, ${a.accent}, ${a.accent}cc)`, color: "#fff", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Add</button>}
        </div>

        {(a.filterDefs || []).length > 0 && (
          <>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: a.apply ? 8 : 13 }}>
              {a.filterDefs.map((def) => <Dropdown key={def.key} label={def.label} value={draft[def.key]} options={optionsFor(def)} onChange={(v) => setFilter(def.key, v)} t={t} accent={a.accent} />)}
            </div>
            {a.apply && (
              <div style={{ display: "flex", gap: 8, marginBottom: 13 }}>
                <button onClick={() => setApplied(draft)} style={{ flex: 1, padding: 9, borderRadius: 10, border: "none", background: `${a.accent}1a`, color: a.accent, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Apply Filters</button>
                <button onClick={() => { setDraft({}); setApplied({}); }} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.inset, color: t.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Reset</button>
              </div>
            )}
          </>
        )}

        <SectionLabel t={t} style={{ marginBottom: 10 }}>{loading ? "Loading…" : `Showing ${rows.length}`}</SectionLabel>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((r, i) => {
            const c = a.card(r);
            return (
              <div key={r.id || i} onClick={() => setDetail(r)} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 15, padding: "12px 14px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: t.faint, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.sub}</div>
                  </div>
                  <StatusChip active={c.active} t={t} />
                </div>
                {c.badges && c.badges.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {c.badges.map(([label, col], bi) => <span key={bi} style={{ fontSize: 10, fontWeight: 800, borderRadius: 6, padding: "3px 8px", background: `${col}24`, color: col }}>{label}</span>)}
                  </div>
                )}
              </div>
            );
          })}
          {!loading && rows.length === 0 && <div style={{ fontSize: 12.5, color: t.faint, textAlign: "center", padding: "24px 0" }}>No records found.</div>}
        </div>
      </div>

      {detail && <DetailSheet title={a.card(detail).title} accent={a.accent} fields={a.detail(detail)} t={t} onClose={() => setDetail(null)} onEdit={a.readOnly ? null : () => setForm({ mode: "edit", row: detail })} onDisable={a.readOnly ? null : () => onDisable(detail)} busy={busy} />}
      {form && <FormSheet title={(form.mode === "add" ? "Add — " : "Edit — ") + a.label} accent={a.accent} schema={formSchema} initial={form.row ? a.fromRow(form.row) : null} t={t} onSave={onSave} onClose={() => setForm(null)} busy={busy} />}
      {toast && <Toast msg={toast.msg} error={toast.error} />}
    </div>
  );
}
