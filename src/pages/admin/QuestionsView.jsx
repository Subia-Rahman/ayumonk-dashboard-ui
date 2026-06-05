import { useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import { fetchThemes } from "../../store/themeSlice";
import { fetchKpis } from "../../store/kpiSlice";
import { fetchCompanies } from "../../store/companySlice";
import {
  clearQuestionDetailState,
  fetchQuestionById,
} from "../../store/questionSlice";
import usePermissions from "../../hooks/usePermissions";
import { getSurfaceBackground } from "../../theme";

export default function QuestionsView({ role = "admin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const companyId = location.state?.companyId;
  const { items: themeItems } = useSelector((state) => state.theme);
  const { items: kpiItems } = useSelector((state) => state.kpi);
  const { companies } = useSelector((state) => state.company);
  const { selectedQuestion, detailLoading, detailError } = useSelector(
    (state) => state.question,
  );
  const { canEdit } = usePermissions();
  const canEditQuestions = canEdit("questions");

  useEffect(() => {
    dispatch(fetchQuestionById(id));
    dispatch(fetchThemes({ isActive: true }));
    dispatch(fetchKpis({ isActive: true }));
    dispatch(fetchCompanies());

    return () => {
      dispatch(clearQuestionDetailState());
    };
  }, [dispatch, id]);

  const themeName = useMemo(
    () =>
      themeItems.find((item) => item.theme_key === selectedQuestion?.theme_key)
        ?.theme_display_name,
    [selectedQuestion?.theme_key, themeItems],
  );

  const kpiName = useMemo(
    () =>
      kpiItems.find((item) => item.kpi_key === selectedQuestion?.kpi_key)
        ?.display_name,
    [kpiItems, selectedQuestion?.kpi_key],
  );

  const companyName = useMemo(
    () =>
      companies.find((company) => company.id === selectedQuestion?.company_id)
        ?.company_name || selectedQuestion?.company_id || "-",
    [companies, selectedQuestion?.company_id],
  );

  if (detailLoading) {
    return (
      <Layout role="admin" title="View Question">
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
          <Typography>Loading question...</Typography>
        </Paper>
      </Layout>
    );
  }

  return (
    <Layout role="admin" title="View Question">
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
              Question Details
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Review the full KPI question and its scored options.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() =>
                navigate(
                  role === "admin" ? "/admin/questions" : "/super-admin/questions",
                  { state: companyId ? { companyId } : undefined },
                )
              }
            >
              Back to list
            </Button>
            {canEditQuestions && (
              <Button
                variant="contained"
                startIcon={<EditRoundedIcon />}
                onClick={() =>
                  navigate(
                    role === "admin"
                      ? `/admin/questions/${id}/edit`
                      : `/super-admin/questions/${id}/edit`,
                    { state: companyId ? { companyId } : undefined },
                  )
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

        {selectedQuestion ? (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              {[
                ["Company", companyName],
                ["Question Code", selectedQuestion.question_code],
                ["Theme", themeName || selectedQuestion.theme_key],
                ["KPI", kpiName || selectedQuestion.kpi_key],
                ["Reverse Code", selectedQuestion.reverse_code ? "Yes" : "No"],
                ["Status", selectedQuestion.is_active ? "Active" : "Inactive"],
              ].map(([label, value]) => (
                <Paper key={label} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography sx={{ mt: 0.8, fontWeight: 600 }}>{value || "-"}</Typography>
                </Paper>
              ))}
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2.5, gridColumn: "1 / -1" }}
              >
                <Typography variant="caption" color="text.secondary">
                  Question Text
                </Typography>
                <Typography sx={{ mt: 0.8, fontWeight: 600, whiteSpace: "pre-wrap" }}>
                  {selectedQuestion.question_text || "-"}
                </Typography>
              </Paper>
            </Box>

            <Paper variant="outlined" sx={{ mt: 3, p: 2, borderRadius: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Options
              </Typography>
              <Stack spacing={1.25}>
                {selectedQuestion.options.map((option) => (
                  <Paper
                    key={option.option_number}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2.5 }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        Option {option.option_number}
                      </Typography>
                      <Chip
                        label={`Score: ${option.score}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                    <Typography sx={{ mt: 0.8 }}>{option.option_text || "-"}</Typography>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </>
        ) : null}
      </Paper>
    </Layout>
  );
}
