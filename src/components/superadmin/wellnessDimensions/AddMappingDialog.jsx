import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  Chip,
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
import { fetchKpis } from "../../../store/kpiSlice";
import { fetchThemes } from "../../../store/themeSlice";
import { fetchDimensions } from "../../../store/wellnessDimensionsSlice";

const validate = ({ companyId, dimensionId, kpi_keys, weight }) => {
  const errors = [];
  if (!companyId) errors.push("Select a company.");
  if (!dimensionId) errors.push("Select a dimension.");
  if (!kpi_keys || kpi_keys.length === 0) {
    errors.push("Select at least one KPI.");
  }
  const w = Number(weight);
  if (!Number.isFinite(w) || w <= 0) {
    errors.push("Weight must be a positive number.");
  }
  return errors;
};

export default function AddMappingDialog({
  open,
  loading,
  error,
  companies = [],
  companiesLoading = false,
  defaultCompanyId = "",
  isPlatformAdmin = false,
  defaultDimensionId = "",
  existingKpiKeysByDimension = {},
  onClose,
  onSubmit,
}) {
  const dispatch = useDispatch();

  const {
    dimensions,
    dimensionsLoading,
  } = useSelector((state) => state.wellnessDimensions);
  const {
    items: themes,
    listLoading: themesLoading,
    listError: themesError,
  } = useSelector((state) => state.theme);
  const {
    items: kpis,
    listLoading: kpisLoading,
    listError: kpisError,
  } = useSelector((state) => state.kpi);

  const [companyId, setCompanyId] = useState(defaultCompanyId || "");
  const [dimensionId, setDimensionId] = useState(defaultDimensionId || "");
  const [themeKeys, setThemeKeys] = useState([]);
  const [kpiKeys, setKpiKeys] = useState([]);
  const [weight, setWeight] = useState(1.0);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [localErrors, setLocalErrors] = useState([]);

  // When the user picks a company, refresh dimensions + themes + KPIs for
  // that tenant. Mirrors the cascade in the CXO metrics CreateMetricDialog.
  useEffect(() => {
    if (open && companyId) {
      dispatch(fetchDimensions({ companyId }));
      dispatch(fetchThemes({ companyId, isActive: true, limit: 200 }));
      dispatch(fetchKpis({ companyId, isActive: true, limit: 500 }));
    }
  }, [dispatch, open, companyId]);

  // Changing company invalidates downstream picks — the dimension / theme /
  // KPI under one tenant doesn't apply to another.
  const handleCompanyChange = (newId) => {
    if (newId === companyId) return;
    setCompanyId(newId);
    setDimensionId("");
    setThemeKeys([]);
    setKpiKeys([]);
  };

  // Switching dimension clears the picked KPIs — the "already-mapped"
  // exclusion is per-(dimension, kpi).
  const handleDimensionChange = (newId) => {
    if (newId === dimensionId) return;
    setDimensionId(newId);
    setKpiKeys([]);
  };

  // Switching themes invalidates any picked KPIs that dropped out of the
  // visible pool — easier to just clear all of them.
  const handleThemesChange = (newThemes) => {
    setThemeKeys(newThemes.map((t) => t.theme_key));
    setKpiKeys([]);
  };

  const orderedDimensions = useMemo(() => {
    return [...dimensions].sort((a, b) => {
      const oa = Number(a.display_order ?? 0);
      const ob = Number(b.display_order ?? 0);
      if (oa !== ob) return oa - ob;
      return (a.dimension_label || "").localeCompare(b.dimension_label || "");
    });
  }, [dimensions]);

  const themeKeySet = useMemo(() => new Set(themeKeys), [themeKeys]);

  const selectedThemes = useMemo(
    () => themes.filter((t) => themeKeySet.has(t.theme_key)),
    [themes, themeKeySet],
  );

  const existingForDimension = useMemo(
    () => new Set(existingKpiKeysByDimension[dimensionId] || []),
    [existingKpiKeysByDimension, dimensionId],
  );

  // KPI pool: active, not already mapped under this dimension, and (if
  // themes are picked) restricted to those themes. With no theme selected
  // every active KPI for the company is offered.
  const availableKpis = useMemo(
    () =>
      kpis.filter(
        (k) =>
          k.is_active &&
          !existingForDimension.has(k.kpi_key) &&
          (themeKeySet.size === 0 || themeKeySet.has(k.theme_key)),
      ),
    [kpis, existingForDimension, themeKeySet],
  );

  const kpiKeySet = useMemo(() => new Set(kpiKeys), [kpiKeys]);
  const selectedKpis = useMemo(
    () => kpis.filter((k) => kpiKeySet.has(k.kpi_key)),
    [kpis, kpiKeySet],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const errs = validate({
      companyId,
      dimensionId,
      kpi_keys: kpiKeys,
      weight,
    });
    setLocalErrors(errs);
    if (errs.length > 0) return;
    onSubmit({
      companyId,
      dimensionId,
      kpi_keys: kpiKeys,
      weight: Number(weight),
      display_order: Number(displayOrder) || 0,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ component: "form", onSubmit: handleSubmit, noValidate: true }}
    >
      <DialogTitle>Add KPIs to dimension</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Pick a company, the dimension, and one or more themes. The KPI list
          is filtered by the selected themes; each (dimension, kpi) pair must
          be unique. The weight and display order below apply to every KPI
          you select.
        </Typography>

        <Stack spacing={2.25}>
          <Autocomplete
            options={companies}
            loading={companiesLoading}
            getOptionLabel={(o) => o?.company_name || ""}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={companies.find((c) => c.id === companyId) || null}
            onChange={(_event, newValue) =>
              handleCompanyChange(newValue?.id || "")
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

          <TextField
            select
            label="Dimension"
            value={dimensionId}
            onChange={(event) => handleDimensionChange(event.target.value)}
            required
            fullWidth
            disabled={loading || !companyId || dimensionsLoading}
            helperText={
              !companyId
                ? "Select a company first."
                : dimensionsLoading
                ? "Loading dimensions..."
                : orderedDimensions.length === 0
                ? "No dimensions for this company. Create one first."
                : undefined
            }
          >
            {orderedDimensions.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.dimension_label}
                {!d.is_active ? " (inactive)" : ""}
              </MenuItem>
            ))}
          </TextField>

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={themes}
            loading={themesLoading}
            getOptionLabel={(o) => o?.theme_display_name || ""}
            isOptionEqualToValue={(a, b) => a.theme_key === b.theme_key}
            value={selectedThemes}
            onChange={(_event, newValue) => handleThemesChange(newValue)}
            disabled={loading || !companyId}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.theme_key}>
                <Checkbox checked={selected} sx={{ mr: 1 }} />
                {option.theme_display_name}
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  size="small"
                  label={option.theme_display_name}
                  {...getTagProps({ index })}
                  key={option.theme_key}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Themes"
                placeholder={
                  selectedThemes.length === 0
                    ? "All active KPIs (or filter by theme)"
                    : ""
                }
                helperText={
                  !companyId
                    ? "Select a company first."
                    : themesLoading
                    ? "Loading themes..."
                    : themes.length === 0
                    ? "No themes for this company."
                    : "KPI list below is filtered by these themes."
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {themesLoading ? (
                        <CircularProgress size={18} sx={{ mr: 1 }} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {themesError && <Alert severity="warning">{themesError}</Alert>}

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={availableKpis}
            loading={kpisLoading}
            getOptionLabel={(o) => o?.display_name || o?.kpi_key || ""}
            isOptionEqualToValue={(a, b) => a.kpi_key === b.kpi_key}
            value={selectedKpis}
            onChange={(_event, newValue) =>
              setKpiKeys(newValue.map((k) => k.kpi_key))
            }
            disabled={loading || !companyId || !dimensionId}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.kpi_key}>
                <Checkbox checked={selected} sx={{ mr: 1 }} />
                {option.display_name || option.kpi_key}
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  size="small"
                  label={option.display_name || option.kpi_key}
                  {...getTagProps({ index })}
                  key={option.kpi_key}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="KPIs"
                required
                placeholder={
                  selectedKpis.length === 0 ? "Search KPIs..." : ""
                }
                helperText={
                  !companyId
                    ? "Select a company first."
                    : !dimensionId
                    ? "Pick a dimension first."
                    : kpisLoading
                    ? "Loading KPI catalog..."
                    : availableKpis.length === 0
                    ? themeKeySet.size > 0
                      ? "No active KPIs in the selected theme(s) that aren't already mapped."
                      : "No active KPIs left to add to this dimension."
                    : `Selected ${selectedKpis.length} — all will be added under this dimension with the weight below.`
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {kpisLoading ? (
                        <CircularProgress size={18} sx={{ mr: 1 }} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {kpisError && <Alert severity="warning">{kpisError}</Alert>}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Weight"
              type="number"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              required
              fullWidth
              inputProps={{ step: 0.1, min: 0.1 }}
              helperText="Must be greater than 0."
              disabled={loading}
            />
            <TextField
              label="Display order"
              type="number"
              value={displayOrder}
              onChange={(event) => setDisplayOrder(event.target.value)}
              fullWidth
              inputProps={{ step: 1, min: 0 }}
              helperText="Lower values render first within this dimension."
              disabled={loading}
            />
          </Stack>
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
            ? "Adding..."
            : selectedKpis.length > 1
            ? `Add ${selectedKpis.length} KPIs`
            : "Add KPI"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
