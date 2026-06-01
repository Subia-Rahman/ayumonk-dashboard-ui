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
import ConfirmDialog from "../../components/superadmin/cxoMetrics/ConfirmDialog";
import DimensionDialog from "../../components/superadmin/wellnessDimensions/DimensionDialog";
import AddMappingDialog from "../../components/superadmin/wellnessDimensions/AddMappingDialog";
import DimensionTabs from "../../components/superadmin/wellnessDimensions/DimensionTabs";
import { fetchCompanies } from "../../store/companySlice";
import { getSurfaceBackground } from "../../theme";
import usePermissions from "../../hooks/usePermissions";
import {
  clearDimensionCreateState,
  clearDimensionDeleteState,
  clearDimensionUpdateState,
  clearMappingMutationState,
  createDimension,
  createDimensionMapping,
  deleteDimension,
  deleteDimensionMapping,
  fetchDimensionMappings,
  fetchDimensions,
  updateDimension,
  updateDimensionMapping,
} from "../../store/wellnessDimensionsSlice";

export default function WellnessDimensionsConfig() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { canEdit } = usePermissions();
  const canEditConfig = canEdit("wellness-dimensions");

  const {
    dimensions,
    dimensionsLoading,
    dimensionsError,
    dimensionCreateLoading,
    dimensionCreateError,
    dimensionUpdateLoading,
    dimensionUpdateError,
    dimensionDeleteLoading,
    mappingsByDimension,
    mappingsLoading,
    mappingsError,
    mappingCreateLoading,
    mappingCreateError,
    mappingUpdateLoading,
    mappingDeleteLoading,
  } = useSelector((state) => state.wellnessDimensions);

  const { companies, companiesLoading } = useSelector((state) => state.company);
  const isPlatformAdmin = useSelector((state) => state.auth.isPlatformAdmin);
  // Non-platform admin's tenant: JWT claim → stored profile → localStorage.
  const ownTenantId = useSelector(
    (state) =>
      state.auth.jwtTenantId || state.auth.user?.company_id || "",
  );

  // RBAC-scoped company list — same convention as the CXO metrics page.
  const visibleCompanies = useMemo(() => {
    if (isPlatformAdmin) return companies;
    if (!ownTenantId) return [];
    return companies.filter((c) => c.id === ownTenantId);
  }, [companies, isPlatformAdmin, ownTenantId]);

  const [pickedCompanyId, setPickedCompanyId] = useState("");
  const [pickedDimensionId, setPickedDimensionId] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addMappingOpen, setAddMappingOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Platform admin starts with no selection (placeholder shown). Non-platform
  // admin is locked to their own tenant.
  const selectedCompanyId = isPlatformAdmin
    ? pickedCompanyId
    : ownTenantId || (visibleCompanies.length > 0 ? visibleCompanies[0].id : "");

  // Bootstrap the company picker. Per-company endpoints fire only after a
  // company is actually selected.
  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    dispatch(fetchDimensions({ companyId: selectedCompanyId }));
  }, [dispatch, selectedCompanyId]);

  // Sorted view used for the picker + table — falls back to label when
  // display_order is equal.
  const orderedDimensions = useMemo(
    () =>
      [...dimensions].sort((a, b) => {
        const oa = Number(a.display_order ?? 0);
        const ob = Number(b.display_order ?? 0);
        if (oa !== ob) return oa - ob;
        return (a.dimension_label || "").localeCompare(b.dimension_label || "");
      }),
    [dimensions],
  );

  // Derive the effective dimension id: fall back to the first ordered entry
  // so the mapping panel is populated as soon as the list lands. The picker
  // can still override via setPickedDimensionId. Computed (not stored) so we
  // don't trip the React 19 "setState-in-effect" rule.
  const activeDimensionId =
    pickedDimensionId || orderedDimensions[0]?.id || "";

  const activeDimension = useMemo(
    () => dimensions.find((d) => d.id === activeDimensionId) || null,
    [dimensions, activeDimensionId],
  );

  // Pull mappings whenever the active dimension or selected company changes.
  useEffect(() => {
    if (activeDimension?.id && selectedCompanyId) {
      dispatch(
        fetchDimensionMappings({
          dimensionId: activeDimension.id,
          companyId: selectedCompanyId,
        }),
      );
    }
  }, [dispatch, activeDimension, selectedCompanyId]);

  const mappingRows = useMemo(() => {
    if (!activeDimension?.id) return [];
    return mappingsByDimension[activeDimension.id] || [];
  }, [mappingsByDimension, activeDimension]);

  // ---- handlers ----

  // Create: companyId comes from the dialog now — it has its own picker.
  const handleCreateDimensionSubmit = async (payload) => {
    try {
      const result = await dispatch(createDimension(payload)).unwrap();
      setCreateDialogOpen(false);
      if (result?.item?.id) setPickedDimensionId(result.item.id);
      // Switch the page over so the new dimension is visible if the dialog
      // targeted a different tenant.
      if (
        isPlatformAdmin &&
        payload.companyId &&
        payload.companyId !== selectedCompanyId
      ) {
        setPickedCompanyId(payload.companyId);
      }
      setToast({
        severity: "success",
        message: result?.message || "Dimension created.",
      });
    } catch (err) {
      void err;
    }
  };

  // Edit: the dialog passes { companyId, fields }. Company is immutable; the
  // companyId is still forwarded so the request body carries it.
  const handleEditDimensionSubmit = async ({ companyId, fields }) => {
    if (!editTarget?.id) return;
    try {
      const result = await dispatch(
        updateDimension({
          id: editTarget.id,
          companyId:
            companyId || editTarget.company_id || selectedCompanyId,
          fields,
        }),
      ).unwrap();
      setEditTarget(null);
      setToast({
        severity: "success",
        message: result?.message || "Dimension updated.",
      });
    } catch (err) {
      void err;
    }
  };

  const handleDeleteDimensionConfirmed = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target?.id) return;
    try {
      const result = await dispatch(
        deleteDimension({
          id: target.id,
          // Prefer the row's own company_id (matches the immutable owner)
          // and fall back to whatever the page is currently viewing.
          companyId: target.company_id || selectedCompanyId,
        }),
      ).unwrap();
      if (target.id === activeDimensionId) setPickedDimensionId("");
      setToast({
        severity: "success",
        message: result?.message || "Dimension deleted.",
      });
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to delete dimension.";
      setToast({ severity: "error", message });
    }
  };

  // Dialog returns a list of kpi_keys plus one shared weight + display_order.
  // The POST endpoint creates one (dimension, kpi) row per call, so we fan
  // out and surface a single summary toast.
  const handleAddMappingSubmit = async ({
    companyId,
    dimensionId,
    kpi_keys,
    weight,
    display_order,
  }) => {
    if (!companyId || !dimensionId || !kpi_keys || kpi_keys.length === 0) {
      return;
    }
    const results = await Promise.allSettled(
      kpi_keys.map((kpi_key) =>
        dispatch(
          createDimensionMapping({
            companyId,
            dimensionId,
            kpi_key,
            weight,
            display_order,
          }),
        ).unwrap(),
      ),
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    // Only close the dialog when everything landed — leaving it open on
    // partial failure lets the user retry without losing context (the
    // already-mapped KPIs were stripped out of the dialog's local state on
    // the next render via existingKpiKeysByDimension).
    if (failed === 0) {
      setAddMappingOpen(false);
      if (isPlatformAdmin && companyId !== selectedCompanyId) {
        setPickedCompanyId(companyId);
      }
      setPickedDimensionId(dimensionId);
      setToast({
        severity: "success",
        message:
          succeeded === 1
            ? "KPI added."
            : `${succeeded} KPIs added to the dimension.`,
      });
    } else {
      const firstError = results.find((r) => r.status === "rejected");
      const reason = firstError?.reason;
      const reasonText =
        typeof reason === "string"
          ? reason
          : reason?.message || "One or more KPIs could not be added.";
      setToast({
        severity: succeeded > 0 ? "warning" : "error",
        message:
          succeeded > 0
            ? `${succeeded} added, ${failed} failed. First error: ${reasonText}`
            : reasonText,
      });
    }
  };

  const handleSaveMappingField = async (mappingId, fields) => {
    if (!activeDimension?.id || !mappingId) return;
    try {
      const result = await dispatch(
        updateDimensionMapping({
          dimensionId: activeDimension.id,
          companyId: selectedCompanyId,
          mappingId,
          fields,
        }),
      ).unwrap();
      setToast({
        severity: "success",
        message: result?.message || "Mapping updated.",
      });
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to update mapping.";
      setToast({ severity: "error", message });
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (!activeDimension?.id || !mappingId) return;
    try {
      const result = await dispatch(
        deleteDimensionMapping({
          dimensionId: activeDimension.id,
          companyId: selectedCompanyId,
          mappingId,
        }),
      ).unwrap();
      setToast({
        severity: "success",
        message: result?.message || "Mapping removed.",
      });
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to remove mapping.";
      setToast({ severity: "error", message });
    }
  };

  // Map of dimension_id → list of already-mapped kpi_keys, so the Add KPI
  // dialog can hide already-mapped KPIs no matter which dimension the user
  // picks inside it. Only dimensions with loaded mappings appear here; the
  // others fall back to "no exclusion" and the backend's uniqueness check
  // catches duplicates.
  const existingKpiKeysByDimension = useMemo(() => {
    const out = {};
    Object.entries(mappingsByDimension).forEach(([dimId, rows]) => {
      out[dimId] = (rows || []).map((r) => r.kpi_key).filter(Boolean);
    });
    return out;
  }, [mappingsByDimension]);

  return (
    <Layout role="superadmin" title="Wellness Dimensions">
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
                Dimension KPI Mappings
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Click a dimension row below to
                view its KPI mappings; use "Add KPI" to assign a KPI to any
                dimension.
              </Typography>
            </Box>
            {canEditConfig && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddRoundedIcon />}
                onClick={() => setAddMappingOpen(true)}
                disabled={mappingCreateLoading}
              >
                Add KPI
              </Button>
            )}
          </Stack>

          {dimensionsError && (
            <Alert severity="error">{dimensionsError}</Alert>
          )}

          <Autocomplete
            sx={{ maxWidth: 420 }}
            options={visibleCompanies}
            loading={companiesLoading}
            getOptionLabel={(option) => option?.company_name || ""}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={
              visibleCompanies.find((c) => c.id === selectedCompanyId) || null
            }
            onChange={(_event, newValue) =>
              setPickedCompanyId(newValue?.id || "")
            }
            // Locked for non-platform admins — they have one valid tenant.
            disabled={companiesLoading || !isPlatformAdmin}
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
          />

          <DimensionTabs
            dimensions={orderedDimensions}
            activeDimensionId={activeDimensionId}
            onChange={(id) => setPickedDimensionId(id)}
          />

          {selectedCompanyId && orderedDimensions.length === 0 && !dimensionsLoading ? (
            <Alert severity="info">
              No dimensions for this company yet. Create one below.
            </Alert>
          ) : null}

          {selectedCompanyId && activeDimension?.id && (
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
                  Dimension KPI Mappings
                </Typography>
              </Stack>

              <DimensionMappingsTable
                rows={mappingRows}
                loading={mappingsLoading && mappingRows.length === 0}
                error={mappingsError}
                updating={mappingUpdateLoading}
                deleting={mappingDeleteLoading}
                disabled={!canEditConfig}
                onSaveField={handleSaveMappingField}
                onDeleteRow={handleDeleteMapping}
                emptyMessage={'No KPIs mapped yet. Click "Add KPI" to assign one.'}
              />
            </Box>
          )}

          {!selectedCompanyId && (
            <Alert severity="info">
              Select a company above to view its wellness dimensions.
            </Alert>
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
                Wellness Dimensions
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Platform-level dimension taxonomy. Display order controls the
                order in the dimension picker.
              </Typography>
            </Box>
            {canEditConfig && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddRoundedIcon />}
                onClick={() => setCreateDialogOpen(true)}
                disabled={dimensionCreateLoading}
              >
                {dimensionCreateLoading ? "Creating..." : "Create dimension"}
              </Button>
            )}
          </Stack>

          {dimensionsLoading && dimensions.length === 0 ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ py: 2, color: "text.secondary" }}
            >
              <CircularProgress size={16} />
              <Typography variant="body2">Loading dimensions...</Typography>
            </Stack>
          ) : dimensions.length === 0 ? (
            <Alert severity="info">
              No wellness dimensions yet. Click "Create dimension" to add one.
            </Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Label</TableCell>
                  <TableCell sx={{ width: 100 }}>Order</TableCell>
                  <TableCell sx={{ width: 100 }}>KPIs</TableCell>
                  <TableCell sx={{ width: 100 }}>Status</TableCell>
                  {canEditConfig && (
                    <TableCell sx={{ width: 110, textAlign: "right" }}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {orderedDimensions.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {d.dimension_key}
                      </Typography>
                    </TableCell>
                    <TableCell>{d.dimension_label}</TableCell>
                    <TableCell>{d.display_order}</TableCell>
                    <TableCell>{d.kpi_count}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={d.is_active ? "Active" : "Inactive"}
                        color={d.is_active ? "success" : "default"}
                        variant={d.is_active ? "filled" : "outlined"}
                        sx={{ height: 20, fontSize: 11 }}
                      />
                    </TableCell>
                    {canEditConfig && (
                      <TableCell sx={{ textAlign: "right" }}>
                        <Tooltip title="Edit dimension">
                          <span>
                            <IconButton
                              size="small"
                              disabled={
                                dimensionUpdateLoading ||
                                dimensionDeleteLoading
                              }
                              onClick={() => setEditTarget(d)}
                              aria-label={`Edit ${d.dimension_key}`}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete dimension (only if no active mappings)">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={
                                dimensionUpdateLoading ||
                                dimensionDeleteLoading
                              }
                              onClick={() => setDeleteTarget(d)}
                              aria-label={`Delete ${d.dimension_key}`}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </Paper>

      <DimensionDialog
        key={createDialogOpen ? "dim-create-open" : "dim-create-closed"}
        open={createDialogOpen}
        mode="create"
        loading={dimensionCreateLoading}
        error={dimensionCreateError}
        companies={visibleCompanies}
        companiesLoading={companiesLoading}
        defaultCompanyId={selectedCompanyId}
        isPlatformAdmin={isPlatformAdmin}
        onClose={() => {
          setCreateDialogOpen(false);
          dispatch(clearDimensionCreateState());
        }}
        onSubmit={handleCreateDimensionSubmit}
      />

      <DimensionDialog
        key={editTarget ? `dim-edit-${editTarget.id}` : "dim-edit-closed"}
        open={Boolean(editTarget)}
        mode="edit"
        loading={dimensionUpdateLoading}
        error={dimensionUpdateError}
        dimension={editTarget}
        companies={visibleCompanies}
        companiesLoading={companiesLoading}
        defaultCompanyId={editTarget?.company_id || selectedCompanyId}
        isPlatformAdmin={isPlatformAdmin}
        onClose={() => {
          setEditTarget(null);
          dispatch(clearDimensionUpdateState());
        }}
        onSubmit={handleEditDimensionSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete dimension?"
        message={`This hard-deletes "${deleteTarget?.dimension_label || deleteTarget?.dimension_key || "this dimension"}". The backend rejects this if any active KPI mappings reference it — remove the mappings first if you see an error.`}
        confirmLabel={dimensionDeleteLoading ? "Deleting..." : "Delete"}
        confirmColor="error"
        onConfirm={handleDeleteDimensionConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />

      <AddMappingDialog
        key={addMappingOpen ? "map-add-open" : "map-add-closed"}
        open={addMappingOpen}
        loading={mappingCreateLoading}
        error={mappingCreateError}
        companies={visibleCompanies}
        companiesLoading={companiesLoading}
        defaultCompanyId={selectedCompanyId}
        isPlatformAdmin={isPlatformAdmin}
        defaultDimensionId={activeDimensionId}
        existingKpiKeysByDimension={existingKpiKeysByDimension}
        onClose={() => {
          setAddMappingOpen(false);
          dispatch(clearMappingMutationState());
        }}
        onSubmit={handleAddMappingSubmit}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => {
          setToast(null);
          dispatch(clearDimensionCreateState());
          dispatch(clearDimensionUpdateState());
          dispatch(clearDimensionDeleteState());
          dispatch(clearMappingMutationState());
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

// Per-row controls for dimension KPI mappings. Direct row-level edits with
// no draft step — weight has an inline save icon, is_active is a toggle,
// delete is immediate.
function DimensionMappingsTable({
  rows,
  loading,
  error,
  updating,
  deleting,
  disabled,
  onSaveField,
  onDeleteRow,
  emptyMessage,
}) {
  const muiTheme = useTheme();
  const [weightEdits, setWeightEdits] = useState({});

  if (error) {
    return <Alert severity="warning">{error}</Alert>;
  }

  if (loading) {
    return (
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ py: 2, color: "text.secondary" }}
      >
        <CircularProgress size={16} />
        <Typography variant="body2">Loading mapping rows...</Typography>
      </Stack>
    );
  }

  if (rows.length === 0) {
    return (
      <Box
        sx={{
          py: 3,
          textAlign: "center",
          color: "text.secondary",
          border: `1px dashed ${muiTheme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="body2">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>KPI</TableCell>
          <TableCell sx={{ width: 160 }}>Weight</TableCell>
          <TableCell sx={{ width: 130 }}>Status</TableCell>
          {!disabled && (
            <TableCell sx={{ width: 80, textAlign: "right" }}>Actions</TableCell>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => {
          const draftWeight =
            weightEdits[row.id] != null ? weightEdits[row.id] : row.weight;
          const weightDirty = Number(draftWeight) !== Number(row.weight);
          return (
            <TableRow key={row.id} hover>
              <TableCell>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
                  {row.display_name || "Unnamed KPI"}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <TextField
                    type="number"
                    size="small"
                    value={draftWeight}
                    onChange={(event) =>
                      setWeightEdits((prev) => ({
                        ...prev,
                        [row.id]: event.target.value,
                      }))
                    }
                    inputProps={{ step: 0.1, min: 0.1 }}
                    sx={{ width: 90 }}
                    disabled={disabled || updating}
                  />
                  <Tooltip title={weightDirty ? "Save weight" : "No changes"}>
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={disabled || updating || !weightDirty}
                        onClick={() => {
                          const next = Number(draftWeight);
                          if (!Number.isFinite(next) || next <= 0) return;
                          onSaveField(row.id, { weight: next });
                          setWeightEdits((prev) => {
                            const { [row.id]: _, ...rest } = prev;
                            return rest;
                          });
                        }}
                        aria-label={`Save weight for ${row.display_name || row.kpi_key}`}
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
                    disabled={disabled || updating}
                    onChange={() =>
                      onSaveField(row.id, { is_active: !row.is_active })
                    }
                    inputProps={{
                      "aria-label": `Toggle status for ${row.display_name || row.kpi_key}`,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {row.is_active ? "Active" : "Paused"}
                  </Typography>
                </Stack>
              </TableCell>
              {!disabled && (
                <TableCell sx={{ textAlign: "right" }}>
                  <Tooltip title="Remove this KPI mapping">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={deleting}
                        onClick={() => onDeleteRow(row.id)}
                        aria-label={`Delete ${row.display_name || row.kpi_key}`}
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
  );
}
