import { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InstallMobileRoundedIcon from "@mui/icons-material/InstallMobileRounded";
import {
  consumeDeferredPrompt,
  getDeferredPrompt,
  isAppInstalled,
  markInstalled,
  subscribePWAInstall,
} from "../utils/pwaInstall";

const DISMISS_KEY = "pwa_install_dismissed";

const isIOSDevice = () =>
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  if (window.navigator?.standalone === true) return true;
  return false;
};

// Session-only dismissal: clicking "Later" hides the banner for the rest of
// the current browser session, but it returns next session so the user can
// still install. This mirrors the in-memory dismissal used in the client
// reference. Use sessionStorage (not localStorage) so a closed tab resets it.
const wasDismissedThisSession = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};

const persistDismissal = () => {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // sessionStorage unavailable (private mode quota etc.) — fall back to
    // in-memory state only. The banner will still hide for this render
    // cycle via setDismissed(true).
  }
};

export default function PWAInstallBanner({ darkSurface = false } = {}) {
  const theme = useTheme();
  const accent = darkSurface ? "#6DB33F" : theme.palette.primary.main;
  const surfaceBg = darkSurface
    ? "rgba(107,179,63,0.06)"
    : alpha(accent, 0.06);
  const surfaceBorder = darkSurface
    ? "rgba(107,179,63,0.28)"
    : alpha(accent, 0.35);
  const bodyTextColor = darkSurface
    ? "rgba(255,255,255,0.6)"
    : "text.secondary";
  const tipTextColor = darkSurface
    ? "rgba(255,255,255,0.45)"
    : "text.secondary";
  const closeIconColor = darkSurface ? "rgba(255,255,255,0.55)" : undefined;
  const laterBtnColor = darkSurface
    ? "rgba(255,255,255,0.75)"
    : "text.secondary";
  const laterBtnBorder = darkSurface ? "rgba(255,255,255,0.18)" : "divider";
  const [ios] = useState(isIOSDevice);
  const [standalone] = useState(isStandaloneMode);
  const [dismissed, setDismissed] = useState(wasDismissedThisSession);
  const [deferredPrompt, setDeferredPrompt] = useState(() => getDeferredPrompt());
  const [installed, setInstalled] = useState(() => isAppInstalled());
  const [iosStep, setIosStep] = useState(1);

  useEffect(() => {
    // Clean up the previous persistent localStorage flag (if any) — that
    // version dismissed forever, which is too aggressive.
    try {
      window.localStorage.removeItem("pwa_install_dismissed_at");
    } catch {
      // ignore
    }

    // The actual beforeinstallprompt listener lives in src/utils/pwaInstall.js
    // (initialized in main.jsx before React renders) because the event fires
    // once, very early in page load — well before this component mounts.
    return subscribePWAInstall(() => {
      setDeferredPrompt(getDeferredPrompt());
      setInstalled(isAppInstalled());
    });
  }, []);

  if (standalone || dismissed) return null;

  const handleDismiss = () => {
    persistDismissal();
    setDismissed(true);
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        markInstalled();
      } else {
        consumeDeferredPrompt();
      }
    } catch {
      // Browser declined — clear the prompt; banner stays up so user can retry
      // via the browser menu.
      consumeDeferredPrompt();
    }
  };

  if (installed) {
    return (
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          px: 2,
          py: 1.25,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: darkSurface
            ? "rgba(22,163,74,0.4)"
            : alpha("#16a34a", 0.4),
          bgcolor: darkSurface
            ? "rgba(22,163,74,0.1)"
            : alpha("#16a34a", 0.1),
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Typography sx={{ fontSize: 22 }}>✅</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: darkSurface ? "#4ade80" : "#15803d", fontSize: 13 }}>
              AyuMonk installed!
            </Typography>
            <Typography variant="caption" sx={{ color: bodyTextColor }}>
              Open from your home screen for the best experience and
              notifications.
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleDismiss} sx={{ color: closeIconColor }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>
    );
  }

  if (ios) {
    const steps = [
      {
        n: "1",
        label: "Tap the Share button",
        icon: "□↑",
        color: "#2563eb",
      },
      {
        n: "2",
        label: "Scroll and tap 'Add to Home Screen'",
        icon: "⊞+",
        color: "#16a34a",
      },
      {
        n: "3",
        label: "Tap 'Add' in the top right",
        icon: "✓",
        color: "#d97706",
      },
    ];
    return (
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          px: 2,
          py: 1.5,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: surfaceBorder,
          bgcolor: surfaceBg,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: 22 }}>📲</Typography>
            <Box>
              <Typography
                sx={{ fontWeight: 700, color: accent, fontSize: 13 }}
              >
                Install AyuMonk on your iPhone
              </Typography>
              <Typography variant="caption" sx={{ color: bodyTextColor }}>
                3 steps · Takes 15 seconds · Enables push notifications
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={handleDismiss} sx={{ color: closeIconColor }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={1}>
          {steps.map((step) => {
            const active = iosStep >= Number(step.n);
            return (
              <Box
                key={step.n}
                onClick={() => setIosStep(Math.max(iosStep, Number(step.n) + 1))}
                sx={{
                  flex: 1,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: alpha(step.color, 0.35),
                  bgcolor: alpha(step.color, 0.1),
                  px: 1,
                  py: 1,
                  textAlign: "center",
                  opacity: active ? 1 : 0.5,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
              >
                <Typography sx={{ fontSize: 22, mb: 0.5 }}>
                  {step.icon}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: step.color,
                    display: "block",
                    fontSize: 10,
                  }}
                >
                  Step {step.n}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", fontSize: 10, lineHeight: 1.4 }}
                >
                  {step.label}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        px: 2,
        py: 1.25,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: surfaceBorder,
        bgcolor: surfaceBg,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "center" }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: darkSurface ? "rgba(107,179,63,0.14)" : alpha(accent, 0.12),
            color: accent,
            flexShrink: 0,
          }}
        >
          <InstallMobileRoundedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: accent, fontSize: 13 }}>
            Install AyuMonk on your device
          </Typography>
          <Typography variant="caption" sx={{ color: bodyTextColor }}>
            Add to home screen for daily reminders, offline access, and an
            app-like experience. No App Store required.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleAndroidInstall}
            disabled={!deferredPrompt}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              px: 2,
              ...(darkSurface
                ? {
                    bgcolor: accent,
                    color: "#fff",
                    "&:hover": { bgcolor: "#5ea033" },
                    "&.Mui-disabled": {
                      bgcolor: "rgba(107,179,63,0.18)",
                      color: "rgba(255,255,255,0.45)",
                    },
                  }
                : {}),
            }}
          >
            Install Now
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDismiss}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: laterBtnColor,
              borderColor: laterBtnBorder,
              "&:hover": darkSurface
                ? { borderColor: "rgba(255,255,255,0.35)", bgcolor: "rgba(255,255,255,0.04)" }
                : undefined,
            }}
          >
            Later
          </Button>
        </Stack>
      </Stack>
      {!deferredPrompt && (
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 0.75, color: tipTextColor }}
        >
          Tip: open your browser menu and choose &quot;Install app&quot; or
          &quot;Add to Home Screen&quot; if the install prompt isn&apos;t
          available yet.
        </Typography>
      )}
    </Paper>
  );
}
