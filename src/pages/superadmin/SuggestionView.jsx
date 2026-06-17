import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearAdminSuggestionDetailState,
  fetchAdminSuggestionById,
} from "../../store/adminSuggestionSlice";
import usePermissions from "../../hooks/usePermissions";
import { getSurfaceBackground } from "../../theme";
import { formatDateTimeIST } from "../../utils/dateTime";

export default function SuggestionView() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedSuggestion, detailLoading, detailError } = useSelector(
    (state) => state.adminSuggestion,
  );
  const location = useLocation();
  const returnBase = location.state?.returnBase || "/super-admin/suggestion-master";
  const { canEdit } = usePermissions();
  const canEditSuggestions = canEdit("suggestion-master");

  useEffect(() => {
    if (id) {
      dispatch(fetchAdminSuggestionById(id));
    }

    return () => {
      dispatch(clearAdminSuggestionDetailState());
    };
  }, [dispatch, id]);

  if (detailLoading) {
    return (
      <Layout role="superadmin" title="View Suggestion">
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
          <Typography>Loading suggestion...</Typography>
        </Paper>
      </Layout>
    );
  }

  return (
    <Layout role="superadmin" title="View Suggestion">
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
              Suggestion Details
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Review the full suggestion record before making changes.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate(returnBase)}
            >
              Back to list
            </Button>
            {canEditSuggestions && (
              <Button
                variant="contained"
                startIcon={<EditRoundedIcon />}
                onClick={() =>
                  navigate(`${returnBase}/${id}/edit`, { state: { returnBase } })
                }
              >
                Edit
              </Button>
            )}
          </Stack>
        </Stack>

        {detailError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {detailError}
          </Alert>
        )}

        {selectedSuggestion && !detailError && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                Suggestion Type
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={selectedSuggestion.suggestion_type || "-"}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                Title
              </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                {selectedSuggestion.title || "-"}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                Description
              </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 600, whiteSpace: "pre-wrap" }}>
                {selectedSuggestion.description || "-"}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                URL
              </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                {selectedSuggestion.url || "-"}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                Dosha Type
              </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                {selectedSuggestion.dosha_type || "-"}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                Difficulty
              </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                {selectedSuggestion.difficulty || "-"}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                Duration
              </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                {selectedSuggestion.duration_mins ?? "-"} mins
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={selectedSuggestion.is_active ? "Active" : "Inactive"}
                  color={selectedSuggestion.is_active ? "success" : "default"}
                  variant={selectedSuggestion.is_active ? "filled" : "outlined"}
                />
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                Created At
              </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                {formatDateTimeIST(selectedSuggestion.created_at)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                Updated At
              </Typography>
              <Typography sx={{ mt: 0.8, fontWeight: 600 }}>
                {formatDateTimeIST(selectedSuggestion.updated_at)}
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>
    </Layout>
  );
}
