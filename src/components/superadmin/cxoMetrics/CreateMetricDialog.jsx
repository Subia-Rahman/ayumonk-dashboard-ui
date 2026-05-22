import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

// Mirrors the CxoMetricMasterCreate Pydantic schema on the backend.
// Keep field constraints (lengths, decimal bounds) in sync with
// config_service/app/schemas/cxo_metrics.py.
const FORMULA_TYPES = [
  {
    value: "WEIGHTED_AVG",
    label: "WEIGHTED_AVG — KPI weights sum to 1.0",
  },
  {
    value: "DEFICIT_SUM",
    label: "DEFICIT_SUM — KPI thresholds required",
  },
  {
    value: "COMPOSITE",
    label: "COMPOSITE — signal weights sum to 1.0",
  },
];

const DEFAULTS = Object.freeze({
  company_id: "",
  metric_code: "",
  display_name: "",
  unit: "percent",
  scale_min: "0",
  scale_max: "100",
  baseline: "",
  formula_type: "WEIGHTED_AVG",
  description: "",
  methodology_ref: "",
});

// Required-field check before we send to the server. Backend will reject
// anything else (duplicate metric_code, invalid formula_type) and we surface
// that via the `error` prop.
const localValidate = (values) => {
  const errors = [];
  if (!values.company_id) errors.push("Company is required.");
  if (!values.metric_code.trim()) errors.push("Metric code is required.");
  else if (values.metric_code.length > 30)
    errors.push("Metric code must be ≤ 30 characters.");
  if (!values.display_name.trim()) errors.push("Display name is required.");
  else if (values.display_name.length > 100)
    errors.push("Display name must be ≤ 100 characters.");
  if (!values.unit.trim()) errors.push("Unit is required.");
  else if (values.unit.length > 20)
    errors.push("Unit must be ≤ 20 characters.");
  if (!values.formula_type) errors.push("Formula type is required.");

  const numericOrNull = (v) =>
    v === "" || v === null || v === undefined ? null : Number(v);
  const scaleMin = numericOrNull(values.scale_min);
  const scaleMax = numericOrNull(values.scale_max);
  const baseline = numericOrNull(values.baseline);
  if (scaleMin !== null && Number.isNaN(scaleMin))
    errors.push("Scale min must be a number.");
  if (scaleMax !== null && Number.isNaN(scaleMax))
    errors.push("Scale max must be a number.");
  if (baseline !== null && Number.isNaN(baseline))
    errors.push("Baseline must be a number.");
  if (
    scaleMin !== null &&
    scaleMax !== null &&
    !Number.isNaN(scaleMin) &&
    !Number.isNaN(scaleMax) &&
    scaleMin > scaleMax
  ) {
    errors.push("Scale min must be ≤ scale max.");
  }
  return errors;
};

const buildPayload = (values) => {
  const numericOrNull = (v) =>
    v === "" || v === null || v === undefined ? null : Number(v);
  return {
    company_id: values.company_id,
    metric_code: values.metric_code.trim(),
    display_name: values.display_name.trim(),
    unit: values.unit.trim(),
    scale_min: numericOrNull(values.scale_min) ?? 0,
    scale_max: numericOrNull(values.scale_max) ?? 100,
    baseline: numericOrNull(values.baseline),
    formula_type: values.formula_type,
    description: values.description.trim() || null,
    methodology_ref: values.methodology_ref.trim() || null,
  };
};

export default function CreateMetricDialog({
  open,
  loading,
  error,
  onClose,
  onSubmit,
  companies = [],
  companiesLoading = false,
  defaultCompanyId = "",
}) {
  const [values, setValues] = useState({
    ...DEFAULTS,
    company_id: defaultCompanyId || "",
  });
  const [localErrors, setLocalErrors] = useState([]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = localValidate(values);
    setLocalErrors(errors);
    if (errors.length === 0) {
      onSubmit(buildPayload(values));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: "form", onSubmit: handleSubmit, noValidate: true }}
    >
      <DialogTitle>Create CXO metric</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Defines a new platform-level metric (a row in{" "}
          <code>cxo_metric_master</code>) that companies can then configure
          mappings for.
        </Typography>

        <Stack spacing={2}>
          <Autocomplete
            options={companies}
            loading={companiesLoading}
            getOptionLabel={(option) => option?.company_name || ""}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={companies.find((c) => c.id === values.company_id) || null}
            onChange={(_event, newValue) =>
              setValues((prev) => ({
                ...prev,
                company_id: newValue?.id || "",
              }))
            }
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Company"
                required
                placeholder="Select a company"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {companiesLoading ? (
                        <CircularProgress size={18} sx={{ mr: 1 }} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Metric code"
              value={values.metric_code}
              onChange={handleChange("metric_code")}
              required
              autoFocus
              fullWidth
              placeholder="PRODUCTIVITY"
              helperText="Uppercase identifier, max 30 chars. Must be unique."
              inputProps={{ maxLength: 30 }}
              disabled={loading}
            />
            <TextField
              label="Display name"
              value={values.display_name}
              onChange={handleChange("display_name")}
              required
              fullWidth
              placeholder="Productivity"
              inputProps={{ maxLength: 100 }}
              disabled={loading}
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Unit"
              value={values.unit}
              onChange={handleChange("unit")}
              required
              fullWidth
              placeholder="percent, days_per_month, ..."
              inputProps={{ maxLength: 20 }}
              disabled={loading}
            />
            <TextField
              select
              label="Formula type"
              value={values.formula_type}
              onChange={handleChange("formula_type")}
              required
              fullWidth
              disabled={loading}
            >
              {FORMULA_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Scale min"
              type="number"
              value={values.scale_min}
              onChange={handleChange("scale_min")}
              fullWidth
              inputProps={{ step: 0.01 }}
              disabled={loading}
              helperText="Default 0"
            />
            <TextField
              label="Scale max"
              type="number"
              value={values.scale_max}
              onChange={handleChange("scale_max")}
              fullWidth
              inputProps={{ step: 0.01 }}
              disabled={loading}
              helperText="Default 100"
            />
            <TextField
              label="Baseline"
              type="number"
              value={values.baseline}
              onChange={handleChange("baseline")}
              fullWidth
              inputProps={{ step: 0.01 }}
              disabled={loading}
              helperText="DEFICIT_SUM only; blank = NULL"
            />
          </Stack>

          <TextField
            label="Description"
            value={values.description}
            onChange={handleChange("description")}
            multiline
            minRows={2}
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Methodology reference"
            value={values.methodology_ref}
            onChange={handleChange("methodology_ref")}
            fullWidth
            placeholder="Methodology §4.1"
            disabled={loading}
          />
        </Stack>

        {localErrors.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2, whiteSpace: "pre-line" }}>
            {localErrors.join("\n")}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2, whiteSpace: "pre-line" }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Tip: typical platform metrics are PRODUCTIVITY (WEIGHTED_AVG),
            ABSENTEEISM (DEFICIT_SUM, baseline 2.0) and ENGAGEMENT
            (COMPOSITE).
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Creating..." : "Create metric"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
