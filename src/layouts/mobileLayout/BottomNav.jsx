import { useMobileTheme } from "../../components/mobile/palette";

// Inject keyframes once (ring pulse for the bulge anchor).
let bulgeStylesInjected = false;
function injectBulgeStyles() {
  if (bulgeStylesInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.dataset.ayumonkBulge = "true";
  tag.textContent =
    "@keyframes ayuRingPulse{0%{transform:scale(.5);opacity:.6}100%{transform:scale(2.3);opacity:0}}";
  document.head.appendChild(tag);
  bulgeStylesInjected = true;
}

export default function BottomNav({ items, active, onNav, accent, accentDark, notch = false, centerBadge }) {
  const { palette, isDark } = useMobileTheme();
  const resolvedAccent = accent || palette.g3;

  // ── Bulge nav (employee / admin / hr): gentle hump, centre item in sequence ──
  if (notch && Array.isArray(items) && items.length >= 3) {
    injectBulgeStyles();
    return (
      <BulgeNav
        items={items}
        active={active}
        onNav={onNav}
        accentDark={accentDark}
        palette={palette}
        isDark={isDark}
        acc={resolvedAccent}
        centerBadge={centerBadge}
      />
    );
  }

  // ── Plain flat nav (fallback) ───────────────────────────────────────────────
  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        display: "flex",
        background: palette.card,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderTop: `1px solid ${palette.border}`,
        boxShadow: isDark ? "none" : "0 -2px 12px rgba(31,30,29,.06)",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((t) => {
        const on = active === t.id;
        const inactiveColor = isDark ? "rgba(255,255,255,.3)" : "rgba(31,30,29,.35)";
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onNav(t.id)}
            style={{
              flex: 1, border: "none", background: "transparent", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "9px 2px 8px", color: on ? resolvedAccent : inactiveColor,
              transition: "color .15s", position: "relative", minHeight: 54,
            }}
          >
            {on && <span style={{ position: "absolute", top: 0, left: "18%", right: "18%", height: 2, background: resolvedAccent, borderRadius: "0 0 3px 3px" }} />}
            <span style={{ fontSize: on ? 20 : 17, lineHeight: 1, transition: "font-size .15s" }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: on ? 700 : 400, marginTop: 3, letterSpacing: 0.1, lineHeight: 1 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Bulge nav implementation ──────────────────────────────────────────────────
function BulgeNav({ items, active, onNav, palette, isDark, acc, accentDark, centerBadge }) {
  const n = items.length;
  const ci = Math.floor(n / 2); // centre item (e.g. Wellness / Home)
  const idx = Math.max(0, items.findIndex((it) => it.id === active));
  const faint = isDark ? "rgba(255,255,255,.42)" : "rgba(31,30,29,.42)";
  const accDark = accentDark || (isDark ? acc : palette.g1);
  const accentSoft = isDark ? `${acc}29` : `${acc}1f`; // ~16% / ~12%

  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        zIndex: 50,
        height: 74,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Humped surface */}
      <svg
        viewBox="0 0 375 90"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, filter: "drop-shadow(0 -3px 14px rgba(31,30,29,0.07))" }}
      >
        <path d="M0,22 L120,22 C150,22 156,3 187.5,3 C219,3 225,22 255,22 L375,22 L375,90 L0,90 Z" fill={palette.card} stroke={palette.border} strokeWidth="0.75" />
      </svg>

      <div style={{ position: "relative", display: "flex", height: "100%", zIndex: 2 }}>
        {/* sliding active pill */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute", top: 9, left: 0, zIndex: 1,
            width: `${100 / n}%`, height: 40,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: `translateX(${idx * 100}%)`,
            transition: "transform .32s cubic-bezier(.34,1.4,.5,1)",
            pointerEvents: "none",
          }}
        >
          <span style={{ width: 52, height: 40, borderRadius: 14, background: accentSoft }} />
        </span>

        {items.map((it, i) => {
          const on = active === it.id;
          const isCenter = i === ci;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onNav(it.id)}
              aria-label={it.label}
              style={{
                flex: 1, border: "none", background: "transparent", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "6px 2px 0", gap: 4, position: "relative",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                style={{
                  fontSize: 19, lineHeight: 1, position: "relative",
                  transition: "transform .25s cubic-bezier(.34,1.4,.5,1)",
                  transform: on ? "translateY(-2px) scale(1.12)" : "none",
                }}
              >
                {/* pulsing rings on active centre item — expand up to the bulge */}
                {isCenter && on && (
                  <>
                    <span aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", width: 40, height: 40, margin: "-20px 0 0 -20px", borderRadius: "50%", border: `2px solid ${acc}`, opacity: 0, animation: "ayuRingPulse 2.4s ease-out infinite" }} />
                    <span aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", width: 40, height: 40, margin: "-20px 0 0 -20px", borderRadius: "50%", border: `2px solid ${acc}`, opacity: 0, animation: "ayuRingPulse 2.4s ease-out infinite", animationDelay: "1.2s" }} />
                  </>
                )}
                {it.icon}
                {/* centre streak badge (e.g. 🔥7) */}
                {isCenter && centerBadge != null && centerBadge !== "" && (
                  <span aria-hidden="true" style={{ position: "absolute", top: -8, right: -14, background: "linear-gradient(135deg,#E0935C,#C0604A)", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 999, padding: "1px 5px 1px 3px", display: "flex", alignItems: "center", gap: 1, lineHeight: 1, border: `2px solid ${palette.card}`, boxShadow: "0 2px 5px rgba(0,0,0,0.22)" }}>
                    🔥<b style={{ fontSize: 9, fontWeight: 800 }}>{centerBadge}</b>
                  </span>
                )}
                {/* per-item alert badge */}
                {it.badge != null && it.badge !== "" && it.badge !== 0 && (
                  <span style={{ position: "absolute", top: -7, right: -9, background: "#C0604A", color: "#fff", fontSize: 8.5, fontWeight: 800, minWidth: 14, height: 14, padding: "0 3px", borderRadius: 999, display: "grid", placeItems: "center", border: `1.5px solid ${palette.card}` }}>
                    {it.badge}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 10, fontWeight: on ? 800 : 500, color: on ? accDark : faint, letterSpacing: 0.1, transition: "color .2s" }}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
