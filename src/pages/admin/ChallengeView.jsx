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
import { fetchCompanies } from "../../store/companySlice";
import { fetchKpis } from "../../store/kpiSlice";
import {
  clearChallengeDetailState,
  fetchChallengeById,
} from "../../store/challengeSlice";
import usePermissions from "../../hooks/usePermissions";
import { formatDateTimeIST } from "../../utils/dateTime";

export default function ChallengeView({ role = "superadmin" }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const { companies } = useSelector((state) => state.company);
  const { items: kpiItems } = useSelector((state) => state.kpi);
  const { selectedChallenge, detailLoading, detailError } = useSelector(
    (state) => state.challenge,
  );
  const { canEdit } = usePermissions();
  const canEditChallenges = canEdit("challenges");

  useEffect(() => {
    dispatch(fetchCompanies());
    if (id) {
      dispatch(fetchChallengeById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    return () => {
      dispatch(clearChallengeDetailState());
    };
  }, [dispatch]);

  const mappingRows = useMemo(
    () =>
      (selectedChallenge?.kpi_mappings || []).map((mapping, index) => ({
        ...mapping,
        display_name:
          kpiItems.find((kpi) => kpi.kpi_key === mapping.kpi_key)
            ?.display_name ||
          mapping.kpi_key ||
          `Mapping ${index + 1}`,
      })),
    [kpiItems, selectedChallenge?.kpi_mappings],
  );

  useEffect(() => {
    if (selectedChallenge?.company_id) {
      dispatch(
        fetchKpis({
          isActive: true,
          companyId: selectedChallenge.company_id,
        }),
      );
    }
  }, [dispatch, selectedChallenge?.company_id]);

  const companyName = useMemo(
    () =>
      companies.find((company) => company.id === selectedChallenge?.company_id)
        ?.company_name || selectedChallenge?.company_id || "-",
    [companies, selectedChallenge?.company_id],
  );

  return (
    <Layout role="admin" title="View Challenge">
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
                Challenge Details
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Review the challenge record and its KPI mappings before making
                changes.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => 
                  //navigate("/admin/challenges")}
                  navigate(role === "superadmin" ? "/super-admin/challenges" : "/admin/challenges")}
              >
                Back to list
              </Button>
              {canEditChallenges && (
                <Button
                  variant="contained"
                  startIcon={<EditRoundedIcon />}
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? `/admin/challenges/${id}/edit`
                        : `/super-admin/challenges/${id}/edit`,
                    )
                  }
                >
                  Edit
                </Button>
              )}
            </Stack>
          </Stack>

          {detailLoading && <Typography>Loading challenge...</Typography>}
          {detailError && <Alert severity="error">{detailError}</Alert>}

          {selectedChallenge && !detailLoading && (
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
                  Company
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {companyName}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Challenge Name
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedChallenge.name}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={selectedChallenge.is_active ? "Active" : "Inactive"}
                    color={selectedChallenge.is_active ? "success" : "default"}
                    variant={
                      selectedChallenge.is_active ? "filled" : "outlined"
                    }
                  />
                </Box>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedChallenge.description || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Challenge Type
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedChallenge.challenge_type || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Target Value
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedChallenge.target_value ?? "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  XP Reward
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedChallenge.xp_reward ?? "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Icon
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedChallenge.icon || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Daily Challenge
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {selectedChallenge.is_daily ? "Yes" : "No"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Created At
                </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                {formatDateTimeIST(selectedChallenge.created_at)}
              </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Updated At
                </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                {formatDateTimeIST(selectedChallenge.updated_at)}
              </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  KPI Mapping Count
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {mappingRows.length}
                </Typography>
              </Paper>
            </Box>
          )}
        </Paper>

        {selectedChallenge && !detailLoading && (
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
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              KPI Mappings
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
              This challenge currently includes the following KPI assignments.
            </Typography>

            {mappingRows.length > 0 ? (
              <Stack spacing={1.5}>
                {mappingRows.map((mapping) => (
                  <Paper
                    key={mapping.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2.5 }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>
                      {mapping.display_name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.25 }}
                    >
                      KPI Key: {mapping.kpi_key || "-"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.25 }}
                    >
                      Date Range: {mapping.start_date || "-"} to{" "}
                      {mapping.end_date || "-"}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                No KPI mappings are available for this challenge yet.
              </Typography>
            )}
          </Paper>
        )}
      </Stack>
    </Layout>
  );
}
