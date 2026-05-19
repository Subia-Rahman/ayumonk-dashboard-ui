import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { clearAuthError, loginUser, setAuthError } from "../../store/authSlice";
import { loadAuthorization } from "../../store/permissionSlice";
import { getHomePath, isPathAllowedForRole } from "../../utils/roleHelper";
import { getSurfaceBackground } from "../../theme";
import AyuLogo from "../../components/AyuLogo";

export default function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error } = useSelector((state) => state.auth);

  const handleLogin = async (event) => {
    event.preventDefault();
    dispatch(clearAuthError());

    if (!username.trim() || !password.trim()) {
      dispatch(setAuthError("Please enter both username and password."));
      return;
    }

    try {
      const result = await dispatch(
        loginUser({
          username: username.trim(),
          password,
        }),
      ).unwrap();

      await dispatch(loadAuthorization({ force: true }));

      const homeTarget = getHomePath({
        isPlatformAdmin: result.isPlatformAdmin,
        role: result.role,
        rawRole: result.rawRole,
      });
      const fromPath = location.state?.from?.pathname;
      const honorFrom =
        fromPath &&
        isPathAllowedForRole(fromPath, {
          role: result.role,
          isPlatformAdmin: result.isPlatformAdmin,
        });
      const target = honorFrom
        ? `${fromPath}${location.state.from.search || ""}${location.state.from.hash || ""}`
        : homeTarget;
      navigate(target, { replace: true, state: null });
    } catch {
      // Error state is already handled by auth slice.
    }
  };

  const handleUsernameChange = (event) => {
    if (error) {
      dispatch(clearAuthError());
    }
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    if (error) {
      dispatch(clearAuthError());
    }
    setPassword(event.target.value);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 460,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: getSurfaceBackground(theme, 0.9),
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <AyuLogo size={40} />
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                color: "#6db33f",
                fontSize: 22,
                lineHeight: 1.1,
                letterSpacing: 1,
              }}
            >
              AYUMONK
            </Typography>
            <Typography
              sx={{
                fontSize: 10,
                color: "text.secondary",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Wellness Intelligence Platform
            </Typography>
          </Box>
        </Stack>

        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Sign in
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Sign in to continue to your workspace.
        </Typography>

        <Stack component="form" spacing={2} onSubmit={handleLogin}>
          {!!error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={handleUsernameChange}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                    edge="end"
                  >
                    {showPassword ? (
                      <VisibilityOffRoundedIcon />
                    ) : (
                      <VisibilityRoundedIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? <CircularProgress size={22} color="inherit" /> : "Login"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
