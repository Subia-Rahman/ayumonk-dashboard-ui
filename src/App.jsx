import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AppRoutes from "./routes/AppRoutes";
import MobileRoutes from "./routes/MobileRoutes";
import OnboardingGate from "./components/OnboardingGate";
import { loadAuthorization } from "./store/permissionSlice";
import { syncPushSubscriptionWithBackend } from "./hooks/usePushNotifications";
import useIsMobile from "./hooks/useIsMobile";

function App() {
  const dispatch = useDispatch();
  const authenticated = useSelector((state) => state.auth.isAuthenticated);
  const loaded = useSelector((state) => state.permission.loaded);
  const loading = useSelector((state) => state.permission.loading);
  // Branches between the existing MUI desktop surface and the dark mobile
  // PWA design. Installed PWAs and narrow viewports get MobileRoutes;
  // desktop browsers keep the original AppRoutes untouched.
  const isMobile = useIsMobile();

  useEffect(() => {
    if (authenticated && !loaded && !loading) {
      dispatch(loadAuthorization());
    }
  }, [authenticated, loaded, loading, dispatch]);

  // Re-attach any anonymous browser push subscription to the user once they
  // log in. No-ops if push is unsupported or no subscription exists yet.
  useEffect(() => {
    if (!authenticated) return;
    syncPushSubscriptionWithBackend();
  }, [authenticated]);

  return (
    <OnboardingGate>
      {isMobile ? <MobileRoutes /> : <AppRoutes />}
    </OnboardingGate>
  );
}

export default App;