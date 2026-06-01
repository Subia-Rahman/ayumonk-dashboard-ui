import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

// Sends only the fields that the user actually changed so the partial PUT
// behaves as documented (company_id and metric_code are immutable and
// never go on the wire).
const diffFields = (original, current) => {
  const out = {};
  if (current.display_name.trim() !== (original?.display_name || "").trim()) {
    out.display_name = current.display_name.trim();
  }
  if (current.description !== (original?.description || "")) {
    out.description = current.description;
  }
  if (Boolean(current.is_active) !== Boolean(original?.is_active ?? true)) {
    out.is_active = Boolean(current.is_active);
  }
  return out;
};

export default function CxoMetricDefinitionEditDialog({
  open,
  loading,
  error,
  metric,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(() => ({
    display_name: metric?.display_name || "",
    description: metric?.description || "",
    is_active: metric?.is_active == null ? true : Boolean(metric.is_active),
  }));
  const [localErrors, setLocalErrors] = useState([]);

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = [];
    if (!values.display_name.trim()) {
      errors.push("Display name is required.");
    } else if (values.display_name.length > 100) {
      errors.push("Display name must be ≤ 100 characters.");
    }
    setLocalErrors(errors);
    if (errors.length > 0) return;

    const diff = diffFields(metric, values);
    if (Object.keys(diff).length === 0) {
      setLocalErrors(["No changes to save."]);
      return;
    }
    onSubmit(diff);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: "form", onSubmit: handleSubmit, noValidate: true }}
    >
      <DialogTitle>
        Edit CXO metric{" "}
        <Typography
          component="span"
          variant="body2"
          sx={{ color: "text.secondary", fontFamily: "monospace" }}
        >
          {metric?.metric_code}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Partial update — only changed fields are sent. <code>company_id</code>{" "}
          and <code>metric_code</code> are immutable.
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Display name"
            value={values.display_name}
            onChange={handleChange("display_name")}
            required
            fullWidth
            inputProps={{ maxLength: 100 }}
            disabled={loading}
          />

          <TextField
            label="Description"
            value={values.description}
            onChange={handleChange("description")}
            multiline
            minRows={2}
            fullWidth
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
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
