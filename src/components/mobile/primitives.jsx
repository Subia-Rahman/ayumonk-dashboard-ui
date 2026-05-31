import { C } from "./palette";
import { useTokens } from "./useTokens";

export const Logo = ({ s = 26 }) => (
  <svg width={s * 1.65} height={s * 0.72} viewBox="0 0 120 52" fill="none">
    <path
      d="M60 26C60 26 48 4 30 4 14 4 4 14 4 26 4 38 14 48 30 48 48 48 60 26 60 26Z"
      stroke="#4a7c2f"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M60 26C60 26 72 4 90 4 106 4 116 14 116 26 116 38 106 48 90 48 72 48 60 26 60 26Z"
      stroke="#6db33f"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M88 6C92 2 100 4 98 12 96 18 88 20 84 16 80 12 82 8 88 6Z"
      fill="#4a7c2f"
    />
  </svg>
);

export const Spark = ({ vals = [], color = C.g3, w = 64, h = 22 }) => {
  if (!Array.isArray(vals) || vals.length < 2) return <svg width={w} height={h} />;
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * w,
    h - ((v - mn) / rng) * (h - 4) + 2,
  ]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pts[0][0]},${h} ${line} ${pts[pts.length - 1][0]},${h}`;
  const gid = "sp" + color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`${color}40`} />
          <stop offset="100%" stopColor={`${color}00`} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.4" fill={color} />
    </svg>
  );
};

export const Donut = ({
  pct = 72,
  size = 80,
  color = C.g3,
  label = "",
  center = true,
  stroke = 7,
  track = "rgba(255,255,255,0.06)",
}) => {
  const half = size / 2;
  const r = half - stroke - 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (Math.min(100, Math.max(0, pct)) / 100);
  const numSize = Math.round(size * 0.3);
  const labSize = Math.max(8, Math.round(size * 0.095));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke={track}
        strokeWidth={stroke}
      />
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${half} ${half})`}
      />
      {center && (
        <>
          <text
            x={half}
            y={label ? half - labSize * 0.55 : half}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={numSize}
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
            style={{ letterSpacing: "-0.02em" }}
          >
            {Math.round(pct)}
          </text>
          {label && (
            <text
              x={half}
              y={half + numSize * 0.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.55)"
              fontSize={labSize}
              fontWeight="600"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {label}
            </text>
          )}
        </>
      )}
    </svg>
  );
};

// Three-segment Ayurvedic Prakriti ring (Vata / Pitta / Kapha). Static demo
// values until a dosha endpoint exists — kept as a prop so a future API can
// drop in without touching the component.
export const DoshaRing = ({ vata = 30, pitta = 34, kapha = 36, size = 120 }) => {
  const half = size / 2;
  const r = 38;
  const stroke = 9;
  const circ = 2 * Math.PI * r;
  const segs = [
    { val: vata, color: "#4A90C4" },
    { val: pitta, color: "#E0935C" },
    { val: kapha, color: "#4F9D5B" },
  ];
  let cumulative = 0;
  const arcs = segs.map((s) => {
    const start = cumulative;
    const dashLen = circ * (s.val / 100);
    const offset = circ * (start / 100);
    cumulative += s.val;
    return { ...s, dashLen, offset: circ - offset };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke="rgba(31,30,29,0.06)"
        strokeWidth={stroke}
      />
      {arcs.map((a, i) => (
        <circle
          key={i}
          cx={half}
          cy={half}
          r={r}
          fill="none"
          stroke={a.color}
          strokeWidth={stroke}
          strokeDasharray={`${a.dashLen} ${circ}`}
          strokeDashoffset={a.offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${half} ${half})`}
          style={{ opacity: 0.9 }}
        />
      ))}
      <text
        x={half}
        y={half - 4}
        textAnchor="middle"
        fill="#1F1E1D"
        fontSize="9"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        Prakriti
      </text>
      <text
        x={half}
        y={half + 8}
        textAnchor="middle"
        fill="rgba(31,30,29,0.45)"
        fontSize="8"
        fontFamily="Inter, system-ui, sans-serif"
      >
        Profile
      </text>
    </svg>
  );
};

export const Bar = ({ data = [], color = C.g3, h = 56 }) => {
  const mx = Math.max(...data.map((d) => d.v), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 4,
        height: h + 16,
      }}
    >
      {data.map((d, i) => (
        <div
          key={`${d.l}-${i}`}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <div
            style={{
              width: "100%",
              background: `${color}${i === data.length - 1 ? "bb" : "38"}`,
              borderRadius: "3px 3px 0 0",
              height: `${(d.v / mx) * h}px`,
              minHeight: 3,
              transition: "height .4s",
            }}
          />
          <span
            style={{
              fontSize: 8,
              color: C.muted,
              whiteSpace: "nowrap",
            }}
          >
            {d.l}
          </span>
        </div>
      ))}
    </div>
  );
};

export const Pill = ({ label, color = C.g3, bg }) => (
  <span
    style={{
      fontSize: 9,
      background: bg || `${color}18`,
      color,
      borderRadius: 6,
      padding: "2px 8px",
      fontWeight: 700,
      border: `1px solid ${color}33`,
      display: "inline-block",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

export const KpiSheet = ({ kpi, onClose }) => {
  const t = useTokens();
  if (!kpi) return null;
  const isRisk = (kpi.score || 0) < 3.0;
  const spark = kpi.sparkValues?.length >= 2
    ? kpi.sparkValues
    : [2.2, 2.5, 2.4, 2.8, 2.7, 3.0, 2.9, 3.1, 3.2, 3.0, 3.3, kpi.score || 3.2];

  return (
    <div
      role="dialog"
      style={{ position: "fixed", inset: 0, zIndex: 200 }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} />

      <div
        className="ayumonk-anim"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          background: t.card2,
          borderRadius: "24px 24px 0 0",
          padding: "0 0 52px",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 36, height: 4, background: t.border, borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", padding: "6px 20px 16px",
            borderBottom: `1px solid ${t.border}`,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 16,
                background: `${kpi.color}18`,
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 24, flexShrink: 0,
              }}
            >
              {kpi.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text, lineHeight: 1.2 }}>
                {kpi.label}
              </div>
              {kpi.subtitle && (
                <div style={{ fontSize: 11, color: t.muted, marginTop: 3 }}>
                  {kpi.subtitle}
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, lineHeight: 1, marginBottom: 5 }}>
              {Number(kpi.score).toFixed(1)}
            </div>
            <Pill
              label={isRisk ? "Needs Attention" : "On track"}
              color={isRisk ? C.red : C.g3}
            />
          </div>
        </div>

        {/* 12-week trend */}
        <div style={{ padding: "16px 20px 12px" }}>
          <div
            style={{
              fontSize: 10, fontWeight: 700, color: t.muted,
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 10,
            }}
          >
            12-week trend
          </div>
          <div style={{ background: t.bg, borderRadius: 14, padding: "14px 12px 10px" }}>
            <Spark vals={spark} color={kpi.color} w={300} h={60} />
          </div>
        </div>

        {/* Question scores */}
        {Array.isArray(kpi.questions) && kpi.questions.length > 0 && (
          <div style={{ padding: "4px 20px 16px" }}>
            <div
              style={{
                fontSize: 10, fontWeight: 700, color: t.muted,
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 14,
              }}
            >
              Question Scores
            </div>
            {kpi.questions.map((q, i) => {
              const pct = Math.max(0, Math.min(100, ((q.score - 1) / 4) * 100));
              const flagged = q.score < (q.threshold || 3);
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "baseline", marginBottom: 6, gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: t.text, flex: 1, lineHeight: 1.3 }}>
                      {flagged ? "⚡ " : ""}{q.label}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: flagged ? C.orange : kpi.color, flexShrink: 0 }}>
                      {Number(q.score).toFixed(1)}
                    </span>
                  </div>
                  <div style={{ height: 5, background: `${kpi.color}18`, borderRadius: 3 }}>
                    <div
                      style={{
                        height: "100%", width: `${pct}%`,
                        background: flagged ? `linear-gradient(90deg,${C.red},${C.orange})` : kpi.color,
                        borderRadius: 3, transition: "width .4s",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ayumonk suggestions (at-risk only) */}
        {isRisk && (kpi.aahar || kpi.vihar || kpi.aushadh) && (
          <div
            style={{
              margin: "0 20px", background: `${kpi.color}08`,
              borderRadius: 14, padding: "12px 14px",
              border: `1px solid ${kpi.color}20`,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: kpi.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              🌿 Ayumonk Suggestions
            </div>
            {[["🥗","Aahar",kpi.aahar],["🌅","Vihar",kpi.vihar],["🌿","Aushadh",kpi.aushadh]]
              .filter(([,,txt]) => Boolean(txt))
              .map(([ic, lbl, txt]) => (
                <div key={lbl} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, width: 22, flexShrink: 0 }}>{ic}</span>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: kpi.color }}>{lbl} → </span>
                    <span style={{ fontSize: 11, color: t.muted, lineHeight: 1.5 }}>{txt}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
