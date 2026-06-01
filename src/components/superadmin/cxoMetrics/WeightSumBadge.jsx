import { Box, Tooltip } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import { evaluateWeightSum } from "./weightSum";

const palette = {
  valid: { color: "#2e7d32", bg: "rgba(46,125,50,0.12)", border: "#2e7d3266" },
  warn: { color: "#a16207", bg: "rgba(212,168,67,0.16)", border: "#d4a84366" },
  invalid: { color: "#c62828", bg: "rgba(198,40,40,0.12)", border: "#c6282866" },
};

const icons = {
  valid: CheckCircleRoundedIcon,
  warn: WarningRoundedIcon,
  invalid: ErrorRoundedIcon,
};

export default function WeightSumBadge({ sum, target = 1, rule }) {
  const state = evaluateWeightSum(sum, target);
  const palettes = palette[state];
  const Icon = icons[state];
  const delta = sum - target;
  const label =
    state === "valid"
      ? "valid"
      : state === "warn"
        ? `off by ${delta > 0 ? "+" : ""}${delta.toFixed(3)}`
        : `invalid (${delta > 0 ? "+" : ""}${delta.toFixed(3)})`;

  return (
    <Tooltip title={rule || ""} disableHoverListener={!rule}>
      <Box
        aria-live="polite"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.5,
          borderRadius: 999,
          color: palettes.color,
          bgcolor: palettes.bg,
          border: `1px solid ${palettes.border}`,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.2,
        }}
      >
        <Icon sx={{ fontSize: 16 }} />
        <span>
          Total: {sum.toFixed(3)} · {label}
        </span>
      </Box>
    </Tooltip>
  );
}
