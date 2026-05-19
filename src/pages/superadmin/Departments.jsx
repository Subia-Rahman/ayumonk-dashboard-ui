import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearDepartmentCreateState,
  clearDepartmentDeleteState,
  clearDepartmentListState,
  clearDepartmentUpdateState,
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  resetDepartments,
  updateDepartment,
} from "../../store/departmentSlice";
import { fetchCompanies } from "../../store/companySlice";
import { getSurfaceBackground } from "../../theme";
import { formatDateTimeIST } from "../../utils/dateTime";
import { getCompanyId } from "../../utils/roleHelper";
import usePermissions from "../../hooks/usePermissions";

const PAGE_SIZE = 50;

const blankForm = { name: "", description: "", company_id: "" };

export default function Departments() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const feedback = location.state?.feedback;

  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateDepartments = canCreate("departments");
  const canEditDepartments = canEdit("departments");
  const canDeleteDepartments = canDelete("departments");

  const {
    items,
    total,
    listLoading,
    listError,
    createLoading,
    createError,
    updateLoading,
    updateError,
    deleteLoading,
    deleteError,
  } = useSelector((state) => state.department);
  const { companies } = useSelector((state) => state.company);

  const defaultCompanyId = useMemo(() => getCompanyId() || "", []);
  const [filters, setFilters] = useState({
    companyId: defaultCompanyId,
    search: "",
    status: "active",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    companyId: defaultCompanyId,
    search: "",
    status: "active",
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(blankForm);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(blankForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    dispatch(fetchCompanies());
    return () => {
      dispatch(resetDepartments());
      dispatch(clearDepartmentListState());
      dispatch(clearDepartmentCreateState());
      dispatch(clearDepartmentUpdateState());
      dispatch(clearDepartmentDeleteState());
    };
  }, [dispatch]);

  const fetchParams = useMemo(
    () => ({
      companyId: appliedFilters.companyId || undefined,
      search: appliedFilters.search,
      isActive:
        appliedFilters.status === "all"
          ? undefined
          : appliedFilters.status === "active",
      skip: 0,
      limit: PAGE_SIZE,
    }),
    [appliedFilters.companyId, appliedFilters.search, appliedFilters.status],
  );

  const reload = useCallback(() => {
    if (!appliedFilters.companyId) return;
    dispatch(fetchDepartments(fetchParams));
  }, [appliedFilters.companyId, dispatch, fetchParams]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      companyId: filters.companyId,
      search: filters.search.trim(),
      status: filters.status,
    });
  };

  const handleResetFilters = () => {
    const next = {
      companyId: defaultCompanyId,
      search: "",
      status: "active",
    };
    setFilters(next);
    setAppliedFilters(next);
  };

  const openCreate = () => {
    setCreateForm({
      ...blankForm,
      company_id: appliedFilters.companyId || defaultCompanyId || "",
    });
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (createLoading) return;
    setCreateOpen(false);
    setCreateForm(blankForm);
  };

  const submitCreate = async () => {
    const name = createForm.name.trim();
    const companyId = createForm.company_id;
    if (!name || !companyId) return;
    try {
      const result = await dispatch(
        createDepartment({
          name,
          description: createForm.description.trim() || null,
          company_id: companyId,
        }),
      ).unwrap();
      setCreateOpen(false);
      setCreateForm(blankForm);
      setActionFeedback({
        severity: "success",
        message: result?.message || "Department created successfully.",
      });
      // If the created department is for the company currently filtered, refresh
      // the visible list; otherwise the user can switch filters to find it.
      if (companyId === appliedFilters.companyId) {
        reload();
      }
    } catch {
      // Redux holds the createError; the dialog will show it inline.
    }
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setEditForm({
      name: row.name || "",
      description: row.description || "",
    });
  };

  const closeEdit = () => {
    if (updateLoading) return;
    setEditTarget(null);
    setEditForm(blankForm);
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    const payload = {
      id: editTarget.id,
      company_id: editTarget.company_id || appliedFilters.companyId || undefined,
    };

    const trimmedName = editForm.name.trim();
    if (trimmedName !== editTarget.name) payload.name = trimmedName;

    const trimmedDescription = editForm.description.trim();
    if (trimmedDescription !== (editTarget.description || "")) {
      payload.description = trimmedDescription ? trimmedDescription : null;
    }

    if (!("name" in payload) && !("description" in payload)) {
      closeEdit();
      return;
    }

    try {
      const result = await dispatch(updateDepartment(payload)).unwrap();
      setEditTarget(null);
      setEditForm(blankForm);
      setActionFeedback({
        severity: "success",
        message: result?.message || "Department updated successfully.",
      });
    } catch {
      // Redux holds updateError; dialog renders it.
    }
  };

  const askDelete = (row) => setConfirmDelete(row);
  const cancelDelete = () => {
    if (deleteLoading) return;
    setConfirmDelete(null);
  };
  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      const result = await dispatch(
        deleteDepartment({
          id: confirmDelete.id,
          company_id:
            confirmDelete.company_id || appliedFilters.companyId || undefined,
        }),
      ).unwrap();
      setConfirmDelete(null);
      setActionFeedback({
        severity: "success",
        message: result?.message || "Department deleted successfully.",
      });
    } catch {
      // Redux holds deleteError; banner above table renders it.
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1.2,
        minWidth: 200,
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.5,
        minWidth: 260,
        renderCell: ({ value }) => value || "-",
      },
      {
        field: "is_active",
        headerName: "Status",
        minWidth: 120,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            label={value ? "Active" : "Inactive"}
            color={value ? "success" : "default"}
            variant={value ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "updated_at",
        headerName: "Updated At",
        flex: 1,
        minWidth: 180,
        valueFormatter: (value) => formatDateTimeIST(value),
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            {canEditDepartments && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => openEdit(row)}>
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteDepartments && (
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deleteLoading}
                    onClick={() => askDelete(row)}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ],
    [canDeleteDepartments, canEditDepartments, deleteLoading],
  );

  return (
    <Layout role="superadmin" title="Departments">
      <Stack spacing={2}>
        {feedback && (
          <Alert severity={feedback.severity}>{feedback.message}</Alert>
        )}
        {actionFeedback && (
          <Alert
            severity={actionFeedback.severity}
            onClose={() => setActionFeedback(null)}
          >
            {actionFeedback.message}
          </Alert>
        )}
        {listError && <Alert severity="error">{listError}</Alert>}
        {deleteError && <Alert severity="error">{deleteError}</Alert>}

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
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                Departments
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.75, maxWidth: 720 }}
              >
                Create, rename, and retire departments scoped to a company.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {canCreateDepartments && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={openCreate}
                  sx={{ height: 40, px: 2.5, whiteSpace: "nowrap" }}
                >
                  Add Department
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={reload}
                disabled={listLoading || !appliedFilters.companyId}
                sx={{ height: 40, px: 2, whiteSpace: "nowrap" }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              mb: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr)) auto auto",
              },
              alignItems: { lg: "end" },
            }}
          >
            <TextField
              label="Company"
              select
              value={filters.companyId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  companyId: event.target.value,
                }))
              }
              fullWidth
            >
              <MenuItem value="">Select company</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.company_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Search"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Status"
              select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              fullWidth
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              disabled={listLoading || !filters.companyId}
              sx={{ minHeight: 56, px: 3, whiteSpace: "nowrap" }}
            >
              Apply Filters
            </Button>
            <Button
              variant="text"
              onClick={handleResetFilters}
              sx={{ minHeight: 56, px: 2, whiteSpace: "nowrap" }}
            >
              Reset
            </Button>
          </Box>

          {appliedFilters.companyId ? (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Total departments: {total}
              </Typography>
              <Box sx={{ width: "100%", overflowX: "auto" }}>
                <Box
                  sx={{ height: 560, width: "100%" }}
                >
                  <DataGrid
                    rows={items}
                    columns={columns}
                    loading={listLoading}
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                      sorting: {
                        sortModel: [{ field: "updated_at", sort: "desc" }],
                      },
                    }}
                  />
                </Box>
              </Box>
            </>
          ) : (
            <Alert severity="info">
              Select a company to load its departments.
            </Alert>
          )}
        </Paper>
      </Stack>

      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>Add Department</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {createError && <Alert severity="error">{createError}</Alert>}
            <TextField
              label="Company"
              select
              value={createForm.company_id}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  company_id: event.target.value,
                }))
              }
              required
              fullWidth
            >
              <MenuItem value="">Select company</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.company_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Name"
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              autoFocus
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreate} disabled={createLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitCreate}
            disabled={
              createLoading ||
              !createForm.name.trim() ||
              !createForm.company_id
            }
            startIcon={
              createLoading ? <CircularProgress size={16} /> : null
            }
          >
            {createLoading ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(editTarget)}
        onClose={closeEdit}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Department</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {updateError && <Alert severity="error">{updateError}</Alert>}
            <TextField
              label="Name"
              value={editForm.name}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              autoFocus
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              multiline
              minRows={2}
              helperText="Leave blank to clear the description."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={updateLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitEdit}
            disabled={updateLoading || !editForm.name.trim()}
            startIcon={
              updateLoading ? <CircularProgress size={16} /> : null
            }
          >
            {updateLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(confirmDelete)}
        onClose={cancelDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete department</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Soft-delete{" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {confirmDelete?.name}
            </Box>
            ? It will be retired and no longer appear in active lists.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeleteAction}
            disabled={deleteLoading}
            startIcon={
              deleteLoading ? <CircularProgress size={16} /> : null
            }
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
