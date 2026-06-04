import { useState, useEffect } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { connectDevice, getStatus } from "./wearableApi";

const CREAM = "#FBF9F4";
const SAGE = "#6B7F5C";
const TEXT_PRIMARY = "#1F1E1D";
const TEXT_SECONDARY = "#5C5A57";

export default function ConnectDeviceCard() {
  const [status, setStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    getStatus().then(setStatus).catch(() => setStatus({ connected: false }));
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const { url } = await connectDevice();
      window.open(url, "_blank", "noopener,noreferrer");
      // Re-fetch status after user returns
      const updated = await getStatus();
      setStatus(updated);
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setStatus({ connected: false });
  }

  return (
    <Box
      sx={{
        bgcolor: CREAM,
        borderRadius: 3,
        p: 3,
        border: "1px solid #E8E3DA",
        maxWidth: 480,
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: TEXT_PRIMARY, fontWeight: 700, mb: 0.5 }}
      >
        Connect a wearable
      </Typography>
      <Typography variant="body2" sx={{ color: TEXT_SECONDARY, mb: 2.5 }}>
        Sync sleep, steps and heart rate to enrich your wellness score.
      </Typography>

      {status?.connected ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" sx={{ color: SAGE, fontWeight: 600 }}>
            ✓ {status.provider} connected · last sync {status.lastSync}
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={handleDisconnect}
            sx={{ color: TEXT_SECONDARY, fontSize: "0.75rem", p: 0, minWidth: 0 }}
          >
            Disconnect
          </Button>
        </Box>
      ) : (
        <Button
          variant="contained"
          onClick={handleConnect}
          disabled={connecting}
          startIcon={connecting ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{
            bgcolor: SAGE,
            color: "#fff",
            fontWeight: 600,
            borderRadius: 2,
            textTransform: "none",
            "&:hover": { bgcolor: "#5a6e4c" },
          }}
        >
          {connecting ? "Connecting…" : "Connect a device"}
        </Button>
      )}
    </Box>
  );
}
