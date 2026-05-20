import { useState } from "react";
import { C } from "../../../components/mobile/palette";

const ROLES = [
  { r: "super_admin", c: C.purple, acc: "Full platform access" },
  { r: "ayumonk_admin", c: C.blue, acc: "All except billing" },
  { r: "hr", c: C.teal, acc: "Company data + analytics" },
  { r: "cxo", c: C.gold, acc: "Analytics read-only" },
  { r: "employee", c: C.g3, acc: "Own data only" },
  { r: "readonly", c: C.muted, acc: "View reports only" },
];

const DEFAULT_TOGGLES = [
  { id: "healthSync", l: "Health Connect auto-sync", on: true },
  { id: "push", l: "PWA push notifications", on: true },
  { id: "ayufinity", l: "Ayufinity marketplace", on: true },
  { id: "teams", l: "Team challenges", on: false },
  { id: "twoTier", l: "Two-tier suggestions", on: true },
];

// Toggles are local state until a platform-config endpoint exists. RBAC role
// table is read-only here; full RBAC editing lives on the desktop
// /super-admin/roles route.
export default function SaSettings() {
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);

  const flip = (id) =>
    setToggles((cur) =>
      cur.map((t) => (t.id === id ? { ...t, on: !t.on } : t)),
    );

  return (
    <div>
      <div style={{ padding: "12px 16px 12px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
          ⚙️ Settings
        </div>
        <div style={{ fontSize: 9, color: C.muted }}>
          Platform configuration · RBAC
        </div>
      </div>

      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 9 }}>
        <div
          style={{
            background: C.card,
            borderRadius: 16,
            padding: 13,
            border: `1px solid ${C.purple}33`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.purple,
              marginBottom: 10,
            }}
          >
            🔐 Role Based Access (RBAC)
          </div>
          {ROLES.map((r) => (
            <div
              key={r.r}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 7,
                paddingBottom: 7,
                borderBottom: "1px solid rgba(255,255,255,.04)",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: r.c }}>
                {r.r}
              </span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,.38)" }}>
                {r.acc}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: C.card,
            borderRadius: 16,
            padding: 13,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,.6)",
              marginBottom: 10,
            }}
          >
            Platform Toggles
          </div>
          {toggles.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 9,
              }}
            >
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.55)" }}>
                {t.l}
              </span>
              <button
                type="button"
                onClick={() => flip(t.id)}
                aria-pressed={t.on}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  background: t.on ? C.g3 : "rgba(255,255,255,.1)",
                  display: "flex",
                  alignItems: "center",
                  padding: 2,
                  cursor: "pointer",
                  transition: "background .2s",
                  border: "none",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    transform: t.on ? "translateX(16px)" : "translateX(0)",
                    transition: "transform .2s",
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
