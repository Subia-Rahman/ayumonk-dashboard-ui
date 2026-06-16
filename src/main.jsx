import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Provider } from "react-redux";
import App from "./App";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";
import { ThemeModeContext } from "./context/ThemeModeContext";
import "./index.css";
import { createAppTheme, getStoredThemeMode, THEME_MODE_KEY } from "./theme";
import store from "./store";
import { initPWAInstallListener } from "./utils/pwaInstall";
import { clearAuthState } from "./store/authSlice";

// Capture beforeinstallprompt before React mounts — the browser fires it once,
// very early, and missing it leaves the in-app install button permanently disabled.
initPWAInstallListener();

// Multi-tab logout sync — when token is cleared in one tab, clear all other tabs too
window.addEventListener('storage', (e) => {
  if (e.key === 'token' && !e.newValue) {
    store.dispatch(clearAuthState());
  }
});

function Root() {
  const [mode, setMode] = useState(() => getStoredThemeMode());

  useEffect(() => {
    window.localStorage.setItem(THEME_MODE_KEY, mode);
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const themeModeValue = useMemo(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((currentMode) => (currentMode === "light" ? "dark" : "light")),
    }),
    [mode],
  );

  return (
    <Provider store={store}>
      <ThemeModeContext.Provider value={themeModeValue}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <App />
            <PWAUpdatePrompt />
          </BrowserRouter>
        </ThemeProvider>
      </ThemeModeContext.Provider>
    </Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <Root />,
);
