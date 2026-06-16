import { useState, useEffect, useRef } from "react";
import { formatDateIST, formatDateTimeISTShort } from "../../utils/dateTime";
import AyuLogo from "../../components/AyuLogo";

// ─── BRAND COLORS ─────────────────────────────────────────────────────────────
const C = {
  bg:"#0b160c", card:"#111e12", border:"#1e3d20",
  g1:"#2C5F2D", g2:"#4A8C2A", g3:"#6DB33F", g4:"#97C95C",
  white:"#FFFFFF", cream:"#E8F0E0", muted:"#6B8F60",
  orange:"#E8924A", blue:"#4A90C4", purple:"#8B6FCB",
  gold:"#D4A843", teal:"#3AADA8", red:"#E05050", pink:"#f472b6",
};

// ─── IN-APP NOTIFICATION CENTER ──────────────────────────────────────────────
// Mirrors the reminder_log table. Push notifications that arrive in the shutter
// are ALSO recorded here so employees can review them when the app is open.
// Production: GET /api/notifications (RLS: user_id = current_app_user_id())
// Actionable inline buttons simulate Service Worker Notification API actions:
// ServiceWorkerRegistration.showNotification(title, { actions: [...] })
// Each action fires a 'notificationclick' event with action code in the SW.
const MOCK_NOTIFICATIONS = [
  { id:"n1", type:"streak_risk",      icon:"🔥", title:"Streak at Risk!",
    body:"Your 7-day Hydration streak ends tonight. Complete the challenge to keep it.",
    time:"Today 9:00 PM", read:false, action:"challenges", challengeId:"water",
    actionLabel:"Complete Now",
    // Inline actions — rendered as buttons inside the notification panel AND
    // sent as Service Worker notification actions (no app open required)
    actions:[
      { code:"complete", label:"✓ Mark Done",   color:"#6DB33F", primary:true  },
      { code:"snooze",   label:"⏸ Snooze 1h",  color:"#E8A020", primary:false },
    ]
  },
  { id:"n2", type:"milestone_near",   icon:"🏅", title:"Badge Unlocks Tomorrow!",
    body:"Complete Sleep Before 10PM today and unlock the Sleep Master badge (21 days).",
    time:"Today 8:00 AM", read:false, action:"challenges", challengeId:"sleep",
    actionLabel:"Go to Challenges",
    actions:[
      { code:"complete", label:"✓ Commit Now",  color:"#6DB33F", primary:true  },
      { code:"view",     label:"👁 View Badge", color:"#4A90C4", primary:false },
    ]
  },
  { id:"n3", type:"daily_incomplete", icon:"📋", title:"2 Challenges Left Today",
    body:"Eat Well Today and Daily Mood Check still pending. Takes under 3 minutes.",
    time:"Yesterday 8:00 PM", read:true, action:"challenges", challengeId:null,
    actionLabel:"Open Challenges",
    actions:[
      { code:"open",     label:"Open App",     color:"#4A90C4", primary:true  },
      { code:"dismiss",  label:"Dismiss",      color:"#6B8F60", primary:false },
    ]
  },
  { id:"n4", type:"window_closing",   icon:"📅", title:"Hydration Program Ends in 3 Days",
    body:"The Hydration KPI window closes 31 Dec. Complete your remaining challenges.",
    time:"3 days ago", read:true, action:"challenges", challengeId:null,
    actionLabel:"View Schedule",
    actions:[
      { code:"view",     label:"📅 View Schedule", color:"#8B6FCB", primary:true  },
    ]
  },
  { id:"n5", type:"window_opening",   icon:"🌱", title:"New Program Starts Tomorrow",
    body:"Stress & Recovery program launches tomorrow. Sleep + Stress challenges unlock.",
    time:"4 days ago", read:true, action:"challenges", challengeId:null,
    actionLabel:"Preview Program",
    actions:[
      { code:"preview",  label:"🌿 Preview",  color:"#6DB33F", primary:true  },
    ]
  },
  { id:"n6", type:"team_challenge",   icon:"🏆", title:"Your Team is Winning! 🎉",
    body:"Engineering leads Marketing by +2.1% in the Sleep Sprint. Keep it up!",
    time:"5 days ago", read:true, action:"challenges", challengeId:null,
    actionLabel:"View Challenge",
    actions:[
      { code:"view",     label:"🏆 View Race",  color:"#D4A843", primary:true  },
      { code:"share",    label:"📤 Share",       color:"#6B8F60", primary:false },
    ]
  },
];

function NotificationBell({ onNavigate }) {
  const [open, setOpen]       = useState(false);
  const [notifs, setNotifs]   = useState(MOCK_NOTIFICATIONS);
  const unread = notifs.filter(n=>!n.read).length;

  const markRead = (id) => setNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n));
  const markAllRead = () => setNotifs(p=>p.map(n=>({...n,read:true})));
  const clearAll = () => setNotifs([]);

  const TYPE_COLORS = {
    streak_risk:"#E8A020", milestone_near:C.g3,
    daily_incomplete:"#4A90C4", window_closing:"#8B6FCB", window_opening:C.g3,
  };

  return (
    <div style={{position:"relative"}}>
      {/* Bell button */}
      <button
        onClick={()=>setOpen(p=>!p)}
        style={{position:"relative",background:open?"rgba(107,179,63,0.12)":"rgba(255,255,255,0.05)",
          border:`1px solid ${open?C.g3:"rgba(255,255,255,0.1)"}`,borderRadius:9,
          padding:"6px 10px",cursor:"pointer",color:open?C.g3:"rgba(255,255,255,0.55)",
          fontSize:16,display:"flex",alignItems:"center",gap:4,transition:"all 0.15s"}}>
        🔔
        {unread>0&&(
          <span style={{position:"absolute",top:-5,right:-5,background:C.orange,
            color:"#fff",borderRadius:"50%",width:16,height:16,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:8,fontWeight:800,border:`1.5px solid ${C.bg}`}}>
            {unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open&&(
        <>
          {/* Click-away backdrop */}
          <div style={{position:"fixed",inset:0,zIndex:998}} onClick={()=>setOpen(false)}/>
          <div style={{
            position:"absolute",top:"calc(100% + 8px)",right:0,width:340,
            background:C.card,border:`1px solid ${C.g2}`,borderRadius:14,
            boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:999,overflow:"hidden"
          }}>
            {/* Header */}
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,fontWeight:700}}>Notifications</span>
                {unread>0&&<span style={{fontSize:8,background:C.orange,color:"#fff",
                  borderRadius:8,padding:"1px 7px",fontWeight:700}}>{unread} new</span>}
              </div>
              <div style={{display:"flex",gap:8}}>
                {unread>0&&<button onClick={markAllRead}
                  style={{background:"transparent",border:"none",color:C.g3,
                    fontSize:8,cursor:"pointer",fontWeight:600}}>Mark all read</button>}
                {notifs.length>0&&<button onClick={clearAll}
                  style={{background:"transparent",border:"none",color:C.muted,
                    fontSize:8,cursor:"pointer"}}>Clear all</button>}
              </div>
            </div>

            {/* Notification list */}
            <div style={{maxHeight:360,overflowY:"auto"}}>
              {notifs.length===0?(
                <div style={{padding:"30px 16px",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:8}}>🔔</div>
                  <div style={{fontSize:11,color:C.muted}}>You're all caught up!</div>
                </div>
              ):notifs.map(n=>(
                <div key={n.id}
                  onClick={()=>{ markRead(n.id); setOpen(false); onNavigate(n.action); }}
                  style={{
                    padding:"10px 14px",cursor:"pointer",
                    background:n.read?"transparent":"rgba(107,179,63,0.04)",
                    borderBottom:`1px solid rgba(255,255,255,0.04)`,
                    transition:"background 0.15s"
                  }}>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{
                      width:34,height:34,borderRadius:9,flexShrink:0,
                      background:`${TYPE_COLORS[n.type]||C.g3}18`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:16,border:`1px solid ${TYPE_COLORS[n.type]||C.g3}33`
                    }}>{n.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                        <div style={{fontSize:10,fontWeight:n.read?600:700,
                          color:n.read?"rgba(255,255,255,0.55)":"#fff",lineHeight:1.3}}>
                          {n.title}
                          {!n.read&&<span style={{display:"inline-block",width:6,height:6,
                            borderRadius:"50%",background:C.g3,marginLeft:5,verticalAlign:"middle"}}/>}
                        </div>
                        <span style={{fontSize:7.5,color:C.muted,flexShrink:0,whiteSpace:"nowrap"}}>{n.time}</span>
                      </div>
                      <div style={{fontSize:8.5,color:"rgba(255,255,255,0.38)",
                        marginTop:3,lineHeight:1.45,whiteSpace:"nowrap",overflow:"hidden",
                        textOverflow:"ellipsis"}}>{n.body}</div>
                      {/* Inline action buttons — simulate SW notification actions */}
                      <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>
                        {(n.actions||[]).map(a=>(
                          <button key={a.code}
                            onClick={e=>{ e.stopPropagation();
                              if(a.code==="complete"){ alert(`✅ Challenge marked done from notification!`); markRead(n.id); }
                              else if(a.code==="snooze"){ alert("⏸ Snoozed for 1 hour"); markRead(n.id); }
                              else if(a.code==="dismiss"){ markRead(n.id); }
                              else { markRead(n.id); setOpen(false); onNavigate(n.action); }
                            }}
                            style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${a.color}44`,
                              background:a.primary?`${a.color}18`:"transparent",
                              color:a.color,fontSize:8,fontWeight:a.primary?700:400,cursor:"pointer"}}>
                            {a.label}
                          </button>
                        ))}
                        {(!n.actions||n.actions.length===0)&&(
                          <span style={{fontSize:8,background:`${TYPE_COLORS[n.type]||C.g3}18`,
                            color:TYPE_COLORS[n.type]||C.g3,borderRadius:5,padding:"1px 8px",fontWeight:600}}>
                            {n.actionLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated push notification preview */}
            <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,background:"rgba(107,179,63,0.03)"}}>
              <div style={{fontSize:8,color:C.muted,marginBottom:6}}>🔔 Push notification preview (as it appears in your notification shade)</div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"10px 12px",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <span style={{fontSize:10}}>🌿</span>
                  <span style={{fontSize:9,fontWeight:700}}>AyuMonk</span>
                  <span style={{fontSize:8,color:C.muted,marginLeft:"auto"}}>now</span>
                </div>
                <div style={{fontSize:10,fontWeight:600,color:"#fff",marginBottom:2}}>🔥 Streak at Risk!</div>
                <div style={{fontSize:8.5,color:"rgba(255,255,255,0.5)",marginBottom:8}}>Your 7-day Hydration streak ends tonight.</div>
                {/* Notification action buttons — these map to SW notification actions */}
                <div style={{display:"flex",gap:6}}>
                  <button style={{flex:1,padding:"5px 8px",borderRadius:7,background:"rgba(107,179,63,0.2)",border:"1px solid rgba(107,179,63,0.4)",color:C.g3,fontSize:8.5,fontWeight:700,cursor:"pointer"}}>
                    ✓ Mark Done
                  </button>
                  <button style={{flex:1,padding:"5px 8px",borderRadius:7,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:C.muted,fontSize:8.5,cursor:"pointer"}}>
                    ⏸ Snooze 1h
                  </button>
                </div>
                <div style={{fontSize:7,color:"rgba(255,255,255,0.18)",marginTop:5,textAlign:"center"}}>
                  These buttons work from the notification shade — no need to open the app
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── PWA HELPERS & CONSTANTS ─────────────────────────────────────────────────
// In production these come from:
//   navigator.serviceWorker  (Service Worker API)
//   window.PushManager       (Web Push API)
//   window.indexedDB         (offline storage)
//
// Offline sync queue (simulated — production uses IndexedDB + Background Sync)
const OFFLINE_QUEUE_KEY = "ayumonk_offline_queue";

// Detect iOS manually (beforeinstallprompt not available)
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

// Detect if running in standalone PWA mode (installed)
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

// Push permission state
const getPushPermission = () =>
  typeof Notification !== "undefined" ? Notification.permission : "default";

// ─── WELLNESS PARAMS ──────────────────────────────────────────────────────────
// ─── WELLNESS PARAMS WITH QUESTION-LEVEL SCORES & THRESHOLDS ─────────────────
// Each KPI has:
//   questions: individual question scores (simulated) + threshold for precision triggers
//   suggestions.kpiLevel: shown when overall KPI average_score is in risk/moderate band
//   suggestions.questionLevel: shown when a specific question score crosses threshold
const PARAMS = [
  { id:"sleep", label:"Sleep", icon:"🌙", color:"#7c6af7", weight:0.20, baseline:2.8, sfDomain:"Mental Health", inverse:false,
    questions:[
      { key:"SLEEP_Q1", label:"How well do you fall asleep?",    score:2.8, thresholdBelow:3.0, reverse:false },
      { key:"SLEEP_Q2", label:"How many hours do you sleep?",    score:2.1, thresholdBelow:2.5, reverse:false },
      { key:"SLEEP_Q3", label:"Do you wake up refreshed?",       score:2.4, thresholdBelow:2.5, reverse:false },
    ],
    suggestions:{
      kpiLevel:{
        aahar:"Warm turmeric milk at bedtime. Early dinner by 7PM.",
        vihar:"Digital detox from 9PM. Fixed wake-up alarm at 6AM.",
        aushadh:"Brahmi + Ashwagandha capsule at bedtime. Jatamansi oil on temples.",
      },
      questionLevel:[
        { key:"SLEEP_Q2", condition:"Sleep duration < 2.5", triggerMode:"question_score",
          aahar:"Eat last meal by 6:30PM. Avoid heavy protein at night.",
          vihar:"Strict 10PM alarm. Blackout curtains. Sleep mask.",
          aushadh:"Valerian root tea 30 min before bed." },
        { key:"SLEEP_Q3", condition:"Not refreshed < 2.5", triggerMode:"question_score",
          aahar:"Banana + warm milk protein combo before bed.",
          vihar:"Yoga Nidra 20-min audio. Cool room temperature.",
          aushadh:"Ashwagandha churna with ghee at bedtime." },
      ]
    }
  },
  { id:"stress", label:"Stress", icon:"🧘", color:"#f97316", weight:0.15, baseline:3.4, sfDomain:"Role Emotional", inverse:true,
    questions:[
      { key:"STRESS_Q1", label:"How often do you feel overwhelmed?",  score:3.8, thresholdAbove:3.5, reverse:true },
      { key:"STRESS_Q2", label:"Does stress disrupt your sleep?",      score:2.3, thresholdBelow:2.5, reverse:false },
      { key:"STRESS_Q3", label:"Can you unwind after work?",           score:2.9, thresholdBelow:3.0, reverse:false },
    ],
    suggestions:{
      kpiLevel:{
        aahar:"Reduce processed sugar. Ashwagandha latte in morning.",
        vihar:"5-min Anulom Vilom morning. Nature walk on weekends.",
        aushadh:"Shankhpushpi syrup. Adaptogenic herb blend.",
      },
      questionLevel:[
        { key:"STRESS_Q1", condition:"Overwhelmed score > 3.5 (reverse)", triggerMode:"question_score",
          aahar:"Sattvic diet: fruits, nuts, no processed food.",
          vihar:"10-min journaling at night. Phone-free hour after dinner.",
          aushadh:"Brahmi ghrita one teaspoon in warm water." },
        { key:"STRESS_Q2", condition:"Stress disrupting sleep < 2.5", triggerMode:"both",
          aahar:"Tart cherry juice in evening. Chamomile tea.",
          vihar:"Progressive muscle relaxation before bed.",
          aushadh:"Jatamansi + Brahmi combination capsule." },
      ]
    }
  },
  { id:"nutrition", label:"Nutrition", icon:"🥗", color:"#22c55e", weight:0.15, baseline:3.1, sfDomain:"General Health", inverse:false,
    questions:[
      { key:"NUTRITION_Q1", label:"How often do you eat home-cooked meals?", score:2.0, thresholdBelow:2.5, reverse:false },
      { key:"NUTRITION_Q2", label:"How many servings of veg do you eat?",    score:2.6, thresholdBelow:3.0, reverse:false },
      { key:"NUTRITION_Q3", label:"Do you avoid fried/processed snacks?",    score:2.8, thresholdBelow:3.0, reverse:false },
    ],
    suggestions:{
      kpiLevel:{
        aahar:"Seasonal vegetables + dals. Rainbow plate principle.",
        vihar:"Cook at home 5 nights/week. Eat slowly, chew 20x.",
        aushadh:"Triphala churna after dinner. Digestive enzyme support.",
      },
      questionLevel:[
        { key:"NUTRITION_Q1", condition:"Home-cooked meals < 2.5", triggerMode:"question_score",
          aahar:"Batch-cook dal + rice on weekends. Carry tiffin daily.",
          vihar:"Weekly meal plan Sunday using Ayumonk guide.",
          aushadh:"Digestive enzyme supplement with restaurant meals." },
      ]
    }
  },
  { id:"hydration", label:"Hydration", icon:"💧", color:"#38bdf8", weight:0.10, baseline:3.0, sfDomain:"Vitality", inverse:false,
    questions:[
      { key:"HYDRATION_Q1", label:"How many glasses of water per day?",    score:2.3, thresholdBelow:2.5, reverse:false },
      { key:"HYDRATION_Q2", label:"Do you feel thirsty frequently?",       score:3.6, thresholdAbove:3.5, reverse:true },
    ],
    suggestions:{
      kpiLevel:{
        aahar:"Jeera water each morning. 8 glasses/day minimum.",
        vihar:"Set phone alarm every 90 min as water reminder.",
        aushadh:"Coconut water electrolytes in summer.",
      },
      questionLevel:[
        { key:"HYDRATION_Q1", condition:"Water intake < 2.5 (< 4 glasses)", triggerMode:"question_score",
          aahar:"Jeera-infused water on waking. Coconut water at noon.",
          vihar:"Phone alarm every 90 minutes for water reminder.",
          aushadh:"Electrolyte powder in one glass daily." },
      ]
    }
  },
  { id:"digestion", label:"Digestion", icon:"🫁", color:"#a3e635", weight:0.10, baseline:3.2, sfDomain:"General Health", inverse:false,
    questions:[
      { key:"DIGESTION_Q1", label:"Do you experience bloating or gas?",    score:3.7, thresholdAbove:3.5, reverse:true },
      { key:"DIGESTION_Q2", label:"Do you have regular bowel movements?",  score:2.8, thresholdBelow:3.0, reverse:false },
    ],
    suggestions:{
      kpiLevel:{
        aahar:"Ginger-lemon tea post lunch. Warm water always.",
        vihar:"10-min walk after dinner. Vajrasana pose after meals.",
        aushadh:"Hingvastak churna before meals. Trikatu blend.",
      },
      questionLevel:[
        { key:"DIGESTION_Q1", condition:"Bloating/gas > 3.5 (reverse)", triggerMode:"question_score",
          aahar:"Avoid pulses at dinner. Fennel seed water after meals.",
          vihar:"Vajrasana for 10 min after every meal.",
          aushadh:"Hingvastak churna before meals. Triphala at bedtime." },
      ]
    }
  },
  { id:"activity",  label:"Activity",     icon:"🏃", color:"#fb923c", weight:0.10, baseline:2.9, sfDomain:"Physical Func.", inverse:false,
    questions:[
      { key:"ACTIVITY_Q1", label:"Minutes of daily movement?",         score:2.5, thresholdBelow:3.0, reverse:false },
      { key:"ACTIVITY_Q2", label:"Do you do structured exercise?",      score:1.9, thresholdBelow:2.0, reverse:false },
    ],
    suggestions:{
      kpiLevel:{
        aahar:"Light banana or dates pre-workout. Stay hydrated.",
        vihar:"20-min desk yoga at 11AM. Always take stairs.",
        aushadh:"Mahanarayan oil massage weekly.",
      },
      questionLevel:[
        { key:"ACTIVITY_Q2", condition:"No structured exercise < 2.0", triggerMode:"question_score",
          aahar:"Light banana pre-workout. Stay hydrated throughout.",
          vihar:"Start with 15-min walk. Take stairs always.",
          aushadh:"Mahanarayan oil self-massage every Sunday." },
      ]
    }
  },
  { id:"pain",      label:"Pain/Posture", icon:"🦴", color:"#e879f9", weight:0.10, baseline:3.3, sfDomain:"Bodily Pain", inverse:true,
    questions:[
      { key:"PAIN_Q1", label:"Do you experience back or neck pain?",    score:3.9, thresholdAbove:3.5, reverse:true },
      { key:"PAIN_Q2", label:"Is your desk setup ergonomic?",           score:2.6, thresholdBelow:2.5, reverse:false },
    ],
    suggestions:{
      kpiLevel:{
        aahar:"Anti-inflammatory diet. Turmeric golden milk.",
        vihar:"Shoulder rolls every 45 min. Ergonomic chair audit.",
        aushadh:"Mahamash tailam topical. Shallaki supplement.",
      },
      questionLevel:[
        { key:"PAIN_Q1", condition:"Back/neck pain > 3.5 (reverse)", triggerMode:"question_score",
          aahar:"Anti-inflammatory foods: ginger, turmeric, omega-3.",
          vihar:"Neck stretch + shoulder roll every 45 min.",
          aushadh:"Mahamash tailam oil massage twice weekly." },
      ]
    }
  },
  { id:"energy",    label:"Energy",       icon:"⚡", color:"#fbbf24", weight:0.10, baseline:3.1, sfDomain:"Role Physical", inverse:false,
    questions:[
      { key:"ENERGY_Q1", label:"Afternoon energy levels?",              score:1.9, thresholdBelow:2.0, reverse:false },
      { key:"ENERGY_Q2", label:"Do you wake up with energy?",           score:2.5, thresholdBelow:3.0, reverse:false },
    ],
    suggestions:{
      kpiLevel:{
        aahar:"Reduce afternoon carb load. Soak almonds overnight.",
        vihar:"10-min power nap at lunch. Sunlight exposure morning.",
        aushadh:"Chyawanprash every morning. Shilajit with warm milk.",
      },
      questionLevel:[
        { key:"ENERGY_Q1", condition:"Afternoon energy < 2.0 (always drained)", triggerMode:"question_score",
          aahar:"Soaked almonds in morning. Avoid post-lunch carbs.",
          vihar:"10-min power nap at 1PM. Morning sunlight 5 min.",
          aushadh:"Chyawanprash 1 tsp on empty stomach. Shilajit in warm milk." },
      ]
    }
  },
  { id:"emotional", label:"Emotional",    icon:"💚", color:"#34d399", weight:0.00, baseline:3.0, sfDomain:"Role Emotional", inverse:false,
    questions:[
      { key:"EMOTIONAL_Q1", label:"Do you feel emotionally balanced?",  score:2.8, thresholdBelow:3.0, reverse:false },
      { key:"EMOTIONAL_Q2", label:"Do you feel connected with others?", score:3.2, thresholdBelow:3.0, reverse:false },
    ],
    suggestions:{
      kpiLevel:{
        aahar:"Eat with family or a friend. Social meals boost mood.",
        vihar:"Gratitude journal 3 entries nightly. Disconnect from news.",
        aushadh:"None needed — lifestyle is the medicine.",
      },
      questionLevel:[]
    }
  },
  { id:"social",    label:"Social",       icon:"👨‍👩‍👧", color:"#f472b6", weight:0.00, baseline:2.8, sfDomain:"Social Func.", inverse:false,
    questions:[
      { key:"SOCIAL_Q1", label:"Shared family meals per week?",         score:2.2, thresholdBelow:2.5, reverse:false },
      { key:"SOCIAL_Q2", label:"Quality time with friends?",            score:2.4, thresholdBelow:2.5, reverse:false },
    ],
    suggestions:{
      kpiLevel:{
        aahar:"Shared meal ritual. Cook together as a family.",
        vihar:"Family meal 3x/week. One outdoor group activity monthly.",
        aushadh:"Community and belonging are the deepest healing.",
      },
      questionLevel:[]
    }
  },
];

// ─── GENERATED TREND DATA ─────────────────────────────────────────────────────
const clamp=(v,mn=1,mx=5)=>Math.min(mx,Math.max(mn,v));
const genSeries=(base,n,grow=0.06)=>{let v=base;return Array.from({length:n},()=>{v=clamp(v+(Math.random()-0.32)*0.4+grow);return +v.toFixed(2);});};
const DAILY={},WEEKLY={},MONTHLY={};
PARAMS.forEach(p=>{DAILY[p.id]=genSeries(p.baseline,30,0.04);WEEKLY[p.id]=genSeries(p.baseline,12,0.07);MONTHLY[p.id]=genSeries(p.baseline,6,0.12);});
const ALL_VIEWS=[DAILY,WEEKLY,MONTHLY];
const ALL_LABELS=[Array.from({length:30},(_,i)=>`D${i+1}`),Array.from({length:12},(_,i)=>`W${i+1}`),["Jan","Feb","Mar","Apr","May","Jun"]];
const computeIndex=scores=>+(PARAMS.reduce((s,p)=>s+(scores[p.id]||0)*p.weight,0)*20).toFixed(1);

// ─── HR DATA ──────────────────────────────────────────────────────────────────
const DEPTS=["Engineering","Marketing","Finance","HR","Operations","Product"];
const LOCATIONS=["Delhi","Mumbai","Bengaluru","Hyderabad","Pune"];
const AGE_BANDS=["20-25","26-30","31-35","36-40","41-50","50+"];
const GENDERS=["Male","Female","Other"];
const HR_ROWS=Array.from({length:240},(_,i)=>({
  dept:DEPTS[i%6],loc:LOCATIONS[i%5],age:AGE_BANDS[i%6],gender:GENDERS[i%3],
  wellnessIndex:+(58+Math.random()*30).toFixed(1),productivity:+(60+Math.random()*30).toFixed(1),
  engagement:+(55+Math.random()*35).toFixed(1),absenteeism:+(2+Math.random()*5).toFixed(1),
  sleep:+(2.8+Math.random()*1.5).toFixed(2),stress:+(2.5+Math.random()*2).toFixed(2),nutrition:+(3.0+Math.random()*1.5).toFixed(2),
}));

// ─── CHALLENGE DEFINITIONS ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// AYUFINITY CATALOG DATA
// Production: fetched from GET /api/ayufinity/catalog (PostgreSQL: ayufinity_catalog)
// Items are personalized by dosha_type + weak KPI scores.
// ═══════════════════════════════════════════════════════════════════════════════

const AYUFINITY_CATALOG = [
  // ── CONSULTATIONS ───────────────────────────────────────────────────────────
  { id:"c1", type:"consultation", category:"consultation",
    name:"Ayurvedic Health Assessment", practitioner:"Dr. Ananya Sharma",
    credential:"BAMS, MD (Ayurveda) · 12 years", avatar:"👩‍⚕️",
    specialty:"Dosha Analysis & Lifestyle Correction",
    duration:"60 min", price:1200, rating:4.9, reviews:312,
    nextSlot:"Tomorrow 10:00 AM", mode:"Video",
    kpis:["sleep","stress","digestion"], dosha:["vata","pitta","kapha","all"],
    badge:"Most Booked", badgeColor:"#D4A843",
    desc:"A comprehensive 60-min Ayurvedic assessment covering your Prakriti, Vikriti, digestive fire (Agni), and current imbalances. Includes a 7-day personalised protocol.",
  },
  { id:"c2", type:"consultation", category:"consultation",
    name:"Stress & Mental Wellness Session", practitioner:"Dr. Rohan Mehta",
    credential:"BAMS · Yoga Therapist · 8 years", avatar:"👨‍⚕️",
    specialty:"Stress, Anxiety & Burnout Recovery",
    duration:"45 min", price:900, rating:4.8, reviews:187,
    nextSlot:"Today 5:00 PM", mode:"Video",
    kpis:["stress","emotional","sleep"], dosha:["pitta","vata","all"],
    badge:"Available Today", badgeColor:"#22c55e",
    desc:"Targeted Ayurvedic and Yogic counselling for work-related stress and emotional exhaustion. Includes breathing protocols, adaptogen guidance, and a stress management Vihar plan.",
  },
  { id:"c3", type:"consultation", category:"consultation",
    name:"Nutrition & Digestive Health Consult", practitioner:"Dr. Priya Iyer",
    credential:"BAMS, PGD Nutrition · 10 years", avatar:"👩‍⚕️",
    specialty:"Aahar Planning · Gut Health · Weight",
    duration:"45 min", price:850, rating:4.7, reviews:224,
    nextSlot:"Wed 11:00 AM", mode:"Video or In-person",
    kpis:["nutrition","digestion","energy"], dosha:["kapha","pitta","all"],
    badge:null, badgeColor:null,
    desc:"In-depth Ayurvedic diet consultation covering your digestive constitution, food intolerances, meal timing, and a season-specific Aahar plan tailored to your Prakriti.",
  },
  { id:"c4", type:"consultation", category:"consultation",
    name:"Sleep & Energy Recovery Program", practitioner:"Dr. Karan Nair",
    credential:"BAMS · Sleep Medicine · 6 years", avatar:"👨‍⚕️",
    specialty:"Sleep Disorders · Fatigue · Circadian Reset",
    duration:"30 min", price:650, rating:4.8, reviews:143,
    nextSlot:"Thu 9:00 AM", mode:"Video",
    kpis:["sleep","energy","stress"], dosha:["vata","all"],
    badge:"Quick Consult", badgeColor:"#4A90C4",
    desc:"A focused 30-min session on sleep quality, circadian rhythm correction, and energy restoration using Ayurvedic Dinacharya (daily routine) principles and herbal support.",
  },

  // ── DIET PLANS (AAHAR) ───────────────────────────────────────────────────────
  { id:"d1", type:"plan", category:"diet",
    name:"Pitta-Pacifying 28-Day Reset",
    icon:"🥗", duration:"28 days", mealsPerDay:3,
    price:799, originalPrice:1299, rating:4.8, reviews:891,
    kpis:["stress","digestion","nutrition"], dosha:["pitta"],
    tags:["Anti-inflammatory","Cooling foods","Gut healing"],
    badge:"Best Seller", badgeColor:"#D4A843",
    includes:["Daily meal plan (breakfast · lunch · dinner · snack)","28 Ayurvedic recipes with prep guides","Weekly grocery lists","Seasonal adaptation notes","WhatsApp check-in reminders"],
    desc:"A complete cooling and anti-inflammatory meal program for Pitta dominance. Reduces heat, inflammation, and digestive overload. Clinically validated by BAMS practitioners.",
  },
  { id:"d2", type:"plan", category:"diet",
    name:"Vata-Balancing Nourishment Plan",
    icon:"🍲", duration:"21 days", mealsPerDay:4,
    price:699, originalPrice:1099, rating:4.7, reviews:534,
    kpis:["energy","sleep","digestion"], dosha:["vata"],
    tags:["Warming foods","Grounding","High energy"],
    badge:null, badgeColor:null,
    includes:["21-day meal plan with warm, oily foods","Recipe book (45 Vata-pacifying recipes)","Supplement schedule (Ashwagandha, Sesame)","Morning routine guide","Daily reminder nudges"],
    desc:"Designed for Vata types experiencing fatigue, anxiety, irregular digestion, or insomnia. Focuses on warming, grounding, nourishing foods that stabilise energy and calm the nervous system.",
  },
  { id:"d3", type:"plan", category:"diet",
    name:"Kapha Metabolic Detox Plan",
    icon:"🥦", duration:"14 days", mealsPerDay:2,
    price:599, originalPrice:999, rating:4.6, reviews:412,
    kpis:["nutrition","activity","digestion"], dosha:["kapha"],
    tags:["Light foods","Detox","Metabolism boost"],
    badge:"Quick Start", badgeColor:"#4A90C4",
    includes:["14-day light meal plan","Kapha-stimulating spice guide","Intermittent fasting protocol","Exercise pairing recommendations","Daily progress tracker"],
    desc:"A metabolic reset for Kapha constitutions prone to weight gain, sluggishness, and congestion. Uses light, spiced, warming foods to reignite digestive fire (Agni).",
  },
  { id:"d4", type:"plan", category:"diet",
    name:"Corporate Stress Recovery Diet",
    icon:"🌾", duration:"30 days", mealsPerDay:3,
    price:899, originalPrice:1499, rating:4.9, reviews:1204,
    kpis:["stress","energy","sleep"], dosha:["all"],
    tags:["Adaptogenic foods","Brain foods","Cortisol balance"],
    badge:"For All Doshas", badgeColor:"#6DB33F",
    includes:["30-day anti-stress meal plan","Adaptogenic food guide (Ashwagandha meals)","Cortisol-lowering dinner protocols","Office-friendly snack guide","Weekly nutritionist video review"],
    desc:"Designed specifically for corporate professionals. Addresses the nutrition patterns that drive cortisol dysregulation, afternoon energy crashes, and stress-induced cravings. Works for all three doshas.",
  },

  // ── YOGA & LIFESTYLE PLANS (VIHAR) ───────────────────────────────────────────
  { id:"y1", type:"plan", category:"yoga",
    name:"Office Desk Yoga — 21-Day Fix",
    icon:"🧘", duration:"21 days", sessionsPerWeek:5,
    price:499, originalPrice:799, rating:4.8, reviews:2341,
    kpis:["pain","activity","stress"], dosha:["all"],
    tags:["No equipment","15 min/day","Desk-friendly"],
    badge:"Most Popular", badgeColor:"#D4A843",
    includes:["21 guided video sessions (15 min each)","Posture correction guide","Chair-based stretches PDF","Shoulder + neck release routine","Progress milestone badges"],
    desc:"Specifically designed for desk workers. Covers spinal decompression, shoulder & neck tension release, hip flexor opening, and eye strain reduction. No mat or equipment needed.",
  },
  { id:"y2", type:"plan", category:"yoga",
    name:"Sleep & Anxiety Yoga Program",
    icon:"🌙", duration:"28 days", sessionsPerWeek:6,
    price:599, originalPrice:999, rating:4.9, reviews:1876,
    kpis:["sleep","stress","emotional"], dosha:["vata","pitta"],
    tags:["Evening practice","Restorative","Pranayama"],
    badge:"Top Rated", badgeColor:"#22c55e",
    includes:["28 evening yoga sessions (20 min each)","4-7-8 breathing masterclass","Yoga Nidra audio guides (5 tracks)","Bedtime routine Vihar guide","Nightly journal prompts"],
    desc:"An evening yoga program combining restorative asanas, Pranayama, and Yoga Nidra to systematically reduce cortisol, quiet the nervous system, and prepare the body for deep sleep.",
  },
  { id:"y3", type:"plan", category:"yoga",
    name:"Energy & Vitality Morning Flow",
    icon:"⚡", duration:"14 days", sessionsPerWeek:7,
    price:449, originalPrice:699, rating:4.7, reviews:987,
    kpis:["energy","activity","digestion"], dosha:["kapha","vata"],
    tags:["Morning routine","Energising","Surya Namaskar"],
    badge:null, badgeColor:null,
    includes:["14-day morning sequence (25 min each)","Surya Namaskar masterclass","Pranayama energising guide","Ayurvedic morning routine Dinacharya PDF","Integration with step challenge"],
    desc:"A powerful morning yoga flow that activates the lymphatic system, stimulates digestive fire, and builds sustained energy through Surya Namaskar, Kapalabhati, and dynamic asanas.",
  },
  { id:"y4", type:"plan", category:"yoga",
    name:"Corporate Stress Detox Program",
    icon:"🌿", duration:"30 days", sessionsPerWeek:5,
    price:699, originalPrice:1199, rating:4.8, reviews:1432,
    kpis:["stress","emotional","pain"], dosha:["pitta","all"],
    tags:["Mind-body","Breathwork","Full program"],
    badge:"Recommended by HR", badgeColor:"#4A90C4",
    includes:["30-day structured program","Morning Pranayama (10 min) + Evening Yoga (20 min)","Stress journaling framework","Mindfulness micro-practices for office","Live Q&A session with instructor"],
    desc:"The most comprehensive corporate stress management program on Ayufinity. Combines Yoga, Pranayama, Mindfulness, and Ayurvedic lifestyle routines into a structured 30-day transformation.",
  },

  // ── AUSHADH & AAHAR PRODUCTS ─────────────────────────────────────────────────
  { id:"p1", type:"product", category:"aushadh",
    name:"Ashwagandha KSM-66 Capsules",
    icon:"🌿", quantity:"60 caps · 300mg", brand:"Ayufinity Essentials",
    price:549, originalPrice:699, rating:4.8, reviews:3241,
    kpis:["stress","energy","sleep"], dosha:["vata","pitta"],
    tags:["Stress relief","Adaptogen","Clinically studied"],
    badge:"Best Seller", badgeColor:"#D4A843",
    desc:"Premium KSM-66 Ashwagandha extract — the most clinically studied Ashwagandha formulation. Reduces cortisol by up to 27.9% in 60 days. Improves sleep quality and sustained energy.",
    details:["KSM-66 root extract (5% withanolides)","Clinically studied for stress & anxiety","Vegan capsule shell","No fillers or flow agents","Free from GMO, gluten, dairy"],
  },
  { id:"p2", type:"product", category:"aushadh",
    name:"Brahmi + Shankhpushpi Mind Support",
    icon:"🧠", quantity:"60 caps · 500mg", brand:"Ayufinity Essentials",
    price:449, originalPrice:599, rating:4.7, reviews:1876,
    kpis:["stress","emotional","energy"], dosha:["pitta","vata"],
    tags:["Brain health","Focus","Anxiety"],
    badge:null, badgeColor:null,
    desc:"A classical Ayurvedic combination of Brahmi (Bacopa monnieri) and Shankhpushpi for cognitive clarity, reduced mental fatigue, and emotional resilience under work stress.",
    details:["Brahmi extract (20% Bacosides)","Shankhpushpi aerial parts","Supports memory & focus","Reduces mental fatigue","Safe for daily long-term use"],
  },
  { id:"p3", type:"product", category:"aushadh",
    name:"Triphala Gut Health Formula",
    icon:"🫁", quantity:"90 caps · 500mg", brand:"Ayufinity Essentials",
    price:349, originalPrice:449, rating:4.6, reviews:2104,
    kpis:["digestion","nutrition","energy"], dosha:["all"],
    tags:["Gut health","Detox","Daily use"],
    badge:"For All Doshas", badgeColor:"#6DB33F",
    desc:"Classical Triphala (Amalaki + Bibhitaki + Haritaki) for comprehensive digestive health. Regulates bowel movements, reduces bloating, and supports liver detoxification.",
    details:["Equal ratio of Amalaki, Bibhitaki, Haritaki","1500mg equivalent per serving","Gentle daily digestive support","Antioxidant-rich formula","No laxative dependency"],
  },
  { id:"p4", type:"product", category:"aahar",
    name:"Ayurvedic Adaptogen Latte Mix",
    icon:"☕", quantity:"200g · 30 servings", brand:"Ayufinity Blends",
    price:649, originalPrice:849, rating:4.8, reviews:987,
    kpis:["stress","energy","sleep"], dosha:["vata","pitta"],
    tags:["Morning ritual","Delicious","Functional drink"],
    badge:"New Launch", badgeColor:"#4A90C4",
    desc:"A delicious blend of Ashwagandha, Shatavari, Moringa, Turmeric, and raw cacao. Your daily morning ritual drink that replaces cortisol-spiking coffee with sustained adaptogenic energy.",
    details:["Ashwagandha · Shatavari · Moringa","Organic turmeric + black pepper","Raw cacao base","Stevia sweetened","Mix with warm milk or oat milk"],
  },
  { id:"p5", type:"product", category:"aahar",
    name:"Chyawanprash Classic — Immunity & Vitality",
    icon:"🍯", quantity:"500g jar", brand:"Ayufinity Essentials",
    price:499, originalPrice:649, rating:4.9, reviews:4231,
    kpis:["energy","nutrition","activity"], dosha:["all"],
    tags:["Immunity","Daily superfood","Winter wellness"],
    badge:"Most Trusted", badgeColor:"#D4A843",
    desc:"Traditional Chyawanprash formulation with 42 Ayurvedic herbs led by Amalaki (Indian Gooseberry). The most studied Ayurvedic rasayana for immunity, vitality, and respiratory health.",
    details:["42-herb classical formulation","1000mg Amla per serving","No artificial preservatives","Suitable for all ages 12+","1 tsp morning on empty stomach"],
  },
  { id:"p6", type:"product", category:"aushadh",
    name:"Mahanarayan Tail — Joint & Muscle Oil",
    icon:"💆", quantity:"100ml", brand:"Ayufinity Essentials",
    price:399, originalPrice:499, rating:4.7, reviews:1234,
    kpis:["pain","activity"], dosha:["vata"],
    tags:["Joint pain","Post-exercise","Deep tissue"],
    badge:null, badgeColor:null,
    desc:"Classical Mahanarayan Taila — a 50-herb Ayurvedic oil for deep muscle and joint relief. Used in Abhyanga (oil massage) for desk workers, athletes, and those with chronic back or neck pain.",
    details:["50-herb classical formula","Sesame oil base","Deep penetrating relief","Use warm for best results","Suitable for daily self-massage"],
  },
];

// Lookup helpers
const CATALOG_BY_ID = Object.fromEntries(AYUFINITY_CATALOG.map(i=>[i.id,i]));

// ─── COMPANY KPI SCHEDULE ─────────────────────────────────────────────────────
// Production: fetched from GET /api/company/kpi-schedule (PostgreSQL: company_kpi_schedule)
// Rule: a challenge is shown ONLY when today falls within [kpi_start_date … kpi_end_date]
//       for the employee's company. If the KPI window hasn't started yet → "upcoming".
//       If it has ended → "ended" (challenge hidden, streak preserved, history accessible).
const _today = new Date();
const _d = (y,m,day) => new Date(y,m-1,day);

// NOTE FOR DEMO: All windows set to cover 2026 so all 6 challenges are ACTIVE.
// In production these dates are entered by the HR admin per company.
const COMPANY_KPI_SCHEDULE = [
  { kpi:"hydration", start:_d(2026,1,1),  end:_d(2026,12,31), theme:"Corporate Vitality",   programLabel:"Jan – Dec 2026" },
  { kpi:"sleep",     start:_d(2026,1,1),  end:_d(2026,12,31), theme:"Stress & Recovery",    programLabel:"Jan – Dec 2026" },
  { kpi:"activity",  start:_d(2026,1,1),  end:_d(2026,12,31), theme:"Movement Drive 2026",  programLabel:"Jan – Dec 2026" },
  { kpi:"nutrition", start:_d(2026,1,1),  end:_d(2026,12,31), theme:"Metabolism Reset",     programLabel:"Jan – Dec 2026" },
  { kpi:"stress",    start:_d(2026,1,1),  end:_d(2026,12,31), theme:"Stress & Recovery",    programLabel:"Jan – Dec 2026" },
  { kpi:"emotional", start:_d(2026,1,1),  end:_d(2026,12,31), theme:"Mind & Mood",          programLabel:"Jan – Dec 2026" },
];

const _kpiStatus = e => _today < e.start ? "upcoming" : _today > e.end ? "ended" : "active";
const KPI_SCHEDULE_MAP = Object.fromEntries(
  COMPANY_KPI_SCHEDULE.map(e => [e.kpi, { ...e, status: _kpiStatus(e) }])
);
const isKpiActive = kpiId => KPI_SCHEDULE_MAP[kpiId]?.status === "active";
const _fmtDate = dt => formatDateIST(dt);

// ─── CHALLENGE DEFINITIONS ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// MY RESPONSES — Mock form data for employee
// Production: GET /api/responses (RLS: user_id = current_app_user_id())
// Tables: form_submissions, kpi_question_scores, kpi_submission_scores
// ═══════════════════════════════════════════════════════════════════════════════

// Full question bank — mirrors question_master table
const ALL_QUESTIONS = {
  SLEEP_KPI:[
    { key:"SLEEP_Q1", label:"How easily do you fall asleep at night?",              reverse:false },
    { key:"SLEEP_Q2", label:"How many hours of sleep do you get on average?",        reverse:false },
    { key:"SLEEP_Q3", label:"How often do you wake up feeling fully refreshed?",     reverse:false },
  ],
  STRESS_KPI:[
    { key:"STRESS_Q1", label:"How often do you feel overwhelmed at work?",           reverse:true  },
    { key:"STRESS_Q2", label:"How well do you manage work-related stress?",          reverse:false },
    { key:"STRESS_Q3", label:"Does work stress affect your personal life?",          reverse:true  },
  ],
  NUTRITION_KPI:[
    { key:"NUTRITION_Q1", label:"How often do you eat home-cooked meals?",           reverse:false },
    { key:"NUTRITION_Q2", label:"How many servings of vegetables do you eat daily?", reverse:false },
    { key:"NUTRITION_Q3", label:"How often do you avoid fried or processed foods?",  reverse:false },
  ],
  HYDRATION_KPI:[
    { key:"HYDRATION_Q1", label:"How many glasses of water do you drink daily?",     reverse:false },
    { key:"HYDRATION_Q2", label:"Do you feel adequately hydrated through the day?",  reverse:false },
  ],
  ACTIVITY_KPI:[
    { key:"ACTIVITY_Q1", label:"How often do you do structured exercise per week?",  reverse:false },
    { key:"ACTIVITY_Q2", label:"How active are you during your work day?",           reverse:false },
    { key:"ACTIVITY_Q3", label:"How many steps do you walk on an average day?",      reverse:false },
  ],
  STRESS_KPI_FOLLOWUP:[
    { key:"STRESS_FU_Q1", label:"Have you tried any stress-management techniques this week?", reverse:false },
    { key:"STRESS_FU_Q2", label:"Rate the effectiveness of your current coping strategies.", reverse:false },
  ],
  EMOTIONAL_KPI:[
    { key:"EMOTIONAL_Q1", label:"How emotionally balanced do you feel overall?",     reverse:false },
    { key:"EMOTIONAL_Q2", label:"How connected do you feel with your colleagues?",   reverse:false },
    { key:"EMOTIONAL_Q3", label:"How well do you manage negative emotions at work?", reverse:false },
  ],
  DIGESTION_KPI:[
    { key:"DIGESTION_Q1", label:"How regular are your bowel movements?",             reverse:false },
    { key:"DIGESTION_Q2", label:"How often do you experience bloating or acidity?",  reverse:true  },
    { key:"DIGESTION_Q3", label:"How well do you digest your meals?",                reverse:false },
  ],
};

// Helper: raw score → final score (applies reverse scoring)
const finalScore = (raw, reverse) => reverse ? 6 - raw : raw;
// Helper: normalize 1–5 to 0–100 percentage display
const scoreToPercent = s => Math.round(((s-1)/4)*100);
// Helper: compute KPI average from question scores
const kpiAvg = (qs) => +(qs.reduce((a,q)=>a+q.final,0)/qs.length).toFixed(2);
// Helper: KPI risk label
const riskLabel = avg => avg>=4.0?"good":avg>=3.0?"moderate":"risk";
const riskCol   = avg => avg>=4.0?C.g3:avg>=3.0?C.gold:C.red;

// Wellness Index formula (normalized): Σ[(score-1)/4 × weight] × 100
const computeWI = (kpiScores) => {
  const KPI_WEIGHTS = {SLEEP_KPI:0.20,STRESS_KPI:0.15,NUTRITION_KPI:0.15,HYDRATION_KPI:0.10,
    ACTIVITY_KPI:0.10,DIGESTION_KPI:0.10,PAIN_KPI:0.10,ENERGY_KPI:0.10};
  let sum=0;
  Object.entries(kpiScores).forEach(([k,v])=>{ if(KPI_WEIGHTS[k]) sum+=((v-1)/4)*KPI_WEIGHTS[k]; });
  return +(sum*100).toFixed(1);
};

// Mock submitted forms — mirrors form_submissions + kpi_submission_scores
const MOCK_SUBMITTED_FORMS = [
  {
    id:"fs1",
    theme:"Stress & Recovery",
    themeKey:"STRESS_RECOVERY",
    submittedAt:"15 Mar 2026",
    weekLabel:"Week 10",
    status:"completed",
    kpis:[
      { key:"SLEEP_KPI",     label:"Sleep",     icon:"🌙", color:"#7c6af7",
        avgScore:3.53, questions:[
          { key:"SLEEP_Q1",  label:"How easily do you fall asleep?",            raw:4, final:4, reverse:false },
          { key:"SLEEP_Q2",  label:"How many hours of sleep do you get?",        raw:3, final:3, reverse:false },
          { key:"SLEEP_Q3",  label:"How often do you wake refreshed?",           raw:4, final:4, reverse:false },
        ]},
      { key:"STRESS_KPI",   label:"Stress",    icon:"🧘", color:"#f97316",
        avgScore:2.67, questions:[
          { key:"STRESS_Q1", label:"How often do you feel overwhelmed?",         raw:2, final:4, reverse:true  },
          { key:"STRESS_Q2", label:"How well do you manage stress?",             raw:3, final:3, reverse:false },
          { key:"STRESS_Q3", label:"Does stress affect your personal life?",     raw:1, final:5, reverse:true  },
        ]},
      { key:"NUTRITION_KPI",label:"Nutrition",  icon:"🥗", color:"#22c55e",
        avgScore:3.33, questions:[
          { key:"NUTRITION_Q1", label:"How often do you eat home-cooked meals?", raw:3, final:3, reverse:false },
          { key:"NUTRITION_Q2", label:"Servings of vegetables daily?",           raw:4, final:4, reverse:false },
          { key:"NUTRITION_Q3", label:"How often do you avoid fried foods?",     raw:3, final:3, reverse:false },
        ]},
      { key:"HYDRATION_KPI",label:"Hydration",  icon:"💧", color:"#38bdf8",
        avgScore:2.50, questions:[
          { key:"HYDRATION_Q1", label:"Glasses of water daily?",                 raw:2, final:2, reverse:false },
          { key:"HYDRATION_Q2", label:"Do you feel adequately hydrated?",        raw:3, final:3, reverse:false },
        ]},
      { key:"ACTIVITY_KPI", label:"Activity",   icon:"🏃", color:"#fb923c",
        avgScore:3.00, questions:[
          { key:"ACTIVITY_Q1",  label:"Structured exercise per week?",           raw:3, final:3, reverse:false },
          { key:"ACTIVITY_Q2",  label:"How active during work day?",             raw:3, final:3, reverse:false },
          { key:"ACTIVITY_Q3",  label:"Average daily steps?",                    raw:3, final:3, reverse:false },
        ]},
    ],
  },
  {
    id:"fs2",
    theme:"Stress & Recovery",
    themeKey:"STRESS_RECOVERY",
    submittedAt:"1 Mar 2026",
    weekLabel:"Week 8",
    status:"completed",
    kpis:[
      { key:"SLEEP_KPI",    label:"Sleep",    icon:"🌙", color:"#7c6af7",
        avgScore:3.00, questions:[
          { key:"SLEEP_Q1", label:"How easily do you fall asleep?",    raw:3, final:3, reverse:false },
          { key:"SLEEP_Q2", label:"How many hours of sleep?",          raw:3, final:3, reverse:false },
          { key:"SLEEP_Q3", label:"How often do you wake refreshed?",  raw:3, final:3, reverse:false },
        ]},
      { key:"STRESS_KPI",  label:"Stress",   icon:"🧘", color:"#f97316",
        avgScore:2.33, questions:[
          { key:"STRESS_Q1", label:"How often do you feel overwhelmed?",  raw:1, final:5, reverse:true  },
          { key:"STRESS_Q2", label:"How well do you manage stress?",      raw:2, final:2, reverse:false },
          { key:"STRESS_Q3", label:"Does stress affect your personal life?", raw:2, final:4, reverse:true },
        ]},
      { key:"HYDRATION_KPI",label:"Hydration", icon:"💧", color:"#38bdf8",
        avgScore:2.00, questions:[
          { key:"HYDRATION_Q1", label:"Glasses of water daily?",          raw:2, final:2, reverse:false },
          { key:"HYDRATION_Q2", label:"Feel adequately hydrated?",        raw:2, final:2, reverse:false },
        ]},
    ],
  },
];

// Pending forms — not yet submitted by this employee
// These are forms the HR admin has published that the employee must fill
const MOCK_PENDING_FORMS = [
  {
    id:"pf1",
    theme:"Stress & Recovery",
    themeKey:"STRESS_RECOVERY",
    dueDate:"30 Mar 2026",
    weekLabel:"Week 12",
    isOverdue:false,
    description:"Monthly wellness check-in covering Sleep, Stress, Nutrition, Hydration and Activity. Takes about 5 minutes to complete.",
    kpisToFill:[
      { key:"SLEEP_KPI",     label:"Sleep Quality",   icon:"🌙", color:"#7c6af7",
        questions: ALL_QUESTIONS.SLEEP_KPI },
      { key:"STRESS_KPI",    label:"Stress Level",    icon:"🧘", color:"#f97316",
        questions: ALL_QUESTIONS.STRESS_KPI },
      { key:"NUTRITION_KPI", label:"Nutrition",       icon:"🥗", color:"#22c55e",
        questions: ALL_QUESTIONS.NUTRITION_KPI },
      { key:"HYDRATION_KPI", label:"Hydration",       icon:"💧", color:"#38bdf8",
        questions: ALL_QUESTIONS.HYDRATION_KPI },
      { key:"ACTIVITY_KPI",  label:"Physical Activity",icon:"🏃", color:"#fb923c",
        questions: ALL_QUESTIONS.ACTIVITY_KPI },
    ],
  },
  {
    id:"pf2",
    theme:"Mind & Mood",
    themeKey:"MIND_MOOD",
    dueDate:"15 Mar 2026",
    weekLabel:"Week 10 Supplemental",
    isOverdue:true,
    description:"Emotional wellbeing and digestive health supplemental check-in. Covers Emotional and Digestion KPIs.",
    kpisToFill:[
      { key:"EMOTIONAL_KPI", label:"Emotional Wellbeing", icon:"💚", color:"#34d399",
        questions: ALL_QUESTIONS.EMOTIONAL_KPI },
      { key:"DIGESTION_KPI", label:"Digestion Health",   icon:"🫁", color:"#a3e635",
        questions: ALL_QUESTIONS.DIGESTION_KPI },
    ],
  },
];

// ─── CHALLENGE DEFINITIONS — all 6 types fully wired ────────────────────────
// Each type has all required fields for the challenge renderer.
// These are the DEMO challenges — in production each has is_active=TRUE
// and is mapped to a KPI in company_kpi_schedule (so only active ones render).
const CHALLENGE_DEFS=[
  // TYPE 1 — COUNTER: tap button repeatedly to increment to target
  { id:"water",    icon:"💧", label:"Hydration Mission",   kpi:"hydration", color:"#38bdf8", xp:20,
    type:"counter", target:8, unit:"glasses",
    desc:"Drink 8 glasses of water today. Tap +1 Glass each time you drink.",
    testNote:"Tap '+1 Glass' up to 8 times. Progress bar fills. Minus button undoes last tap." },

  // TYPE 2 — TOGGLE: single on/off commitment button
  { id:"sleep",    icon:"🌙", label:"Sleep Before 10PM",   kpi:"sleep",     color:"#7c6af7", xp:25,
    type:"toggle",  options:["Committed to sleep by 10PM ✓"],
    desc:"One tap to commit to sleeping by 10PM tonight. No screens after 9PM.",
    testNote:"Tap the button to toggle commitment ON/OFF. Done state shows ✓ with XP badge." },

  // TYPE 3 — CHOICE: pick exactly one option from a list
  { id:"activity", icon:"🏃", label:"Move Your Body",       kpi:"activity",  color:"#fb923c", xp:30,
    type:"choice",  options:["🚶 Walk 15min","🧘 Yoga 20min","🏋️ Gym Session","🚴 Cycling","🏊 Swimming"],
    desc:"Pick one movement you did today. Any counts — stairs, walk, gym, anything.",
    testNote:"Select any one option. Tap again to deselect. Only one can be selected at a time." },

  // TYPE 4 — MULTI: select multiple options (any combination)
  { id:"nutrition", icon:"🥗", label:"Eat Well Today",      kpi:"nutrition", color:"#22c55e", xp:25,
    type:"multi",   options:["🍎 Ate Fruits/Veggies","🍳 Home Cooked Meal","🥛 Drank warm water","🚫 Avoided fried food"],
    desc:"Tap all healthy choices you made today. Each earns partial XP.",
    testNote:"Multi-select — tap any combination. XP is proportional (25% per option). All 4 = full 25 XP." },

  // TYPE 5 — TIMER: countdown with audio-guided breathing phases
  { id:"breathing", icon:"🧘", label:"4-7-8 Breathing",    kpi:"stress",    color:"#f97316", xp:20,
    type:"timer",   duration:120,
    desc:"Guided breathing: Inhale 4s → Hold 7s → Exhale 8s. Audio tones guide each phase.",
    testNote:"Tap 'Start Breathing Session'. Timer counts down 2 mins with INHALE/HOLD/EXHALE commands. Rising/steady/falling tones play. Pause button stops timer." },

  // TYPE 6 — RATING: select from emoji scale
  { id:"mood",      icon:"💚", label:"Daily Mood Check",    kpi:"emotional", color:"#34d399", xp:10,
    type:"rating",  options:["😞","😕","😐","🙂","😄"],
    desc:"How are you feeling right now? One tap on your current mood.",
    testNote:"Tap any emoji — it highlights with a coloured ring. Single select, tappable again to change." },
];

const BADGES=[
  {id:"h1",label:"Hydration Hero", icon:"💧",earned:true, level:"Gold",  color:"#38bdf8"},
  {id:"s1",label:"Sleep Master",   icon:"🌙",earned:true, level:"Silver",color:"#7c6af7"},
  {id:"st",label:"Stress Buster",  icon:"🧘",earned:false,level:"Bronze",color:"#f97316"},
  {id:"g1",label:"Green Eater",    icon:"🥗",earned:true, level:"Bronze",color:"#22c55e"},
  {id:"a1",label:"Active Star",    icon:"🏃",earned:false,level:"Silver",color:"#fb923c"},
  {id:"b1",label:"Banyan Legend",  icon:"🌳",earned:false,level:"Legend",color:"#d4a843"},
];

// ─── SVG CHARTS ───────────────────────────────────────────────────────────────
// ─── PWA: INSTALL BANNER ──────────────────────────────────────────────────────
// Shows when the app is NOT installed (not in standalone mode).
// Android: captures beforeinstallprompt and shows custom Ayumonk banner.
// iOS:     shows manual Add-to-Home-Screen guide sheet.
function PWAInstallBanner({ onDismiss }) {
  const [ios]      = useState(isIOS());
  const [step, setStep] = useState(1); // ios guide: step 1/2/3
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(()=>{
    const handler = e => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", ()=>setInstalled(true));
    return ()=>{ window.removeEventListener("beforeinstallprompt", handler); };
  },[]);

  const handleAndroidInstall = async () => {
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if(outcome === "accepted") setInstalled(true);
    onDismiss();
  };

  if(installed) return (
    <div style={{background:"rgba(107,179,63,0.15)",border:"1px solid rgba(107,179,63,0.4)",borderRadius:12,padding:"12px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:20}}>✅</span>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:C.g3}}>AyuMonk installed!</div>
        <div style={{fontSize:9,color:C.muted}}>Open from your home screen for the best experience and notifications.</div>
      </div>
    </div>
  );

  if(ios) return (
    <div style={{background:"rgba(74,140,42,0.08)",border:"1px solid rgba(107,179,63,0.3)",borderRadius:12,padding:"14px 18px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>📲</span>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.g3}}>Install AyuMonk on your iPhone</div>
            <div style={{fontSize:9,color:C.muted}}>3 steps · Takes 15 seconds · Enables push notifications</div>
          </div>
        </div>
        <button onClick={onDismiss} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:"0 4px"}}>✕</button>
      </div>
      <div style={{display:"flex",gap:8}}>
        {[
          ["1","Tap the Share button","□↑","rgba(74,144,196,0.15)","#4A90C4"],
          ["2","Scroll and tap 'Add to Home Screen'","⊞+","rgba(107,179,63,0.15)",C.g3],
          ["3","Tap 'Add' in the top right","✓","rgba(212,168,67,0.15)",C.gold],
        ].map(([n,label,ico,bg,col])=>(
          <div key={n} style={{flex:1,background:bg,border:`1px solid ${col}44`,borderRadius:10,padding:"8px 10px",textAlign:"center",
            opacity:step>=parseInt(n)?1:0.45,cursor:"pointer",transition:"opacity 0.2s"}}
            onClick={()=>setStep(Math.max(step,parseInt(n)+1))}>
            <div style={{fontSize:20,marginBottom:4}}>{ico}</div>
            <div style={{fontSize:8,fontWeight:700,color:col,marginBottom:3}}>Step {n}</div>
            <div style={{fontSize:7.5,color:"rgba(255,255,255,0.5)",lineHeight:1.4}}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // Android / Desktop — show custom install button
  return (
    <div style={{background:"rgba(74,140,42,0.08)",border:"1px solid rgba(107,179,63,0.3)",borderRadius:12,padding:"12px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:14}}>
      <span style={{fontSize:28,flexShrink:0}}>📲</span>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:700,color:C.g3,marginBottom:2}}>Install AyuMonk on your device</div>
        <div style={{fontSize:9,color:C.muted}}>Add to home screen for daily reminders, offline access, and an app-like experience. No App Store required.</div>
      </div>
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        <button onClick={handleAndroidInstall}
          style={{padding:"7px 18px",borderRadius:9,background:`linear-gradient(135deg,${C.g1},${C.g2})`,border:"none",color:"#fff",fontWeight:700,fontSize:10,cursor:"pointer"}}>
          Install Now
        </button>
        <button onClick={onDismiss}
          style={{padding:"7px 10px",borderRadius:9,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:C.muted,fontSize:10,cursor:"pointer"}}>
          Later
        </button>
      </div>
    </div>
  );
}

// ─── PWA: OFFLINE BADGE ────────────────────────────────────────────────────────
// Persistent status bar shown when device is offline.
// Queued completions display in a mini list so employee knows they'll sync.
function PWAOfflineBadge({ queueCount=0 }) {
  return (
    <div style={{
      background:"rgba(232,160,32,0.12)",border:"1px solid rgba(232,160,32,0.35)",
      borderRadius:9,padding:"6px 14px",marginBottom:12,
      display:"flex",alignItems:"center",gap:10
    }}>
      <span style={{fontSize:14}}>📡</span>
      <div style={{flex:1}}>
        <span style={{fontSize:10,fontWeight:700,color:C.gold}}>You're offline</span>
        <span style={{fontSize:9,color:C.muted,marginLeft:8}}>
          {queueCount>0
            ? `${queueCount} challenge completion${queueCount>1?"s":""} queued — will sync when you reconnect`
            : "Showing cached data · Changes will sync when reconnected"}
        </span>
      </div>
      <span style={{fontSize:9,color:"rgba(232,160,32,0.6)",fontWeight:600}}>OFFLINE</span>
    </div>
  );
}

// ─── PWA: PUSH PERMISSION PROMPT ───────────────────────────────────────────────
// Shows after install when notification permission is "default" (not yet asked).
function PWAPushPrompt({ onAllow, onSkip }) {
  const [loading, setLoading] = useState(false);
  const handleAllow = async () => {
    setLoading(true);
    try {
      // Production: Notification.requestPermission() + serviceWorker.pushManager.subscribe()
      await new Promise(r=>setTimeout(r,1200));
      onAllow();
    } catch(e) { onSkip(); }
    setLoading(false);
  };
  return (
    <div style={{
      position:"fixed",bottom:0,left:0,right:0,zIndex:1000,
      background:C.card,borderTop:`2px solid ${C.g2}`,
      padding:"18px 22px",display:"flex",alignItems:"center",gap:16,
      boxShadow:"0 -4px 24px rgba(0,0,0,0.5)"
    }}>
      <span style={{fontSize:32,flexShrink:0}}>🔔</span>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>Enable wellness reminders?</div>
        <div style={{fontSize:9.5,color:C.muted,lineHeight:1.5}}>
          Get notified about daily challenges, streaks at risk, and badge milestones — straight to your notification shade.
          <br/>
          <span style={{color:C.g3}}>These appear in your phone shutter even when the app is closed.</span>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
        <button onClick={handleAllow} disabled={loading}
          style={{padding:"9px 22px",borderRadius:10,background:`linear-gradient(135deg,${C.g1},${C.g2})`,border:"none",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",opacity:loading?0.7:1}}>
          {loading?"Enabling…":"Enable Reminders"}
        </button>
        <button onClick={onSkip}
          style={{padding:"7px 22px",borderRadius:10,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:C.muted,fontSize:10,cursor:"pointer"}}>
          Not Now
        </button>
      </div>
    </div>
  );
}

// ─── SVG CHARTS ───────────────────────────────────────────────────────────────
function DonutChart({slices,size=130,cVal,cSub}){
  const cx=size/2,cy=size/2,r=size/2-10,ir=size/2-30;
  const total=slices.reduce((a,s)=>a+s.v,0);
  let angle=-Math.PI/2;
  return(
    <svg width={size} height={size}>
      {slices.map((s,i)=>{
        const sw=(s.v/total)*2*Math.PI;
        const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
        angle+=sw;
        const x2=cx+r*Math.cos(angle),y2=cy+r*Math.sin(angle);
        const ix1=cx+ir*Math.cos(angle-sw),iy1=cy+ir*Math.sin(angle-sw);
        const ix2=cx+ir*Math.cos(angle),iy2=cy+ir*Math.sin(angle);
        const lg=sw>Math.PI?1:0;
        return <path key={i} d={`M${ix1},${iy1}L${x1},${y1}A${r},${r} 0 ${lg},1 ${x2},${y2}L${ix2},${iy2}A${ir},${ir} 0 ${lg},0 ${ix1},${iy1}Z`} fill={s.c} stroke={C.bg} strokeWidth="2"/>;
      })}
      {cVal&&<><text x={cx} y={cy-4} textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">{cVal}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fontSize="9" fill={C.muted}>{cSub}</text></>}
    </svg>
  );
}

function Sparkline({values,color,w=110,h=28}){
  if(!values||values.length<2)return null;
  const mn=Math.min(...values)-0.2,mx=Math.max(...values)+0.2;
  const pts=values.map((v,i)=>[(i/(values.length-1))*w,h-((v-mn)/(mx-mn))*h]);
  const line=pts.map(([x,y])=>`${x},${y}`).join(" ");
  const area=`${pts[0][0]},${h} `+line+` ${pts[pts.length-1][0]},${h}`;
  return(
    <svg width={w} height={h} style={{overflow:"visible"}}>
      <polygon points={area} fill={color} opacity="0.1"/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color}/>
    </svg>
  );
}

function MultiLine({series,labels,h=90,highlighted=[]}){
  if(!series||!series.length)return null;
  const all=series.flatMap(s=>s.vals);
  const mn=Math.min(...all)-0.3,mx=Math.max(...all)+0.3;
  const W=460,H=h;
  const px=i=>16+(i/(series[0].vals.length-1))*(W-24);
  const py=v=>6+((mx-v)/(mx-mn))*(H-14);
  return(
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{overflow:"visible"}}>
      {series.map((s,si)=>{
        const pts=s.vals.map((v,i)=>[px(i),py(v)]);
        const line=pts.map(([x,y])=>`${x},${y}`).join(" ");
        const area=`${pts[0][0]},${H} `+line+` ${pts[pts.length-1][0]},${H}`;
        const hi=highlighted.includes(s.id);
        return <g key={si}>
          {hi&&<polygon points={area} fill={s.c} opacity="0.06"/>}
          <polyline points={line} fill="none" stroke={s.c} strokeWidth={hi?2.5:1} strokeLinecap="round" strokeLinejoin="round" opacity={hi?1:0.28}/>
          <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={hi?4:2.5} fill={s.c} opacity={hi?1:0.4}/>
        </g>;
      })}
      {labels&&labels.filter((_,i)=>i%Math.ceil(labels.length/7)===0).map((l,i)=>{
        const idx=labels.indexOf(l);
        return <text key={i} x={px(idx)} y={H+2} fontSize="7" fill="rgba(255,255,255,0.2)" textAnchor="middle">{l}</text>;
      })}
    </svg>
  );
}

function BarChart({data,color="#6db33f",h=80}){
  const max=Math.max(...data.map(d=>d.v),1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:h}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <span style={{fontSize:8,color,fontWeight:700}}>{d.v}</span>
          <div style={{width:"100%",borderRadius:"3px 3px 0 0",background:color,opacity:0.75,height:`${Math.max(4,(d.v/max)*62)}px`,transition:"height 0.5s"}}/>
          <span style={{fontSize:7,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>{d.l.slice(0,5)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const Card=({children,style={},color,onClick})=>(
  <div onClick={onClick} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${color||"rgba(255,255,255,0.07)"}`,
    borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden",
    cursor:onClick?"pointer":"default",transition:"all 0.2s",...style}}
    onMouseEnter={onClick?e=>{e.currentTarget.style.borderColor=(color||"#6db33f")+"88";e.currentTarget.style.transform="translateY(-1px)";}:undefined}
    onMouseLeave={onClick?e=>{e.currentTarget.style.borderColor=color||"rgba(255,255,255,0.07)";e.currentTarget.style.transform="";}:undefined}
  >{children}</div>
);

const Btn=({children,active,color="#6db33f",onClick,disabled,style={}})=>(
  <button disabled={disabled} onClick={onClick} style={{
    background:active?color:"transparent",color:active?"#fff":color,
    border:`1.5px solid ${color}`,borderRadius:9,padding:"7px 14px",
    fontSize:11,fontWeight:600,cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?0.45:1,transition:"all 0.2s",...style
  }}>{children}</button>
);

// ─── WELLNESS DASHBOARD ───────────────────────────────────────────────────────
function WellnessDashboard({viewData,labels,timeView,setTimeView}){
  const [selectedKPI,setSelectedKPI]=useState(null);
  const [mood,setMood]=useState(null);
  const VIEWS=["Daily","Weekly","Monthly"];

  const scores={},first={};
  PARAMS.forEach(p=>{scores[p.id]=viewData[p.id][viewData[p.id].length-1];first[p.id]=viewData[p.id][0];});
  const currIdx=computeIndex(scores);
  const baseIdx=computeIndex(first);
  const idxDelta=((currIdx-baseIdx)/baseIdx*100).toFixed(0);

  const improvements=PARAMS.map(p=>{
    const curr=viewData[p.id][viewData[p.id].length-1];
    const prev=viewData[p.id][Math.max(0,viewData[p.id].length-4)];
    const pct=p.inverse?-(curr-prev)/prev*100:(curr-prev)/prev*100;
    return{...p,pct};
  }).sort((a,b)=>b.pct-a.pct);
  const topTwo=improvements.slice(0,2);
  const weakParams=improvements.slice(-3);

  const pieSlices=PARAMS.filter(p=>p.weight>0).map(p=>({l:p.label,v:scores[p.id]*p.weight*20,c:p.color}));
  const sp=selectedKPI?PARAMS.find(p=>p.id===selectedKPI):null;

  return(
    <div>
      {/* KPI STRIP */}
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:18,scrollbarWidth:"none"}}>
        {PARAMS.map(p=>{
          const curr=viewData[p.id][viewData[p.id].length-1];
          const pct=p.inverse?-(curr-p.baseline)/p.baseline*100:(curr-p.baseline)/p.baseline*100;
          const sel=selectedKPI===p.id;
          return(
            <div key={p.id} onClick={()=>setSelectedKPI(sel?null:p.id)} style={{
              minWidth:88,background:sel?p.color+"22":"rgba(255,255,255,0.03)",
              border:`1px solid ${sel?p.color:p.color+"33"}`,borderRadius:12,padding:"10px 8px",
              cursor:"pointer",transition:"all 0.2s",flexShrink:0,textAlign:"center"
            }}>
              <div style={{fontSize:18,marginBottom:3}}>{p.icon}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:3}}>{p.label}</div>
              <div style={{fontSize:16,fontWeight:800,color:p.color,lineHeight:1}}>{curr.toFixed(1)}</div>
              <div style={{fontSize:10,fontWeight:700,marginTop:3,color:pct>=0?"#4ade80":"#f87171"}}>{pct>=0?"▲":"▼"}{Math.abs(pct).toFixed(0)}%</div>
              <div style={{marginTop:4}}><Sparkline values={viewData[p.id].slice(-7)} color={p.color} w={74} h={16}/></div>
            </div>
          );
        })}
      </div>

      {/* MAIN 3-COL GRID */}
      <div style={{display:"grid",gridTemplateColumns:"190px 1fr 210px",gap:14,marginBottom:16}}>

        {/* WELLNESS INDEX — with normalized breakdown */}
        <Card>
          <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8,textAlign:"center"}}>
            Wellness Index
            <span style={{fontSize:7,color:C.muted,fontWeight:400,marginLeft:6}}>WHO SF-12 Aligned · Normalized 0–100</span>
          </div>
          <div style={{display:"flex",justifyContent:"center"}}>
            <DonutChart slices={pieSlices} size={130} cVal={currIdx} cSub="/ 100"/>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3,justifyContent:"center",marginTop:8}}>
            {pieSlices.map(s=>(
              <div key={s.l} style={{display:"flex",alignItems:"center",gap:2,fontSize:8,color:"rgba(255,255,255,0.38)"}}>
                <span style={{width:5,height:5,borderRadius:1,background:s.c,display:"inline-block"}}/>
                {s.l}
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:8}}>
            <span style={{background:"#16a34a22",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:"#4ade80"}}>▲ {idxDelta}% from baseline</span>
          </div>
        </Card>

        {/* TREND LINES */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div>
              <div style={{fontSize:12,fontWeight:700}}>Wellness Trends</div>
              <div style={{fontSize:9,color:C.muted}}>Bold lines = most improved recently</div>
            </div>
            <div style={{display:"flex",gap:3,background:"rgba(0,0,0,0.3)",borderRadius:8,padding:3}}>
              {VIEWS.map((v,i)=>(
                <button key={v} onClick={()=>setTimeView(i)} style={{
                  padding:"4px 10px",borderRadius:6,border:"none",fontSize:9,fontWeight:600,cursor:"pointer",
                  background:timeView===i?C.g3:"transparent",color:timeView===i?"#fff":"rgba(255,255,255,0.4)"
                }}>{v}</button>
              ))}
            </div>
          </div>
          <MultiLine h={96} labels={labels}
            series={PARAMS.map(p=>({id:p.id,c:p.color,vals:viewData[p.id]}))}
            highlighted={topTwo.map(t=>t.id)}
          />
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
            {topTwo.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,background:p.color+"22",borderRadius:8,padding:"3px 9px"}}>
                <span style={{fontSize:10}}>{p.icon}</span>
                <span style={{fontSize:9,color:p.color,fontWeight:700}}>{p.label} ▲{p.pct.toFixed(0)}%</span>
              </div>
            ))}
            <span style={{fontSize:9,color:"rgba(255,255,255,0.25)",padding:"3px 0"}}>← tap any KPI tile to see full detail</span>
          </div>
        </Card>

        {/* DOSHA + MOOD */}
        <Card>
          <div style={{fontSize:11,fontWeight:700,marginBottom:6}}>Dosha Profile</div>
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
            <DonutChart slices={[{l:"Vata",v:30,c:"#38bdf8"},{l:"Pitta",v:34,c:"#f97316"},{l:"Kapha",v:36,c:"#22c55e"}]} size={108}/>
          </div>
          {[["Vata","#38bdf8",30],["Pitta","#f97316",34],["Kapha","#22c55e",36]].map(([l,c,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:7,height:7,borderRadius:2,background:c,display:"inline-block"}}/>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.55)"}}>{l}</span>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:c}}>{v}%</span>
            </div>
          ))}
          <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontSize:9,color:C.muted,marginBottom:6}}>Today's Mood Check</div>
            <div style={{display:"flex",gap:4,justifyContent:"center"}}>
              {["😞","😕","😐","🙂","😄"].map((em,i)=>(
                <button key={i} onClick={()=>setMood(i)} style={{
                  fontSize:20,border:"none",background:mood===i?"rgba(107,179,63,0.3)":"transparent",
                  cursor:"pointer",borderRadius:6,padding:"2px 4px",
                  outline:mood===i?"2px solid "+C.g3:"none",transition:"all 0.15s"
                }}>{em}</button>
              ))}
            </div>
            {mood!==null&&<div style={{fontSize:9,color:C.g3,textAlign:"center",marginTop:4}}>✓ Mood logged!</div>}
          </div>
        </Card>
      </div>

      {/* KPI DRILL-DOWN — TWO-TIER SUGGESTION ENGINE */}
      {sp&&(()=>{
        // ── Score helpers ─────────────────────────────────────────────────────
        const kpiAvg = scores[sp.id];
        const riskBand = kpiAvg >= 4.0 ? "good" : kpiAvg >= 3.0 ? "moderate" : "risk";

        // Question-level triggers: check each question score against its threshold
        const questionTriggers = (sp.questions||[]).filter(q => {
          if(q.thresholdBelow != null && q.score < q.thresholdBelow) return true;
          if(q.thresholdAbove != null && q.score > q.thresholdAbove) return true;
          return false;
        });

        // Precision suggestions from triggered questions
        const questionSuggestions = (sp.suggestions?.questionLevel||[]).filter(s =>
          questionTriggers.find(q => q.key === s.key)
        );

        const showKpiSugg = riskBand !== "good";
        const riskCol = riskBand === "risk" ? "#f87171" : riskBand === "moderate" ? C.gold : C.g3;

        return(
          <Card style={{marginBottom:16,borderColor:sp.color+"44",background:sp.color+"07"}}>
            {/* HEADER ROW */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:800}}>{sp.icon} {sp.label} — {VIEWS[timeView]} Detail</div>
                <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:9,background:riskCol+"22",color:riskCol,borderRadius:5,padding:"1px 8px",fontWeight:700,textTransform:"uppercase"}}>
                    KPI {riskBand} · avg {kpiAvg.toFixed(2)}
                  </span>
                  {questionTriggers.length>0&&(
                    <span style={{fontSize:9,background:"rgba(251,191,36,0.18)",color:C.gold,borderRadius:5,padding:"1px 8px",fontWeight:700}}>
                      ⚡ {questionTriggers.length} question{questionTriggers.length>1?"s":""} flagged
                    </span>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:20,alignItems:"center"}}>
                {[["Baseline",sp.baseline.toFixed(1)],["Current",kpiAvg.toFixed(1)],["Best",Math.max(...viewData[sp.id]).toFixed(1)],["Lowest",Math.min(...viewData[sp.id]).toFixed(1)]].map(([l,v])=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <div style={{fontSize:9,color:C.muted,textTransform:"uppercase"}}>{l}</div>
                    <div style={{fontSize:19,fontWeight:800,color:sp.color}}>{v}</div>
                  </div>
                ))}
                <button onClick={()=>setSelectedKPI(null)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:18,paddingLeft:8}}>✕</button>
              </div>
            </div>

            <MultiLine h={65} labels={labels} series={[{id:sp.id,vals:viewData[sp.id],c:sp.color}]} highlighted={[sp.id]}/>

            {/* QUESTION SCORES TABLE */}
            {(sp.questions||[]).length>0&&(
              <div style={{marginTop:14,marginBottom:2}}>
                <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>
                  Individual Question Scores
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {(sp.questions||[]).map(q=>{
                    const triggered = (q.thresholdBelow!=null&&q.score<q.thresholdBelow)||(q.thresholdAbove!=null&&q.score>q.thresholdAbove);
                    const pct = ((q.score-1)/4)*100;
                    return(
                      <div key={q.key} style={{display:"grid",gridTemplateColumns:"24px 1fr 90px 60px",alignItems:"center",gap:8,padding:"4px 0"}}>
                        <span style={{fontSize:12,textAlign:"center"}}>{triggered?"⚡":"✓"}</span>
                        <div>
                          <div style={{fontSize:9.5,color:triggered?"rgba(251,191,36,0.9)":"rgba(255,255,255,0.55)"}}>{q.label}</div>
                          <div style={{height:3,borderRadius:3,background:"rgba(255,255,255,0.06)",marginTop:3}}>
                            <div style={{height:"100%",borderRadius:3,width:`${pct}%`,
                              background:triggered?`linear-gradient(90deg,#f87171,${C.gold})`:`linear-gradient(90deg,${sp.color}88,${sp.color})`,
                              transition:"width 0.4s"}}/>
                          </div>
                        </div>
                        <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>
                          {q.thresholdBelow!=null?`threshold < ${q.thresholdBelow}`:`threshold > ${q.thresholdAbove}`}
                        </div>
                        <div style={{textAlign:"right"}}>
                          <span style={{fontSize:13,fontWeight:800,color:triggered?"#f87171":sp.color}}>{q.score.toFixed(1)}</span>
                          {triggered&&<span style={{fontSize:8,color:C.gold,marginLeft:4,fontWeight:700}}>flagged</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TIER 1 — KPI-LEVEL SUGGESTIONS */}
            {showKpiSugg&&sp.suggestions?.kpiLevel&&(
              <div style={{marginTop:14}}>
                <div style={{fontSize:9,fontWeight:700,color:riskCol,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{background:riskCol+"22",borderRadius:5,padding:"1px 8px"}}>Tier 1 — KPI-Level Suggestions</span>
                  <span style={{fontWeight:400,color:C.muted,textTransform:"none"}}>triggered because KPI average is {riskBand}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[["🥗 Aahar",sp.suggestions.kpiLevel.aahar,C.g3],
                    ["🏃 Vihar",sp.suggestions.kpiLevel.vihar,C.blue],
                    ["🌿 Aushadh",sp.suggestions.kpiLevel.aushadh,C.gold]].map(([lbl,val,col])=>(
                    <div key={lbl} style={{background:col+"0f",borderRadius:10,padding:"8px 12px",border:`1px solid ${col}30`}}>
                      <div style={{fontSize:10,fontWeight:700,color:col,marginBottom:4}}>{lbl}</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",lineHeight:1.5}}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TIER 2 — QUESTION-LEVEL PRECISION SUGGESTIONS */}
            {questionSuggestions.length>0&&(
              <div style={{marginTop:12}}>
                <div style={{fontSize:9,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{background:"rgba(212,168,67,0.15)",borderRadius:5,padding:"1px 8px"}}>Tier 2 — Precision Suggestions</span>
                  <span style={{fontWeight:400,color:C.muted,textTransform:"none"}}>triggered by specific question scores below threshold</span>
                </div>
                {questionSuggestions.map(qs=>{
                  const q = (sp.questions||[]).find(q=>q.key===qs.key);
                  return(
                    <div key={qs.key} style={{marginBottom:10,padding:"10px 12px",background:"rgba(212,168,67,0.05)",borderRadius:10,border:"1px solid rgba(212,168,67,0.18)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{fontSize:11}}>⚡</span>
                        <div>
                          <div style={{fontSize:9.5,fontWeight:700,color:C.gold}}>{q?.label}</div>
                          <div style={{fontSize:8,color:C.muted}}>score: {q?.score?.toFixed(1)} · {qs.condition} · mode: {qs.triggerMode}</div>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                        {[["🥗 Aahar",qs.aahar,C.g3],["🏃 Vihar",qs.vihar,C.blue],["🌿 Aushadh",qs.aushadh,C.gold]].map(([lbl,val,col])=>(
                          <div key={lbl} style={{background:col+"0a",borderRadius:8,padding:"6px 10px",border:`1px solid ${col}25`}}>
                            <div style={{fontSize:9,fontWeight:700,color:col,marginBottom:3}}>{lbl}</div>
                            <div style={{fontSize:8.5,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!showKpiSugg&&questionSuggestions.length===0&&(
              <div style={{marginTop:14,textAlign:"center",padding:"12px 0",color:C.g3,fontSize:10}}>
                ✓ This KPI is in good shape. Keep it up!
              </div>
            )}
          </Card>
        );
      })()}

      {/* LIFESTYLE SUGGESTIONS — TWO-TIER OVERVIEW */}
      <Card style={{background:"rgba(107,179,63,0.04)",borderColor:"rgba(107,179,63,0.14)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:C.g3}}>🌿 Ayumonk Lifestyle Suggestions — Focus Areas This Week</div>
          <div style={{display:"flex",gap:6}}>
            <span style={{fontSize:8,background:"rgba(107,179,63,0.15)",color:C.g3,borderRadius:5,padding:"2px 8px",fontWeight:700}}>Tier 1 = KPI risk</span>
            <span style={{fontSize:8,background:"rgba(212,168,67,0.15)",color:C.gold,borderRadius:5,padding:"2px 8px",fontWeight:700}}>Tier 2 = Question score</span>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
          {weakParams.map(p=>{
            // Compute question-level triggers for this KPI
            const qTrigs = (p.questions||[]).filter(q =>
              (q.thresholdBelow!=null&&q.score<q.thresholdBelow)||(q.thresholdAbove!=null&&q.score>q.thresholdAbove)
            );
            const kpiAvg = scores[p.id];
            const riskBand = kpiAvg>=4.0?"good":kpiAvg>=3.0?"moderate":"risk";
            const riskCol = riskBand==="risk"?"#f87171":C.gold;
            return(
              <div key={p.id} style={{background:"rgba(255,255,255,0.025)",borderRadius:10,padding:"10px 14px",borderLeft:`3px solid ${p.color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{fontSize:11,fontWeight:700,color:p.color}}>{p.icon} {p.label}</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                    {riskBand!=="good"&&(
                      <span style={{fontSize:7.5,background:riskCol+"22",color:riskCol,borderRadius:4,padding:"1px 6px",fontWeight:700}}>T1 · KPI {riskBand}</span>
                    )}
                    {qTrigs.length>0&&(
                      <span style={{fontSize:7.5,background:"rgba(212,168,67,0.18)",color:C.gold,borderRadius:4,padding:"1px 6px",fontWeight:700}}>T2 · {qTrigs.length}Q flagged</span>
                    )}
                  </div>
                </div>
                {/* Show KPI-level suggestion preview */}
                {riskBand!=="good"&&p.suggestions?.kpiLevel&&(
                  <div style={{fontSize:8.5,color:"rgba(255,255,255,0.5)",lineHeight:1.55,marginBottom:qTrigs.length>0?6:0}}>
                    {p.suggestions.kpiLevel.aahar}
                  </div>
                )}
                {/* Show flagged question pills */}
                {qTrigs.length>0&&(
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>
                    {qTrigs.map(q=>(
                      <span key={q.key} style={{fontSize:7.5,background:"rgba(251,191,36,0.1)",color:C.gold,borderRadius:4,padding:"1px 6px",border:"1px solid rgba(251,191,36,0.2)"}}>
                        ⚡ {q.label.length>28?q.label.slice(0,28)+"…":q.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── CHALLENGES DASHBOARD ─────────────────────────────────────────────────────
function ChallengeDashboard({ isOnline=true, onOfflineQueue=()=>{} }){
  const [cs,setCs]=useState({
    water:{count:0},sleep:{done:false},activity:{chosen:null},
    nutrition:{chosen:[]},breathing:{timer:120,done:false},mood:{rating:null},
  });
  const [timerOn,setTimerOn]=useState(false);
  const timerRef=useRef(null);

  // ── Breathing Audio + Voice Engine ──────────────────────────────────────────
  // Two independent layers:
  //   Layer 1 — Web Audio API tones (rising/steady/falling sine waves)
  //   Layer 2 — Web Speech API voice commands ("Inhale", "Hold", "Exhale")
  // Both fire at the START of each breathing phase transition.
  // Employee can toggle each layer independently via soundOn / voiceOn state.
  const audioCtxRef  = useRef(null);
  const [soundOn, setSoundOn] = useState(true);   // audio tones
  const [voiceOn, setVoiceOn] = useState(true);   // spoken voice commands

  // ── Layer 1: Web Audio API tones ─────────────────────────────────────────
  const playBreathTone = (type) => {
    if(!soundOn) return;
    try {
      if(!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext||window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if(ctx.state === "suspended") ctx.resume();

      // Each phase needs a fresh oscillator + gain (Web Audio pattern)
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);

      if(type === "inhale"){
        // Rising sine 200 Hz → 440 Hz over 4 s — mirrors natural breath-in feeling
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 4);
        gain.gain.setValueAtTime(0,    ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.4);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 3.6);
        gain.gain.linearRampToValueAtTime(0,    ctx.currentTime + 4.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 4.2);

      } else if(type === "hold"){
        // Steady hum at 440 Hz for 7 s — plateau, stillness
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0,    ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.4);
        gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 6.6);
        gain.gain.linearRampToValueAtTime(0,    ctx.currentTime + 7.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 7.2);

      } else if(type === "exhale"){
        // Falling sine 440 Hz → 160 Hz over 8 s — mirrors natural breath-out release
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 8);
        gain.gain.setValueAtTime(0,    ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.4);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 7.4);
        gain.gain.linearRampToValueAtTime(0,    ctx.currentTime + 8.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 8.2);
      }
    } catch(e) { /* Audio not available — silent fallback */ }
  };

  // ── Layer 2: Web Speech API voice commands ────────────────────────────────
  // Speaks the command word at the start of each phase.
  // Uses a calm, low-pitch voice for a guided meditation feel.
  const speakPhase = (type) => {
    if(!voiceOn) return;
    try {
      if(!("speechSynthesis" in window)) return;
      // Cancel any in-progress speech so the new word fires immediately
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance();
      // Word + pause hint (comma makes TTS pause slightly before the word)
      utter.text = type === "inhale" ? "Inhale"
                 : type === "hold"   ? "Hold"
                 :                     "Exhale";
      utter.rate   = 0.78;  // slower = calmer
      utter.pitch  = 0.85;  // slightly lower pitch = more soothing
      utter.volume = 0.9;

      // Prefer a female English voice if available (calmer for breathing guidance)
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
      ) || voices.find(v =>
        v.lang.startsWith("en") && (v.name.includes("Samantha") || v.name.includes("Google") || v.name.includes("Karen"))
      ) || voices.find(v => v.lang.startsWith("en"));
      if(preferred) utter.voice = preferred;

      window.speechSynthesis.speak(utter);
    } catch(e) { /* TTS not available */ }
  };

  // ── Combined phase trigger ────────────────────────────────────────────────
  // Fires both layers together at phase transitions
  const triggerPhase = (type) => {
    playBreathTone(type);
    speakPhase(type);
  };

  // ── Breathing cycle definition ────────────────────────────────────────────
  // 4-7-8 pattern: 4s inhale + 7s hold + 8s exhale = 19s per cycle
  // 120s session = 6 full cycles + partial 7th
  const BREATH_CYCLE = 19;
  const TOTAL_CYCLES = Math.ceil(120 / BREATH_CYCLE); // 7

  const getBreathPhase = (elapsed) => {
    const pos = elapsed % BREATH_CYCLE;
    if(pos < 4)  return { phase:"inhale", label:"INHALE", color:"#38bdf8", remaining:Math.ceil(4-pos),  total:4, icon:"🌬", arrow:"↑" };
    if(pos < 11) return { phase:"hold",   label:"HOLD",   color:C.gold,    remaining:Math.ceil(11-pos), total:7, icon:"⏸", arrow:"—" };
    return              { phase:"exhale", label:"EXHALE", color:C.g3,      remaining:Math.ceil(19-pos), total:8, icon:"💨", arrow:"↓" };
  };

  // ── Timer interval — drives both countdown and phase detection ────────────
  useEffect(()=>{
    if(timerOn && cs.breathing.timer > 0){
      timerRef.current = setInterval(()=>{
        setCs(prev => {
          const t       = prev.breathing.timer - 1;
          const elapsed = 120 - t;
          // Detect phase boundary: compare phase at elapsed vs elapsed-1
          const prevBp  = getBreathPhase(elapsed - 1);
          const currBp  = getBreathPhase(elapsed);
          if(currBp.phase !== prevBp.phase) triggerPhase(currBp.phase);
          if(t <= 0){
            setTimerOn(false);
            window.speechSynthesis && window.speechSynthesis.cancel();
            return { ...prev, breathing:{ timer:0, done:true } };
          }
          return { ...prev, breathing:{ ...prev.breathing, timer:t } };
        });
      }, 1000);
      // Fire phase 1 (inhale) immediately on start
      triggerPhase("inhale");
    }
    return () => {
      clearInterval(timerRef.current);
    };
  }, [timerOn, soundOn, voiceOn]);

  const upd=(id,obj)=>setCs(prev=>({...prev,[id]:{...prev[id],...obj}}));
  const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  const isDone=id=>{
    const s=cs[id];
    if(id==="water")return s.count>=8;
    if(id==="sleep")return s.done;
    if(id==="activity")return s.chosen!==null;
    if(id==="nutrition")return s.chosen?.length>=1;
    if(id==="breathing")return s.done;
    if(id==="mood")return s.rating!==null;
    return false;
  };

  const getXP=id=>{
    const def=CHALLENGE_DEFS.find(c=>c.id===id);
    if(!isDone(id))return 0;
    if(id==="nutrition")return Math.round(def.xp*(cs.nutrition.chosen?.length||0)/def.options.length);
    return def.xp;
  };

  // ── Offline-aware completion handler ──────────────────────────────────────
  // Production: POST /api/challenges/complete
  //   If online  → direct API call
  //   If offline → write to IndexedDB offline queue; Service Worker Background
  //                Sync flushes it when connectivity returns
  const [offlineCount, setOfflineCount] = useState(0);
  const handleCompletion = (challengeId) => {
    if(!isOnline){
      setOfflineCount(p=>p+1);
      onOfflineQueue(1);
      // Production: idb.add('offline_queue', { type:'challenge_complete', challengeId, date: new Date() })
    }
    // UI state updates happen regardless (optimistic update)
  };

  // ── SCHEDULE-GATED CHALLENGE LISTS ───────────────────────────────────────
  // Only challenges whose mapped KPI is ACTIVE (today between start and end date)
  // are shown as interactive cards. Upcoming and ended are shown as info-only rows.
  const activeChallenges  = CHALLENGE_DEFS.filter(c => isKpiActive(c.kpi));
  const upcomingChallenges= CHALLENGE_DEFS.filter(c => KPI_SCHEDULE_MAP[c.kpi]?.status==="upcoming");
  const endedChallenges   = CHALLENGE_DEFS.filter(c => KPI_SCHEDULE_MAP[c.kpi]?.status==="ended");

  // Progress counts are based only on active challenges
  const done=activeChallenges.filter(c=>isDone(c.id)).length;
  const xpToday=activeChallenges.reduce((s,c)=>s+getXP(c.id),0);

  return(
    <div>
      {/* STATS BAR */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[
          ["🔥 Streak","7 Days","Day 8 unlocks a badge!",C.orange],
          ["⭐ XP Today",`${340+xpToday} pts`,"Complete all 6 for bonus",C.gold],
          ["🌱 Level","Banyan Sapling","3 more days → Banyan Tree",C.g3],
          ["✅ Progress",`${done} / ${activeChallenges.length}`,"Active KPI challenges today",C.blue],
        ].map(([lbl,val,sub,col])=>(
          <Card key={lbl} color={col+"33"} style={{padding:"12px 14px"}}>
            <div style={{fontSize:9,color:C.muted,marginBottom:3}}>{lbl}</div>
            <div style={{fontSize:20,fontWeight:800,color:col}}>{val}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.28)",marginTop:2}}>{sub}</div>
          </Card>
        ))}
      </div>

      {/* OFFLINE SYNC STATUS */}
      {!isOnline&&(
        <div style={{background:"rgba(232,160,32,0.08)",border:"1px solid rgba(232,160,32,0.25)",borderRadius:9,padding:"7px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:13}}>📡</span>
          <div style={{flex:1,fontSize:9,color:C.gold}}>
            You're offline. Challenge completions are saved locally and will sync automatically when you reconnect.
            {offlineCount>0&&<span style={{marginLeft:6,fontWeight:700}}>{offlineCount} queued</span>}
          </div>
          <span style={{fontSize:8,color:"rgba(232,160,32,0.5)",fontWeight:700}}>BACKGROUND SYNC ON</span>
        </div>
      )}

      {/* PROGRESS BAR */}
      <div style={{marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted,marginBottom:5}}>
          <span>Today's completion</span><span>{done}/{activeChallenges.length} active challenges · {xpToday} XP earned today</span>
        </div>
        <div style={{height:6,borderRadius:6,background:"rgba(255,255,255,0.06)"}}>
          <div style={{height:"100%",borderRadius:6,width:`${activeChallenges.length>0?(done/activeChallenges.length)*100:0}%`,background:`linear-gradient(90deg,${C.g2},${C.g3})`,transition:"width 0.5s ease"}}/>
        </div>
      </div>

      {/* ACTIVE CHALLENGES GRID */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.45)"}}>
          Today's Challenges
          <span style={{fontSize:9,fontWeight:400,color:"rgba(255,255,255,0.25)",marginLeft:8}}>— 1 to 3 taps each. Shown only for your company's active KPI programs.</span>
        </div>
        <div style={{marginLeft:"auto",background:"rgba(107,179,63,0.12)",border:"1px solid rgba(107,179,63,0.3)",borderRadius:8,padding:"3px 10px",fontSize:9,color:C.g3,fontWeight:600,whiteSpace:"nowrap"}}>
          {activeChallenges.length} active · {upcomingChallenges.length} upcoming · {endedChallenges.length} ended
        </div>
      </div>

      {activeChallenges.length===0&&(
        <Card style={{padding:"24px",textAlign:"center",marginBottom:22,borderColor:"rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:28,marginBottom:8}}>📅</div>
          <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.5)",marginBottom:4}}>No active challenges right now</div>
          <div style={{fontSize:10,color:C.muted}}>Your company hasn't started any KPI programs yet. Check the upcoming programs below.</div>
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:12,marginBottom:22}}>
        {activeChallenges.map(ch=>{
          const done_ch=isDone(ch.id);
          const xp=getXP(ch.id);
          const s=cs[ch.id];
          return(
            <Card key={ch.id} color={done_ch?ch.color+"66":ch.color+"22"} style={{background:done_ch?ch.color+"0e":"rgba(255,255,255,0.025)"}}>
              {done_ch&&<div style={{position:"absolute",top:10,right:12,fontSize:10,fontWeight:700,color:ch.color}}>✓ +{xp} XP</div>}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:24}}>{ch.icon}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:done_ch?ch.color:"#fff"}}>{ch.label}</div>
                  <div style={{fontSize:9,color:ch.color,opacity:0.7}}>{ch.kpi} KPI · {ch.xp} XP available</div>
                </div>
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.42)",marginBottom:10,lineHeight:1.5}}>{ch.desc}</div>

              {/* COUNTER */}
              {ch.type==="counter"&&(
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <Btn active={s.count>=ch.target} color={ch.color} disabled={s.count>=ch.target}
                      onClick={()=>upd(ch.id,{count:Math.min(ch.target,s.count+1)})}>+ 1 Glass</Btn>
                    <span style={{fontSize:15,fontWeight:800,color:ch.color}}>{s.count} / {ch.target}</span>
                    {s.count>0&&<button onClick={()=>upd(ch.id,{count:Math.max(0,s.count-1)})}
                      style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:C.muted,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10}}>−</button>}
                  </div>
                  <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,0.06)"}}>
                    <div style={{height:"100%",borderRadius:5,width:`${(s.count/ch.target)*100}%`,background:ch.color,transition:"width 0.3s"}}/>
                  </div>
                </div>
              )}
              {/* TOGGLE */}
              {ch.type==="toggle"&&(
                <Btn active={s.done} color={ch.color} onClick={()=>upd(ch.id,{done:!s.done})}>
                  {s.done?"✓ "+ch.options[0]:"⬜ "+ch.options[0]}
                </Btn>
              )}
              {/* CHOICE — pick one */}
              {ch.type==="choice"&&(
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {ch.options.map((opt,i)=>(
                    <Btn key={i} active={s.chosen===i} color={ch.color} onClick={()=>upd(ch.id,{chosen:s.chosen===i?null:i})}>{opt}</Btn>
                  ))}
                </div>
              )}
              {/* MULTI — pick any */}
              {ch.type==="multi"&&(
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {ch.options.map((opt,i)=>{
                    const sel=(s.chosen||[]).includes(i);
                    return(
                      <Btn key={i} active={sel} color={ch.color} onClick={()=>{
                        const arr=s.chosen||[];
                        upd(ch.id,{chosen:sel?arr.filter(x=>x!==i):[...arr,i]});
                      }}>{opt}</Btn>
                    );
                  })}
                </div>
              )}
              {/* TIMER — 4-7-8 Breathing: Web Audio tones + Web Speech voice commands */}
              {ch.type==="timer"&&(
                <div>
                  {!s.done ? (
                    timerOn ? (()=>{
                      const elapsed  = 120 - s.timer;
                      const bp       = getBreathPhase(elapsed);
                      const cycleNum = Math.floor(elapsed / BREATH_CYCLE) + 1;
                      const phasePct = ((bp.total - bp.remaining) / bp.total) * 100;
                      const BG = { inhale:"rgba(56,189,248,0.09)", hold:"rgba(212,168,67,0.09)", exhale:"rgba(107,179,63,0.09)" };
                      const GUIDE = {
                        inhale:"Breathe in slowly through your nose",
                        hold:  "Hold gently — relax your shoulders",
                        exhale:"Release fully through your mouth",
                      };
                      return (
                        <div style={{borderRadius:14,overflow:"hidden",border:`1px solid ${bp.color}44`,transition:"border-color 0.6s"}}>
                          {/* Phase command banner — large, unmissable */}
                          <div style={{background:BG[bp.phase],padding:"14px 12px 8px",textAlign:"center",transition:"background 0.6s"}}>
                            {/* Arrow + command word */}
                            <div style={{
                              fontSize:32,fontWeight:900,letterSpacing:4,
                              color:bp.color,fontFamily:"monospace",
                              transition:"color 0.4s",lineHeight:1,marginBottom:4,
                              textShadow:`0 0 20px ${bp.color}55`
                            }}>
                              {bp.arrow}&nbsp;{bp.label}
                            </div>
                            {/* Guidance sub-text */}
                            <div style={{fontSize:9,color:"rgba(255,255,255,0.42)",marginBottom:10,letterSpacing:0.3}}>
                              {GUIDE[bp.phase]}
                            </div>
                            {/* SVG ring */}
                            <div style={{position:"relative",width:88,height:88,margin:"0 auto 8px"}}>
                              <svg width="88" height="88" viewBox="0 0 88 88">
                                <circle cx="44" cy="44" r="36" fill="none"
                                  stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
                                <circle cx="44" cy="44" r="36" fill="none"
                                  stroke={bp.color} strokeWidth="6"
                                  strokeLinecap="round"
                                  strokeDasharray={`${2*Math.PI*36}`}
                                  strokeDashoffset={`${2*Math.PI*36*(1-phasePct/100)}`}
                                  transform="rotate(-90 44 44)"
                                  style={{transition:"stroke-dashoffset 0.92s linear, stroke 0.5s"}}/>
                              </svg>
                              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
                                alignItems:"center",justifyContent:"center",gap:2}}>
                                <span style={{fontSize:18}}>{bp.icon}</span>
                                <span style={{fontSize:18,fontWeight:900,color:bp.color,
                                  lineHeight:1,fontFamily:"monospace"}}>{bp.remaining}s</span>
                              </div>
                            </div>
                            {/* Cycle dots */}
                            <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:6}}>
                              {Array.from({length:TOTAL_CYCLES},(_,i)=>(
                                <div key={i} style={{
                                  width:i < cycleNum ? 10 : 7,
                                  height:i < cycleNum ? 10 : 7,
                                  borderRadius:"50%",
                                  background: i < cycleNum ? bp.color : "rgba(255,255,255,0.07)",
                                  transition:"all 0.4s",marginTop: i < cycleNum ? 0 : 1.5
                                }}/>
                              ))}
                            </div>
                            <div style={{fontSize:8.5,color:"rgba(255,255,255,0.35)"}}>
                              Cycle <span style={{color:bp.color,fontWeight:700}}>{cycleNum}</span> of {TOTAL_CYCLES}
                              &nbsp;·&nbsp;
                              <span style={{fontFamily:"monospace",color:"rgba(255,255,255,0.45)",fontWeight:700}}>{fmt(s.timer)}</span> left
                            </div>
                          </div>

                          {/* Controls bar */}
                          <div style={{background:"rgba(0,0,0,0.25)",padding:"8px 12px",
                            display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                            {/* Sound toggle */}
                            <button onClick={()=>setSoundOn(p=>!p)}
                              title={soundOn?"Mute audio tones":"Enable audio tones"}
                              style={{padding:"4px 10px",borderRadius:7,fontSize:8.5,cursor:"pointer",fontWeight:600,
                                background:soundOn?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.04)",
                                border:`1px solid ${soundOn?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.08)"}`,
                                color:soundOn?"#38bdf8":"rgba(255,255,255,0.3)"}}>
                              {soundOn?"🔊 Tones ON":"🔇 Tones OFF"}
                            </button>
                            {/* Voice toggle */}
                            <button onClick={()=>{
                                setVoiceOn(p=>{
                                  if(p) window.speechSynthesis && window.speechSynthesis.cancel();
                                  return !p;
                                });
                              }}
                              title={voiceOn?"Mute voice commands":"Enable voice commands"}
                              style={{padding:"4px 10px",borderRadius:7,fontSize:8.5,cursor:"pointer",fontWeight:600,
                                background:voiceOn?"rgba(107,179,63,0.12)":"rgba(255,255,255,0.04)",
                                border:`1px solid ${voiceOn?"rgba(107,179,63,0.3)":"rgba(255,255,255,0.08)"}`,
                                color:voiceOn?C.g3:"rgba(255,255,255,0.3)"}}>
                              {voiceOn?"🗣 Voice ON":"🔕 Voice OFF"}
                            </button>
                            {/* Spacer */}
                            <div style={{flex:1}}/>
                            {/* Pause */}
                            <button onClick={()=>{
                                setTimerOn(false);
                                window.speechSynthesis && window.speechSynthesis.cancel();
                              }}
                              style={{padding:"4px 14px",borderRadius:7,background:"transparent",
                                border:"1px solid rgba(255,255,255,0.1)",color:C.muted,
                                fontSize:8.5,cursor:"pointer",fontWeight:600}}>
                              ⏸ Pause
                            </button>
                          </div>

                          {/* Audio legend */}
                          <div style={{background:"rgba(0,0,0,0.15)",padding:"5px 12px",
                            display:"flex",gap:12,justifyContent:"center"}}>
                            {[
                              ["↑ INHALE","Rising tone","#38bdf8"],
                              ["— HOLD","Steady hum",C.gold],
                              ["↓ EXHALE","Falling tone",C.g3],
                            ].map(([cmd,tone,col])=>(
                              <div key={cmd} style={{textAlign:"center"}}>
                                <div style={{fontSize:8,fontWeight:700,color:col,fontFamily:"monospace"}}>{cmd}</div>
                                <div style={{fontSize:7,color:"rgba(255,255,255,0.22)"}}>{tone}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })() : (
                      /* Not running — START screen */
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {/* Pattern summary */}
                        <div style={{padding:"10px 14px",background:"rgba(249,115,22,0.05)",
                          borderRadius:10,border:"1px solid rgba(249,115,22,0.14)"}}>
                          <div style={{display:"flex",justifyContent:"space-around",marginBottom:8}}>
                            {[
                              ["↑","INHALE","4s","#38bdf8"],
                              ["—","HOLD","7s",C.gold],
                              ["↓","EXHALE","8s",C.g3],
                            ].map(([arrow,cmd,dur,col])=>(
                              <div key={cmd} style={{textAlign:"center"}}>
                                <div style={{fontSize:18,fontWeight:900,color:col,fontFamily:"monospace"}}>{arrow}</div>
                                <div style={{fontSize:9,fontWeight:800,color:col}}>{cmd}</div>
                                <div style={{fontSize:8,color:C.muted}}>{dur}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{fontSize:8,color:C.muted,textAlign:"center",lineHeight:1.5}}>
                            {TOTAL_CYCLES} cycles · 2 minutes · Reduces cortisol in one session
                          </div>
                        </div>
                        {/* Audio options */}
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>setSoundOn(p=>!p)}
                            style={{flex:1,padding:"6px 10px",borderRadius:8,fontSize:8.5,cursor:"pointer",fontWeight:600,
                              background:soundOn?"rgba(56,189,248,0.1)":"rgba(255,255,255,0.03)",
                              border:`1px solid ${soundOn?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.1)"}`,
                              color:soundOn?"#38bdf8":"rgba(255,255,255,0.3)"}}>
                            {soundOn?"🔊 Tones ON":"🔇 Tones OFF"}
                          </button>
                          <button onClick={()=>setVoiceOn(p=>!p)}
                            style={{flex:1,padding:"6px 10px",borderRadius:8,fontSize:8.5,cursor:"pointer",fontWeight:600,
                              background:voiceOn?"rgba(107,179,63,0.1)":"rgba(255,255,255,0.03)",
                              border:`1px solid ${voiceOn?"rgba(107,179,63,0.3)":"rgba(255,255,255,0.1)"}`,
                              color:voiceOn?C.g3:"rgba(255,255,255,0.3)"}}>
                            {voiceOn?"🗣 Voice ON":"🔕 Voice OFF"}
                          </button>
                        </div>
                        <div style={{fontSize:8,color:C.muted,textAlign:"center"}}>
                          Voice speaks <em>Inhale / Hold / Exhale</em> · Tones: rising / steady / falling sine
                        </div>
                        <Btn color={ch.color} onClick={()=>setTimerOn(true)}>▶ Start Breathing Session</Btn>
                      </div>
                    )
                  ) : (
                    /* Completed */
                    <div style={{textAlign:"center",padding:"12px 0",
                      background:"rgba(107,179,63,0.06)",borderRadius:12,border:`1px solid ${C.g3}33`}}>
                      <div style={{fontSize:24,marginBottom:6}}>🧘</div>
                      <div style={{fontSize:13,fontWeight:800,color:C.g3,marginBottom:3}}>
                        Session Complete!
                      </div>
                      <div style={{fontSize:9,color:C.muted,marginBottom:10}}>
                        {TOTAL_CYCLES} cycles · 2 minutes · +{ch.xp} XP earned · Stress KPI updated
                      </div>
                      <button onClick={()=>upd("breathing",{timer:120,done:false})}
                        style={{padding:"5px 18px",borderRadius:8,background:"transparent",
                          border:`1px solid ${C.g3}44`,color:C.g3,fontSize:9,cursor:"pointer"}}>
                        ↺ Repeat session
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* RATING */}
              {ch.type==="rating"&&(
                <div style={{display:"flex",gap:8}}>
                  {ch.options.map((em,i)=>(
                    <button key={i} onClick={()=>upd(ch.id,{rating:i})} style={{
                      fontSize:24,border:"none",background:s.rating===i?"rgba(52,211,153,0.25)":"transparent",
                      cursor:"pointer",borderRadius:8,padding:"4px 6px",
                      outline:s.rating===i?"2px solid "+ch.color:"none",transition:"all 0.15s"
                    }}>{em}</button>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* BADGES + LEADERBOARD */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card>
          <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>🏅 My Badges</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {BADGES.map(b=>(
              <div key={b.id} style={{
                background:b.earned?b.color+"22":"rgba(255,255,255,0.02)",
                border:`1px solid ${b.earned?b.color+"55":"rgba(255,255,255,0.06)"}`,
                borderRadius:10,padding:"8px 12px",textAlign:"center",minWidth:90,
                opacity:b.earned?1:0.4
              }}>
                <div style={{fontSize:22,marginBottom:3}}>{b.icon}</div>
                <div style={{fontSize:9,fontWeight:700,color:b.earned?b.color:"rgba(255,255,255,0.35)"}}>{b.label}</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.28)"}}>{b.level}{!b.earned&&" 🔒"}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>🏆 Weekly Leaderboard</div>
          {[["1st","Priya S.","Engineering","Delhi","+42%",C.gold],
            ["2nd","Rahul M.","Product","Mumbai","+38%","#94a3b8"],
            ["3rd","Anjali K.","HR","BLR","+35%",C.orange],
            ["4th ⬅ You","Amit R.","Finance","Delhi","+31%",C.g3],
            ["5th","Sneha P.","Marketing","Pune","+28%","rgba(255,255,255,0.3)"],
          ].map(([rank,name,dept,loc,pct,col])=>(
            <div key={rank} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <div style={{width:64,fontSize:11,fontWeight:700,color:col}}>{rank}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:rank.includes("You")?"#6db33f":"#fff"}}>{name}</div>
                <div style={{fontSize:9,color:C.muted}}>{dept} · {loc}</div>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:col}}>{pct}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* KPI PROGRAM SCHEDULE TIMELINE */}
      <Card style={{marginTop:14,borderColor:"rgba(107,179,63,0.18)",background:"rgba(107,179,63,0.03)"}}>
        <div style={{fontSize:12,fontWeight:700,color:C.g3,marginBottom:12}}>
          📅 KPI Program Schedule — Your Company
          <span style={{fontSize:9,fontWeight:400,color:C.muted,marginLeft:8}}>Challenges appear and disappear based on these windows</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {COMPANY_KPI_SCHEDULE.map(e=>{
            const st=e.status||_kpiStatus(e);
            const ch=CHALLENGE_DEFS.find(c=>c.kpi===e.kpi);
            const totalDays=Math.ceil((e.end-e.start)/(1000*60*60*24));
            const elapsed=Math.max(0,Math.ceil((_today-e.start)/(1000*60*60*24)));
            const pct=Math.min(100,Math.max(0,Math.round((elapsed/totalDays)*100)));
            const col = st==="active"?C.g3 : st==="upcoming"?C.blue : "rgba(255,255,255,0.18)";
            const badge = st==="active"
              ? <span style={{background:"rgba(107,179,63,0.2)",color:C.g3,borderRadius:5,padding:"1px 7px",fontSize:8,fontWeight:700}}>● ACTIVE</span>
              : st==="upcoming"
              ? <span style={{background:"rgba(74,144,196,0.2)",color:C.blue,borderRadius:5,padding:"1px 7px",fontSize:8,fontWeight:700}}>⏳ UPCOMING</span>
              : <span style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.3)",borderRadius:5,padding:"1px 7px",fontSize:8,fontWeight:700}}>✓ ENDED</span>;
            return(
              <div key={e.kpi} style={{display:"grid",gridTemplateColumns:"28px 130px 1fr 120px 60px",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <span style={{fontSize:16}}>{ch?.icon||"🔹"}</span>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:col}}>{ch?.label||e.kpi}</div>
                  <div style={{fontSize:8,color:C.muted}}>{e.theme}</div>
                </div>
                <div>
                  <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,borderRadius:5,
                      background: st==="active"?`linear-gradient(90deg,${C.g2},${C.g3})` : st==="upcoming"?"transparent" : "rgba(255,255,255,0.15)",
                      transition:"width 0.4s"}}/>
                  </div>
                </div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>
                  {_fmtDate(e.start)} → {_fmtDate(e.end)}
                </div>
                <div style={{textAlign:"right"}}>{badge}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* UPCOMING CHALLENGES — info only, non-interactive */}
      {upcomingChallenges.length>0&&(
        <div style={{marginTop:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:8}}>
            ⏳ Coming Soon <span style={{fontSize:9,fontWeight:400,color:C.muted}}>— not yet active for your company</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {upcomingChallenges.map(ch=>{
              const sch=KPI_SCHEDULE_MAP[ch.kpi];
              return(
                <div key={ch.id} style={{background:"rgba(74,144,196,0.06)",border:"1px dashed rgba(74,144,196,0.25)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,minWidth:200,opacity:0.75}}>
                  <span style={{fontSize:20}}>{ch.icon}</span>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:C.blue}}>{ch.label}</div>
                    <div style={{fontSize:8,color:C.muted}}>Starts {_fmtDate(sch.start)} · {sch.programLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ENDED CHALLENGES — archived view */}
      {endedChallenges.length>0&&(
        <div style={{marginTop:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.28)",marginBottom:8}}>
            ✓ Completed Programs <span style={{fontSize:9,fontWeight:400,color:C.muted}}>— streaks and XP preserved</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {endedChallenges.map(ch=>{
              const sch=KPI_SCHEDULE_MAP[ch.kpi];
              return(
                <div key={ch.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,minWidth:200,opacity:0.45}}>
                  <span style={{fontSize:20,filter:"grayscale(1)"}}>{ch.icon}</span>
                  <div>
                    <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.35)"}}>{ch.label}</div>
                    <div style={{fontSize:8,color:C.muted}}>Ended {_fmtDate(sch.end)} · {sch.programLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TEAM CHALLENGES — disabled; will be re-enabled in a future sprint ─ */}
      {/* <TeamChallenges/> */}

      {/* ── REMINDER SETTINGS PANEL ───────────────────────────────────────────
          Maps to: reminder_settings table (PostgreSQL)
          API:  GET/PATCH /api/reminders/settings
               POST /api/reminders/push/subscribe
               POST /api/reminders/snooze
          RLS:  user_id = current_app_user_id() — own row only
      ──────────────────────────────────────────────────────────────────────── */}
      <ReminderSettings/>
    </div>
  );
}

// ─── TEAM CHALLENGES COMPONENT ───────────────────────────────────────────────
// Shows active team challenges created by HR admin.
// Production: GET /api/team-challenges (filtered by company_id via RLS)
// DB table: team_challenges (already in schema)
const MOCK_TEAM_CHALLENGES = [
  {
    id:"tc1",
    title:"Engineering vs Marketing — 30-Day Sleep Sprint",
    kpi:"sleep", kpiIcon:"🌙", kpiColor:"#7c6af7",
    startDate:"1 Dec 2025", endDate:"31 Dec 2025", daysLeft:11, daysTotal:30,
    status:"active",
    description:"Which department can improve their average Sleep score the most? HR will feature the winning team in the January newsletter and award a team badge.",
    prize:"🏆 Department badge + featured in company newsletter",
    teamA:{ name:"Engineering 🖥",  dept:"Engineering", score:3.82, baseline:3.41, improvement:12.0, participants:24, completionRate:68 },
    teamB:{ name:"Marketing 📣",    dept:"Marketing",   score:3.65, baseline:3.20, improvement:14.1, participants:18, completionRate:72 },
    myTeam:"A",
    myContribution:{ score:4.1, improvement:16.5, streak:7, rank:3 },
  },
  {
    id:"tc2",
    title:"All Departments — Hydration Challenge",
    kpi:"hydration", kpiIcon:"💧", kpiColor:"#38bdf8",
    startDate:"15 Dec 2025", endDate:"31 Dec 2025", daysLeft:17, daysTotal:17,
    status:"active",
    description:"Company-wide hydration push for the festive season. Log 8 glasses daily. Top 3 participants win a wellness hamper from Ayufinity.",
    prize:"🎁 Top 3 individual performers win a wellness hamper",
    teamA:{ name:"Whole Company 🌿", dept:"All", score:3.45, baseline:3.10, improvement:11.3, participants:142, completionRate:61 },
    teamB:null,
    myTeam:"A",
    myContribution:{ score:3.8, improvement:22.5, streak:4, rank:12 },
  },
];

function TeamChallenges() {
  const [activeTC, setActiveTC] = useState("tc1");
  const [showDetails, setShowDetails] = useState(false);
  const tc = MOCK_TEAM_CHALLENGES.find(t=>t.id===activeTC) || MOCK_TEAM_CHALLENGES[0];

  const ProgressBar = ({pct, color, h=8, animated=false})=>(
    <div style={{height:h,borderRadius:h,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
      <div style={{height:"100%",borderRadius:h,
        width:`${Math.min(100,pct)}%`,
        background:color,
        transition:animated?"width 1s ease":"width 0.4s"}}/>
    </div>
  );

  const isVsMode = tc.teamB !== null;

  // Determine leader
  const aWinning = isVsMode && tc.teamA.improvement >= (tc.teamB?.improvement||0);
  const bWinning = isVsMode && !aWinning;

  // Time progress
  const timePct = ((tc.daysTotal - tc.daysLeft) / tc.daysTotal) * 100;

  return (
    <Card style={{marginTop:14, borderColor:`${tc.kpiColor}33`, background:`${tc.kpiColor}06`}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <span style={{fontSize:14}}>🏆</span>
            <span style={{fontSize:12,fontWeight:700}}>Team Challenges</span>
            <span style={{fontSize:8,background:"rgba(107,179,63,0.12)",color:C.g3,
              borderRadius:5,padding:"1px 7px",fontWeight:600}}>
              {MOCK_TEAM_CHALLENGES.filter(t=>t.status==="active").length} active
            </span>
          </div>
          <div style={{fontSize:9,color:C.muted}}>Created by HR · Compete as departments · Earn team badges</div>
        </div>
        {/* Challenge selector pills */}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {MOCK_TEAM_CHALLENGES.map(t=>(
            <button key={t.id} onClick={()=>setActiveTC(t.id)}
              style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${activeTC===t.id?t.kpiColor:"rgba(255,255,255,0.1)"}`,
                background:activeTC===t.id?`${t.kpiColor}18`:"transparent",
                color:activeTC===t.id?t.kpiColor:"rgba(255,255,255,0.45)",
                fontSize:9,fontWeight:activeTC===t.id?700:400,cursor:"pointer"}}>
              {t.kpiIcon} {t.title.split("—")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Challenge title + meta */}
      <div style={{background:"rgba(255,255,255,0.025)",borderRadius:10,padding:"12px 14px",marginBottom:12,
        border:`1px solid ${tc.kpiColor}33`}}>
        <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:4}}>{tc.title}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          <span style={{fontSize:8,background:`${tc.kpiColor}18`,color:tc.kpiColor,borderRadius:5,padding:"2px 8px",fontWeight:600}}>
            {tc.kpiIcon} {tc.kpi} KPI
          </span>
          <span style={{fontSize:8,background:"rgba(255,255,255,0.06)",color:C.muted,borderRadius:5,padding:"2px 8px"}}>
            📅 {tc.startDate} – {tc.endDate}
          </span>
          <span style={{fontSize:8,background:"rgba(232,160,32,0.12)",color:C.gold,borderRadius:5,padding:"2px 8px",fontWeight:600}}>
            ⏳ {tc.daysLeft} days left
          </span>
        </div>
        {/* Time progress bar */}
        <ProgressBar pct={timePct} color={`linear-gradient(90deg,${C.g2},${C.g3})`} h={4}/>
        <div style={{fontSize:8,color:C.muted,marginTop:3}}>
          Day {tc.daysTotal-tc.daysLeft} of {tc.daysTotal} · {timePct.toFixed(0)}% through the challenge
        </div>
      </div>

      {/* COMPETITION DISPLAY */}
      {isVsMode ? (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>
            Competition Progress — KPI Improvement %
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"center",marginBottom:12}}>
            {/* Team A */}
            <div style={{background:tc.myTeam==="A"?`${tc.kpiColor}12`:"rgba(255,255,255,0.02)",borderRadius:12,
              padding:"12px 14px",border:`1px solid ${tc.myTeam==="A"?tc.kpiColor:"rgba(255,255,255,0.08)"}44`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:11,fontWeight:700,color:tc.myTeam==="A"?tc.kpiColor:"rgba(255,255,255,0.7)"}}>
                  {tc.teamA.name}
                  {tc.myTeam==="A"&&<span style={{fontSize:7.5,background:`${tc.kpiColor}22`,borderRadius:4,padding:"1px 5px",marginLeft:5,fontWeight:700}}>Your team</span>}
                </div>
                {aWinning&&<span style={{fontSize:11}}>👑</span>}
              </div>
              <div style={{fontSize:26,fontWeight:800,color:aWinning?tc.kpiColor:C.g3,marginBottom:4}}>
                +{tc.teamA.improvement.toFixed(1)}%
              </div>
              <ProgressBar pct={tc.teamA.improvement * 3} color={aWinning?tc.kpiColor:C.g2} h={6} animated/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:8,color:C.muted}}>
                <span>{tc.teamA.participants} members</span>
                <span>{tc.teamA.completionRate}% completion</span>
              </div>
              <div style={{marginTop:6,fontSize:8.5,color:"rgba(255,255,255,0.4)"}}>
                Avg score: <span style={{color:tc.kpiColor,fontWeight:700}}>{tc.teamA.score}</span>
                <span style={{color:C.muted}}> (was {tc.teamA.baseline})</span>
              </div>
            </div>

            {/* VS */}
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:800,color:"rgba(255,255,255,0.2)"}}>VS</div>
              <div style={{width:1,height:60,background:"rgba(255,255,255,0.06)",margin:"6px auto"}}/>
            </div>

            {/* Team B */}
            <div style={{background:tc.myTeam==="B"?`${tc.kpiColor}12`:"rgba(255,255,255,0.02)",borderRadius:12,
              padding:"12px 14px",border:`1px solid ${tc.myTeam==="B"?tc.kpiColor:"rgba(255,255,255,0.08)"}44`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:11,fontWeight:700,color:tc.myTeam==="B"?tc.kpiColor:"rgba(255,255,255,0.7)"}}>
                  {tc.teamB.name}
                  {tc.myTeam==="B"&&<span style={{fontSize:7.5,background:`${tc.kpiColor}22`,borderRadius:4,padding:"1px 5px",marginLeft:5,fontWeight:700}}>Your team</span>}
                </div>
                {bWinning&&<span style={{fontSize:11}}>👑</span>}
              </div>
              <div style={{fontSize:26,fontWeight:800,color:bWinning?tc.kpiColor:C.g3,marginBottom:4}}>
                +{tc.teamB.improvement.toFixed(1)}%
              </div>
              <ProgressBar pct={tc.teamB.improvement * 3} color={bWinning?tc.kpiColor:C.g2} h={6} animated/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:8,color:C.muted}}>
                <span>{tc.teamB.participants} members</span>
                <span>{tc.teamB.completionRate}% completion</span>
              </div>
              <div style={{marginTop:6,fontSize:8.5,color:"rgba(255,255,255,0.4)"}}>
                Avg score: <span style={{color:tc.kpiColor,fontWeight:700}}>{tc.teamB.score}</span>
                <span style={{color:C.muted}}> (was {tc.teamB.baseline})</span>
              </div>
            </div>
          </div>

          {/* Current leader banner */}
          <div style={{background:aWinning?`${tc.kpiColor}10`:`${tc.kpiColor}10`,border:`1px solid ${tc.kpiColor}33`,
            borderRadius:9,padding:"8px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:16}}>👑</span>
            <div style={{flex:1}}>
              <span style={{fontSize:10,fontWeight:700,color:tc.kpiColor}}>
                {aWinning?tc.teamA.name:tc.teamB.name} is currently leading
              </span>
              <span style={{fontSize:8.5,color:C.muted,marginLeft:6}}>
                by +{Math.abs(tc.teamA.improvement-tc.teamB.improvement).toFixed(1)}% · {tc.daysLeft} days to close the gap
              </span>
            </div>
            {tc.myTeam===(aWinning?"A":"B")
              ? <span style={{fontSize:9,color:C.g3,fontWeight:700}}>🎯 Your team is winning!</span>
              : <span style={{fontSize:9,color:C.gold,fontWeight:700}}>⚡ Push harder!</span>
            }
          </div>
        </div>
      ) : (
        /* Company-wide challenge (no team B) */
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>
            Company-Wide Progress
          </div>
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{fontSize:26,fontWeight:800,color:C.g3,marginBottom:4}}>+{tc.teamA.improvement.toFixed(1)}%</div>
            <div style={{fontSize:9,color:C.muted,marginBottom:8}}>Avg improvement across {tc.teamA.participants} participants</div>
            <ProgressBar pct={tc.teamA.completionRate} color={`linear-gradient(90deg,${C.g2},${C.g3})`} h={8} animated/>
            <div style={{fontSize:8,color:C.muted,marginTop:4}}>{tc.teamA.completionRate}% daily completion rate</div>
          </div>
        </div>
      )}

      {/* MY CONTRIBUTION */}
      <div style={{background:"rgba(255,255,255,0.02)",borderRadius:10,padding:"10px 14px",
        border:`1px solid ${tc.kpiColor}22`,marginBottom:12}}>
        <div style={{fontSize:9,fontWeight:700,color:tc.kpiColor,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>
          ⚡ My Contribution
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[
            ["My Score", tc.myContribution.score.toFixed(1), "out of 5", tc.kpiColor],
            ["Improvement", `+${tc.myContribution.improvement.toFixed(1)}%`, "from baseline", C.g3],
            ["Streak", `${tc.myContribution.streak}d`, "consecutive", C.gold],
            ["Rank", `#${tc.myContribution.rank}`, `of ${tc.teamA.participants}`, C.blue],
          ].map(([l,v,s,col])=>(
            <div key={l} style={{textAlign:"center",background:`${col}0d`,borderRadius:8,padding:"8px 6px"}}>
              <div style={{fontSize:7.5,color:C.muted,marginBottom:2}}>{l}</div>
              <div style={{fontSize:16,fontWeight:800,color:col}}>{v}</div>
              <div style={{fontSize:7,color:"rgba(255,255,255,0.25)"}}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Prize + details toggle */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12}}>{tc.prize.split(" ")[0]}</span>
          <div style={{fontSize:9,color:C.muted}}>{tc.prize.slice(2)}</div>
        </div>
        <button onClick={()=>setShowDetails(p=>!p)}
          style={{padding:"4px 12px",borderRadius:7,background:"transparent",
            border:"1px solid rgba(255,255,255,0.1)",color:C.muted,fontSize:9,cursor:"pointer"}}>
          {showDetails?"Hide details":"About this challenge"}
        </button>
      </div>
      {showDetails&&(
        <div style={{marginTop:10,padding:"10px 14px",background:"rgba(255,255,255,0.02)",borderRadius:8,fontSize:9,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>
          {tc.description}
        </div>
      )}
    </Card>
  );
}

// ─── REMINDER SETTINGS COMPONENT ─────────────────────────────────────────────
function ReminderSettings(){
  // State mirrors reminder_settings table columns
  const [settings, setSettings] = useState({
    is_enabled:        false,
    channel:           "email",
    reminder_time:     "20:00",
    timezone:          Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    remind_on_incomplete:  true,
    remind_streak_at_risk: true,
    remind_window_closing: true,
    remind_window_opening: true,
    remind_milestone_near: true,
    snooze_until:      null,
  });
  const [saved, setSaved]   = useState(false);
  const [pushGranted, setPushGranted] = useState(false);
  const [pushPending, setPushPending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeHistory, setActiveHistory] = useState(false);

  // Simulated reminder log (production: GET /api/reminders/history)
  const REMINDER_HISTORY = [
    { type:"daily_incomplete", icon:"📋", label:"Daily Challenge Reminder",    channel:"email", time:"Yesterday 8:00 PM", status:"sent",       statusCol:C.g3 },
    { type:"streak_risk",      icon:"🔥", label:"Streak At Risk Alert",        channel:"push",  time:"2 days ago 9:00 PM",status:"sent",       statusCol:C.g3 },
    { type:"window_closing",   icon:"📅", label:"Hydration Program Closing",   channel:"email", time:"3 days ago 8:00 AM",status:"sent",       statusCol:C.g3 },
    { type:"daily_incomplete", icon:"📋", label:"Daily Challenge Reminder",    channel:"email", time:"4 days ago 8:00 PM", status:"suppressed", statusCol:C.muted },
    { type:"milestone_near",   icon:"🏅", label:"Badge Milestone — 7-Day",    channel:"push",  time:"5 days ago 8:00 AM", status:"sent",       statusCol:C.g3 },
    { type:"window_opening",   icon:"🌱", label:"Sleep Program Starting Soon", channel:"email", time:"6 days ago 8:00 AM", status:"failed",     statusCol:C.red },
  ];

  const upd = (key, val) => { setSettings(p=>({...p,[key]:val})); setSaved(false); };

  const handleSave = () => {
    // Production: PATCH /api/reminders/settings  body: settings
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  const handlePushRequest = async () => {
    setPushPending(true);
    try {
      // Production: navigator.serviceWorker + pushManager.subscribe + POST /api/reminders/push/subscribe
      await new Promise(r=>setTimeout(r,1200)); // simulate permission prompt
      setPushGranted(true);
      upd("channel","push");
    } catch(e) { }
    setPushPending(false);
  };

  const handleSnooze = (hours) => {
    const until = new Date(Date.now() + hours*3600*1000);
    upd("snooze_until", until.toISOString());
    setSaved(false);
  };

  const isSnoozing = settings.snooze_until && new Date(settings.snooze_until) > new Date();
  const snoozeEnds = isSnoozing ? formatDateTimeISTShort(settings.snooze_until) : null;

  const REMINDER_TYPES = [
    { key:"remind_on_incomplete",  icon:"📋", label:"Daily challenge reminder",      sub:"Fires at your set time if any challenge is uncomplete" },
    { key:"remind_streak_at_risk", icon:"🔥", label:"Streak at risk alert",          sub:"Fires at 9PM if your streak ≥ 3 days and today isn't done" },
    { key:"remind_window_closing", icon:"📅", label:"Program ending soon",           sub:"Once, 3 days before a KPI window closes" },
    { key:"remind_window_opening", icon:"🌱", label:"New program starting tomorrow", sub:"Once, day before a new KPI window opens" },
    { key:"remind_milestone_near", icon:"🏅", label:"Badge milestone alert",         sub:"When you're 1 day away from a 7/14/21/30-day badge" },
  ];

  const CHANNELS = [
    { id:"email",    icon:"📧", label:"Email",         note:"Works immediately" },
    { id:"push",     icon:"🔔", label:"Browser Push",  note:pushGranted?"Enabled":"Needs permission" },
    { id:"whatsapp", icon:"💬", label:"WhatsApp",      note:"Phase 3 — coming soon" },
  ];

  return (
    <Card style={{marginTop:14, borderColor: settings.is_enabled ? "rgba(107,179,63,0.3)" : "rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.2)"}}>

      {/* ── HEADER ROW ──────────────────────────────────────────────────── */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom: expanded ? 18 : 0}}>
        <span style={{fontSize:20}}>🔔</span>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>Reminder Settings</div>
          <div style={{fontSize:9,color:C.muted,marginTop:2}}>
            {isSnoozing
              ? `⏸ Snoozed until ${snoozeEnds}`
              : settings.is_enabled
              ? `Active · ${settings.channel} · ${settings.reminder_time} ${settings.timezone}`
              : "Reminders are off"}
          </div>
        </div>
        {/* Master toggle */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:9,color:settings.is_enabled?C.g3:C.muted,fontWeight:600}}>
            {settings.is_enabled?"ON":"OFF"}
          </span>
          <button
            onClick={()=>upd("is_enabled",!settings.is_enabled)}
            style={{
              width:42, height:24, borderRadius:12, border:"none", cursor:"pointer",
              background: settings.is_enabled ? C.g2 : "rgba(255,255,255,0.12)",
              position:"relative", transition:"background 0.25s"
            }}>
            <span style={{
              position:"absolute", top:3, borderRadius:9,
              width:18, height:18, background:"#fff",
              left: settings.is_enabled ? 21 : 3,
              transition:"left 0.2s", display:"block"
            }}/>
          </button>
        </div>
        <button
          onClick={()=>setExpanded(p=>!p)}
          style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:C.muted,borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:10,marginLeft:4}}>
          {expanded?"▲ Collapse":"▼ Configure"}
        </button>
      </div>

      {expanded && (
        <div style={{opacity: settings.is_enabled ? 1 : 0.38, pointerEvents: settings.is_enabled ? "auto" : "none", transition:"opacity 0.2s"}}>

          {/* ── CHANNEL + TIME + TIMEZONE ─────────────────────────────── */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Delivery Channel</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              {CHANNELS.map(ch=>(
                <button key={ch.id}
                  disabled={ch.id==="whatsapp"}
                  onClick={()=>{ if(ch.id==="push"&&!pushGranted){ handlePushRequest(); return; } upd("channel",ch.id); }}
                  style={{
                    padding:"8px 14px",borderRadius:10,cursor:ch.id==="whatsapp"?"not-allowed":"pointer",
                    border:`1px solid ${settings.channel===ch.id?C.g3:"rgba(255,255,255,0.1)"}`,
                    background:settings.channel===ch.id?"rgba(107,179,63,0.12)":"rgba(255,255,255,0.03)",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:90,
                    opacity:ch.id==="whatsapp"?0.4:1,transition:"all 0.15s"
                  }}>
                  <span style={{fontSize:18}}>{ch.icon}</span>
                  <span style={{fontSize:10,fontWeight:700,color:settings.channel===ch.id?C.g3:"#fff"}}>{ch.label}</span>
                  <span style={{fontSize:8,color:C.muted}}>{ch.note}</span>
                  {ch.id==="push"&&pushPending&&<span style={{fontSize:8,color:C.gold}}>Requesting…</span>}
                  {ch.id==="push"&&pushGranted&&!pushPending&&<span style={{fontSize:8,color:C.g3}}>✓ Enabled</span>}
                </button>
              ))}
            </div>

            {/* PWA PUSH INFO BOX */}
            {settings.channel==="push"&&(
              <div style={{background:"rgba(107,179,63,0.06)",border:"1px solid rgba(107,179,63,0.2)",borderRadius:10,padding:"10px 14px",marginBottom:12}}>
                <div style={{fontSize:9,fontWeight:700,color:C.g3,marginBottom:6}}>📲 How Browser Push Works</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {[
                    ["Android Chrome / Edge","✅ Works from browser tab — no home screen install needed"],
                    ["iOS Safari 16.4+","⚠️ Requires Add to Home Screen first — then works identically to native"],
                    ["Desktop Chrome / Firefox","✅ Works as desktop notification in system tray"],
                    ["iOS Safari < 16.4","❌ Not supported — use Email channel instead"],
                  ].map(([platform, status])=>(
                    <div key={platform} style={{display:"flex",gap:10,alignItems:"center",fontSize:8.5}}>
                      <span style={{minWidth:160,color:"rgba(255,255,255,0.55)"}}>{platform}</span>
                      <span style={{color: status.startsWith("✅")?C.g3 : status.startsWith("⚠️")?C.gold:"#f87171"}}>{status}</span>
                    </div>
                  ))}
                </div>
                {!pushGranted&&(
                  <button onClick={handlePushRequest} disabled={pushPending}
                    style={{marginTop:10,padding:"6px 16px",borderRadius:8,background:`linear-gradient(135deg,${C.g1},${C.g2})`,border:"none",color:"#fff",fontWeight:700,fontSize:9,cursor:"pointer",opacity:pushPending?0.7:1}}>
                    {pushPending?"Requesting permission…":"Enable Browser Push Now"}
                  </button>
                )}
                {pushGranted&&<div style={{marginTop:8,fontSize:8.5,color:C.g3,fontWeight:600}}>✅ Browser push enabled — notifications will appear in your shutter</div>}
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <div style={{fontSize:9,color:C.muted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8}}>Reminder Time</div>
                <input
                  type="time"
                  value={settings.reminder_time}
                  onChange={e=>upd("reminder_time",e.target.value)}
                  style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",borderRadius:8,padding:"7px 10px",fontSize:13,fontWeight:700,outline:"none",cursor:"pointer"}}
                />
                <div style={{fontSize:8,color:C.muted,marginTop:3}}>Daily challenge reminder fires at this time</div>
              </div>
              <div>
                <div style={{fontSize:9,color:C.muted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8}}>Timezone</div>
                <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"7px 10px",fontSize:11,color:"rgba(255,255,255,0.7)"}}>
                  {settings.timezone}
                </div>
                <div style={{fontSize:8,color:C.muted,marginTop:3}}>Auto-detected from your browser</div>
              </div>
            </div>
          </div>

          {/* ── REMINDER TYPE TOGGLES ─────────────────────────────────── */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Which Reminders to Receive</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {REMINDER_TYPES.map(rt=>(
                <div key={rt.key} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",background:"rgba(255,255,255,0.03)",borderRadius:8,border:`1px solid ${settings[rt.key]?"rgba(107,179,63,0.2)":"rgba(255,255,255,0.06)"}`}}>
                  <span style={{fontSize:16,flexShrink:0}}>{rt.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,fontWeight:700,color:settings[rt.key]?"#fff":"rgba(255,255,255,0.4)"}}>{rt.label}</div>
                    <div style={{fontSize:8,color:C.muted,marginTop:1}}>{rt.sub}</div>
                  </div>
                  <button
                    onClick={()=>upd(rt.key,!settings[rt.key])}
                    style={{
                      width:36,height:20,borderRadius:10,border:"none",cursor:"pointer",flexShrink:0,
                      background:settings[rt.key]?C.g2:"rgba(255,255,255,0.1)",
                      position:"relative",transition:"background 0.2s"
                    }}>
                    <span style={{
                      position:"absolute",top:2,width:16,height:16,borderRadius:8,background:"#fff",
                      left:settings[rt.key]?18:2,transition:"left 0.18s",display:"block"
                    }}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── SNOOZE CONTROLS ───────────────────────────────────────── */}
          <div style={{marginBottom:16,padding:"10px 14px",background:"rgba(255,255,255,0.025)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"#fff"}}>⏸ Snooze All Reminders</div>
                <div style={{fontSize:8,color:C.muted,marginTop:2}}>
                  {isSnoozing ? `Snoozed until ${snoozeEnds}` : "Temporarily pause all notifications"}
                </div>
              </div>
              {isSnoozing&&(
                <button onClick={()=>upd("snooze_until",null)}
                  style={{background:"rgba(240,80,80,0.15)",border:"1px solid rgba(240,80,80,0.3)",color:"#f87171",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:9}}>
                  Cancel Snooze
                </button>
              )}
            </div>
            {!isSnoozing&&(
              <div style={{display:"flex",gap:6}}>
                {[["24h","24 hours",24],["48h","2 days",48],["7d","1 week",168]].map(([lbl,tip,hrs])=>(
                  <button key={lbl} onClick={()=>handleSnooze(hrs)}
                    style={{padding:"5px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.55)",cursor:"pointer",fontSize:10,transition:"all 0.15s"}}>
                    {lbl} <span style={{fontSize:8,color:C.muted,marginLeft:2}}>{tip}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── SAVE BUTTON ───────────────────────────────────────────── */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <button onClick={handleSave}
              style={{
                padding:"9px 28px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,
                background:saved?C.g2:`linear-gradient(135deg,${C.g1},${C.g2})`,
                color:"#fff",transition:"all 0.2s"
              }}>
              {saved ? "✓ Saved!" : "Save Preferences"}
            </button>
            <div style={{fontSize:9,color:C.muted}}>
              Preferences saved to your account · Applied across all devices
            </div>
          </div>

          {/* ── REMINDER HISTORY ─────────────────────────────────────── */}
          <div>
            <button
              onClick={()=>setActiveHistory(p=>!p)}
              style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:9,fontWeight:600,textDecoration:"underline",padding:0,marginBottom:8}}>
              {activeHistory ? "▲ Hide reminder history" : "▼ Show last 10 reminders"}
            </button>
            {activeHistory&&(
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {REMINDER_HISTORY.map((r,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"28px 1fr 70px 80px 60px",alignItems:"center",gap:8,padding:"6px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8}}>
                    <span style={{fontSize:14,textAlign:"center"}}>{r.icon}</span>
                    <div>
                      <div style={{fontSize:9.5,color:"rgba(255,255,255,0.65)",fontWeight:600}}>{r.label}</div>
                      <div style={{fontSize:8,color:C.muted}}>{r.time}</div>
                    </div>
                    <span style={{fontSize:8,color:C.muted,textAlign:"center"}}>{r.channel}</span>
                    <div style={{fontSize:8,color:C.muted,textAlign:"center"}}/>
                    <span style={{
                      fontSize:8,fontWeight:700,textAlign:"right",color:r.statusCol,
                      background:r.statusCol+"18",borderRadius:4,padding:"1px 6px",whiteSpace:"nowrap"
                    }}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MY RESPONSES COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function MyResponses() {
  const [view, setView]               = useState("list");
  const [selectedForm, setSelectedForm] = useState(null);
  const [fillForm, setFillForm]         = useState(null);
  const [expandedKPI, setExpandedKPI]   = useState(null);
  const [activeTab, setActiveTab]       = useState("submitted");
  const [answers, setAnswers]           = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);

  const setAnswer = (qkey,val) => setAnswers(p=>({...p,[qkey]:val}));
  const totalQs = fillForm ? fillForm.kpisToFill.reduce((s,k)=>s+k.questions.length,0) : 0;
  const answeredQs = Object.keys(answers).length;
  const fillPct = totalQs > 0 ? Math.round((answeredQs/totalQs)*100) : 0;
  const canSubmit = answeredQs===totalQs && totalQs>0;

  const handleBack = () => {
    setView("list"); setSelectedForm(null); setFillForm(null);
    setAnswers({}); setSubmitted(false); setExpandedKPI(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r=>setTimeout(r,1400));
    setSubmitting(false); setSubmitted(true);
  };

  const RiskBadge = ({avg}) => {
    const r=riskLabel(avg), col=riskCol(avg);
    return <span style={{fontSize:7,fontWeight:700,background:`${col}18`,color:col,borderRadius:4,padding:"1px 6px"}}>{r.toUpperCase()}</span>;
  };

  const ScoreBar = ({score,color}) => (
    <div style={{flex:1,height:5,borderRadius:5,background:"rgba(255,255,255,0.07)"}}>
      <div style={{height:"100%",borderRadius:5,width:`${((score-1)/4)*100}%`,background:color,transition:"width 0.5s"}}/>
    </div>
  );

  const LikertPicker = ({qkey,reverse,value,onChange}) => (
    <div style={{display:"flex",gap:5}}>
      {[1,2,3,4,5].map(n=>{
        const final = reverse ? 6-n : n;
        const sel = value===n;
        const fc = final<=2?C.red:final===3?C.gold:C.g3;
        return(
          <button key={n} onClick={()=>onChange(n)} style={{
            width:40,height:40,borderRadius:9,border:`2px solid ${sel?fc:"rgba(255,255,255,0.1)"}`,
            background:sel?`${fc}22`:"rgba(255,255,255,0.03)",
            color:sel?fc:"rgba(255,255,255,0.35)",
            fontSize:14,fontWeight:sel?900:400,cursor:"pointer",transition:"all 0.15s",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0
          }}>
            <span style={{lineHeight:1}}>{n}</span>
            <span style={{fontSize:5.5,lineHeight:1,color:"rgba(255,255,255,0.3)"}}>
              {!reverse?(n===1?"Poor":n===5?"Best":""):(n===1?"Best":n===5?"Worst":"")}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ── SUBMITTED FORM DETAIL VIEW ──────────────────────────────────────────────
  if(view==="detail" && selectedForm){
    const wi = computeWI(Object.fromEntries(selectedForm.kpis.map(k=>[k.key,k.avgScore])));
    const wiBand = wi>=80?"Excellent":wi>=60?"Good":wi>=40?"Moderate":"Needs Attention";
    const wiCol  = wi>=80?C.g3:wi>=60?"#97C95C":wi>=40?C.gold:C.red;
    return(
      <div>
        <button onClick={handleBack} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:10,marginBottom:14,padding:0}}>
          ← Back to My Responses
        </button>
        {/* Header card */}
        <div style={{background:`linear-gradient(135deg,${C.g1},${C.g2})`,borderRadius:14,padding:"18px 20px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:8.5,color:"rgba(255,255,255,0.5)",marginBottom:3,textTransform:"uppercase",letterSpacing:0.8}}>
                {selectedForm.theme} · {selectedForm.weekLabel}
              </div>
              <div style={{fontSize:16,fontWeight:800,color:"#fff",marginBottom:2}}>Wellness Check-in</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>Submitted {selectedForm.submittedAt}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.45)",marginBottom:2}}>Wellness Index</div>
              <div style={{fontSize:40,fontWeight:900,color:"#fff",lineHeight:1}}>{wi}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.55)",marginTop:2}}>{wiBand}</div>
            </div>
          </div>
          <div style={{marginTop:12,height:6,borderRadius:6,background:"rgba(255,255,255,0.15)"}}>
            <div style={{height:"100%",borderRadius:6,width:`${wi}%`,background:"rgba(255,255,255,0.85)",transition:"width 0.8s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:7,color:"rgba(255,255,255,0.4)"}}>
            <span>0</span><span>40 Moderate</span><span>60 Good</span><span>80 Excellent</span><span>100</span>
          </div>
        </div>
        {/* KPI cards — expandable */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:14}}>
          {selectedForm.kpis.map(k=>{
            const isExp = expandedKPI===k.key;
            return(
              <div key={k.key} style={{background:"rgba(255,255,255,0.025)",borderRadius:12,
                border:`1px solid ${isExp?k.color+"55":C.border}`,overflow:"hidden",
                cursor:"pointer",transition:"border-color 0.2s"}}
                onClick={()=>setExpandedKPI(isExp?null:k.key)}>
                <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>{k.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{k.label}</span>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <RiskBadge avg={k.avgScore}/>
                        <span style={{fontSize:14,fontWeight:800,color:k.color}}>{k.avgScore.toFixed(2)}</span>
                        <span style={{fontSize:8,color:C.muted}}>/5</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <ScoreBar score={k.avgScore} color={k.color}/>
                      <span style={{fontSize:8,color:C.muted}}>{Math.round(((k.avgScore-1)/4)*100)}%</span>
                    </div>
                  </div>
                  <span style={{fontSize:10,color:C.muted}}>{isExp?"▲":"▼"}</span>
                </div>
                {isExp && (
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"10px 14px",background:"rgba(0,0,0,0.15)"}}>
                    <div style={{fontSize:8,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Per-Question Scores</div>
                    {k.questions.map((q,qi)=>{
                      const fc = q.final<=2?C.red:q.final===3?C.gold:C.g3;
                      return(
                        <div key={q.key} style={{marginBottom:9}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,gap:8}}>
                            <span style={{fontSize:8.5,color:"rgba(255,255,255,0.5)",lineHeight:1.4,flex:1}}>Q{qi+1}. {q.label}</span>
                            <div style={{flexShrink:0,textAlign:"right"}}>
                              <span style={{fontSize:13,fontWeight:800,color:fc}}>{q.final}</span>
                              <span style={{fontSize:8,color:C.muted}}>/5</span>
                              {q.reverse && <div style={{fontSize:6.5,color:"rgba(255,255,255,0.2)"}}>reverse</div>}
                            </div>
                          </div>
                          <div style={{display:"flex",gap:2,marginBottom:2}}>
                            {[1,2,3,4,5].map(n=>(
                              <div key={n} style={{flex:1,height:5,borderRadius:2,
                                background:n<=q.final?fc:"rgba(255,255,255,0.07)",transition:"background 0.3s"}}/>
                            ))}
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:7,color:"rgba(255,255,255,0.2)"}}>
                            <span>Raw answered: {q.raw}</span>
                            <span>Final score: {q.final}{q.reverse?` (6−${q.raw}=${q.final})`:""}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:5,marginTop:3,fontSize:7.5,color:"rgba(255,255,255,0.25)",fontFamily:"monospace"}}>
                      KPI avg = ({k.questions.map(q=>q.final).join("+")})/{ k.questions.length} = {k.avgScore.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* WI breakdown */}
        <div style={{background:"rgba(107,179,63,0.04)",border:"1px solid rgba(107,179,63,0.12)",borderRadius:12,padding:"14px 16px"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.g3,marginBottom:10}}>
            📊 Wellness Index Breakdown
            <span style={{fontSize:8,color:C.muted,fontWeight:400,marginLeft:6}}>
              Formula: Σ[(KPI score − 1) / 4 × weight] × 100
            </span>
          </div>
          {(()=>{
            const KW={SLEEP_KPI:0.20,STRESS_KPI:0.15,NUTRITION_KPI:0.15,HYDRATION_KPI:0.10,ACTIVITY_KPI:0.10,DIGESTION_KPI:0.10,PAIN_KPI:0.10,ENERGY_KPI:0.10};
            return selectedForm.kpis.map(k=>{
              const w=KW[k.key]||0; if(!w)return null;
              const norm=((k.avgScore-1)/4);
              const contrib=norm*w*100;
              return(
                <div key={k.key} style={{display:"grid",gridTemplateColumns:"18px 90px 1fr 90px 50px 60px",alignItems:"center",gap:8,marginBottom:5}}>
                  <span style={{fontSize:11}}>{k.icon}</span>
                  <span style={{fontSize:8,color:"rgba(255,255,255,0.45)"}}>{k.label}</span>
                  <div style={{height:4,borderRadius:4,background:"rgba(255,255,255,0.06)"}}>
                    <div style={{height:"100%",borderRadius:4,width:`${norm*100}%`,background:k.color}}/>
                  </div>
                  <span style={{fontSize:7.5,color:C.muted,textAlign:"center",fontFamily:"monospace"}}>
                    {k.avgScore.toFixed(2)}→{(norm*100).toFixed(0)}%
                  </span>
                  <span style={{fontSize:7.5,color:C.muted,textAlign:"center"}}>×{(w*100).toFixed(0)}%</span>
                  <span style={{fontSize:9,fontWeight:700,color:k.color,textAlign:"right"}}>+{contrib.toFixed(1)}</span>
                </div>
              );
            });
          })()}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:6,marginTop:4,
            display:"flex",justifyContent:"flex-end",alignItems:"center",gap:8}}>
            <span style={{fontSize:8.5,color:C.muted}}>Wellness Index =</span>
            <span style={{fontSize:24,fontWeight:900,color:C.g3}}>{wi}</span>
            <span style={{fontSize:9,color:C.muted}}>/ 100</span>
          </div>
        </div>
      </div>
    );
  }

  // ── FILL FORM VIEW ──────────────────────────────────────────────────────────
  if(view==="fill" && fillForm){
    if(submitted){
      return(
        <div style={{textAlign:"center",padding:"48px 20px"}}>
          <div style={{fontSize:52,marginBottom:14}}>✅</div>
          <div style={{fontSize:20,fontWeight:800,color:C.g3,marginBottom:6}}>Form Submitted!</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:4}}>{fillForm.theme} · {fillForm.weekLabel}</div>
          <div style={{fontSize:9.5,color:C.muted,maxWidth:340,margin:"0 auto 22px",lineHeight:1.6}}>
            Your KPI scores are being computed. Wellness Index and personalised suggestions will appear in My Wellness within moments.
          </div>
          <button onClick={handleBack} style={{padding:"10px 28px",borderRadius:10,background:`linear-gradient(135deg,${C.g1},${C.g2})`,border:"none",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>
            Back to My Responses
          </button>
        </div>
      );
    }
    return(
      <div>
        {/* Progress header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <button onClick={handleBack} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:10,padding:0,flexShrink:0}}>← Cancel</button>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:8.5,color:C.muted,marginBottom:4}}>
              <span>{fillForm.theme} · {fillForm.weekLabel}</span>
              <span>{answeredQs}/{totalQs} answered · {fillPct}%</span>
            </div>
            <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,0.07)"}}>
              <div style={{height:"100%",borderRadius:5,width:`${fillPct}%`,background:`linear-gradient(90deg,${C.g2},${C.g3})`,transition:"width 0.4s"}}/>
            </div>
          </div>
        </div>
        {/* Overdue banner */}
        {fillForm.isOverdue && (
          <div style={{background:"rgba(224,80,80,0.08)",border:"1px solid rgba(224,80,80,0.25)",borderRadius:9,padding:"7px 14px",marginBottom:12,fontSize:9,color:"#f87171"}}>
            ⚠️ This form was due on <strong>{fillForm.dueDate}</strong> — please submit immediately.
          </div>
        )}
        {/* Form description */}
        <div style={{background:"rgba(255,255,255,0.02)",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:4}}>{fillForm.theme} — Wellness Assessment</div>
          <div style={{fontSize:9,color:C.muted,lineHeight:1.5,marginBottom:8}}>{fillForm.description}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {fillForm.kpisToFill.map(k=>(
              <span key={k.key} style={{fontSize:8,background:`${k.color}18`,color:k.color,borderRadius:5,padding:"2px 8px",fontWeight:600}}>
                {k.icon} {k.label}
              </span>
            ))}
          </div>
        </div>
        {/* Questions by KPI */}
        {fillForm.kpisToFill.map((kpi,ki)=>(
          <div key={kpi.key} style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"8px 12px",background:`${kpi.color}0e`,borderRadius:9,border:`1px solid ${kpi.color}22`}}>
              <span style={{fontSize:18}}>{kpi.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:kpi.color}}>{kpi.label}</div>
                <div style={{fontSize:7.5,color:C.muted}}>
                  {kpi.questions.filter(q=>answers[q.key]!==undefined).length}/{kpi.questions.length} answered
                </div>
              </div>
              <span style={{fontSize:9,color:C.muted}}>{ki+1}/{fillForm.kpisToFill.length}</span>
            </div>
            {kpi.questions.map((q,qi)=>{
              const answered = answers[q.key]!==undefined;
              return(
                <div key={q.key} style={{background:"rgba(255,255,255,0.02)",borderRadius:10,padding:"12px 14px",marginBottom:8,border:`1px solid ${answered?kpi.color+"44":"rgba(255,255,255,0.06)"}`,transition:"border-color 0.2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8}}>
                    <span style={{flex:1,fontSize:10,color:answered?"#fff":"rgba(255,255,255,0.65)",lineHeight:1.45,fontWeight:answered?600:400}}>
                      <span style={{color:"rgba(255,255,255,0.3)",marginRight:4}}>Q{qi+1}.</span>{q.label}
                    </span>
                    {answered&&<span style={{flexShrink:0,fontSize:8,background:`${kpi.color}18`,color:kpi.color,borderRadius:5,padding:"1px 7px",fontWeight:700}}>✓ {answers[q.key]}/5</span>}
                  </div>
                  <LikertPicker qkey={q.key} reverse={q.reverse} value={answers[q.key]} onChange={v=>setAnswer(q.key,v)}/>
                  {q.reverse && <div style={{fontSize:7.5,color:"rgba(255,255,255,0.2)",marginTop:5}}>↩ Reverse scored — 1 = best outcome for this question</div>}
                </div>
              );
            })}
          </div>
        ))}
        {/* Sticky submit bar */}
        <div style={{position:"sticky",bottom:0,background:C.bg,borderTop:"1px solid rgba(255,255,255,0.06)",padding:"12px 0 4px",marginTop:6}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,fontSize:8.5,color:canSubmit?C.g3:C.muted,fontWeight:canSubmit?600:400}}>
              {canSubmit?"✓ All questions answered — ready to submit!":
                `${totalQs-answeredQs} question${totalQs-answeredQs!==1?"s":""} remaining`}
            </div>
            <button disabled={!canSubmit||submitting} onClick={handleSubmit}
              style={{padding:"11px 28px",borderRadius:10,border:"none",fontWeight:700,fontSize:12,
                cursor:canSubmit&&!submitting?"pointer":"not-allowed",
                background:canSubmit?`linear-gradient(135deg,${C.g1},${C.g2})`:"rgba(255,255,255,0.06)",
                color:canSubmit?"#fff":"rgba(255,255,255,0.25)",transition:"all 0.2s",opacity:submitting?0.7:1}}>
              {submitting?"Submitting…":"Submit Form"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW (default) ─────────────────────────────────────────────────────
  const pendingOverdue = MOCK_PENDING_FORMS.filter(f=>f.isOverdue).length;
  const allWIs = MOCK_SUBMITTED_FORMS.map(f=>computeWI(Object.fromEntries(f.kpis.map(k=>[k.key,k.avgScore]))));
  const avgWI  = allWIs.length ? +(allWIs.reduce((a,b)=>a+b,0)/allWIs.length).toFixed(1) : 0;

  return(
    <div>
      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[
          ["📋","Forms Submitted",MOCK_SUBMITTED_FORMS.length,"Total completed",C.g3],
          ["⏳","Pending",MOCK_PENDING_FORMS.length,"Awaiting response",pendingOverdue>0?C.red:C.gold],
          ["⚠️","Overdue",pendingOverdue,"Submit immediately",pendingOverdue>0?C.red:C.muted],
          ["📈","Avg WI Score",avgWI,"Across submissions",C.g3],
        ].map(([icon,lbl,val,sub,col])=>(
          <div key={lbl} style={{background:"rgba(255,255,255,0.025)",borderRadius:12,padding:"12px 14px",border:`1px solid ${col}22`}}>
            <div style={{fontSize:18,marginBottom:3}}>{icon}</div>
            <div style={{fontSize:8.5,color:C.muted,marginBottom:2}}>{lbl}</div>
            <div style={{fontSize:20,fontWeight:800,color:col}}>{val}</div>
            <div style={{fontSize:7.5,color:"rgba(255,255,255,0.22)",marginTop:2}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div style={{display:"flex",gap:4,background:"rgba(0,0,0,0.3)",borderRadius:10,padding:3,marginBottom:14,width:"fit-content"}}>
        {[["submitted","✅ Submitted",MOCK_SUBMITTED_FORMS.length],["pending","⏳ Pending",MOCK_PENDING_FORMS.length]].map(([id,label,cnt])=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{padding:"6px 16px",borderRadius:7,border:"none",fontSize:10,fontWeight:600,cursor:"pointer",
              background:activeTab===id?`linear-gradient(135deg,${C.g1},${C.g2})`:"transparent",
              color:activeTab===id?"#fff":"rgba(255,255,255,0.4)",transition:"all 0.2s",
              display:"flex",alignItems:"center",gap:5}}>
            {label}
            <span style={{fontSize:8,background:"rgba(255,255,255,0.15)",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{cnt}</span>
          </button>
        ))}
      </div>

      {/* Submitted list */}
      {activeTab==="submitted" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {MOCK_SUBMITTED_FORMS.map(form=>{
            const wi=computeWI(Object.fromEntries(form.kpis.map(k=>[k.key,k.avgScore])));
            const wiBand=wi>=80?"Excellent":wi>=60?"Good":wi>=40?"Moderate":"Needs Attention";
            const wiCol=wi>=80?C.g3:wi>=60?"#97C95C":wi>=40?C.gold:C.red;
            return(
              <div key={form.id}
                onClick={()=>{setSelectedForm(form);setView("detail");}}
                style={{background:"rgba(255,255,255,0.025)",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",padding:"14px 16px",cursor:"pointer",transition:"border-color 0.2s",display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"center"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.g3+"44"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                    <span style={{fontSize:8,background:"rgba(107,179,63,0.15)",color:C.g3,borderRadius:5,padding:"1px 7px",fontWeight:700}}>✅ SUBMITTED</span>
                    <span style={{fontSize:8.5,color:C.muted}}>{form.theme} · {form.weekLabel}</span>
                    <span style={{fontSize:8,color:"rgba(255,255,255,0.3)"}}>· {form.submittedAt}</span>
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                    {form.kpis.map(k=>(
                      <span key={k.key} style={{fontSize:7.5,background:`${k.color}12`,color:k.color,borderRadius:5,padding:"2px 7px",display:"flex",alignItems:"center",gap:3}}>
                        {k.icon} {k.label} <span style={{fontWeight:700}}>{k.avgScore.toFixed(1)}</span>
                        <RiskBadge avg={k.avgScore}/>
                      </span>
                    ))}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:8,color:C.muted,whiteSpace:"nowrap"}}>WI</span>
                    <div style={{flex:1,height:4,borderRadius:4,background:"rgba(255,255,255,0.07)"}}>
                      <div style={{height:"100%",borderRadius:4,width:`${wi}%`,background:`linear-gradient(90deg,${C.g2},${wiCol})`}}/>
                    </div>
                    <span style={{fontSize:13,fontWeight:800,color:wiCol}}>{wi}</span>
                    <span style={{fontSize:8,color:C.muted}}>{wiBand}</span>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:30,fontWeight:900,color:wiCol,lineHeight:1}}>{wi}</div>
                  <div style={{fontSize:7.5,color:C.muted,marginTop:3}}>Tap to expand →</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pending list */}
      {activeTab==="pending" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {MOCK_PENDING_FORMS.length===0 && (
            <div style={{textAlign:"center",padding:"48px 0",color:C.muted}}>
              <div style={{fontSize:36,marginBottom:10}}>🎉</div>
              <div style={{fontSize:13}}>All forms submitted — you're up to date!</div>
            </div>
          )}
          {MOCK_PENDING_FORMS.map(form=>(
            <div key={form.id}
              style={{background:"rgba(255,255,255,0.025)",borderRadius:12,border:`1px solid ${form.isOverdue?"rgba(224,80,80,0.3)":"rgba(232,160,32,0.2)"}`,padding:"14px 16px",cursor:"pointer",transition:"all 0.2s"}}
              onClick={()=>{setFillForm(form);setAnswers({});setView("fill");}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=form.isOverdue?C.red:C.gold}
              onMouseLeave={e=>e.currentTarget.style.borderColor=form.isOverdue?"rgba(224,80,80,0.3)":"rgba(232,160,32,0.2)"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:8,fontWeight:700,background:form.isOverdue?"rgba(224,80,80,0.15)":"rgba(232,160,32,0.15)",color:form.isOverdue?C.red:C.gold,borderRadius:5,padding:"1px 8px"}}>
                    {form.isOverdue?"⚠️ OVERDUE":"⏳ PENDING"}
                  </span>
                  <span style={{fontSize:8.5,color:C.muted}}>{form.theme} · {form.weekLabel}</span>
                </div>
                <span style={{fontSize:8,color:form.isOverdue?C.red:C.muted}}>Due {form.dueDate}</span>
              </div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",marginBottom:10,lineHeight:1.5}}>{form.description}</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                {form.kpisToFill.map(k=>(
                  <span key={k.key} style={{fontSize:7.5,background:`${k.color}12`,color:k.color,borderRadius:5,padding:"2px 7px"}}>
                    {k.icon} {k.label} · {k.questions.length}Qs
                  </span>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:8.5,color:C.muted}}>
                  {form.kpisToFill.reduce((s,k)=>s+k.questions.length,0)} questions · ~5 min
                </span>
                <button onClick={e=>{e.stopPropagation();setFillForm(form);setAnswers({});setView("fill");}}
                  style={{padding:"7px 18px",borderRadius:9,border:"none",fontWeight:700,fontSize:10,cursor:"pointer",color:"#fff",
                    background:form.isOverdue?`linear-gradient(135deg,#991B1B,${C.red})`:`linear-gradient(135deg,${C.g1},${C.g2})`}}>
                  {form.isOverdue?"Submit Now →":"Fill Form →"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HR ANALYTICS DASHBOARD ───────────────────────────────────────────────────
function HRDashboard(){
  const [fD,setFD]=useState("All");const [fL,setFL]=useState("All");const [fA,setFA]=useState("All");const [fG,setFG]=useState("All");
  const [cxo,setCxo]=useState("productivity"),[well,setWell]=useState("wellnessIndex");
  const filtered=HR_ROWS.filter(r=>(fD==="All"||r.dept===fD)&&(fL==="All"||r.loc===fL)&&(fA==="All"||r.age===fA)&&(fG==="All"||r.gender===fG));
  const avg=m=>+(filtered.reduce((s,r)=>s+r[m],0)/Math.max(filtered.length,1)).toFixed(1);
  const agg=(key,m)=>{const mp={};filtered.forEach(r=>{if(!mp[r[key]])mp[r[key]]=[];mp[r[key]].push(r[m]);});return Object.entries(mp).map(([k,v])=>({l:k,v:+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1)}));};

  const Sel=({label,value,onChange,opts})=>(
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <label style={{fontSize:8,color:C.muted,textTransform:"uppercase",letterSpacing:0.8}}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",padding:"5px 10px",borderRadius:8,fontSize:11,cursor:"pointer"}}>
        <option value="All">All</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  const Toggle=({options,value,onChange,colors})=>(
    <div style={{display:"flex",gap:3,background:"rgba(0,0,0,0.3)",borderRadius:8,padding:3,flexWrap:"wrap"}}>
      {options.map((o,i)=>(
        <button key={o} onClick={()=>onChange(o)} style={{padding:"4px 10px",borderRadius:6,border:"none",fontSize:9,fontWeight:600,cursor:"pointer",background:value===o?(colors?colors[i]:C.g3):"transparent",color:value===o?"#fff":"rgba(255,255,255,0.4)",transition:"all 0.2s"}}>
          {o.charAt(0).toUpperCase()+o.slice(1)}
        </button>
      ))}
    </div>
  );

  return(
    <div>
      {/* FILTERS */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px 16px",marginBottom:18,alignItems:"flex-end"}}>
        <Sel label="Department" value={fD} onChange={setFD} opts={DEPTS}/>
        <Sel label="Location"   value={fL} onChange={setFL} opts={LOCATIONS}/>
        <Sel label="Age Band"   value={fA} onChange={setFA} opts={AGE_BANDS}/>
        <Sel label="Gender"     value={fG} onChange={setFG} opts={GENDERS}/>
        <div style={{marginLeft:"auto",fontSize:11,color:C.muted}}>
          <span style={{color:C.g3,fontWeight:700,fontSize:16}}>{filtered.length}</span> employees selected
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(148px,1fr))",gap:10,marginBottom:18}}>
        {[["🌿","Avg Wellness",avg("wellnessIndex"),"/ 100",C.g3],["🎯","Productivity",avg("productivity")+"%","self-reported",C.blue],["💬","Engagement",avg("engagement")+"%","Gallup Q12",C.purple],["📅","Absenteeism",avg("absenteeism")+" d","per month",C.red],["🌙","Sleep Score",avg("sleep"),"out of 5",C.purple],["🧘","Stress Score",avg("stress"),"lower is better",C.orange]].map(([icon,lbl,val,sub,col])=>(
          <Card key={lbl} color={col+"33"} style={{padding:"12px 14px"}}>
            <div style={{fontSize:20,marginBottom:3}}>{icon}</div>
            <div style={{fontSize:9,color:C.muted,marginBottom:2}}>{lbl}</div>
            <div style={{fontSize:20,fontWeight:800,color:col}}>{val}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.28)"}}>{sub}</div>
          </Card>
        ))}
      </div>

      {/* CHART ROW */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700}}>Wellness by Dimension</div>
            <Toggle options={["wellnessIndex","sleep","stress","nutrition"]} value={well} onChange={setWell} colors={[C.g3,C.purple,C.orange,"#22c55e"]}/>
          </div>
          <div style={{fontSize:9,color:C.muted,marginBottom:6}}>By Department</div>
          <BarChart data={agg("dept",well)} color={C.g3} h={75}/>
          <div style={{fontSize:9,color:C.muted,marginTop:12,marginBottom:6}}>By Location</div>
          <BarChart data={agg("loc",well)} color={C.teal} h={75}/>
        </Card>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700}}>CXO Performance Metrics</div>
            <Toggle options={["productivity","engagement","absenteeism"]} value={cxo} onChange={setCxo} colors={[C.blue,C.orange,C.red]}/>
          </div>
          <div style={{fontSize:9,color:C.muted,marginBottom:6}}>By Department</div>
          <BarChart data={agg("dept",cxo)} color={C.blue} h={75}/>
          <div style={{fontSize:9,color:C.muted,marginTop:12,marginBottom:6}}>By Age Band</div>
          <BarChart data={agg("age",cxo)} color={C.purple} h={75}/>
        </Card>
      </div>

      {/* GENDER BREAKDOWN + SCATTER */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card>
          <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Gender-wise Wellness & Productivity</div>
          {["Male","Female","Other"].map((g,i)=>{
            const rows=filtered.filter(r=>r.gender===g);
            if(!rows.length)return null;
            const wi=+(rows.reduce((s,r)=>s+r.wellnessIndex,0)/rows.length).toFixed(1);
            const pr=+(rows.reduce((s,r)=>s+r.productivity,0)/rows.length).toFixed(1);
            const cols=["#38bdf8","#f472b6","#a3e635"];
            return(
              <div key={g} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:cols[i],fontWeight:600}}>{g}</span>
                  <span style={{fontSize:10,color:C.muted}}>Wellness: <b style={{color:cols[i]}}>{wi}</b> | Productivity: <b style={{color:cols[i]}}>{pr}%</b></span>
                </div>
                <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,0.06)"}}>
                  <div style={{height:"100%",width:`${wi}%`,borderRadius:5,background:`linear-gradient(90deg,${cols[i]},${cols[i]}88)`}}/>
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Wellness ↔ Productivity Correlation</div>
          <div style={{fontSize:9,color:C.muted,marginBottom:6}}>Each bubble = dept avg · size = headcount</div>
          <svg width="100%" height={130} viewBox="0 0 300 130">
            {DEPTS.map((d,i)=>{
              const rows=filtered.filter(r=>r.dept===d);
              if(!rows.length)return null;
              const wi=rows.reduce((s,r)=>s+r.wellnessIndex,0)/rows.length;
              const pr=rows.reduce((s,r)=>s+r.productivity,0)/rows.length;
              const cols=[C.blue,"#22c55e",C.orange,C.teal,C.pink,C.gold];
              const x=20+(wi/100)*260,y=120-(pr/100)*110;
              return <g key={d}><circle cx={x} cy={y} r={Math.sqrt(rows.length)*1.6+4} fill={cols[i]} opacity="0.5"/>
                <text x={x} y={y+3.5} textAnchor="middle" fontSize="7" fill="#fff">{d.slice(0,3)}</text></g>;
            })}
            <line x1="20" y1="120" x2="280" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
            <line x1="20" y1="10"  x2="20"  y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
            <text x="150" y="129" textAnchor="middle" fontSize="7.5" fill={C.muted}>Wellness Index →</text>
          </svg>
        </Card>
      </div>

      {/* HEATMAP */}
      <Card>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>📊 Location × Department Wellness Heatmap</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:400}}>
            <thead>
              <tr>
                <th style={{padding:"8px 12px",fontSize:9,color:C.muted,textAlign:"left"}}>↓ Location / Dept →</th>
                {DEPTS.map(d=><th key={d} style={{padding:"8px 8px",fontSize:9,color:C.muted,fontWeight:600,textAlign:"center"}}>{d.slice(0,6)}</th>)}
              </tr>
            </thead>
            <tbody>
              {LOCATIONS.map(loc=>(
                <tr key={loc}>
                  <td style={{padding:"6px 12px",fontSize:10,color:"rgba(255,255,255,0.5)",fontWeight:600}}>{loc}</td>
                  {DEPTS.map(dept=>{
                    const rows=HR_ROWS.filter(r=>r.loc===loc&&r.dept===dept);
                    const wi=rows.length?+(rows.reduce((s,r)=>s+r.wellnessIndex,0)/rows.length).toFixed(0):null;
                    if(!wi)return <td key={dept} style={{padding:"4px 8px"}}><div style={{background:"rgba(255,255,255,0.03)",borderRadius:6,padding:"3px 0",textAlign:"center",fontSize:9,color:"rgba(255,255,255,0.15)"}}>—</div></td>;
                    const inten=Math.max(0,(wi-50)/40);
                    return <td key={dept} style={{padding:"4px 8px",textAlign:"center"}}>
                      <div style={{background:`rgba(107,179,63,${inten*0.65+0.1})`,borderRadius:6,padding:"3px 0",fontSize:10,fontWeight:700,color:"#fff"}}>{wi}</div>
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// ROLE-BASED ADMIN PANEL
// Visible only to: super_admin | ayumonk_admin
// Production: role checked from JWT (company_users.role)
// Each section maps directly to a database table with full CRUD.
// ═══════════════════════════════════════════════════════════════════════════════
const ADMIN_ROLE = "ayumonk_admin"; // simulate; production: from JWT claims

// Simulated data for each entity
const ADMIN_DATA = {
  companies:[
    { id:1, name:"TechCorp Pvt Ltd",   industry:"IT",      size:"Medium",  employees:320, status:"active",  created:"Jan 2025" },
    { id:2, name:"RetailCo Ltd",        industry:"Retail",  size:"Large",   employees:850, status:"active",  created:"Feb 2025" },
    { id:3, name:"PharmaCorp",          industry:"Pharma",  size:"Medium",  employees:210, status:"active",  created:"Mar 2025" },
    { id:4, name:"StartupXYZ",          industry:"Tech",    size:"Small",   employees:45,  status:"trial",   created:"Apr 2025" },
  ],
  users:[
    { id:1, name:"Rahul Sharma",    email:"rahul@techcorp.com",   company:"TechCorp",   role:"employee",    dept:"Engineering", status:"active" },
    { id:2, name:"Priya Mehta",     email:"priya@techcorp.com",   company:"TechCorp",   role:"hr",          dept:"HR",          status:"active" },
    { id:3, name:"Ananya Singh",    email:"ananya@retailco.com",  company:"RetailCo",   role:"employee",    dept:"Marketing",   status:"active" },
    { id:4, name:"Karan Nair",      email:"karan@pharmaco.com",   company:"PharmaCorp", role:"cxo",         dept:"Leadership",  status:"active" },
    { id:5, name:"Sneha Iyer",      email:"sneha@startupxyz.com", company:"StartupXYZ", role:"hr",          dept:"Operations",  status:"inactive" },
  ],
  themes:[
    { key:"STRESS_RECOVERY",   name:"Stress & Recovery",    kpis:["Sleep","Stress","Emotional"],        companies:3, status:"active" },
    { key:"CORPORATE_VITALITY",name:"Corporate Vitality",   kpis:["Hydration","Activity","Energy"],     companies:2, status:"active" },
    { key:"METABOLISM_RESET",  name:"Metabolism Reset",     kpis:["Nutrition","Digestion","Activity"],  companies:1, status:"active" },
    { key:"MIND_MOOD",         name:"Mind & Mood",          kpis:["Emotional","Stress","Social"],       companies:0, status:"draft"  },
  ],
  questions:[
    { key:"SLEEP_Q1",   kpi:"SLEEP_KPI",     label:"How well do you fall asleep at night?",       type:"Likert 1–5", reverse:false, status:"active" },
    { key:"SLEEP_Q2",   kpi:"SLEEP_KPI",     label:"How many hours of sleep do you get?",         type:"Likert 1–5", reverse:false, status:"active" },
    { key:"STRESS_Q1",  kpi:"STRESS_KPI",    label:"How often do you feel overwhelmed at work?",  type:"Likert 1–5", reverse:true,  status:"active" },
    { key:"STRESS_Q2",  kpi:"STRESS_KPI",    label:"Does work stress affect your sleep?",         type:"Likert 1–5", reverse:false, status:"active" },
    { key:"HYDRATION_Q1",kpi:"HYDRATION_KPI",label:"How many glasses of water do you drink daily?",type:"Likert 1–5",reverse:false, status:"active" },
  ],
  challenges:[
    { id:1, label:"Hydration Mission",   kpi:"HYDRATION_KPI", type:"counter",  xp:20, status:"active",  companies:4 },
    { id:2, label:"Sleep Before 10PM",   kpi:"SLEEP_KPI",     type:"toggle",   xp:25, status:"active",  companies:4 },
    { id:3, label:"Move Your Body",      kpi:"ACTIVITY_KPI",  type:"choice",   xp:30, status:"active",  companies:3 },
    { id:4, label:"4-7-8 Breathing",     kpi:"STRESS_KPI",    type:"timer",    xp:20, status:"active",  companies:4 },
    { id:5, label:"Daily Mood Check",    kpi:"EMOTIONAL_KPI", type:"rating",   xp:10, status:"active",  companies:2 },
    { id:6, label:"Gratitude Journal",   kpi:"EMOTIONAL_KPI", type:"toggle",   xp:15, status:"draft",   companies:0 },
  ],
  suggestions:[
    { id:1, type:"aahar",   kpi:"SLEEP_KPI",  dosha:"all",   title:"Warm turmeric milk at bedtime",        trigger:"kpi_risk", status:"active" },
    { id:2, type:"vihar",   kpi:"SLEEP_KPI",  dosha:"vata",  title:"Digital detox from 9PM",               trigger:"kpi_risk", status:"active" },
    { id:3, type:"aushadh", kpi:"SLEEP_KPI",  dosha:"pitta", title:"Brahmi + Ashwagandha capsule",         trigger:"kpi_risk", status:"active" },
    { id:4, type:"aahar",   kpi:"STRESS_KPI", dosha:"all",   title:"Cut all caffeine after noon",          trigger:"question_score", status:"active" },
    { id:5, type:"vihar",   kpi:"STRESS_KPI", dosha:"pitta", title:"5-min Anulom Vilom morning",           trigger:"kpi_risk", status:"active" },
    { id:6, type:"aushadh", kpi:"STRESS_KPI", dosha:"all",   title:"Shankhpushpi syrup — 2 tsp twice daily",trigger:"kpi_risk",status:"draft"  },
  ],
  sessions:[
    { id:1, company:"TechCorp",   theme:"Stress & Recovery", startDate:"1 Feb 2025", endDate:"31 Oct 2025", status:"active",    employees:320 },
    { id:2, company:"TechCorp",   theme:"Metabolism Reset",   startDate:"1 Apr 2025", endDate:"30 Jun 2025", status:"completed", employees:118 },
    { id:3, company:"RetailCo",   theme:"Corporate Vitality", startDate:"1 Jun 2025", endDate:"31 Dec 2025", status:"active",    employees:850 },
    { id:4, company:"PharmaCorp", theme:"Stress & Recovery",  startDate:"1 Jan 2025", endDate:"31 Dec 2025", status:"active",    employees:210 },
  ],
};

const ADMIN_SECTIONS = [
  { id:"companies",   icon:"🏢", label:"Companies",        desc:"Add and manage corporate clients",                       color:"#4A90C4" },
  { id:"users",       icon:"👥", label:"Users & Roles",    desc:"Assign employees, HR managers, admins and CXOs",         color:"#6DB33F" },
  { id:"themes",      icon:"🎨", label:"Themes",           desc:"Create wellness program themes and assign KPIs",         color:"#8B6FCB" },
  { id:"questions",   icon:"❓", label:"Questions",        desc:"Manage assessment questions per KPI",                    color:"#E8A020" },
  { id:"challenges",  icon:"🎯", label:"Challenges",       desc:"Create and configure daily challenges per KPI",          color:"#f97316" },
  { id:"suggestions", icon:"🌿", label:"Suggestion Master",desc:"Manage Aahar / Vihar / Aushadh suggestion library",      color:"#22c55e" },
  { id:"sessions",    icon:"📅", label:"Sessions / KPI Windows",desc:"Schedule KPI programs per company (start + end dates)", color:"#38bdf8" },
];

const ROLE_LABELS = { employee:"Employee", hr:"HR Manager", cxo:"CXO", admin:"Company Admin", ayumonk_admin:"Ayumonk Admin", super_admin:"Super Admin" };
const ROLE_COLORS = { employee:"#6B8F6D", hr:"#4A90C4", cxo:"#D4A843", admin:"#8B6FCB", ayumonk_admin:"#6DB33F", super_admin:"#f97316" };

function AdminDashboard() {
  const [section, setSection] = useState("companies");
  const [showForm, setShowForm]  = useState(false);
  const [editItem, setEditItem]  = useState(null);
  const [searchQ, setSearchQ]    = useState("");

  const sec = ADMIN_SECTIONS.find(s=>s.id===section);
  const rows = ADMIN_DATA[section] || [];

  const StatusBadge = ({s})=>{
    const col = s==="active"?C.g3 : s==="draft"?C.gold : s==="completed"?"#4A90C4" : s==="trial"?C.orange : C.muted;
    return <span style={{fontSize:7.5,fontWeight:700,background:`${col}18`,color:col,borderRadius:5,padding:"1px 7px"}}>{s?.toUpperCase()}</span>;
  };

  // Column definitions per section
  const COLS = {
    companies:   [["ID","id",40],["Company Name","name",220],["Industry","industry",90],["Size","size",70],["Employees","employees",80],["Status","status",70],["Created","created",80]],
    users:       [["ID","id",40],["Name","name",150],["Email","email",200],["Company","company",100],["Role","role",110],["Dept","dept",100],["Status","status",70]],
    themes:      [["Key","key",160],["Theme Name","name",180],["KPIs","kpis",200],["Companies","companies",80],["Status","status",70]],
    questions:   [["Key","key",120],["KPI","kpi",120],["Question","label",280],["Type","type",80],["Reverse","reverse",60],["Status","status",70]],
    challenges:  [["ID","id",40],["Label","label",180],["KPI","kpi",120],["Type","type",80],["XP","xp",50],["Companies","companies",80],["Status","status",70]],
    suggestions: [["ID","id",40],["Type","type",70],["KPI","kpi",120],["Dosha","dosha",60],["Title","title",240],["Trigger","trigger",110],["Status","status",70]],
    sessions:    [["ID","id",40],["Company","company",120],["Theme","theme",160],["Start","startDate",90],["End","endDate",90],["Employees","employees",80],["Status","status",70]],
  };

  const cols = COLS[section]||[];
  const filtered = rows.filter(r=> !searchQ || Object.values(r).some(v=>String(v).toLowerCase().includes(searchQ.toLowerCase())));

  // Generic empty form fields per section
  const FORM_FIELDS = {
    companies:   [["Company Name","name","text"],["Industry","industry","text"],["Size","size","select:Small|Medium|Large|Enterprise"],["No. of Employees","employees","number"]],
    users:       [["Full Name","name","text"],["Email","email","email"],["Company","company","text"],["Role","role","select:employee|hr|cxo|admin|ayumonk_admin|super_admin"],["Department","dept","text"]],
    themes:      [["Theme Key","key","text"],["Display Name","name","text"],["Description","desc","text"]],
    questions:   [["Question Key","key","text"],["KPI Key","kpi","text"],["Question Text","label","textarea"],["Reverse Scoring","reverse","select:false|true"]],
    challenges:  [["Label","label","text"],["KPI Key","kpi","text"],["Type","type","select:counter|toggle|choice|multi|timer|rating"],["XP Reward","xp","number"]],
    suggestions: [["Type","type","select:aahar|vihar|aushadh"],["KPI Key","kpi","text"],["Dosha","dosha","select:all|vata|pitta|kapha"],["Title","title","text"],["Description","desc","textarea"],["Trigger Mode","trigger","select:kpi_risk|question_score|both"]],
    sessions:    [["Company","company","text"],["Theme Key","theme","text"],["KPI Start Date","startDate","date"],["KPI End Date","endDate","date"]],
  };

  const formFields = FORM_FIELDS[section]||[];
  const [formData, setFormData] = useState({});

  return (
    <div>
      {/* ADMIN HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <span style={{fontSize:18}}>⚙️</span>
            <span style={{fontSize:15,fontWeight:800}}>Admin Panel</span>
            <span style={{fontSize:8,background:"rgba(240,80,80,0.12)",color:"#f87171",borderRadius:5,padding:"2px 8px",fontWeight:700}}>
              {ADMIN_ROLE==="super_admin"?"SUPER ADMIN":"AYUMONK ADMIN"}
            </span>
          </div>
          <div style={{fontSize:9,color:C.muted}}>Manage all platform entities — companies, users, content, and program configuration.</div>
        </div>
        <div style={{fontSize:8,background:"rgba(107,179,63,0.08)",border:"1px solid rgba(107,179,63,0.2)",borderRadius:8,padding:"6px 12px",color:C.g3}}>
          Logged in as Ayumonk Admin · Full access
        </div>
      </div>

      {/* RBAC MATRIX — which roles can access which sections */}
      <div style={{marginBottom:16,background:"rgba(255,255,255,0.02)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
        <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.6)"}}>🔐 Role-Based Access Control Matrix</span>
          <span style={{fontSize:8,color:C.muted}}>Your role: <span style={{color:ADMIN_ROLE==="super_admin"?C.orange:C.g3,fontWeight:700}}>{ROLE_LABELS[ADMIN_ROLE]||ADMIN_ROLE}</span></span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:8}}>
            <thead>
              <tr style={{background:"rgba(255,255,255,0.03)"}}>
                <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,borderBottom:"1px solid rgba(255,255,255,0.04)",whiteSpace:"nowrap"}}>Section</th>
                {["Employee","HR Manager","CXO","Company Admin","Ayumonk Admin","Super Admin"].map(r=>(
                  <th key={r} style={{padding:"6px 10px",textAlign:"center",color:C.muted,fontWeight:600,borderBottom:"1px solid rgba(255,255,255,0.04)",whiteSpace:"nowrap"}}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Company Master",     [false, false,  false, "view",  "full",  "full"] ],
                ["Company Users",      [false, "view", false, "full",  "full",  "full"] ],
                ["Themes",             [false, false,  false, "view",  "full",  "full"] ],
                ["KPIs & Questions",   [false, false,  false, false,   "full",  "full"] ],
                ["Challenges",         [false, "view", false, "view",  "full",  "full"] ],
                ["Suggestion Master",  [false, false,  false, false,   "full",  "full"] ],
                ["Sessions / Windows", [false, "full", "view","full",  "full",  "full"] ],
                ["HR Analytics",       [false, "full", "full",false,   "view",  "full"] ],
                ["Ayufinity / Products",[false, false,  false, false,   "full",  "full"] ],
                ["Platform Settings",  [false, false,  false, false,   false,   "full"] ],
              ].map(([section_name, perms], ri)=>(
                <tr key={section_name} style={{background:ri%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                  <td style={{padding:"5px 10px",color:"rgba(255,255,255,0.65)",borderBottom:"1px solid rgba(255,255,255,0.03)",whiteSpace:"nowrap"}}>{section_name}</td>
                  {perms.map((p,pi)=>{
                    const col = p==="full"?C.g3 : p==="view"?C.blue : "rgba(255,255,255,0.1)";
                    const bg  = p==="full"?"rgba(107,179,63,0.1)" : p==="view"?"rgba(74,144,196,0.08)" : "transparent";
                    return (
                      <td key={pi} style={{padding:"5px 10px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                        <span style={{fontSize:7.5,fontWeight:700,color:col,background:bg,borderRadius:4,padding:"1px 7px"}}>
                          {p===false?"—" : p==="full"?"✓ Full" : "👁 View"}
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

      {/* SECTION NAV — icon grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:18}}>
        {ADMIN_SECTIONS.map(s=>(
          <button key={s.id} onClick={()=>{ setSection(s.id); setShowForm(false); setSearchQ(""); }}
            style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${section===s.id?s.color:"rgba(255,255,255,0.08)"}`,
              background:section===s.id?`${s.color}12`:"rgba(255,255,255,0.025)",
              textAlign:"left",cursor:"pointer",transition:"all 0.15s"}}>
            <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:10,fontWeight:700,color:section===s.id?s.color:"rgba(255,255,255,0.7)"}}>{s.label}</div>
            <div style={{fontSize:7.5,color:C.muted,marginTop:2,lineHeight:1.3}}>{s.desc}</div>
          </button>
        ))}
      </div>

      {/* SECTION TABLE */}
      <Card style={{padding:0,overflow:"hidden"}}>
        {/* Table header */}
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:16}}>{sec?.icon}</span>
            <div>
              <div style={{fontSize:12,fontWeight:700}}>{sec?.label}</div>
              <div style={{fontSize:8.5,color:C.muted}}>{filtered.length} records</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {/* Search */}
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
              placeholder="Search…"
              style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
                color:"#fff",borderRadius:8,padding:"5px 10px",fontSize:10,outline:"none",width:140}}/>
            {/* Add new */}
            <button onClick={()=>{ setShowForm(p=>!p); setEditItem(null); setFormData({}); }}
              style={{padding:"6px 14px",borderRadius:8,background:`linear-gradient(135deg,${C.g1},${C.g2})`,
                border:"none",color:"#fff",fontWeight:700,fontSize:10,cursor:"pointer"}}>
              + Add New
            </button>
          </div>
        </div>

        {/* Inline add/edit form */}
        {showForm&&(
          <div style={{padding:"14px 16px",background:"rgba(107,179,63,0.04)",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:10,fontWeight:700,marginBottom:10,color:C.g3}}>
              {editItem ? `Edit #${editItem.id}` : `Add New ${sec?.label.slice(0,-1) || "Item"}`}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:12}}>
              {formFields.map(([label, field, type])=>(
                <div key={field}>
                  <div style={{fontSize:8,color:C.muted,marginBottom:3,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
                  {type==="textarea" ? (
                    <textarea rows={2} value={formData[field]||""}
                      onChange={e=>setFormData(p=>({...p,[field]:e.target.value}))}
                      style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",
                        color:"#fff",borderRadius:7,padding:"5px 9px",fontSize:10,resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
                  ) : type.startsWith("select:") ? (
                    <select value={formData[field]||""}
                      onChange={e=>setFormData(p=>({...p,[field]:e.target.value}))}
                      style={{width:"100%",background:"rgba(30,50,30,0.9)",border:"1px solid rgba(255,255,255,0.12)",
                        color:"#fff",borderRadius:7,padding:"6px 9px",fontSize:10,outline:"none"}}>
                      <option value="">Select…</option>
                      {type.split(":")[1].split("|").map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={type} value={formData[field]||""}
                      onChange={e=>setFormData(p=>({...p,[field]:e.target.value}))}
                      placeholder={label}
                      style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",
                        color:"#fff",borderRadius:7,padding:"6px 9px",fontSize:10,outline:"none",boxSizing:"border-box"}}/>
                  )}
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowForm(false)}
                style={{padding:"7px 20px",borderRadius:8,background:`linear-gradient(135deg,${C.g1},${C.g2})`,border:"none",color:"#fff",fontWeight:700,fontSize:10,cursor:"pointer"}}>
                {editItem?"Update":"Save"}
              </button>
              <button onClick={()=>{ setShowForm(false); setEditItem(null); setFormData({}); }}
                style={{padding:"7px 16px",borderRadius:8,background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:C.muted,fontSize:10,cursor:"pointer"}}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Data table */}
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
            <thead>
              <tr style={{background:"rgba(255,255,255,0.03)"}}>
                {cols.map(([h,,w])=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:C.muted,
                    fontSize:8,letterSpacing:0.6,textTransform:"uppercase",
                    minWidth:w,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>
                    {h}
                  </th>
                ))}
                <th style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:C.muted,fontSize:8,
                  letterSpacing:0.6,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row,ri)=>(
                <tr key={ri}
                  style={{borderBottom:`1px solid rgba(255,255,255,0.03)`,
                    background:ri%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                  {cols.map(([,field])=>(
                    <td key={field} style={{padding:"8px 12px",color:"rgba(255,255,255,0.65)",maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {field==="status"   ? <StatusBadge s={row[field]}/>
                       :field==="role"    ? <span style={{fontSize:8,fontWeight:700,color:ROLE_COLORS[row[field]]||C.muted}}>{ROLE_LABELS[row[field]]||row[field]}</span>
                       :field==="kpis"    ? <span>{Array.isArray(row[field])?row[field].join(", "):row[field]}</span>
                       :field==="reverse" ? <span style={{color:row[field]?C.orange:C.g3,fontWeight:700}}>{row[field]?"Yes":"No"}</span>
                       :field==="type"    ? <span style={{fontSize:8,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",borderRadius:4,padding:"1px 6px"}}>{row[field]}</span>
                       :                   String(row[field]||"")}
                    </td>
                  ))}
                  <td style={{padding:"8px 12px",textAlign:"right",whiteSpace:"nowrap"}}>
                    <button onClick={()=>{ setEditItem(row); setFormData({...row}); setShowForm(true); }}
                      style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:C.blue,borderRadius:5,padding:"2px 9px",cursor:"pointer",fontSize:8,marginRight:5}}>
                      Edit
                    </button>
                    <button style={{background:"transparent",border:"1px solid rgba(240,80,80,0.3)",color:"#f87171",borderRadius:5,padding:"2px 9px",cursor:"pointer",fontSize:8}}>
                      {row.status==="active"?"Disable":"Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length===0&&(
                <tr><td colSpan={cols.length+1} style={{padding:"30px",textAlign:"center",color:C.muted,fontSize:10}}>
                  No records found{searchQ?` for "${searchQ}"`:""}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function App(){
  const [tab,setTab]               = useState("wellness");
  const [timeView,setTimeView]     = useState(1);

  // ── PWA state ──────────────────────────────────────────────────────────────
  const [isOnline,setIsOnline]     = useState(navigator.onLine);
  const [offlineQueue,setOfflineQueue] = useState(0);       // pending syncs
  const [showInstall,setShowInstall]   = useState(!isStandalone()); // hide if already installed
  const [pushPermission,setPushPerm]   = useState(getPushPermission());
  const [showPushPrompt,setShowPushPrompt] = useState(false);
  const [pwaInstallDone,setPwaInstallDone] = useState(isStandalone());

  // Track online/offline status
  useEffect(()=>{
    const goOnline  = ()=>{ setIsOnline(true);  setOfflineQueue(0); };
    const goOffline = ()=>  setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return ()=>{
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  },[]);

  // After PWA install: wait 3 seconds, then offer push permission (if not granted)
  useEffect(()=>{
    if(pwaInstallDone && pushPermission === "default"){
      const t = setTimeout(()=>setShowPushPrompt(true), 3000);
      return ()=>clearTimeout(t);
    }
  },[pwaInstallDone, pushPermission]);

  const handlePushAllow = () => {
    setPushPerm("granted");
    setShowPushPrompt(false);
    // Production: call POST /api/reminders/push/subscribe with the subscription object
  };

  const vd=ALL_VIEWS[timeView];
  const lb=ALL_LABELS[timeView];

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Outfit','Nunito','Segoe UI',sans-serif",color:"#fff",paddingBottom:showPushPrompt?120:0}}>

      {/* ── PWA PUSH PERMISSION BOTTOM SHEET ─────────────────────────────── */}
      {showPushPrompt&&(
        <PWAPushPrompt
          onAllow={handlePushAllow}
          onSkip={()=>setShowPushPrompt(false)}
        />
      )}

      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 22px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.01)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <AyuLogo size={32}/>
          <div>
            <div style={{fontWeight:800,fontSize:14,background:"linear-gradient(90deg,#4a7c2f,#6db33f)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:0.5}}>AYUMONK</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,0.28)",letterSpacing:1}}>WELLNESS INTELLIGENCE PLATFORM</div>
          </div>
        </div>

        <div style={{display:"flex",gap:4,background:"rgba(0,0,0,0.4)",borderRadius:12,padding:4}}>
          {(()=>{
              // Role-based tab visibility
              // Employees see: My Wellness, Challenges, My Responses
              // HR/Admin additionally see: HR Analytics, Admin
              const employeeTabs = [["wellness","🌿 My Wellness"],["challenges","🎯 Challenges"],["responses","📋 My Responses"]];
              const hrTabs       = [["hr","👔 HR Analytics"]];
              const adminTabs    = [["admin","⚙️ Admin"]];
              const isHR    = ["hr","admin","cxo","ayumonk_admin","super_admin"].includes(ADMIN_ROLE);
              const isAdmin = ["ayumonk_admin","super_admin"].includes(ADMIN_ROLE);
              const tabs = [...employeeTabs, ...(isHR?hrTabs:[]), ...(isAdmin?adminTabs:[])];
              return tabs.map(([id,label])=>(
                <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 16px",borderRadius:9,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:tab===id?"linear-gradient(135deg,#2C5F2D,#6db33f)":"transparent",color:tab===id?"#fff":"rgba(255,255,255,0.38)",transition:"all 0.25s"}}>{label}</button>
              ));
            })()}
        </div>

        {/* Right: notification bell + PWA badges + date */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* IN-APP NOTIFICATION BELL */}
          <NotificationBell onNavigate={(t)=>setTab(t)}/>
          {/* Push / install / offline mini-badges */}
          {!pushPermission||pushPermission==="default" ? (
            <button onClick={()=>setShowPushPrompt(true)}
              style={{fontSize:8,background:"rgba(232,160,32,0.10)",color:C.gold,borderRadius:6,
                padding:"3px 8px",border:"1px solid rgba(232,160,32,0.25)",cursor:"pointer",fontWeight:600}}>
              Enable push
            </button>
          ):null}
          {isStandalone()&&(
            <span style={{fontSize:7.5,background:"rgba(107,179,63,0.10)",color:C.g3,borderRadius:5,padding:"2px 7px",fontWeight:600}}>📲</span>
          )}
          {!isOnline&&(
            <span style={{fontSize:7.5,background:"rgba(232,160,32,0.15)",color:C.gold,borderRadius:5,padding:"2px 6px",fontWeight:700}}>📡</span>
          )}
          <div style={{fontSize:9,color:"rgba(255,255,255,0.2)"}}>
            {formatDateIST(new Date())}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"18px 22px"}}>

        {/* ── PWA INSTALL BANNER (only if not yet installed) ──────────────── */}
        {showInstall&&!isStandalone()&&(
          <PWAInstallBanner
            onDismiss={()=>{ setShowInstall(false); setPwaInstallDone(true); }}
          />
        )}

        {/* ── OFFLINE STATUS BAR ───────────────────────────────────────────── */}
        {!isOnline&&<PWAOfflineBadge queueCount={offlineQueue}/>}

        <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginBottom:14,borderBottom:"1px solid rgba(255,255,255,0.05)",paddingBottom:10}}>
          {tab==="wellness"&&"🌿 Your Personal Wellness Journey — Nutrition · Lifestyle · Wellness · Dosha-aligned Ayurveda"}
          {tab==="challenges"&&"🎯 Daily Challenges — 1 to 3 taps to complete · Earn XP · Build Streaks · Unlock Badges"}
          {tab==="responses"&&"📋 My Responses — View submitted wellness forms with KPI scores, and fill pending forms"}
          {tab==="hr"&&"👔 HR Intelligence Centre — Population Health Analytics · CXO Metrics · Location & Department Insights"}
          {tab==="admin"&&"⚙️ Admin Panel — Manage companies, users, themes, questions, challenges, suggestions and KPI sessions"}
        </div>

        {tab==="wellness"&&<WellnessDashboard viewData={vd} labels={lb} timeView={timeView} setTimeView={setTimeView}/>}
        {tab==="challenges"&&<ChallengeDashboard isOnline={isOnline} onOfflineQueue={(n)=>setOfflineQueue(p=>p+n)}/>}
        {tab==="responses"&&<MyResponses/>}
        {tab==="hr"&&<HRDashboard/>}
        {tab==="admin"&&(ADMIN_ROLE==="ayumonk_admin"||ADMIN_ROLE==="super_admin")&&<AdminDashboard/>}
        {tab==="admin"&&ADMIN_ROLE!=="ayumonk_admin"&&ADMIN_ROLE!=="super_admin"&&(
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:36,marginBottom:12}}>🔒</div>
            <div style={{fontSize:14,color:"rgba(255,255,255,0.4)"}}>Admin access only.</div>
          </div>
        )}
      </div>

      <div style={{padding:"10px 22px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:8,color:"rgba(255,255,255,0.16)"}}>WHO MHW · SF-12 · Gallup Q12 · UN SDGs · SHRM · Ayurveda Tridosha · W3C PWA</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:7,color:"rgba(107,179,63,0.4)",background:"rgba(107,179,63,0.06)",borderRadius:4,padding:"1px 6px"}}>PWA v6.0</span>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.14)"}}>ayumonk.com/corporate © 2025</div>
        </div>
      </div>
    </div>
  );
}
