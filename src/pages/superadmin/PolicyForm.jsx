import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  clearPolicyCreateState,
  createPolicy,
} from "../../store/policySlice";
import { fetchCompanies } from "../../store/companySlice";
import { getSurfaceBackground } from "../../theme";
import usePermissions from "../../hooks/usePermissions";

const scopeOptions = ["global", "tenant", "module", "resource"];
const effectOptions = ["allow", "deny"];

const defaultFormValues = {
  name: "",
  module: "global",
  scope: "global",
  description: "",
  conditions: "{}",
  condition_json: "{}",
  effect: "allow",
  tenant_id: "",
  is_active: true,
};

const parseJsonField = (value, label) => {
  const text = String(value ?? "").trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error("not an object");
  } catch {
    throw new Error(`${label} must be valid JSON object.`);
  }
};

export default function PolicyForm() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { createLoading, createError, selectedTenantId } = useSelector(
    (state) => state.policy,
  );
  const { companies } = useSelector((state) => state.company);

  const [formValues, setFormValues] = useState({
    ...defaultFormValues,
    tenant_id: selectedTenantId || "",
  });
  const [formError, setFormError] = useState("");
  const { canCreate } = usePermissions();
  const canSubmitForm = canCreate("policies");

  const pageTitle = useMemo(() => "Add Policy", []);

  useEffect(() => {
    dispatch(fetchCompanies());
    return () => {
      dispatch(clearPolicyCreateState());
    };
  }, [dispatch]);

  const handleChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormError("");
  };

  const handleSave = async () => {
    if (!formValues.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!formValues.module.trim()) {
      setFormError("Module is required.");
      return;
    }
    if (!formValues.scope) {
      setFormError("Scope is required.");
      return;
    }
    if (!formValues.effect) {
      setFormError("Effect is required.");
      return;
    }
    if (!formValues.tenant_id) {
      setFormError("Company is required.");
      return;
    }

    let conditions;
    let conditionJson;
    try {
      conditions = parseJsonField(formValues.conditions, "Conditions");
      conditionJson = parseJsonField(formValues.condition_json, "Condition JSON");
    } catch (parseError) {
      setFormError(parseError.message);
      return;
    }

    try {
      await dispatch(
        createPolicy({
          name: formValues.name.trim(),
          module: formValues.module.trim(),
          scope: formValues.scope,
          description: formValues.description.trim(),
          conditions,
          condition_json: conditionJson,
          effect: formValues.effect,
          tenant_id: formValues.tenant_id,
          is_active: Boolean(formValues.is_active),
        }),
      ).unwrap();

      navigate("/super-admin/policies", {
        replace: true,
        state: {
          feedback: {
            severity: "success",
            message: "Policy created successfully.",
          },
        },
      });
    } catch {
      // Redux state already stores the error.
    }
  };

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
              Define an access policy with module/scope, effect, conditions,
              and tenant binding.
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/super-admin/policies")}
          >
            Back to list
          </Button>
        </Stack>

        {(formError || createError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError || createError}
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
              label="Name"
              value={formValues.name}
              onChange={(event) => handleChange("name", event.target.value)}
              fullWidth
            />
            <TextField
              label="Company"
              select
              value={formValues.tenant_id}
              onChange={(event) => handleChange("tenant_id", event.target.value)}
              fullWidth
            >
              <MenuItem value="">Select tenant</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.company_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Module"
              value={formValues.module}
              onChange={(event) => handleChange("module", event.target.value)}
              fullWidth
            />
            <TextField
              label="Scope"
              select
              value={formValues.scope}
              onChange={(event) => handleChange("scope", event.target.value)}
              fullWidth
            >
              {scopeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Effect"
              select
              value={formValues.effect}
              onChange={(event) => handleChange("effect", event.target.value)}
              fullWidth
            >
              {effectOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={formValues.is_active}
                  onChange={(event) =>
                    handleChange("is_active", event.target.checked)
                  }
                />
              }
              label={
                formValues.is_active ? "Policy is active" : "Policy is inactive"
              }
              sx={{ alignSelf: "center" }}
            />
          </Box>

          <TextField
            label="Description"
            value={formValues.description}
            onChange={(event) => handleChange("description", event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />

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
            <TextField
              label="Conditions (JSON object)"
              value={formValues.conditions}
              onChange={(event) => handleChange("conditions", event.target.value)}
              fullWidth
              multiline
              minRows={6}
              helperText='Example: { "ip": "10.0.0.0/8" }'
              inputProps={{
                style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
              }}
            />
            <TextField
              label="Condition JSON (JSON object)"
              value={formValues.condition_json}
              onChange={(event) =>
                handleChange("condition_json", event.target.value)
              }
              fullWidth
              multiline
              minRows={6}
              helperText='Example: { "time": "09:00-17:00" }'
              inputProps={{
                style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
              }}
            />
          </Box>

          <Stack direction="row" spacing={1.5}>
            {canSubmitForm && (
              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                onClick={handleSave}
                disabled={createLoading}
              >
                {createLoading ? "Saving..." : "Create Policy"}
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate("/super-admin/policies")}
              disabled={createLoading}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Layout>
  );
}
