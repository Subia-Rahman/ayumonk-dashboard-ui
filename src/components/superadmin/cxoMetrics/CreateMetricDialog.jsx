import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { fetchKpis } from "../../../store/kpiSlice";
import { fetchThemes } from "../../../store/themeSlice";

const WEIGHT_MIN = 0.1;
const WEIGHT_MAX = 5.0;
const WEIGHT_STEP = 0.1;
const DEFAULT_WEIGHT = 1.0;

const headerSx = {
  fontSize: 10,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "text.secondary",
  fontWeight: 700,
};

const localValidate = ({ companyId, metricCode, themeKeys, kpiRows }) => {
  const errors = [];
  if (!companyId) errors.push("Company is required.");
  if (!metricCode) errors.push("CXO metric is required.");
  if (!themeKeys || themeKeys.length === 0) {
    errors.push("At least one theme is required.");
  }
  if (!kpiRows || kpiRows.length === 0) {
    errors.push("At least one KPI mapping is required.");
  } else {
    const seen = new Set();
    kpiRows.forEach((row, idx) => {
      if (!row.kpi_key) {
        errors.push(`Row ${idx + 1}: select a KPI.`);
      } else if (seen.has(row.kpi_key)) {
        errors.push(`Row ${idx + 1}: KPI is duplicated.`);
      } else {
        seen.add(row.kpi_key);
      }
      const w = Number(row.weight);
      if (Number.isNaN(w) || w < WEIGHT_MIN || w > WEIGHT_MAX) {
        errors.push(
          `Row ${idx + 1}: weight must be between ${WEIGHT_MIN} and ${WEIGHT_MAX}.`,
        );
      }
    });
  }
  return errors;
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
  metrics = [],
  metricsLoading = false,
  isPlatformAdmin = false,
}) {
  const muiTheme = useTheme();
  const dispatch = useDispatch();

  const [companyId, setCompanyId] = useState(defaultCompanyId || "");
  const [metricCode, setMetricCode] = useState("");
  const [themeKeys, setThemeKeys] = useState([]);
  const [kpiRows, setKpiRows] = useState([]);
  const [localErrors, setLocalErrors] = useState([]);

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

  // Fetch themes scoped to the selected company.
  useEffect(() => {
    if (open && companyId) {
      dispatch(fetchThemes({ companyId, isActive: true, limit: 200 }));
    }
  }, [dispatch, open, companyId]);

  // Fetch all active KPIs for the company once; filtering by selected themes
  // happens client-side so toggling themes doesn't trigger refetches.
  useEffect(() => {
    if (open && companyId) {
      dispatch(fetchKpis({ companyId, isActive: true, limit: 500 }));
    }
  }, [dispatch, open, companyId]);

  // When the user changes company, clear downstream selections — old theme /
  // KPI rows would otherwise reference a different tenant.
  const handleSelectCompany = (newId) => {
    if (newId === companyId) return;
    setCompanyId(newId);
    setThemeKeys([]);
    setKpiRows([]);
  };

  // When themes change, only drop KPI rows whose theme is no longer selected —
  // rows tied to still-selected themes are preserved.
  const handleChangeThemes = (newThemes) => {
    const newKeys = newThemes.map((t) => t.theme_key);
    setThemeKeys(newKeys);
    setKpiRows((prev) =>
      prev.filter((row) => {
        if (!row.kpi_key) return true; // empty row, let the user fill it
        const k = kpis.find((x) => x.kpi_key === row.kpi_key);
        return !k || newKeys.includes(k.theme_key);
      }),
    );
  };

  const themeKeySet = useMemo(() => new Set(themeKeys), [themeKeys]);

  const activeKpiKeys = useMemo(
    () => new Set(kpiRows.map((r) => r.kpi_key).filter(Boolean)),
    [kpiRows],
  );

  const availableKpis = useMemo(
    () =>
      kpis.filter(
        (k) => k.is_active && (themeKeySet.size === 0 || themeKeySet.has(k.theme_key)),
      ),
    [kpis, themeKeySet],
  );

  const selectedThemes = useMemo(
    () => themes.filter((t) => themeKeySet.has(t.theme_key)),
    [themes, themeKeySet],
  );

  const handleAddKpiRow = () => {
    setKpiRows((prev) => [
      ...prev,
      { kpi_key: "", weight: DEFAULT_WEIGHT },
    ]);
  };

  const handleChangeKpi = (idx, kpiKey) => {
    setKpiRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, kpi_key: kpiKey } : row)),
    );
  };

  const handleChangeWeight = (idx, value) => {
    setKpiRows((prev) =>
      prev.map((row, i) =>
        i === idx ? { ...row, weight: value === "" ? "" : Number(value) } : row,
      ),
    );
  };

  const handleRemoveRow = (idx) => {
    setKpiRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalWeight = useMemo(
    () =>
      kpiRows.reduce((acc, row) => acc + (Number(row.weight) || 0), 0),
    [kpiRows],
  );

  const selectedMetric = useMemo(
    () => metrics.find((m) => m.metric_code === metricCode) || null,
    [metrics, metricCode],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = localValidate({ companyId, metricCode, themeKeys, kpiRows });
    setLocalErrors(errors);
    if (errors.length > 0) return;

    onSubmit({
      companyId,
      metricId: selectedMetric?.id || "",
      metricCode,
      kpi_mappings: kpiRows.map((row) => ({
        kpi_key: row.kpi_key,
        weight: Number(row.weight) || 0,
      })),
    });
  };

  const previewParts = useMemo(() => {
    return kpiRows
      .filter((row) => row.kpi_key)
      .map((row) => {
        const k = kpis.find((x) => x.kpi_key === row.kpi_key);
        const name = k?.display_name || row.kpi_key;
        const weight = Number(row.weight) || 0;
        return `(Average of KPI Scores of employees obtained in ${name} × ${weight.toFixed(1)})`;
      });
  }, [kpiRows, kpis]);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ component: "form", onSubmit: handleSubmit, noValidate: true }}
    >
      <DialogTitle>Create CXO metric</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Configure how a CXO metric is derived from theme-scoped KPIs for a
          company. Each KPI contributes to the metric using its weight.
        </Typography>

        <Stack spacing={2.25}>
          <Autocomplete
            options={companies}
            loading={companiesLoading}
            getOptionLabel={(option) => option?.company_name || ""}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={companies.find((c) => c.id === companyId) || null}
            onChange={(_event, newValue) =>
              handleSelectCompany(newValue?.id || "")
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
            label="CXO metric"
            value={metricCode}
            onChange={(event) => setMetricCode(event.target.value)}
            required
            fullWidth
            disabled={loading || !companyId || metricsLoading}
            helperText={
              !companyId
                ? "Select a company first."
                : metricsLoading
                ? "Loading metrics..."
                : metrics.length === 0
                ? "No CXO metrics available."
                : undefined
            }
          >
            {metrics.map((m) => (
              <MenuItem key={m.metric_code} value={m.metric_code}>
                {m.display_name}
                {m.formula_type ? ` — ${m.formula_type}` : ""}
              </MenuItem>
            ))}
          </TextField>

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={themes}
            loading={themesLoading}
            getOptionLabel={(option) => option?.theme_display_name || ""}
            isOptionEqualToValue={(a, b) => a.theme_key === b.theme_key}
            value={selectedThemes}
            onChange={(_event, newValue) => handleChangeThemes(newValue)}
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
                required
                placeholder={
                  selectedThemes.length === 0 ? "Select one or more themes" : ""
                }
                helperText={
                  !companyId
                    ? "Select a company first."
                    : themesLoading
                    ? "Loading themes..."
                    : themes.length === 0
                    ? "No themes for this company."
                    : "KPIs below are filtered by the selected themes."
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

          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                KPI Mappings
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={handleAddKpiRow}
                disabled={
                  loading ||
                  themeKeys.length === 0 ||
                  kpisLoading ||
                  availableKpis.length === 0 ||
                  activeKpiKeys.size >= availableKpis.length
                }
              >
                Add KPI
              </Button>
            </Stack>

            {kpisError && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                {kpisError}
              </Alert>
            )}

            {themeKeys.length === 0 ? (
              <Box
                sx={{
                  py: 3,
                  textAlign: "center",
                  color: "text.secondary",
                  border: `1px dashed ${muiTheme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2">
                  Select one or more themes to load their KPIs.
                </Typography>
              </Box>
            ) : kpisLoading && availableKpis.length === 0 ? (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ py: 2, color: "text.secondary" }}
              >
                <CircularProgress size={16} />
                <Typography variant="body2">Loading KPIs...</Typography>
              </Stack>
            ) : kpiRows.length === 0 ? (
              <Box
                sx={{
                  py: 3,
                  textAlign: "center",
                  color: "text.secondary",
                  border: `1px dashed ${muiTheme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2">
                  {availableKpis.length === 0
                    ? "No active KPIs configured for the selected themes."
                    : 'Click "Add KPI" to begin mapping.'}
                </Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerSx}>KPI</TableCell>
                    <TableCell sx={{ ...headerSx, width: 150 }}>
                      Weight
                    </TableCell>
                    <TableCell
                      sx={{ ...headerSx, width: 60, textAlign: "right" }}
                    >
                      Remove
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kpiRows.map((row, idx) => {
                    const optionsForRow = availableKpis.filter(
                      (k) =>
                        k.kpi_key === row.kpi_key ||
                        !activeKpiKeys.has(k.kpi_key),
                    );
                    return (
                      <TableRow key={`kpi-row-${idx}`} hover>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={row.kpi_key}
                            onChange={(event) =>
                              handleChangeKpi(idx, event.target.value)
                            }
                            disabled={loading}
                            displayEmpty
                          >
                            <MenuItem value="" disabled>
                              Select KPI
                            </MenuItem>
                            {optionsForRow.map((k) => {
                              const t = themes.find(
                                (x) => x.theme_key === k.theme_key,
                              );
                              const themeLabel = t?.theme_display_name;
                              return (
                                <MenuItem key={k.kpi_key} value={k.kpi_key}>
                                  {k.display_name}
                                  {themeLabel ? (
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      sx={{ ml: 1, color: "text.secondary" }}
                                    >
                                      · {themeLabel}
                                    </Typography>
                                  ) : null}
                                </MenuItem>
                              );
                            })}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={row.weight}
                            onChange={(event) =>
                              handleChangeWeight(idx, event.target.value)
                            }
                            disabled={loading}
                            inputProps={{
                              step: WEIGHT_STEP,
                              min: WEIGHT_MIN,
                              max: WEIGHT_MAX,
                              "aria-label": `Weight for row ${idx + 1}`,
                            }}
                            sx={{ width: 130 }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <Tooltip title="Remove row">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveRow(idx)}
                                disabled={loading}
                                aria-label={`Remove row ${idx + 1}`}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mt: 1 }}
            >
              Weight range {WEIGHT_MIN}–{WEIGHT_MAX} (step {WEIGHT_STEP}),
              default {DEFAULT_WEIGHT}. Allows one KPI to contribute more than
              another to the metric.
            </Typography>
          </Box>

          {selectedMetric && previewParts.length > 0 && (
            <Box
              sx={{
                p: 1.75,
                borderRadius: 2,
                bgcolor: "action.hover",
                fontFamily: "monospace",
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Preview
              </Typography>
              <Box sx={{ mt: 0.75 }}>
                {selectedMetric.display_name} ={" "}
                {previewParts.map((part, idx) => (
                  <Box key={idx} component="span">
                    {idx > 0 ? "  +  " : ""}
                    {part}
                  </Box>
                ))}
                {totalWeight > 0 ? (
                  <Box
                    component="span"
                    sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
                  >
                    ────────────────────────────────
                    <Box component="span" sx={{ display: "block" }}>
                      {totalWeight.toFixed(1)} (sum of weights)
                    </Box>
                  </Box>
                ) : null}
                <Box
                  component="span"
                  sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
                >
                  → converted to 0–100 scale
                </Box>
              </Box>
            </Box>
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
          {loading ? "Saving..." : "Save metric"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
