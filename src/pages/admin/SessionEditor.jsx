import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../layouts/commonLayout/Layout";
import { fetchCompanies } from "../../store/companySlice";
import {
  clearSessionDetailError,
  clearSessionError,
  clearSessionMessages,
  createSession,
  fetchSessionById,
  resetSessionFlow,
  updateSession,
} from "../../store/sessionSlice";
import { getSurfaceBackground } from "../../theme";
import { getCompanyId } from "../../utils/roleHelper";
import usePermissions from "../../hooks/usePermissions";

export default function SessionEditor({ mode, role = "superadmin" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { id } = useParams();
  const {
    createdSession,
    createLoading,
    updateLoading,
    createMessage,
    updateMessage,
    error: sessionError,
    updateError,
    detailLoading,
    detailError,
    sessionDetails,
  } = useSelector((state) => state.session);
  const { companies } = useSelector((state) => state.company);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [formError, setFormError] = useState("");
  const fallbackCompanyId = getCompanyId();
  const { canCreate, canEdit } = usePermissions();
  const canSubmitForm = mode === "edit" ? canEdit("sessions") : canCreate("sessions");

  useEffect(() => {
    if (mode === "add") {
      dispatch(resetSessionFlow());
    }

    dispatch(fetchCompanies());
    dispatch(clearSessionMessages());
    dispatch(clearSessionError());
    dispatch(clearSessionDetailError());

    if (mode === "edit" && id) {
      dispatch(fetchSessionById(id));
    }

    return undefined;
  }, [dispatch, id, mode]);

  useEffect(() => {
    if (
      mode === "edit" &&
      sessionDetails &&
      String(sessionDetails.id) === String(id)
    ) {
      setTitle(sessionDetails.title || "");
      setDescription(sessionDetails.description || "");
      setCompanyId(sessionDetails.company_id || fallbackCompanyId || "");
    }
  }, [fallbackCompanyId, id, mode, sessionDetails]);

  const heading = useMemo(
    () => (mode === "edit" ? "Edit Session" : "Add Session"),
    [mode],
  );
  const activeSession = mode === "add" ? createdSession : sessionDetails;
  const selectedCompanyId = role === "admin" ? fallbackCompanyId : companyId;
  const selectedCompanyName = useMemo(
    () =>
      companies.find(
        (company) => company.id === (activeSession?.company_id || selectedCompanyId),
      )?.company_name || activeSession?.company_id || selectedCompanyId || "",
    [activeSession?.company_id, companies, selectedCompanyId],
  );

  const handleSubmit = async () => {
    dispatch(clearSessionMessages());
    dispatch(clearSessionError());
    dispatch(clearSessionDetailError());

    if (!title.trim() || !description.trim()) {
      setFormError("Title and description are required.");
      return;
    }
    if (!selectedCompanyId) {
      setFormError(
        "Company details are unavailable. Please refresh and try again.",
      );
      return;
    }

    setFormError("");

    try {
      if (mode === "edit" && id) {
        await dispatch(
          updateSession({
            sessionId: id,
            title: title.trim(),
            description: description.trim(),
            companyId: selectedCompanyId,
          }),
        ).unwrap();
        navigate("/super-admin/sessions", { replace: true });
      } else {
        await dispatch(
          createSession({
            title: title.trim(),
            description: description.trim(),
            companyId: selectedCompanyId,
          }),
        ).unwrap();
      }
    } catch {
      // Redux state already holds the error.
    }
  };

  const handleCreateAnother = () => {
    dispatch(resetSessionFlow());
    setTitle("");
    setDescription("");
    setFormError("");
  };

  return (
    <Layout role="admin" title={heading}>
      <Paper
        elevation={0}
        sx={{
          // maxWidth: 760,
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: getSurfaceBackground(theme),
        }}
      >
        <Stack spacing={2}>
          {/* <Typography variant="h5" sx={{ fontWeight: 750 }}>
            {heading}
          </Typography>
          <Typography color="text.secondary">
            {mode === "edit"
              ? "Update the session details here."
              : "Create the session details here. After creation, you can continue to add questions and review the session summary."}
          </Typography> */}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                {heading}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                {mode === "edit"
                  ? "Update the session details here."
                  : "Create the session details here. After creation, you can continue to add questions and review the session summary."}
              </Typography>
            </Box>
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate("/super-admin/sessions")}
            >
              Back to list
            </Button>
          </Stack>

          {detailLoading && mode === "edit" && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2">
                Loading session details...
              </Typography>
            </Stack>
          )}

          {!!formError && <Alert severity="error">{formError}</Alert>}
          {!!sessionError && <Alert severity="error">{sessionError}</Alert>}
          {!!updateError && <Alert severity="error">{updateError}</Alert>}
          {!!detailError && <Alert severity="error">{detailError}</Alert>}
          {!!createMessage && <Alert severity="success">{createMessage}</Alert>}
          {!!updateMessage && <Alert severity="success">{updateMessage}</Alert>}

          <TextField
            label="Session Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            fullWidth
            disabled={mode === "add" && Boolean(createdSession?.id)}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            fullWidth
            multiline
            minRows={4}
            disabled={mode === "add" && Boolean(createdSession?.id)}
          />

          <TextField
            label="Company"
            select
            value={selectedCompanyId || ""}
            onChange={(event) => setCompanyId(event.target.value)}
            fullWidth
            disabled={role === "admin"}
          >
            <MenuItem value="">Select Company</MenuItem>
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.company_name}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
            {canSubmitForm && (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={
                  createLoading ||
                  updateLoading ||
                  detailLoading ||
                  (mode === "add" && Boolean(createdSession?.id))
                }
              >
                {createLoading || updateLoading
                  ? mode === "edit"
                    ? "Saving..."
                    : "Creating..."
                  : mode === "edit"
                    ? "Save Session"
                    : createdSession?.id
                      ? "Session Created"
                      : "Create Session"}
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate("/super-admin/sessions")}
            >
              Cancel
            </Button>
            {mode === "add" && createdSession?.id && (
              <>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() =>
                    navigate(`/super-admin/sessions/${createdSession.id}/manage`)
                  }
                >
                  Add Questions
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleCreateAnother}
                >
                  Create Another
                </Button>
              </>
            )}
          </Stack>

          {mode === "add" && createdSession?.id && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1.2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Session Summary
                </Typography>
                <Alert severity="info">
                  Session created successfully. Continue to add questions for
                  this session.
                </Alert>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography>
                    {createdSession.title || title || "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography>
                    {createdSession.description || description || "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Company
                  </Typography>
                  <Typography>{selectedCompanyName || "-"}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Session ID
                  </Typography>
                  <Typography>{createdSession.id}</Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Layout>
  );
}
