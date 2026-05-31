import { C } from "../../../components/mobile/palette";
import { useTokens } from "../../../components/mobile/useTokens";
import { dimHue } from "../../../components/mobile/dimensionColors";

// ── Static demo data (swap for an API when a rewards endpoint exists) ────────
const CUR_XP = 1860;
const LEVELS = [
  { name: "Banyan Seed", min: 0 },
  { name: "Banyan Sprout", min: 500 },
  { name: "Banyan Sapling", min: 1200 },
  { name: "Banyan Tree", min: 2500 },
  { name: "Banyan Grove", min: 4000 },
  { name: "Banyan Legend", min: 6000 },
];

const BADGES = [
  { id: "h1", label: "Hydration Hero", icon: "💧", earned: true, tier: "Gold", dim: "vihara" },
  { id: "s1", label: "Sleep Master", icon: "🌙", earned: true, tier: "Silver", dim: "nidra" },
  { id: "g1", label: "Green Eater", icon: "🥗", earned: true, tier: "Bronze", dim: "aahar" },
  { id: "st", label: "Stress Buster", icon: "🧘", earned: false, tier: "Bronze", dim: "manas" },
  { id: "a1", label: "Active Star", icon: "🏃", earned: false, tier: "Silver", dim: "vihara" },
  { id: "b1", label: "Banyan Legend", icon: "🌳", earned: false, tier: "Legend", dim: "ojas" },
];

const LEADERBOARD = [
  { name: "Priya S.", team: "Engineering · Delhi", delta: 42 },
  { name: "Rahul M.", team: "Product · Mumbai", delta: 38 },
  { name: "Anjali K.", team: "People · Bengaluru", delta: 35 },
  { name: "Amit R.", team: "Finance · Delhi", delta: 31, you: true },
  { name: "Sneha P.", team: "Marketing · Pune", delta: 28 },
];

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#6B7F5C",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

// Banyan growth glyph — canopy fills with the level reached
function BanyanGlyph({ stage = 3, color = C.g3 }) {
  const leaves = [
    { cx: 40, cy: 30, r: 16 },
    { cx: 26, cy: 40, r: 12 },
    { cx: 54, cy: 40, r: 12 },
    { cx: 32, cy: 24, r: 9 },
    { cx: 48, cy: 24, r: 9 },
  ].slice(0, 1 + Math.min(5, stage));
  return (
    <svg width="76" height="76" viewBox="0 0 80 80" fill="none">
      <path
        d="M40 70 L40 44 M40 52 L31 46 M40 50 L49 44"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      {leaves.map((l, i) => (
        <circle key={i} cx={l.cx} cy={l.cy} r={l.r} fill={color} opacity={0.18 + i * 0.06} />
      ))}
      <circle cx="40" cy="32" r="11" fill={color} opacity="0.9" />
    </svg>
  );
}

export default function Rewards() {
  const t = useTokens();
  const levelIdx = LEVELS.reduce((acc, lv, i) => (CUR_XP >= lv.min ? i : acc), 0);
  const level = LEVELS[levelIdx];
  const next = LEVELS[Math.min(LEVELS.length - 1, levelIdx + 1)];
  const span = Math.max(1, next.min - level.min);
  const pct = Math.max(0, Math.min(100, Math.round(((CUR_XP - level.min) / span) * 100)));
  const earnedCount = BADGES.filter((b) => b.earned).length;

  return (
    <div style={{ background: t.bg, minHeight: "100%", paddingBottom: 16 }}>
      {/* Page header */}
      <div style={{ padding: "10px 16px 16px" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>🏅 Rewards</div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>
          Grow your Banyan · climb the board
        </div>
      </div>

      {/* Banyan journey */}
      <div style={{ padding: "0 16px 20px" }}>
        <div
          style={{
            background: t.card,
            borderRadius: 16,
            border: `1px solid ${t.border}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              padding: 18,
              background: `linear-gradient(135deg, ${C.g3}1c, transparent)`,
            }}
          >
            <div
              style={{
                background: t.card2,
                borderRadius: 18,
                padding: 4,
                border: `1px solid ${t.border}`,
                flexShrink: 0,
              }}
            >
              <BanyanGlyph stage={levelIdx} color={C.g3} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  color: t.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontWeight: 700,
                }}
              >
                Current level
              </div>
              <div
                style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 2px", color: t.text }}
              >
                {level.name}
              </div>
              <div style={{ fontSize: 12, color: t.muted }}>
                {CUR_XP.toLocaleString()} XP total
              </div>
            </div>
          </div>

          <div style={{ padding: "0 18px 18px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 7,
              }}
            >
              <span style={{ color: t.muted, fontWeight: 600 }}>
                {level.name} → {next.name}
              </span>
              <span style={{ color: t.faint }}>
                {(next.min - CUR_XP).toLocaleString()} XP to grow
              </span>
            </div>
            <div style={{ height: 9, borderRadius: 9, background: t.track }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 9,
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${C.g2}, ${C.g3})`,
                  transition: "width .5s",
                }}
              />
            </div>
            {/* Level pips */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
              {LEVELS.map((lv, i) => {
                const on = CUR_XP >= lv.min;
                return (
                  <div
                    key={lv.name}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 9,
                        background: on ? C.g3 : t.bg,
                        border: `1.5px solid ${on ? C.g3 : t.border}`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 8,
                        color: on ? C.g3 : t.faint,
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {lv.name.replace("Banyan ", "")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ padding: "0 16px 20px" }}>
        <SectionLabel>
          🏅 My badges · {earnedCount} of {BADGES.length} earned
        </SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9 }}>
          {BADGES.map((b) => {
            const c = dimHue(b.dim);
            return (
              <div
                key={b.id}
                style={{
                  background: b.earned ? `${c}14` : t.inset,
                  border: `1px solid ${b.earned ? `${c}55` : t.border}`,
                  borderRadius: 14,
                  padding: "13px 8px",
                  textAlign: "center",
                  opacity: b.earned ? 1 : 0.55,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    marginBottom: 6,
                    filter: b.earned ? "none" : "grayscale(1)",
                  }}
                >
                  {b.icon}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: b.earned ? c : t.muted,
                    lineHeight: 1.2,
                  }}
                >
                  {b.label}
                </div>
                <div style={{ fontSize: 10, color: t.faint, marginTop: 3 }}>
                  {b.tier}
                  {!b.earned && " 🔒"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ padding: "0 16px 16px" }}>
        <SectionLabel>🏆 Weekly leaderboard</SectionLabel>
        <div
          style={{
            background: t.card,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            overflow: "hidden",
          }}
        >
          {LEADERBOARD.map((row, i) => (
            <div
              key={row.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 16px",
                borderBottom:
                  i < LEADERBOARD.length - 1 ? `1px solid ${t.border}` : "none",
                background: row.you ? "rgba(109,179,63,.06)" : "transparent",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                  background: i < 3 ? ["#C99A3F", "#9BA3AE", "#C0844A"][i] : t.inset,
                  color: i < 3 ? "#fff" : t.faint,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: row.you ? 800 : 600,
                    color: row.you ? C.g3 : t.text,
                  }}
                >
                  {row.you ? "You · Amit R." : row.name}
                </div>
                <div style={{ fontSize: 11, color: t.faint }}>{row.team}</div>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: row.you ? C.g3 : "#4F9D5B",
                }}
              >
                +{row.delta}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
