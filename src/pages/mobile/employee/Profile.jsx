import { C, useMobileTheme } from "../../../components/mobile/palette";
import { useTokens } from "../../../components/mobile/useTokens";

const RESPONSES = [
  { date: "Today, 8:10 AM", title: "Morning check-in", score: 4.6, kpis: 6 },
  { date: "Yesterday", title: "Evening reflection", score: 4.2, kpis: 6 },
  { date: "Mon, 27 May", title: "Weekly wellness survey", score: 4.4, kpis: 9 },
  { date: "Sun, 26 May", title: "Morning check-in", score: 4.0, kpis: 6 },
];

const STATS = [
  { l: "Streak", v: "7", i: "🔥" },
  { l: "Total XP", v: "1.8k", i: "⚡" },
  { l: "Rank", v: "#4", i: "🏆" },
  { l: "Badges", v: "3", i: "🏅" },
];

const SETTINGS = [
  { icon: "🔔", label: "Reminders", detail: "3 active" },
  { icon: "✨", label: "Daily nudge", detail: "8:00 AM" },
  { icon: "⌚", label: "Connected devices", detail: "Apple Health" },
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

export default function Profile() {
  const t = useTokens();
  const { isDark, toggle } = useMobileTheme();

  return (
    <div style={{ background: t.bg, minHeight: "100%", paddingBottom: 16 }}>
      {/* Page header */}
      <div style={{ padding: "10px 16px 16px" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>🧘 Profile</div>
        <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>
          Your journey, history &amp; settings
        </div>
      </div>

      {/* User card */}
      <div style={{ padding: "0 16px 12px" }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            background: t.card,
            borderRadius: 16,
            border: `1px solid ${t.border}`,
            padding: 18,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${C.g2}, ${C.g3})`,
              color: "#fff",
              fontSize: 21,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            AR
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>Amit Rao</div>
            <div style={{ fontSize: 12.5, color: t.muted }}>Finance · Delhi</div>
            <div
              style={{
                marginTop: 7,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(109,179,63,.12)",
                color: C.g3,
                borderRadius: 999,
                padding: "3px 10px",
                fontSize: 11.5,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              🌳 Banyan Sapling
            </div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ padding: "0 16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {STATS.map((s) => (
            <div
              key={s.l}
              style={{
                background: t.card,
                borderRadius: 14,
                border: `1px solid ${t.border}`,
                padding: "12px 6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 17, marginBottom: 3 }}>{s.i}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.text, lineHeight: 1 }}>
                {s.v}
              </div>
              <div style={{ fontSize: 9.5, color: t.faint, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent check-ins */}
      <div style={{ padding: "0 16px 20px" }}>
        <SectionLabel>📝 Recent check-ins</SectionLabel>
        <div
          style={{
            background: t.card,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            overflow: "hidden",
          }}
        >
          {RESPONSES.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderBottom: i < RESPONSES.length - 1 ? `1px solid ${t.border}` : "none",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: "rgba(109,179,63,.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ✅
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 11, color: t.faint }}>
                  {r.date} · {r.kpis} KPIs
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.g3 }}>
                  {r.score.toFixed(1)}
                </div>
                <div style={{ fontSize: 9.5, color: t.faint }}>avg /5</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div style={{ padding: "0 16px 16px" }}>
        <SectionLabel>⚙️ Settings</SectionLabel>
        <div
          style={{
            background: t.card,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            overflow: "hidden",
          }}
        >
          {SETTINGS.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{s.icon}</span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: t.text }}>
                {s.label}
              </span>
              <span style={{ fontSize: 12, color: t.faint }}>{s.detail}</span>
            </div>
          ))}
          {/* Dark mode toggle — wired to the real MobileShell theme */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
            }}
          >
            <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>
              {isDark ? "🌙" : "☀️"}
            </span>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: t.text }}>
              Dark mode
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle dark mode"
              style={{
                width: 42,
                height: 25,
                borderRadius: 999,
                border: "none",
                background: isDark ? C.g3 : "rgba(31,30,29,0.12)",
                cursor: "pointer",
                position: "relative",
                transition: "background .2s",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: 3,
                  width: 19,
                  height: 19,
                  borderRadius: 999,
                  background: "#fff",
                  transform: isDark ? "translateX(17px)" : "translateX(0)",
                  transition: "transform .2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
