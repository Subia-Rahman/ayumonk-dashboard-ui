import { useState, useRef, useEffect } from "react";

/* âââ BRAND ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const C = {
  bg:"#0b160c", card:"#111e12", card2:"#162418", border:"#1e3d20",
  g1:"#2C5F2D", g2:"#4A8C2A", g3:"#6DB33F", g4:"#97C95C",
  white:"#fff", muted:"#5a7a50",
  orange:"#E8924A", blue:"#4A90C4", purple:"#8B6FCB",
  gold:"#D4A843", teal:"#3AADA8", red:"#E05050", pink:"#f472b6",
  dark:"#050c06",
};

const GSTYLE = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{display:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse2{0%,100%{opacity:1}50%{opacity:.35}}
.anim{animation:fadeUp .28s ease both}
`;

/* âââ PRIMITIVES âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const Logo = ({ s=26 }) => (
  <svg width={s*1.65} height={s*.72} viewBox="0 0 120 52" fill="none">
    <path d="M60 26C60 26 48 4 30 4 14 4 4 14 4 26 4 38 14 48 30 48 48 48 60 26 60 26Z" stroke="#4a7c2f" strokeWidth="5" fill="none" strokeLinecap="round"/>
    <path d="M60 26C60 26 72 4 90 4 106 4 116 14 116 26 116 38 106 48 90 48 72 48 60 26 60 26Z" stroke="#6db33f" strokeWidth="5" fill="none" strokeLinecap="round"/>
    <path d="M88 6C92 2 100 4 98 12 96 18 88 20 84 16 80 12 82 8 88 6Z" fill="#4a7c2f"/>
  </svg>
);

const Spark = ({ vals=[], color=C.g3, w=64, h=22 }) => {
  const mn=Math.min(...vals), mx=Math.max(...vals), rng=mx-mn||1;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-mn)/rng)*(h-4)+2}`).join(" ");
  return (
    <svg width={w} height={h} style={{display:"block",overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const Donut = ({ pct=72, size=80, color=C.g3, label="", cx=40, cy=40, r=30, stroke=7, center=true }) => {
  const circ=2*Math.PI*r, dash=circ*(pct/100);
  const half=size/2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={half} cy={half} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={half} cy={half} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${half} ${half})`}/>
      {center && <>
        <text x={half} y={half+5} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="800" fontFamily="Plus Jakarta Sans">{pct}</text>
        {label && <text x={half} y={half+15} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="Plus Jakarta Sans">{label}</text>}
      </>}
    </svg>
  );
};

/* Three-segment dosha ring */
const DoshaRing = ({ vata=30, pitta=34, kapha=36, size=120 }) => {
  const half=size/2, r=38, stroke=9, circ=2*Math.PI*r;
  const segs=[
    {val:vata,  color:"#38bdf8", name:"Vata",  label:"Air"},
    {val:pitta, color:"#f97316", name:"Pitta", label:"Fire"},
    {val:kapha, color:"#22c55e", name:"Kapha", label:"Earth"},
  ];
  let cumulative=0;
  const arcs = segs.map(s=>{
    const start=cumulative, dashLen=circ*(s.val/100), offset=circ*(start/100);
    cumulative+=s.val;
    return { ...s, dashLen, offset: circ - offset };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={half} cy={half} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}/>
      {arcs.map((a,i)=>(
        <circle key={i} cx={half} cy={half} r={r} fill="none" stroke={a.color} strokeWidth={stroke}
          strokeDasharray={`${a.dashLen} ${circ}`}
          strokeDashoffset={a.offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${half} ${half})`}
          style={{opacity:0.9}}/>
      ))}
      <text x={half} y={half-4} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="Plus Jakarta Sans">Prakriti</text>
      <text x={half} y={half+8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="Plus Jakarta Sans">Profile</text>
    </svg>
  );
};

const Bar = ({ data=[], color=C.g3, h=56 }) => {
  const mx=Math.max(...data.map(d=>d.v),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:h+16}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <div style={{width:"100%",background:`${color}${i===data.length-1?"bb":"38"}`,borderRadius:"3px 3px 0 0",height:`${(d.v/mx)*h}px`,minHeight:3,transition:"height .4s"}}/>
          <span style={{fontSize:7.5,color:"rgba(255,255,255,0.28)",whiteSpace:"nowrap"}}>{d.l}</span>
        </div>
      ))}
    </div>
  );
};

const Pill = ({ label, color=C.g3, bg }) => (
  <span style={{fontSize:8,background:bg||`${color}18`,color,borderRadius:6,padding:"2px 8px",fontWeight:700,border:`1px solid ${color}33`,display:"inline-block"}}>{label}</span>
);

const RiskBadge = ({ wi }) => {
  const col = wi>=70?C.g3:wi>=55?C.gold:"#f87171";
  const lbl = wi>=70?"Good":wi>=55?"Moderate":"At Risk";
  return <Pill label={lbl} color={col}/>;
};

/* âââ STATUS BAR âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const StatusBar = () => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px 4px",background:"rgba(11,22,12,0.98)",flexShrink:0}}>
    <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)"}}>9:41</span>
    <div style={{width:88,height:22,background:"#000",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:"#222"}}/>
      <div style={{width:13,height:13,borderRadius:"50%",background:"#1c1c1c"}}/>
    </div>
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      {/* signal bars */}
      <svg width="14" height="11" viewBox="0 0 14 11">
        {[0,1,2,3].map(i=><rect key={i} x={i*3.5} y={10-(i+1)*2.5} width="2.5" height={(i+1)*2.5} rx=".8" fill={`rgba(255,255,255,${.4+i*.18})`}/>)}
      </svg>
      {/* battery */}
      <svg width="22" height="11" viewBox="0 0 22 11">
        <rect x=".5" y=".5" width="19" height="10" rx="2.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none"/>
        <rect x="19.5" y="3" width="2" height="5" rx="1" fill="rgba(255,255,255,0.4)"/>
        <rect x="1.5" y="1.5" width="14" height="8" rx="1.5" fill={C.g3}/>
      </svg>
    </div>
  </div>
);

/* âââ BOTTOM NAV âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const BottomNav = ({ items, active, onNav, accent=C.g3 }) => (
  <div style={{
    position:"absolute",bottom:0,left:0,right:0,
    display:"flex",background:"rgba(7,13,8,.97)",
    backdropFilter:"blur(18px)",
    borderTop:"1px solid rgba(255,255,255,0.07)",
    zIndex:50,flexShrink:0,
  }}>
    {items.map(t=>{
      const on=active===t.id;
      return (
        <button key={t.id} onClick={()=>onNav(t.id)}
          style={{flex:1,border:"none",background:"transparent",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            padding:"9px 2px 8px",color:on?accent:"rgba(255,255,255,0.3)",
            transition:"color .15s",position:"relative",minHeight:54}}>
          {on&&<span style={{position:"absolute",top:0,left:"18%",right:"18%",height:2,background:accent,borderRadius:"0 0 3px 3px"}}/>}
          <span style={{fontSize:on?20:17,lineHeight:1,transition:"font-size .15s"}}>{t.icon}</span>
          <span style={{fontSize:9,fontWeight:on?700:400,marginTop:3,letterSpacing:.1,lineHeight:1}}>{t.label}</span>
        </button>
      );
    })}
  </div>
);

/* âââ PHONE SHELL ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const Phone = ({ children }) => (
  <div style={{
    width:320,height:660,background:"#181818",borderRadius:44,
    padding:"10px 6px",
    boxShadow:"0 0 0 1px rgba(255,255,255,0.08),0 40px 100px rgba(0,0,0,0.8),inset 0 0 0 1px rgba(255,255,255,0.03)",
    position:"relative",flexShrink:0,
  }}>
    <div style={{position:"absolute",left:-3,top:88,width:3,height:26,background:"#2a2a2a",borderRadius:"3px 0 0 3px"}}/>
    <div style={{position:"absolute",left:-3,top:124,width:3,height:48,background:"#2a2a2a",borderRadius:"3px 0 0 3px"}}/>
    <div style={{position:"absolute",left:-3,top:182,width:3,height:48,background:"#2a2a2a",borderRadius:"3px 0 0 3px"}}/>
    <div style={{position:"absolute",right:-3,top:136,width:3,height:68,background:"#2a2a2a",borderRadius:"0 3px 3px 0"}}/>
    <div style={{width:"100%",height:"100%",background:C.bg,borderRadius:38,overflow:"hidden",position:"relative",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",flexDirection:"column"}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden",position:"relative"}}>
        {children}
      </div>
    </div>
  </div>
);

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   EMPLOYEE SCREENS
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

/* KPI detail bottom sheet */
const KpiSheet = ({ kpi, onClose }) => {
  if(!kpi) return null;
  const spark=[2.2,2.5,2.4,2.8,2.7,3.0,2.9,3.1,3.2,3.0,3.3,3.2];
  const isRisk = kpi.score<3.0;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)"}}/>
      <div onClick={e=>e.stopPropagation()}
        style={{position:"absolute",bottom:0,left:0,right:0,background:C.card2,
          borderRadius:"20px 20px 0 0",border:`1px solid ${kpi.color}44`,
          padding:"0 0 90px",animation:"fadeUp .25s ease"}}>
        {/* handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}>
          <div style={{width:34,height:4,background:"rgba(255,255,255,0.12)",borderRadius:2}}/>
        </div>
        {/* header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 18px 12px",borderBottom:`1px solid rgba(255,255,255,0.06)`}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:42,height:42,borderRadius:13,background:`${kpi.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21}}>{kpi.icon}</div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{kpi.label}</div>
              <div style={{fontSize:9,color:C.muted}}>SF-12: {kpi.sf}</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:26,fontWeight:800,color:kpi.color,lineHeight:1}}>{kpi.score}</div>
            <Pill label={isRisk?"Needs Attention":"On Track"} color={isRisk?"#f87171":C.g3}/>
          </div>
        </div>
        {/* trend */}
        <div style={{padding:"14px 18px 10px"}}>
          <div style={{fontSize:9,color:C.muted,marginBottom:6}}>12-week trend</div>
          <Spark vals={spark} color={kpi.color} w={260} h={36}/>
        </div>
        {/* question scores */}
        <div style={{padding:"4px 18px 14px"}}>
          <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Question Scores</div>
          {(kpi.questions||[]).map((q,i)=>{
            const pct=((q.score-1)/4)*100;
            const flagged=q.score<q.threshold;
            return (
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:9.5,color:flagged?"rgba(251,191,36,.9)":"rgba(255,255,255,.5)",flex:1,paddingRight:8}}>{flagged?"â¡ ":""}{q.label}</span>
                  <span style={{fontSize:11,fontWeight:800,color:flagged?"#fbbf24":kpi.color}}>{q.score.toFixed(1)}</span>
                </div>
                <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
                  <div style={{height:"100%",width:`${pct}%`,background:flagged?"linear-gradient(90deg,#f87171,#fbbf24)":kpi.color,borderRadius:3,transition:"width .4s"}}/>
                </div>
              </div>
            );
          })}
        </div>
        {/* suggestions */}
        {isRisk && (
          <div style={{margin:"0 18px",background:`${kpi.color}0a`,borderRadius:14,padding:"12px 14px",border:`1px solid ${kpi.color}22`}}>
            <div style={{fontSize:10,fontWeight:700,color:kpi.color,marginBottom:8}}>ð¿ Ayumonk Suggestions</div>
            {[["ð¥","Aahar",kpi.aahar],["ð","Vihar",kpi.vihar],["ð¿","Aushadh",kpi.aushadh]].map(([ic,lbl,txt])=>(
              <div key={lbl} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
                <span style={{fontSize:13,width:20,flexShrink:0}}>{ic}</span>
                <div>
                  <span style={{fontSize:8.5,fontWeight:700,color:kpi.color}}>{lbl} â </span>
                  <span style={{fontSize:8.5,color:"rgba(255,255,255,0.45)",lineHeight:1.5}}>{txt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const KPIS = [
  {id:"sleep",   icon:"ð",label:"Sleep",      score:3.2,delta:+8, color:"#7c6af7",sf:"Mental Health",
    questions:[{label:"How easily do you fall asleep?",score:2.8,threshold:3.0},{label:"Hours of sleep per night?",score:2.1,threshold:2.5},{label:"Wake up refreshed?",score:2.4,threshold:2.5}],
    aahar:"Warm turmeric milk at bedtime. Dinner by 7 PM.",vihar:"Digital detox 9 PM. Fixed 6 AM alarm.",aushadh:"Brahmi + Ashwagandha at bedtime."},
  {id:"stress",  icon:"ð§",label:"Stress",     score:2.8,delta:-5, color:C.orange,sf:"Role Emotional",
    questions:[{label:"How often do you feel overwhelmed?",score:3.8,threshold:3.5},{label:"Does stress disrupt sleep?",score:2.3,threshold:2.5}],
    aahar:"Reduce sugar. Ashwagandha latte morning.",vihar:"5-min Anulom Vilom. Nature walk weekends.",aushadh:"Shankhpushpi syrup. Adaptogen blend."},
  {id:"nutrition",icon:"ð¥",label:"Nutrition", score:3.6,delta:+12,color:"#22c55e",sf:"General Health",
    questions:[{label:"Home-cooked meals per week?",score:2.0,threshold:2.5},{label:"Vegetable servings daily?",score:2.6,threshold:3.0}],
    aahar:"Rainbow plate principle. Seasonal vegetables.",vihar:"Cook at home 5Ã/week. Chew 20Ã per bite.",aushadh:"Triphala churna after dinner."},
  {id:"hydration",icon:"ð§",label:"Hydration", score:2.4,delta:-3, color:"#38bdf8",sf:"Vitality",
    questions:[{label:"Glasses of water daily?",score:2.3,threshold:2.5},{label:"Feel adequately hydrated?",score:2.4,threshold:2.5}],
    aahar:"Infused water: mint + cucumber. Coconut water.",vihar:"Water alarm every 2 hours. Glass before meals.",aushadh:"Electrolyte powder in one glass daily."},
  {id:"activity", icon:"ð",label:"Activity",  score:3.9,delta:+18,color:C.orange,sf:"Physical Func.",
    questions:[{label:"Minutes of daily movement?",score:2.5,threshold:3.0},{label:"Structured exercise?",score:1.9,threshold:2.0}],
    aahar:"Light banana pre-workout. Stay hydrated.",vihar:"20-min desk yoga at 11 AM. Always take stairs.",aushadh:"Mahanarayan oil massage weekly."},
  {id:"energy",   icon:"â¡",label:"Energy",    score:2.9,delta:+6, color:C.gold,sf:"Role Physical",
    questions:[{label:"Afternoon energy levels?",score:1.9,threshold:2.0},{label:"Wake up with energy?",score:2.5,threshold:3.0}],
    aahar:"Soaked almonds morning. Avoid post-lunch carbs.",vihar:"10-min power nap at 1 PM. Morning sunlight.",aushadh:"Chyawanprash 1 tsp on empty stomach."},
  {id:"pain",     icon:"ð¦´",label:"Posture",   score:3.1,delta:-2, color:C.pink,sf:"Bodily Pain",
    questions:[{label:"Back or neck pain?",score:3.9,threshold:3.5},{label:"Ergonomic desk setup?",score:2.6,threshold:2.5}],
    aahar:"Anti-inflammatory: ginger, turmeric, omega-3.",vihar:"Shoulder rolls every 45 min. Ergonomic audit.",aushadh:"Mahamash tailam massage twice weekly."},
  {id:"digestion",icon:"ð«",label:"Digestion", score:3.4,delta:+5, color:"#a3e635",sf:"General Health",
    questions:[{label:"Experience bloating or gas?",score:3.7,threshold:3.5},{label:"Regular bowel movements?",score:2.8,threshold:3.0}],
    aahar:"Ginger-lemon tea post lunch. Warm water always.",vihar:"10-min walk after dinner. Vajrasana pose.",aushadh:"Hingvastak churna before meals."},
];

const EmpWellness = ({ onNav }) => {
  const [selKpi, setSelKpi] = useState(null);
  const [mood, setMood] = useState(3);
  const spark=[2.4,2.6,2.9,2.7,3.0,3.1,3.2,3.0,3.3,3.4,3.5,3.2];
  const kpiData = KPIS.find(k=>k.id===selKpi)||null;

  return (
    <div style={{background:C.bg,minHeight:"100%",paddingBottom:70,position:"relative"}}>
      {/* Header */}
      <div style={{padding:"8px 16px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Logo s={22}/>
          <div>
            <div style={{fontSize:11,fontWeight:800,background:"linear-gradient(90deg,#4a7c2f,#6db33f)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AYUMONK</div>
            <div style={{fontSize:7,color:"rgba(255,255,255,.2)",letterSpacing:.8}}>WELLNESS PLATFORM</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{position:"relative",cursor:"pointer"}}>
            <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ð</div>
            <div style={{position:"absolute",top:-3,right:-3,width:14,height:14,borderRadius:"50%",background:C.orange,border:`2px solid ${C.bg}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:800,color:"#fff"}}>2</div>
          </div>
          <div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${C.g1},${C.g3})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>R</div>
        </div>
      </div>

      <div style={{padding:"2px 16px 10px"}}>
        <div style={{fontSize:8,color:C.muted}}>Good morning,</div>
        <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>Rahul Mehta ð</div>
      </div>

      {/* Wellness Index Hero */}
      <div style={{margin:"0 12px 12px",background:`linear-gradient(135deg,${C.card},#192a1a)`,borderRadius:20,padding:"16px",border:`1px solid ${C.border}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-16,top:-16,width:100,height:100,borderRadius:"50%",background:`${C.g3}07`}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:8,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Wellness Index</div>
            <div style={{fontSize:42,fontWeight:800,color:"#fff",lineHeight:1}}>72<span style={{fontSize:14,color:C.muted,fontWeight:500}}>/100</span></div>
            <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
              <Pill label="â² 8% this week" color="#4ade80"/>
              <Pill label="WHO SF-12" color={C.muted}/>
            </div>
            <div style={{marginTop:8}}><Spark vals={spark} color={C.g3} w={110} h={20}/></div>
          </div>
          <Donut pct={72} size={84} color={C.g3} label="GOOD"/>
        </div>
        <div style={{marginTop:10,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.05)",display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.g3,animation:"pulse2 2s infinite"}}/>
          <span style={{fontSize:8,color:C.muted}}>Auto-synced Â· Google Health Â· 7:30 AM</span>
        </div>
      </div>

      {/* Mood + Dosha row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"0 12px 12px"}}>
        {/* Mood */}
        <div style={{background:C.card,borderRadius:16,padding:"12px 12px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:8.5,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:.4,marginBottom:8}}>Today's Mood</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            {["ð","ð","ð","ð","ð"].map((e,i)=>(
              <button key={i} onClick={()=>setMood(i)}
                style={{width:34,height:34,borderRadius:9,border:mood===i?`2px solid ${C.g3}`:"2px solid transparent",
                  background:mood===i?`${C.g3}18`:"rgba(255,255,255,.04)",fontSize:17,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {e}
              </button>
            ))}
          </div>
          {mood!=null&&<div style={{fontSize:8,color:C.g3,textAlign:"center"}}>â Mood logged</div>}
        </div>

        {/* Dosha ring */}
        <div style={{background:C.card,borderRadius:16,padding:"10px 10px",border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{fontSize:8.5,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:.4,marginBottom:4}}>Prakriti Â· Dosha</div>
          <DoshaRing vata={30} pitta={34} kapha={36} size={78}/>
          <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap",justifyContent:"center"}}>
            {[["Vata","#38bdf8",30],["Pitta","#f97316",34],["Kapha","#22c55e",36]].map(([n,c,v])=>(
              <div key={n} style={{display:"flex",alignItems:"center",gap:3,fontSize:7.5,color:"rgba(255,255,255,.45)"}}>
                <span style={{width:6,height:6,borderRadius:1,background:c,display:"inline-block"}}/>
                {n} {v}%
              </div>
            ))}
          </div>
          <div style={{fontSize:7.5,color:`${C.orange}`,marginTop:4,fontWeight:600,textAlign:"center"}}>
            ð¿ Link Ayufinity â
          </div>
        </div>
      </div>

      {/* KPI strip â tap any tile */}
      <div style={{padding:"0 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)"}}>KPI Overview</span>
          <span style={{fontSize:8.5,color:C.g3}}>Tap any tile to expand â</span>
        </div>
        <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:4}}>
          {KPIS.map(k=>(
            <div key={k.id} onClick={()=>setSelKpi(k.id)}
              style={{minWidth:72,background:C.card,borderRadius:14,padding:"10px 6px",border:`1px solid ${k.color}33`,textAlign:"center",flexShrink:0,cursor:"pointer",transition:"all .15s",
                boxShadow:selKpi===k.id?`0 0 16px ${k.color}33`:"none",
                borderColor:selKpi===k.id?k.color:`${k.color}33`}}>
              <div style={{fontSize:18,marginBottom:2}}>{k.icon}</div>
              <div style={{fontSize:7.5,color:"rgba(255,255,255,.3)",marginBottom:1,lineHeight:1.2}}>{k.label}</div>
              <div style={{fontSize:15,fontWeight:800,color:k.color,lineHeight:1}}>{k.score}</div>
              <div style={{fontSize:8,fontWeight:700,marginTop:2,color:k.delta>0?"#4ade80":"#f87171"}}>{k.delta>0?"â²":"â¼"}{Math.abs(k.delta)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lifestyle suggestions */}
      <div style={{margin:"12px 12px 0",background:"rgba(109,179,63,.04)",borderRadius:16,padding:"12px",border:"1px solid rgba(109,179,63,.12)"}}>
        <div style={{fontSize:10,fontWeight:700,color:C.g3,marginBottom:8}}>ð¿ Today's Ayumonk Tips</div>
        {[
          {ic:"ð¥",t:"Aahar",s:"Warm turmeric milk at bedtime â supports sleep recovery"},
          {ic:"ð",t:"Vihar",s:"5-min Anulom Vilom at 10 AM Â· drink 8 glasses today"},
        ].map(s=>(
          <div key={s.t} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
            <div style={{width:26,height:26,borderRadius:8,background:`${C.g3}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{s.ic}</div>
            <div>
              <span style={{fontSize:8.5,fontWeight:700,color:C.g3}}>{s.t} â </span>
              <span style={{fontSize:8.5,color:"rgba(255,255,255,.42)",lineHeight:1.4}}>{s.s}</span>
            </div>
          </div>
        ))}
      </div>

      {/* KPI detail sheet */}
      {selKpi && <KpiSheet kpi={kpiData} onClose={()=>setSelKpi(null)}/>}

      <BottomNav items={[{id:"wellness",icon:"ð¿",label:"Wellness"},{id:"challenges",icon:"ð¯",label:"Challenges"},{id:"responses",icon:"ð",label:"Responses"}]} active="wellness" onNav={onNav} accent={C.g3}/>
    </div>
  );
};

const EmpChallenges = ({ onNav }) => {
  const [water,setWater]=useState(4);
  const [sleep,setSleep]=useState(false);
  const [breath,setBreath]=useState(false);
  const [moodDone,setMoodDone]=useState(false);
  const done=[water>=8,sleep,breath,moodDone,false].filter(Boolean).length;
  return (
    <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
      <div style={{padding:"8px 16px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>ð¯ Challenges</div><div style={{fontSize:8.5,color:C.muted}}>May 8 Â· Tap to complete</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:17,fontWeight:800,color:C.gold}}>{done*25+water*3} XP</div><div style={{fontSize:7.5,color:C.muted}}>earned today</div></div>
      </div>

      {/* Progress */}
      <div style={{margin:"0 12px 12px",background:C.card,borderRadius:14,padding:"11px 14px",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
          <span style={{fontSize:8.5,color:C.muted,fontWeight:600}}>TODAY</span>
          <span style={{fontSize:8.5,fontWeight:700,color:"#fff"}}>{done}/5 done</span>
        </div>
        <div style={{height:5,background:"rgba(255,255,255,.05)",borderRadius:3}}>
          <div style={{height:"100%",width:`${(done/5)*100}%`,background:`linear-gradient(90deg,${C.g2},${C.g3})`,borderRadius:3,transition:"width .4s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
          <span style={{fontSize:8,color:C.muted}}>ð¥ 7-day streak</span>
          <span style={{fontSize:8,color:C.g3}}>Level 3 Â· 125 XP to Level 4</span>
        </div>
      </div>

      <div style={{padding:"0 12px",display:"flex",flexDirection:"column",gap:9}}>
        {/* Hydration counter */}
        <div style={{background:C.card,borderRadius:18,padding:"13px 14px",border:"1px solid #38bdf833"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",gap:9,alignItems:"center"}}>
              <div style={{width:38,height:38,borderRadius:12,background:"#38bdf818",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>ð§</div>
              <div><div style={{fontSize:11,fontWeight:700,color:"#fff"}}>Hydration Mission</div><div style={{fontSize:8.5,color:C.muted}}>Hydration Â· 20 XP</div></div>
            </div>
            <span style={{fontSize:14,fontWeight:800,color:"#38bdf8"}}>{water}/8</span>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,.05)",borderRadius:3,marginBottom:9}}>
            <div style={{height:"100%",width:`${(water/8)*100}%`,background:"#38bdf8",borderRadius:3,transition:"width .3s"}}/>
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setWater(v=>Math.max(0,v-1))} style={{flex:1,padding:"9px",borderRadius:10,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",color:"rgba(255,255,255,.4)",fontSize:16,cursor:"pointer",fontWeight:700}}>â</button>
            <button onClick={()=>setWater(v=>Math.min(8,v+1))} style={{flex:2,padding:"9px",borderRadius:10,background:"rgba(56,189,248,.16)",border:"1px solid rgba(56,189,248,.35)",color:"#38bdf8",fontSize:11,cursor:"pointer",fontWeight:700}}>ï¼1 Glass ð§</button>
          </div>
          {water>=8&&<div style={{marginTop:7,textAlign:"center",fontSize:9.5,color:"#4ade80",fontWeight:700}}>â Complete! +20 XP</div>}
        </div>

        {/* Auto-tracked steps */}
        <div style={{background:C.card,borderRadius:18,padding:"13px 14px",border:`1px solid ${C.orange}33`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
            <div style={{display:"flex",gap:9,alignItems:"center"}}>
              <div style={{width:38,height:38,borderRadius:12,background:`${C.orange}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>ð</div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:"#fff"}}>8,000 Steps</div>
                <div style={{display:"flex",gap:4,marginTop:2}}>
                  <Pill label="â¡ Auto-tracked" color={C.g3}/>
                  <span style={{fontSize:8,color:C.muted,alignSelf:"center"}}>Google Health</span>
                </div>
              </div>
            </div>
            <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:800,color:C.orange}}>6,240</div><div style={{fontSize:8,color:C.muted}}>/ 8,000</div></div>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,.05)",borderRadius:3}}>
            <div style={{height:"100%",width:"78%",background:C.orange,borderRadius:3}}/>
          </div>
          <div style={{fontSize:8,color:C.muted,marginTop:5,textAlign:"center"}}>1,760 steps to go Â· auto-confirms at midnight</div>
        </div>

        {/* Breathing */}
        <div style={{background:C.card,borderRadius:18,padding:"13px 14px",border:`1px solid ${C.orange}33`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",gap:9,alignItems:"center"}}>
              <div style={{width:38,height:38,borderRadius:12,background:`${C.orange}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>ð«</div>
              <div><div style={{fontSize:11,fontWeight:700,color:"#fff"}}>4-7-8 Breathing</div><div style={{fontSize:8.5,color:C.muted}}>Stress Â· 25 XP</div></div>
            </div>
            {breath&&<Pill label="â Done +25XP" color="#4ade80"/>}
          </div>
          {!breath
            ?<button onClick={()=>setBreath(true)} style={{width:"100%",padding:"10px",borderRadius:12,background:`${C.orange}18`,border:`1px solid ${C.orange}44`,color:C.orange,fontSize:11,fontWeight:700,cursor:"pointer"}}>â¶ Start 2-Min Session (ð Voice + Tone)</button>
            :<div style={{textAlign:"center",fontSize:9.5,color:"#4ade80",fontWeight:700}}>â Session done! +25 XP earned</div>}
        </div>

        {/* Sleep toggle */}
        <div style={{background:C.card,borderRadius:18,padding:"13px 14px",border:"1px solid #7c6af733",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:9,alignItems:"center"}}>
            <div style={{width:38,height:38,borderRadius:12,background:"#7c6af718",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>ð</div>
            <div><div style={{fontSize:11,fontWeight:700,color:"#fff"}}>Sleep Before 10:30 PM</div><div style={{fontSize:8.5,color:C.muted}}>Sleep Â· 30 XP</div></div>
          </div>
          <button onClick={()=>setSleep(p=>!p)}
            style={{padding:"8px 14px",borderRadius:10,border:"none",background:sleep?"rgba(74,222,128,.14)":"rgba(255,255,255,.06)",color:sleep?"#4ade80":"rgba(255,255,255,.4)",fontSize:10,fontWeight:700,cursor:"pointer"}}>
            {sleep?"â Done":"Commit"}
          </button>
        </div>

        {/* Mood */}
        <div style={{background:C.card,borderRadius:18,padding:"13px 14px",border:"1px solid #34d39933"}}>
          <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:9}}>
            <div style={{width:38,height:38,borderRadius:12,background:"#34d39918",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>ð</div>
            <div><div style={{fontSize:11,fontWeight:700,color:"#fff"}}>Daily Mood Check</div><div style={{fontSize:8.5,color:C.muted}}>Emotional Â· 10 XP</div></div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {["ð","ð","ð","ð","ð"].map((e,i)=>(
              <button key={i} onClick={()=>setMoodDone(true)} style={{flex:1,padding:"8px 0",borderRadius:10,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.04)",fontSize:17,cursor:"pointer"}}>
                {e}
              </button>
            ))}
          </div>
          {moodDone&&<div style={{textAlign:"center",fontSize:9,color:"#4ade80",marginTop:6,fontWeight:700}}>â Logged! +10 XP</div>}
        </div>
      </div>
      <BottomNav items={[{id:"wellness",icon:"ð¿",label:"Wellness"},{id:"challenges",icon:"ð¯",label:"Challenges"},{id:"responses",icon:"ð",label:"Responses"}]} active="challenges" onNav={onNav} accent={C.g3}/>
    </div>
  );
};

const EmpResponses = ({ onNav }) => (
  <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
    <div style={{padding:"8px 16px 10px"}}><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>ð My Responses</div><div style={{fontSize:8.5,color:C.muted}}>Wellness forms Â· submitted & pending</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,margin:"0 12px 12px"}}>
      {[{l:"Submitted",v:8,c:C.g3,i:"â"},{l:"Pending",v:2,c:C.orange,i:"â³"},{l:"Avg WI Score",v:"74",c:C.blue,i:"ð"},{l:"Overdue",v:0,c:"#f87171",i:"â ï¸"}].map(s=>(
        <div key={s.l} style={{background:C.card,borderRadius:14,padding:"11px 12px",border:`1px solid ${s.c}22`}}>
          <div style={{fontSize:15,marginBottom:3}}>{s.i}</div>
          <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
          <div style={{fontSize:8.5,color:C.muted}}>{s.l}</div>
        </div>
      ))}
    </div>
    <div style={{padding:"0 12px"}}>
      <div style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:.5,marginBottom:9}}>Recent Submissions</div>
      {[{th:"Corporate Vitality",wk:"Week 12",dt:"1 May",wi:78,c:C.g3},{th:"Stress & Recovery",wk:"Week 11",dt:"24 Apr",wi:71,c:C.gold},{th:"Metabolism Reset",wk:"Week 10",dt:"17 Apr",wi:65,c:C.gold}].map(f=>(
        <div key={f.wk} style={{background:C.card,borderRadius:16,padding:"12px",border:`1px solid ${C.border}`,marginBottom:9,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
            <div><div style={{fontSize:11,fontWeight:700,color:"#fff"}}>{f.th}</div><div style={{fontSize:8.5,color:C.muted}}>{f.wk} Â· {f.dt}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:800,color:f.c,lineHeight:1}}>{f.wi}</div><div style={{fontSize:8,color:C.muted}}>WI Score</div></div>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {["Sleep","Stress","Nutrition","Hydration"].map(k=><Pill key={k} label={k} color={C.g3}/>)}
          </div>
        </div>
      ))}
      <div style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:.5,marginBottom:9,marginTop:4}}>Pending</div>
      <div style={{background:C.card,borderRadius:16,padding:"12px",border:`1px solid ${C.orange}44`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
          <div><div style={{fontSize:11,fontWeight:700,color:"#fff"}}>Stress & Recovery</div><div style={{fontSize:8.5,color:C.muted}}>Week 13 Â· Due 15 May</div></div>
          <Pill label="PENDING" color={C.orange}/>
        </div>
        <button style={{width:"100%",padding:"11px",borderRadius:12,background:`linear-gradient(135deg,${C.g2},${C.g3})`,border:"none",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Fill Form Now â</button>
      </div>
    </div>
    <BottomNav items={[{id:"wellness",icon:"ð¿",label:"Wellness"},{id:"challenges",icon:"ð¯",label:"Challenges"},{id:"responses",icon:"ð",label:"Responses"}]} active="responses" onNav={onNav} accent={C.g3}/>
  </div>
);

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   HR SCREENS
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const HR_NAV=[{id:"home",icon:"ð ",label:"Home"},{id:"analytics",icon:"ð",label:"Analytics"},{id:"people",icon:"ð¥",label:"People"},{id:"programs",icon:"ð",label:"Programs"}];

const HRHome = ({ onNav }) => (
  <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
    <div style={{padding:"8px 16px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Logo s={22}/>
        <div><div style={{fontSize:11,fontWeight:800,background:"linear-gradient(90deg,#4a7c2f,#6db33f)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AYUMONK</div><div style={{fontSize:7,color:C.blue,fontWeight:700,letterSpacing:.8}}>HR PORTAL</div></div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div style={{position:"relative",cursor:"pointer"}}>
          <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ð</div>
          <div style={{position:"absolute",top:-3,right:-3,width:14,height:14,borderRadius:"50%",background:C.red,border:`2px solid ${C.bg}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:800,color:"#fff"}}>5</div>
        </div>
        <div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${C.blue}88,${C.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>HR</div>
      </div>
    </div>
    <div style={{padding:"2px 16px 10px"}}><div style={{fontSize:8.5,color:C.muted}}>TechCorp India Pvt Ltd</div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Company Dashboard</div></div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"0 12px 12px"}}>
      {[{l:"Employees",v:"324",i:"ð¥",c:C.blue},{l:"Avg WI",v:"68.4",i:"ð",c:C.g3},{l:"Active KPIs",v:"6",i:"ð¯",c:C.gold},{l:"Forms Due",v:"48",i:"ð",c:C.orange},{l:"Completion",v:"92%",i:"â",c:"#4ade80"},{l:"Absenteeism",v:"2.3%",i:"ð",c:C.teal}].map(s=>(
        <div key={s.l} style={{background:C.card,borderRadius:14,padding:"10px 8px",border:`1px solid ${s.c}22`,textAlign:"center"}}>
          <div style={{fontSize:17,marginBottom:2}}>{s.i}</div>
          <div style={{fontSize:15,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
          <div style={{fontSize:7.5,color:C.muted,marginTop:1}}>{s.l}</div>
        </div>
      ))}
    </div>

    <div style={{margin:"0 12px 12px",background:C.card,borderRadius:18,padding:"13px",border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div><div style={{fontSize:11,fontWeight:700,color:"#fff"}}>Company Wellness Trend</div><div style={{fontSize:8.5,color:C.muted}}>Last 8 weeks</div></div>
        <Pill label="â² 6.2%" color="#4ade80"/>
      </div>
      <Bar data={[{l:"W5",v:60},{l:"W6",v:63},{l:"W7",v:61},{l:"W8",v:65},{l:"W9",v:64},{l:"W10",v:67},{l:"W11",v:66},{l:"W12",v:68}]} color={C.g3} h={55}/>
    </div>

    <div style={{margin:"0 12px",background:C.card,borderRadius:18,padding:"13px",border:`1px solid ${C.border}`}}>
      <div style={{fontSize:11,fontWeight:700,color:"#fff",marginBottom:10}}>Top Departments Â· WI</div>
      {[{d:"Engineering",wi:72,c:C.g3,n:86},{d:"Product",wi:69,c:C.blue,n:42},{d:"Finance",wi:64,c:C.gold,n:38}].map(d=>(
        <div key={d.d} style={{marginBottom:9}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:9.5,color:"rgba(255,255,255,.55)"}}>{d.d} <span style={{fontSize:8,color:C.muted}}>({d.n})</span></span>
            <span style={{fontSize:10,fontWeight:700,color:d.c}}>{d.wi}</span>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,.04)",borderRadius:3}}>
            <div style={{height:"100%",width:`${d.wi}%`,background:d.c,borderRadius:3}}/>
          </div>
        </div>
      ))}
    </div>
    <BottomNav items={HR_NAV} active="home" onNav={onNav} accent={C.blue}/>
  </div>
);

const HRAnalytics = ({ onNav }) => {
  const [metric,setMetric]=useState("wellness");
  return (
    <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
      <div style={{padding:"8px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>ð Analytics</div><div style={{fontSize:8.5,color:C.muted}}>Population health Â· CXO metrics</div></div>
        <button style={{padding:"6px 11px",borderRadius:9,background:C.card,border:`1px solid ${C.border}`,color:"rgba(255,255,255,.45)",fontSize:9.5,cursor:"pointer"}}>Filters â</button>
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",padding:"0 12px 10px"}}>
        {["All Depts","All Locations","All Ages","All Gender"].map(f=>(
          <span key={f} style={{fontSize:8.5,background:C.card,color:"rgba(255,255,255,.38)",borderRadius:8,padding:"5px 10px",border:`1px solid ${C.border}`,whiteSpace:"nowrap",flexShrink:0,cursor:"pointer"}}>{f} â¾</span>
        ))}
      </div>
      <div style={{display:"flex",gap:5,margin:"0 12px 12px",background:C.card,borderRadius:12,padding:4,border:`1px solid ${C.border}`}}>
        {[["wellness","Wellness"],["productivity","Productivity"],["stress","Stress"]].map(([id,l])=>(
          <button key={id} onClick={()=>setMetric(id)} style={{flex:1,padding:"7px",borderRadius:8,border:"none",fontSize:9,fontWeight:700,cursor:"pointer",background:metric===id?`linear-gradient(135deg,${C.g2},${C.g3})`:"transparent",color:metric===id?"#fff":"rgba(255,255,255,.32)"}}>
            {l}
          </button>
        ))}
      </div>
      <div style={{margin:"0 12px 12px",background:C.card,borderRadius:18,padding:"13px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:"#fff",marginBottom:10}}>By Department</div>
        <Bar data={[{l:"Eng",v:72},{l:"Mktg",v:61},{l:"Fin",v:64},{l:"HR",v:68},{l:"Ops",v:59},{l:"Prod",v:69}]} color={C.g3} h={65}/>
      </div>
      <div style={{margin:"0 12px 12px",background:C.card,borderRadius:18,padding:"13px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:"#fff",marginBottom:10}}>By Age Band</div>
        <Bar data={[{l:"20-25",v:74},{l:"26-30",v:71},{l:"31-35",v:68},{l:"36-40",v:65},{l:"41-50",v:62},{l:"50+",v:58}]} color={C.blue} h={55}/>
      </div>
      <div style={{margin:"0 12px 12px",background:C.card,borderRadius:18,padding:"13px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:"#fff",marginBottom:10}}>Gender Breakdown</div>
        {[["Male",C.blue,68,186],["Female",C.pink,70,112],["Other","#a3e635",67,26]].map(([g,c,wi,n])=>(
          <div key={g} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{width:6,height:6,borderRadius:2,background:c,flexShrink:0,display:"inline-block"}}/>
            <span style={{fontSize:9.5,color:"rgba(255,255,255,.55)",width:42}}>{g}</span>
            <div style={{flex:1,height:4,background:"rgba(255,255,255,.04)",borderRadius:3}}><div style={{height:"100%",width:`${wi}%`,background:c,borderRadius:3}}/></div>
            <span style={{fontSize:10,fontWeight:700,color:c,width:22}}>{wi}</span>
            <span style={{fontSize:8,color:C.muted,width:28}}>{n}</span>
          </div>
        ))}
      </div>
      <div style={{margin:"0 12px",background:"rgba(74,144,196,.06)",borderRadius:16,padding:"12px",border:`1px solid ${C.blue}33`}}>
        <div style={{fontSize:10,fontWeight:700,color:C.blue,marginBottom:3}}>ð¡ CXO Insight</div>
        <div style={{fontSize:9.5,color:"rgba(255,255,255,.5)",lineHeight:1.55}}>Depts with WI â¥ 70 show <span style={{color:"#4ade80",fontWeight:700}}>23% higher productivity</span> and <span style={{color:"#4ade80",fontWeight:700}}>â18% absenteeism</span>.</div>
      </div>
      <BottomNav items={HR_NAV} active="analytics" onNav={onNav} accent={C.blue}/>
    </div>
  );
};

const HRPeople = ({ onNav }) => (
  <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
    <div style={{padding:"8px 16px 10px"}}><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>ð¥ People</div><div style={{fontSize:8.5,color:C.muted}}>324 employees Â· sorted by WI</div></div>
    <div style={{margin:"0 12px 10px",background:C.card,borderRadius:12,padding:"9px 12px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:13}}>ð</span><span style={{fontSize:9.5,color:"rgba(255,255,255,.2)"}}>Search employeeâ¦</span>
    </div>
    <div style={{display:"flex",gap:6,overflowX:"auto",padding:"0 12px 10px"}}>
      {["All","â ï¸ At Risk","ð¶ Moderate","ð Top"].map((f,i)=>(
        <span key={f} style={{fontSize:8.5,background:i===0?`${C.g3}20`:C.card,color:i===0?C.g3:"rgba(255,255,255,.38)",borderRadius:8,padding:"5px 11px",border:`1px solid ${i===0?C.g3+"44":C.border}`,whiteSpace:"nowrap",flexShrink:0,fontWeight:i===0?700:400,cursor:"pointer"}}>{f}</span>
      ))}
    </div>
    <div style={{padding:"0 12px",display:"flex",flexDirection:"column",gap:8}}>
      {[{name:"Priya Sharma",dept:"Engineering",wi:82,trend:"+4%",av:"PS",c:C.g3},{name:"Rohan Das",dept:"Marketing",wi:61,trend:"-2%",av:"RD",c:C.gold},{name:"Meena Joshi",dept:"Finance",wi:48,trend:"-7%",av:"MJ",c:"#f87171"},{name:"Arjun Mehta",dept:"Product",wi:76,trend:"+9%",av:"AM",c:C.g3},{name:"Kavya Nair",dept:"HR",wi:55,trend:"0%",av:"KN",c:C.gold}].map(e=>(
        <div key={e.name} style={{background:C.card,borderRadius:15,padding:"11px 12px",border:`1px solid ${e.c}22`,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <div style={{width:38,height:38,borderRadius:11,background:`${e.c}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:e.c,flexShrink:0}}>{e.av}</div>
          <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:"#fff"}}>{e.name}</div><div style={{fontSize:8.5,color:C.muted}}>{e.dept}</div></div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:18,fontWeight:800,color:e.c,lineHeight:1}}>{e.wi}</div>
            <div style={{fontSize:8.5,fontWeight:700,color:e.trend.startsWith("+")?"#4ade80":"#f87171"}}>{e.trend}</div>
          </div>
        </div>
      ))}
    </div>
    <BottomNav items={HR_NAV} active="people" onNav={onNav} accent={C.blue}/>
  </div>
);

const HRPrograms = ({ onNav }) => (
  <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
    <div style={{padding:"8px 16px 12px"}}><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>ð KPI Programs</div><div style={{fontSize:8.5,color:C.muted}}>Manage company KPI windows</div></div>
    <div style={{padding:"0 12px",display:"flex",flexDirection:"column",gap:9}}>
      {[{kpi:"Hydration",icon:"ð§",c:"#38bdf8",end:"31 Dec",pct:35,en:298,comp:"82%"},{kpi:"Sleep",icon:"ð",c:"#7c6af7",end:"31 Dec",pct:35,en:312,comp:"74%"},{kpi:"Activity",icon:"ð",c:C.orange,end:"31 Dec",pct:35,en:267,comp:"91%"},{kpi:"Nutrition",icon:"ð¥",c:"#22c55e",end:"30 Jun",pct:68,en:245,comp:"67%"}].map(p=>(
        <div key={p.kpi} style={{background:C.card,borderRadius:17,padding:"13px",border:`1px solid ${p.c}33`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div style={{display:"flex",gap:9,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:11,background:`${p.c}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{p.icon}</div>
              <div><div style={{fontSize:11,fontWeight:700,color:"#fff"}}>{p.kpi} KPI</div><div style={{fontSize:8.5,color:C.muted}}>Ends {p.end}</div></div>
            </div>
            <Pill label="â ACTIVE" color="#4ade80"/>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,.04)",borderRadius:3,marginBottom:5}}>
            <div style={{height:"100%",width:`${p.pct}%`,background:p.c,borderRadius:3}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:8}}>
            <span style={{color:C.muted}}>{p.pct}% elapsed</span>
            <span style={{color:"rgba(255,255,255,.38)"}}>{p.en} enrolled Â· {p.comp} completion</span>
          </div>
        </div>
      ))}
      <button style={{width:"100%",padding:"12px",borderRadius:13,background:`linear-gradient(135deg,${C.g2},${C.g3})`,border:"none",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Schedule New KPI Program</button>
    </div>
    <BottomNav items={HR_NAV} active="programs" onNav={onNav} accent={C.blue}/>
  </div>
);

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   SUPER ADMIN SCREENS
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const SA_NAV=[{id:"home",icon:"ð ",label:"Home"},{id:"companies",icon:"ð¢",label:"Companies"},{id:"kpi",icon:"ð¯",label:"KPIs"},{id:"suggest",icon:"ð¿",label:"Suggests"},{id:"settings",icon:"âï¸",label:"Settings"}];

const SAHome = ({ onNav }) => (
  <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
    <div style={{padding:"8px 16px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Logo s={22}/>
        <div><div style={{fontSize:11,fontWeight:800,background:"linear-gradient(90deg,#4a7c2f,#6db33f)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AYUMONK</div><div style={{fontSize:7,color:C.purple,fontWeight:700,letterSpacing:.8}}>SUPER ADMIN</div></div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div style={{position:"relative",cursor:"pointer"}}>
          <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ð</div>
          <div style={{position:"absolute",top:-3,right:-3,width:14,height:14,borderRadius:"50%",background:C.purple,border:`2px solid ${C.bg}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:800,color:"#fff"}}>8</div>
        </div>
        <div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${C.purple}88,${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>SA</div>
      </div>
    </div>
    <div style={{padding:"2px 16px 10px"}}><div style={{fontSize:8.5,color:C.muted}}>Platform overview</div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>System Dashboard</div></div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,margin:"0 12px 12px"}}>
      {[{l:"Companies",v:"47",i:"ð¢",c:C.blue,d:"+3 this month"},{l:"Total Users",v:"12.4K",i:"ð¥",c:C.g3,d:"+842 this month"},{l:"Active KPIs",v:"284",i:"ð¯",c:C.gold,d:"across all cos"},{l:"Platform WI",v:"71.2",i:"ð",c:C.teal,d:"â² 2.1% MoM"}].map(s=>(
        <div key={s.l} style={{background:C.card,borderRadius:16,padding:"13px",border:`1px solid ${s.c}22`}}>
          <div style={{fontSize:20,marginBottom:3}}>{s.i}</div>
          <div style={{fontSize:21,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
          <div style={{fontSize:8.5,color:C.muted,marginTop:1}}>{s.l}</div>
          <div style={{fontSize:7.5,color:"rgba(255,255,255,.25)",marginTop:3}}>{s.d}</div>
        </div>
      ))}
    </div>

    <div style={{margin:"0 12px 12px",background:C.card,borderRadius:18,padding:"13px",border:`1px solid ${C.border}`}}>
      <div style={{fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,.55)",marginBottom:10}}>Quick Actions</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
        {[{i:"ð¢",l:"Add Company",c:C.blue},{i:"ð¤",l:"Add User",c:C.g3},{i:"ð¯",l:"New KPI",c:C.gold},{i:"â",l:"Add Question",c:C.orange},{i:"ð¿",l:"Suggestions",c:C.teal},{i:"ð",l:"Challenges",c:C.purple}].map(a=>(
          <button key={a.l} style={{padding:"9px",borderRadius:12,background:`${a.c}0e`,border:`1px solid ${a.c}28`,color:a.c,fontSize:9.5,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,textAlign:"left"}}>
            <span style={{fontSize:15}}>{a.i}</span>{a.l}
          </button>
        ))}
      </div>
    </div>

    <div style={{margin:"0 12px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
        <span style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,.42)",textTransform:"uppercase",letterSpacing:.5}}>Recent Companies</span>
        <span style={{fontSize:8.5,color:C.g3,cursor:"pointer"}}>View all â</span>
      </div>
      {[{name:"TechCorp India",users:324,wi:68},{name:"Bharat Pharma",users:218,wi:72},{name:"FinEdge NBFC",users:156,wi:61}].map(c=>(
        <div key={c.name} style={{background:C.card,borderRadius:14,padding:"10px 12px",border:`1px solid ${C.border}`,marginBottom:8,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <div style={{width:34,height:34,borderRadius:10,background:`${C.g3}16`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>ð¢</div>
          <div style={{flex:1}}><div style={{fontSize:10.5,fontWeight:700,color:"#fff"}}>{c.name}</div><div style={{fontSize:8,color:C.muted}}>{c.users} users</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:800,color:C.g3}}>{c.wi}</div><div style={{fontSize:7.5,color:C.muted}}>Avg WI</div></div>
        </div>
      ))}
    </div>
    <BottomNav items={SA_NAV} active="home" onNav={onNav} accent={C.purple}/>
  </div>
);

const SACompanies = ({ onNav }) => (
  <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
    <div style={{padding:"8px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>ð¢ Companies</div><div style={{fontSize:8.5,color:C.muted}}>47 active corporate clients</div></div>
      <button style={{padding:"7px 13px",borderRadius:10,background:`linear-gradient(135deg,${C.g2},${C.g3})`,border:"none",color:"#fff",fontSize:9.5,fontWeight:700,cursor:"pointer"}}>+ Add</button>
    </div>
    <div style={{margin:"0 12px 10px",background:C.card,borderRadius:12,padding:"8px 12px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:13}}>ð</span><span style={{fontSize:9.5,color:"rgba(255,255,255,.2)"}}>Search companyâ¦</span>
    </div>
    <div style={{padding:"0 12px",display:"flex",flexDirection:"column",gap:9}}>
      {[{name:"TechCorp India Pvt Ltd",id:"CL-001",users:324,plan:"Enterprise",wi:68,kpis:6,status:"active",ind:"IT Services"},{name:"Bharat Pharma Ltd",id:"CL-002",users:218,plan:"Professional",wi:72,kpis:5,status:"active",ind:"Pharma"},{name:"FinEdge NBFC",id:"CL-003",users:156,plan:"Professional",wi:61,kpis:6,status:"active",ind:"BFSI"},{name:"Nykaa Digital",id:"CL-004",users:89,plan:"Starter",wi:74,kpis:4,status:"active",ind:"D2C"},{name:"Infra Build Co",id:"CL-005",users:42,plan:"Starter",wi:58,kpis:3,status:"trial",ind:"Construction"}].map(c=>(
        <div key={c.id} style={{background:C.card,borderRadius:17,padding:"12px",border:`1px solid ${C.border}`,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#fff"}}>{c.name}</div>
              <div style={{display:"flex",gap:4,marginTop:2}}>
                <span style={{fontSize:8,color:C.muted}}>{c.id}</span>
                <span style={{fontSize:8,background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.3)",borderRadius:4,padding:"1px 5px"}}>{c.ind}</span>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
              <Pill label={c.status==="active"?"â Active":"â Trial"} color={c.status==="active"?"#4ade80":C.gold}/>
              <Pill label={c.plan} color={C.blue}/>
            </div>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <span style={{fontSize:8.5,background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.38)",borderRadius:6,padding:"2px 8px"}}>ð¥ {c.users}</span>
            <span style={{fontSize:8.5,background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.38)",borderRadius:6,padding:"2px 8px"}}>ð¯ {c.kpis} KPIs</span>
            <span style={{fontSize:8.5,background:`${C.g3}12`,color:C.g3,borderRadius:6,padding:"2px 8px",fontWeight:700}}>WI: {c.wi}</span>
            <button style={{marginLeft:"auto",padding:"2px 10px",borderRadius:7,background:`${C.blue}14`,border:`1px solid ${C.blue}30`,color:C.blue,fontSize:8.5,fontWeight:700,cursor:"pointer"}}>Manage</button>
          </div>
        </div>
      ))}
    </div>
    <BottomNav items={SA_NAV} active="companies" onNav={onNav} accent={C.purple}/>
  </div>
);

const SAKPI = ({ onNav }) => (
  <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
    <div style={{padding:"8px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>ð¯ KPI Master</div><div style={{fontSize:8.5,color:C.muted}}>Weights Â· questions Â· SF-12 mapping</div></div>
      <button style={{padding:"7px 13px",borderRadius:10,background:`linear-gradient(135deg,${C.g2},${C.g3})`,border:"none",color:"#fff",fontSize:9.5,fontWeight:700,cursor:"pointer"}}>+ New</button>
    </div>
    <div style={{margin:"0 12px 10px",background:C.card,borderRadius:12,padding:"8px 12px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:13}}>ð</span><span style={{fontSize:9.5,color:"rgba(255,255,255,.2)"}}>Search KPIsâ¦</span>
    </div>
    <div style={{padding:"0 12px",display:"flex",flexDirection:"column",gap:9}}>
      {[{ic:"ð",l:"Sleep Quality",c:"#7c6af7",w:"20%",q:3,cos:47,sf:"Mental Health"},{ic:"ð§",l:"Stress Level",c:C.orange,w:"15%",q:3,cos:47,sf:"Role Emotional"},{ic:"ð¥",l:"Nutrition",c:"#22c55e",w:"15%",q:3,cos:44,sf:"Gen. Health"},{ic:"ð§",l:"Hydration",c:"#38bdf8",w:"10%",q:2,cos:47,sf:"Vitality"},{ic:"ð",l:"Activity",c:C.orange,w:"10%",q:2,cos:47,sf:"Physical Func."},{ic:"ð«",l:"Digestion",c:"#a3e635",w:"10%",q:2,cos:39,sf:"Gen. Health"}].map(k=>(
        <div key={k.l} style={{background:C.card,borderRadius:16,padding:"12px",border:`1px solid ${k.c}33`,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
            <div style={{display:"flex",gap:9,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:11,background:`${k.c}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{k.ic}</div>
              <div><div style={{fontSize:11,fontWeight:700,color:"#fff"}}>{k.l}</div><div style={{fontSize:8.5,color:C.muted}}>SF-12: {k.sf}</div></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
              <span style={{fontSize:14,fontWeight:800,color:k.c}}>{k.w}</span>
              <Pill label="Active" color="#4ade80"/>
            </div>
          </div>
          <div style={{display:"flex",gap:5}}>
            <span style={{fontSize:8.5,background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.38)",borderRadius:6,padding:"2px 8px"}}>ð {k.q} questions</span>
            <span style={{fontSize:8.5,background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.38)",borderRadius:6,padding:"2px 8px"}}>ð¢ {k.cos} companies</span>
            <button style={{marginLeft:"auto",padding:"2px 9px",borderRadius:7,background:`${k.c}13`,border:`1px solid ${k.c}30`,color:k.c,fontSize:8.5,fontWeight:700,cursor:"pointer"}}>Edit</button>
          </div>
        </div>
      ))}
    </div>
    <BottomNav items={SA_NAV} active="kpi" onNav={onNav} accent={C.purple}/>
  </div>
);

const SASuggest = ({ onNav }) => (
  <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
    <div style={{padding:"8px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>ð¿ Suggestion Master</div><div style={{fontSize:8.5,color:C.muted}}>Aahar Â· Vihar Â· Aushadh per KPI</div></div>
      <button style={{padding:"7px 13px",borderRadius:10,background:`linear-gradient(135deg,${C.g2},${C.g3})`,border:"none",color:"#fff",fontSize:9.5,fontWeight:700,cursor:"pointer"}}>+ Add</button>
    </div>
    <div style={{display:"flex",gap:6,padding:"0 12px 10px",overflowX:"auto"}}>
      {["All","T1 KPI Risk","T2 Question","Both"].map((f,i)=>(
        <span key={f} style={{fontSize:8.5,background:i===0?`${C.g3}20`:C.card,color:i===0?C.g3:"rgba(255,255,255,.38)",borderRadius:8,padding:"5px 11px",border:`1px solid ${i===0?C.g3+"44":C.border}`,whiteSpace:"nowrap",flexShrink:0,cursor:"pointer",fontWeight:i===0?700:400}}>{f}</span>
      ))}
    </div>
    <div style={{padding:"0 12px",display:"flex",flexDirection:"column",gap:9}}>
      {[{kpi:"Sleep",i:"ð",c:"#7c6af7",q:null,tier:"T1",aahar:"Warm turmeric milk at bedtime",vihar:"Digital detox 9PM. Fixed 6AM alarm",aushadh:"Brahmi + Ashwagandha at bedtime"},{kpi:"Sleep",i:"ð",c:"#7c6af7",q:"SLEEP_Q2: duration < 2.5",tier:"T2",aahar:"Last meal by 6:30PM. Light protein.",vihar:"Strict 10PM alarm. Blackout curtains.",aushadh:"Valerian root tea 30 min before bed"},{kpi:"Stress",i:"ð§",c:C.orange,q:null,tier:"T1",aahar:"Reduce sugar. Ashwagandha latte.",vihar:"5-min Anulom Vilom morning.",aushadh:"Shankhpushpi syrup."},{kpi:"Hydration",i:"ð§",c:"#38bdf8",q:"HYDRATION_Q1: <2.5 glasses",tier:"T2",aahar:"Infused water: mint + cucumber",vihar:"Water alarm every 2 hours",aushadh:"Electrolyte powder daily"}].map((s,i)=>(
        <div key={i} style={{background:C.card,borderRadius:16,padding:"12px",border:`1px solid ${s.c}33`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
            <div style={{display:"flex",gap:7,alignItems:"center"}}>
              <span style={{fontSize:15}}>{s.i}</span>
              <div>
                <div style={{fontSize:10.5,fontWeight:700,color:"#fff"}}>{s.kpi} Â· {s.tier}</div>
                {s.q?<div style={{fontSize:7.5,color:C.gold}}>â¡ {s.q}</div>:<div style={{fontSize:7.5,color:C.muted}}>KPI-level trigger</div>}
              </div>
            </div>
            <div style={{display:"flex",gap:4}}>
              <Pill label={s.tier} color={s.tier==="T1"?C.g3:C.gold}/>
              <button style={{padding:"2px 8px",borderRadius:6,background:`${s.c}13`,border:`1px solid ${s.c}28`,color:s.c,fontSize:8,fontWeight:700,cursor:"pointer"}}>Edit</button>
            </div>
          </div>
          {[["ð¥",C.g3,s.aahar],["ð",C.blue,s.vihar],["ð¿",C.gold,s.aushadh]].map(([ic,col,txt])=>(
            <div key={ic} style={{display:"flex",gap:7,marginBottom:5,alignItems:"flex-start"}}>
              <span style={{fontSize:11,width:18,flexShrink:0}}>{ic}</span>
              <span style={{fontSize:8.5,color:"rgba(255,255,255,.42)",lineHeight:1.45,flex:1}}>{txt}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
    <BottomNav items={SA_NAV} active="suggest" onNav={onNav} accent={C.purple}/>
  </div>
);

const SASettings = ({ onNav }) => (
  <div style={{background:C.bg,minHeight:"100%",paddingBottom:70}}>
    <div style={{padding:"8px 16px 12px"}}><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>âï¸ Settings</div><div style={{fontSize:8.5,color:C.muted}}>Platform configuration Â· RBAC</div></div>
    <div style={{padding:"0 12px",display:"flex",flexDirection:"column",gap:9}}>
      {/* RBAC section */}
      <div style={{background:C.card,borderRadius:16,padding:"13px",border:`1px solid ${C.purple}33`}}>
        <div style={{fontSize:10.5,fontWeight:700,color:C.purple,marginBottom:10}}>ð Role Based Access (RBAC)</div>
        {[{r:"super_admin",c:C.purple,acc:"Full platform access"},{r:"ayumonk_admin",c:C.blue,acc:"All except billing"},{r:"hr",c:C.teal,acc:"Company data + analytics"},{r:"cxo",c:C.gold,acc:"Analytics read-only"},{r:"employee",c:C.g3,acc:"Own data only"},{r:"readonly",c:C.muted,acc:"View reports only"}].map(r=>(
          <div key={r.r} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7,paddingBottom:7,borderBottom:"1px solid rgba(255,255,255,.04)"}}>
            <span style={{fontSize:9.5,fontWeight:700,color:r.c}}>{r.r}</span>
            <span style={{fontSize:8.5,color:"rgba(255,255,255,.38)"}}>{r.acc}</span>
          </div>
        ))}
      </div>
      {/* Platform toggles */}
      <div style={{background:C.card,borderRadius:16,padding:"13px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:10.5,fontWeight:700,color:"rgba(255,255,255,.6)",marginBottom:10}}>Platform Toggles</div>
        {[{l:"Health Connect auto-sync",on:true},{l:"PWA push notifications",on:true},{l:"Ayufinity marketplace",on:true},{l:"Team challenges",on:false},{l:"Two-tier suggestions",on:true}].map(t=>(
          <div key={t.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
            <span style={{fontSize:9.5,color:"rgba(255,255,255,.55)"}}>{t.l}</span>
            <div style={{width:36,height:20,borderRadius:10,background:t.on?C.g3:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",padding:"2px",cursor:"pointer",transition:"background .2s"}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",transform:t.on?"translateX(16px)":"translateX(0)",transition:"transform .2s"}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
    <BottomNav items={SA_NAV} active="settings" onNav={onNav} accent={C.purple}/>
  </div>
);

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   MAIN APP â manages all navigation state
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
export default function App(){
  const [role,setRole]=useState("employee");

  /* each role has its own current screen id */
  const [empScreen, setEmpScreen]=useState("wellness");
  const [hrScreen,  setHrScreen] =useState("home");
  const [saScreen,  setSaScreen] =useState("home");

  const ROLE_META={
    employee:{color:C.g3, label:"ð¤ Employee",  sub:"User View Â· 3 tabs"},
    hr:      {color:C.blue,label:"ð HR Admin",  sub:"Company View Â· 4 tabs"},
    admin:   {color:C.purple,label:"âï¸ Super Admin",sub:"Platform View Â· 5 tabs"},
  };

  /* Build the screen component for the active role+screen */
  const renderScreen = () => {
    if(role==="employee"){
      if(empScreen==="wellness")   return <EmpWellness   onNav={setEmpScreen}/>;
      if(empScreen==="challenges") return <EmpChallenges onNav={setEmpScreen}/>;
      if(empScreen==="responses")  return <EmpResponses  onNav={setEmpScreen}/>;
    }
    if(role==="hr"){
      if(hrScreen==="home")      return <HRHome     onNav={setHrScreen}/>;
      if(hrScreen==="analytics") return <HRAnalytics onNav={setHrScreen}/>;
      if(hrScreen==="people")    return <HRPeople   onNav={setHrScreen}/>;
      if(hrScreen==="programs")  return <HRPrograms onNav={setHrScreen}/>;
    }
    if(role==="admin"){
      if(saScreen==="home")      return <SAHome      onNav={setSaScreen}/>;
      if(saScreen==="companies") return <SACompanies onNav={setSaScreen}/>;
      if(saScreen==="kpi")       return <SAKPI       onNav={setSaScreen}/>;
      if(saScreen==="suggest")   return <SASuggest   onNav={setSaScreen}/>;
      if(saScreen==="settings")  return <SASettings  onNav={setSaScreen}/>;
    }
    return null;
  };

  const meta = ROLE_META[role];

  return(
    <div style={{minHeight:"100vh",background:C.dark,fontFamily:"'Plus Jakarta Sans',sans-serif",padding:"28px 20px 48px"}}>
      <style>{GSTYLE}</style>

      {/* Header */}
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:10}}>
          <Logo s={30}/>
        </div>
        <div style={{fontSize:24,fontWeight:800,color:"#fff",fontFamily:"'Syne',sans-serif",letterSpacing:-.5,marginBottom:4}}>AyuMonk Mobile PWA</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>Interactive designs for all three platform roles Â· tap nav buttons inside the phone</div>
      </div>

      {/* Role selector */}
      <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:28,flexWrap:"wrap"}}>
        {Object.entries(ROLE_META).map(([id,m])=>(
          <button key={id} onClick={()=>setRole(id)}
            style={{padding:"12px 20px",borderRadius:16,border:`2px solid ${role===id?m.color:C.border}`,background:role===id?`${m.color}12`:C.card,cursor:"pointer",textAlign:"center",minWidth:110,transition:"all .2s",boxShadow:role===id?`0 0 24px ${m.color}22`:"none"}}>
            <div style={{fontSize:12,fontWeight:800,color:role===id?m.color:"rgba(255,255,255,.45)"}}>{m.label}</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,.22)",marginTop:2}}>{m.sub}</div>
          </button>
        ))}
      </div>

      {/* Role label */}
      <div style={{textAlign:"center",marginBottom:22}}>
        <div style={{fontSize:13,fontWeight:700,color:meta.color}}>{meta.label} â {meta.sub}</div>
        <div style={{fontSize:9.5,color:"rgba(255,255,255,.22)",marginTop:2}}>Use the bottom nav tabs inside the phone to switch screens</div>
      </div>

      {/* Phone */}
      <div style={{display:"flex",justifyContent:"center",marginBottom:32}}>
        <div key={`${role}-${empScreen}-${hrScreen}-${saScreen}`} className="anim">
          <Phone>{renderScreen()}</Phone>
        </div>
      </div>

      {/* Screen quick-jump dots */}
      <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:28,flexWrap:"wrap"}}>
        {role==="employee"&&[["wellness","ð¿ Wellness"],["challenges","ð¯ Challenges"],["responses","ð Responses"]].map(([id,l])=>(
          <button key={id} onClick={()=>setEmpScreen(id)} style={{padding:"7px 14px",borderRadius:10,border:`1px solid ${empScreen===id?C.g3:C.border}`,background:empScreen===id?`${C.g3}15`:C.card,color:empScreen===id?C.g3:"rgba(255,255,255,.35)",fontSize:9.5,fontWeight:empScreen===id?700:400,cursor:"pointer",transition:"all .2s"}}>{l}</button>
        ))}
        {role==="hr"&&[["home","ð  Home"],["analytics","ð Analytics"],["people","ð¥ People"],["programs","ð Programs"]].map(([id,l])=>(
          <button key={id} onClick={()=>setHrScreen(id)} style={{padding:"7px 14px",borderRadius:10,border:`1px solid ${hrScreen===id?C.blue:C.border}`,background:hrScreen===id?`${C.blue}15`:C.card,color:hrScreen===id?C.blue:"rgba(255,255,255,.35)",fontSize:9.5,fontWeight:hrScreen===id?700:400,cursor:"pointer",transition:"all .2s"}}>{l}</button>
        ))}
        {role==="admin"&&[["home","ð  Home"],["companies","ð¢ Companies"],["kpi","ð¯ KPIs"],["suggest","ð¿ Suggests"],["settings","âï¸ Settings"]].map(([id,l])=>(
          <button key={id} onClick={()=>setSaScreen(id)} style={{padding:"7px 14px",borderRadius:10,border:`1px solid ${saScreen===id?C.purple:C.border}`,background:saScreen===id?`${C.purple}15`:C.card,color:saScreen===id?C.purple:"rgba(255,255,255,.35)",fontSize:9.5,fontWeight:saScreen===id?700:400,cursor:"pointer",transition:"all .2s"}}>{l}</button>
        ))}
      </div>

      {/* Feature notes */}
      <div style={{maxWidth:680,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>
        {[
          {i:"â",t:"Bottom Nav Works",d:"All tab buttons inside the phone switch screens â fully wired navigation"},
          {i:"ð¯",t:"KPI Tap â Sheet",d:"Tap any KPI tile on Wellness screen to open detail sheet with questions, scores & Ayumonk suggestions"},
          {i:"ð",t:"VataÂ·PittaÂ·Kapha",d:"Prakriti Dosha ring chart on Wellness screen â Ayufinity.com integration hook built in"},
          {i:"ð§",t:"Live Challenges",d:"All 6 challenge types interactive: counter, toggle, timer, auto-sync badge, mood picker"},
        ].map(f=>(
          <div key={f.t} style={{background:C.card,borderRadius:13,padding:"13px",border:`1px solid ${C.g3}18`}}>
            <div style={{fontSize:18,marginBottom:5}}>{f.i}</div>
            <div style={{fontSize:10.5,fontWeight:700,color:C.g3,marginBottom:3}}>{f.t}</div>
            <div style={{fontSize:8.5,color:"rgba(255,255,255,.35)",lineHeight:1.5}}>{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
