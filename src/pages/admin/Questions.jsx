import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  Tooltip,
  Typography,
  useTheme,
  TextField,
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
import {
  clearQuestionDeleteState,
  clearQuestionListError,
  clearQuestionUploadError,
  deleteQuestion,
  fetchQuestions,
  resetQuestionUpload,
  uploadQuestionFile,
} from "../../store/questionSlice";
import { fetchThemes } from "../../store/themeSlice";
import { fetchKpis } from "../../store/kpiSlice";
import { fetchCompanies } from "../../store/companySlice";
import usePermissions from "../../hooks/usePermissions";
import useTenantContext from "../../hooks/useTenantContext";
import { getSurfaceBackground } from "../../theme";
import { downloadTemplateFile } from "../../utils/downloadTemplate";

const filterFieldSx = {
  "& .MuiInputBase-root": {
    minHeight: 56,
  },
};

export default function Questions({ role = "admin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;
  const fileInputRef = useRef(null);
  // Spec: questions slug maps to the `kpis` resource codename (questions are
  // a child of KPIs). The slug→resource map in usePermissions handles this.
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { isPlatformAdmin, companyIdForRequest } = useTenantContext();
  const canCreateQuestions = canCreate("questions");
  const canEditQuestions = canEdit("questions");
  const canDeleteQuestions = canDelete("questions");
  const { items: themeItems } = useSelector((state) => state.theme);
  const { items: kpiItems } = useSelector((state) => state.kpi);
  const { companies } = useSelector((state) => state.company);
  const {
    items,
    total,
    listLoading,
    listError,
    deleteLoading,
    deleteError,
    deleteMessage,
    uploadLoading,
    uploadError,
    uploadStatus,
  } = useSelector((state) => state.question);
  const [filters, setFilters] = useState({
    companyId: "",
    themeKey: "",
    kpiKey: "",
    search: "",
    status: "all",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    companyId: "",
    themeKey: "",
    kpiKey: "",
    search: "",
    status: "all",
  });
  const [uploadFeedback, setUploadFeedback] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importCompanyId, setImportCompanyId] = useState("");
  const [importFile, setImportFile] = useState(null);

  const isActive =
    appliedFilters.status === "all"
      ? undefined
      : appliedFilters.status === "active";

  useEffect(() => {
    if (role === "superadmin") {
      dispatch(fetchCompanies());
    }
  }, [dispatch, role]);

  // Restore company filter from location state when returning from detail/edit page
  useEffect(() => {
    if (location.state?.companyId) {
      setFilters((current) => ({
        ...current,
        companyId: location.state.companyId,
      }));
      setAppliedFilters((current) => ({
        ...current,
        companyId: location.state.companyId,
      }));
    }
  }, [location.state?.companyId]);

  // Resolve which company_id should be attached to platform-admin / super-admin
  // requests. Mirrors the CompanyUsers.jsx pattern (Spec §7): explicit filter
  // dropdown wins; falls back to the globally selected tenant from the tenant
  // switcher. Tenant users never send company_id (backend uses JWT).
  const resolvedCompanyId =
    role === "superadmin" || isPlatformAdmin
      ? (appliedFilters.companyId || "").trim() || companyIdForRequest
      : "";

  useEffect(() => {
    const companyId =
      role === "superadmin"
        ? (filters.companyId || "").trim() || companyIdForRequest || undefined
        : undefined;
    dispatch(fetchThemes({ isActive: true, companyId }));
    dispatch(fetchKpis({ isActive: true, companyId }));
  }, [filters.companyId, companyIdForRequest, dispatch, role]);

  useEffect(() => {
    dispatch(
      fetchQuestions({
        skip: 0,
        limit: 50,
        themeKey: appliedFilters.themeKey,
        kpiKey: appliedFilters.kpiKey,
        search: appliedFilters.search,
        isActive,
        companyId: resolvedCompanyId || undefined,
      }),
    );
  }, [
    resolvedCompanyId,
    appliedFilters.kpiKey,
    appliedFilters.search,
    appliedFilters.themeKey,
    dispatch,
    isActive,
    role,
  ]);

  useEffect(() => {
    return () => {
      dispatch(clearQuestionListError());
      dispatch(clearQuestionDeleteState());
      dispatch(resetQuestionUpload());
    };
  }, [dispatch]);

  const filteredKpis = useMemo(
    () =>
      filters.themeKey
        ? kpiItems.filter((item) => item.theme_key === filters.themeKey)
        : kpiItems,
    [filters.themeKey, kpiItems],
  );

  const themeNameByKey = useMemo(
    () =>
      themeItems.reduce((accumulator, item) => {
        accumulator[item.theme_key] = item.theme_display_name;
        return accumulator;
      }, {}),
    [themeItems],
  );

  const kpiNameByKey = useMemo(
    () =>
      kpiItems.reduce((accumulator, item) => {
        accumulator[item.kpi_key] = item.display_name;
        return accumulator;
      }, {}),
    [kpiItems],
  );

  const companyNameById = useMemo(
    () =>
      companies.reduce((accumulator, company) => {
        accumulator[company.id] = company.company_name;
        return accumulator;
      }, {}),
    [companies],
  );

  const handleDelete = useCallback(async (questionId, questionCode) => {
    if (!window.confirm(`Delete question "${questionCode}"?`)) return;

    try {
      await dispatch(deleteQuestion(questionId)).unwrap();
    } catch {
      // Redux state already stores the error.
    }
  }, [dispatch]);

  const openImportDialog = () => {
    dispatch(resetQuestionUpload());
    setUploadFeedback(null);
    setImportCompanyId("");
    setImportFile(null);
    setImportDialogOpen(true);
  };

  const closeImportDialog = () => {
    if (uploadLoading) return;
    setImportDialogOpen(false);
    setImportCompanyId("");
    setImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportFileChange = (event) => {
    const file = event.target.files?.[0];
    if (uploadError) dispatch(clearQuestionUploadError());
    setImportFile(file || null);
  };

  const submitImport = async () => {
    if (!importFile || !importCompanyId) return;
    try {
      await dispatch(
        uploadQuestionFile({ file: importFile, companyId: importCompanyId }),
      ).unwrap();
      await dispatch(
        fetchQuestions({
          skip: 0,
          limit: 50,
          themeKey: appliedFilters.themeKey,
          kpiKey: appliedFilters.kpiKey,
          search: appliedFilters.search,
          isActive,
        }),
      ).unwrap();
      setUploadFeedback({
        severity: "success",
        message: `Question file "${importFile.name}" uploaded successfully.`,
      });
      setImportDialogOpen(false);
      setImportCompanyId("");
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // Redux state already stores the error; dialog renders uploadError inline.
    }
  };

  const handleDownloadFormat = () => {
    downloadTemplateFile("templates/MasterData.xlsx", "MasterData.xlsx");
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      companyId: filters.companyId,
      themeKey: filters.themeKey,
      kpiKey: filters.kpiKey,
      search: filters.search,
      status: filters.status,
    });
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      companyId: "",
      themeKey: "",
      kpiKey: "",
      search: "",
      status: "all",
    };

    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    dispatch(
      fetchQuestions({
        skip: 0,
        limit: 50,
        themeKey: "",
        kpiKey: "",
        search: "",
        isActive: undefined,
        // Fall back to the globally-selected tenant when the explicit filter
        // is cleared, so platform admins still see the right tenant's data.
        companyId: companyIdForRequest || undefined,
      }),
    );
  };

  const columns = useMemo(
    () => [
      ...(role === "superadmin"
        ? [
            {
              field: "company_id",
              headerName: "Company",
              minWidth: 200,
              valueGetter: (_, row) =>
                companyNameById[row.company_id] || row.company_id || "-",
            },
          ]
        : []),
      {
        field: "question_code",
        headerName: "Question Code",
        minWidth: 170,
      },
      {
        field: "question_text",
        headerName: "Question",
        flex: 1.5,
        minWidth: 320,
      },
      {
        field: "theme_key",
        headerName: "Theme",
        minWidth: 220,
        valueGetter: (_, row) => themeNameByKey[row.theme_key] || row.theme_key,
      },
      {
        field: "kpi_key",
        headerName: "KPI",
        minWidth: 220,
        valueGetter: (_, row) => kpiNameByKey[row.kpi_key] || row.kpi_key,
      },
      {
        field: "reverse_code",
        headerName: "Reverse Code",
        minWidth: 130,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            label={value ? "Yes" : "No"}
            color={value ? "warning" : "default"}
            variant={value ? "filled" : "outlined"}
          />
        ),
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
        field: "options",
        headerName: "Options",
        minWidth: 110,
        valueGetter: (_, row) => row.options?.length || 0,
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
                onClick={() =>
                  navigate(
                    role === "admin"
                      ? `/admin/questions/${row.id}`
                      : `/super-admin/questions/${row.id}`,
                    { state: { companyId: appliedFilters.companyId } },
                  )
                }
              >
                <PreviewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEditQuestions && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? `/admin/questions/${row.id}/edit`
                        : `/super-admin/questions/${row.id}/edit`,
                      { state: { companyId: appliedFilters.companyId } },
                    )
                  }
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteQuestions && (
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deleteLoading}
                    onClick={() => handleDelete(row.id, row.question_code)}
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
    [
      canDeleteQuestions,
      canEditQuestions,
      companyNameById,
      deleteLoading,
      handleDelete,
      kpiNameByKey,
      navigate,
      role,
      themeNameByKey,
    ],
  );

  return (
    <Layout role={role} title="Question Bank">
      <Stack spacing={2}>
        {feedback && (
          <Alert severity={feedback.severity}>{feedback.message}</Alert>
        )}
        {listError && <Alert severity="error">{listError}</Alert>}
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
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                Question Bank
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.75, maxWidth: 760 }}
              >
                Manage question bank scoped to a company.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {canCreateQuestions && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? "/admin/questions/add"
                        : "/super-admin/questions/add",
                    )
                  }
                >
                  Add Question
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<FileDownloadRoundedIcon />}
                onClick={handleDownloadFormat}
                sx={{ whiteSpace: "nowrap" }}
              >
                Download format
              </Button>
              {/* Bulk upload is a create action — gate on the create codename, not just role. */}
              {role === "superadmin" && canCreateQuestions && (
                <Button
                  variant="outlined"
                  startIcon={<UploadFileRoundedIcon />}
                  onClick={openImportDialog}
                  disabled={uploadLoading}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {uploadLoading ? "Uploading..." : "Import Excel"}
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={() =>
                  dispatch(
                    fetchQuestions({
                      skip: 0,
                      limit: 50,
                      themeKey: appliedFilters.themeKey,
                      kpiKey: appliedFilters.kpiKey,
                      search: appliedFilters.search,
                      isActive,
                    }),
                  )
                }
                disabled={listLoading}
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
            onChange={handleImportFileChange}
          />

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              mb: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg:
                  role === "superadmin"
                    ? "repeat(5, minmax(0, 1fr)) auto auto"
                    : "repeat(4, minmax(0, 1fr))",
              },
              alignItems: { lg: "end" },
            }}
          >
            {role === "superadmin" && (
              <TextField
                label="Company"
                select
                value={filters.companyId}
                onChange={(event) => {
                  const nextCompanyId = event.target.value;
                  // Auto-apply company-filter changes — themes/KPIs already
                  // refresh on filters.companyId; mirror that for the
                  // questions list so the GET request fires with the new
                  // company_id without needing an Apply Filters click.
                  setFilters((current) => ({
                    ...current,
                    companyId: nextCompanyId,
                    themeKey: "",
                    kpiKey: "",
                  }));
                  setAppliedFilters((current) => ({
                    ...current,
                    companyId: nextCompanyId,
                    themeKey: "",
                    kpiKey: "",
                  }));
                }}
                fullWidth
                sx={filterFieldSx}
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
              label="Theme"
              select
              value={filters.themeKey}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  themeKey: event.target.value,
                  kpiKey:
                    current.kpiKey &&
                    !kpiItems.some(
                      (item) =>
                        item.kpi_key === current.kpiKey &&
                        item.theme_key === event.target.value,
                    )
                      ? ""
                      : current.kpiKey,
                }))
              }
              fullWidth
              sx={filterFieldSx}
            >
              <MenuItem value="">All Themes</MenuItem>
              {themeItems.map((item) => (
                <MenuItem key={item.theme_key} value={item.theme_key}>
                  {item.theme_display_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="KPI"
              select
              value={filters.kpiKey}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  kpiKey: event.target.value,
                }))
              }
              fullWidth
              sx={filterFieldSx}
            >
              <MenuItem value="">All KPIs</MenuItem>
              {filteredKpis.map((item) => (
                <MenuItem key={item.kpi_key} value={item.kpi_key}>
                  {item.display_name}
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
              sx={filterFieldSx}
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
              sx={filterFieldSx}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
              {role === "superadmin" && (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleApplyFilters}
                    disabled={listLoading}
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
                </>
              )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {items.length} of {total} questions
          </Typography>

          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ height: 560, width: "100%" }}>
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
                }}
              />
            </Box>
          </Box>
        </Paper>
      </Stack>

      <Dialog
        open={importDialogOpen}
        onClose={closeImportDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Import Questions</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {uploadError && <Alert severity="error">{uploadError}</Alert>}
            <TextField
              label="Company"
              select
              value={importCompanyId}
              onChange={(event) => setImportCompanyId(event.target.value)}
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
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
              >
                Browse...
              </Button>
              <Typography
                variant="body2"
                color={importFile ? "text.primary" : "text.secondary"}
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {importFile ? importFile.name : "No file selected"}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Accepted formats: .xlsx, .xls, .csv
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImportDialog} disabled={uploadLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitImport}
            disabled={uploadLoading || !importFile || !importCompanyId}
            startIcon={uploadLoading ? <CircularProgress size={16} /> : null}
          >
            {uploadLoading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
