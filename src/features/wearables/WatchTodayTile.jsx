import { useState, useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { getTodayMetrics } from "./wearableApi";

const CREAM = "#FBF9F4";
const TEXT_PRIMARY = "#1F1E1D";
const TEXT_SECONDARY = "#5C5A57";

function Metric({ emoji, label, value }) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 72 }}>
      <Typography sx={{ fontSize: "1.4rem", lineHeight: 1 }}>{emoji}</Typography>
      <Typography
        variant="h6"
        sx={{ color: TEXT_PRIMARY, fontWeight: 700, mt: 0.5, lineHeight: 1 }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function WatchTodayTile() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    getTodayMetrics().then(setMetrics).catch(() => {});
  }, []);

  if (!metrics) return null;

  const sleepHrs = (metrics.sleepMinutes / 60).toFixed(1);

  return (
    <Box
      sx={{
        bgcolor: CREAM,
        borderRadius: 3,
        p: 2.5,
        border: "1px solid #E8E3DA",
        maxWidth: 480,
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: TEXT_SECONDARY, fontWeight: 600, mb: 2, letterSpacing: 0.2 }}
      >
        From your watch today
      </Typography>
      <Stack direction="row" spacing={3}>
        <Metric emoji="🌙" label="Sleep" value={`${sleepHrs}h`} />
        <Metric emoji="👣" label="Steps" value={metrics.steps.toLocaleString()} />
        <Metric emoji="❤️" label="Resting HR" value={`${metrics.restingHr} bpm`} />
      </Stack>
    </Box>
  );
}
