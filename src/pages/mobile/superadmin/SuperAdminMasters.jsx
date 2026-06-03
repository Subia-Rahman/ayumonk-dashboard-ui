import React from "react";
import { useNavigate } from "react-router-dom";

// Ayumonk Super Admin — full mobile master screens (ported from prototype).
// Self-contained: injects its own CSS, uses sample data for selects/lists.
// Wire onSave/list data to your real /admin & /super-admin slices as needed.

let saCssInjected = false;
function injectSaCss(){
  if (saCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.dataset.ayumonkSa = "true";
  tag.textContent = "\n\n  *{box-sizing:border-box;}\n  html,\n  :root{\n    --bg:#f8f9f5; --surface:#ffffff; --inset:#f1f3ec; --bd:#e6e9df;\n    --primary:#4a7c59; --primary-d:#3d6b48; --accent:#6b8f5e; --soft:#e9f0e6;\n    --t1:#1a2e1a; --t2:#5a6b5a; --t3:#9aa792; --danger:#d85a30;\n  }\n  \n  \n\n  .sa-stage{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:26px 16px 50px;}\n  .sa-stage-head{width:100%;max-width:760px;margin-bottom:22px;}\n  .sa-device{position:relative;}\n\n  .sa-app{height:100%;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);}\n  .sa-scroll{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}\n  .sa-scroll::-webkit-scrollbar{display:none;}\n\n  /* top bar */\n  .sa-top{position:sticky;top:0;z-index:8;display:flex;align-items:center;gap:10px;padding:48px 15px 12px;background:var(--surface);border-bottom:1px solid var(--bd);}\n  .sa-top-title{flex:1;text-align:center;font-size:14.5px;font-weight:700;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}\n  .sa-ic{width:34px;height:34px;border-radius:10px;border:1px solid var(--bd);background:var(--inset);font-size:15px;cursor:pointer;display:grid;place-items:center;}\n  .sa-dot{position:absolute;top:-4px;right:-4px;min-width:15px;height:15px;padding:0 3px;border-radius:999px;background:var(--danger);color:#fff;font-size:8.5px;font-weight:800;display:grid;place-items:center;border:1.5px solid var(--surface);}\n  .sa-avatar{width:34px;height:34px;border-radius:10px;border:none;background:linear-gradient(135deg,var(--primary-d),var(--accent));color:#fff;font-size:14px;font-weight:800;cursor:pointer;display:grid;place-items:center;}\n  .sa-avatar.lg{width:56px;height:56px;border-radius:16px;font-size:22px;}\n\n  .sa-screen{padding:14px 14px 20px;}\n\n  /* hero */\n  .sa-hero{border-radius:18px;padding:16px 16px 6px;background:linear-gradient(150deg,var(--primary-d),var(--accent));color:#fff;margin-bottom:18px;box-shadow:0 12px 26px -16px rgba(61,107,72,0.7);}\n  .sa-role{font-size:8.5px;font-weight:800;letter-spacing:0.08em;background:rgba(255,255,255,0.22);color:#fff;border-radius:999px;padding:3px 8px;}\n  .sa-hero-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px -2px 0;}\n  .sa-hero-stats .n{font-size:20px;font-weight:800;letter-spacing:-0.02em;}\n  .sa-hero-stats .l{font-size:9.5px;color:rgba(255,255,255,0.8);font-weight:600;}\n\n  .sa-sec{margin-bottom:22px;}\n  .sa-sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;font-size:13px;font-weight:800;color:var(--t1);}\n  .sa-link{border:none;background:transparent;color:var(--primary);font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;}\n\n  .sa-card{background:var(--surface);border:1px solid var(--bd);border-radius:12px;padding:14px;}\n  .sa-rbac-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;font-size:12.5px;color:var(--t2);}\n  .sa-full{color:#2f7d4f;font-weight:800;font-size:12px;}\n  .sa-view{color:#4A90C4;font-weight:700;}\n  .sa-dash{color:var(--t3);}\n\n  .sa-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;}\n  .sa-tile{text-align:left;border:1px solid var(--bd);background:var(--surface);border-radius:13px;padding:13px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;gap:4px;min-height:108px;}\n  .sa-tile:active{transform:scale(0.98);}\n  .sa-tile-ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-size:19px;margin-bottom:5px;}\n  .sa-tile-name{font-size:13px;font-weight:800;color:var(--t1);}\n  .sa-tile-desc{font-size:10.5px;color:var(--t2);line-height:1.4;}\n\n  /* list */\n  .sa-list-bar{display:flex;gap:8px;margin-bottom:10px;}\n  .sa-search{flex:1;display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--bd);border-radius:10px;padding:0 12px;}\n  .sa-search input{flex:1;min-width:0;border:none;background:transparent;outline:none;font-size:13px;font-family:inherit;color:var(--t1);height:44px;}\n  .sa-filter-btn{position:relative;border:1px solid var(--bd);background:var(--surface);border-radius:10px;padding:0 13px;height:44px;font-size:12.5px;font-weight:700;color:var(--t2);cursor:pointer;font-family:inherit;white-space:nowrap;}\n  .sa-fcount{display:inline-grid;place-items:center;width:17px;height:17px;border-radius:999px;background:var(--primary);color:#fff;font-size:9.5px;font-weight:800;margin-left:4px;}\n  .sa-add{border:none;background:var(--primary);color:#fff;border-radius:9px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;}\n\n  .sa-meta{display:flex;flex-direction:column;gap:7px;}\n  .sa-meta-row{display:flex;justify-content:space-between;gap:14px;font-size:12.5px;}\n  .sa-meta-row span{color:var(--t2);}\n  .sa-meta-row b{color:var(--t1);font-weight:600;text-align:right;}\n  .sa-meta-row.big{padding:11px 0;border-bottom:1px solid var(--bd);}\n  .sa-actions{display:flex;gap:6px;margin-top:12px;padding-top:11px;border-top:1px solid var(--bd);}\n  .sa-actions button{flex:1;min-height:44px;border:1px solid var(--bd);background:var(--inset);border-radius:9px;font-size:12px;font-weight:700;color:var(--t2);cursor:pointer;font-family:inherit;}\n  .sa-actions button.del{color:var(--danger);border-color:#f0d4c8;background:#fbeee7;}\n  .sa-badge{font-size:10.5px;font-weight:800;border-radius:999px;padding:3px 11px;white-space:nowrap;}\n  .sa-empty,.sa-info{font-size:12.5px;color:var(--t2);text-align:center;padding:18px;background:var(--surface);border:1px solid var(--bd);border-radius:12px;line-height:1.5;}\n  .sa-info{text-align:left;background:var(--soft);border-color:#d7e3d2;}\n  .sa-loadmore{width:100%;margin-top:14px;border:1px solid var(--bd);background:var(--surface);border-radius:11px;padding:13px;font-size:13px;font-weight:700;color:var(--primary);cursor:pointer;font-family:inherit;}\n\n  /* matrix */\n  .sa-matrix{border-collapse:separate;border-spacing:0;width:max-content;font-size:11px;}\n  .sa-matrix th,.sa-matrix td{padding:8px 10px;text-align:center;border-bottom:1px solid var(--bd);white-space:nowrap;}\n  .sa-matrix th{font-size:10px;color:var(--t2);font-weight:700;text-align:center;}\n  .sa-matrix td.sec,.sa-matrix th:first-child{text-align:left;font-weight:700;color:var(--t1);position:sticky;left:0;background:var(--surface);}\n\n  /* bottom nav */\n  .sa-bn{display:flex;background:var(--surface);border-top:1px solid var(--bd);padding-bottom:20px;flex-shrink:0;}\n  .sa-bn-item{flex:1;border:none;background:transparent;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:9px 2px;color:var(--t3);font-family:inherit;min-height:54px;}\n  .sa-bn-item.on{color:var(--primary);}\n  .sa-bn-ic{font-size:18px;line-height:1;}\n  .sa-bn-l{font-size:10px;font-weight:600;}\n\n  /* sheets + drawer */\n  .sa-sheet-wrap,.sa-drawer-wrap{position:absolute;inset:0;z-index:80;}\n  .sa-scrim{position:absolute;inset:0;background:rgba(20,30,16,0.45);}\n  .sa-sheet{position:absolute;left:0;right:0;bottom:0;background:var(--surface);border-radius:22px 22px 0 0;max-height:88%;display:flex;flex-direction:column;}\n  .sa-drawer{position:absolute;left:0;right:0;bottom:0;top:60px;background:var(--bg);border-radius:22px 22px 0 0;display:flex;flex-direction:column;}\n  .sa-grab{width:38px;height:4.5px;border-radius:999px;background:var(--bd);margin:10px auto 4px;}\n  .sa-sheet-head{display:flex;align-items:center;justify-content:space-between;padding:8px 18px 14px;border-bottom:1px solid var(--bd);}\n  .sa-x{width:30px;height:30px;border-radius:9px;border:1px solid var(--bd);background:var(--inset);color:var(--t2);font-size:13px;cursor:pointer;}\n  .sa-sheet-\n  .sa-sheet-foot{padding:12px 18px 26px;border-top:1px solid var(--bd);}\n  .sa-drawer-\n  .sa-grp{font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--t3);margin-bottom:9px;}\n  .sa-grp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}\n  .sa-drawer-item{display:flex;align-items:center;gap:9px;border:1px solid var(--bd);background:var(--surface);border-radius:11px;padding:12px;font-size:12.5px;font-weight:600;color:var(--t1);cursor:pointer;font-family:inherit;text-align:left;min-height:48px;}\n  .sa-drawer-item.on{background:var(--soft);border-color:var(--accent);color:var(--primary-d);}\n  .sa-di-ic{font-size:16px;}\n\n  .sa-input,select.sa-input{width:100%;height:48px;border:1px solid var(--bd);border-radius:8px;background:var(--surface);padding:0 13px;font-size:13.5px;font-family:inherit;color:var(--t1);outline:none;}\n  .sa-chip{border:1px solid var(--bd);background:var(--surface);border-radius:999px;padding:8px 15px;font-size:12.5px;font-weight:700;color:var(--t2);cursor:pointer;font-family:inherit;}\n  .sa-chip.on{background:var(--soft);border-color:var(--accent);color:var(--primary-d);}\n  .sa-btn{flex:1;border:none;background:var(--primary);color:#fff;border-radius:10px;padding:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;}\n  .sa-btn.ghost{background:var(--inset);color:var(--t2);border:1px solid var(--bd);}\n  .sa-btn.ghost.danger{color:var(--danger);}\n  .sa-icon-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;}\n  .sa-icon-cell{display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid var(--bd);background:var(--surface);border-radius:11px;padding:10px 4px;cursor:pointer;font-family:inherit;font-size:9px;color:var(--t2);font-weight:600;}\n  .sa-icon-cell.on{border-color:var(--accent);background:var(--soft);color:var(--primary-d);}\n  .sa-switch{width:42px;height:25px;border-radius:999px;border:none;background:var(--bd);cursor:pointer;position:relative;padding:0;flex-shrink:0;}\n  .sa-switch.on{background:var(--primary);}\n  .sa-switch span{position:absolute;top:3px;left:3px;width:19px;height:19px;border-radius:999px;background:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,0.25);}\n  .sa-switch.on span{transform:translateX(17px);}\n\n";
  document.head.appendChild(tag);
  saCssInjected = true;
}

// superadmin-app.jsx — Ayumonk Super Admin mobile prototype.
const sUse = React.useState;
const sMemo = React.useMemo;

// hex+alpha
function ha(hex, a){const h=hex.replace("#","");const n=h.length===3?h.split("").map(c=>c+c).join(""):h;const r=parseInt(n.slice(0,2),16),g=parseInt(n.slice(2,4),16),b=parseInt(n.slice(4,6),16);return `rgba(${r},${g},${b},${a})`;}

// ── brand mark ────────────────────────────────────────────────────────────────
function Logo({size=22}){return(
  <svg width={size*1.55} height={size*0.7} viewBox="0 0 120 52" fill="none" aria-label="Ayumonk">
    <path d="M60 26C60 26 48 4 30 4 14 4 4 14 4 26 4 38 14 48 30 48 48 48 60 26 60 26Z" stroke="#3d6b48" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
    <path d="M60 26C60 26 72 4 90 4 106 4 116 14 116 26 116 38 106 48 90 48 72 48 60 26 60 26Z" stroke="#6b8f5e" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
  </svg>
);}

// ── data ──────────────────────────────────────────────────────────────────────
const COMPANIES = [
  { id:1, name:"TechCorp Pvt Ltd", industry:"IT", size:"Medium", employees:320, status:"Active", created:"Jan 2025" },
  { id:2, name:"RetailCo Ltd", industry:"Retail", size:"Large", employees:850, status:"Active", created:"Feb 2025" },
  { id:3, name:"PharmaCorp", industry:"Pharma", size:"Medium", employees:210, status:"Active", created:"Mar 2025" },
  { id:4, name:"StartupXYZ", industry:"Tech", size:"Small", employees:45, status:"Trial", created:"Apr 2025" },
];
const SESSIONS = [
  { id:1, title:"20th May Session", desc:"KT session", company:"Ally Wired Soft Solutions", active:true, created:"20 May 2026" },
  { id:2, title:"RIL_Session", desc:"description", company:"Reliance Industries", active:true, created:"16 May 2026" },
  { id:3, title:"Session 5th May", desc:"Description 5th May session", company:"Ally Wired Soft Solutions", active:true, created:"6 May 2026" },
  { id:4, title:"Session for 17 April", desc:"Description for 17 April session", company:"Ally Wired Soft Solutions", active:true, created:"17 Apr 2026" },
  { id:5, title:"Physical Health Session 1", desc:"Session on 16 march", company:"Ally Wired Soft Solutions", active:true, created:"23 Mar 2026" },
];
const KPIS = [
  { id:1, name:"Cognitive Focus", company:"Ally Wired Soft Solutions", theme:"Unplug to Recharge", weight:0.1, start:"2026-05-05", end:"2026-05-18", status:"Active" },
  { id:2, name:"Cognitive Focus", company:"Ally Wired Soft Solutions", theme:"Breathe & Shine", weight:0.1, start:"2026-05-03", end:"2026-05-16", status:"Active" },
  { id:3, name:"Digital Wellness", company:"Reliance Industries", theme:"Unplug to Recharge", weight:0.1, start:"—", end:"—", status:"Active" },
  { id:4, name:"Emotional Well-being", company:"Ally Wired Soft Solutions", theme:"Move Like Nature", weight:0.1, start:"2026-04-26", end:"2026-05-09", status:"Active" },
  { id:5, name:"Physical Vitality", company:"Reliance Industries", theme:"Breathe & Shine", weight:0.1, start:"2026-04-28", end:"2026-05-11", status:"Active" },
];
// RBAC summary for current role (Super Admin = full everywhere)
const RBAC = [
  { section:"Company Master", v:"Full" }, { section:"Company Users", v:"Full" }, { section:"Themes", v:"Full" },
  { section:"KPIs & Questions", v:"Full" }, { section:"Challenges", v:"Full" }, { section:"Suggestion Master", v:"Full" },
  { section:"Sessions / Windows", v:"Full" }, { section:"HR Analytics", v:"Full" }, { section:"Platform Settings", v:"Full" },
];
const RBAC_ROLES = ["Employee","HR Manager","CXO","Company Admin","Ayumonk Admin","Super Admin"];
const RBAC_FULL = [
  ["Company Master","—","—","—","View","Full","Full"],
  ["Company Users","—","View","—","Full","Full","Full"],
  ["Themes","—","—","—","View","Full","Full"],
  ["KPIs & Questions","—","—","—","—","Full","Full"],
  ["Challenges","—","View","—","View","Full","Full"],
  ["Suggestion Master","—","—","—","—","Full","Full"],
  ["Sessions / Windows","—","Full","View","Full","Full","Full"],
  ["HR Analytics","—","Full","Full","—","View","Full"],
  ["Platform Settings","—","—","—","—","—","Full"],
];
const TILES = [
  { id:"company-data", ic:"🏢", name:"Companies", desc:"Add and manage corporate clients", c:"#4A90C4" },
  { id:"users", ic:"👥", name:"Users & Roles", desc:"Assign employees, HR, admins & CXOs", c:"#6b8f5e" },
  { id:"themes", ic:"🎨", name:"Themes", desc:"Create wellness program themes", c:"#C36FA8" },
  { id:"questions", ic:"❓", name:"Questions", desc:"Manage assessment questions per KPI", c:"#C99A3F" },
  { id:"challenges", ic:"🎯", name:"Challenges", desc:"Configure daily challenges per KPI", c:"#E0935C" },
  { id:"suggestions", ic:"🌿", name:"Suggestion Master", desc:"Aahar / Vihar / Aushadh library", c:"#3AA88A" },
  { id:"sessions", ic:"📅", name:"Sessions / KPI Windows", desc:"Schedule KPI programs per company", c:"#8B6FCB" },
  { id:"cxo", ic:"📈", name:"CXO Metrics", desc:"Productivity / Engagement mappings", c:"#4F9D5B" },
];
const PINNED = [
  { id:"dashboard", ic:"🛡", label:"Dashboard" },
  { id:"company-data", ic:"🏢", label:"Companies" },
  { id:"sessions", ic:"📅", label:"Sessions" },
  { id:"kpis", ic:"📊", label:"KPIs" },
  { id:"more", ic:"☰", label:"More" },
];
const DRAWER = [
  { group:"Master Data", items:[["company-data","🏢","Company Data"],["company-users","👥","Company Users"],["departments","🏬","Departments"]] },
  { group:"Content", items:[["questions","❓","Questions"],["themes","🎨","Themes"],["kpis","📊","KPIs"],["challenges","🎯","Challenges"],["sessions","📅","Sessions"],["suggestions","🌿","Suggestion Master"],["mapping","🔗","KPI Suggestion Mapping"]] },
  { group:"Access", items:[["roles","🪪","Roles"],["permissions","🔑","Permissions"],["policies","🛡","Policies"],["assignments","🧩","Role Assignments"]] },
  { group:"Configuration", items:[["cxo","📈","CXO Metrics"],["dimensions","🌱","Wellness Dimensions"],["menus","📑","Menus"]] },
  { group:"Account", items:[["profile","🧑‍💼","My Profile"]] },
];
const TITLES = { dashboard:"Admin Panel", "company-data":"Company Master", "company-users":"Company Users", departments:"Departments", questions:"Question Bank", themes:"Theme Master", kpis:"KPI Master", challenges:"Challenge Master", sessions:"Sessions", suggestions:"Suggestion Library", mapping:"KPI Suggestion Mapping", roles:"Role Master", permissions:"Permissions", policies:"Policies", assignments:"Role Assignments", cxo:"CXO Metrics", dimensions:"Wellness Dimensions", menus:"Menu Master", profile:"My Profile" };

const CHALLENGES = [
  { id:1, name:"challenge 1", company:"Ally Wired Soft Solutions", type:"Monthly", target:0, xp:20, daily:"Yes", status:"Active" },
  { id:2, name:"Drink water", company:"Ally Wired Soft Solutions", type:"Counter", target:12, xp:5, daily:"Yes", status:"Active" },
  { id:3, name:"May 5 session challenge", company:"Ally Wired Soft Solutions", type:"Counter", target:0, xp:1, daily:"Yes", status:"Active" },
  { id:4, name:"session 5 may challenge", company:"Ally Wired Soft Solutions", type:"Toggle", target:1, xp:2, daily:"Yes", status:"Active" },
];
const QUESTIONS = [
  { id:1, code:"Trust_Friends", q:"Do you have friends you trust?", company:"Ally Wired Soft Solutions", theme:"Friends & Feelings", kpi:"Social Health", reverse:"No", options:5, status:"Active" },
  { id:2, code:"Device_Bedtime", q:"Do you use a device right before sleep?", company:"Reliance Industries", theme:"Unplug to Recharge", kpi:"Digital Wellness", reverse:"Yes", options:5, status:"Active" },
  { id:3, code:"Group_Comfort", q:"How comfortable do you feel in a group?", company:"Ally Wired Soft Solutions", theme:"Friends & Feelings", kpi:"Social Health", reverse:"No", options:5, status:"Active" },
];
const THEMES = [
  { id:1, name:"Breathe & Shine (Breath & Focus)", company:"Ally Wired Soft Solutions", status:"Active", created:"17 Feb 2026" },
  { id:2, name:"Eat the Rainbow (Nutrition & Digestion)", company:"Reliance Industries", status:"Active", created:"16 May 2026" },
  { id:3, name:"Move Like Nature (Yoga & Play)", company:"Ally Wired Soft Solutions", status:"Active", created:"17 Feb 2026" },
];
const SUGGESTIONS = [
  { id:1, title:"cognitive focus suggestion", type:"Aahar", dosha:"All", difficulty:"Moderate", duration:"1 min", status:"Active" },
  { id:2, title:"Suggestion Title", type:"Aahar", dosha:"All", difficulty:"Easy", duration:"1 min", status:"Active" },
  { id:3, title:"string", type:"Aahar", dosha:"Vata", difficulty:"Easy", duration:"0 min", status:"Active" },
];
const USERS = [
  { id:1, name:"Prateek Singh", empId:"EMP_04", dept:"Human Resources", company:"Ally Wired Soft Solutions", role:"HR Manager", status:"Active" },
  { id:2, name:"Avinash Singh", empId:"EMP_RIL_03", dept:"Engineering", company:"Reliance Industries", role:"Employee", status:"Active" },
  { id:3, name:"Shubam Gupta", empId:"EMP_RIL_02", dept:"Administration", company:"Reliance Industries", role:"Company Admin", status:"Active" },
  { id:4, name:"Sarah", empId:"EMP03", dept:"Administration", company:"Ally Wired Soft Solutions", role:"Employee", status:"Active" },
];

const CH_TYPES = ["Counter","Toggle","Monthly","Daily","Streak"];
const CH_ICONS = [["🏆","Trophy"],["🎯","Target"],["🔥","Streak"],["⚡","Energy"],["⭐","Star"],["💪","Strength"],["🚀","Boost"],["🏅","Winner"],["🎉","Celebrate"],["🧘","Focus"],["💧","Hydration"],["🌿","Wellness"]];

function ChallengeForm({ initial, onClose, onSave }){
  const [v,setV] = sUse(()=>({ name:"", type:"", desc:"", target:0, xp:0, icon:"🏆", custom:"", daily:true, ...(initial||{}) }));
  const set = (k,x)=>setV(s=>({...s,[k]:x}));
  const [maps,setMaps] = sUse([{ kpi:"", start:"", end:"" }]);
  const setMap = (i,k,x)=>setMaps(m=>m.map((r,j)=>j===i?{...r,[k]:x}:r));
  return (
    <Sheet title={(initial?"Edit":"Add")+" Challenge"} onClose={onClose}
      footer={<button className="sa-btn" onClick={()=>onSave(v)}>💾 Save</button>}>
      <Field label="Challenge Name"><input className={inputCls} value={v.name} onChange={e=>set("name",e.target.value)} placeholder="Challenge name" /></Field>
      <Field label="Challenge Type">
        <select className={inputCls} value={v.type} onChange={e=>set("type",e.target.value)}>
          <option value="">Select type…</option>
          {CH_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Description"><textarea className={inputCls} style={{ height:80, padding:"11px 13px", resize:"none" }} value={v.desc} onChange={e=>set("desc",e.target.value)} placeholder="Description" /></Field>
      <div style={{ display:"flex", gap:10 }}>
        <Field label="Target Value"><input className={inputCls} type="number" value={v.target} onChange={e=>set("target",e.target.value)} /></Field>
        <Field label="XP Reward"><input className={inputCls} type="number" value={v.xp} onChange={e=>set("xp",e.target.value)} /></Field>
      </div>
      <Field label="Challenge Icon">
        <div className="sa-icon-grid">
          {CH_ICONS.map(([em,lbl])=>(
            <button key={lbl} onClick={()=>{ set("icon",em); set("custom",""); }} className={"sa-icon-cell"+(v.icon===em&&!v.custom?" on":"")}>
              <span style={{ fontSize:20 }}>{em}</span><span>{lbl}</span>
            </button>
          ))}
        </div>
        <input className={inputCls} style={{ marginTop:8 }} value={v.custom} onChange={e=>set("custom",e.target.value)} placeholder="Custom icon / emoji" />
      </Field>
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 16px" }}>
        <button onClick={()=>set("daily",!v.daily)} className={"sa-switch"+(v.daily?" on":"")}><span /></button>
        <span style={{ fontSize:13, fontWeight:600, color:"var(--t1)" }}>Daily Challenge</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:13, fontWeight:800, color:"var(--t1)" }}>KPI Mappings</span>
        <button className="sa-add" onClick={()=>setMaps(m=>[...m,{ kpi:"", start:"", end:"" }])}>+ Add Mapping</button>
      </div>
      {maps.map((m,i)=>(
        <div key={i} className="sa-card" style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:9 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"var(--t2)" }}>Mapping {i+1}</span>
            {maps.length>1 && <button onClick={()=>setMaps(x=>x.filter((_,j)=>j!==i))} style={{ border:"none", background:"transparent", color:"var(--danger)", cursor:"pointer", fontSize:14 }}>🗑</button>}
          </div>
          <Field label="KPI"><select className={inputCls} value={m.kpi} onChange={e=>setMap(i,"kpi",e.target.value)}><option value="">Select KPI…</option>{KPIS.map(k=><option key={k.id}>{k.name}</option>)}</select></Field>
          <div style={{ display:"flex", gap:10 }}>
            <Field label="Start Date"><input className={inputCls} type="date" value={m.start} onChange={e=>setMap(i,"start",e.target.value)} /></Field>
            <Field label="End Date"><input className={inputCls} type="date" value={m.end} onChange={e=>setMap(i,"end",e.target.value)} /></Field>
          </div>
        </div>
      ))}
    </Sheet>
  );
}

// Faithful field specs per master (mirrors desktop Add forms)
const COMPANY_OPTS = ["Ally Wired Soft Solutions","Reliance Industries"];
const THEME_OPTS = ["Friends & Feelings","Unplug to Recharge","Breathe & Shine","Move Like Nature","Eat the Rainbow"];
const KPI_OPTS = ["Cognitive Focus","Digital Wellness","Emotional Well-being","Physical Vitality","Social Health"];
const FORM_SPECS = {
  questions:[
    ["company","Company","select",COMPANY_OPTS],["code","Question Code","text"],["q","Question","textarea"],
    ["theme","Theme","select",THEME_OPTS],["kpi","KPI","select",KPI_OPTS],
    ["reverse","Reverse Code","toggle"],["options","Options","number"],["status","Status","status"],
  ],
  themes:[
    ["company","Company","select",COMPANY_OPTS],["name","Theme Name","text"],["desc","Description","textarea"],
    ["duration","Duration (Days)","number"],["audience","Target Audience","text"],["status","Status","status"],
  ],
  kpis:[
    ["company","Company","select",COMPANY_OPTS],["name","KPI Name","text"],["theme","Theme","select",THEME_OPTS],
    ["domain","Domain Category","text"],["weight","WI Weight","number"],
    ["start","Start Date","date"],["end","End Date","date"],["status","Status","status"],
  ],
  suggestions:[
    ["type","Type","select",["Aahar","Vihar","Aushadh"]],["title","Title","text"],["desc","Description","textarea"],
    ["dosha","Dosha","select",["All","Vata","Pitta","Kapha"]],["difficulty","Difficulty","select",["Easy","Moderate","Hard"]],
    ["duration","Duration (mins)","number"],["url","URL","text"],["status","Status","status"],
  ],
  policies:[
    ["name","Name","text"],["company","Company","select",COMPANY_OPTS],["module","Module","text"],
    ["scope","Scope","select",["global","tenant","department","self"]],["effect","Effect","select",["allow","deny"]],
    ["active","Policy is active","toggle"],["desc","Description","textarea"],
    ["conditions","Conditions (JSON object)","textarea"],["conditionJson","Condition JSON (JSON object)","textarea"],
  ],
  "company-data":[
    ["name","Company Name","text"],["industry","Industry","text"],["size","Size","select",["Small","Medium","Large"]],
    ["email","Email","text"],["phone","Phone","text"],["location","Location","text"],
    ["employees","Employees","number"],["status","Status","status"],
  ],
  "company-users":[
    ["name","Full Name","text"],["empId","Employee ID","text"],["dept","Department","text"],
    ["gender","Gender","select",["male","female","other"]],["company","Company","select",COMPANY_OPTS],
    ["role","Role","select",["Employee","HR Manager","Company Admin","CXO"]],["email","Email","text"],["status","Status","status"],
  ],
  sessions:[
    ["title","Title","text"],["desc","Description","textarea"],["company","Company","select",COMPANY_OPTS],["active","Active","toggle"],
  ],
  permissions:[
    ["name","Name","text"],["codename","Codename","text"],["module","Module","text"],
    ["action","Action","select",["read","create","update","delete"]],["resource","Resource","text"],
  ],
  menus:[
    ["name","Name","text"],["slug","Slug","text"],["path","Path","text"],["order","Order","number"],["status","Status","status"],
  ],
};

function FormBuilder({ title, spec, initial, onClose, onSave }){
  const blank = {}; spec.forEach(([k,,t])=>{ blank[k]= t==="toggle"?false : t==="number"?0 : t==="status"?"Active":""; });
  const [v,setV] = sUse(()=>({ ...blank, ...(initial||{}) }));
  const set=(k,x)=>setV(s=>({...s,[k]:x}));
  return (
    <Sheet title={title} onClose={onClose} footer={<button className="sa-btn" onClick={()=>onSave(v)}>💾 Save</button>}>
      {spec.map(([k,label,t,opts])=>(
        <Field key={k} label={label}>
          {t==="text" && <input className={inputCls} value={v[k]} onChange={e=>set(k,e.target.value)} placeholder={label} />}
          {t==="number" && <input className={inputCls} type="number" value={v[k]} onChange={e=>set(k,e.target.value)} />}
          {t==="date" && <input className={inputCls} type="date" value={v[k]} onChange={e=>set(k,e.target.value)} />}
          {t==="textarea" && <textarea className={inputCls} style={{ height:78, padding:"11px 13px", resize:"none" }} value={v[k]} onChange={e=>set(k,e.target.value)} placeholder={label} />}
          {t==="select" && <select className={inputCls} value={v[k]} onChange={e=>set(k,e.target.value)}><option value="">Select…</option>{opts.map(o=><option key={o}>{o}</option>)}</select>}
          {t==="status" && <div style={{ display:"flex", gap:8 }}>{["Active","Inactive"].map(s=><button key={s} onClick={()=>set(k,s)} className={"sa-chip"+(v[k]===s?" on":"")}>{s}</button>)}</div>}
          {t==="toggle" && <button onClick={()=>set(k,!v[k])} className={"sa-switch"+(v[k]?" on":"")}><span /></button>}
        </Field>
      ))}
    </Sheet>
  );
}

const POLICIES = [
  { id:7, name:"Global Access", module:"Global", scope:"Global", effect:"Allow", desc:"See all tenants", status:"Active" },
  { id:8, name:"Tenant Access", module:"Global", scope:"Tenant", effect:"Allow", desc:"See all records within own company", status:"Active" },
  { id:9, name:"Department Access", module:"Global", scope:"Department", effect:"Allow", desc:"See records within own department only", status:"Active" },
  { id:10, name:"Self Access", module:"Global", scope:"Self", effect:"Allow", desc:"See only own records", status:"Active" },
];
const PERMISSIONS = [
  { id:1, name:"company_master:read", codename:"company_master:read", module:"Company_master", action:"Read", resource:"company_master" },
  { id:2, name:"company_master:create", codename:"company_master:create", module:"Company_master", action:"Create", resource:"company_master" },
  { id:3, name:"company_master:update", codename:"company_master:update", module:"Company_master", action:"Update", resource:"company_master" },
  { id:4, name:"company_users:read", codename:"company_users:read", module:"Company_users", action:"Read", resource:"company_users" },
];
const MENUS = [
  { id:17, name:"Dashboard", slug:"user-dashboard", path:"/user/dashboard", order:0, status:"Active" },
  { id:1, name:"Dashboard", slug:"dashboard", path:"/super-admin/dashboard", order:1, status:"Active" },
  { id:2, name:"Company Data", slug:"company-data", path:"/super-admin/company-data", order:2, status:"Active" },
  { id:4, name:"Questions", slug:"questions", path:"/super-admin/questions", order:4, status:"Active" },
];

function QuestionForm({ initial, onClose, onSave }){
  const [v,setV] = sUse(()=>({ company:"", theme:"", kpi:"", code:"", reverse:false, q:"", ...(initial||{}) }));
  const set=(k,x)=>setV(s=>({...s,[k]:x}));
  const [opts,setOpts] = sUse([{ text:"", score:1 },{ text:"", score:2 }]);
  const setOpt=(i,k,x)=>setOpts(o=>o.map((r,j)=>j===i?{...r,[k]:x}:r));
  return (
    <Sheet title={(initial?"Edit":"Add")+" Question"} onClose={onClose} footer={<button className="sa-btn" onClick={()=>onSave({...v,options:opts})}>💾 Save</button>}>
      <Field label="Company"><select className={inputCls} value={v.company} onChange={e=>set("company",e.target.value)}><option value="">Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
      <div style={{ display:"flex", gap:10 }}>
        <Field label="Theme"><select className={inputCls} value={v.theme} onChange={e=>set("theme",e.target.value)}><option value="">Select…</option>{THEME_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
        <Field label="KPI"><select className={inputCls} value={v.kpi} onChange={e=>set("kpi",e.target.value)}><option value="">Select…</option>{KPI_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <div style={{ flex:1 }}><Field label="Question Code"><input className={inputCls} value={v.code} onChange={e=>set("code",e.target.value)} placeholder="Question Code" /></Field></div>
        <div style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:14 }}><button onClick={()=>set("reverse",!v.reverse)} className={"sa-switch"+(v.reverse?" on":"")}><span /></button><span style={{ fontSize:12, color:"var(--t2)", whiteSpace:"nowrap" }}>Reverse coded</span></div>
      </div>
      <Field label="Question Text"><textarea className={inputCls} style={{ height:70, padding:"11px 13px", resize:"none" }} value={v.q} onChange={e=>set("q",e.target.value)} placeholder="Question Text" /></Field>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"6px 0 10px" }}>
        <div><div style={{ fontSize:13, fontWeight:800, color:"var(--t1)" }}>Question Options</div><div style={{ fontSize:10.5, color:"var(--t2)" }}>At least two are required.</div></div>
        <button className="sa-add" onClick={()=>setOpts(o=>[...o,{ text:"", score:o.length+1 }])}>+ Add Option</button>
      </div>
      {opts.map((o,i)=>(
        <div key={i} className="sa-card" style={{ marginBottom:9, display:"flex", gap:8, alignItems:"flex-end" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--t2)", marginBottom:5 }}>Option {i+1}</div>
            <input className={inputCls} value={o.text} onChange={e=>setOpt(i,"text",e.target.value)} placeholder="Option Text" />
          </div>
          <div style={{ width:60 }}><div style={{ fontSize:10, color:"var(--t2)", marginBottom:5 }}>Score</div><input className={inputCls} type="number" value={o.score} onChange={e=>setOpt(i,"score",e.target.value)} style={{ padding:"0 9px" }} /></div>
          {opts.length>2 && <button onClick={()=>setOpts(x=>x.filter((_,j)=>j!==i))} style={{ border:"none", background:"transparent", color:"var(--danger)", cursor:"pointer", fontSize:15, paddingBottom:10 }}>🗑</button>}
        </div>
      ))}
    </Sheet>
  );
}

function MappingForm({ initial, onClose, onSave }){
  const [v,setV] = sUse(()=>({ kpi:"", trigger:"KPI Risk", risk:"", question:"", below:"", above:"", kpiBelow:"", suggestion:"", priority:1, active:true, ...(initial||{}) }));
  const set=(k,x)=>setV(s=>({...s,[k]:x}));
  return (
    <Sheet title={(initial?"Edit":"Add")+" KPI Suggestion Mapping"} onClose={onClose} footer={<button className="sa-btn" onClick={()=>onSave(v)}>💾 Create Mapping</button>}>
      <Field label="KPI"><select className={inputCls} value={v.kpi} onChange={e=>set("kpi",e.target.value)}><option value="">Select…</option>{KPI_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
      <Field label="Trigger Mode"><select className={inputCls} value={v.trigger} onChange={e=>set("trigger",e.target.value)}>{["KPI Risk","question_score","both"].map(o=><option key={o}>{o}</option>)}</select></Field>
      <div style={{ fontSize:10.5, color:"var(--t2)", marginTop:-8, marginBottom:12 }}>kpi_risk = KPI band · question_score = specific question · both = both conditions.</div>
      <Field label="Risk Level"><select className={inputCls} value={v.risk} onChange={e=>set("risk",e.target.value)}><option value="">Select…</option>{["Low","Moderate","High"].map(o=><option key={o}>{o}</option>)}</select></Field>
      <Field label="Question"><select className={inputCls} value={v.question} onChange={e=>set("question",e.target.value)}><option value="">Select…</option>{["Focus_Duration","Wake_Fresh","Trust_Friends"].map(o=><option key={o}>{o}</option>)}</select></Field>
      <div style={{ display:"flex", gap:10 }}>
        <Field label="Score Threshold Below"><input className={inputCls} type="number" value={v.below} onChange={e=>set("below",e.target.value)} /></Field>
        <Field label="Score Threshold Above"><input className={inputCls} type="number" value={v.above} onChange={e=>set("above",e.target.value)} /></Field>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <Field label="KPI Score Below"><input className={inputCls} type="number" value={v.kpiBelow} onChange={e=>set("kpiBelow",e.target.value)} /></Field>
        <Field label="Suggestion"><select className={inputCls} value={v.suggestion} onChange={e=>set("suggestion",e.target.value)}><option value="">Select…</option>{["cognitive focus suggestion","Suggestion Title"].map(o=><option key={o}>{o}</option>)}</select></Field>
      </div>
      <Field label="Priority"><input className={inputCls} type="number" value={v.priority} onChange={e=>set("priority",e.target.value)} /></Field>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}><button onClick={()=>set("active",!v.active)} className={"sa-switch"+(v.active?" on":"")}><span /></button><span style={{ fontSize:13, fontWeight:600 }}>Mapping is active</span></div>
    </Sheet>
  );
}

const Badge = ({ s }) => {
  const map = { Active:["#e7f3ea","#2f7d4f"], Trial:["#fdf0dd","#b5791f"], Disabled:["#fae3da","#c0502a"], Inactive:["#eef0ec","#5a6b5a"] };
  const [bg,fg] = map[s] || map.Inactive;
  return <span className="sa-badge" style={{ background:bg, color:fg }}>{s}</span>;
};

// ── bottom sheet ───────────────────────────────────────────────────────────────
function Sheet({ title, onClose, children, footer }){
  return (
    <div className="sa-sheet-wrap" onClick={onClose}>
      <div className="sa-scrim" />
      <div className="sa-sheet" onClick={e=>e.stopPropagation()}>
        <div className="sa-grab" />
        <div className="sa-sheet-head">
          <span style={{ fontSize:15.5, fontWeight:700, color:"var(--t1)" }}>{title}</span>
          <button className="sa-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="sa-sheet-body">{children}</div>
        {footer && <div className="sa-sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}
function Field({ label, children }){ return (
  <label style={{ display:"block", marginBottom:14 }}>
    <span style={{ fontSize:11.5, fontWeight:600, color:"var(--t2)", display:"block", marginBottom:6 }}>{label}</span>
    {children}
  </label>
);}
const inputCls = "sa-input";

// ── generic list screen (card-ified table) ─────────────────────────────────────
function ListScreen({ kind }){
  const cfg = {
    "company-data":{ rows:COMPANIES, add:"Add Company", statuses:["Active","Trial","Disabled"],
      card:r=>({ title:r.name, meta:[["Industry",r.industry],["Size",r.size],["Employees",r.employees],["Created",r.created]], status:r.status }) },
    sessions:{ rows:SESSIONS, add:"Add Session", statuses:["Active","Inactive"],
      card:r=>({ title:r.title, meta:[["Company",r.company],["Description",r.desc],["Created",r.created]], status:r.active?"Active":"Inactive" }) },
    kpis:{ rows:KPIS, add:"Add KPI", statuses:["Active","Inactive"],
      card:r=>({ title:r.name, meta:[["Company",r.company],["Theme",r.theme],["WI Weight",r.weight],["Window",`${r.start} → ${r.end}`]], status:r.status }) },
    challenges:{ rows:CHALLENGES, add:"Add Challenge", statuses:["Active","Inactive"],
      card:r=>({ title:r.name, meta:[["Company",r.company],["Type",r.type],["Target",r.target],["XP Reward",r.xp],["Daily",r.daily]], status:r.status }) },
    questions:{ rows:QUESTIONS, add:"Add Question", statuses:["Active","Inactive"],
      card:r=>({ title:r.q, meta:[["Code",r.code],["Company",r.company],["Theme",r.theme],["KPI",r.kpi],["Reverse",r.reverse],["Options",r.options]], status:r.status }) },
    themes:{ rows:THEMES, add:"Add Theme", statuses:["Active","Inactive"],
      card:r=>({ title:r.name, meta:[["Company",r.company],["Created",r.created]], status:r.status }) },
    suggestions:{ rows:SUGGESTIONS, add:"Add Suggestion", statuses:["Active","Inactive"],
      card:r=>({ title:r.title, meta:[["Type",r.type],["Dosha",r.dosha],["Difficulty",r.difficulty],["Duration",r.duration]], status:r.status }) },
    "company-users":{ rows:USERS, add:"Add User", statuses:["Active","Inactive"],
      card:r=>({ title:r.name, meta:[["Employee ID",r.empId],["Department",r.dept],["Company",r.company],["Role",r.role]], status:r.status }) },
    policies:{ rows:POLICIES, add:"Add Policy", statuses:["Active","Inactive"],
      card:r=>({ title:r.name, meta:[["Module",r.module],["Scope",r.scope],["Effect",r.effect],["Description",r.desc]], status:r.status }) },
    permissions:{ rows:PERMISSIONS, add:"Add Permission", statuses:[],
      card:r=>({ title:r.name, meta:[["Codename",r.codename],["Module",r.module],["Action",r.action],["Resource",r.resource]], status:null }) },
    menus:{ rows:MENUS, add:"Add Menu", statuses:["Active","Inactive"],
      card:r=>({ title:r.name, meta:[["Slug",r.slug],["Path",r.path],["Order",r.order]], status:r.status }) },
    mapping:{ rows:[
      { id:1, name:"Cognitive Focus", trigger:"question_score", risk:"-", question:"Focus_Duration", suggestion:"cognitive focus suggestion", priority:1, status:"Active" },
      { id:2, name:"Physical Vitality", trigger:"question_score", risk:"-", question:"Wake_Fresh", suggestion:"Suggestion Title", priority:1, status:"Active" },
    ], add:"Add Mapping", statuses:["Active","Inactive"],
      card:r=>({ title:r.name, meta:[["Trigger Mode",r.trigger],["Question",r.question],["Suggestion",r.suggestion],["Priority",r.priority]], status:r.status }) },
  }[kind];

  const [rows,setRows] = sUse(()=>cfg.rows.map((r,i)=>({ _id:"r"+i, ...r })));
  const [q,setQ] = sUse("");
  const [draft,setDraft] = sUse({ status:"" });
  const [applied,setApplied] = sUse({ status:"" });
  const [filterOpen,setFilterOpen] = sUse(false);
  const [add,setAdd] = sUse(false);
  const [detail,setDetail] = sUse(null);
  const [edit,setEdit] = sUse(null);
  const [shown,setShown] = sUse(8);

  const activeCount = (applied.status?1:0) + (q?1:0);
  const filtered = rows.filter(r=>{
    const c = cfg.card(r);
    if(applied.status && c.status!==applied.status) return false;
    if(q && !JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const visible = filtered.slice(0,shown);

  return (
    <div className="sa-screen">
      <div className="sa-list-bar">
        <div className="sa-search">
          <span style={{ color:"var(--t3)" }}>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" />
        </div>
        <button className="sa-filter-btn" onClick={()=>setFilterOpen(true)}>
          ⚙︎ Filters {activeCount>0 && <span className="sa-fcount">{activeCount}</span>}
        </button>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"4px 2px 12px" }}>
        <span style={{ fontSize:12, color:"var(--t2)", fontWeight:600 }}>Showing {filtered.length} of {rows.length}</span>
        <button className="sa-add" onClick={()=>setAdd(true)}>+ {cfg.add}</button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
        {visible.map(r=>{
          const c = cfg.card(r);
          return (
            <div key={r._id} className="sa-card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                <span style={{ fontSize:16, fontWeight:600, color:"var(--t1)", lineHeight:1.3 }}>{c.title}</span>
                <Badge s={c.status} />
              </div>
              <div className="sa-meta">
                {c.meta.map(([k,v])=>(
                  <div key={k} className="sa-meta-row"><span>{k}</span><b>{String(v)}</b></div>
                ))}
              </div>
              <div className="sa-actions">
                <button onClick={()=>setDetail(r)}>👁 View</button>
                <button onClick={()=>setEdit(r)}>✏️ Edit</button>
                <button className="del">🗑 Delete</button>
              </div>
            </div>
          );
        })}
        {filtered.length===0 && <div className="sa-empty">No records match your filters.</div>}
      </div>
      {shown < filtered.length && (
        <button className="sa-loadmore" onClick={()=>setShown(s=>s+8)}>Load more ({filtered.length-shown})</button>
      )}

      {filterOpen && (
        <Sheet title="Filters" onClose={()=>setFilterOpen(false)}
          footer={<div style={{ display:"flex", gap:10 }}>
            <button className="sa-btn ghost" onClick={()=>{ setDraft({status:""}); setApplied({status:""}); setFilterOpen(false); }}>Reset</button>
            <button className="sa-btn" onClick={()=>{ setApplied(draft); setShown(8); setFilterOpen(false); }}>Apply Filters</button>
          </div>}>
          <Field label="Status">
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["",...cfg.statuses].map(s=>(
                <button key={s||"all"} onClick={()=>setDraft(d=>({...d,status:s}))}
                  className={"sa-chip"+((draft.status||"")===s?" on":"")}>{s||"All"}</button>
              ))}
            </div>
          </Field>
        </Sheet>
      )}

      {add && (kind==="challenges"
        ? <ChallengeForm onClose={()=>setAdd(false)} onSave={()=>setAdd(false)} />
        : kind==="questions"
        ? <QuestionForm onClose={()=>setAdd(false)} onSave={()=>setAdd(false)} />
        : kind==="mapping"
        ? <MappingForm onClose={()=>setAdd(false)} onSave={()=>setAdd(false)} />
        : <FormBuilder title={cfg.add} spec={FORM_SPECS[kind]||[]} onClose={()=>setAdd(false)} onSave={()=>setAdd(false)} />
      )}

      {detail && (
        <Sheet title={cfg.card(detail).title} onClose={()=>setDetail(null)}
          footer={<div style={{ display:"flex", gap:10 }}>
            <button className="sa-btn ghost danger" onClick={()=>setDetail(null)}>Disable</button>
            <button className="sa-btn" onClick={()=>{ setEdit(detail); setDetail(null); }}>✏️ Edit</button>
          </div>}>
          <div className="sa-meta">
            {cfg.card(detail).meta.map(([k,v])=>(
              <div key={k} className="sa-meta-row big"><span>{k}</span><b>{String(v)}</b></div>
            ))}
            <div className="sa-meta-row big"><span>Status</span><Badge s={cfg.card(detail).status} /></div>
          </div>
        </Sheet>
      )}

      {edit && (kind==="challenges"
        ? <ChallengeForm initial={edit} onClose={()=>setEdit(null)} onSave={()=>setEdit(null)} />
        : kind==="questions"
        ? <QuestionForm initial={edit} onClose={()=>setEdit(null)} onSave={()=>setEdit(null)} />
        : kind==="mapping"
        ? <MappingForm initial={edit} onClose={()=>setEdit(null)} onSave={()=>setEdit(null)} />
        : <FormBuilder title={"Edit — "+cfg.card(edit).title} spec={FORM_SPECS[kind]||[]} initial={edit} onClose={()=>setEdit(null)} onSave={()=>setEdit(null)} />
      )}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ go }){
  const [matrix,setMatrix] = sUse(false);
  return (
    <div className="sa-screen">
      <div className="sa-hero">
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
          <span style={{ fontSize:14, fontWeight:800, color:"#fff" }}>⚙️ Admin Panel</span>
          <span className="sa-role">SUPER ADMIN</span>
        </div>
        <div style={{ fontSize:12, color:ha("#ffffff",0.82), lineHeight:1.5 }}>Manage companies, users, content & program configuration across the platform.</div>
        <div className="sa-hero-stats">
          {[["4","Companies"],["9","Users"],["23","Sessions"],["33","KPIs"]].map(([n,l])=>(
            <div key={l}><div className="n">{n}</div><div className="l">{l}</div></div>
          ))}
        </div>
      </div>

      {/* RBAC summary */}
      <div className="sa-sec">
        <div className="sa-sec-head"><span>🔐 Your Access · Super Admin</span><button className="sa-link" onClick={()=>setMatrix(true)}>View full matrix →</button></div>
        <div className="sa-card" style={{ padding:"6px 14px" }}>
          {RBAC.map((r,i)=>(
            <div key={r.section} className="sa-rbac-row" style={{ borderBottom:i<RBAC.length-1?"1px solid var(--bd)":"none" }}>
              <span>{r.section}</span><span className="sa-full">✓ Full</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick manage tiles — 2 col */}
      <div className="sa-sec">
        <div className="sa-sec-head"><span>⚡ Quick Manage</span></div>
        <div className="sa-tiles">
          {TILES.map(t=>(
            <button key={t.id} className="sa-tile" onClick={()=>go(t.id)}>
              <span className="sa-tile-ic" style={{ background:ha(t.c,0.14), color:t.c }}>{t.ic}</span>
              <span className="sa-tile-name">{t.name}</span>
              <span className="sa-tile-desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Companies card list */}
      <div className="sa-sec">
        <div className="sa-sec-head"><span>📋 Companies · 4</span><button className="sa-link" onClick={()=>go("company-data")}>Open →</button></div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {COMPANIES.map(c=>(
            <div key={c.id} className="sa-card" onClick={()=>go("company-data")} style={{ cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:8 }}>
                <span style={{ fontSize:15, fontWeight:600 }}>{c.name}</span><Badge s={c.status} />
              </div>
              <div className="sa-meta">
                <div className="sa-meta-row"><span>Industry</span><b>{c.industry}</b></div>
                <div className="sa-meta-row"><span>Employees</span><b>{c.employees}</b></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {matrix && (
        <Sheet title="Role-Based Access Control" onClose={()=>setMatrix(false)}>
          <div style={{ fontSize:11.5, color:"var(--t2)", marginBottom:12 }}>Scroll horizontally to compare all roles.</div>
          <div style={{ overflowX:"auto", margin:"0 -4px" }}>
            <table className="sa-matrix">
              <thead><tr><th>Section</th>{RBAC_ROLES.map(r=><th key={r}>{r}</th>)}</tr></thead>
              <tbody>
                {RBAC_FULL.map(row=>(
                  <tr key={row[0]}>
                    <td className="sec">{row[0]}</td>
                    {row.slice(1).map((v,i)=>(
                      <td key={i}>{v==="Full"?<span className="sa-full">✓</span>:v==="View"?<span className="sa-view">👁</span>:<span className="sa-dash">—</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ── empty / company-gated / profile placeholders ───────────────────────────────
function CompanyGate({ label }){ return (
  <div className="sa-screen">
    <div className="sa-card" style={{ marginBottom:14 }}>
      <Field label="Company"><select className={inputCls}><option>Select a company…</option><option>Ally Wired Soft Solutions</option><option>Reliance Industries</option></select></Field>
    </div>
    <div className="sa-info">ℹ️ Select a company to load its {label}.</div>
  </div>
);}
function Profile(){ return (
  <div className="sa-screen">
    <div className="sa-card" style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
      <div className="sa-avatar lg">S</div>
      <div><div style={{ fontSize:18, fontWeight:700 }}>superadmin</div><div style={{ fontSize:12.5, color:"var(--t2)" }}>testemail@gmail.com</div><span className="sa-role" style={{ marginTop:6, display:"inline-block" }}>SUPER ADMIN</span></div>
    </div>
    <Field label="Full Name"><input className={inputCls} defaultValue="superadmin" /></Field>
    <Field label="Email Address"><input className={inputCls} defaultValue="testemail@gmail.com" /></Field>
    <button className="sa-btn">Save Changes</button>
  </div>
);}
function CxoMetrics(){
  const [metricOpen,setMetricOpen] = sUse(false);
  const [defOpen,setDefOpen] = sUse(false);
  const [co,setCo] = sUse("");
  return (
    <div className="sa-screen">
      <div className="sa-sec">
        <div className="sa-sec-head"><span>📈 CXO Metrics Mapping</span><button className="sa-add" onClick={()=>setMetricOpen(true)}>+ Metric mapping</button></div>
        <div style={{ fontSize:11.5, color:"var(--t2)", marginBottom:10 }}>Configure how Productivity, Engagement &amp; Absenteeism are derived from wellness KPIs.</div>
        <div className="sa-card" style={{ marginBottom:10 }}><Field label="Company"><select className={inputCls} value={co} onChange={e=>setCo(e.target.value)}><option value="">Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field></div>
        <div className="sa-info">ℹ️ {co?`No mappings for ${co} yet.`:"Select company to display metrics data."}</div>
      </div>
      <div className="sa-sec">
        <div className="sa-sec-head"><span>🧮 CXO Metric Definitions</span><button className="sa-add" onClick={()=>setDefOpen(true)}>+ Create CXO metric</button></div>
        <div className="sa-info">ℹ️ Create and review the metric master rows backing the configurations above.</div>
      </div>

      {metricOpen && (
        <Sheet title="Create CXO metric" onClose={()=>setMetricOpen(false)} footer={<button className="sa-btn" onClick={()=>setMetricOpen(false)}>💾 Save metric</button>}>
          <div style={{ fontSize:11.5, color:"var(--t2)", marginBottom:12 }}>Configure how a CXO metric is derived from theme-scoped KPIs. Each KPI contributes using its weight.</div>
          <Field label="Company *"><select className={inputCls}><option>Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="CXO metric *"><select className={inputCls}><option>Select…</option>{["Productivity","Engagement","Absenteeism"].map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Themes *"><select className={inputCls}><option>Select…</option>{THEME_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}><span style={{ fontSize:13, fontWeight:800 }}>KPI Mappings</span><button className="sa-add">+ Add KPI</button></div>
          <div className="sa-info">Select one or more themes to load their KPIs.</div>
          <div style={{ fontSize:10.5, color:"var(--t2)", marginTop:8 }}>Weight range 0.1–5 (step 0.1), default 1.</div>
        </Sheet>
      )}
      {defOpen && (
        <Sheet title="Create CXO metric definition" onClose={()=>setDefOpen(false)} footer={<button className="sa-btn" onClick={()=>setDefOpen(false)}>💾 Create metric</button>}>
          <Field label="Company *"><select className={inputCls}><option>Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
          <div style={{ display:"flex", gap:10 }}>
            <Field label="Metric code *"><input className={inputCls} placeholder="PRODUCTIVITY" /></Field>
            <Field label="Display name *"><input className={inputCls} placeholder="Display name" /></Field>
          </div>
          <div style={{ fontSize:10.5, color:"var(--t2)", marginTop:-8, marginBottom:12 }}>Uppercase identifier, max 30 chars.</div>
          <Field label="Description"><textarea className={inputCls} style={{ height:70, padding:"11px 13px", resize:"none" }} /></Field>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}><button className="sa-switch on"><span /></button><span style={{ fontSize:13, fontWeight:600 }}>Active</span></div>
        </Sheet>
      )}
    </div>
  );
}

function RoleAssignments(){
  const [co,setCo] = sUse("");
  const [role,setRole] = sUse("");
  const [tab,setTab] = sUse("Permissions");
  const ready = co && role;
  const assigned = ready ? [["company_users:read","company_users · read"],["departments:read","departments · read"],["themes:read","themes · read"],["kpis:read","kpis · read"]] : [];
  return (
    <div className="sa-screen">
      <div className="sa-card" style={{ marginBottom:14 }}>
        <div style={{ display:"flex", gap:10 }}>
          <Field label="Company"><select className={inputCls} value={co} onChange={e=>setCo(e.target.value)}><option value="">Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Role"><select className={inputCls} value={role} onChange={e=>setRole(e.target.value)} disabled={!co}><option value="">{co?"Select role":"Select a tenant first"}</option>{["Employee","HR Manager","CXO","Company Admin"].map(o=><option key={o}>{o}</option>)}</select></Field>
        </div>
      </div>
      <div className="sa-seg" style={{ marginBottom:14 }}>
        {["Permissions","Policies","Menus"].map(t=> <button key={t} className={"sa-seg-btn"+(tab===t?" on":"")} onClick={()=>setTab(t)}>{t}</button>)}
      </div>
      {!ready && <div className="sa-info">ℹ️ Pick a tenant and role to enable assignments.</div>}
      {ready && (
        <>
          <div className="sa-card" style={{ marginBottom:12 }}>
            <Field label={tab}><select className={inputCls}><option>Search {tab.toLowerCase()}…</option></select></Field>
            {tab==="Menus" && <Field label="Default access level"><select className={inputCls}><option>view</option><option>full</option></select></Field>}
            {tab==="Permissions" && <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}><button className="sa-switch"><span /></button><span style={{ fontSize:12.5, color:"var(--t2)" }}>Override existing permissions</span></div>}
            <div style={{ display:"flex", gap:10, marginTop:6 }}><button className="sa-btn" style={{ flex:1 }}>+ Add to role</button><button className="sa-btn ghost danger" style={{ flex:1 }}>− Remove from role</button></div>
          </div>
          <div style={{ fontSize:13, fontWeight:800, marginBottom:4 }}>Currently assigned</div>
          <div style={{ fontSize:11, color:"var(--t2)", marginBottom:10 }}>{tab} already attached to this role.</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {assigned.map(([n,sub])=>(
              <div key={n} className="sa-card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div><div style={{ fontSize:13, fontWeight:700 }}>{n}</div><div style={{ fontSize:10.5, color:"var(--t2)" }}>{sub}</div></div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}><Badge s="Active" /><span style={{ color:"var(--danger)", cursor:"pointer" }}>🗑</span></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RolesScreen(){
  const [co,setCo] = sUse("");
  const [add,setAdd] = sUse(false);
  const [perm,setPerm] = sUse(null);
  const [menus,setMenus] = sUse(null);
  const rows = co ? [
    { id:9, name:"Employee" },{ id:10, name:"HR Manager" },{ id:11, name:"CXO" },{ id:12, name:"Company Admin" },
  ] : [];
  return (
    <div className="sa-screen">
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
        <button className="sa-add" onClick={()=>setAdd(true)}>+ Add Role</button>
      </div>
      <div className="sa-card" style={{ marginBottom:12 }}>
        <Field label="Company"><select className={inputCls} value={co} onChange={e=>setCo(e.target.value)}><option value="">Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
      </div>
      {!co && <div className="sa-info">ℹ️ Select a tenant to load roles.</div>}
      {co && (
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          {rows.map(r=>(
            <div key={r.id} className="sa-card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div><div style={{ fontSize:15, fontWeight:600 }}>{r.name}</div><div style={{ fontSize:11, color:"var(--t2)", marginTop:2 }}>ID {r.id} · {co}</div></div>
                <Badge s="Active" />
              </div>
              <div className="sa-actions">
                <button onClick={()=>setPerm(r)}>🔑 Permissions</button>
                <button onClick={()=>setMenus(r)}>📑 Menus</button>
                <button>✏️ Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {add && (
        <Sheet title="Add Role" onClose={()=>setAdd(false)} footer={<button className="sa-btn" onClick={()=>setAdd(false)}>💾 Create Role</button>}>
          <Field label="Role Name"><input className={inputCls} placeholder="Role Name" /></Field>
          <Field label="Company"><select className={inputCls} defaultValue={co}><option value="">Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}><button className="sa-switch on"><span /></button><span style={{ fontSize:13, fontWeight:600 }}>Role is active</span></div>
        </Sheet>
      )}
      {perm && (
        <Sheet title="Role Permissions" onClose={()=>setPerm(null)} footer={<button className="sa-btn ghost" onClick={()=>setPerm(null)}>Close</button>}>
          <div style={{ fontSize:11.5, color:"var(--t2)", marginBottom:12 }}>{perm.name}</div>
          {["challenges:read","sessions:read","platform:read","platform:create","platform:update","platform:delete"].map(p=>(
            <div key={p} className="sa-card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div><div style={{ fontSize:13, fontWeight:700 }}>{p}</div><div style={{ fontSize:10.5, color:"var(--t2)" }}>{p.replace(":"," · ")}</div></div>
              <Badge s="Active" />
            </div>
          ))}
        </Sheet>
      )}
      {menus && (
        <Sheet title="Role Menus" onClose={()=>setMenus(null)} footer={<button className="sa-btn ghost" onClick={()=>setMenus(null)}>Close</button>}>
          <div style={{ fontSize:11.5, color:"var(--t2)", marginBottom:12 }}>{menus.name}</div>
          {[["Challenges","challenges · /super-admin/challenges","View"],["My Profile","profile · /profile","Full"]].map(([n,sub,acc])=>(
            <div key={n} className="sa-card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div><div style={{ fontSize:13, fontWeight:700 }}>{n}</div><div style={{ fontSize:10.5, color:"var(--t2)" }}>{sub}</div></div>
              <span className="sa-badge" style={{ background:acc==="Full"?"#e7f3ea":"var(--inset)", color:acc==="Full"?"#2f7d4f":"var(--t2)" }}>{acc}</span>
            </div>
          ))}
        </Sheet>
      )}
    </div>
  );
}

function WellnessDimensions(){
  const [co,setCo] = sUse("");
  const [addKpi,setAddKpi] = sUse(false);
  const [createDim,setCreateDim] = sUse(false);
  return (
    <div className="sa-screen">
      <div className="sa-sec">
        <div className="sa-sec-head"><span>🌱 Dimension KPI Mappings</span><button className="sa-add" onClick={()=>setAddKpi(true)}>+ Add KPI</button></div>
        <div style={{ fontSize:11.5, color:"var(--t2)", marginBottom:10 }}>Click a dimension to view its KPI mappings; use "Add KPI" to assign a KPI to any dimension.</div>
        <div className="sa-card" style={{ marginBottom:10 }}><Field label="Company"><select className={inputCls} value={co} onChange={e=>setCo(e.target.value)}><option value="">Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field></div>
        <div className="sa-info">ℹ️ {co?`No KPI mappings for ${co} yet.`:"Select a company above to view its wellness dimensions."}</div>
      </div>
      <div className="sa-sec">
        <div className="sa-sec-head"><span>🧭 Wellness Dimensions</span><button className="sa-add" onClick={()=>setCreateDim(true)}>+ Create dimension</button></div>
        <div style={{ fontSize:11.5, color:"var(--t2)", marginBottom:10 }}>Platform-level dimension taxonomy. Display order controls the dimension picker.</div>
        <div className="sa-info">ℹ️ No wellness dimensions yet. Click "Create dimension" to add one.</div>
      </div>

      {addKpi && (
        <Sheet title="Add KPIs to dimension" onClose={()=>setAddKpi(false)} footer={<button className="sa-btn" onClick={()=>setAddKpi(false)}>💾 Add KPI</button>}>
          <div style={{ fontSize:11.5, color:"var(--t2)", marginBottom:12 }}>Pick a company, dimension, and one or more themes. The KPI list is filtered by the selected themes. Weight &amp; display order apply to every KPI selected.</div>
          <Field label="Company *"><select className={inputCls}><option>Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Dimension *"><select className={inputCls}><option>Select a company first.</option></select></Field>
          <Field label="Themes"><select className={inputCls}><option>Select a company first.</option></select></Field>
          <Field label="KPIs *"><select className={inputCls}><option>Select a company first.</option></select></Field>
          <div style={{ display:"flex", gap:10 }}>
            <Field label="Weight *"><input className={inputCls} type="number" defaultValue={1} /></Field>
            <Field label="Display order"><input className={inputCls} type="number" defaultValue={0} /></Field>
          </div>
          <div style={{ fontSize:10.5, color:"var(--t2)" }}>Weight must be greater than 0. Lower display values render first.</div>
        </Sheet>
      )}
      {createDim && (
        <Sheet title="Create dimension" onClose={()=>setCreateDim(false)} footer={<button className="sa-btn" onClick={()=>setCreateDim(false)}>💾 Create dimension</button>}>
          <div style={{ fontSize:11.5, color:"var(--t2)", marginBottom:12 }}>The key is slugified (lowercase, spaces→underscores). "wellnessindex" is reserved.</div>
          <Field label="Company *"><select className={inputCls}><option>Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Key *"><input className={inputCls} placeholder="Physical Wellness" /></Field>
          <div style={{ fontSize:10.5, color:"var(--t2)", marginTop:-8, marginBottom:12 }}>Lowercase, no spaces. The backend slugifies this.</div>
          <Field label="Display label *"><input className={inputCls} placeholder="Display label" /></Field>
          <Field label="Display order"><input className={inputCls} type="number" defaultValue={0} /></Field>
        </Sheet>
      )}
    </div>
  );
}

function DepartmentsScreen(){
  const [co,setCo] = sUse("");
  const [q,setQ] = sUse("");
  const [status,setStatus] = sUse("Active");
  const [add,setAdd] = sUse(false);
  const all = co ? [
    { name:"Administration", desc:"Office administration and facilities" },
    { name:"Customer Support", desc:"Customer success and support" },
    { name:"Engineering", desc:"Software engineering and product development" },
    { name:"Finance", desc:"Finance, accounting, payroll" },
    { name:"Human Resources", desc:"HR, recruiting, people operations" },
    { name:"Legal", desc:"Legal, compliance, risk" },
    { name:"Marketing", desc:"Marketing, brand, growth" },
    { name:"Operations", desc:"Business operations and support" },
    { name:"Product", desc:"Product management and design" },
  ] : [];
  const rows = all.filter(d=>!q||JSON.stringify(d).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="sa-screen">
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
        <button className="sa-add" onClick={()=>setAdd(true)}>+ Add Department</button>
      </div>
      <div className="sa-card" style={{ marginBottom:12 }}>
        <Field label="Company"><select className={inputCls} value={co} onChange={e=>setCo(e.target.value)}><option value="">Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
        {co && (
          <>
            <div className="sa-search" style={{ marginBottom:12 }}><span style={{ color:"var(--t3)" }}>🔍</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" /></div>
            <Field label="Status"><select className={inputCls} value={status} onChange={e=>setStatus(e.target.value)}><option>Active</option><option>Inactive</option></select></Field>
          </>
        )}
      </div>
      {!co && <div className="sa-info">ℹ️ Select a company to load its departments.</div>}
      {co && (
        <>
          <div style={{ fontSize:12, color:"var(--t2)", fontWeight:600, margin:"2px 2px 10px" }}>Total departments: {rows.length}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {rows.map(d=>(
              <div key={d.name} className="sa-card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <span style={{ fontSize:15, fontWeight:600 }}>{d.name}</span><Badge s="Active" />
                </div>
                <div style={{ fontSize:12.5, color:"var(--t2)", marginBottom:10 }}>{d.desc}</div>
                <div className="sa-actions"><button>✏️ Edit</button><button className="del">🗑 Delete</button></div>
              </div>
            ))}
          </div>
        </>
      )}
      {add && (
        <Sheet title="Add Department" onClose={()=>setAdd(false)} footer={<button className="sa-btn" onClick={()=>setAdd(false)}>💾 Create</button>}>
          <Field label="Company *"><select className={inputCls} defaultValue={co}><option value="">Select…</option>{COMPANY_OPTS.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Name *"><input className={inputCls} placeholder="Name" /></Field>
          <Field label="Description"><textarea className={inputCls} style={{ height:70, padding:"11px 13px", resize:"none" }} placeholder="Description" /></Field>
        </Sheet>
      )}
    </div>
  );
}

function Simple({ kind }){
  if(kind==="cxo") return <CxoMetrics />;
  if(kind==="assignments") return <RoleAssignments />;
  if(kind==="roles") return <RolesScreen />;
  if(kind==="dimensions") return <WellnessDimensions />;
  if(kind==="departments") return <DepartmentsScreen />;
  if(kind==="profile") return <Profile />;
  return <div className="sa-screen"><div className="sa-info">ℹ️ {TITLES[kind]||kind} — mobile screen scaffolded. Tap a Quick Manage tile or use the same card + filter + form patterns shown on Companies, Sessions and KPIs.</div></div>;
}

// ── shell ──────────────────────────────────────────────────────────────────────

// Slug → screen. Mount this from SuperAdminApp's content map.
const LIST_KINDS = ["company-data","sessions","kpis","challenges","questions","themes","suggestions","company-users","policies","permissions","menus","mapping","kpi-suggestion-mapping"];
const SLUG_ALIAS = { "suggestion-master":"suggestions", "kpi-suggestion-mapping":"mapping", "role-assignments":"assignments", "cxo-metrics":"cxo", "wellness-dimensions":"dimensions" };

export default function SuperAdminMasters({ slug = "dashboard" }) {
  injectSaCss();
  const navigate = useNavigate();
  const go = (id) => {
    const map = {
      "company-data":"/super-admin/company-data", "company-users":"/super-admin/company-users",
      themes:"/super-admin/themes", questions:"/super-admin/questions", challenges:"/super-admin/challenges",
      suggestions:"/super-admin/suggestion-master", sessions:"/super-admin/sessions", kpis:"/super-admin/kpis",
      mapping:"/super-admin/kpi-suggestion-mapping", roles:"/super-admin/roles", permissions:"/super-admin/permissions",
      policies:"/super-admin/policies", assignments:"/super-admin/role-assignments", cxo:"/super-admin/cxo-metrics",
      dimensions:"/super-admin/wellness-dimensions", menus:"/super-admin/menus", users:"/super-admin/company-users",
    };
    if (map[id]) navigate(map[id]);
  };
  const kind = SLUG_ALIAS[slug] || slug;
  if (kind === "dashboard") return <Dashboard go={go} />;
  if (LIST_KINDS.includes(kind)) return <ListScreen kind={kind} />;
  if (kind === "cxo") return <CxoMetrics />;
  if (kind === "assignments") return <RoleAssignments />;
  if (kind === "roles") return <RolesScreen />;
  if (kind === "dimensions") return <WellnessDimensions />;
  if (kind === "departments") return <DepartmentsScreen />;
  return <Simple kind={kind} />;
}
