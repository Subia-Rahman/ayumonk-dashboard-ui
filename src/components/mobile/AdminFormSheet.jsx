import { useState } from "react";
import { C } from "./palette";

// Reusable mobile bottom-sheet form layer for the Super Admin masters.
// Mirrors the desktop Add/Edit forms as native mobile sheets so tapping
// "Add"/"Edit" no longer bounces to the desktop page.
//
// Usage in a list page:
//   const [form, setForm] = useState(null); // null | {} (add) | row (edit)
//   ...<button onClick={() => setForm({})}>+ Add</button>
//   {form !== null && (
//     <AdminFormSheet
//       kind="kpis"
//       initial={form.id ? form : null}
//       onClose={() => setForm(null)}
//       onSave={(values) => { dispatch(form.id ? updateKpi({...}) : createKpi(values)); setForm(null); }}
//     />
//   )}

const OPTS_COMPANY = ["Ally Wired Soft Solutions", "Reliance Industries"];
const OPTS_THEME = ["Friends & Feelings", "Unplug to Recharge", "Breathe & Shine", "Move Like Nature", "Eat the Rainbow"];
const OPTS_KPI = ["Cognitive Focus", "Digital Wellness", "Emotional Well-being", "Physical Vitality", "Social Health"];

// [key, label, type, options?]   type: text|number|date|textarea|select|status|toggle
export const FORM_SPECS = {
  questions: [
    ["company", "Company", "select", OPTS_COMPANY], ["code", "Question Code", "text"], ["q", "Question", "textarea"],
    ["theme", "Theme", "select", OPTS_THEME], ["kpi", "KPI", "select", OPTS_KPI],
    ["reverse", "Reverse Code", "toggle"], ["options", "Options", "number"], ["status", "Status", "status"],
  ],
  themes: [
    ["company", "Company", "select", OPTS_COMPANY], ["name", "Theme Name", "text"], ["desc", "Description", "textarea"],
    ["duration", "Duration (Days)", "number"], ["audience", "Target Audience", "text"], ["status", "Status", "status"],
  ],
  kpis: [
    ["company", "Company", "select", OPTS_COMPANY], ["name", "KPI Name", "text"], ["theme", "Theme", "select", OPTS_THEME],
    ["domain", "Domain Category", "text"], ["weight", "WI Weight", "number"],
    ["start", "Start Date", "date"], ["end", "End Date", "date"], ["status", "Status", "status"],
  ],
  suggestions: [
    ["type", "Type", "select", ["Aahar", "Vihar", "Aushadh"]], ["title", "Title", "text"], ["desc", "Description", "textarea"],
    ["dosha", "Dosha", "select", ["All", "Vata", "Pitta", "Kapha"]], ["difficulty", "Difficulty", "select", ["Easy", "Moderate", "Hard"]],
    ["duration", "Duration (mins)", "number"], ["url", "URL", "text"], ["status", "Status", "status"],
  ],
  "company-data": [
    ["company_name", "Company Name", "text"], ["industry", "Industry", "text"], ["company_size", "Size", "select", ["Small", "Medium", "Large"]],
    ["email", "Email", "text"], ["phone", "Phone", "text"], ["location", "Location", "text"],
    ["no_of_employees", "Employees", "number"], ["status", "Status", "status"],
  ],
  "company-users": [
    ["full_name", "Full Name", "text"], ["employee_id", "Employee ID", "text"], ["department", "Department", "text"],
    ["gender", "Gender", "select", ["male", "female", "other"]], ["company", "Company", "select", OPTS_COMPANY],
    ["role", "Role", "select", ["Employee", "HR Manager", "Company Admin", "CXO"]], ["email", "Email", "text"], ["status", "Status", "status"],
  ],
  sessions: [
    ["title", "Title", "text"], ["description", "Description", "textarea"], ["company", "Company", "select", OPTS_COMPANY], ["active", "Active", "toggle"],
  ],
  policies: [
    ["name", "Name", "text"], ["company", "Company", "select", OPTS_COMPANY], ["module", "Module", "text"],
    ["scope", "Scope", "select", ["global", "tenant", "department", "self"]], ["effect", "Effect", "select", ["allow", "deny"]],
    ["active", "Policy is active", "toggle"], ["desc", "Description", "textarea"],
    ["conditions", "Conditions (JSON object)", "textarea"], ["conditionJson", "Condition JSON (JSON object)", "textarea"],
  ],
  permissions: [
    ["name", "Name", "text"], ["codename", "Codename", "text"], ["module", "Module", "text"], ["action", "Action", "select", ["Read", "Create", "Update", "Delete"]], ["resource", "Resource", "text"],
  ],
  menus: [
    ["name", "Name", "text"], ["slug", "Slug", "text"], ["path", "Path", "text"], ["order", "Order", "number"], ["status", "Status", "status"],
  ],
};

const CH_TYPES = ["Counter", "Toggle", "Monthly", "Daily", "Streak"];
const CH_ICONS = [["🏆", "Trophy"], ["🎯", "Target"], ["🔥", "Streak"], ["⚡", "Energy"], ["⭐", "Star"], ["💪", "Strength"], ["🚀", "Boost"], ["🏅", "Winner"], ["🎉", "Celebrate"], ["🧘", "Focus"], ["💧", "Hydration"], ["🌿", "Wellness"]];

const card = C.card, bd = C.border, t1 = "#1F1E1D", t2 = C.muted, primary = C.g3, primaryD = C.g1, soft = `${C.g3}1f`, danger = "#d85a30";
const inputStyle = { width: "100%", minHeight: 48, border: `1px solid ${bd}`, borderRadius: 8, background: card, padding: "0 13px", fontSize: 13.5, fontFamily: "inherit", color: t1, outline: "none" };

function Sheet({ title, onClose, children, footer }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(20,30,16,0.45)" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: card, borderRadius: "22px 22px 0 0", maxHeight: "90%", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 38, height: 4.5, borderRadius: 999, background: bd, margin: "10px auto 4px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 18px 14px", borderBottom: `1px solid ${bd}` }}>
          <span style={{ fontSize: 15.5, fontWeight: 700, color: t1 }}>{title}</span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${bd}`, background: C.bg, color: t2, fontSize: 13, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "16px 18px", overflowY: "auto" }}>{children}</div>
        <div style={{ padding: "12px 18px 26px", borderTop: `1px solid ${bd}` }}>{footer}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: t2, display: "block", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}
function Switch({ on, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ width: 42, height: 25, borderRadius: 999, border: "none", background: on ? primary : bd, cursor: "pointer", position: "relative", padding: 0 }}>
      <span style={{ position: "absolute", top: 3, left: 3, width: 19, height: 19, borderRadius: 999, background: "#fff", transition: "transform .2s", transform: on ? "translateX(17px)" : "none", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
    </button>
  );
}
const SaveBtn = ({ onClick }) => <button type="button" onClick={onClick} style={{ width: "100%", border: "none", background: primary, color: "#fff", borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>💾 Save</button>;

function GenericForm({ title, spec, initial, onClose, onSave }) {
  const blank = {}; spec.forEach(([k, , type]) => { blank[k] = type === "toggle" ? false : type === "number" ? 0 : type === "status" ? "Active" : ""; });
  const [v, setV] = useState(() => ({ ...blank, ...(initial || {}) }));
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  return (
    <Sheet title={title} onClose={onClose} footer={<SaveBtn onClick={() => onSave(v)} />}>
      {spec.map(([k, label, type, opts]) => (
        <Field key={k} label={label}>
          {type === "text" && <input style={inputStyle} value={v[k]} onChange={(e) => set(k, e.target.value)} placeholder={label} />}
          {type === "number" && <input style={inputStyle} type="number" value={v[k]} onChange={(e) => set(k, e.target.value)} />}
          {type === "date" && <input style={inputStyle} type="date" value={v[k]} onChange={(e) => set(k, e.target.value)} />}
          {type === "textarea" && <textarea style={{ ...inputStyle, height: 78, padding: "11px 13px", resize: "none" }} value={v[k]} onChange={(e) => set(k, e.target.value)} placeholder={label} />}
          {type === "select" && <select style={inputStyle} value={v[k]} onChange={(e) => set(k, e.target.value)}><option value="">Select…</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>}
          {type === "status" && <div style={{ display: "flex", gap: 8 }}>{["Active", "Inactive"].map((s) => <button key={s} type="button" onClick={() => set(k, s)} style={{ border: `1px solid ${v[k] === s ? C.g3 : bd}`, background: v[k] === s ? soft : card, color: v[k] === s ? primaryD : t2, borderRadius: 999, padding: "8px 15px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>)}</div>}
          {type === "toggle" && <Switch on={!!v[k]} onClick={() => set(k, !v[k])} />}
        </Field>
      ))}
    </Sheet>
  );
}

function ChallengeForm({ initial, onClose, onSave }) {
  const [v, setV] = useState(() => ({ name: "", type: "", desc: "", target: 0, xp: 0, icon: "🏆", custom: "", daily: true, ...(initial || {}) }));
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  const [maps, setMaps] = useState([{ kpi: "", start: "", end: "" }]);
  const setMap = (i, k, x) => setMaps((m) => m.map((r, j) => (j === i ? { ...r, [k]: x } : r)));
  return (
    <Sheet title={(initial ? "Edit" : "Add") + " Challenge"} onClose={onClose} footer={<SaveBtn onClick={() => onSave({ ...v, mappings: maps })} />}>
      <Field label="Challenge Name"><input style={inputStyle} value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Challenge name" /></Field>
      <Field label="Challenge Type"><select style={inputStyle} value={v.type} onChange={(e) => set("type", e.target.value)}><option value="">Select type…</option>{CH_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Description"><textarea style={{ ...inputStyle, height: 80, padding: "11px 13px", resize: "none" }} value={v.desc} onChange={(e) => set("desc", e.target.value)} placeholder="Description" /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Target Value"><input style={inputStyle} type="number" value={v.target} onChange={(e) => set("target", e.target.value)} /></Field>
        <Field label="XP Reward"><input style={inputStyle} type="number" value={v.xp} onChange={(e) => set("xp", e.target.value)} /></Field>
      </div>
      <Field label="Challenge Icon">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
          {CH_ICONS.map(([em, lbl]) => {
            const on = v.icon === em && !v.custom;
            return (
              <button key={lbl} type="button" onClick={() => { set("icon", em); set("custom", ""); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, border: `1px solid ${on ? C.g3 : bd}`, background: on ? soft : card, borderRadius: 11, padding: "10px 4px", cursor: "pointer", fontFamily: "inherit", fontSize: 9, color: on ? primaryD : t2, fontWeight: 600 }}>
                <span style={{ fontSize: 20 }}>{em}</span><span>{lbl}</span>
              </button>
            );
          })}
        </div>
        <input style={{ ...inputStyle, marginTop: 8 }} value={v.custom} onChange={(e) => set("custom", e.target.value)} placeholder="Custom icon / emoji" />
      </Field>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 16px" }}>
        <Switch on={v.daily} onClick={() => set("daily", !v.daily)} />
        <span style={{ fontSize: 13, fontWeight: 600, color: t1 }}>Daily Challenge</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: t1 }}>KPI Mappings</span>
        <button type="button" onClick={() => setMaps((m) => [...m, { kpi: "", start: "", end: "" }])} style={{ border: "none", background: primary, color: "#fff", borderRadius: 9, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Add Mapping</button>
      </div>
      {maps.map((m, i) => (
        <div key={i} style={{ background: card, border: `1px solid ${bd}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: t2 }}>Mapping {i + 1}</span>
            {maps.length > 1 && <button type="button" onClick={() => setMaps((x) => x.filter((_, j) => j !== i))} style={{ border: "none", background: "transparent", color: danger, cursor: "pointer", fontSize: 14 }}>🗑</button>}
          </div>
          <Field label="KPI"><select style={inputStyle} value={m.kpi} onChange={(e) => setMap(i, "kpi", e.target.value)}><option value="">Select KPI…</option>{OPTS_KPI.map((k) => <option key={k}>{k}</option>)}</select></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Start Date"><input style={inputStyle} type="date" value={m.start} onChange={(e) => setMap(i, "start", e.target.value)} /></Field>
            <Field label="End Date"><input style={inputStyle} type="date" value={m.end} onChange={(e) => setMap(i, "end", e.target.value)} /></Field>
          </div>
        </div>
      ))}
    </Sheet>
  );
}

export default function AdminFormSheet({ kind, initial, onClose, onSave, addLabel }) {
  if (kind === "challenges") return <ChallengeForm initial={initial} onClose={onClose} onSave={onSave} />;
  if (kind === "questions") return <QuestionForm initial={initial} onClose={onClose} onSave={onSave} />;
  if (kind === "mapping" || kind === "kpi-suggestion-mapping") return <MappingForm initial={initial} onClose={onClose} onSave={onSave} />;
  const spec = FORM_SPECS[kind] || [];
  const title = initial ? "Edit" : (addLabel || "Add");
  return <GenericForm title={title} spec={spec} initial={initial} onClose={onClose} onSave={onSave} />;
}

// ── Add/Edit Question — with options repeater ────────────────────────────────
function QuestionForm({ initial, onClose, onSave }) {
  const [v, setV] = useState(() => ({ company: "", theme: "", kpi: "", code: "", reverse: false, q: "", ...(initial || {}) }));
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  const [opts, setOpts] = useState([{ text: "", score: 1 }, { text: "", score: 2 }]);
  const setOpt = (i, k, x) => setOpts((o) => o.map((r, j) => (j === i ? { ...r, [k]: x } : r)));
  return (
    <Sheet title={(initial ? "Edit" : "Add") + " Question"} onClose={onClose} footer={<SaveBtn onClick={() => onSave({ ...v, options: opts })} />}>
      <Field label="Company"><select style={inputStyle} value={v.company} onChange={(e) => set("company", e.target.value)}><option value="">Select…</option>{OPTS_COMPANY.map((o) => <option key={o}>{o}</option>)}</select></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Theme"><select style={inputStyle} value={v.theme} onChange={(e) => set("theme", e.target.value)}><option value="">Select…</option>{OPTS_THEME.map((o) => <option key={o}>{o}</option>)}</select></Field>
        <Field label="KPI"><select style={inputStyle} value={v.kpi} onChange={(e) => set("kpi", e.target.value)}><option value="">Select…</option>{OPTS_KPI.map((o) => <option key={o}>{o}</option>)}</select></Field>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1 }}><Field label="Question Code"><input style={inputStyle} value={v.code} onChange={(e) => set("code", e.target.value)} placeholder="Question Code" /></Field></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 14 }}><Switch on={v.reverse} onClick={() => set("reverse", !v.reverse)} /><span style={{ fontSize: 12, color: t2, whiteSpace: "nowrap" }}>Reverse coded</span></div>
      </div>
      <Field label="Question Text"><textarea style={{ ...inputStyle, height: 70, padding: "11px 13px", resize: "none" }} value={v.q} onChange={(e) => set("q", e.target.value)} placeholder="Question Text" /></Field>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0 10px" }}>
        <div><div style={{ fontSize: 13, fontWeight: 800, color: t1 }}>Question Options</div><div style={{ fontSize: 10.5, color: t2 }}>At least two are required.</div></div>
        <button type="button" onClick={() => setOpts((o) => [...o, { text: "", score: o.length + 1 }])} style={{ border: "none", background: primary, color: "#fff", borderRadius: 9, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Add Option</button>
      </div>
      {opts.map((o, i) => (
        <div key={i} style={{ background: card, border: `1px solid ${bd}`, borderRadius: 12, padding: 14, marginBottom: 9, display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t2, marginBottom: 5 }}>Option {i + 1}</div>
            <input style={inputStyle} value={o.text} onChange={(e) => setOpt(i, "text", e.target.value)} placeholder="Option Text" />
          </div>
          <div style={{ width: 62 }}><div style={{ fontSize: 10, color: t2, marginBottom: 5 }}>Score</div><input style={{ ...inputStyle, padding: "0 9px" }} type="number" value={o.score} onChange={(e) => setOpt(i, "score", e.target.value)} /></div>
          {opts.length > 2 && <button type="button" onClick={() => setOpts((x) => x.filter((_, j) => j !== i))} style={{ border: "none", background: "transparent", color: danger, cursor: "pointer", fontSize: 15, paddingBottom: 10 }}>🗑</button>}
        </div>
      ))}
    </Sheet>
  );
}

// ── Add/Edit KPI Suggestion Mapping ──────────────────────────────────────────
function MappingForm({ initial, onClose, onSave }) {
  const [v, setV] = useState(() => ({ kpi: "", trigger: "kpi_risk", risk: "", question: "", below: "", above: "", kpiBelow: "", suggestion: "", priority: 1, active: true, ...(initial || {}) }));
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  return (
    <Sheet title={(initial ? "Edit" : "Add") + " KPI Suggestion Mapping"} onClose={onClose} footer={<SaveBtn onClick={() => onSave(v)} />}>
      <Field label="KPI"><select style={inputStyle} value={v.kpi} onChange={(e) => set("kpi", e.target.value)}><option value="">Select…</option>{OPTS_KPI.map((o) => <option key={o}>{o}</option>)}</select></Field>
      <Field label="Trigger Mode"><select style={inputStyle} value={v.trigger} onChange={(e) => set("trigger", e.target.value)}>{["kpi_risk", "question_score", "both"].map((o) => <option key={o}>{o}</option>)}</select></Field>
      <div style={{ fontSize: 10.5, color: t2, marginTop: -8, marginBottom: 12 }}>kpi_risk = KPI band · question_score = specific question · both = both conditions.</div>
      <Field label="Risk Level"><select style={inputStyle} value={v.risk} onChange={(e) => set("risk", e.target.value)}><option value="">Select…</option>{["Low", "Moderate", "High"].map((o) => <option key={o}>{o}</option>)}</select></Field>
      <Field label="Question"><input style={inputStyle} value={v.question} onChange={(e) => set("question", e.target.value)} placeholder="Question" /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Score Threshold Below"><input style={inputStyle} type="number" value={v.below} onChange={(e) => set("below", e.target.value)} /></Field>
        <Field label="Score Threshold Above"><input style={inputStyle} type="number" value={v.above} onChange={(e) => set("above", e.target.value)} /></Field>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="KPI Score Below"><input style={inputStyle} type="number" value={v.kpiBelow} onChange={(e) => set("kpiBelow", e.target.value)} /></Field>
        <Field label="Suggestion"><input style={inputStyle} value={v.suggestion} onChange={(e) => set("suggestion", e.target.value)} placeholder="Suggestion" /></Field>
      </div>
      <Field label="Priority"><input style={inputStyle} type="number" value={v.priority} onChange={(e) => set("priority", e.target.value)} /></Field>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Switch on={v.active} onClick={() => set("active", !v.active)} /><span style={{ fontSize: 13, fontWeight: 600, color: t1 }}>Mapping is active</span></div>
    </Sheet>
  );
}
