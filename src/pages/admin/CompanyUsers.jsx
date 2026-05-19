import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import Layout from "../../layouts/commonLayout/Layout";
import { fetchCompanies } from "../../store/companySlice";
import {
  clearUserDeleteState,
  clearUserError,
  deleteUser,
  fetchUsers,
} from "../../store/userSlice";
import {
  clearUserUploadError,
  resetUserUpload,
  uploadUserFile,
} from "../../store/userUploadSlice";
import { getSurfaceBackground } from "../../theme";
import { downloadTemplateFile } from "../../utils/downloadTemplate";
import { formatDateTimeIST } from "../../utils/dateTime";
import { getCompanyId } from "../../utils/roleHelper";
import useTenantContext from "../../hooks/useTenantContext";
import usePermissions from "../../hooks/usePermissions";

export default function CompanyUsers({ role = "admin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const feedback = location.state?.feedback;
  const [uploadFeedback, setUploadFeedback] = useState(null);
  const [filters, setFilters] = useState({
    companyId: role === "admin" ? getCompanyId() : "",
    search: "",
    status: "all",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    companyId: role === "admin" ? getCompanyId() : "",
    search: "",
    status: "all",
  });
  const {
    users,
    total,
    usersLoading,
    error,
    deleteLoading,
    deleteError,
    deleteMessage,
  } = useSelector((state) => state.user);
  const { companies } = useSelector((state) => state.company);
  const {
    loading: uploadLoading,
    error: uploadError,
    status: uploadStatus,
  } = useSelector((state) => state.userUpload);

  const { isPlatformAdmin, companyIdForRequest } = useTenantContext();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateCompanyUsers = canCreate("company-users");
  const canEditCompanyUsers = canEdit("company-users");
  const canDeleteCompanyUsers = canDelete("company-users");

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const getUserListParams = useCallback(() => {
    // Spec §7: tenant users never send company_id (backend uses JWT). Platform
    // admins attach the active tenant they picked OR the explicit list filter.
    const resolvedCompanyId = isPlatformAdmin
      ? appliedFilters.companyId.trim() || companyIdForRequest
      : "";

    return {
      ...(resolvedCompanyId ? { companyId: resolvedCompanyId } : {}),
      search: appliedFilters.search.trim(),
      isActive:
        appliedFilters.status === "all"
          ? undefined
          : appliedFilters.status === "active",
    };
  }, [
    appliedFilters.companyId,
    appliedFilters.search,
    appliedFilters.status,
    companyIdForRequest,
    isPlatformAdmin,
  ]);

  useEffect(() => {
    dispatch(fetchUsers(getUserListParams()));
  }, [dispatch, getUserListParams]);

  useEffect(() => {
    return () => {
      dispatch(clearUserError());
      dispatch(clearUserDeleteState());
      dispatch(resetUserUpload());
    };
  }, [dispatch]);

  const companyNameById = useMemo(
    () =>
      companies.reduce((accumulator, company) => {
        accumulator[company.id] = company.company_name;
        return accumulator;
      }, {}),
    [companies],
  );

  const handleDelete = useCallback(
    async (userId, fullName) => {
      if (!window.confirm(`Delete user "${fullName}"?`)) return;

      try {
        await dispatch(deleteUser(userId)).unwrap();
      } catch {
        // Redux state already stores the error.
      }
    },
    [dispatch],
  );

  const handleImport = async (event) => {
    if (role === "admin") return;

    const file = event.target.files?.[0];
    if (!file) return;

    dispatch(resetUserUpload());
    setUploadFeedback(null);

    try {
      await dispatch(uploadUserFile(file)).unwrap();
      await dispatch(fetchUsers(getUserListParams())).unwrap();
      setUploadFeedback({
        severity: "success",
        message: `User file "${file.name}" uploaded successfully.`,
      });
    } catch {
      // Redux state already stores the error.
    }

    event.target.value = "";
  };

  const handleDownloadFormat = () => {
    downloadTemplateFile("templates/CompanyUserData.xlsx", "CompanyUserData.xlsx");
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      companyId: filters.companyId,
      search: filters.search.trim(),
      status: filters.status,
    });
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      companyId: role === "admin" ? getCompanyId() : "",
      search: "",
      status: "all",
    };

    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "emp_id",
        headerName: "Employee ID",
        minWidth: 140,
      },
      {
        field: "full_name",
        headerName: "Full Name",
        flex: 1.1,
        minWidth: 220,
      },
      {
        field: "department",
        headerName: "Department",
        minWidth: 150,
      },
      {
        field: "gender",
        headerName: "Gender",
        minWidth: 120,
      },
      {
        field: "age_band",
        headerName: "Age Band",
        minWidth: 120,
      },
      {
        field: "phone",
        headerName: "Phone",
        minWidth: 150,
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1.1,
        minWidth: 240,
      },
      {
        field: "company_id",
        headerName: "Company",
        flex: 1,
        minWidth: 220,
        renderCell: ({ value }) => companyNameById[value] || value || "-",
      },
      {
        field: "role_name",
        headerName: "Role",
        minWidth: 150,
        valueGetter: (_, row) => row.role_name || "-",
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
        minWidth: 190,
        valueFormatter: (value) => formatDateTimeIST(value),
      },
    ];

    const isAdminPath = role === "admin";
    const viewPath = (id) =>
      isAdminPath ? `/admin/company-users/${id}` : `/super-admin/company-users/${id}`;
    const editPath = (id) =>
      isAdminPath
        ? `/admin/company-users/${id}/edit`
        : `/super-admin/company-users/${id}/edit`;

    return [
      ...baseColumns,
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        minWidth: 170,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton size="small" onClick={() => navigate(viewPath(row.id))}>
                <PreviewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEditCompanyUsers && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => navigate(editPath(row.id))}
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteCompanyUsers && (
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deleteLoading}
                    onClick={() => handleDelete(row.id, row.full_name)}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ];
  }, [
    canDeleteCompanyUsers,
    canEditCompanyUsers,
    companyNameById,
    deleteLoading,
    handleDelete,
    navigate,
    role,
  ]);

  return (
    <Layout role={role} title="Company User Data">
      <Stack spacing={2}>
        {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {deleteError && <Alert severity="error">{deleteError}</Alert>}
        {deleteMessage && <Alert severity="success">{deleteMessage}</Alert>}
        {uploadFeedback && (
          <Alert severity={uploadFeedback.severity}>{uploadFeedback.message}</Alert>
        )}
        {uploadStatus === "error" && uploadError && (
          <Alert severity="error">{uploadError}</Alert>
        )}

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
                Company Users
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
                {role === "admin"
                  ? "Review and update company user records for your company."
                  : "Manage employee records."}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {canCreateCompanyUsers && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? "/admin/company-users/add"
                        : "/super-admin/company-users/add",
                    )
                  }
                  sx={{ height: 40, px: 2.5, whiteSpace: "nowrap" }}
                >
                  Add User
                </Button>
              )}
              {role === "superadmin" && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadRoundedIcon />}
                    onClick={handleDownloadFormat}
                    sx={{ height: 40, px: 2, whiteSpace: "nowrap" }}
                  >
                    Download format
                  </Button>
                  {canCreateCompanyUsers && (
                    <Button
                      variant="outlined"
                      startIcon={<UploadFileRoundedIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                      sx={{ height: 40, px: 2, whiteSpace: "nowrap" }}
                    >
                      {uploadLoading ? "Uploading..." : "Import Excel"}
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => dispatch(fetchUsers(getUserListParams()))}
                disabled={usersLoading}
                sx={{ height: 40, px: 2, whiteSpace: "nowrap" }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          {role === "superadmin" && (
            <input
              hidden
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImport}
              onClick={() => {
                if (uploadError) {
                  dispatch(clearUserUploadError());
                }
              }}
            />
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total users: {total || users.length}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              mb: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: role === "superadmin"
                  ? "repeat(4, minmax(0, 1fr)) auto auto"
                  : "repeat(3, minmax(0, 1fr)) auto auto",
              },
              alignItems: { lg: "end" },
            }}
          >
            {role === "superadmin" && (
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
                <MenuItem value="">All Companies</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.company_name}
                  </MenuItem>
                ))}
              </TextField>
            )}
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
              disabled={usersLoading}
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

          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ height: 560, width: "100%" }}>
              <DataGrid
                rows={users}
                columns={columns}
                loading={usersLoading}
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
        </Paper>
      </Stack>
    </Layout>
  );
}
