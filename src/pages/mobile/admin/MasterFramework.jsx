// MasterFramework.jsx — generic, Redux-slice-driven master screens for mobile.
// Reuses the existing admin thunks/selectors so lists, filters, and CRUD all
// hit the real APIs (same ones the desktop admin uses).
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTokens } from "../../../components/mobile/useTokens";
import { getCompanyId } from "../../../utils/roleHelper";

import { fetchQuestions, createQuestion, updateQuestion, deleteQuestion } from "../../../store/questionSlice";
import { fetchThemes, createTheme, updateTheme, deleteTheme } from "../../../store/themeSlice";
import { fetchKpis, createKpi, updateKpi, deleteKpi } from "../../../store/kpiSlice";
import { fetchChallenges, createChallenge, updateChallenge, deleteChallenge } from "../../../store/challengeSlice";
import { fetchSessions, deleteSession } from "../../../store/sessionSlice";
import { fetchAdminSuggestions, createAdminSuggestion, updateAdminSuggestion, deleteAdminSuggestion } from "../../../store/adminSuggestionSlice";
import { fetchKpiSuggestionMappings, createKpiSuggestionMapping, updateKpiSuggestionMapping, deleteKpiSuggestionMapping } from "../../../store/kpiSuggestionMappingSlice";
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from "../../../store/departmentSlice";

// ── shared UI ────────────────────────────────────────────────────────────────
export function SectionLabel({ children, t, style }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: t.faint, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 12px", ...style }}>{children}</div>;
}
export function StatusChip({ active, t }) {
  const on = active === true || active === "Active";
  const c = on ? "#4F9D5B" : "#C0604A";
  return <span style={{ fontSize: 10, fontWeight: 800, borderRadius: 6, padding: "3px 8px", background: `${c}24`, color: c }}>{on ? "Active" : "Inactive"}</span>;
}
export function Toast({ msg, error }) {
  return <div style={{ position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)", zIndex: 400, background: error ? "#C0604A" : "var(--ay-accent-dark, #2C5F2D)", color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "9px 18px", borderRadius: 999, boxShadow: "0 8px 20px -6px rgba(0,0,0,0.4)", maxWidth: "80%", textAlign: "center" }}>{msg}</div>;
}

// option picker bottom sheet — options can be strings or {label,value}
export function Dropdown({ label, value, options, onChange, t, accent }) {
  const [open, setOpen] = useState(false);
  const norm = options.map((o) => (typeof o === "object" ? o : { label: String(o), value: o }));
  const has = value !== undefined && value !== "" && value !== null;
  const current = norm.find((o) => o.value === value);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ flexShrink: 0, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, borderRadius: 8, padding: "6px 11px", cursor: "pointer", fontFamily: "inherit",
        color: has ? (accent || t.g3) : t.muted, border: `1px solid ${has ? (accent || t.g3) : t.border}`, background: has ? `${accent || t.g3}1a` : t.inset }}>
        {label}{has ? ": " + (current ? current.label : value) : ""} <span style={{ fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 300 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15,20,12,0.5)" }} />
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: t.card2, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", overflowY: "auto", paddingBottom: 26 }}>
            <div style={{ width: 38, height: 4.5, borderRadius: 999, background: t.border, margin: "10px auto 6px" }} />
            <div style={{ padding: "4px 20px 8px", fontSize: 13.5, fontWeight: 800, color: t.text }}>{label}</div>
            <div style={{ padding: "0 12px" }}>
              {[{ label: "All", value: "" }, ...norm].map((o) => {
                const sel = (value || "") === o.value;
                return (
                  <button key={String(o.value)} onClick={() => { onChange(o.value); setOpen(false); }} style={{ width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", background: sel ? `${accent || t.g3}1a` : "transparent", color: sel ? (accent || t.g3) : t.text, fontSize: 13.5, fontWeight: sel ? 700 : 500 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>{sel && <span style={{ marginLeft: 8 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DetailSheet({ title, accent, fields, t, onClose, onEdit, onDisable, busy }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,20,12,0.5)" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: t.card2, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTop: `2px solid ${accent}80`, maxHeight: "88%", overflowY: "auto", paddingBottom: 28 }}>
        <div style={{ width: 38, height: 4.5, borderRadius: 999, background: t.border, margin: "10px auto 6px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 20px 14px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text, paddingRight: 12 }}>{title}</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${t.border}`, background: t.inset, color: t.muted, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ padding: "8px 20px 16px" }}>
          {fields.map(([label, value], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "10px 0", borderBottom: i < fields.length - 1 ? `1px solid ${t.border}` : "none" }}>
              <span style={{ fontSize: 12, color: t.faint, fontWeight: 600, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 12.5, color: t.text, fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}>{String(value === "" || value == null ? "—" : value)}</span>
            </div>
          ))}
        </div>
        {(onEdit || onDisable) && (
          <div style={{ padding: "4px 20px 26px", display: "flex", gap: 10 }}>
            {onEdit && <button onClick={onEdit} style={{ flex: 1, borderRadius: 12, border: "none", padding: 13, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: "#fff" }}>✏️ Edit</button>}
            {onDisable && <button onClick={onDisable} disabled={busy} style={{ borderRadius: 12, border: `1px solid #C0604A`, padding: "13px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: "transparent", color: "#C0604A", opacity: busy ? 0.6 : 1 }}>Disable</button>}
          </div>
        )}
      </div>
    </div>
  );
}

export function FormSheet({ title, accent, schema, initial, t, onSave, onClose, busy }) {
  const [vals, setVals] = useState(() => {
    const o = {};
    schema.forEach((f) => { o[f.key] = initial && initial[f.key] !== undefined ? initial[f.key] : (f.type === "toggle" ? false : f.type === "number" ? 0 : ""); });
    return o;
  });
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));
  const inp = { width: "100%", padding: "11px 13px", borderRadius: 11, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 250 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,20,12,0.5)" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: t.card2, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTop: `2px solid ${accent}80`, maxHeight: "92%", overflowY: "auto", paddingBottom: 28 }}>
        <div style={{ width: 38, height: 4.5, borderRadius: 999, background: t.border, margin: "10px auto 6px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 20px 14px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: t.text }}>{title}</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${t.border}`, background: t.inset, color: t.muted, fontSize: 14, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "14px 20px 8px" }}>
          {schema.map((f) => (
            <div key={f.key} style={{ marginBottom: 13 }}>
              <label style={{ fontSize: 11, color: t.faint, fontWeight: 600, display: "block", marginBottom: 6 }}>{f.label}</label>
              {f.type === "toggle" ? (
                <button onClick={() => set(f.key, !vals[f.key])} className={"m-switch" + (vals[f.key] ? " on" : "")} style={{ display: "block" }}><span /></button>
              ) : f.type === "select" ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {f.options.map((o) => {
                    const ov = typeof o === "object" ? o.value : o; const ol = typeof o === "object" ? o.label : o;
                    const on = vals[f.key] === ov;
                    return <button key={String(ov)} onClick={() => set(f.key, ov)} style={{ padding: "9px 13px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, border: `1px solid ${on ? "transparent" : t.border}`, background: on ? `${accent}1a` : t.card, color: on ? accent : t.muted }}>{ol}</button>;
                  })}
                </div>
              ) : (
                <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={vals[f.key]} onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)} style={inp} />
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: "6px 20px 26px", display: "flex", gap: 10 }}>
          <button onClick={() => onSave(vals)} disabled={busy} style={{ flex: 1, borderRadius: 12, border: "none", padding: 13, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: "#fff", opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : "💾 Save"}</button>
          <button onClick={onClose} style={{ borderRadius: 12, border: `1px solid ${t.border}`, padding: "13px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: t.inset, color: t.muted }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const STATUS_OPTS = [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }];
const isActiveParam = (v) => (v === "active" ? true : v === "inactive" ? false : undefined);

export { isActiveParam, STATUS_OPTS };
export {
  fetchQuestions, createQuestion, updateQuestion, deleteQuestion,
  fetchThemes, createTheme, updateTheme, deleteTheme,
  fetchKpis, createKpi, updateKpi, deleteKpi,
  fetchChallenges, createChallenge, updateChallenge, deleteChallenge,
  fetchSessions, deleteSession,
  fetchAdminSuggestions, createAdminSuggestion, updateAdminSuggestion, deleteAdminSuggestion,
  fetchKpiSuggestionMappings, createKpiSuggestionMapping, updateKpiSuggestionMapping, deleteKpiSuggestionMapping,
  fetchDepartments, createDepartment, updateDepartment, deleteDepartment,
  useEffect, useMemo, useState, useDispatch, useSelector, useTokens, getCompanyId,
};
