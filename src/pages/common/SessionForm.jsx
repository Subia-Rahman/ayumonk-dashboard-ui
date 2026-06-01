import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  clearSessionForm,
  fetchSessionForm,
  submitSessionForm,
} from "../../store/sessionSlice";
import { getUserProfile } from "../../utils/roleHelper";
import { getSurfaceBackground } from "../../theme";

export default function SessionForm({
  sessionId: sessionIdProp,
  onContinue,
  continueLabel = "Continue to dashboard",
} = {}) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const params = useParams();
  // Accept sessionId either as a prop (when rendered inside OnboardingGate
  // or other host components) or from the URL (when mounted at the public
  // /sessions/:id/form route).
  const id = sessionIdProp || params.id;
  const storedProfile = getUserProfile();
  const {
    sessionForm,
    formLoading,
    formError,
    submitLoading,
    submitError,
    submitMessage,
    submittedResponseId,
  } = useSelector((state) => state.session);
  const [email] = useState(() => storedProfile?.email || "");
  const [answers, setAnswers] = useState({});
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (id) {
      dispatch(fetchSessionForm(id));
    }

    return () => {
      dispatch(clearSessionForm());
    };
  }, [dispatch, id]);

  const questions = useMemo(
    () => (Array.isArray(sessionForm?.questions) ? sessionForm.questions : []),
    [sessionForm?.questions],
  );

  const handleSelectOption = (questionId, option) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: option,
    }));
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setLocalError("Email is required.");
      return;
    }

    const payloadAnswers = questions
      .filter((question) => answers[question.question_id])
      .map((question) => ({
        question_id: question.question_id,
        selected_option: answers[question.question_id],
      }));

    if (payloadAnswers.length !== questions.length) {
      setLocalError("Please answer all questions before submitting.");
      return;
    }

    setLocalError("");

    try {
      await dispatch(
        submitSessionForm({
          sessionId: id,
          email: email.trim(),
          answers: payloadAnswers,
        }),
      ).unwrap();
      // navigate(role === "admin" ? "/admin/dashboard" : "/user/dashboard", {
      //   replace: true,
      // });
    } catch {
      // Error is already handled in redux state.
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: { xs: 3, sm: 5 },
        px: { xs: 1.5, sm: 3 },
      }}
    >
      <Stack spacing={2} sx={{ maxWidth: 860, mx: "auto" }}>
        {formLoading && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: getSurfaceBackground(theme, 0.9),
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={20} />
              <Typography>Loading session form...</Typography>
            </Stack>
          </Paper>
        )}

        {!formLoading && (formError || submitError || localError) && (
          <Alert severity="error">
            {formError || submitError || localError}
          </Alert>
        )}

        {!formLoading && submitMessage && (
          <Alert
            icon={<CheckCircleRoundedIcon fontSize="inherit" />}
            severity="success"
          >
            {submitMessage}
            {submittedResponseId ? ` Response ID: ${submittedResponseId}` : ""}
          </Alert>
        )}

        {!!sessionForm && !formLoading && (
          <>
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
                <Typography
                  variant="h4"
                  sx={{ fontSize: { xs: 24, sm: 32 }, mb: 1 }}
                >
                  {sessionForm.title || "-"}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {sessionForm.description || "No description provided."}
                </Typography>
                <TextField
                  label="Email Address"
                  value={email}
                  disabled
                  helperText="Using the signed-in user's email."
                  fullWidth
                />
              </Box>
            </Paper>

            {/* {questions.map((question) => ( */}
              {questions.map((question, index) => (
              <Paper
                key={question.question_id}
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: getSurfaceBackground(theme, 0.92),
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
                        {question.theme_display_name} •{" "}
                        {question.kpi_display_name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {question.question_code}
                    </Typography>
                  </Stack>

                  <Stack spacing={1}>
                    {(question.options || []).map((option, index) => {
                      const selected = answers[question.question_id] === option;
                      return (
                        <Paper
                          key={`${question.question_id}-${index}`}
                          variant="outlined"
                          onClick={() =>
                            handleSelectOption(question.question_id, option)
                          }
                          sx={{
                            p: 1.4,
                            borderRadius: 999,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.2,
                            bgcolor: selected
                              ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.1)
                              : alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.04),
                            borderColor: selected
                              ? "primary.main"
                              : alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.18),
                            cursor: "pointer",
                          }}
                        >
                          {selected ? (
                            <CheckCircleRoundedIcon
                              sx={{
                                color: "primary.main",
                                fontSize: 20,
                              }}
                            />
                          ) : (
                            <RadioButtonUncheckedIcon
                              sx={{
                                color: "text.secondary",
                                fontSize: 20,
                              }}
                            />
                          )}
                          <Typography variant="body2">{option}</Typography>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Stack>
              </Paper>
            ))}

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: getSurfaceBackground(theme, 0.92),
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1.2}
              >
                <Typography variant="body2" color="text.secondary">
                  {submittedResponseId
                    ? "Your response has been recorded."
                    : "Your responses will be submitted for this session."}
                </Typography>
                {submittedResponseId && onContinue ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onContinue(submittedResponseId)}
                  >
                    {continueLabel}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitLoading || Boolean(submittedResponseId)}
                  >
                    {submitLoading
                      ? "Submitting..."
                      : submittedResponseId
                        ? "Submitted"
                        : "Submit Form"}
                  </Button>
                )}
              </Stack>
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  );
}
