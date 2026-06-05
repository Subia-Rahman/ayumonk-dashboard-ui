import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { fetchCompanies } from "../../store/companySlice";
import { fetchThemes } from "../../store/themeSlice";
import { fetchKpis } from "../../store/kpiSlice";
import {
  clearQuestionCreateState,
  clearQuestionDetailState,
  clearQuestionUpdateState,
  createQuestion,
  fetchQuestionById,
  updateQuestion,
} from "../../store/questionSlice";
import { getSurfaceBackground } from "../../theme";
import { getCompanyId } from "../../utils/roleHelper";
import usePermissions from "../../hooks/usePermissions";

const createEmptyOption = (index) => ({
  option_number: index + 1,
  option_text: "",
  score: index + 1,
});

const emptyForm = {
  company_id: "",
  theme_key: "",
  kpi_key: "",
  question_code: "",
  question_text: "",
  reverse_code: false,
  options: [createEmptyOption(0), createEmptyOption(1)],
};

export default function QuestionWorkflowForm({ mode, role = "admin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { companies: companyItems = [] } = useSelector((state) => state.company) || {};
  const { items: themeItems } = useSelector((state) => state.theme);
  const { items: kpiItems } = useSelector((state) => state.kpi);
  const {
    selectedQuestion,
    detailLoading,
    detailError,
    createLoading,
    createError,
    updateLoading,
    updateError,
  } = useSelector((state) => state.question);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const { canCreate, canEdit } = usePermissions();
  const canSubmitForm = mode === "edit" ? canEdit("questions") : canCreate("questions");

  useEffect(() => {
    dispatch(fetchCompanies());

    if (mode === "edit" && id) {
      dispatch(fetchQuestionById(id));
    }

    return () => {
      dispatch(clearQuestionCreateState());
      dispatch(clearQuestionUpdateState());
      dispatch(clearQuestionDetailState());
    };
  }, [dispatch, id, mode]);

  useEffect(() => {
    if (mode === "edit" && selectedQuestion) {
      setForm({
        company_id: selectedQuestion.company_id || "",
        theme_key: selectedQuestion.theme_key || "",
        kpi_key: selectedQuestion.kpi_key || "",
        question_code: selectedQuestion.question_code || "",
        question_text: selectedQuestion.question_text || "",
        reverse_code: Boolean(selectedQuestion.reverse_code),
        options:
          selectedQuestion.options?.length > 0
            ? selectedQuestion.options.map((item, index) => ({
                option_number: item.option_number ?? index + 1,
                option_text: item.option_text || "",
                score: item.score ?? index + 1,
              }))
            : [createEmptyOption(0), createEmptyOption(1)],
      });
    }
  }, [mode, selectedQuestion]);

  const filteredKpis = useMemo(
    () =>
      form.theme_key
        ? kpiItems.filter((item) => item.theme_key === form.theme_key)
        : [],
    [form.theme_key, kpiItems],
  );

  const selectedCompanyId = useMemo(
    () => (role === "superadmin" ? form.company_id : getCompanyId()),
    [form.company_id, role],
  );

  const resolvedCompanyId = useMemo(
    () => selectedCompanyId,
    [selectedCompanyId],
  );

  useEffect(() => {
    if (selectedCompanyId) {
      dispatch(fetchThemes({ isActive: true, companyId: selectedCompanyId }));
    }
  }, [dispatch, selectedCompanyId]);

  useEffect(() => {
    if (selectedCompanyId) {
      dispatch(fetchKpis({ isActive: true, companyId: selectedCompanyId }));
    }
  }, [dispatch, selectedCompanyId]);

  const validate = () => {
    if (role === "superadmin" && !resolvedCompanyId) {
      return "Company is required.";
    }
    if (!form.theme_key || !form.kpi_key) {
      return "Theme and KPI are required.";
    }
    if (!form.question_code.trim() || !form.question_text.trim()) {
      return "Question code and question text are required.";
    }

    if (form.options.length < 2) {
      return "Add at least two options.";
    }

    const hasInvalidOption = form.options.some(
      (option) =>
        !option.option_text.trim() || Number.isNaN(Number(option.score)),
    );

    if (hasInvalidOption) {
      return "All options must have text and valid scores.";
    }

    return "";
  };

  const handleSave = async () => {
    const nextError = validate();
    if (nextError) {
      setFormError(nextError);
      return;
    }

    setFormError("");

    const payload = {
      companyId: resolvedCompanyId || undefined,
      theme_key: form.theme_key,
      kpi_key: form.kpi_key,
      question_code: form.question_code.trim(),
      question_text: form.question_text.trim(),
      reverse_code: form.reverse_code,
      options: form.options.map((option, index) => ({
        option_number: index + 1,
        option_text: option.option_text.trim(),
        score: Number(option.score) || 0,
      })),
    };

    try {
      if (mode === "edit") {
        await dispatch(updateQuestion({ questionId: id, question: payload, companyId: resolvedCompanyId || undefined })).unwrap();
      } else {
        await dispatch(createQuestion({ ...payload, companyId: resolvedCompanyId || undefined })).unwrap();
      }

      //navigate("/admin/questions", {
        navigate(role === "superadmin" ? "/super-admin/questions" : "/admin/questions", {
        replace: true,
        state: {
          feedback: {
            severity: "success",
            message: `Question ${mode === "edit" ? "updated" : "created"} successfully.`,
          },
        },
      });
    } catch {
      // Redux state already stores the API error.
    }
  };

  if (mode === "edit" && detailLoading) {
    return (
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
    );
  }

  return (
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
            {mode === "edit" ? "Edit Question" : "Add Question"}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Manage KPI question content and its scored response options.
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => 
            //navigate("/admin/questions")}
            navigate(role === "superadmin" ? "/super-admin/questions" : "/admin/questions")}
        >
          Back to list
        </Button>
      </Stack>

      {(formError || detailError || createError || updateError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError || detailError || createError || updateError}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        {role === "superadmin" && (
          <TextField
            label="Company"
            select
            value={form.company_id}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                company_id: event.target.value,
                theme_key: "",
                kpi_key: "",
              }))
            }
            fullWidth
            sx={{ gridColumn: "1 / -1" }}
          >
            <MenuItem value="">Select Company</MenuItem>
            {companyItems.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.company_name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          label="Theme"
          select
          value={form.theme_key}
          disabled={role === "superadmin" && !selectedCompanyId}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              theme_key: event.target.value,
              kpi_key:
                current.kpi_key &&
                !kpiItems.some(
                  (item) =>
                    item.kpi_key === current.kpi_key &&
                    item.theme_key === event.target.value,
                )
                  ? ""
                  : current.kpi_key,
            }))
          }
          fullWidth
        >
          <MenuItem value="">
            {role === "superadmin" && !selectedCompanyId
              ? "Select a company first"
              : "Select Theme"}
          </MenuItem>
          {themeItems.map((item) => (
            <MenuItem key={item.theme_key} value={item.theme_key}>
              {item.theme_display_name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="KPI"
          select
          value={form.kpi_key}
          disabled={!form.theme_key}
          onChange={(event) =>
            setForm((current) => ({ ...current, kpi_key: event.target.value }))
          }
          fullWidth
        >
          <MenuItem value="">
            {form.theme_key ? "Select KPI" : "Select a theme first"}
          </MenuItem>
          {filteredKpis.map((item) => (
            <MenuItem key={item.kpi_key} value={item.kpi_key}>
              {item.display_name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Question Code"
          value={form.question_code}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              question_code: event.target.value,
            }))
          }
          fullWidth
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.reverse_code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reverse_code: event.target.checked,
                }))
              }
            />
          }
          label="Reverse coded"
          sx={{ px: 1, py: 1 }}
        />

        <TextField
          label="Question Text"
          value={form.question_text}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              question_text: event.target.value,
            }))
          }
          multiline
          minRows={4}
          fullWidth
          sx={{ gridColumn: "1 / -1" }}
        />
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mt: 3, mb: 2 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Question Options
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add or remove options as needed. At least two are required.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<AddRoundedIcon />}
          onClick={() =>
            setForm((current) => ({
              ...current,
              options: [...current.options, createEmptyOption(current.options.length)],
            }))
          }
        >
          Add Option
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {form.options.map((option, index) => (
          <Paper key={option.option_number} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ md: "center" }}
            >
              <Typography sx={{ minWidth: 84, fontWeight: 700 }}>
                Option {index + 1}
              </Typography>
              <TextField
                label="Option Text"
                value={option.option_text}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    options: current.options.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, option_text: event.target.value }
                        : item,
                    ),
                  }))
                }
                fullWidth
              />
              <TextField
                label="Score"
                type="number"
                value={option.score}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    options: current.options.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, score: event.target.value }
                        : item,
                    ),
                  }))
                }
                sx={{ width: { xs: "100%", md: 110 } }}
              />
              <IconButton
                color="error"
                disabled={form.options.length <= 2}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    options: current.options
                      .filter((_, itemIndex) => itemIndex !== index)
                      .map((item, itemIndex) => ({
                        ...item,
                        option_number: itemIndex + 1,
                      })),
                  }))
                }
              >
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Stack direction="row" spacing={1.25} sx={{ mt: 3 }}>
        {canSubmitForm && (
          <Button
            variant="contained"
            startIcon={<SaveRoundedIcon />}
            onClick={handleSave}
            disabled={createLoading || updateLoading}
          >
            {createLoading || updateLoading
              ? "Saving..."
              : mode === "edit"
                ? "Update Question"
                : "Create Question"}
          </Button>
        )}
        <Button variant="outlined" onClick={() => 
          //navigate("/admin/questions")}
          navigate(role === "superadmin" ? "/super-admin/questions" : "/admin/questions")}
          >
          Cancel
        </Button>
      </Stack>
    </Paper>
  );
}
