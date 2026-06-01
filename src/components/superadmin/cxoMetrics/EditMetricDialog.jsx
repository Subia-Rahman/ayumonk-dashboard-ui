import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const EDITABLE_FIELDS = ["display_name", "unit", "baseline", "methodology_ref"];

const toFormValue = (metric) => ({
  display_name: metric?.display_name ?? "",
  unit: metric?.unit ?? "",
  baseline: metric?.baseline == null ? "" : String(metric.baseline),
  methodology_ref: metric?.methodology_ref ?? "",
});

const localValidate = (values) => {
  const errors = [];
  if (!values.display_name.trim()) errors.push("Display name is required.");
  else if (values.display_name.length > 100)
    errors.push("Display name must be ≤ 100 characters.");
  if (values.unit && values.unit.length > 20)
    errors.push("Unit must be ≤ 20 characters.");
  if (values.baseline !== "" && Number.isNaN(Number(values.baseline)))
    errors.push("Baseline must be a number.");
  return errors;
};

// Build a partial payload containing only fields the user actually changed.
// The backend's PUT semantics are "only the keys you send get applied".
const buildPartial = (values, original) => {
  const orig = toFormValue(original);
  const payload = {};
  for (const field of EDITABLE_FIELDS) {
    const next = values[field];
    const prev = orig[field];
    if (next === prev) continue;
    if (field === "baseline") {
      payload.baseline = next === "" ? null : Number(next);
    } else if (field === "methodology_ref") {
      payload.methodology_ref = next.trim() || null;
    } else {
      payload[field] = next.trim();
    }
  }
  return payload;
};

// The parent remounts this dialog via a `key` prop each time it opens, so
// initial state is seeded from `metric` on mount — no effect needed to sync.
export default function EditMetricDialog({
  open,
  loading,
  error,
  metric,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(() => toFormValue(metric));
  const [localErrors, setLocalErrors] = useState([]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = localValidate(values);
    setLocalErrors(errors);
    if (errors.length > 0) return;
    const partial = buildPartial(values, metric);
    if (Object.keys(partial).length === 0) {
      setLocalErrors(["No changes to save."]);
      return;
    }
    onSubmit(partial);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: "form", onSubmit: handleSubmit, noValidate: true }}
    >
      <DialogTitle>Edit metric</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Only the fields you change are sent. Leave the rest as-is to keep the
          current values.
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Display name"
            value={values.display_name}
            onChange={handleChange("display_name")}
            required
            autoFocus
            fullWidth
            inputProps={{ maxLength: 100 }}
            disabled={loading}
          />
          <TextField
            label="Unit"
            value={values.unit}
            onChange={handleChange("unit")}
            fullWidth
            placeholder="percent, days_per_month, ..."
            inputProps={{ maxLength: 20 }}
            disabled={loading}
          />
          <TextField
            label="Baseline"
            type="number"
            value={values.baseline}
            onChange={handleChange("baseline")}
            fullWidth
            inputProps={{ step: 0.01 }}
            disabled={loading}
            helperText="Blank clears the baseline (NULL)."
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
