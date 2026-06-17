import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearAdminSuggestionCreateState,
  clearAdminSuggestionDetailState,
  clearAdminSuggestionUpdateState,
  createAdminSuggestion,
  fetchAdminSuggestionById,
  updateAdminSuggestion,
} from "../../store/adminSuggestionSlice";
import { getSurfaceBackground } from "../../theme";
import usePermissions from "../../hooks/usePermissions";

const suggestionTypeOptions = ["aahar", "vihar", "aushadh"];
const doshaOptions = ["all", "vata", "pitta", "kapha"];
const difficultyOptions = ["easy", "moderate", "advanced"];

const defaultFormValues = {
  suggestion_type: "aahar",
  title: "",
  description: "",
  url: "",
  dosha_type: "all",
  difficulty: "easy",
  duration_mins: "",
  is_active: true,
};

const normalizeFormValues = (item) => ({
  suggestion_type: item?.suggestion_type || "aahar",
  title: item?.title || "",
  description: item?.description || "",
  url: item?.url || "",
  dosha_type: item?.dosha_type || "all",
  difficulty: item?.difficulty || "easy",
  duration_mins:
    item?.duration_mins === null || item?.duration_mins === undefined
      ? ""
      : String(item.duration_mins),
  is_active: item?.is_active ?? true,
});

const buildPayload = (values) => ({
  suggestion_type: values.suggestion_type,
  title: values.title.trim(),
  description: values.description.trim(),
  url: values.url.trim(),
  dosha_type: values.dosha_type,
  difficulty: values.difficulty,
  duration_mins: Number(values.duration_mins || 0),
  is_active: Boolean(values.is_active),
});

const validateForm = (values) => {
  if (!values.title.trim()) return "Title is required.";
  if (!values.description.trim()) return "Description is required.";
  if (!values.suggestion_type) return "Suggestion type is required.";
  if (!values.dosha_type) return "Dosha type is required.";
  if (!values.difficulty) return "Difficulty is required.";
  if (values.duration_mins === "") return "Duration is required.";

  const duration = Number(values.duration_mins);
  if (!Number.isFinite(duration) || duration < 0) {
    return "Duration must be 0 or more.";
  }

  return "";
};

export default function SuggestionForm({ mode }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const returnBase = location.state?.returnBase || "/super-admin/suggestion-master";
  const { id } = useParams();
  const {
    selectedSuggestion,
    detailLoading,
    detailError,
    createLoading,
    createError,
    updateLoading,
    updateError,
  } = useSelector((state) => state.adminSuggestion);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [formError, setFormError] = useState("");

  const isEdit = mode === "edit";
  const isSubmitting = createLoading || updateLoading;
  const { canCreate, canEdit } = usePermissions();
  const canSubmitForm = isEdit ? canEdit("suggestion-master") : canCreate("suggestion-master");
  const pageTitle = useMemo(
    () => (isEdit ? "Edit Suggestion" : "Add Suggestion"),
    [isEdit],
  );

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchAdminSuggestionById(id));
    }

    return () => {
      dispatch(clearAdminSuggestionCreateState());
      dispatch(clearAdminSuggestionUpdateState());
      dispatch(clearAdminSuggestionDetailState());
    };
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && selectedSuggestion) {
      setFormValues(normalizeFormValues(selectedSuggestion));
    }
  }, [isEdit, selectedSuggestion]);

  const handleChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
    setFormError("");
  };

  const handleSave = async () => {
    const nextError = validateForm(formValues);
    if (nextError) {
      setFormError(nextError);
      return;
    }

    try {
      if (isEdit) {
        await dispatch(
          updateAdminSuggestion({
            suggestionId: id,
            suggestion: buildPayload(formValues),
          }),
        ).unwrap();
      } else {
        await dispatch(createAdminSuggestion(buildPayload(formValues))).unwrap();
      }

      navigate(returnBase, {
        replace: true,
        state: {
          feedback: {
            severity: "success",
            message: isEdit
              ? "Suggestion updated successfully."
              : "Suggestion created successfully.",
          },
        },
      });
    } catch {
      // Redux state already stores the error.
    }
  };

  if (isEdit && detailLoading) {
    return (
      <Layout role="superadmin" title={pageTitle}>
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
    <Layout role="superadmin" title={pageTitle}>
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
              {pageTitle}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {isEdit
                ? "Update suggestion content, targeting metadata, and status."
                : "Create a new suggestion record for the recommendation library."}
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate(returnBase)}
          >
            Back to list
          </Button>
        </Stack>

        {(formError || detailError || createError || updateError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError || detailError || createError || updateError}
          </Alert>
        )}

        <Stack spacing={3}>
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
            <TextField
              label="Suggestion Type"
              select
              value={formValues.suggestion_type}
              onChange={(event) =>
                handleChange("suggestion_type", event.target.value)
              }
              fullWidth
            >
              {suggestionTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Title"
              value={formValues.title}
              onChange={(event) => handleChange("title", event.target.value)}
              fullWidth
            />
            <TextField
              label="Dosha Type"
              select
              value={formValues.dosha_type}
              onChange={(event) => handleChange("dosha_type", event.target.value)}
              fullWidth
            >
              {doshaOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Difficulty"
              select
              value={formValues.difficulty}
              onChange={(event) => handleChange("difficulty", event.target.value)}
              fullWidth
            >
              {difficultyOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Duration (mins)"
              type="number"
              value={formValues.duration_mins}
              onChange={(event) => handleChange("duration_mins", event.target.value)}
              fullWidth
              inputProps={{ min: 0 }}
            />
            <TextField
              label="URL"
              value={formValues.url}
              onChange={(event) => handleChange("url", event.target.value)}
              fullWidth
            />
          </Box>

          <TextField
            label="Description"
            value={formValues.description}
            onChange={(event) => handleChange("description", event.target.value)}
            fullWidth
            multiline
            minRows={5}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formValues.is_active}
                onChange={(event) => handleChange("is_active", event.target.checked)}
              />
            }
            label={formValues.is_active ? "Suggestion is active" : "Suggestion is inactive"}
          />

          <Stack direction="row" spacing={1.5}>
            {canSubmitForm && (
              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Suggestion"}
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate(returnBase)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Layout>
  );
}
