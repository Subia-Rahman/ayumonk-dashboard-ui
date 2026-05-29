import { alpha, createTheme } from "@mui/material/styles";

export const THEME_MODE_KEY = "appThemeMode";

// Helper: returns a tinted background for elevated surfaces (kept for backward compat)
export function getSurfaceBackground(theme, opacity = 0.86) {
  return alpha(
    theme.palette.background.paper,
    theme.palette.mode === "dark" ? Math.max(opacity, 0.92) : opacity,
  );
}

// Helper: subtle accent gradient for hero / raised cards (kept for backward compat)
export function getRaisedGradient(theme, accent = theme.palette.primary.main) {
  const isDark = theme.palette.mode === "dark";
  return `linear-gradient(135deg, ${alpha(accent, isDark ? 0.12 : 0.06)} 0%, ${getSurfaceBackground(theme, isDark ? 0.98 : 0.96)} 100%)`;
}

// Default to light mode now (Claude-inspired primary aesthetic).
export function getStoredThemeMode() {
  if (typeof window === "undefined") return "light";
  const storedMode = window.localStorage.getItem(THEME_MODE_KEY);
  return storedMode === "dark" ? "dark" : "light";
}

// ---- Design tokens ----
const tokens = {
  light: {
    background: "#F5F2EB",
    paper: "#FBF9F4",
    primary: "#6B7F5C",
    primaryDark: "#4F6048",
    primaryLight: "#93A687",
    secondary: "#B96B47",
    textPrimary: "#1F1E1D",
    textSecondary: "#6B6760",
    divider: "rgba(31, 30, 29, 0.08)",
    success: "#4F7A5E",
    warning: "#B57F4A",
    error: "#B85A4A",
    info: "#6B7F8C",
  },
  dark: {
    background: "#1A1817",
    paper: "#252321",
    primary: "#9DAD93",
    primaryDark: "#7E8F75",
    primaryLight: "#B8C5AE",
    secondary: "#D49374",
    textPrimary: "#F0EDE5",
    textSecondary: "#A09D95",
    divider: "rgba(240, 237, 229, 0.08)",
    success: "#7DA889",
    warning: "#D9A871",
    error: "#D88273",
    info: "#9CB0BC",
  },
};

export function createAppTheme(mode = "light") {
  const isDark = mode === "dark";
  const t = isDark ? tokens.dark : tokens.light;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: t.primary,
        dark: t.primaryDark,
        light: t.primaryLight,
        contrastText: isDark ? "#1A1817" : "#FFFFFF",
      },
      secondary: { main: t.secondary, contrastText: "#FFFFFF" },
      background: { default: t.background, paper: t.paper },
      text: { primary: t.textPrimary, secondary: t.textSecondary },
      divider: t.divider,
      success: { main: t.success },
      warning: { main: t.warning },
      error: { main: t.error },
      info: { main: t.info },
    },
    typography: {
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      h1: { fontWeight: 600, letterSpacing: "-0.02em" },
      h2: { fontWeight: 600, letterSpacing: "-0.02em" },
      h3: { fontWeight: 600, letterSpacing: "-0.01em" },
      h4: { fontWeight: 600, letterSpacing: "-0.01em" },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 500, textTransform: "none" },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            minHeight: "100vh",
            backgroundColor: t.background,
            backgroundImage: "none", // removes the radial casino glow
            color: t.textPrimary,
          },
          html: {
            scrollbarWidth: "thin",
            scrollbarColor: `${alpha(t.textPrimary, 0.22)} transparent`,
          },
          "html::-webkit-scrollbar, body::-webkit-scrollbar": {
            width: 6,
            height: 6,
          },
          "html::-webkit-scrollbar-track, body::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "html::-webkit-scrollbar-thumb, body::-webkit-scrollbar-thumb": {
            background: alpha(t.textPrimary, 0.22),
            borderRadius: 999,
          },
          "html::-webkit-scrollbar-thumb:hover, body::-webkit-scrollbar-thumb:hover": {
            background: alpha(t.textPrimary, 0.38),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: t.paper,
            border: `1px solid ${t.divider}`,
            boxShadow: "none",
          },
          elevation1: {
            boxShadow: isDark
              ? "0 1px 2px rgba(0,0,0,0.3)"
              : "0 1px 2px rgba(31,30,29,0.04)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${t.divider}`,
            boxShadow: "none",
            backgroundColor: t.paper,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: "8px 18px",
            minHeight: 40,
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
          containedPrimary: {
            backgroundColor: t.primary,
            color: isDark ? "#1A1817" : "#FFFFFF",
            "&:hover": { backgroundColor: t.primaryDark },
            "&.Mui-disabled": {
              backgroundColor: alpha(t.textPrimary, 0.08),
              color: alpha(t.textPrimary, 0.32),
            },
          },
          outlined: {
            borderColor: alpha(t.textPrimary, 0.16),
            "&:hover": {
              borderColor: t.primary,
              backgroundColor: alpha(t.primary, 0.04),
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? alpha("#FFFFFF", 0.02) : "#FFFFFF",
            "& fieldset": { borderColor: alpha(t.textPrimary, 0.12) },
            "&:hover fieldset": { borderColor: alpha(t.textPrimary, 0.24) },
            "&.Mui-focused fieldset": { borderColor: t.primary, borderWidth: 1.5 },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: t.background,
            backgroundImage: "none",
            color: t.textPrimary,
            boxShadow: "none",
            borderBottom: `1px solid ${t.divider}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: t.paper,
            backgroundImage: "none",
            borderRight: `1px solid ${t.divider}`,
          },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: t.divider } },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 500, minHeight: 44 },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            borderColor: t.divider,
            backgroundColor: t.paper,
            "& .MuiDataGrid-virtualScroller": {
              scrollbarWidth: "thin",
              scrollbarColor: `${alpha(t.textPrimary, 0.22)} transparent`,
            },
            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": {
              width: 6, height: 6,
            },
            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": {
              background: alpha(t.textPrimary, 0.22),
              borderRadius: 999,
            },
            "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover": {
              background: alpha(t.textPrimary, 0.38),
            },
          },
          columnHeaders: {
            backgroundColor: alpha(t.primary, isDark ? 0.06 : 0.04),
            borderBottomColor: t.divider,
            fontWeight: 600,
          },
          cell: { borderBottomColor: t.divider },
          footerContainer: { borderTopColor: t.divider },
        },
      },
    },
  });
}