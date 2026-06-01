import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Switch,
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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Layout from "../../layouts/commonLayout/Layout";
import { fetchCompanies } from "../../store/companySlice";
import {
  clearCxoCreateState,
  clearCxoDefinitionDeleteState,
  clearCxoDefinitionUpdateState,
  clearCxoKpiMappingMutationState,
  clearCxoKpiMappingState,
  createCxoKpiMapping,
  createCxoMetric,
  deleteCxoKpiMappingById,
  deleteCxoMetricById,
  fetchCxoKpiMappingList,
  fetchCxoMetricsMaster,
  fetchCxoOptions,
  patchCxoKpiMappingStatus,
  updateCxoKpiMappingWeight,
  updateCxoMetricById,
} from "../../store/cxoMetricsSlice";
import { getSurfaceBackground } from "../../theme";
import MetricTabs from "../../components/superadmin/cxoMetrics/MetricTabs";
import ConfirmDialog from "../../components/superadmin/cxoMetrics/ConfirmDialog";
import CreateMetricDialog from "../../components/superadmin/cxoMetrics/CreateMetricDialog";
import CxoMetricDefinitionDialog from "../../components/superadmin/cxoMetrics/CxoMetricDefinitionDialog";
import CxoMetricDefinitionEditDialog from "../../components/superadmin/cxoMetrics/CxoMetricDefinitionEditDialog";
import usePermissions from "../../hooks/usePermissions";

const PREFERRED_DEFAULT_METRIC = "PRODUCTIVITY";

const cacheKey = (companyId, metricCode) =>
  `${companyId || ""}::${metricCode || ""}`;

export default function CxoMetricsConfig() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { canEdit } = usePermissions();
  const canEditConfig = canEdit("cxo-metrics");

  const {
    metricsMaster,
    metricsMasterLoading,
    metricsMasterError,
    optionsByCompany,
    optionsError,
    createLoading,
    createError,
    definitionUpdateLoading,
    definitionUpdateError,
    definitionDeleteLoading,
    kpiMappingLoading,
    kpiMappingError,
    kpiMappingListByKey,
    kpiMappingListLoading,
    kpiMappingListError,
    kpiMappingUpdateLoading,
    kpiMappingStatusLoading,
    kpiMappingDeleteLoading,
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

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [definitionDialogOpen, setDefinitionDialogOpen] = useState(false);
  const [definitionEditTarget, setDefinitionEditTarget] = useState(null);
  const [definitionDeleteTarget, setDefinitionDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  // Default selection:
  //   - Platform admin: starts empty — the picker shows the "Select a
  //     company" placeholder until the user picks one. Per-company GETs
  //     wait for that selection.
  //   - Company admin / other: locked to their own tenant (the backend
  //     would 403 anything else anyway).
  const selectedCompanyId = isPlatformAdmin
    ? pickedCompanyId
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

  // Bootstrap: load the company list so the picker can resolve a default.
  // The per-company endpoints (metrics master, options, mapping) wait until
  // a company is actually selected.
  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const activeMetric = useMemo(
    () => metricsMaster.find((m) => m.metric_code === activeMetricCode) || null,
    [metricsMaster, activeMetricCode],
  );

  useEffect(() => {
    // GET /admin/cxo-kpi-mapping is now the single source of truth for the
    // editor below. The legacy per-(company,metric) summary endpoint
    // (GET /admin/cxo-metrics/{code}/mapping) and per-metric override
    // (GET /admin/cxo-metrics/{code}) were removed in the refactor — the
    // master list returned by GET /admin/cxo-metrics?company_id=... already
    // carries the metric definition, and per-row rows come from cxo-kpi-mapping.
    if (selectedCompanyId && activeMetric?.id) {
      dispatch(
        fetchCxoKpiMappingList({
          companyId: selectedCompanyId,
          metricId: activeMetric.id,
        }),
      );
    }
  }, [dispatch, selectedCompanyId, activeMetric]);

  // Per-company endpoints — fetched only after a company is selected. The
  // metric master is company-scoped on the backend, so the GET sends
  // company_id alongside the older options endpoint.
  useEffect(() => {
    if (!selectedCompanyId) return;
    dispatch(fetchCxoMetricsMaster({ companyId: selectedCompanyId }));
    if (!optionsByCompany[selectedCompanyId]) {
      dispatch(fetchCxoOptions({ companyId: selectedCompanyId }));
    }
  }, [dispatch, selectedCompanyId, optionsByCompany]);

  // Granular per-row list keyed by (company, metric_id). GET
  // /admin/cxo-kpi-mapping is the single source of truth for the panel below.
  const kpiMappingRows = useMemo(() => {
    if (!activeMetric?.id || !selectedCompanyId) return [];
    return kpiMappingListByKey[cacheKey(selectedCompanyId, activeMetric.id)] || [];
  }, [kpiMappingListByKey, selectedCompanyId, activeMetric]);
  const handleSelectCompany = (newId) => {
    if (!newId || newId === selectedCompanyId) return;
    setPickedCompanyId(newId);
  };

  const handleSelectMetric = (newCode) => {
    if (!newCode || newCode === activeMetricCode) return;
    setPickedMetricCode(newCode);
  };

  const handleCreateMetricSubmit = async ({
    companyId,
    metricId,
    metricCode,
    kpi_mappings,
  }) => {
    try {
      const result = await dispatch(
        createCxoKpiMapping({ companyId, metricId, kpi_mappings }),
      ).unwrap();
      setCreateDialogOpen(false);
      // Switch the page over to the company/metric the user just configured
      // so they land on the live mapping view.
      if (companyId && isPlatformAdmin) setPickedCompanyId(companyId);
      if (metricCode) setPickedMetricCode(metricCode);
      // Refresh the per-row list so the editor below reflects what the new
      // endpoint just persisted. Use metric_id from the result (POST returns
      // the created rows; metricId was the input) — falls back to the current
      // active metric.
      const refreshMetricId = metricId || activeMetric?.id;
      if (companyId && refreshMetricId) {
        dispatch(
          fetchCxoKpiMappingList({
            companyId,
            metricId: refreshMetricId,
          }),
        );
      }
      setToast({
        severity: "success",
        message: result?.message || "KPI mapping saved.",
      });
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to save KPI mapping.";
      setToast({ severity: "error", message });
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    dispatch(clearCxoCreateState());
    dispatch(clearCxoKpiMappingState());
  };

  // POST /admin/cxo-metrics — create a CXO metric definition (master row).
  const handleCreateDefinitionSubmit = async (payload) => {
    try {
      const result = await dispatch(createCxoMetric(payload)).unwrap();
      setDefinitionDialogOpen(false);
      if (result?.metric?.metric_code) {
        setPickedMetricCode(result.metric.metric_code);
      }
      setToast({
        severity: "success",
        message: result?.message || "CXO metric created successfully.",
      });
    } catch (err) {
      // Error surfaces inside the dialog via state.createError.
      void err;
    }
  };

  const handleCloseDefinitionDialog = () => {
    setDefinitionDialogOpen(false);
    dispatch(clearCxoCreateState());
  };

  // PUT /admin/cxo-metrics/{metric_id} — partial update. company_id and
  // metric_code are immutable; the dialog only sends changed fields.
  const handleDefinitionUpdateSubmit = async (partial) => {
    if (!definitionEditTarget?.id) return;
    try {
      const result = await dispatch(
        updateCxoMetricById({
          metricId: definitionEditTarget.id,
          fields: partial,
        }),
      ).unwrap();
      setDefinitionEditTarget(null);
      setToast({
        severity: "success",
        message: result.message || "CXO metric updated.",
      });
    } catch (err) {
      // Surfaced inside the dialog via state.definitionUpdateError.
      void err;
    }
  };

  const handleCloseDefinitionEditDialog = () => {
    setDefinitionEditTarget(null);
    dispatch(clearCxoDefinitionUpdateState());
  };

  // DELETE /admin/cxo-metrics/{metric_id} — soft-delete; cascade removes
  // dependent cxo_metric_kpi_mapping rows. The server returns
  // kpi_mappings_deleted which we surface in the toast.
  const handleDefinitionDeleteConfirmed = async () => {
    const target = definitionDeleteTarget;
    setDefinitionDeleteTarget(null);
    if (!target?.id) return;
    try {
      const result = await dispatch(
        deleteCxoMetricById({ metricId: target.id }),
      ).unwrap();
      // If the deleted metric was the active tab, fall back to the default.
      if (target.metric_code === activeMetricCode) {
        setPickedMetricCode("");
      }
      setToast({
        severity: "success",
        message:
          result.message ||
          `Deleted. Cascade removed ${result.kpiMappingsDeleted} mapping row(s).`,
      });
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err?.message || "Failed to delete metric.";
      setToast({ severity: "error", message });
    }
  };

  // PUT /admin/cxo-kpi-mapping/{mapping_id} — update one row's weight.
  const handlePersistRowWeight = async (mappingId, weight) => {
    if (!mappingId || !activeMetric?.id) return;
    try {
      const result = await dispatch(
        updateCxoKpiMappingWeight({
          mappingId,
          companyId: selectedCompanyId,
          metricId: activeMetric.id,
          weight,
        }),
      ).unwrap();
      setToast({
        severity: "success",
        message: result.message || "Weight updated.",
      });
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to update weight.";
      setToast({ severity: "error", message });
    }
  };

  // PATCH /admin/cxo-kpi-mapping/{mapping_id}/status — pause / re-activate.
  const handleToggleRowStatus = async (row) => {
    if (!row?.mapping_id || !activeMetric?.id) return;
    try {
      const result = await dispatch(
        patchCxoKpiMappingStatus({
          mappingId: row.mapping_id,
          companyId: selectedCompanyId,
          metricId: activeMetric.id,
          isActive: !row.is_active,
        }),
      ).unwrap();
      setToast({
        severity: "success",
        message:
          result.message ||
          (row.is_active ? "KPI paused." : "KPI re-activated."),
      });
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to update status.";
      setToast({ severity: "error", message });
    }
  };

  // DELETE /admin/cxo-kpi-mapping/{mapping_id} — single-row soft-delete.
  const handlePersistRowRemove = async (mappingId) => {
    if (!mappingId || !activeMetric?.id) return;
    try {
      const result = await dispatch(
        deleteCxoKpiMappingById({
          mappingId,
          companyId: selectedCompanyId,
          metricId: activeMetric.id,
        }),
      ).unwrap();
      setToast({
        severity: "success",
        message: result.message || "KPI mapping removed.",
      });
      // The slice already drops the row from kpiMappingListByKey on success,
      // so no extra refetch is needed here — the editor will reflect the
      // change on the next render.
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to remove KPI.";
      setToast({ severity: "error", message });
    }
  };

  const isInitialLoading =
    (metricsMasterLoading && metricsMaster.length === 0) || companiesLoading;

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
                CXO Metrics Mapping
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Configure how Productivity, Engagement, and Absenteeism are
                derived from wellness KPIs for each company.
              </Typography>
            </Box>
            {canEditConfig && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  disabled={kpiMappingLoading}
                >
                  Metric mapping
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
              Select company to display metrics data
            </Alert>
          ) : kpiMappingListError ? (
            <Alert severity="error">{kpiMappingListError}</Alert>
          ) : null}

          {canEditConfig && selectedCompanyId && activeMetric?.id && (
            <PersistedKpiRowsPanel
              rows={kpiMappingRows}
              loading={kpiMappingListLoading}
              error={kpiMappingListError}
              updating={kpiMappingUpdateLoading}
              toggling={kpiMappingStatusLoading}
              deleting={kpiMappingDeleteLoading}
              onSaveWeight={handlePersistRowWeight}
              onToggleStatus={handleToggleRowStatus}
              onDeleteRow={handlePersistRowRemove}
            />
          )}

        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mt: 2.5,
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: getSurfaceBackground(theme),
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 750 }}>
                CXO Metric Definitions
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Create and review the metric master rows backing the
                configurations above.
              </Typography>
            </Box>
            {canEditConfig && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddRoundedIcon />}
                onClick={() => setDefinitionDialogOpen(true)}
                disabled={createLoading}
              >
                {createLoading ? "Creating..." : "Create CXO metric"}
              </Button>
            )}
          </Stack>

          {metricsMasterLoading && metricsMaster.length === 0 ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ py: 2, color: "text.secondary" }}
            >
              <CircularProgress size={16} />
              <Typography variant="body2">
                Loading CXO metric definitions...
              </Typography>
            </Stack>
          ) : metricsMaster.length === 0 ? (
            <Alert severity="info">
              Select company to display metrics data.
              one.
            </Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Metric code</TableCell>
                  <TableCell>Display name</TableCell>
                  <TableCell>Formula</TableCell>
                  <TableCell>Baseline</TableCell>
                  <TableCell>Status</TableCell>
                  {canEditConfig && (
                    <TableCell sx={{ width: 110, textAlign: "right" }}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {metricsMaster.map((m) => {
                  const isActive =
                    m.is_active == null ? true : Boolean(m.is_active);
                  return (
                    <TableRow key={m.metric_code} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {m.metric_code}
                        </Typography>
                      </TableCell>
                      <TableCell>{m.display_name}</TableCell>
                      <TableCell>
                        {m.formula_type ? (
                          <Chip
                            size="small"
                            label={m.formula_type}
                            variant="outlined"
                          />
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.baseline != null ? (
                          m.baseline
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={isActive ? "Active" : "Inactive"}
                          color={isActive ? "success" : "default"}
                          variant={isActive ? "filled" : "outlined"}
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      </TableCell>
                      {canEditConfig && (
                        <TableCell sx={{ textAlign: "right" }}>
                          <Tooltip title="Edit metric">
                            <span>
                              <IconButton
                                size="small"
                                disabled={
                                  !m.id ||
                                  definitionUpdateLoading ||
                                  definitionDeleteLoading
                                }
                                onClick={() => setDefinitionEditTarget(m)}
                                aria-label={`Edit ${m.metric_code}`}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete metric (cascade removes mappings)">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={
                                  !m.id ||
                                  definitionUpdateLoading ||
                                  definitionDeleteLoading
                                }
                                onClick={() => setDefinitionDeleteTarget(m)}
                                aria-label={`Delete ${m.metric_code}`}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Stack>
      </Paper>

      {/* Keyed so the form state resets every time the dialog is reopened
          without needing setState-inside-useEffect (React 19 lint rule). */}
      <CreateMetricDialog
        key={createDialogOpen ? "create-open" : "create-closed"}
        open={createDialogOpen}
        loading={kpiMappingLoading}
        error={kpiMappingError}
        onClose={handleCloseCreateDialog}
        onSubmit={handleCreateMetricSubmit}
        companies={visibleCompanies}
        companiesLoading={companiesLoading}
        defaultCompanyId={selectedCompanyId}
        metrics={metricsMaster}
        metricsLoading={metricsMasterLoading}
        isPlatformAdmin={isPlatformAdmin}
      />

      <CxoMetricDefinitionDialog
        key={definitionDialogOpen ? "definition-open" : "definition-closed"}
        open={definitionDialogOpen}
        loading={createLoading}
        error={createError}
        onClose={handleCloseDefinitionDialog}
        onSubmit={handleCreateDefinitionSubmit}
        companies={visibleCompanies}
        companiesLoading={companiesLoading}
        defaultCompanyId={selectedCompanyId}
        isPlatformAdmin={isPlatformAdmin}
      />

      <CxoMetricDefinitionEditDialog
        key={
          definitionEditTarget
            ? `definition-edit-${definitionEditTarget.id}`
            : "definition-edit-closed"
        }
        open={Boolean(definitionEditTarget)}
        loading={definitionUpdateLoading}
        error={definitionUpdateError}
        metric={definitionEditTarget}
        onClose={handleCloseDefinitionEditDialog}
        onSubmit={handleDefinitionUpdateSubmit}
      />

      <ConfirmDialog
        open={Boolean(definitionDeleteTarget)}
        title="Delete CXO metric definition?"
        message={`Soft-deletes "${definitionDeleteTarget?.display_name || definitionDeleteTarget?.metric_code || "this metric"}" and cascade-removes every active KPI mapping that references it. The metric will no longer appear in configurations.`}
        confirmLabel={definitionDeleteLoading ? "Deleting..." : "Delete"}
        confirmColor="error"
        onConfirm={handleDefinitionDeleteConfirmed}
        onCancel={() => setDefinitionDeleteTarget(null)}
      />


      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => {
          setToast(null);
          dispatch(clearCxoCreateState());
          dispatch(clearCxoKpiMappingState());
          dispatch(clearCxoKpiMappingMutationState());
          dispatch(clearCxoDefinitionUpdateState());
          dispatch(clearCxoDefinitionDeleteState());
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

// Per-row controls for the granular cxo-kpi-mapping endpoints (PUT weight,
// PATCH status, DELETE single). Sits below the draft editor and operates on
// the persisted rows directly — no draft state, every action is immediate.
function PersistedKpiRowsPanel({
  rows,
  loading,
  error,
  updating,
  toggling,
  deleting,
  onSaveWeight,
  onToggleStatus,
  onDeleteRow,
}) {
  const [edits, setEdits] = useState({});

  const handleChange = (mappingId, value) =>
    setEdits((prev) => ({ ...prev, [mappingId]: value }));

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          CXO Metrics Mapping
        </Typography>
        {/* <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Bound via GET /admin/cxo-kpi-mapping on page load.
        </Typography> */}
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {loading && rows.length === 0 ? (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ py: 2, color: "text.secondary" }}
        >
          <CircularProgress size={16} />
          <Typography variant="body2">Loading mapping rows...</Typography>
        </Stack>
      ) : rows.length === 0 ? (
        <Box
          sx={{
            py: 3,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">
            No persisted KPI mappings for this metric yet.
          </Typography>
          <Typography variant="caption">
            Create a mapping from the "Create metric" dialog above.
          </Typography>
        </Box>
      ) : (
        <PersistedKpiRowsTable
          rows={rows}
          edits={edits}
          updating={updating}
          toggling={toggling}
          deleting={deleting}
          onChangeEdit={handleChange}
          onClearEdit={(mappingId) =>
            setEdits((prev) => {
              const { [mappingId]: _, ...rest } = prev;
              return rest;
            })
          }
          onSaveWeight={onSaveWeight}
          onToggleStatus={onToggleStatus}
          onDeleteRow={onDeleteRow}
        />
      )}
    </Box>
  );
}

function PersistedKpiRowsTable({
  rows,
  edits,
  updating,
  toggling,
  deleting,
  onChangeEdit,
  onClearEdit,
  onSaveWeight,
  onToggleStatus,
  onDeleteRow,
}) {
  return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>KPI</TableCell>
            <TableCell sx={{ width: 160 }}>Weight</TableCell>
            <TableCell sx={{ width: 130 }}>Status</TableCell>
            <TableCell sx={{ width: 80, textAlign: "right" }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const draftValue =
              edits[row.mapping_id] != null ? edits[row.mapping_id] : row.weight;
            const isDirty = Number(draftValue) !== Number(row.weight);
            return (
              <TableRow key={row.mapping_id} hover>
                <TableCell>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ minWidth: 0 }}
                  >
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600 }}
                      noWrap
                    >
                      {row.kpi_name || "Unnamed KPI"}
                    </Typography>
                    {!row.is_active && (
                      <Chip
                        size="small"
                        label="paused"
                        color="warning"
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <TextField
                      type="number"
                      size="small"
                      value={draftValue}
                      onChange={(event) =>
                        onChangeEdit(row.mapping_id, event.target.value)
                      }
                      inputProps={{ step: 0.1, min: 0, max: 5 }}
                      sx={{ width: 90 }}
                      disabled={updating || !row.is_active}
                    />
                    <Tooltip
                      title={isDirty ? "Save weight" : "No changes"}
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          disabled={updating || !isDirty}
                          onClick={() => {
                            onSaveWeight(row.mapping_id, Number(draftValue));
                            onClearEdit(row.mapping_id);
                          }}
                          aria-label={`Save weight for ${row.kpi_name || row.kpi_key}`}
                        >
                          <SaveRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Switch
                      size="small"
                      checked={row.is_active}
                      disabled={toggling}
                      onChange={() => onToggleStatus(row)}
                      inputProps={{
                        "aria-label": `Toggle status for ${row.kpi_name || row.kpi_key}`,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {row.is_active ? "Active" : "Paused"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ textAlign: "right" }}>
                  <Tooltip title="Remove this KPI mapping">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={deleting}
                        onClick={() => onDeleteRow(row.mapping_id)}
                        aria-label={`Delete ${row.kpi_name || row.kpi_key}`}
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
  );
}
