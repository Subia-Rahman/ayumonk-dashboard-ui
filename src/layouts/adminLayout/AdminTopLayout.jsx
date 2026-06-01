import { cloneElement, isValidElement, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import AyuLogo from "../../components/AyuLogo";
import NotificationBell from "../../components/NotificationBell";
import TenantSwitcher from "../../components/TenantSwitcher";
import { logout } from "../../store/authSlice";
import { useThemeMode } from "../../context/ThemeModeContext";
import usePermissions from "../../hooks/usePermissions";
import { resolveRouteForSlug } from "../../utils/permissions";
import { iconForName, iconForSlug } from "../commonLayout/Layout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import { canonicaliseRawRole } from "../../utils/roleHelper";

// Dark brand palette mirroring /client/dashboard (ClientPage.jsx) so admin
// pages match the reference design pixel-for-pixel.
const C = {
  bg: "#0b160c",
  card: "#111e12",
  border: "#1e3d20",
  g1: "#2C5F2D",
  g2: "#4A8C2A",
  g3: "#6DB33F",
  muted: "#6B8F60",
};

// Sidebar fallback items the previous Layout used for the admin role. Shown
// before /accessible-menus resolves so the top nav isn't empty on first paint.
const FALLBACK_ITEMS = [
  { label: "Dashboard", to: "/admin/dashboard", icon: <DashboardIcon /> },
  { label: "Company Details", to: "/admin/company-details", icon: <BusinessIcon /> },
  { label: "Company Users", to: "/admin/company-users", icon: <PeopleIcon /> },
];

// Render an MUI icon at a small inline size next to the label, matching the
// emoji + label pill style used in /client/dashboard (ClientPage.jsx).
const renderNavIcon = (icon) => {
  if (!isValidElement(icon)) return null;
  return cloneElement(icon, {
    sx: { fontSize: 14, mr: 0.7, verticalAlign: "-2px" },
  });
};

const HR_RAW_ROLES = new Set(["hr", "hrmanager", "hradmin"]);
const CXO_RAW_ROLES = new Set(["cxo", "ceo", "cto", "coo", "cfo"]);

function roleChipLabel(rawRole) {
  const canonical = canonicaliseRawRole(rawRole);
  if (HR_RAW_ROLES.has(canonical)) return "HR MANAGER";
  if (CXO_RAW_ROLES.has(canonical)) return "CXO";
  return "COMPANY ADMIN";
}

// Role-aware chip + avatar colors. Mirrors the in-page "COMPANY ADMIN" pill
// in /admin/dashboard (Dashboard.jsx) and the ROLE_COLORS palette used across
// the client/dashboard reference: admin = purple, HR = blue, CXO = gold.
// Tints (chip background) sit at 0.14 alpha; the brighter `fg` is used for
// chip text and as the second stop of the avatar gradient.
function roleTheme(rawRole) {
  const canonical = canonicaliseRawRole(rawRole);
  if (HR_RAW_ROLES.has(canonical)) {
    return {
      chipBg: "rgba(74,144,196,0.14)",
      chipFg: "#93c5fd",
      avatarFrom: "#4A90C4",
      avatarTo: "#93c5fd",
    };
  }
  if (CXO_RAW_ROLES.has(canonical)) {
    return {
      chipBg: "rgba(212,168,67,0.14)",
      chipFg: "#fbbf24",
      avatarFrom: "#D4A843",
      avatarTo: "#fbbf24",
    };
  }
  // Default = Company Admin (purple), matching the pill rendered inside
  // /admin/dashboard's Admin Panel header.
  return {
    chipBg: "rgba(139,111,203,0.14)",
    chipFg: "#a78bfa",
    avatarFrom: "#8B6FCB",
    avatarTo: "#a78bfa",
  };
}

// Top-only admin shell. Replaces the sidebar Layout for all `/admin/*` routes
// when the logged-in user's normalized role is "admin" (Company Admin / HR /
// CXO). Platform admins keep the existing super-admin sidebar via Layout.jsx.
export default function AdminTopLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleColorMode } = useThemeMode();
  const [menuAnchor, setMenuAnchor] = useState(null);

  const user = useSelector((state) => state.auth.user);
  const rawRole = useSelector((state) => state.auth.rawRole);
  const isPlatformAdmin = useSelector(
    (state) => state.auth.isPlatformAdmin,
  );
  const { menus, loaded } = usePermissions();

  // Permission-aware nav: RBAC-filtered menu list from the backend once it
  // loads, otherwise the same three-item fallback the sidebar used.
  const dynamicItems =
    loaded && Array.isArray(menus)
      ? menus
          .slice()
          .sort((a, b) => {
            const aOrder =
              a?.order_no == null
                ? Number.POSITIVE_INFINITY
                : Number(a.order_no);
            const bOrder =
              b?.order_no == null
                ? Number.POSITIVE_INFINITY
                : Number(b.order_no);
            if (aOrder !== bOrder) return aOrder - bOrder;
            return String(a?.menu_name || "").localeCompare(
              String(b?.menu_name || ""),
            );
          })
          .map((menu) => ({
            label: menu.menu_name,
            to: resolveRouteForSlug(menu.slug, "admin", { isPlatformAdmin }),
            // Prefer the backend-supplied icon name from `menus.icon`; fall
            // back to the slug-based map so legacy rows still render an icon.
            icon: iconForName(menu.icon) || iconForSlug(menu.slug),
            slug: menu.slug,
          }))
          .filter((item) => item.to)
      : null;

  const navItems = dynamicItems && dynamicItems.length
    ? dynamicItems
    : FALLBACK_ITEMS;

  const displayName = user?.name || "Admin User";
  const displayEmail = user?.email || "";
  const initial = (displayName.charAt(0) || "A").toUpperCase();
  const chipLabel = roleChipLabel(rawRole);
  const chipTheme = roleTheme(rawRole);

  const closeMenu = () => setMenuAnchor(null);
  const handleProfile = () => {
    closeMenu();
    navigate("/profile");
  };
  const handleLogout = () => {
    closeMenu();
    dispatch(logout());
    // Pass state: null so a stale `from` redirect can't leak into the next
    // login attempt — matches the sidebar Layout's logout behavior.
    navigate("/login", { replace: true, state: null });
  };

  const isItemActive = (item) =>
    location.pathname === item.to ||
    location.pathname.startsWith(`${item.to}/`);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: "#fff",
        fontFamily:
          "'Plus Jakarta Sans','Outfit','Nunito','Segoe UI',sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Sticky header — logo · tabs · controls */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "11px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(11,22,12,0.94)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        {/* Logo + wordmark */}
        <Link
          to="/admin/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <AyuLogo size={32} />
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 14,
                background: "linear-gradient(90deg,#4a7c2f,#6db33f)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: 0.5,
                lineHeight: 1.1,
              }}
            >
              AYUMONK
            </div>
            <div
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.28)",
                letterSpacing: 1,
                marginTop: 2,
              }}
            >
              WELLNESS INTELLIGENCE PLATFORM
            </div>
          </div>
        </Link>

        {/* Top tabs — desktop */}
        <nav
          style={{
            display: "flex",
            gap: 4,
            background: "rgba(0,0,0,0.4)",
            borderRadius: 12,
            padding: 4,
            overflowX: "auto",
            scrollbarWidth: "none",
            flexShrink: 1,
            margin: "0 auto",
          }}
          className="admin-top-tabs"
        >
          {navItems.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  padding: "7px 16px",
                  borderRadius: 9,
                  fontSize: 11,
                  fontWeight: 600,
                  background: active
                    ? "linear-gradient(135deg,#2C5F2D,#6db33f)"
                    : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.45)",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {renderNavIcon(item.icon)}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <TenantSwitcher />
          <NotificationBell />
          <Tooltip
            title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <IconButton
              size="small"
              onClick={toggleColorMode}
              sx={{ color: "rgba(255,255,255,0.75)" }}
            >
              {mode === "dark" ? (
                <LightModeRoundedIcon fontSize="small" />
              ) : (
                <DarkModeRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          {/* Role chip — matches the in-page "COMPANY ADMIN" pill rendered
              inside /admin/dashboard's header (Dashboard.jsx) and the broader
              ROLE_COLORS palette used across /client/dashboard: fontSize 8,
              radius 5, tight padding, role-tinted background, brighter role
              color for text, subtle letter-spacing. */}
          <span
            style={{
              fontSize: 8,
              background: chipTheme.chipBg,
              color: chipTheme.chipFg,
              borderRadius: 5,
              padding: "2px 8px",
              fontWeight: 700,
              letterSpacing: 0.4,
              whiteSpace: "nowrap",
            }}
            className="admin-role-chip"
          >
            {chipLabel}
          </span>
          <IconButton
            size="small"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={{ p: 0.2 }}
          >
            {/* Avatar — same role color the chip uses, rendered as a 135°
                gradient from the base role color to its lighter variant so
                the chip + avatar read as a single visual unit. */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: `linear-gradient(135deg,${chipTheme.avatarFrom},${chipTheme.avatarTo})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {initial}
            </div>
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  bgcolor: C.card,
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  mt: 1,
                  minWidth: 220,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                  "& .MuiMenuItem-root": {
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 13,
                    py: 1.1,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                  },
                  "& .MuiListItemIcon-root": {
                    color: "rgba(255,255,255,0.75)",
                    minWidth: 30,
                  },
                },
              },
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                minWidth: 220,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#fff",
                  letterSpacing: 0.3,
                }}
              >
                {displayName}
              </div>
              {displayEmail && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#fff",
                    marginTop: 2,
                  }}
                >
                  {displayEmail}
                </div>
              )}
            </div>
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <PersonOutlineIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </div>
      </div>

      {/* Main content */}
      <main
        className="admin-main"
        style={{
          flex: 1,
          padding: "18px 22px",
          minWidth: 0,
        }}
      >
        {children}
      </main>

      {/* Fixed bottom nav — mobile only. Mirrors the user/employee mobile
          layout in BottomNav.jsx so admins on phones tap icons at the bottom
          of the screen instead of unfolding a hamburger menu. */}
      <nav
        className="admin-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "none",
          background: "rgba(7,13,8,0.97)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          zIndex: 50,
          paddingBottom: "env(safe-area-inset-bottom)",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {navItems.map((item) => {
          const active = isItemActive(item);
          return (
            <Link
              key={`bn-${item.to}`}
              to={item.to}
              style={{
                flex: "1 0 auto",
                minWidth: 72,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "9px 6px 8px",
                textDecoration: "none",
                color: active ? C.g3 : "rgba(255,255,255,0.35)",
                position: "relative",
                minHeight: 54,
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "20%",
                    right: "20%",
                    height: 2,
                    background: C.g3,
                    borderRadius: "0 0 3px 3px",
                  }}
                />
              )}
              {isValidElement(item.icon) &&
                cloneElement(item.icon, {
                  sx: {
                    fontSize: active ? 22 : 19,
                    transition: "font-size .15s",
                  },
                })}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  marginTop: 3,
                  letterSpacing: 0.1,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  maxWidth: 80,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Standards footer — matches ClientPage.jsx */}
      <footer
        style={{
          padding: "10px 22px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.16)" }}>
          WHO MHW · SF-12 · Gallup Q12 · UN SDGs · SHRM · Ayurveda Tridosha
        </div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.14)" }}>
          ayumonk.com/corporate © {new Date().getFullYear()}
        </div>
      </footer>

      {/* Hide horizontal scrollbar on the top tab bar */}
      <style>{`
        .admin-top-tabs::-webkit-scrollbar { display: none; }
        .admin-bottom-nav::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .admin-top-tabs { display: none !important; }
          .admin-role-chip { display: none !important; }
          .admin-bottom-nav { display: flex !important; }
          .admin-main { padding-bottom: calc(72px + env(safe-area-inset-bottom)) !important; }
        }
      `}</style>
    </div>
  );
}
