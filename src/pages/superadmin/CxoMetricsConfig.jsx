import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import Layout from "../../layouts/commonLayout/Layout";
import { fetchCompanies } from "../../store/companySlice";
import {
  clearCxoCreateState,
  clearCxoDeleteState,
  clearCxoResetState,
  clearCxoSaveState,
  clearCxoUpdateState,
  createCxoMetric,
  deleteCxoMetric,
  fetchCxoMapping,
  fetchCxoMetric,
  fetchCxoMetricsMaster,
  fetchCxoOptions,
  resetCxoMapping,
  saveCxoMapping,
  updateCxoMetric,
} from "../../store/cxoMetricsSlice";
import { getSurfaceBackground } from "../../theme";
import MetricTabs from "../../components/superadmin/cxoMetrics/MetricTabs";
import MappingEditor from "../../components/superadmin/cxoMetrics/MappingEditor";
import ConfirmDialog from "../../components/superadmin/cxoMetrics/ConfirmDialog";
import CreateMetricDialog from "../../components/superadmin/cxoMetrics/CreateMetricDialog";
import EditMetricDialog from "../../components/superadmin/cxoMetrics/EditMetricDialog";
import {
  sumWeights,
  validateMapping,
} from "../../components/superadmin/cxoMetrics/validation";
import usePermissions from "../../hooks/usePermissions";

const PREFERRED_DEFAULT_METRIC = "PRODUCTIVITY";

const cacheKey = (companyId, metricCode) =>
  `${companyId || ""}::${metricCode || ""}`;

const mappingsEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
};

export default function CxoMetricsConfig() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { canEdit } = usePermissions();
  const canEditConfig = canEdit("cxo-metrics");

  const {
    metricsMaster,
    metricsMasterLoading,
    metricsMasterError,
    mappingsByKey,
    mappingLoading,
    mappingError,
    mappingErrorStatus,
    optionsByCompany,
    optionsLoading,
    optionsError,
    saveLoading,
    saveError,
    resetLoading,
    resetError,
    createLoading,
    createError,
    createdMetricCode,
    metricByKey,
    updateLoading,
    updateError,
    deleteLoading,
    deleteError,
  } = useSelector((state) => state.cxoMetrics);

  const { companies, companiesLoading } = useSelector((state) => state.company);
  const isPlatformAdmin = useSelector((state) => state.auth.isPlatformAdmin);
  // A non-platform admin's tenant comes from one of three places, in
  // decreasing order of trust: the JWT claim, the stored user profile, or
  // the company_id persisted in localStorage. Falling through covers tokens
  // issued before the claim existed.
  const ownTenantId = useSelector(
    (state) =>
      state.auth.jwtTenantId || state.auth.user?.company_id || "",
  );

  // RBAC-scoped company list. Platform admins see everything; everyone else
  // sees only their own tenant. The backend also enforces this on the
  // /cxo-metrics endpoints, so the dropdown filter is a UI convenience that
  // matches what the API will actually accept.
  const visibleCompanies = useMemo(() => {
    if (isPlatformAdmin) return companies;
    if (!ownTenantId) return [];
    return companies.filter((c) => c.id === ownTenantId);
  }, [companies, isPlatformAdmin, ownTenantId]);

  const [pickedCompanyId, setPickedCompanyId] = useState("");
  const [pickedMetricCode, setPickedMetricCode] = useState("");

  // Drafts are keyed by (company, metric). Absence of an entry means the user
  // has not edited that mapping yet — the baseline (server) is rendered
  // directly. This avoids syncing server data into local state via effects.
  const [draftByKey, setDraftByKey] = useState({});

  const [pendingSwitch, setPendingSwitch] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Default selection:
  //   - Platform admin: first visible company (allow overriding via picker).
  //   - Company admin / other: locked to their own tenant — even if they
  //     manage to type a different id into the picker, the backend would
  //     403; mirroring that constraint up here avoids a confusing UX.
  const selectedCompanyId = isPlatformAdmin
    ? pickedCompanyId || (visibleCompanies.length > 0 ? visibleCompanies[0].id : "")
    : ownTenantId || (visibleCompanies.length > 0 ? visibleCompanies[0].id : "");

  // Active metric is derived from the master list — prefer PRODUCTIVITY if
  // the backend serves it, otherwise fall back to whatever the master returns
  // first. Hard-coding the default would 404 against a backend that names the
  // metric differently or hasn't seeded it yet.
  const defaultMetricCode = useMemo(() => {
    if (metricsMaster.length === 0) return "";
    const preferred = metricsMaster.find(
      (m) => m.metric_code === PREFERRED_DEFAULT_METRIC,
    );
    return preferred ? preferred.metric_code : metricsMaster[0].metric_code;
  }, [metricsMaster]);

  const activeMetricCode = pickedMetricCode || defaultMetricCode;

  useEffect(() => {
    dispatch(fetchCxoMetricsMaster());
    dispatch(fetchCompanies());
  }, [dispatch]);

  const activeMetric = useMemo(
    () => metricsMaster.find((m) => m.metric_code === activeMetricCode) || null,
    [metricsMaster, activeMetricCode],
  );

  useEffect(() => {
    // Only fetch a mapping for a metric the backend actually serves.
    if (selectedCompanyId && activeMetric) {
      dispatch(
        fetchCxoMapping({
          metricCode: activeMetric.metric_code,
          companyId: selectedCompanyId,
        }),
      );
      dispatch(
        fetchCxoMetric({
          metricCode: activeMetric.metric_code,
          companyId: selectedCompanyId,
        }),
      );
    }
  }, [dispatch, selectedCompanyId, activeMetric]);

  useEffect(() => {
    if (selectedCompanyId && !optionsByCompany[selectedCompanyId]) {
      dispatch(fetchCxoOptions({ companyId: selectedCompanyId }));
    }
  }, [dispatch, selectedCompanyId, optionsByCompany]);

  const currentKey = cacheKey(selectedCompanyId, activeMetricCode);
  const serverMapping = mappingsByKey[currentKey];
  // Prefer the per-(company,metric) override returned by GET
  // /admin/cxo-metrics/{code}?company_id=... over the platform master, so a
  // PUT that changes display_name / baseline is reflected immediately.
  const metricOverride = metricByKey[currentKey];
  const effectiveMetric = useMemo(
    () => (metricOverride ? { ...activeMetric, ...metricOverride } : activeMetric),
    [activeMetric, metricOverride],
  );
  const baselineKpi = useMemo(
    () => serverMapping?.kpi_mappings || [],
    [serverMapping],
  );
  const baselineSignal = useMemo(
    () => serverMapping?.signal_mappings || [],
    [serverMapping],
  );
  const draftEntry = draftByKey[currentKey];
  const draftKpi = draftEntry?.kpi ?? baselineKpi;
  const draftSignal = draftEntry?.signal ?? baselineSignal;

  const isDirty = Boolean(draftEntry) &&
    (!mappingsEqual(draftKpi, baselineKpi) ||
      !mappingsEqual(draftSignal, baselineSignal));

  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const formulaType = activeMetric?.formula_type;
  const weightSum =
    formulaType === "COMPOSITE" ? sumWeights(draftSignal) : sumWeights(draftKpi);

  const validation = useMemo(
    () =>
      activeMetric
        ? validateMapping({
            formulaType,
            kpiMappings: draftKpi,
            signalMappings: draftSignal,
          })
        : { isValid: false, errors: [], weightSum: 0 },
    [activeMetric, formulaType, draftKpi, draftSignal],
  );

  const updateDraft = useCallback(
    (updater) => {
      setDraftByKey((prev) => {
        const existing = prev[currentKey] ?? {
          kpi: baselineKpi,
          signal: baselineSignal,
        };
        const next = updater(existing);
        return { ...prev, [currentKey]: next };
      });
    },
    [currentKey, baselineKpi, baselineSignal],
  );

  const handleSelectCompany = (newId) => {
    if (!newId || newId === selectedCompanyId) return;
    if (isDirty) {
      setPendingSwitch({ type: "company", value: newId });
      return;
    }
    setPickedCompanyId(newId);
  };

  const handleSelectMetric = (newCode) => {
    if (!newCode || newCode === activeMetricCode) return;
    if (isDirty) {
      setPendingSwitch({ type: "metric", value: newCode });
      return;
    }
    setPickedMetricCode(newCode);
  };

  const applyPendingSwitch = () => {
    if (!pendingSwitch) return;
    // Discard the draft for the current (company,metric) before switching.
    setDraftByKey((prev) => {
      if (!prev[currentKey]) return prev;
      const { [currentKey]: _, ...rest } = prev;
      return rest;
    });
    if (pendingSwitch.type === "metric") {
      setPickedMetricCode(pendingSwitch.value);
    } else if (pendingSwitch.type === "company") {
      setPickedCompanyId(pendingSwitch.value);
    }
    setPendingSwitch(null);
  };

  const handleDiscard = () => {
    setDraftByKey((prev) => {
      if (!prev[currentKey]) return prev;
      const { [currentKey]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleChangeKpiWeight = (kpiKey, value) => {
    updateDraft((entry) => ({
      ...entry,
      kpi: entry.kpi.map((row) =>
        row.kpi_key === kpiKey ? { ...row, weight: Number(value) || 0 } : row,
      ),
    }));
  };

  const handleChangeKpiThreshold = (kpiKey, value) => {
    updateDraft((entry) => ({
      ...entry,
      kpi: entry.kpi.map((row) =>
        row.kpi_key === kpiKey
          ? {
              ...row,
              threshold: value === "" || value == null ? null : Number(value),
            }
          : row,
      ),
    }));
  };

  const handleRemoveKpi = (kpiKey) => {
    updateDraft((entry) => ({
      ...entry,
      kpi: entry.kpi.filter((row) => row.kpi_key !== kpiKey),
    }));
  };

  const handleAddKpi = (option) => {
    if (!option?.kpi_key) return;
    const isDeficit = formulaType === "DEFICIT_SUM";
    updateDraft((entry) =>
      entry.kpi.some((row) => row.kpi_key === option.kpi_key)
        ? entry
        : {
            ...entry,
            kpi: [
              ...entry.kpi,
              {
                kpi_key: option.kpi_key,
                kpi_name: option.display_name,
                weight: 0,
                threshold: isDeficit ? 3.0 : null,
              },
            ],
          },
    );
  };

  const handleChangeSignalWeight = (signalCode, value) => {
    updateDraft((entry) => ({
      ...entry,
      signal: entry.signal.map((row) =>
        row.signal_code === signalCode
          ? { ...row, weight: Number(value) || 0 }
          : row,
      ),
    }));
  };

  const handleRemoveSignal = (signalCode) => {
    updateDraft((entry) => ({
      ...entry,
      signal: entry.signal.filter((row) => row.signal_code !== signalCode),
    }));
  };

  const handleAddSignal = (option) => {
    if (!option?.signal_code) return;
    updateDraft((entry) =>
      entry.signal.some((row) => row.signal_code === option.signal_code)
        ? entry
        : {
            ...entry,
            signal: [
              ...entry.signal,
              {
                signal_code: option.signal_code,
                signal_name: option.display_name,
                weight: 0,
              },
            ],
          },
    );
  };

  const handleSave = async () => {
    if (!activeMetric || !selectedCompanyId) return;
    if (!validation.isValid) return;
    try {
      const payload = {
        metricCode: activeMetric.metric_code,
        companyId: selectedCompanyId,
        kpi_mappings:
          formulaType === "COMPOSITE"
            ? []
            : draftKpi.map((row) => ({
                kpi_key: row.kpi_key,
                weight: Number(row.weight) || 0,
                threshold: row.threshold == null ? null : Number(row.threshold),
              })),
        signal_mappings:
          formulaType === "COMPOSITE"
            ? draftSignal.map((row) => ({
                signal_code: row.signal_code,
                weight: Number(row.weight) || 0,
              }))
            : [],
      };
      const result = await dispatch(saveCxoMapping(payload)).unwrap();
      // Server response is now the new baseline; clear the local draft.
      setDraftByKey((prev) => {
        const { [currentKey]: _, ...rest } = prev;
        return rest;
      });
      setToast({
        severity: "success",
        message: result.message || "Mapping saved.",
      });
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to save.";
      setToast({ severity: "error", message });
    }
  };

  const handleResetConfirmed = async () => {
    setConfirmReset(false);
    if (!activeMetric || !selectedCompanyId) return;
    try {
      const result = await dispatch(
        resetCxoMapping({
          metricCode: activeMetric.metric_code,
          companyId: selectedCompanyId,
        }),
      ).unwrap();
      setDraftByKey((prev) => {
        const { [currentKey]: _, ...rest } = prev;
        return rest;
      });
      dispatch(
        fetchCxoMapping({
          metricCode: activeMetric.metric_code,
          companyId: selectedCompanyId,
        }),
      );
      setToast({
        severity: "success",
        message: result.message || "Mapping reset to platform defaults.",
      });
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to reset.";
      setToast({ severity: "error", message });
    }
  };

  const handleCreateMetricSubmit = async (payload) => {
    try {
      const result = await dispatch(createCxoMetric(payload)).unwrap();
      setCreateDialogOpen(false);
      // Auto-select the freshly created metric tab — the slice already
      // pushed it onto metricsMaster, so this just nudges activeMetricCode.
      if (result?.metric?.metric_code) {
        setPickedMetricCode(result.metric.metric_code);
      }
      setToast({
        severity: "success",
        message: result?.message || "Metric created successfully.",
      });
    } catch (err) {
      // Surface inside the dialog via state.createError — no toast here so
      // we don't double-render the same failure.
      void err;
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    dispatch(clearCxoCreateState());
  };

  const handleUpdateMetricSubmit = async (partial) => {
    if (!activeMetric || !selectedCompanyId) return;
    try {
      const result = await dispatch(
        updateCxoMetric({
          metricCode: activeMetric.metric_code,
          companyId: selectedCompanyId,
          fields: partial,
        }),
      ).unwrap();
      setEditDialogOpen(false);
      setToast({
        severity: "success",
        message: result.message || "Metric updated.",
      });
    } catch (err) {
      // Surfaced inside the dialog via state.updateError.
      void err;
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    dispatch(clearCxoUpdateState());
  };

  const handleDeleteConfirmed = async () => {
    setConfirmDelete(false);
    if (!activeMetric || !selectedCompanyId) return;
    try {
      const result = await dispatch(
        deleteCxoMetric({
          metricCode: activeMetric.metric_code,
          companyId: selectedCompanyId,
        }),
      ).unwrap();
      // Drop the local draft for the deleted (company, metric) and let the
      // tab selection fall back to the first remaining master entry.
      setDraftByKey((prev) => {
        if (!prev[currentKey]) return prev;
        const { [currentKey]: _, ...rest } = prev;
        return rest;
      });
      setPickedMetricCode("");
      setToast({
        severity: "success",
        message: result.message || "Metric deleted.",
      });
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to delete.";
      setToast({ severity: "error", message });
    }
  };

  // When a brand-new metric is added the slice clears the per-(company,metric)
  // mapping cache for the new code (no rows exist yet); the existing fetch
  // effect will pull a fresh — and empty — mapping when the tab activates.
  void createdMetricCode;

  const options = optionsByCompany[selectedCompanyId];
  const isInitialLoading =
    (metricsMasterLoading && metricsMaster.length === 0) || companiesLoading;
  const isMappingForbidden = mappingErrorStatus === 403;

  return (
    <Layout role="superadmin" title="CXO Metrics Configuration">
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
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                CXO Metrics Configuration
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Configure how Productivity, Engagement, and Absenteeism are
                derived from wellness KPIs for each company.
              </Typography>
            </Box>
            {canEditConfig && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<EditRoundedIcon />}
                  onClick={() => setEditDialogOpen(true)}
                  disabled={
                    updateLoading || !activeMetric || !selectedCompanyId
                  }
                >
                  Edit metric
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  onClick={() => setConfirmDelete(true)}
                  disabled={
                    deleteLoading || !activeMetric || !selectedCompanyId
                  }
                >
                  {deleteLoading ? "Deleting..." : "Delete metric"}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  disabled={createLoading}
                >
                  Create metric
                </Button>
              </Stack>
            )}
          </Stack>

          {metricsMasterError && (
            <Alert severity="error">{metricsMasterError}</Alert>
          )}
          {optionsError && <Alert severity="warning">{optionsError}</Alert>}

          <Autocomplete
            sx={{ maxWidth: 420 }}
            options={visibleCompanies}
            loading={companiesLoading}
            getOptionLabel={(option) => option?.company_name || ""}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={visibleCompanies.find((c) => c.id === selectedCompanyId) || null}
            onChange={(_event, newValue) =>
              handleSelectCompany(newValue?.id || "")
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Company"
                placeholder={
                  isPlatformAdmin ? "Select a company" : "Your company"
                }
                helperText={
                  !isPlatformAdmin
                    ? "Scoped to your tenant — non-platform admins can only configure their own company."
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
            // Locked for non-platform admins — they only have one valid
            // option, so the picker becomes a read-only display.
            disabled={isInitialLoading || !isPlatformAdmin}
          />

          <MetricTabs
            metrics={metricsMaster}
            activeMetricCode={activeMetricCode}
            onChange={handleSelectMetric}
          />

          {!metricsMasterLoading && metricsMaster.length === 0 ? (
            <Alert severity="info">
              No CXO metrics have been configured in the platform master yet.
              Once the backend seeds the metric definitions (Productivity,
              Engagement, Absenteeism), they will appear here.
            </Alert>
          ) : isMappingForbidden ? (
            <Alert severity="error">
              You don't have permission to configure this company.
            </Alert>
          ) : mappingError ? (
            <Alert severity="error">{mappingError}</Alert>
          ) : (
            <MappingEditor
              metric={effectiveMetric}
              kpiMappings={draftKpi}
              signalMappings={draftSignal}
              weightSum={weightSum}
              isLoading={mappingLoading && !serverMapping}
              options={options}
              optionsLoading={optionsLoading}
              onChangeKpiWeight={canEditConfig ? handleChangeKpiWeight : undefined}
              onChangeKpiThreshold={
                canEditConfig ? handleChangeKpiThreshold : undefined
              }
              onRemoveKpi={canEditConfig ? handleRemoveKpi : undefined}
              onAddKpi={canEditConfig ? handleAddKpi : undefined}
              onChangeSignalWeight={
                canEditConfig ? handleChangeSignalWeight : undefined
              }
              onRemoveSignal={canEditConfig ? handleRemoveSignal : undefined}
              onAddSignal={canEditConfig ? handleAddSignal : undefined}
            />
          )}

          {!validation.isValid && validation.errors.length > 0 && (
            <Alert severity="warning" sx={{ whiteSpace: "pre-line" }}>
              {validation.errors.join("\n")}
            </Alert>
          )}

          {(saveError || resetError || deleteError) && (
            <Alert severity="error">
              {saveError || resetError || deleteError}
            </Alert>
          )}

          {canEditConfig && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                color="warning"
                startIcon={<RestartAltRoundedIcon />}
                onClick={() => setConfirmReset(true)}
                disabled={resetLoading || !activeMetric || !selectedCompanyId}
              >
                {resetLoading ? "Resetting..." : "Reset to platform defaults"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<UndoRoundedIcon />}
                onClick={handleDiscard}
                disabled={!isDirty}
              >
                Discard changes
              </Button>
              <Tooltip
                title={
                  !validation.isValid
                    ? validation.errors[0] || "Fix validation errors before saving"
                    : ""
                }
              >
                <span>
                  <Button
                    variant="contained"
                    startIcon={<SaveRoundedIcon />}
                    onClick={handleSave}
                    disabled={saveLoading || !validation.isValid}
                  >
                    {saveLoading ? "Saving..." : "Save"}
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      </Paper>

      <ConfirmDialog
        open={Boolean(pendingSwitch)}
        title="Discard unsaved changes?"
        message="You have unsaved edits on this mapping. Switching will discard them."
        confirmLabel="Discard & switch"
        confirmColor="warning"
        onConfirm={applyPendingSwitch}
        onCancel={() => setPendingSwitch(null)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset to platform defaults?"
        message={`This will replace the current mapping with the AyuMonk default values for ${activeMetric?.display_name || "this metric"}. Continue?`}
        confirmLabel="Reset"
        confirmColor="warning"
        onConfirm={handleResetConfirmed}
        onCancel={() => setConfirmReset(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete metric?"
        message={`This will permanently delete "${effectiveMetric?.display_name || activeMetric?.metric_code || "this metric"}" for the selected company, including its mapping. This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(false)}
      />

      <EditMetricDialog
        key={editDialogOpen ? "edit-open" : "edit-closed"}
        open={editDialogOpen}
        loading={updateLoading}
        error={updateError}
        metric={effectiveMetric}
        onClose={handleCloseEditDialog}
        onSubmit={handleUpdateMetricSubmit}
      />

      {/* Keyed so the form state resets every time the dialog is reopened
          without needing setState-inside-useEffect (React 19 lint rule). */}
      <CreateMetricDialog
        key={createDialogOpen ? "create-open" : "create-closed"}
        open={createDialogOpen}
        loading={createLoading}
        error={createError}
        onClose={handleCloseCreateDialog}
        onSubmit={handleCreateMetricSubmit}
        companies={visibleCompanies}
        companiesLoading={companiesLoading}
        defaultCompanyId={selectedCompanyId}
      />


      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => {
          setToast(null);
          dispatch(clearCxoSaveState());
          dispatch(clearCxoResetState());
          dispatch(clearCxoCreateState());
          dispatch(clearCxoUpdateState());
          dispatch(clearCxoDeleteState());
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            onClose={() => setToast(null)}
            variant="filled"
            sx={{ whiteSpace: "pre-line" }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Layout>
  );
}
