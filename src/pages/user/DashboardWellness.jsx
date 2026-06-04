import { useEffect, useMemo, useState } from "react";
import { Alert, Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { dimHue } from "../../components/mobile/dimensionColors";
import {
  fetchDashboardKpis,
  fetchSessionSuggestions,
  fetchWellnessTrends,
} from "../../store/dashboardSlice";
import { fetchMySubmissions } from "../../store/sessionSlice";

// ── Dark brand palette (restored from v8) ────────────────────────────────────
const C = {
  bg:      "#0b160c",
  card:    "#111e12",
  border:  "#1e3d20",
  g1:      "#2C5F2D",
  g2:      "#4A8C2A",
  g3:      "#6DB33F",
  g4:      "#97C95C",
  white:   "#FFFFFF",
  cream:   "#E8F0E0",
  muted:   "#6B8F60",
  orange:  "#E8924A",
  blue:    "#4A90C4",
  purple:  "#8B6FCB",
  gold:    "#D4A843",
  teal:    "#3AADA8",
  red:     "#E05050",
  pink:    "#f472b6",
};

const METRIC_COLOR_SET = [
  "#7c6af7","#f97316","#6DB33F","#38bdf8",
  "#f472b6","#4A90C4","#22c55e","#D4A843",
  "#E05050","#3AADA8",
];

const DIMENSION_EMOJI = {
  nidra:"🌙", manas:"🧠", aahar:"🥗",
  vihara:"🌅", charya:"🌄", ojas:"⚡",
};
const dimEmoji = (label="") => {
  const slug = String(label).toLowerCase().trim().split(/[\s·]+/)[0];
  return DIMENSION_EMOJI[slug] || "🌿";
};

const SUGGESTION_TYPE_COLORS = {
  aahar:"#16a34a", vihara:"#2563eb", nidra:"#7c3aed",
  charya:"#f59e0b", manas:"#c026d3", ojas:"#0f766e",
};

const formatMetricLabel = (name="") =>
  name.replace(/\bKPI\b/gi,"").replace(/\s+/g," ").trim() || "Wellness KPI";
const clampPercent = (value) => { const n=Number(value); if(!Number.isFinite(n)) return 0; return Math.min(100,Math.max(0,n)); };
const formatChange = (value) => { const n=Number(value); if(!Number.isFinite(n)) return "No trend"; return `${n>=0?"+":""}${n.toFixed(0)}%`; };
const getMetricColor = (index) => METRIC_COLOR_SET[index % METRIC_COLOR_SET.length];
const getSuggestionColor = (type, index) =>
  SUGGESTION_TYPE_COLORS[String(type||"").toLowerCase()] || METRIC_COLOR_SET[index % METRIC_COLOR_SET.length];

// ── Shared card wrapper ───────────────────────────────────────────────────────
function ClientCard({ children, style={}, borderColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card,
        border: `1px solid ${borderColor || C.border}`,
        borderRadius: 14,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        ...style,
      }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.borderColor=(borderColor||C.g3)+"88"; e.currentTarget.style.transform="translateY(-1px)"; } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.borderColor=borderColor||C.border; e.currentTarget.style.transform=""; } : undefined}
    >
      {children}
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ values=[], color=C.g3, w=74, h=16 }) {
  if (!Array.isArray(values) || values.length < 2) return <svg width={w} height={h} />;
  const mn=Math.min(...values)-0.2, mx=Math.max(...values)+0.2, range=mx-mn||1;
  const pts=values.map((v,i)=>[(i/(values.length-1))*w, h-((v-mn)/range)*h]);
  const line=pts.map(([x,y])=>`${x},${y}`).join(" ");
  const area=`${pts[0][0]},${h} ${line} ${pts[pts.length-1][0]},${h}`;
  return (
    <svg width={w} height={h} style={{overflow:"visible",display:"block"}}>
      <polygon points={area} fill={color} opacity="0.1"/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.4" fill={color}/>
    </svg>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function computeDonutArcs(slices) {
  const total=slices.reduce((a,s)=>a+(Number(s.v)||0),0)||1;
  let cursor=-Math.PI/2;
  return slices.map(s => { const sw=((Number(s.v)||0)/total)*2*Math.PI; const arc={slice:s,start:cursor,end:cursor+sw,sw}; cursor+=sw; return arc; });
}

function DonutChart({ slices, size=130, cVal, cSub }) {
  if (!slices||!slices.length) return <svg width={size} height={size}/>;
  const cx=size/2, cy=size/2, r=size/2-10, ir=size/2-30;
  const arcs=computeDonutArcs(slices);
  return (
    <svg width={size} height={size}>
      {arcs.map(({slice:s,start,end,sw},i) => {
        const x1=cx+r*Math.cos(start),y1=cy+r*Math.sin(start);
        const x2=cx+r*Math.cos(end),  y2=cy+r*Math.sin(end);
        const ix1=cx+ir*Math.cos(start),iy1=cy+ir*Math.sin(start);
        const ix2=cx+ir*Math.cos(end),  iy2=cy+ir*Math.sin(end);
        const lg=sw>Math.PI?1:0;
        return <path key={`${s.l}-${i}`} d={`M${ix1},${iy1}L${x1},${y1}A${r},${r} 0 ${lg},1 ${x2},${y2}L${ix2},${iy2}A${ir},${ir} 0 ${lg},0 ${ix1},${iy1}Z`} fill={s.c} stroke={C.bg} strokeWidth="2"/>;
      })}
      {cVal!=null && <>
        <text x={cx} y={cy-4} textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">{cVal}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fontSize="9" fill={C.muted}>{cSub}</text>
      </>}
    </svg>
  );
}

// ── Wellness ring ─────────────────────────────────────────────────────────────
function WellnessRing({ score=0, color=C.g3, size=136 }) {
  const sw=11, r=(size-sw)/2, cx=size/2, cy=size/2;
  const circ=2*Math.PI*r, pct=Math.min(100,Math.max(0,score))/100;
  return (
    <svg width={size} height={size} style={{display:"block"}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(109,179,63,0.14)" strokeWidth={sw}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
        transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dashoffset 0.6s ease"}}/>
    </svg>
  );
}

function wellnessStatus(score) {
  if (score>=85) return {label:"Excellent",   color:"#4ade80"};
  if (score>=70) return {label:"Great",        color:"#86efac"};
  if (score>=55) return {label:"Good",         color:C.g3};
  if (score>=40) return {label:"Fair",         color:C.gold};
  return              {label:"Needs Attention",color:"#f87171"};
}

// ── Trend line (single averaged line) ────────────────────────────────────────
function TrendLine({ vals=[], labels=[], color=C.g3, h=100 }) {
  if (vals.length < 2) {
    return (
      <div style={{height:h,display:"grid",placeItems:"center",color:C.muted,fontSize:10,
        border:"1px dashed rgba(255,255,255,0.08)",borderRadius:8}}>
        No trend data yet
      </div>
    );
  }
  const W=460,H=h;
  const mn=Math.min(...vals),mx=Math.max(...vals);
  const pad=(mx-mn)*0.15||0.5, lo=mn-pad, hi=mx+pad;
  const px=i=>16+(i/(vals.length-1))*(W-32);
  const py=v=>8+((hi-v)/(hi-lo))*(H-18);
  const pts=vals.map((v,i)=>[px(i),py(v)]);
  const line=pts.map(([x,y])=>`${x},${y}`).join(" ");
  const area=`${pts[0][0]},${H} ${line} ${pts[pts.length-1][0]},${H}`;
  const baseY=py(vals[0]);
  const step=Math.ceil(labels.length/6)||1;
  return (
    <svg width="100%" height={H+14} viewBox={`0 0 ${W} ${H+14}`} preserveAspectRatio="none" style={{overflow:"visible"}}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
        </linearGradient>
      </defs>
      <line x1={16} y1={baseY} x2={W-16} y2={baseY} stroke="rgba(109,179,63,0.2)" strokeWidth="1" strokeDasharray="4 4" strokeLinecap="round"/>
      <polygon points={area} fill="url(#trendGrad)"/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="8" fill={color} opacity="0.15"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill={color}/>
      {labels.map((l,i)=>({l,i})).filter(({i})=>i%step===0).map(({l,i})=>(
        <text key={`lbl-${i}`} x={px(i)} y={H+12} fontSize="8" fill="rgba(109,179,63,0.5)" textAnchor="middle">{l}</text>
      ))}
    </svg>
  );
}

// ── KPI tile ──────────────────────────────────────────────────────────────────
function KpiTile({ item, sparkValues, onClick }) {
  const trend=item.change==="No trend"?null:item.change;
  const trendPos=trend&&trend.startsWith("+");
  return (
    <div onClick={onClick} style={{
      minWidth:96, flexShrink:0, textAlign:"center",
      background: "rgba(255,255,255,0.03)",
      border:`1px solid ${item.color}44`,
      borderRadius:12, padding:"12px 8px",
      cursor:onClick?"pointer":"default", transition:"all 0.2s",
    }}>
      <div style={{fontSize:20,marginBottom:4}}>{item.emoji}</div>
      <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:600,marginBottom:4,
        overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}
        title={item.label}>
        {item.label}
      </div>
      <div style={{fontSize:18,fontWeight:800,color:item.color,lineHeight:1,marginBottom:4}}>
        {Number(item.score).toFixed(1)}
      </div>
      <div style={{fontSize:10,fontWeight:700,marginBottom:4,
        color:trend?(trendPos?"#4ade80":"#f87171"):"rgba(255,255,255,0.3)"}}>
        {trend?`${trendPos?"▲":"▼"} ${trend.replace(/^[+-]/,"")}`:"—"}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}>
        <Sparkline values={sparkValues} color={item.color} w={68} h={16}/>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardWellness() {
  const dispatch = useDispatch();
  const [trendsPeriod, setTrendsPeriod] = useState("weekly");
  const [moodIndex, setMoodIndex] = useState(null);

  const {
    items: dashboardItems,
    loading: dashboardLoading,
    error: dashboardError,
    suggestions,
    suggestionsLoading,
    suggestionsError,
    trends,
    trendsLoading,
    trendsError,
  } = useSelector((state) => state.dashboard);
  const { mySubmissions } = useSelector((state) => state.session);

  useEffect(() => { dispatch(fetchDashboardKpis()); dispatch(fetchMySubmissions()); }, [dispatch]);
  useEffect(() => { dispatch(fetchWellnessTrends({ period: trendsPeriod })); }, [dispatch, trendsPeriod]);

  const latestSubmissionSessionId = useMemo(() => mySubmissions?.[0]?.session_id || "", [mySubmissions]);
  useEffect(() => { if (!latestSubmissionSessionId) return; dispatch(fetchSessionSuggestions(latestSubmissionSessionId)); }, [dispatch, latestSubmissionSessionId]);

  const metrics = useMemo(() =>
    dashboardItems.map((item) => {
      const label = formatMetricLabel(item.kpi_name);
      return {
        kpiKey: item.kpi_key ?? null,
        kpiName: item.kpi_name || "",
        label,
        score: Number(item.latest_score) || 0,
        progress: clampPercent(item.latest_score),
        change: formatChange(item.trend_percent),
        color: dimHue(item.kpi_name),
        emoji: dimEmoji(label),
      };
    }), [dashboardItems]);

  const sparkValuesByKpi = useMemo(() => {
    const map = {};
    (trends.series || []).forEach((s) => {
      const vals = (s.points || []).map((p) => Number(p.average_score) || 0);
      if (s.kpi_key != null) map[`key:${s.kpi_key}`] = vals;
      if (s.kpi_name) map[`name:${s.kpi_name}`] = vals;
    });
    return map;
  }, [trends.series]);

  const getSparkValues = (metric) =>
    (metric.kpiKey != null && sparkValuesByKpi[`key:${metric.kpiKey}`]) ||
    (metric.kpiName && sparkValuesByKpi[`name:${metric.kpiName}`]) || [];

  const suggestionItems = useMemo(() =>
    Array.isArray(suggestions?.items) ? suggestions.items : [], [suggestions]);

  const suggestionTierLabels = useMemo(() => {
    const modes = new Set(suggestionItems.flatMap((i) => (i.triggers || []).map((t) => t.trigger_mode)));
    return { hasKpiRisk: modes.has("kpi_risk"), hasQuestionScore: modes.has("question_score") };
  }, [suggestionItems]);

  const latestResponse = useMemo(() => mySubmissions?.[0]?.responses?.[0] || null, [mySubmissions]);

  const overallWellnessScore = useMemo(() => {
    if (!latestResponse) return 0;
    const scores = latestResponse.kpi_scores.map((k) => k.average_score);
    return Number((scores.reduce((a,b)=>a+b,0)/scores.length*20).toFixed(1));
  }, [latestResponse]);

  const trendsMultiSeries = useMemo(() =>
    (trends.series || [])
      .map((s) => ({ id: s.kpi_key??s.kpi_name, c: s.color||C.g3, vals:(s.points||[]).map((p)=>Number(p.average_score)||0) }))
      .filter((s) => s.vals.length >= 2), [trends.series]);

  const trendsLabels = useMemo(() => {
    const first = (trends.series || []).find((s) => (s.points||[]).length);
    return (first?.points || []).map((p) => p.bucket_label || "");
  }, [trends.series]);

  const averagedTrendVals = useMemo(() =>
    trendsMultiSeries.length
      ? trendsMultiSeries[0].vals.map((_,i) =>
          trendsMultiSeries.reduce((s,ser)=>s+(ser.vals[i]??0),0)/trendsMultiSeries.length)
      : [], [trendsMultiSeries]);

  return (
    <Box sx={{
      bgcolor: C.bg,
      color: "#fff",
      borderRadius: 3,
      p: { xs: 1.5, md: 2 },
      fontFamily: "'Plus Jakarta Sans','Outfit','Nunito','Segoe UI',sans-serif",
    }}>
      {dashboardError && <Alert severity="error" sx={{ mb: 1.5 }}>{dashboardError}</Alert>}
      {!dashboardError && dashboardLoading && (
        <Box sx={{ p:1, color:C.muted, fontSize:11 }}>Loading wellness metrics…</Box>
      )}
      {!dashboardError && !dashboardLoading && metrics.length === 0 && (
        <Box sx={{ p:1, color:C.muted, fontSize:11 }}>No KPI metrics available yet.</Box>
      )}

      {/* Section label */}
      <Box sx={{ fontSize:11, fontWeight:700, letterSpacing:0.8, color:C.muted,
        textTransform:"uppercase", mb:"12px" }}>
        Wellness Dimensions · Tap for Details
      </Box>

      {/* KPI Strip */}
      {!dashboardError && !dashboardLoading && metrics.length > 0 && (
        <Box sx={{ display:"flex", flexDirection:"row", gap:"8px", overflowX:"auto",
          paddingBottom:"8px", scrollbarWidth:"none", msOverflowStyle:"none", mb:"18px" }}>
          {metrics.map((item) => (
            <KpiTile key={item.kpiKey??item.label} item={item} sparkValues={getSparkValues(item)}/>
          ))}
        </Box>
      )}

      {/* 3-column grid: Index · Trends · Dosha */}
      <Box sx={{ display:"grid", gridTemplateColumns:{ xs:"1fr", md:"190px 1fr 210px" }, gap:"14px", mb:"16px" }}>

        {/* Wellness Index */}
        <ClientCard>
          <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:12,textAlign:"center"}}>
            Wellness Index
            <div style={{fontSize:7,fontWeight:400,color:C.muted,marginTop:2,letterSpacing:0.5}}>WHO SF-12 · Normalized 0–100</div>
          </div>
          <div style={{position:"relative",display:"flex",justifyContent:"center",alignItems:"center"}}>
            <WellnessRing score={overallWellnessScore} color={C.g3} size={136}/>
            <div style={{position:"absolute",textAlign:"center",pointerEvents:"none"}}>
              <div style={{fontSize:32,fontWeight:800,color:"#fff",lineHeight:1}}>{overallWellnessScore||"—"}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:3,letterSpacing:0.5}}>/ 100</div>
            </div>
          </div>
          {overallWellnessScore>0 && (
            <div style={{textAlign:"center",marginTop:10}}>
              <span style={{fontSize:12,fontWeight:700,color:wellnessStatus(overallWellnessScore).color}}>
                {wellnessStatus(overallWellnessScore).label}
              </span>
            </div>
          )}
          {trends.overall?.delta_percent!=null && trends.overall.delta_percent!==0 && (() => {
            const pos=trends.overall.delta_percent>0;
            return (
              <div style={{textAlign:"center",marginTop:8}}>
                <span style={{background:pos?"#16a34a22":"#f8717122",border:`1px solid ${pos?"#4ade8033":"#f8717133"}`,
                  borderRadius:20,padding:"4px 12px",fontSize:10,fontWeight:700,color:pos?"#4ade80":"#f87171"}}>
                  {pos?"▲":"▼"} {Math.abs(Math.round(trends.overall.delta_percent))}% from baseline
                </span>
              </div>
            );
          })()}
        </ClientCard>

        {/* Wellness Trends */}
        <ClientCard>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:8,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>Wellness Trends</div>
              <div style={{fontSize:9,color:C.muted}}>Bold = most improved recently</div>
            </div>
            <div style={{display:"flex",gap:3,background:"rgba(0,0,0,0.35)",borderRadius:20,padding:3}}>
              {["daily","weekly","monthly"].map((v) => (
                <button key={v} type="button" onClick={()=>setTrendsPeriod(v)} style={{
                  padding:"5px 12px",borderRadius:20,border:"none",fontSize:9,fontWeight:600,cursor:"pointer",
                  background:trendsPeriod===v?C.g3:"transparent",
                  color:trendsPeriod===v?"#fff":"rgba(255,255,255,0.4)",
                  textTransform:"capitalize",transition:"background 0.15s,color 0.15s",
                }}>{v}</button>
              ))}
            </div>
          </div>

          {trendsError && <Alert severity="error" sx={{mb:1}}>{trendsError}</Alert>}

          {trendsLoading && averagedTrendVals.length===0 ? (
            <div style={{height:100,display:"grid",placeItems:"center",color:C.muted,fontSize:10}}>
              Loading wellness trends…
            </div>
          ) : (
            <TrendLine h={100} labels={trendsLabels} color={C.g3} vals={averagedTrendVals}/>
          )}

          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10,alignItems:"center"}}>
            {(trends.top_improvements||[])
              .filter((i)=>i.delta_percent>0).slice(0,2)
              .map((item) => {
                const matched=(trends.series||[]).find((s)=>s.kpi_key===item.kpi_key||s.kpi_name===item.kpi_name);
                const accent=matched?.color||C.g3;
                return (
                  <div key={`${item.kpi_key||item.kpi_name}-imp`} style={{display:"flex",alignItems:"center",gap:4,
                    background:accent+"22",borderRadius:8,padding:"3px 9px"}}>
                    <span style={{fontSize:9,color:accent,fontWeight:700}}>
                      {item.kpi_name} ▲{Math.round(item.delta_percent)}%
                    </span>
                  </div>
                );
              })}
            {trends.insight && <span style={{fontSize:9,color:C.muted}}>{trends.insight}</span>}
          </div>
        </ClientCard>

        {/* Dosha + Mood */}
        <ClientCard>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",color:C.muted,marginBottom:6}}>
            Prakriti · Dosha Balance
          </div>
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
            <DonutChart slices={[{l:"Vata",v:30,c:"#38bdf8"},{l:"Pitta",v:34,c:"#f97316"},{l:"Kapha",v:36,c:"#22c55e"}]} size={108}/>
          </div>
          {[["Vata","#38bdf8",30],["Pitta","#f97316",34],["Kapha","#22c55e",36]].map(([l,col,v]) => (
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:7,height:7,borderRadius:2,background:col,display:"inline-block"}}/>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.55)"}}>{l}</span>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:col}}>{v}%</span>
            </div>
          ))}
          <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontSize:9,color:C.muted,marginBottom:6}}>Today's Mood Check</div>
            <div style={{display:"flex",gap:4,justifyContent:"center"}}>
              {["😞","😕","😐","🙂","😄"].map((em,i) => (
                <button key={em} type="button" onClick={()=>setMoodIndex(moodIndex===i?null:i)} style={{
                  fontSize:20,border:"none",background:moodIndex===i?"rgba(107,179,63,0.3)":"transparent",
                  cursor:"pointer",borderRadius:6,padding:"2px 4px",
                  outline:moodIndex===i?`2px solid ${C.g3}`:"none",transition:"all 0.15s",
                }}>{em}</button>
              ))}
            </div>
            {moodIndex!==null && (
              <div style={{fontSize:9,color:C.g3,textAlign:"center",marginTop:4}}>✓ Mood logged!</div>
            )}
          </div>
        </ClientCard>
      </Box>

      {/* Lifestyle Suggestions */}
      <ClientCard style={{background:"rgba(107,179,63,0.04)"}} borderColor="rgba(107,179,63,0.18)">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:6,flexWrap:"wrap"}}>
          <div style={{fontSize:11,fontWeight:700,color:C.g3}}>🌿 Ayumonk Lifestyle Suggestions — Focus Areas This Week</div>
          <div style={{display:"flex",gap:6}}>
            {suggestionTierLabels.hasKpiRisk && (
              <span style={{fontSize:8,background:"rgba(107,179,63,0.15)",color:C.g3,borderRadius:5,padding:"2px 8px",fontWeight:700}}>
                Tier 1 = KPI risk
              </span>
            )}
            {suggestionTierLabels.hasQuestionScore && (
              <span style={{fontSize:8,background:"rgba(212,168,67,0.15)",color:C.gold,borderRadius:5,padding:"2px 8px",fontWeight:700}}>
                Tier 2 = Question score
              </span>
            )}
          </div>
        </div>

        {suggestionsError && <Alert severity="error" sx={{mb:1}}>{suggestionsError}</Alert>}
        {suggestionsLoading && <div style={{fontSize:10,color:C.muted,padding:"8px 0"}}>Loading lifestyle suggestions…</div>}
        {!suggestionsLoading && suggestionItems.length===0 && (
          <div style={{fontSize:10,color:C.muted,padding:"8px 0"}}>No lifestyle suggestions available yet.</div>
        )}
        {!suggestionsLoading && suggestionItems.length>0 && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
            {suggestionItems.map((item,index) => {
              const accent=getSuggestionColor(item.suggestion_type,index);
              const triggerBadges=(item.triggers||[]).slice().sort((a,b)=>(a.priority||0)-(b.priority||0)).slice(0,2);
              const hasKpiRisk=triggerBadges.some((t)=>t.trigger_mode==="kpi_risk");
              const hasQscore =triggerBadges.some((t)=>t.trigger_mode==="question_score");
              return (
                <div key={item.suggestion_id||item.title} style={{
                  background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"12px 14px",
                  borderLeft:`3px solid ${accent}`,display:"flex",flexDirection:"column",gap:0,
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,gap:6}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#fff"}}>{item.title}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {hasKpiRisk && <span style={{fontSize:7.5,background:"rgba(232,80,80,0.12)",color:"#f87171",borderRadius:4,padding:"1px 6px",fontWeight:700}}>T1 · KPI risk</span>}
                      {hasQscore  && <span style={{fontSize:7.5,background:"rgba(212,168,67,0.15)",color:C.gold,borderRadius:4,padding:"1px 6px",fontWeight:700}}>T2 · Q flagged</span>}
                    </div>
                  </div>
                  {!!(item.description||item.body) && (
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.55,marginBottom:10}}>
                      {item.description||item.body}
                    </div>
                  )}
                  {triggerBadges.length>0 && (
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                      {triggerBadges.map((trig,ti) => (
                        <span key={`${item.suggestion_id}-trig-${ti}`} style={{fontSize:7.5,background:"rgba(212,168,67,0.1)",color:C.gold,borderRadius:4,padding:"1px 6px",border:"1px solid rgba(212,168,67,0.25)"}}>
                          ⚡ {trig.trigger_mode==="kpi_risk"
                            ? `${trig.kpi_display_name||trig.kpi_key} · ${trig.risk_level||"risk"}`
                            : `${(trig.question_text||trig.question_key||"").slice(0,28)}${(trig.question_text||"").length>28?"…":""} (${trig.question_score||0})`}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,marginTop:"auto",paddingTop:4}}>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {!!item.duration_mins && <span style={{fontSize:9,background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.55)",borderRadius:99,padding:"2px 8px",fontWeight:600}}>{item.duration_mins} min</span>}
                      {item.suggestion_type && <span style={{fontSize:9,background:accent+"18",color:accent,borderRadius:99,padding:"2px 8px",fontWeight:700,textTransform:"uppercase",letterSpacing:0.3}}>{item.suggestion_type}</span>}
                      {item.difficulty && <span style={{fontSize:9,background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.55)",borderRadius:99,padding:"2px 8px",fontWeight:600}}>{item.difficulty}</span>}
                    </div>
                    <button type="button" style={{fontSize:9,fontWeight:700,color:C.g3,background:"transparent",border:`1px solid ${C.g3}`,borderRadius:99,padding:"3px 10px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                      Add to plan →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ClientCard>
    </Box>
  );
}
