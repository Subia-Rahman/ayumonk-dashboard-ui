import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Logo } from "../../components/mobile/primitives";
import NotificationBell from "../../components/NotificationBell";
import { useMobileTheme } from "../../components/mobile/palette";
import { logout } from "../../store/authSlice";

export default function MobileHeader({
  roleLabel = "WELLNESS PLATFORM",
  roleLabelColor,
  accent,
  onProfileShortcut,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { palette, isDark, toggle } = useMobileTheme();
  const resolvedAccent = accent || palette.g3;

  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [menuOpen]);

  const initial = ((user?.name || "U").trim()[0] || "U").toUpperCase();
  const labelColor = roleLabelColor || palette.muted;
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  // Icon button surface adapts to light/dark
  const iconBtnBg     = isDark ? "rgba(255,255,255,.05)"  : "rgba(31,30,29,.05)";
  const iconBtnBorder = isDark ? "rgba(255,255,255,.08)"  : "rgba(31,30,29,.09)";

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: palette.bg,
        borderBottom: `1px solid ${palette.border}`,
        padding: "10px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Logo s={22} />
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: palette.g3,
              lineHeight: 1,
            }}
          >
            AYUMONK
          </div>
          <div
            style={{
              fontSize: 7,
              color: labelColor,
              letterSpacing: 0.8,
              marginTop: 2,
            }}
          >
            {roleLabel}
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div
        ref={menuRef}
        style={{ display: "flex", gap: 6, alignItems: "center", position: "relative" }}
      >
        {/* Dark-mode toggle */}
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={toggle}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: iconBtnBg,
            border: `1px solid ${iconBtnBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {/* Notifications — full panel, same component as desktop */}
        <NotificationBell />

        {/* Avatar */}
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${palette.g1}, ${resolvedAccent})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            color: "#fff",
            cursor: "pointer",
            border: "none",
            padding: 0,
          }}
        >
          {initial}
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 6px)",
              minWidth: 180,
              background: palette.card2,
              border: `1px solid ${palette.border}`,
              borderRadius: 12,
              padding: 6,
              boxShadow: isDark
                ? "0 12px 32px rgba(0,0,0,.45)"
                : "0 8px 24px rgba(31,30,29,.12)",
              zIndex: 100,
            }}
          >
            {/* User info */}
            <div
              style={{
                padding: "8px 10px 10px",
                borderBottom: `1px solid ${palette.border}`,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: palette.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.name || "User"}
              </div>
              {user?.email && (
                <div
                  style={{
                    fontSize: 9,
                    color: palette.muted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.email}
                </div>
              )}
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={() => { closeMenu(); onProfileShortcut ? onProfileShortcut() : navigate("/profile"); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                background: "transparent",
                border: "none",
                color: palette.text,
                fontSize: 11,
                cursor: "pointer",
                borderRadius: 8,
              }}
            >
              👤 Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                background: "transparent",
                border: "none",
                color: palette.red,
                fontSize: 11,
                cursor: "pointer",
                borderRadius: 8,
              }}
            >
              ↪ Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
