import { useMobileTheme } from "../../components/mobile/palette";

// Inject the two keyframes the notch nav needs (once).
let notchStylesInjected = false;
function injectNotchStyles() {
  if (notchStylesInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.dataset.ayumonkNotch = "true";
  tag.textContent =
    "@keyframes ayuLeafSway{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}" +
    "@keyframes ayuRingPulse{0%{transform:scale(.9);opacity:.5}100%{transform:scale(1.65);opacity:0}}";
  document.head.appendChild(tag);
  notchStylesInjected = true;
}

export default function BottomNav({ items, active, onNav, accent, notch = false, centerBadge }) {
  const { palette, isDark } = useMobileTheme();
  const resolvedAccent = accent || palette.g3;

  // ── Notched "anchor" nav (employee): middle item is a fixed centre FAB ──────
  if (notch && Array.isArray(items) && items.length >= 3) {
    injectNotchStyles();
    return (
      <NotchNav
        items={items}
        active={active}
        onNav={onNav}
        palette={palette}
        isDark={isDark}
        acc={resolvedAccent}
        centerBadge={centerBadge}
      />
    );
  }

  // ── Flat nav (HR / Super-admin) — unchanged ─────────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
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
              flex: 1,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "9px 2px 8px",
              color: on ? resolvedAccent : inactiveColor,
              transition: "color .15s",
              position: "relative",
              minHeight: 54,
            }}
          >
            {on && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: "18%",
                  right: "18%",
                  height: 2,
                  background: resolvedAccent,
                  borderRadius: "0 0 3px 3px",
                }}
              />
            )}
            <span style={{ fontSize: on ? 20 : 17, lineHeight: 1, transition: "font-size .15s" }}>
              {t.icon}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: on ? 700 : 400,
                marginTop: 3,
                letterSpacing: 0.1,
                lineHeight: 1,
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Notched nav implementation ────────────────────────────────────────────────
function NotchNav({ items, active, onNav, palette, isDark, acc, centerBadge }) {
  const W = 375;
  const n = items.length;
  const ci = Math.floor(n / 2); // middle item is the anchor
  const colW = W / n;
  const center = items[ci];
  const cx = colW * ci + colW / 2;
  const cOn = active === center.id;
  const faint = isDark ? "rgba(255,255,255,.34)" : "rgba(31,30,29,.42)";
  const accDark = isDark ? acc : palette.g1;

  const d =
    `M0,16 L${cx - 46},16 ` +
    `C${cx - 30},16 ${cx - 33},48 ${cx},48 ` +
    `C${cx + 33},48 ${cx + 30},16 ${cx + 46},16 ` +
    `L375,16 L375,96 L0,96 Z`;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ position: "relative", height: 80 }}>
        <svg
          viewBox="0 0 375 96"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            filter: "drop-shadow(0 -3px 12px rgba(31,30,29,0.06))",
          }}
        >
          <path d={d} fill={palette.card} stroke={palette.border} strokeWidth="0.75" />
        </svg>

        {/* Centre anchor (e.g. Wellness) */}
        <button
          type="button"
          onClick={() => onNav(center.id)}
          aria-label={center.label}
          style={{
            position: "absolute",
            top: -20,
            left: "50%",
            transform: cOn
              ? "translateX(-50%) translateY(-3px) scale(1.05)"
              : "translateX(-50%)",
            width: 52,
            height: 52,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: cOn ? `linear-gradient(150deg, ${accDark}, ${acc})` : palette.card2,
            border: `4px solid ${palette.bg}`,
            zIndex: 3,
            cursor: "pointer",
            padding: 0,
            boxShadow: cOn
              ? "0 14px 26px -6px rgba(79,122,58,0.55)"
              : `0 9px 20px -5px rgba(31,30,29,0.30), 0 0 0 1px ${palette.border}`,
            transition:
              "transform .28s cubic-bezier(.3,1.5,.5,1), background .28s, box-shadow .28s",
          }}
        >
          {cOn && (
            <>
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  border: `2px solid ${acc}`,
                  opacity: 0,
                  animation: "ayuRingPulse 2.6s ease-out infinite",
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  border: `2px solid ${acc}`,
                  opacity: 0,
                  animation: "ayuRingPulse 2.6s ease-out infinite",
                  animationDelay: "1.3s",
                }}
              />
            </>
          )}
          <span
            style={{
              fontSize: 24,
              lineHeight: 1,
              display: "block",
              transformOrigin: "50% 85%",
              animation: "ayuLeafSway 4.5s ease-in-out infinite",
              filter: cOn ? "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" : "none",
            }}
          >
            {center.icon}
          </span>
          {centerBadge != null && centerBadge !== "" && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -5,
                right: -8,
                background: "linear-gradient(135deg,#E0935C,#C0604A)",
                color: "#fff",
                fontSize: 9,
                fontWeight: 800,
                borderRadius: 999,
                padding: "1px 5px 1px 3px",
                display: "flex",
                alignItems: "center",
                gap: 1,
                lineHeight: 1,
                border: `2px solid ${palette.bg}`,
                boxShadow: "0 2px 5px rgba(0,0,0,0.22)",
              }}
            >
              🔥<b style={{ fontSize: 9, fontWeight: 800 }}>{centerBadge}</b>
            </span>
          )}
        </button>

        {/* Tab row (centre column is just the label under the FAB) */}
        <div style={{ position: "relative", display: "flex", height: "100%", zIndex: 2 }}>
          {items.map((it, i) => {
            if (i === ci) {
              return (
                <div
                  key={it.id}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 800, color: cOn ? accDark : faint }}>
                    {it.label}
                  </span>
                </div>
              );
            }
            const on = active === it.id;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onNav(it.id)}
                aria-label={it.label}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  padding: "0 2px 12px",
                  gap: 4,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: 19,
                    lineHeight: 1,
                    transition: "transform .25s cubic-bezier(.3,1.5,.5,1)",
                    transform: on ? "translateY(-4px) scale(1.14)" : "none",
                  }}
                >
                  {it.icon}
                </span>
                <span style={{ fontSize: 10, fontWeight: on ? 800 : 500, color: on ? accDark : faint }}>
                  {it.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
