import { C } from "../../components/mobile/palette";

// Fixed bottom tab bar shared by every mobile screen. Tab switching is local
// state on the role workspace (EmployeeApp / HrApp / SuperAdminApp) — no URL
// change — so the bar feels native.
export default function BottomNav({ items, active, onNav, accent = C.g3 }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        background: "rgba(7,13,8,.97)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((t) => {
        const on = active === t.id;
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
              color: on ? accent : "rgba(255,255,255,0.3)",
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
                  background: accent,
                  borderRadius: "0 0 3px 3px",
                }}
              />
            )}
            <span
              style={{
                fontSize: on ? 20 : 17,
                lineHeight: 1,
                transition: "font-size .15s",
              }}
            >
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
