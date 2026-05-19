import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Drawer,
  ListItemIcon,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import AyuLogo from "../../components/AyuLogo";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import QuizIcon from "@mui/icons-material/Quiz";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import CategoryIcon from "@mui/icons-material/Category";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import PolicyOutlinedIcon from "@mui/icons-material/PolicyOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import { useThemeMode } from "../../context/ThemeModeContext";
import usePermissions from "../../hooks/usePermissions";
import { resolveRouteForSlug } from "../../utils/permissions";
import NotificationBell from "../../components/NotificationBell";
import PWAInstallBanner from "../../components/PWAInstallBanner";
import TenantSwitcher from "../../components/TenantSwitcher";

const drawerWidth = 260;
const collapsedDrawerWidth = 88;
const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";

const USER_NAV_BG = "#0b160c";
const USER_NAV_ACCENT = "#6DB33F";
const USER_NAV_ACCENT_DARK = "#2C5F2D";
const USER_NAV_MUTED = "#6B8F60";


const USER_TOP_TABS = [
  {
    key: "wellness",
    label: "My Wellness",
    icon: "🌿",
    to: "/user/dashboard?tab=wellness",
    isActive: ({ pathname, tab }) =>
      pathname === "/user/dashboard" && tab !== "challenges",
  },
  {
    key: "challenges",
    label: "Challenges",
    icon: "🎯",
    to: "/user/dashboard?tab=challenges",
    isActive: ({ pathname, tab }) =>
      pathname === "/user/dashboard" && tab === "challenges",
  },
  {
    key: "responses",
    label: "My Responses",
    icon: "📋",
    to: "/user/submissions",
    isActive: ({ pathname }) => pathname.startsWith("/user/submissions"),
  },
];

const ICON_BY_SLUG = {
  dashboard: <DashboardIcon />,
  "company-data": <BusinessIcon />,
  "company-details": <BusinessIcon />,
  "company-users": <PeopleIcon />,
  departments: <AccountTreeOutlinedIcon />,
  questions: <QuizIcon />,
  themes: <CategoryIcon />,
  kpis: <AssessmentIcon />,
  challenges: <EmojiEventsIcon />,
  sessions: <EventIcon />,
  "suggestion-master": <TipsAndUpdatesRoundedIcon />,
  "kpi-suggestion-mapping": <LinkRoundedIcon />,
  roles: <BadgeOutlinedIcon />,
  permissions: <VpnKeyOutlinedIcon />,
  policies: <PolicyOutlinedIcon />,
  "role-assignments": <ManageAccountsOutlinedIcon />,
  menus: <MenuBookOutlinedIcon />,
  "my-responses": <AssignmentTurnedInIcon />,
  submissions: <AssignmentTurnedInIcon />,
  profile: <PersonIcon />,
};

const iconForSlug = (slug) => ICON_BY_SLUG[slug] || <LabelOutlinedIcon />;

const adminItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: <DashboardIcon /> },
  {
    label: "Company Details",
    to: "/admin/company-details",
    icon: <BusinessIcon />,
  },
  { label: "Company Users", to: "/admin/company-users", icon: <PeopleIcon /> },
  // { label: "Themes", to: "/admin/themes", icon: <CategoryIcon /> },
  // { label: "KPIs", to: "/admin/kpis", icon: <AssessmentIcon /> },
  // { label: "Challenges", to: "/admin/challenges", icon: <EmojiEventsIcon /> },
];

const userItems = [
  { label: "Dashboard", to: "/user/dashboard", icon: <DashboardIcon /> },
  {
    label: "My Responses",
    to: "/user/submissions",
    icon: <AssignmentTurnedInIcon />,
  },
];

const superAdminItems = [
  {
    label: "Dashboard",
    to: "/super-admin/dashboard",
    icon: <AdminPanelSettingsIcon />,
  },
  {
    label: "Company Data",
    to: "/super-admin/company-data",
    icon: <BusinessIcon />,
  },
  {
    label: "Company Users",
    to: "/super-admin/company-users",
    icon: <PeopleIcon />,
  },
  {
    label: "Departments",
    to: "/super-admin/departments",
    icon: <AccountTreeOutlinedIcon />,
  },
  { label: "Questions", to: "/super-admin/questions", icon: <QuizIcon /> },
  { label: "Themes", to: "/super-admin/themes", icon: <CategoryIcon /> },
  { label: "KPIs", to: "/super-admin/kpis", icon: <AssessmentIcon /> },
  {
    label: "Challenges",
    to: "/super-admin/challenges",
    icon: <EmojiEventsIcon />,
  },
  { label: "Sessions", to: "/super-admin/sessions", icon: <EventIcon /> },
  {
    label: "Suggestion Master",
    to: "/super-admin/suggestion-master",
    icon: <TipsAndUpdatesRoundedIcon />,
  },
  {
    label: "KPI Suggestion Mapping",
    to: "/super-admin/kpi-suggestion-mapping",
    icon: <LinkRoundedIcon />,
  },
  { label: "Roles", to: "/super-admin/roles", icon: <BadgeOutlinedIcon /> },
  {
    label: "Permissions",
    to: "/super-admin/permissions",
    icon: <VpnKeyOutlinedIcon />,
  },
  {
    label: "Policies",
    to: "/super-admin/policies",
    icon: <PolicyOutlinedIcon />,
  },
  {
    label: "Role Assignments",
    to: "/super-admin/role-assignments",
    icon: <ManageAccountsOutlinedIcon />,
  },
  { label: "Menus", to: "/super-admin/menus", icon: <MenuBookOutlinedIcon /> },
];

export default function Layout({ children, role, title }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { mode, toggleColorMode } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.auth.user);
  const stateRole = useSelector((state) => state.auth.role);
  const isPlatformAdmin = useSelector(
    (state) => state.auth.isPlatformAdmin,
  );
  const profile = user || null;
  const effectiveRole = stateRole || role || "admin";
  const isUserLayout = effectiveRole === "user";
  const isDarkMode = theme.palette.mode === "dark";
  // Light-mode counterpart for the brand-dark user surface — keeps the
  // wellness-product feel without making the page unreadable when the user
  // toggles the theme switcher.
  // Mirrors LIGHT_PALETTE.bg in src/utils/clientPalette.js — a medium-dark
  // sage-slate that lets the existing white-text components remain readable
  // even when the user toggles out of full dark mode.
  const userSurfaceBg = isDarkMode ? USER_NAV_BG : "#34433a";

  const activeUserTab = useMemo(() => {
    const tabParam = searchParams.get("tab") || "";
    return USER_TOP_TABS.find((t) =>
      t.isActive({ pathname: location.pathname, tab: tabParam }),
    );
  }, [location.pathname, searchParams]);

  const { menus, loaded: permissionsLoaded } = usePermissions();

  const dynamicNavItems = (menus || [])
    .slice()
    .sort((a, b) => {
      const aOrder =
        a?.order_no === null || a?.order_no === undefined
          ? Number.POSITIVE_INFINITY
          : Number(a.order_no);
      const bOrder =
        b?.order_no === null || b?.order_no === undefined
          ? Number.POSITIVE_INFINITY
          : Number(b.order_no);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a?.menu_name || "").localeCompare(
        String(b?.menu_name || ""),
      );
    })
    .map((menu) => ({
      label: menu.menu_name,
      to: resolveRouteForSlug(menu.slug, effectiveRole, { isPlatformAdmin }),
      icon: iconForSlug(menu.slug),
      slug: menu.slug,
    }));

  const fallbackNavItems =
    effectiveRole === "user"
      ? userItems
      : effectiveRole === "superadmin"
        ? superAdminItems
        : adminItems;

  // Platform admins (Super Admin / Ayumonk Admin) bypass RBAC entirely
  // (per spec §1) — they always see the complete super-admin sidebar
  // regardless of what /users/me/accessible-menus returns.
  // Tenant users get their menus strictly from the API once bootstrap
  // resolves; until then a fallback is shown so the layout isn't empty.
  let navItems;
  if (isPlatformAdmin) {
    navItems = [
      ...superAdminItems,
      { label: "My Profile", to: "/profile", icon: <PersonIcon /> },
    ];
  } else if (permissionsLoaded) {
    navItems = dynamicNavItems;
  } else {
    navItems = [
      ...fallbackNavItems,
      { label: "My Profile", to: "/profile", icon: <PersonIcon /> },
    ];
  }

  const displayName = profile?.name || "Portal User";
  const displayRole = (profile?.role || effectiveRole).toUpperCase();

  const handleMenuOpen = (event) => setMenuAnchor(event.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  const handleProfile = () => {
    handleMenuClose();
    navigate("/profile");
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    // Pass state: null explicitly so any prior history-state (including a
    // `from` redirect set by RouteGuard while logout is propagating) cannot
    // leak into the next login attempt and bounce the next user into the
    // previous role's URL.
    navigate("/login", { replace: true, state: null });
  };

  const handleSidebarAction = () => {
    if (window.innerWidth < 900) {
      setMobileOpen(true);
      return;
    }
    setSidebarCollapsed((prev) => !prev);
  };

  const activeDrawerWidth = isUserLayout
    ? 0
    : sidebarCollapsed
      ? collapsedDrawerWidth
      : drawerWidth;

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const drawer = (
    <Box sx={{ height: "100%", p: 2.5 }}>
      {/* Sidebar Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarCollapsed ? "center" : "space-between",
          mb: 2,
        }}
      >
        {!sidebarCollapsed && (
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, whiteSpace: "nowrap" }}
          >
            Ayumonk
          </Typography>
        )}

        {/* <IconButton
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          size="small"
        >
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton> */}
      </Box>

      {!sidebarCollapsed && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          {effectiveRole === "admin"
            ? "Admin Workspace"
            : effectiveRole === "superadmin"
              ? "Super Admin Workspace"
              : "User Workspace"}
        </Typography>
      )}

      <List sx={{ p: 0 }}>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(`${item.to}/`);
          const navButton = (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              sx={{
                mb: 1,
                borderRadius: 2,
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                px: sidebarCollapsed ? 1 : 2,
                bgcolor: isActive ? "primary.main" : "transparent",
                color: isActive ? "primary.contrastText" : "text.primary",
                "&:hover": {
                  bgcolor: isActive ? "primary.dark" : "action.hover",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarCollapsed ? 0 : 2,
                  justifyContent: "center",
                  color: "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>

              {/* TEXT */}
              {!sidebarCollapsed && (
                <ListItemText
                  primary={item.label}
                  sx={{
                    opacity: sidebarCollapsed ? 0 : 1,
                  }}
                />
              )}
            </ListItemButton>
          );

          return sidebarCollapsed ? (
            <Tooltip key={item.to} title={item.label} placement="right" arrow>
              {navButton}
            </Tooltip>
          ) : (
            navButton
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: isUserLayout ? userSurfaceBg : "transparent",
      }}
    >
      <AppBar
        color="transparent"
        elevation={0}
        sx={{
          width: isUserLayout
            ? "100%"
            : { md: `calc(100% - ${activeDrawerWidth}px)` },
          ml: isUserLayout ? 0 : { md: `${activeDrawerWidth}px` },
          borderBottom: "1px solid",
          borderColor: isUserLayout
            ? isDarkMode
              ? "rgba(255,255,255,0.06)"
              : "rgba(15,23,42,0.08)"
            : "divider",
          backdropFilter: "blur(8px)",
          bgcolor: isUserLayout
            ? userSurfaceBg
            : alpha(theme.palette.background.default, 0.8),
          color: isUserLayout
            ? isDarkMode
              ? "#fff"
              : theme.palette.text.primary
            : "inherit",
          transition: (theme) =>
            theme.transitions.create(["width", "margin-left"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.shorter,
            }),
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, sm: 72 },
            gap: 1.5,
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          {!isUserLayout && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleSidebarAction}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {isUserLayout ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mr: 1 }}>
              <AyuLogo size={28} />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: USER_NAV_ACCENT,
                    fontSize: 16,
                    lineHeight: 1.1,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Ayumonk
                </Typography>
                <Typography
                  sx={{
                    fontSize: 9,
                    color: USER_NAV_MUTED,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  Wellness Intelligence Platform
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {title || "Ayumonk"}
            </Typography>
          )}

          {isUserLayout && (
            <Box
              sx={{
                display: "flex",
                flexGrow: 1,
                justifyContent: { xs: "flex-start", md: "center" },
                order: { xs: 3, md: 0 },
                width: { xs: "100%", md: "auto" },
                mx: { xs: 0, md: 2 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: "4px",
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: "12px",
                  padding: "4px",
                }}
              >
                {USER_TOP_TABS.map((tab) => {
                  const active = activeUserTab?.key === tab.key;
                  return (
                    <Button
                      key={tab.key}
                      component={Link}
                      to={tab.to}
                      disableRipple
                      startIcon={
                        <Box component="span" sx={{ fontSize: 13, lineHeight: 1 }}>
                          {tab.icon}
                        </Box>
                      }
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: "9px",
                        px: "16px",
                        py: "7px",
                        minHeight: 0,
                        minWidth: 0,
                        fontSize: 11,
                        lineHeight: 1,
                        color: active ? "#fff" : "rgba(255,255,255,0.38)",
                        background: active
                          ? `linear-gradient(135deg, ${USER_NAV_ACCENT_DARK}, ${USER_NAV_ACCENT})`
                          : "transparent",
                        boxShadow: "none",
                        transition: "all 0.25s",
                        "&:hover": {
                          background: active
                            ? `linear-gradient(135deg, ${USER_NAV_ACCENT_DARK}, ${USER_NAV_ACCENT})`
                            : "transparent",
                          color: active ? "#fff" : "rgba(255,255,255,0.7)",
                        },
                        "& .MuiButton-startIcon": { mr: "6px", ml: 0 },
                      }}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </Box>
            </Box>
          )}

          <Box
            sx={{
              ml: isUserLayout ? 0 : "auto",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            {!isPlatformAdmin && !isUserLayout && <TenantSwitcher />}
            {effectiveRole === "user" && <NotificationBell />}
            <Tooltip
              title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <IconButton
                onClick={toggleColorMode}
                sx={{ color: isUserLayout ? "rgba(255,255,255,0.75)" : "inherit" }}
              >
                {mode === "dark" ? (
                  <LightModeRoundedIcon />
                ) : (
                  <DarkModeRoundedIcon />
                )}
              </IconButton>
            </Tooltip>
            <Chip
              size="small"
              label={displayRole}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                bgcolor: isUserLayout
                  ? alpha(USER_NAV_ACCENT, 0.18)
                  : alpha(theme.palette.primary.main, 0.16),
                color: isUserLayout ? USER_NAV_ACCENT : "primary.main",
                fontWeight: 700,
              }}
            />
            <IconButton onClick={handleMenuOpen} sx={{ p: 0.4 }}>
              <Avatar
                sx={{
                  bgcolor: isUserLayout ? USER_NAV_ACCENT : "primary.main",
                  width: 38,
                  height: 38,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box sx={{ px: 2, py: 1.2 }}>
              <Typography sx={{ fontWeight: 700 }}>{displayName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {profile?.email || "No email"}
              </Typography>
            </Box>
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
        </Toolbar>
      </AppBar>

      {!isUserLayout && (
        <Box
          component="nav"
          sx={{ width: { md: activeDrawerWidth }, flexShrink: { md: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                scrollbarWidth: "thin",
                scrollbarColor: `${alpha(theme.palette.text.primary, 0.18)} transparent`,
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  background: alpha(theme.palette.text.primary, 0.18),
                  borderRadius: 999,
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: alpha(theme.palette.text.primary, 0.32),
                },
              },
            }}
          >
            {drawer}
          </Drawer>

          <Drawer
            variant="permanent"
            open
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                width: activeDrawerWidth,
                boxSizing: "border-box",
                borderRight: "1px solid",
                borderColor: "divider",
                bgcolor: alpha(theme.palette.background.paper, 0.78),
                backdropFilter: "blur(8px)",
                overflowX: "hidden",
                transition: (theme) =>
                  theme.transitions.create("width", {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.shorter,
                  }),
                scrollbarWidth: "thin",
                scrollbarColor: `${alpha(theme.palette.text.primary, 0.18)} transparent`,
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  background: alpha(theme.palette.text.primary, 0.18),
                  borderRadius: 999,
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: alpha(theme.palette.text.primary, 0.32),
                },
              },
            }}
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3 },
          mt: { xs: isUserLayout ? 10 : 8, sm: isUserLayout ? 11 : 9 },
          ...(isUserLayout
            ? {
                bgcolor: userSurfaceBg,
                color: isDarkMode ? "#fff" : theme.palette.text.primary,
                colorScheme: isDarkMode ? "dark" : "light",
                minHeight: {
                  xs: "calc(100vh - 80px)",
                  sm: "calc(100vh - 88px)",
                },
              }
            : {}),
        }}
      >
        {effectiveRole === "user" && (
          <PWAInstallBanner darkSurface={isDarkMode} />
        )}
        {children}
      </Box>
    </Box>
  );
}
