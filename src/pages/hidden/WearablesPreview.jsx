import { Box, Typography } from "@mui/material";
import ConnectDeviceCard from "../../features/wearables/ConnectDeviceCard";
import WatchTodayTile from "../../features/wearables/WatchTodayTile";

export default function WearablesPreview() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F0EDE6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        gap: 3,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "#9E9B96", letterSpacing: 1, textTransform: "uppercase" }}
      >
        /wearables-preview — mock mode
      </Typography>
      <ConnectDeviceCard />
      <WatchTodayTile />
    </Box>
  );
}
