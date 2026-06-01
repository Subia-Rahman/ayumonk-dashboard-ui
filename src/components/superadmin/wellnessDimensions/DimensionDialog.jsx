import { useMemo, useState } from "react";
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
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

const RESERVED_KEY = "wellnessindex";

// Mirrors the backend's slugifier: lowercase + spaces→underscores.
// Used for the create-time preview so the user knows what key the server
// will persist; the backend re-slugifies authoritatively.
const slugify = (raw) =>
  (raw || "").toLowerCase().replace(/\s+/g, "_").trim();

const validateCreate = (values) => {
  const errors = [];
  if (!values.company_id) errors.push("Company is required.");
  if (!values.dimension_label.trim()) {
    errors.push("Display label is required.");
  }
  if (!values.dimension_key.trim()) {
    errors.push("Key is required.");
  } else if (slugify(values.dimension_key) === RESERVED_KEY) {
    errors.push(`"${RESERVED_KEY}" is reserved and cannot be used as a key.`);
  }
  return errors;
};

const validateEdit = (values) => {
  const errors = [];
  if (!values.dimension_label.trim()) {
    errors.push("Display label is required.");
  }
  return errors;
};

const diffEdit = (original, current) => {
  const out = {};
  if (current.dimension_label.trim() !== (original?.dimension_label || "").trim()) {
    out.dimension_label = current.dimension_label.trim();
  }
  const newOrder = Number(current.display_order);
  if (!Number.isNaN(newOrder) && newOrder !== Number(original?.display_order ?? 0)) {
    out.display_order = newOrder;
  }
  if (Boolean(current.is_active) !== Boolean(original?.is_active ?? true)) {
    out.is_active = Boolean(current.is_active);
  }
  return out;
};

export default function DimensionDialog({
  open,
  mode = "create",
  loading,
  error,
  dimension,
  companies = [],
  companiesLoading = false,
  defaultCompanyId = "",
  isPlatformAdmin = false,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === "edit";
  const [values, setValues] = useState(() => ({
    company_id:
      dimension?.company_id || defaultCompanyId || "",
    dimension_key: dimension?.dimension_key || "",
    dimension_label: dimension?.dimension_label || "",
    display_order: dimension?.display_order ?? 0,
    is_active: dimension?.is_active == null ? true : Boolean(dimension.is_active),
  }));
  const [localErrors, setLocalErrors] = useState([]);

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const slugPreview = useMemo(
    () => slugify(values.dimension_key),
    [values.dimension_key],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const errs = isEdit ? validateEdit(values) : validateCreate(values);
    setLocalErrors(errs);
    if (errs.length > 0) return;

    if (isEdit) {
      const diff = diffEdit(dimension, values);
      if (Object.keys(diff).length === 0) {
        setLocalErrors(["No changes to save."]);
        return;
      }
      // Pass company_id so the page handler doesn't have to guess between
      // the row's company and the page's currently-selected company.
      onSubmit({ companyId: values.company_id, fields: diff });
    } else {
      onSubmit({
        companyId: values.company_id,
        dimension_key: slugify(values.dimension_key),
        dimension_label: values.dimension_label.trim(),
        display_order:
          values.display_order === "" || values.display_order == null
            ? 0
            : Number(values.display_order),
      });
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
      <DialogTitle>
        {isEdit ? "Edit dimension" : "Create dimension"}
        {isEdit && dimension?.dimension_key && (
          <Typography
            component="span"
            variant="body2"
            sx={{ ml: 1, color: "text.secondary", fontFamily: "monospace" }}
          >
            {dimension.dimension_key}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {isEdit
            ? "Partial update — only the changed fields are sent. The dimension_key and company are immutable."
            : 'The key is slugified (lowercase, spaces→underscores). "wellnessindex" is reserved.'}
        </Typography>

        <Stack spacing={2}>
          <Autocomplete
            options={companies}
            loading={companiesLoading}
            getOptionLabel={(o) => o?.company_name || ""}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={companies.find((c) => c.id === values.company_id) || null}
            onChange={(_event, newValue) =>
              setValues((prev) => ({
                ...prev,
                company_id: newValue?.id || "",
              }))
            }
            // Edit: company is immutable.
            // Create: only platform admins may pick another tenant.
            disabled={loading || isEdit || !isPlatformAdmin}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Company"
                required
                placeholder={
                  isPlatformAdmin ? "Select a company" : "Your company"
                }
                helperText={
                  isEdit
                    ? "Company is immutable — recreate the dimension to change it."
                    : !isPlatformAdmin
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
          {!isEdit && (
            <TextField
              label="Key"
              value={values.dimension_key}
              onChange={handleChange("dimension_key")}
              required
              autoFocus
              fullWidth
              placeholder="Physical Wellness"
              helperText={
                slugPreview
                  ? `Will be stored as: ${slugPreview}`
                  : "Lowercase, no spaces. The backend slugifies this."
              }
              InputProps={{
                endAdornment: slugPreview ? (
                  <InputAdornment position="end">
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontFamily: "monospace" }}
                    >
                      → {slugPreview}
                    </Typography>
                  </InputAdornment>
                ) : null,
              }}
              disabled={loading}
            />
          )}
          <TextField
            label="Display label"
            value={values.dimension_label}
            onChange={handleChange("dimension_label")}
            required
            fullWidth
            placeholder="Physical Wellness"
            disabled={loading}
          />
          <TextField
            label="Display order"
            type="number"
            value={values.display_order}
            onChange={handleChange("display_order")}
            fullWidth
            inputProps={{ step: 1, min: 0 }}
            helperText="Lower values render first in the dimension picker."
            disabled={loading}
          />
          {isEdit && (
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
          )}
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
          {loading
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
            ? "Save changes"
            : "Create dimension"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
