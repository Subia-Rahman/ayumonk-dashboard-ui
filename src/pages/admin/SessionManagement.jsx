import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import PublishIcon from "@mui/icons-material/Publish";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Layout from "../../layouts/commonLayout/Layout";
import { fetchCompanies } from "../../store/companySlice";
import { fetchKpis } from "../../store/kpiSlice";
import {
  addQuestionsToSession,
  clearSessionDetailError,
  clearSessionDetails,
  clearSessionError,
  clearSessionMessages,
  clearSessionPreview,
  clearSessionQuestions,
  fetchSessionById,
  fetchSessionPreview,
  fetchSessionQuestions,
  publishSession,
  removeSessionQuestions,
  removeSingleSessionQuestion,
  reorderSessionQuestions,
  setSessionQuestions,
} from "../../store/sessionSlice";
import {
  clearQuestionHierarchyError,
  fetchQuestionHierarchy,
} from "../../store/questionHierarchySlice";
import { clearThemeListError, fetchThemes } from "../../store/themeSlice";
import { getSurfaceBackground } from "../../theme";

const normalizeQuestion = (item, index) => ({
  id: String(item?.id || item?.question_id || index),
  text: item?.question_text || item?.text || item?.name || "Untitled Question",
  code: item?.question_code || "",
});

export default function SessionManagement() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const sessionId = id || "";

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
  const {
    companies,
    error: companiesError,
  } = useSelector((state) => state.company);
  const {
    items: themeItems,
    listLoading: themeLoading,
    listError: themeError,
  } = useSelector((state) => state.theme);
  const {
    items: questionHierarchy,
    loading: loadingQuestions,
    error: questionHierarchyError,
  } = useSelector((state) => state.questionHierarchy);

  const [selectedThemeKeys, setSelectedThemeKeys] = useState([]);
  const [selectedKpiKeys, setSelectedKpiKeys] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [availableKpis, setAvailableKpis] = useState([]);
  const [availableKpisLoading, setAvailableKpisLoading] = useState(false);
  const [availableKpisError, setAvailableKpisError] = useState("");
  const [formError, setFormError] = useState("");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    dispatch(fetchCompanies());
    dispatch(fetchQuestionHierarchy());
    dispatch(fetchSessionById(sessionId));
    dispatch(fetchSessionQuestions(sessionId));

    return () => {
      dispatch(clearSessionMessages());
      dispatch(clearSessionError());
      dispatch(clearSessionDetailError());
      dispatch(clearSessionDetails());
      dispatch(clearSessionPreview());
      dispatch(clearSessionQuestions());
      dispatch(clearThemeListError());
      dispatch(clearQuestionHierarchyError());
    };
  }, [dispatch, sessionId]);

  useEffect(() => {
    if (!sessionDetails?.company_id) return;

    dispatch(
      fetchThemes({
        isActive: true,
        companyId: sessionDetails.company_id,
      }),
    );
  }, [dispatch, sessionDetails?.company_id]);

  useEffect(() => {
    const sessionThemes = Array.isArray(sessionDetails?.themes)
      ? sessionDetails.themes
      : [];

    if (!sessionThemes.length) return;

    setSelectedThemeKeys(sessionThemes.map((theme) => theme.theme_key));

    const sessionKpiKeys = sessionThemes.flatMap((theme) =>
      Array.isArray(theme?.kpis)
        ? theme.kpis.map((kpi) => kpi.kpi_key)
        : [],
    );
    setSelectedKpiKeys(sessionKpiKeys);
  }, [sessionDetails?.id, sessionDetails?.themes]);

  useEffect(() => {
    const companyId = sessionDetails?.company_id;

    if (!companyId || !selectedThemeKeys.length) {
      setAvailableKpis([]);
      setAvailableKpisError("");
      return;
    }

    let cancelled = false;

    const loadKpis = async () => {
      setAvailableKpisLoading(true);
      setAvailableKpisError("");

      try {
        const responses = await Promise.all(
          selectedThemeKeys.map((themeKey) =>
            dispatch(
              fetchKpis({
                skip: 0,
                limit: 50,
                isActive: true,
                companyId,
                themeKey,
              }),
            ).unwrap(),
          ),
        );

        if (cancelled) return;

        const mergedKpis = responses
          .flatMap((response) => (Array.isArray(response.items) ? response.items : []))
          .reduce((accumulator, item) => {
            if (!accumulator.some((kpi) => kpi.kpi_key === item.kpi_key)) {
              accumulator.push(item);
            }
            return accumulator;
          }, []);

        setAvailableKpis(mergedKpis);
        setSelectedKpiKeys((current) =>
          current.filter((kpiKey) =>
            mergedKpis.some((kpi) => kpi.kpi_key === kpiKey),
          ),
        );
      } catch (error) {
        if (!cancelled) {
          setAvailableKpis([]);
          setAvailableKpisError(
            typeof error === "string"
              ? error
              : "Failed to fetch KPIs for the selected theme(s).",
          );
        }
      } finally {
        if (!cancelled) {
          setAvailableKpisLoading(false);
        }
      }
    };

    loadKpis();

    return () => {
      cancelled = true;
    };
  }, [dispatch, selectedThemeKeys, sessionDetails?.company_id]);

  const clearLocalAndReduxErrors = () => {
    if (formError) setFormError("");
    if (sessionError) dispatch(clearSessionError());
    if (detailError) dispatch(clearSessionDetailError());
  };

  const selectedCompanyName = useMemo(
    () =>
      companies.find((company) => company.id === sessionDetails?.company_id)
        ?.company_name || sessionDetails?.company_id || "",
    [companies, sessionDetails?.company_id],
  );

  const selectedThemes = useMemo(
    () =>
      questionHierarchy.filter((themeItem) =>
        selectedThemeKeys.includes(themeItem.theme_key),
      ),
    [questionHierarchy, selectedThemeKeys],
  );

  const themeNameByKey = useMemo(
    () =>
      themeItems.reduce((accumulator, item) => {
        accumulator[item.theme_key] = item.theme_display_name;
        return accumulator;
      }, {}),
    [themeItems],
  );

  const kpiOptions = useMemo(
    () =>
      availableKpis
        .map((kpi) => ({
          ...kpi,
          selectionKey: kpi.kpi_key,
          themeDisplayName:
            themeNameByKey[kpi.theme_key] || kpi.theme_key || "Unknown Theme",
        })),
    [availableKpis, themeNameByKey],
  );

  const questions = useMemo(() => {
    const questionMap = new Map();

    kpiOptions
      .filter((kpi) => selectedKpiKeys.includes(kpi.selectionKey))
      .forEach((kpi) => {
        const themeItem = selectedThemes.find(
          (theme) => theme.theme_key === kpi.theme_key,
        );
        const rawQuestions =
          themeItem?.kpis?.find((item) => item.kpi_key === kpi.kpi_key)
            ?.questions || [];
        rawQuestions.map(normalizeQuestion).forEach((question) => {
          if (!questionMap.has(question.id)) {
            questionMap.set(question.id, question);
          }
        });
      });

    return Array.from(questionMap.values());
  }, [kpiOptions, selectedKpiKeys, selectedThemes]);

  const allThemeKeys = useMemo(
    () => themeItems.map((item) => item.theme_key),
    [themeItems],
  );
  const allKpiKeys = useMemo(
    () => kpiOptions.map((item) => item.selectionKey),
    [kpiOptions],
  );
  const allThemesSelected =
    !!allThemeKeys.length && selectedThemeKeys.length === allThemeKeys.length;
  const allKpisSelected =
    !!allKpiKeys.length && selectedKpiKeys.length === allKpiKeys.length;

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
    if (!nextThemeKeys.length) {
      setSelectedKpiKeys([]);
      setAvailableKpis([]);
    }
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

  const handleAddQuestions = async () => {
    clearLocalAndReduxErrors();
    dispatch(clearSessionMessages());

    if (!selectedQuestions.length) {
      setFormError("Select at least one question.");
      return;
    }

    try {
      await dispatch(
        addQuestionsToSession({
          sessionId,
          questionIds: selectedQuestions,
        }),
      ).unwrap();
    } catch {
      // Redux state already contains the error.
    }
  };

  const handleSetQuestions = async () => {
    clearLocalAndReduxErrors();
    dispatch(clearSessionMessages());

    if (!selectedQuestions.length) {
      setFormError("Select at least one question.");
      return;
    }

    try {
      await dispatch(
        setSessionQuestions({
          sessionId,
          questionIds: selectedQuestions,
        }),
      ).unwrap();
    } catch {
      // Redux state already contains the error.
    }
  };

  const handleRemoveSelectedQuestions = async () => {
    clearLocalAndReduxErrors();
    dispatch(clearSessionMessages());

    const removableQuestionIds = selectedQuestions.filter((questionId) =>
      sessionQuestions.some(
        (question) => String(question.question_id) === String(questionId),
      ),
    );

    if (!removableQuestionIds.length) {
      setFormError("Select questions that are already linked to this session.");
      return;
    }

    try {
      await dispatch(
        removeSessionQuestions({
          sessionId,
          questionIds: removableQuestionIds,
        }),
      ).unwrap();
    } catch {
      // Redux state already contains the error.
    }
  };

  const handleRemoveAllQuestions = async () => {
    clearLocalAndReduxErrors();
    dispatch(clearSessionMessages());

    if (!sessionQuestions.length) {
      setFormError("No questions are currently linked to this session.");
      return;
    }

    try {
      await dispatch(
        removeSessionQuestions({
          sessionId,
          questionIds: sessionQuestions.map((question) => question.question_id),
        }),
      ).unwrap();
      setSelectedQuestions([]);
    } catch {
      // Redux state already contains the error.
    }
  };

  const handleRemoveSingleQuestion = async (questionId) => {
    try {
      await dispatch(
        removeSingleSessionQuestion({
          sessionId,
          questionId,
        }),
      ).unwrap();
      setSelectedQuestions((current) =>
        current.filter((item) => String(item) !== String(questionId)),
      );
    } catch {
      // Redux state already contains the error.
    }
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
          sessionId,
          items: reordered.map((question, index) => ({
            question_id: question.question_id,
            display_order: index + 1,
          })),
        }),
      ).unwrap();
    } catch {
      // Redux state already contains the error.
    }
  };

  const handleOpenPreview = async () => {
    setPreviewDialogOpen(true);
    try {
      await dispatch(fetchSessionPreview(sessionId)).unwrap();
    } catch {
      // Redux state already contains the error.
    }
  };

  const handlePublishSession = async () => {
    if (!sessionPreview?.session_id) return;

    try {
      await dispatch(publishSession(sessionPreview.session_id)).unwrap();
    } catch {
      // Redux state already contains the error.
    }
  };

  const handleClosePreviewDialog = () => {
    setPreviewDialogOpen(false);
    dispatch(clearSessionPreview());
  };

  return (
    <Layout role="admin" title="Manage Session">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12 }}>
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
              direction={{ xs: "column", md: "row" }}
              spacing={1.2}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 750, mb: 0.7 }}>
                  Session Management
                </Typography>
                <Typography color="text.secondary">
                  Manage question assignment, question order, summary, and form preview for this session.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate("/super-admin/sessions")}
                >
                  Back to Sessions
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/super-admin/sessions/${sessionId}/edit`)}
                >
                  Edit Session
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PreviewRoundedIcon />}
                  onClick={handleOpenPreview}
                  disabled={previewLoading}
                >
                  {previewLoading ? "Loading Preview..." : "Preview Form"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

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
              {!!formError && <Alert severity="error">{formError}</Alert>}
              {!!sessionError && <Alert severity="error">{sessionError}</Alert>}
              {!!detailError && <Alert severity="error">{detailError}</Alert>}
              {!!questionsError && <Alert severity="error">{questionsError}</Alert>}
              {!!setError && <Alert severity="error">{setError}</Alert>}
              {!!removeError && <Alert severity="error">{removeError}</Alert>}
              {!!reorderError && <Alert severity="error">{reorderError}</Alert>}
              {!!previewError && <Alert severity="error">{previewError}</Alert>}
              {!!publishError && <Alert severity="error">{publishError}</Alert>}
              {!!companiesError && <Alert severity="error">{companiesError}</Alert>}
              {!!themeError && <Alert severity="error">{themeError}</Alert>}
              {!!availableKpisError && (
                <Alert severity="error">{availableKpisError}</Alert>
              )}
              {!!questionHierarchyError && (
                <Alert severity="error">{questionHierarchyError}</Alert>
              )}
              {!!detailMessage && <Alert severity="info">{detailMessage}</Alert>}
              {!!questionsMessage && <Alert severity="info">{questionsMessage}</Alert>}
              {!!addMessage && <Alert severity="success">{addMessage}</Alert>}
              {!!setMessage && <Alert severity="success">{setMessage}</Alert>}
              {!!removeMessage && <Alert severity="success">{removeMessage}</Alert>}
              {!!reorderMessage && <Alert severity="success">{reorderMessage}</Alert>}
              {!!previewMessage && <Alert severity="info">{previewMessage}</Alert>}
              {!!publishMessage && <Alert severity="success">{publishMessage}</Alert>}

              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Manage Questions
              </Typography>
              <Typography color="text.secondary">
                Select themes and KPIs, then add, replace, or remove questions linked to this session.
              </Typography>

              {loadingQuestions || themeLoading || availableKpisLoading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Loading question data...
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
                          ? themeItems
                            .filter((themeItem) =>
                              selected.includes(themeItem.theme_key),
                            )
                            .map(
                              (themeItem) =>
                                themeItem.theme_display_name ||
                                themeItem.theme_key,
                            )
                            .join(", ")
                          : "Select Theme"
                      }
                    >
                      <MenuItem value="__all_themes__">
                        <Checkbox checked={allThemesSelected} />
                        Select All Themes
                      </MenuItem>
                      {themeItems.map((themeItem) => (
                        <MenuItem
                          key={themeItem.theme_key}
                          value={themeItem.theme_key}
                        >
                          <Checkbox
                            checked={selectedThemeKeys.includes(themeItem.theme_key)}
                          />
                          {themeItem.theme_display_name || themeItem.theme_key}
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
                            .map(
                              (kpi) =>
                                `${kpi.display_name || kpi.kpi_key} (${kpi.themeDisplayName})`,
                            )
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
                          <Checkbox
                            checked={selectedKpiKeys.includes(kpi.selectionKey)}
                          />
                          {kpi.display_name || kpi.kpi_key} ({kpi.themeDisplayName})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {!!selectedKpiKeys.length && (
                    <Stack
                      spacing={0.6}
                      sx={{ maxHeight: 280, overflowY: "auto", pr: 1 }}
                    >
                      {questions.map((question) => (
                        <FormControlLabel
                          key={question.id}
                          control={
                            <Checkbox
                              checked={selectedQuestions.includes(question.id)}
                              onChange={() => toggleQuestion(question.id)}
                            />
                          }
                          label={
                            question.code
                              ? `${question.text} (${question.code})`
                              : question.text
                          }
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

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} useFlexGap flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={handleAddQuestions}
                  disabled={addLoading || !selectedQuestions.length}
                >
                  {addLoading ? "Adding Questions..." : "Add Questions"}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleSetQuestions}
                  disabled={setLoading || !selectedQuestions.length}
                >
                  {setLoading ? "Updating..." : "Replace Questions"}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleRemoveSelectedQuestions}
                  disabled={removeLoading || !selectedQuestions.length}
                >
                  {removeLoading ? "Removing..." : "Remove Selected"}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveAllQuestions}
                  disabled={removeLoading || !sessionQuestions.length}
                >
                  {removeLoading ? "Removing..." : "Remove All Questions"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2.5}>
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

              {(detailLoading || questionsLoading) ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Loading session details...
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Title
                    </Typography>
                    <Typography>{sessionDetails?.title || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Company
                    </Typography>
                    <Typography>{selectedCompanyName || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography>{sessionDetails?.description || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Session ID
                    </Typography>
                    <Typography>{sessionId || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Selected Questions
                    </Typography>
                    <Typography>{selectedQuestions.length}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Linked Questions
                    </Typography>
                    <Typography>{sessionQuestions.length || addedQuestions.length}</Typography>
                  </Box>
                </Stack>
              )}
            </Paper>

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
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Ordered Session Questions
                </Typography>
                {questionsLoading && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Loading...
                    </Typography>
                  </Stack>
                )}
              </Stack>

              <Stack spacing={0.8}>
                {sessionQuestions.map((item, index) => (
                  <Paper
                    key={item.question_id}
                    variant="outlined"
                    sx={{ p: 1.2, borderRadius: 2 }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                    >
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
                        <IconButton
                          size="small"
                          onClick={() => handleMoveQuestion(item.question_id, "up")}
                          disabled={reorderLoading || index === 0}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveQuestion(item.question_id, "down")}
                          disabled={reorderLoading || index === sessionQuestions.length - 1}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveSingleQuestion(item.question_id)}
                          disabled={removeLoading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                {!sessionQuestions.length && !questionsLoading && (
                  <Typography variant="body2" color="text.secondary">
                    No questions added to this session yet.
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={previewDialogOpen}
        onClose={handleClosePreviewDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="h6">Form Preview</Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {!sessionPreview?.is_published && !!sessionPreview && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PublishIcon />}
                  onClick={handlePublishSession}
                  disabled={publishLoading}
                >
                  {publishLoading ? "Publishing..." : "Publish Form"}
                </Button>
              )}
              <Button onClick={handleClosePreviewDialog}>Close</Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            bgcolor: "background.default",
            px: { xs: 1.5, sm: 3 },
            py: { xs: 2, sm: 3 },
          }}
        >
          {previewLoading && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={18} />
              <Typography>Loading form preview...</Typography>
            </Stack>
          )}

          {!!previewError && !previewLoading && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {previewError}
            </Alert>
          )}

          {!!publishError && !previewLoading && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {publishError}
            </Alert>
          )}

          {!!previewMessage && !previewLoading && !previewError && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {previewMessage}
            </Alert>
          )}

          {!!publishMessage && !previewLoading && !publishError && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {publishMessage}
            </Alert>
          )}

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
                  backdropFilter: "blur(6px)",
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

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} useFlexGap flexWrap="wrap">
                    <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 2, minWidth: 180 }}>
                      <Typography variant="caption" color="text.secondary">
                        Session ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {sessionPreview.session_id}
                      </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 2, minWidth: 180 }}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {sessionPreview.is_published ? "Published" : "Draft"}
                      </Typography>
                    </Paper>
                    {!!sessionPreview.preview_url && (
                      <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 2, minWidth: 180 }}>
                        <Typography variant="caption" color="text.secondary">
                          Preview URL
                        </Typography>
                        <Stack direction="row" spacing={0.7} alignItems="center">
                          <LinkIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {sessionPreview.preview_url}
                          </Typography>
                        </Stack>
                      </Paper>
                    )}
                    {!!sessionPreview.final_url && (
                      <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 2, minWidth: 180 }}>
                        <Typography variant="caption" color="text.secondary">
                          Final URL
                        </Typography>
                        <Stack direction="row" spacing={0.7} alignItems="center">
                          <LinkIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {sessionPreview.final_url}
                          </Typography>
                        </Stack>
                      </Paper>
                    )}
                  </Stack>
                </Box>
              </Paper>

              {/* {(sessionPreview.questions || []).map((question) => ( */}
              {(sessionPreview.questions || []).map((question, index) => (
                <Paper
                  key={question.question_id}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack spacing={1.4}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
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
                            bgcolor: alpha(
                              theme.palette.primary.main,
                              theme.palette.mode === "dark" ? 0.08 : 0.04,
                            ),
                            borderColor: alpha(
                              theme.palette.primary.main,
                              theme.palette.mode === "dark" ? 0.28 : 0.18,
                            ),
                          }}
                        >
                          <RadioButtonUncheckedIcon
                            sx={{ color: "text.secondary", fontSize: 20 }}
                          />
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
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: "1px dashed",
                    borderColor: "divider",
                    textAlign: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    No questions are available in this preview yet.
                  </Typography>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        {/* <DialogActions>
          <Button onClick={handleClosePreviewDialog}>Close</Button>
        </DialogActions> */}
      </Dialog>
    </Layout>
  );
}
