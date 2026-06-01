import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearCompanyUploadError,
  clearCompanyDeleteState,
  clearCompanyError,
  fetchCompanies,
  deleteCompany,
  resetCompanyUpload,
  uploadCompanyFile,
} from "../../store/companySlice";
import { getSurfaceBackground } from "../../theme";
import { formatDateTimeIST } from "../../utils/dateTime";
import { downloadTemplateFile } from "../../utils/downloadTemplate";
import usePermissions from "../../hooks/usePermissions";

export default function CompanyData() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const feedback = location.state?.feedback;
  const [uploadFeedback, setUploadFeedback] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "all",
  });
  const {
    companies,
    companiesLoading,
    error,
    deleteLoading,
    deleteError,
    deleteMessage,
    uploadLoading,
    uploadError,
    uploadStatus,
  } = useSelector((state) => state.company);
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateCompanies = canCreate("company-data");
  const canEditCompanies = canEdit("company-data");
  const canDeleteCompanies = canDelete("company-data");

  const getCompanyListParams = useCallback(
    () => ({
      search: appliedFilters.search.trim(),
      isActive:
        appliedFilters.status === "all"
          ? undefined
          : appliedFilters.status === "active",
    }),
    [appliedFilters.search, appliedFilters.status],
  );

  useEffect(() => {
    dispatch(fetchCompanies(getCompanyListParams()));
  }, [dispatch, getCompanyListParams]);

  useEffect(() => {
    return () => {
      dispatch(clearCompanyError());
      dispatch(clearCompanyDeleteState());
      dispatch(resetCompanyUpload());
    };
  }, [dispatch]);

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    dispatch(resetCompanyUpload());
    setUploadFeedback(null);

    try {
      await dispatch(uploadCompanyFile(file)).unwrap();
      await dispatch(fetchCompanies(getCompanyListParams())).unwrap();
      setUploadFeedback({
        severity: "success",
        message: `Company file "${file.name}" uploaded successfully.`,
      });
    } catch {
      // Redux state already stores the error.
    }

    event.target.value = "";
  };

  const handleDownloadFormat = () => {
    downloadTemplateFile("templates/CompanyData.xlsx", "CompanyData.xlsx");
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: filters.search.trim(),
      status: filters.status,
    });
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      search: "",
      status: "all",
    };

    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleDelete = useCallback(async (companyId, companyName) => {
    if (!window.confirm(`Delete company "${companyName}"?`)) return;

    try {
      await dispatch(deleteCompany(companyId)).unwrap();
    } catch {
      // Redux state already stores the error.
    }
  }, [dispatch]);

  const columns = useMemo(
    () => [
      {
        field: "company_name",
        headerName: "Company Name",
        flex: 1.2,
        minWidth: 220,
      },
      {
        field: "industry",
        headerName: "Industry",
        flex: 1,
        minWidth: 180,
      },
      {
        field: "size_bucket",
        headerName: "Size",
        minWidth: 120,
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1.1,
        minWidth: 220,
      },
      {
        field: "phone",
        headerName: "Phone",
        minWidth: 150,
      },
      {
        field: "location_name",
        headerName: "Location",
        flex: 1,
        minWidth: 160,
        valueGetter: (_value, row) => row?.location_name || "-",
      },
      {
        field: "no_of_employees",
        headerName: "Employees",
        minWidth: 120,
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
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        minWidth: 170,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => navigate(`/super-admin/company-data/${row.id}`)}
              >
                <PreviewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEditCompanies && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() =>
                    navigate(`/super-admin/company-data/${row.id}/edit`)
                  }
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteCompanies && (
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deleteLoading}
                    onClick={() => handleDelete(row.id, row.company_name)}
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
    [canDeleteCompanies, canEditCompanies, deleteLoading, handleDelete, navigate],
  );

  return (
    <Layout role="superadmin" title="Company Data">
      <Stack spacing={2}>
        {feedback && (
          <Alert severity={feedback.severity}>{feedback.message}</Alert>
        )}
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
                Company Master
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.75, maxWidth: 720 }}
              >
                Company management.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {canCreateCompanies && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => navigate("/super-admin/company-data/add")}
                  sx={{
                    height: 40,
                    px: 2.5,
                    flex: { xs: "1 1 100%", sm: "0 0 auto" },
                    whiteSpace: "nowrap",
                  }}
                >
                  Add Company
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<FileDownloadRoundedIcon />}
                onClick={handleDownloadFormat}
                sx={{
                  height: 40,
                  flex: { xs: "1 1 100%", sm: "0 0 auto" },
                  px: 2,
                  whiteSpace: "nowrap",
                }}
              >
                Download format
              </Button>
              {canCreateCompanies && (
                <Button
                  variant="outlined"
                  startIcon={<UploadFileRoundedIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                  sx={{
                    height: 40,
                    flex: { xs: "1 1 100%", sm: "0 0 auto" },
                    px: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {uploadLoading ? "Uploading..." : "Import Excel"}
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => dispatch(fetchCompanies(getCompanyListParams()))}
                disabled={companiesLoading}
                sx={{
                  height: 40,
                  flex: { xs: "1 1 100%", sm: "0 0 auto" },
                  px: 2,
                  py: 1.1,
                  whiteSpace: "nowrap",
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          <input
            hidden
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            onClick={() => {
              if (uploadError) {
                dispatch(clearCompanyUploadError());
              }
            }}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total companies: {companies.length}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              mb: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(2, minmax(0, 1fr)) auto auto",
              },
              alignItems: { lg: "end" },
            }}
          >
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
              disabled={companiesLoading}
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
                rows={companies}
                columns={columns}
                loading={companiesLoading}
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
