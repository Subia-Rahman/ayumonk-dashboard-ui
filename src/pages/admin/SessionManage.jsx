import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import PublishIcon from "@mui/icons-material/Publish";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import Layout from "../../layouts/commonLayout/Layout";
import {
  addQuestionsToSession,
  clearSessionError,
  clearSessionMessages,
  clearSessionPreview,
  clearSessionQuestions,
  fetchSessionPreview,
  fetchSessionById,
  fetchSessionQuestions,
  publishSession,
  removeSessionQuestions,
  removeSingleSessionQuestion,
  reorderSessionQuestions,
  setSessionQuestions,
} from "../../store/sessionSlice";
import { fetchCompanies } from "../../store/companySlice";
import {
  clearQuestionHierarchyError,
  fetchQuestionHierarchy,
} from "../../store/questionHierarchySlice";
import { getSurfaceBackground } from "../../theme";

const normalizeQuestion = (item, index) => ({
  id: String(item?.id || item?.question_id || index),
  text: item?.question_text || item?.text || item?.name || "Untitled Question",
  code: item?.question_code || "",
});

export default function SessionManage() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    addedQuestions,
    sessionQuestions,
    addLoading,
    questionsLoading,
    setLoading,
    removeLoading,
    reorderLoading,
    detailLoading,
    previewLoading,
    publishLoading,
    addMessage,
    questionsMessage,
    setMessage,
    removeMessage,
    reorderMessage,
    detailMessage,
    previewMessage,
    publishMessage,
    error: sessionError,
    questionsError,
    setError,
    removeError,
    reorderError,
    detailError,
    previewError,
    publishError,
    sessionDetails,
    sessionPreview,
  } = useSelector((state) => state.session);
  const { companies } = useSelector((state) => state.company);
  const {
    items: questionHierarchy,
    loading: loadingQuestions,
    error: questionHierarchyError,
  } = useSelector((state) => state.questionHierarchy);

  const [selectedThemeKeys, setSelectedThemeKeys] = useState([]);
  const [selectedKpiKeys, setSelectedKpiKeys] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [formError, setFormError] = useState("");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const selectedCompanyName = useMemo(
    () =>
      companies.find((company) => company.id === sessionDetails?.company_id)
        ?.company_name || sessionDetails?.company_id || "",
    [companies, sessionDetails?.company_id],
  );

  const selectedThemes = useMemo(
    () =>
      questionHierarchy.filter((theme) =>
        selectedThemeKeys.includes(theme.theme_key),
      ),
    [questionHierarchy, selectedThemeKeys],
  );

  const kpiOptions = useMemo(
    () =>
      selectedThemes.flatMap((theme) =>
        (Array.isArray(theme?.kpis) ? theme.kpis : []).map((kpi) => ({
          ...kpi,
          selectionKey: `${theme.theme_key}::${kpi.kpi_key}`,
          themeDisplayName: theme.theme_display_name || theme.theme_key,
        })),
      ),
    [selectedThemes],
  );

  const questions = useMemo(() => {
    const questionMap = new Map();

    kpiOptions
      .filter((kpi) => selectedKpiKeys.includes(kpi.selectionKey))
      .forEach((kpi) => {
        const rawQuestions = Array.isArray(kpi.questions) ? kpi.questions : [];
        rawQuestions.map(normalizeQuestion).forEach((question) => {
          if (!questionMap.has(question.id)) {
            questionMap.set(question.id, question);
          }
        });
      });

    return Array.from(questionMap.values());
  }, [kpiOptions, selectedKpiKeys]);

  const allThemeKeys = useMemo(
    () => questionHierarchy.map((item) => item.theme_key),
    [questionHierarchy],
  );
  const allKpiKeys = useMemo(
    () => kpiOptions.map((item) => item.selectionKey),
    [kpiOptions],
  );
  const allThemesSelected =
    !!allThemeKeys.length && selectedThemeKeys.length === allThemeKeys.length;
  const allKpisSelected =
    !!allKpiKeys.length && selectedKpiKeys.length === allKpiKeys.length;

  useEffect(() => {
    dispatch(fetchCompanies());
    dispatch(fetchQuestionHierarchy());
    dispatch(fetchSessionById(id));
    dispatch(fetchSessionQuestions(id));

    return () => {
      dispatch(clearSessionQuestions());
      dispatch(clearQuestionHierarchyError());
      dispatch(clearSessionPreview());
    };
  }, [dispatch, id]);

  const clearLocalAndReduxErrors = () => {
    if (formError) setFormError("");
    if (sessionError) dispatch(clearSessionError());
  };

  const toggleQuestion = (questionId) => {
    setSelectedQuestions((current) =>
      current.includes(questionId)
        ? current.filter((item) => item !== questionId)
        : [...current, questionId],
    );
  };

  const handleThemeSelectionChange = (event) => {
    const value = event.target.value;
    const hasSelectAll = value.includes("__all_themes__");
    const nextThemeKeys = hasSelectAll
      ? allThemesSelected
        ? []
        : allThemeKeys
      : value;

    setSelectedThemeKeys(nextThemeKeys);
    setSelectedKpiKeys([]);
    setSelectedQuestions([]);
  };

  const handleKpiSelectionChange = (event) => {
    const value = event.target.value;
    const hasSelectAll = value.includes("__all_kpis__");
    const nextKpiKeys = hasSelectAll
      ? allKpisSelected
        ? []
        : allKpiKeys
      : value;

    setSelectedKpiKeys(nextKpiKeys);
    setSelectedQuestions([]);
  };

  const requireSelection = () => {
    if (!selectedQuestions.length) {
      setFormError("Select at least one question.");
      return false;
    }
    return true;
  };

  const handleAddQuestions = async () => {
    clearLocalAndReduxErrors();
    dispatch(clearSessionMessages());
    if (!requireSelection()) return;

    try {
      await dispatch(addQuestionsToSession({ sessionId: id, questionIds: selectedQuestions })).unwrap();
    } catch { }
  };

  const handleSetQuestions = async () => {
    clearLocalAndReduxErrors();
    dispatch(clearSessionMessages());
    if (!requireSelection()) return;

    try {
      await dispatch(setSessionQuestions({ sessionId: id, questionIds: selectedQuestions })).unwrap();
    } catch { }
  };

  const handleRemoveSelectedQuestions = async () => {
    clearLocalAndReduxErrors();
    dispatch(clearSessionMessages());

    const removableQuestionIds = selectedQuestions.filter((questionId) =>
      sessionQuestions.some((question) => String(question.question_id) === String(questionId)),
    );

    if (!removableQuestionIds.length) {
      setFormError("Select questions that are already added to this session.");
      return;
    }

    try {
      await dispatch(removeSessionQuestions({ sessionId: id, questionIds: removableQuestionIds })).unwrap();
    } catch { }
  };

  const handleRemoveAllQuestions = async () => {
    clearLocalAndReduxErrors();
    dispatch(clearSessionMessages());

    if (!sessionQuestions.length) {
      setFormError("No questions are currently linked to this session.");
      return;
    }

    try {
      await dispatch(removeSessionQuestions({
        sessionId: id,
        questionIds: sessionQuestions.map((question) => question.question_id),
      })).unwrap();
      setSelectedQuestions([]);
    } catch { }
  };

  const handleRemoveSingleQuestion = async (questionId) => {
    try {
      await dispatch(removeSingleSessionQuestion({ sessionId: id, questionId })).unwrap();
      setSelectedQuestions((current) => current.filter((item) => String(item) !== String(questionId)));
    } catch { }
  };

  const handleMoveQuestion = async (questionId, direction) => {
    if (reorderLoading) return;

    const currentIndex = sessionQuestions.findIndex(
      (question) => String(question.question_id) === String(questionId),
    );
    if (currentIndex < 0) return;

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= sessionQuestions.length) return;

    const reordered = [...sessionQuestions];
    const [movedQuestion] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, movedQuestion);

    try {
      await dispatch(
        reorderSessionQuestions({
          sessionId: id,
          items: reordered.map((question, index) => ({
            question_id: question.question_id,
            display_order: index + 1,
          })),
        }),
      ).unwrap();
    } catch { }
  };

  const handlePreviewSession = async () => {
    setPreviewDialogOpen(true);
    try {
      await dispatch(fetchSessionPreview(id)).unwrap();
    } catch { }
  };

  const handlePublishSession = async () => {
    if (!sessionPreview?.session_id) return;
    try {
      await dispatch(publishSession(sessionPreview.session_id)).unwrap();
    } catch { }
  };

  return (
    <Layout role="admin" title="Manage Session">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
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
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 750 }}>
                    Manage Session Questions
                  </Typography>
                  <Typography color="text.secondary">
                    Update question assignment and order for this session.
                  </Typography>
                </Box>
                <Button variant="outlined" onClick={() => navigate("/super-admin/sessions")}>
                  Back To Sessions
                </Button>
              </Stack>

              {!!formError && <Alert severity="error">{formError}</Alert>}
              {!!sessionError && <Alert severity="error">{sessionError}</Alert>}
              {!!questionsError && <Alert severity="error">{questionsError}</Alert>}
              {!!setError && <Alert severity="error">{setError}</Alert>}
              {!!removeError && <Alert severity="error">{removeError}</Alert>}
              {!!reorderError && <Alert severity="error">{reorderError}</Alert>}
              {!!questionHierarchyError && <Alert severity="error">{questionHierarchyError}</Alert>}
              {!!addMessage && <Alert severity="success">{addMessage}</Alert>}
              {!!questionsMessage && <Alert severity="info">{questionsMessage}</Alert>}
              {!!setMessage && <Alert severity="success">{setMessage}</Alert>}
              {!!removeMessage && <Alert severity="success">{removeMessage}</Alert>}
              {!!reorderMessage && <Alert severity="success">{reorderMessage}</Alert>}

              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                {detailLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <Typography variant="body2">Loading session...</Typography>
                  </Stack>
                ) : (
                  <Stack spacing={0.8}>
                    <Typography variant="subtitle2">{sessionDetails?.title || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {sessionDetails?.description || "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Company: {selectedCompanyName || "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Session ID: {id}
                    </Typography>
                  </Stack>
                )}
              </Paper>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Select Questions
                </Typography>
                {loadingQuestions ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Loading question list...
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={1.5}>
                    <FormControl fullWidth>
                      <Select
                        multiple
                        displayEmpty
                        value={selectedThemeKeys}
                        onChange={handleThemeSelectionChange}
                        renderValue={(selected) =>
                          selected.length
                            ? questionHierarchy
                              .filter((theme) => selected.includes(theme.theme_key))
                              .map((theme) => theme.theme_display_name || theme.theme_key)
                              .join(", ")
                            : "Select Theme"
                        }
                      >
                        <MenuItem value="__all_themes__">
                          <Checkbox checked={allThemesSelected} />
                          Select All Themes
                        </MenuItem>
                        {questionHierarchy.map((theme) => (
                          <MenuItem key={theme.theme_key} value={theme.theme_key}>
                            <Checkbox checked={selectedThemeKeys.includes(theme.theme_key)} />
                            {theme.theme_display_name || theme.theme_key}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth disabled={!selectedThemeKeys.length}>
                      <Select
                        multiple
                        displayEmpty
                        value={selectedKpiKeys}
                        onChange={handleKpiSelectionChange}
                        renderValue={(selected) =>
                          selected.length
                            ? kpiOptions
                              .filter((kpi) => selected.includes(kpi.selectionKey))
                              .map((kpi) => `${kpi.display_name || kpi.kpi_key} (${kpi.themeDisplayName})`)
                              .join(", ")
                            : "Select KPI"
                        }
                      >
                        <MenuItem value="__all_kpis__">
                          <Checkbox checked={allKpisSelected} />
                          Select All KPI
                        </MenuItem>
                        {kpiOptions.map((kpi) => (
                          <MenuItem key={kpi.selectionKey} value={kpi.selectionKey}>
                            <Checkbox checked={selectedKpiKeys.includes(kpi.selectionKey)} />
                            {kpi.display_name || kpi.kpi_key} ({kpi.themeDisplayName})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {!!selectedKpiKeys.length && (
                      <Stack spacing={0.6} sx={{ maxHeight: 240, overflowY: "auto", pr: 1 }}>
                        {questions.map((question) => (
                          <FormControlLabel
                            key={question.id}
                            control={
                              <Checkbox
                                checked={selectedQuestions.includes(question.id)}
                                onChange={() => toggleQuestion(question.id)}
                              />
                            }
                            label={question.code ? `${question.text} (${question.code})` : question.text}
                          />
                        ))}
                        {!questions.length && (
                          <Typography variant="body2" color="text.secondary">
                            No questions found for selected KPIs.
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </Stack>
                )}
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} useFlexGap flexWrap="wrap">
                <Button variant="contained" onClick={handleAddQuestions} disabled={addLoading || !selectedQuestions.length}>
                  {addLoading ? "Adding Questions..." : "Add Questions"}
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleSetQuestions} disabled={setLoading || !selectedQuestions.length}>
                  {setLoading ? "Updating..." : "Replace Questions"}
                </Button>
                <Button variant="outlined" color="warning" onClick={handleRemoveSelectedQuestions} disabled={removeLoading || !selectedQuestions.length}>
                  {removeLoading ? "Removing..." : "Remove Selected"}
                </Button>
                <Button variant="outlined" color="error" onClick={handleRemoveAllQuestions} disabled={removeLoading || !sessionQuestions.length}>
                  {removeLoading ? "Removing..." : "Remove All Questions"}
                </Button>
                <Button variant="outlined" color="success" startIcon={<PreviewRoundedIcon />} onClick={handlePreviewSession}>
                  Preview Form
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
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
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Session Summary
            </Typography>

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="body2" color="text.secondary">Title</Typography>
                <Typography>{sessionDetails?.title || "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Company</Typography>
                <Typography>{selectedCompanyName || "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography>{sessionDetails?.description || "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Session ID</Typography>
                <Typography>{id || "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Selected Questions</Typography>
                <Typography>{selectedQuestions.length}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Questions Added</Typography>
                <Typography>{sessionQuestions.length || addedQuestions.length}</Typography>
              </Box>
            </Stack>

            <Paper variant="outlined" sx={{ mt: 2, p: 1.5, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Ordered Session Questions</Typography>
                {questionsLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">Loading...</Typography>
                  </Stack>
                ) : (
                  sessionQuestions.map((item, index) => (
                    <Paper key={item.question_id} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" noWrap>
                            {/* {item.display_order}. {item.question_text} */}
                            {index + 1}. {item.question_text}
                          </Typography>
                          {!!item.question_code && (
                            <Typography variant="caption" color="text.secondary">
                              {item.question_code}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={0.2}>
                          <IconButton size="small" onClick={() => handleMoveQuestion(item.question_id, "up")} disabled={reorderLoading || index === 0}>
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleMoveQuestion(item.question_id, "down")} disabled={reorderLoading || index === sessionQuestions.length - 1}>
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleRemoveSingleQuestion(item.question_id)} disabled={removeLoading}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))
                )}
                {!sessionQuestions.length && !questionsLoading && (
                  <Typography variant="body2" color="text.secondary">
                    No questions added to this session yet.
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={previewDialogOpen} onClose={() => { setPreviewDialogOpen(false); dispatch(clearSessionPreview()); }} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
            <Typography variant="h6">Form Preview</Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {!sessionPreview?.is_published && !!sessionPreview && (
                <Button variant="contained" color="success" startIcon={<PublishIcon />} onClick={handlePublishSession} disabled={publishLoading}>
                  {publishLoading ? "Publishing..." : "Publish Form"}
                </Button>
              )}
              <Button onClick={() => { setPreviewDialogOpen(false); dispatch(clearSessionPreview()); }}>Close</Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "background.default", px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
          {previewLoading && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={18} />
              <Typography>Loading form preview...</Typography>
            </Stack>
          )}

          {!!previewError && !previewLoading && <Alert severity="error" sx={{ mb: 2 }}>{previewError}</Alert>}
          {!!publishError && !previewLoading && <Alert severity="error" sx={{ mb: 2 }}>{publishError}</Alert>}
          {!!previewMessage && !previewLoading && !previewError && <Alert severity="info" sx={{ mb: 2 }}>{previewMessage}</Alert>}
          {!!publishMessage && !previewLoading && !publishError && <Alert severity="success" sx={{ mb: 2 }}>{publishMessage}</Alert>}

          {!!sessionPreview && !previewLoading && (
            <Stack spacing={2}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: getSurfaceBackground(theme, 0.92),
                }}
              >
                <Box sx={{ height: 10, bgcolor: "primary.main" }} />
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h4" sx={{ fontSize: { xs: 24, sm: 32 }, mb: 1 }}>
                    {sessionPreview.title || "-"}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {sessionPreview.description || "No description provided."}
                  </Typography>
                </Box>
              </Paper>

              {/* {(sessionPreview.questions || []).map((question) => ( */}
                {(sessionPreview.questions || []).map((question, index) => (
                <Paper
                  key={question.question_id}
                  elevation={0}
                  sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}
                >
                  <Stack spacing={1.4}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {/* {question.display_order}. {question.question_text} */}
                          {index + 1}. {question.question_text}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {question.theme_display_name} • {question.kpi_display_name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {question.question_code}
                      </Typography>
                    </Stack>

                    <Stack spacing={1}>
                      {(question.options || []).map((option, index) => (
                        <Paper
                          key={`${question.question_id}-${index}`}
                          variant="outlined"
                          sx={{
                            p: 1.4,
                            borderRadius: 999,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.2,
                            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.04),
                            borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.18),
                          }}
                        >
                          <RadioButtonUncheckedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                          <Typography variant="body2">{option}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              ))}

              {!sessionPreview.questions?.length && (
                <Paper
                  elevation={0}
                  sx={{ p: 3, borderRadius: 3, border: "1px dashed", borderColor: "divider", textAlign: "center" }}
                >
                  <Typography color="text.secondary">
                    No questions are available in this preview yet.
                  </Typography>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
