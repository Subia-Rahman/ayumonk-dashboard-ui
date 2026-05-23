import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";

const DEFAULTS = Object.freeze({
  company_id: "",
  metric_code: "",
  display_name: "",
  description: "",
  is_active: true,
});

const localValidate = (values) => {
  const errors = [];
  if (!values.company_id) errors.push("Company is required.");
  if (!values.metric_code.trim()) errors.push("Metric code is required.");
  else if (values.metric_code.length > 30)
    errors.push("Metric code must be ≤ 30 characters.");
  if (!values.display_name.trim()) errors.push("Display name is required.");
  else if (values.display_name.length > 100)
    errors.push("Display name must be ≤ 100 characters.");
  return errors;
};

const buildPayload = (values) => ({
  company_id: values.company_id,
  metric_code: values.metric_code.trim(),
  display_name: values.display_name.trim(),
  description: values.description.trim(),
  is_active: Boolean(values.is_active),
});

export default function CxoMetricDefinitionDialog({
  open,
  loading,
  error,
  onClose,
  onSubmit,
  companies = [],
  companiesLoading = false,
  defaultCompanyId = "",
  isPlatformAdmin = false,
}) {
  const [values, setValues] = useState({
    ...DEFAULTS,
    company_id: defaultCompanyId || "",
  });
  const [localErrors, setLocalErrors] = useState([]);

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = localValidate(values);
    setLocalErrors(errors);
    if (errors.length === 0) onSubmit(buildPayload(values));
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: "form", onSubmit: handleSubmit, noValidate: true }}
    >
      <DialogTitle>Create CXO metric definition</DialogTitle>
      <DialogContent dividers>
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
            disabled={loading || !isPlatformAdmin}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Company"
                required
                placeholder={
                  isPlatformAdmin ? "Select a company" : "Your company"
                }
                helperText={
                  !isPlatformAdmin
                    ? "Auto-populated from your account."
                    : undefined
                }
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
              helperText="Uppercase identifier, max 30 chars."
              inputProps={{ maxLength: 30 }}
              disabled={loading}
            />
            <TextField
              label="Display name"
              value={values.display_name}
              onChange={handleChange("display_name")}
              required
              fullWidth
              placeholder="Productivity Score"
              inputProps={{ maxLength: 100 }}
              disabled={loading}
            />
          </Stack>

          <TextField
            label="Description"
            value={values.description}
            onChange={handleChange("description")}
            multiline
            minRows={2}
            fullWidth
            placeholder="Composite productivity metric for the CXO dashboard"
            disabled={loading}
          />

          <FormControlLabel
            control={
              <Switch
                checked={values.is_active}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    is_active: event.target.checked,
                  }))
                }
                disabled={loading}
              />
            }
            label={values.is_active ? "Active" : "Inactive"}
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
