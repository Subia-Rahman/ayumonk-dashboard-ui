import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Logo } from "../../components/mobile/primitives";
import { C } from "../../components/mobile/palette";
import { logout } from "../../store/authSlice";
import {
  fetchUnreadCount,
} from "../../store/notificationsSlice";

// Persistent brand header at the top of every mobile screen. Replaces the
// per-screen headers that used to live inside Wellness / HR Home / SA Home,
// so the logo, notification bell, and account avatar stay anchored as the
// user switches bottom-nav tabs.
export default function MobileHeader({
  roleLabel = "WELLNESS PLATFORM",
  roleLabelColor,
  accent = C.g3,
  badgeColor,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const unread = useSelector((state) => state.notifications.unread);

  useEffect(() => {
    dispatch(fetchUnreadCount()).catch(() => {});
  }, [dispatch]);

  // Close the avatar menu on outside click.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [menuOpen]);

  const initial = ((user?.name || "U").trim()[0] || "U").toUpperCase();
  const badge = badgeColor || accent;
  const labelColor = roleLabelColor || "rgba(255,255,255,.2)";

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: C.bg,
        borderBottom: "1px solid rgba(255,255,255,.04)",
        padding: "10px 16px 10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Logo s={22} />
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              background: "linear-gradient(90deg,#4a7c2f,#6db33f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
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

      <div
        ref={menuRef}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          position: "relative",
        }}
      >
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => {
            closeMenu();
            navigate("/profile");
          }}
          style={{
            position: "relative",
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(255,255,255,.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            cursor: "pointer",
            padding: 0,
          }}
        >
          🔔
          {unread > 0 && (
            <span
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                minWidth: 14,
                height: 14,
                padding: "0 3px",
                borderRadius: "50%",
                background: badge,
                border: `2px solid ${C.bg}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 7,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `linear-gradient(135deg,${C.g1},${accent})`,
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

        {menuOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 6px)",
              minWidth: 180,
              background: C.card2,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 6,
              boxShadow: "0 12px 32px rgba(0,0,0,.45)",
            }}
          >
            <div
              style={{
                padding: "8px 10px 10px",
                borderBottom: "1px solid rgba(255,255,255,.05)",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
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
                    color: C.muted,
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
              onClick={() => {
                closeMenu();
                navigate("/profile");
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,.85)",
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
                color: "#f87171",
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
