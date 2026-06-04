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

const C = {
  bg: "#0b160c",
  card: "#111e12",
  border: "#1e3d20",
  g1: "#2C5F2D",
  g2: "#4A8C2A",
  g3: "#6DB33F",
  muted: "#6B8F60",
  sidebarW: 220,
};

const FALLBACK_ITEMS = [
  { label: "Dashboard", to: "/admin/dashboard", icon: <DashboardIcon /> },
  { label: "Company Details", to: "/admin/company-details", icon: <BusinessIcon /> },
  { label: "Company Users", to: "/admin/company-users", icon: <PeopleIcon /> },
];

const renderNavIcon = (icon, size = 16) => {
  if (!isValidElement(icon)) return null;
  return cloneElement(icon, { sx: { fontSize: size } });
};

const HR_RAW_ROLES = new Set(["hr", "hrmanager", "hradmin"]);
const CXO_RAW_ROLES = new Set(["cxo", "ceo", "cto", "coo", "cfo"]);

function roleChipLabel(rawRole) {
  const canonical = canonicaliseRawRole(rawRole);
  if (HR_RAW_ROLES.has(canonical)) return "HR MANAGER";
  if (CXO_RAW_ROLES.has(canonical)) return "CXO";
  return "COMPANY ADMIN";
}

function roleTheme(rawRole) {
  const canonical = canonicaliseRawRole(rawRole);
  if (HR_RAW_ROLES.has(canonical)) {
    return { chipBg: "rgba(74,144,196,0.14)", chipFg: "#93c5fd", avatarFrom: "#4A90C4", avatarTo: "#93c5fd" };
  }
  if (CXO_RAW_ROLES.has(canonical)) {
    return { chipBg: "rgba(212,168,67,0.14)", chipFg: "#fbbf24", avatarFrom: "#D4A843", avatarTo: "#fbbf24" };
  }
  return { chipBg: "rgba(139,111,203,0.14)", chipFg: "#a78bfa", avatarFrom: "#8B6FCB", avatarTo: "#a78bfa" };
}

export default function AdminTopLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleColorMode } = useThemeMode();
  const [menuAnchor, setMenuAnchor] = useState(null);

  const user = useSelector((state) => state.auth.user);
  const rawRole = useSelector((state) => state.auth.rawRole);
  const isPlatformAdmin = useSelector((state) => state.auth.isPlatformAdmin);
  const { menus, loaded } = usePermissions();

  const dynamicItems =
    loaded && Array.isArray(menus)
      ? menus
          .slice()
          .sort((a, b) => {
            const aOrder = a?.order_no == null ? Number.POSITIVE_INFINITY : Number(a.order_no);
            const bOrder = b?.order_no == null ? Number.POSITIVE_INFINITY : Number(b.order_no);
            if (aOrder !== bOrder) return aOrder - bOrder;
            return String(a?.menu_name || "").localeCompare(String(b?.menu_name || ""));
          })
          .map((menu) => ({
            label: menu.menu_name,
            to: resolveRouteForSlug(menu.slug, "admin", { isPlatformAdmin }),
            icon: iconForName(menu.icon) || iconForSlug(menu.slug),
            slug: menu.slug,
          }))
          .filter((item) => item.to)
      : null;

  const navItems = dynamicItems && dynamicItems.length ? dynamicItems : FALLBACK_ITEMS;

  const displayName = user?.name || "Admin User";
  const displayEmail = user?.email || "";
  const initial = (displayName.charAt(0) || "A").toUpperCase();
  const chipLabel = roleChipLabel(rawRole);
  const chipTheme = roleTheme(rawRole);

  const closeMenu = () => setMenuAnchor(null);
  const handleProfile = () => { closeMenu(); navigate("/profile"); };
  const handleLogout = () => {
    closeMenu();
    dispatch(logout());
    navigate("/login", { replace: true, state: null });
  };

  const isItemActive = (item) =>
    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: "#fff",
        fontFamily: "'Plus Jakarta Sans','Outfit','Nunito','Segoe UI',sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top header bar (logo + right controls) ── */}
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
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", letterSpacing: 1, marginTop: 2 }}>
              WELLNESS INTELLIGENCE PLATFORM
            </div>
          </div>
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right cluster */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <TenantSwitcher />
          <NotificationBell />
          <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton size="small" onClick={toggleColorMode} sx={{ color: "rgba(255,255,255,0.75)" }}>
              {mode === "dark" ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <span
            className="admin-role-chip"
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
          >
            {chipLabel}
          </span>
          <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ p: 0.2 }}>
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
                  "& .MuiMenuItem-root": { color: "rgba(255,255,255,0.85)", fontSize: 13, py: 1.1, "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } },
                  "& .MuiListItemIcon-root": { color: "rgba(255,255,255,0.75)", minWidth: 30 },
                },
              },
            }}
          >
            <div style={{ padding: "12px 16px", minWidth: 220, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: 0.3 }}>{displayName}</div>
              {displayEmail && <div style={{ fontSize: 11, color: "#fff", marginTop: 2 }}>{displayEmail}</div>}
            </div>
            <MenuItem onClick={handleProfile}>
              <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </div>
      </div>

      {/* ── Body: vertical sidebar + main content ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* Vertical sidebar — desktop only */}
        <nav
          className="admin-side-nav"
          style={{
            width: C.sidebarW,
            flexShrink: 0,
            background: "rgba(11,22,12,0.97)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            padding: "16px 10px",
            gap: 2,
            overflowY: "auto",
            scrollbarWidth: "none",
            position: "sticky",
            top: 55,           /* height of the header bar */
            height: "calc(100vh - 55px)",
          }}
        >
          {navItems.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 14px",
                  borderRadius: 9,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  background: active ? "linear-gradient(135deg,#2C5F2D,#6db33f)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.5)",
                  textDecoration: "none",
                  transition: "all 0.18s",
                  borderLeft: active ? "none" : "3px solid transparent",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(109,179,63,0.08)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                  }
                }}
              >
                <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                  {renderNavIcon(item.icon, 17)}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Main content */}
        <main
          className="admin-main"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "18px 22px",
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </div>

      {/* ── Fixed bottom nav — mobile only ── */}
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
                cloneElement(item.icon, { sx: { fontSize: active ? 22 : 19, transition: "font-size .15s" } })}
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

      {/* ── Footer ── */}
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

      <style>{`
        .admin-side-nav::-webkit-scrollbar { display: none; }
        .admin-bottom-nav::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .admin-side-nav  { display: none !important; }
          .admin-role-chip { display: none !important; }
          .admin-bottom-nav { display: flex !important; }
          .admin-main { padding-bottom: calc(72px + env(safe-area-inset-bottom)) !important; }
        }
      `}</style>
    </div>
  );
}
