import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearBadgeDetailState,
  fetchBadgeById,
} from "../../store/badgeSlice";
import { fetchKpis } from "../../store/kpiSlice";
import usePermissions from "../../hooks/usePermissions";
import { formatDateTimeIST } from "../../utils/dateTime";

const LEVEL_COLORS = {
  bronze: "warning",
  silver: "default",
  gold: "warning",
  legend: "secondary",
  platinum: "primary",
};

const basePathFor = (role) =>
  role === "superadmin" ? "/super-admin/badges" : "/admin/badges";

export default function BadgeView({ role = "admin" }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const basePath = basePathFor(role);
  const { items: kpiItems } = useSelector((state) => state.kpi);
  const { selectedBadge, detailLoading, detailError } = useSelector(
    (state) => state.badge,
  );
  const { canEdit } = usePermissions();
  const canEditBadges = canEdit("badges");

  useEffect(() => {
    dispatch(fetchKpis({ isActive: true }));
    if (id) {
      dispatch(fetchBadgeById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    return () => {
      dispatch(clearBadgeDetailState());
    };
  }, [dispatch]);

  const kpiName = useMemo(() => {
    if (!selectedBadge?.kpi_key) return "—";
    const match = kpiItems.find(
      (item) => item.kpi_key === selectedBadge.kpi_key,
    );
    return match?.display_name || selectedBadge.kpi_key;
  }, [kpiItems, selectedBadge]);

  const levelLabel = selectedBadge?.level
    ? selectedBadge.level.charAt(0).toUpperCase() + selectedBadge.level.slice(1)
    : "-";

  return (
    <Layout role={role} title="View Badge">
      <Stack spacing={2.5}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: alpha(theme.palette.background.paper, 0.86),
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                Badge Details
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Review the badge record before making changes. Editing
                trigger_value or kpi_key follows the freeze-on-edit policy and
                does not affect users who have already earned this badge.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate(basePath)}
              >
                Back to list
              </Button>
              {canEditBadges && selectedBadge && (
                <Button
                  variant="contained"
                  startIcon={<EditRoundedIcon />}
                  onClick={() =>
                    navigate(
                      `${basePath}/${selectedBadge.badge_id || selectedBadge.badge_key}/edit`,
                    )
                  }
                >
                  Edit
                </Button>
              )}
            </Stack>
          </Stack>

          {detailLoading && <Typography>Loading badge...</Typography>}
          {detailError && <Alert severity="error">{detailError}</Alert>}

          {selectedBadge && !detailLoading && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Badge Key
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedBadge.badge_key || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Label
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedBadge.label || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Icon
                </Typography>
                <Typography sx={{ mt: 0.8, fontSize: 28, lineHeight: 1 }}>
                  {selectedBadge.icon || "—"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Level
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={levelLabel}
                    color={LEVEL_COLORS[selectedBadge.level] || "default"}
                    variant="filled"
                  />
                </Box>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={selectedBadge.is_active ? "Active" : "Inactive"}
                    color={selectedBadge.is_active ? "success" : "default"}
                    variant={selectedBadge.is_active ? "filled" : "outlined"}
                  />
                </Box>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Trigger Type
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedBadge.trigger_type || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Trigger Value
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedBadge.trigger_value ?? "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  KPI
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedBadge.kpi_key ? kpiName : "—"}
                </Typography>
                {selectedBadge.kpi_key && (
                  <Typography variant="caption" color="text.secondary">
                    Key: {selectedBadge.kpi_key}
                  </Typography>
                )}
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedBadge.description || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Created At
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {formatDateTimeIST(selectedBadge.created_at)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Updated At
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {formatDateTimeIST(selectedBadge.updated_at)}
                </Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      </Stack>
    </Layout>
  );
}
