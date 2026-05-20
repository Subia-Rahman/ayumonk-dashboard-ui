import { C } from "./palette";

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
  if (!Array.isArray(vals) || vals.length < 2) {
    return <svg width={w} height={h} />;
  }
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const rng = mx - mn || 1;
  const pts = vals
    .map(
      (v, i) =>
        `${(i / (vals.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) + 2}`,
    )
    .join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Donut = ({
  pct = 72,
  size = 80,
  color = C.g3,
  label = "",
  center = true,
}) => {
  const half = size / 2;
  const r = half - 10;
  const stroke = 7;
  const circ = 2 * Math.PI * r;
  const dash = circ * (Math.min(100, Math.max(0, pct)) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
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
            y={half + 5}
            textAnchor="middle"
            fill="#fff"
            fontSize="13"
            fontWeight="800"
            fontFamily="Plus Jakarta Sans"
          >
            {Math.round(pct)}
          </text>
          {label && (
            <text
              x={half}
              y={half + 15}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize="7"
              fontFamily="Plus Jakarta Sans"
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
    { val: vata, color: "#38bdf8" },
    { val: pitta, color: "#f97316" },
    { val: kapha, color: "#22c55e" },
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
        stroke="rgba(255,255,255,0.05)"
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
        fill="#fff"
        fontSize="9"
        fontWeight="700"
        fontFamily="Plus Jakarta Sans"
      >
        Prakriti
      </text>
      <text
        x={half}
        y={half + 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize="8"
        fontFamily="Plus Jakarta Sans"
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
              color: "rgba(255,255,255,0.28)",
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

// Bottom sheet that opens when a KPI tile is tapped. `kpi` is shaped by the
// Wellness screen (see employee/Wellness.jsx) so the same component handles
// both API-driven KPIs and the design's static demo set.
export const KpiSheet = ({ kpi, onClose }) => {
  if (!kpi) return null;
  const isRisk = (kpi.score || 0) < 3.0;
  const spark = kpi.sparkValues && kpi.sparkValues.length >= 2
    ? kpi.sparkValues
    : [2.2, 2.5, 2.4, 2.8, 2.7, 3.0, 2.9, 3.1, 3.2, 3.0, 3.3, kpi.score || 3.2];

  return (
    <div
      role="dialog"
      style={{ position: "fixed", inset: 0, zIndex: 200 }}
      onClick={onClose}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,.6)",
        }}
      />
      <div
        className="ayumonk-anim"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: C.card2,
          borderRadius: "20px 20px 0 0",
          border: `1px solid ${kpi.color}44`,
          padding: "0 0 90px",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0 4px",
          }}
        >
          <div
            style={{
              width: 34,
              height: 4,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 2,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 18px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                background: `${kpi.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 21,
              }}
            >
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                {kpi.label}
              </div>
              {kpi.sf && (
                <div style={{ fontSize: 9, color: C.muted }}>SF-12: {kpi.sf}</div>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: kpi.color,
                lineHeight: 1,
              }}
            >
              {Number(kpi.score).toFixed(1)}
            </div>
            <Pill
              label={isRisk ? "Needs Attention" : "On Track"}
              color={isRisk ? "#f87171" : C.g3}
            />
          </div>
        </div>

        <div style={{ padding: "14px 18px 10px" }}>
          <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>
            12-week trend
          </div>
          <Spark vals={spark} color={kpi.color} w={260} h={36} />
        </div>

        {Array.isArray(kpi.questions) && kpi.questions.length > 0 && (
          <div style={{ padding: "4px 18px 14px" }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Question Scores
            </div>
            {kpi.questions.map((q, i) => {
              const pct = ((q.score - 1) / 4) * 100;
              const flagged = q.score < (q.threshold || 3);
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: flagged
                          ? "rgba(251,191,36,.9)"
                          : "rgba(255,255,255,.5)",
                        flex: 1,
                        paddingRight: 8,
                      }}
                    >
                      {flagged ? "⚡ " : ""}
                      {q.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: flagged ? "#fbbf24" : kpi.color,
                      }}
                    >
                      {Number(q.score).toFixed(1)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 3,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(100, pct))}%`,
                        background: flagged
                          ? "linear-gradient(90deg,#f87171,#fbbf24)"
                          : kpi.color,
                        borderRadius: 3,
                        transition: "width .4s",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isRisk && (kpi.aahar || kpi.vihar || kpi.aushadh) && (
          <div
            style={{
              margin: "0 18px",
              background: `${kpi.color}0a`,
              borderRadius: 14,
              padding: "12px 14px",
              border: `1px solid ${kpi.color}22`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: kpi.color,
                marginBottom: 8,
              }}
            >
              🌿 Ayumonk Suggestions
            </div>
            {[
              ["🥗", "Aahar", kpi.aahar],
              ["🌅", "Vihar", kpi.vihar],
              ["🌿", "Aushadh", kpi.aushadh],
            ]
              .filter(([, , txt]) => Boolean(txt))
              .map(([ic, lbl, txt]) => (
                <div
                  key={lbl}
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 7,
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: 13, width: 20, flexShrink: 0 }}>
                    {ic}
                  </span>
                  <div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: kpi.color,
                      }}
                    >
                      {lbl} →{" "}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,0.45)",
                        lineHeight: 1.5,
                      }}
                    >
                      {txt}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
