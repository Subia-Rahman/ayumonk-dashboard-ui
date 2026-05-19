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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearSelectedPolicy,
  fetchPolicies,
  selectPolicyById,
} from "../../store/policySlice";
import { getSurfaceBackground } from "../../theme";

const effectColor = (effect) => {
  const value = String(effect || "").toLowerCase();
  if (value === "allow") return "success";
  if (value === "deny") return "error";
  return "default";
};

const formatJson = (value) => {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return "{}";
  }
};

export default function PolicyView() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    items,
    selectedPolicy,
    selectedTenantId,
    selectedModule,
    listLoading,
    listError,
  } = useSelector((state) => state.policy);

  const policy = useMemo(() => {
    if (selectedPolicy?.id === String(id)) return selectedPolicy;
    return items.find((item) => item.id === String(id)) || null;
  }, [id, items, selectedPolicy]);

  useEffect(() => {
    if (id) {
      dispatch(selectPolicyById(id));
    }
    return () => {
      dispatch(clearSelectedPolicy());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (!policy && selectedTenantId && !listLoading) {
      dispatch(
        fetchPolicies({ tenantId: selectedTenantId, module: selectedModule }),
      );
    }
  }, [dispatch, listLoading, policy, selectedModule, selectedTenantId]);

  return (
    <Layout role="superadmin" title="View Policy">
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: getSurfaceBackground(theme),
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
              Policy Details
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Review the full policy record.
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/super-admin/policies")}
          >
            Back to list
          </Button>
        </Stack>

        {listError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {listError}
          </Alert>
        )}

        {!policy && !listLoading && !listError && (
          <Alert severity="info">
            Policy not loaded. Open the policy list, select a tenant, then click
            view.
          </Alert>
        )}

        {policy && (
          <Stack spacing={2}>
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
                  ID
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {policy.id || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {policy.name || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Module
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {policy.module || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Scope
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {policy.scope || "-"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Effect
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={policy.effect || "-"}
                    color={effectColor(policy.effect)}
                    sx={{ textTransform: "capitalize", fontWeight: 700 }}
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
                    label={policy.is_active ? "Active" : "Inactive"}
                    color={policy.is_active ? "success" : "default"}
                    variant={policy.is_active ? "filled" : "outlined"}
                  />
                </Box>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  gridColumn: { xs: "auto", sm: "1 / -1" },
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Company ID
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                  {policy.tenant_id || "-"}
                </Typography>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  gridColumn: { xs: "auto", sm: "1 / -1" },
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography
                  sx={{ mt: 0.8, fontWeight: 600, whiteSpace: "pre-wrap" }}
                >
                  {policy.description || "-"}
                </Typography>
              </Paper>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Conditions
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    mt: 1,
                    m: 0,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {formatJson(policy.conditions)}
                </Box>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Condition JSON
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    mt: 1,
                    m: 0,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {formatJson(policy.condition_json)}
                </Box>
              </Paper>
            </Box>
          </Stack>
        )}
      </Paper>
    </Layout>
  );
}
