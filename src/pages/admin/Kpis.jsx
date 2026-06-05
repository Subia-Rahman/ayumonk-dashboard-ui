import { useCallback, useEffect, useMemo, useState } from "react";
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
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Layout from "../../layouts/commonLayout/Layout";
import { fetchCompanies } from "../../store/companySlice";
import { fetchThemes } from "../../store/themeSlice";
import {
  clearKpiDeleteState,
  clearKpiListError,
  deleteKpi,
  fetchKpis,
} from "../../store/kpiSlice";
import { getCompanyId } from "../../utils/roleHelper";
import usePermissions from "../../hooks/usePermissions";
import { getSurfaceBackground } from "../../theme";

const filterFieldSx = {
  "& .MuiInputBase-root": {
    minHeight: 56,
  },
};

export default function Kpis({ role = "admin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;
  const {
    items,
    total,
    listLoading,
    listError,
    deleteLoading,
    deleteError,
    deleteMessage,
  } = useSelector((state) => state.kpi);
  const { companies } = useSelector((state) => state.company);
  const { items: themeItems } = useSelector((state) => state.theme);
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateKpis = canCreate("kpis");
  const canEditKpis = canEdit("kpis");
  const canDeleteKpis = canDelete("kpis");
  const [filters, setFilters] = useState({
    companyId: role === "admin" ? getCompanyId() : "",
    themeKey: "",
    search: "",
    status: "all",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    companyId: role === "admin" ? getCompanyId() : "",
    themeKey: "",
    search: "",
    status: "all",
  });

  const isActive =
    appliedFilters.status === "all"
      ? undefined
      : appliedFilters.status === "active";

  const themeNameByKey = useMemo(
    () =>
      themeItems.reduce((accumulator, item) => {
        accumulator[item.theme_key] = item.theme_display_name;
        return accumulator;
      }, {}),
    [themeItems],
  );

  const filteredThemeItems = useMemo(
    () =>
      filters.companyId
        ? themeItems.filter((item) => item.company_id === filters.companyId)
        : themeItems,
    [filters.companyId, themeItems],
  );

  const companyNameById = useMemo(
    () =>
      companies.reduce((accumulator, company) => {
        accumulator[company.id] = company.company_name;
        return accumulator;
      }, {}),
    [companies],
  );

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchThemes({ limit: 500, isActive: true }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchKpis({
        search: appliedFilters.search.trim(),
        isActive: role === "admin" ? true : isActive,
        companyId: role === "admin" ? getCompanyId() : appliedFilters.companyId || undefined,
        themeKey: appliedFilters.themeKey || undefined,
      }),
    );
  }, [appliedFilters.companyId, appliedFilters.search, appliedFilters.status, appliedFilters.themeKey, dispatch, isActive, role]);

  useEffect(() => {
    return () => {
      dispatch(clearKpiListError());
      dispatch(clearKpiDeleteState());
    };
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchCompanies());
    dispatch(fetchThemes({ limit: 500, isActive: true }));
    dispatch(
      fetchKpis({
        search: appliedFilters.search.trim(),
        isActive: role === "admin" ? true : isActive,
        companyId: role === "admin" ? getCompanyId() : appliedFilters.companyId || undefined,
        themeKey: appliedFilters.themeKey || undefined,
      }),
    );
  };

  const handleDelete = useCallback(
    async (kpiKey) => {
      try {
        await dispatch(deleteKpi(kpiKey)).unwrap();
        dispatch(
          fetchKpis({
            search: appliedFilters.search.trim(),
            isActive: role === "admin" ? true : isActive,
            companyId:
              role === "admin" ? getCompanyId() : appliedFilters.companyId || undefined,
            themeKey: appliedFilters.themeKey || undefined,
          }),
        );
      } catch {
        // Error is already handled in redux state.
      }
    },
    [
      appliedFilters.companyId,
      appliedFilters.search,
      appliedFilters.themeKey,
      dispatch,
      isActive,
      role,
    ],
  );

  const handleApplyFilters = () => {
    setAppliedFilters({
      companyId: filters.companyId,
      themeKey: filters.themeKey,
      search: filters.search,
      status: filters.status,
    });
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      companyId: role === "admin" ? getCompanyId() : "",
      themeKey: "",
      search: "",
      status: "all",
    };

    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    dispatch(
      fetchKpis({
        search: "",
        isActive: role === "admin" ? true : undefined,
        companyId: role === "admin" ? getCompanyId() : undefined,
      }),
    );
  };

  const columns = useMemo(
    () => [
      {
        field: "company_id",
        headerName: "Company",
        flex: 1.1,
        minWidth: 220,
        valueGetter: (_, row) => companyNameById[row.company_id] || row.company_id || "-",
      },
      {
        field: "display_name",
        headerName: "KPI Name",
        flex: 1.2,
        minWidth: 220,
      },
      {
        field: "theme_key",
        headerName: "Theme",
        flex: 1.1,
        minWidth: 220,
        valueGetter: (_, row) => themeNameByKey[row.theme_key] || row.theme_key || "-",
      },
      {
        field: "domain_category",
        headerName: "Domain Category",
        flex: 1.1,
        minWidth: 200,
      },
      {
        field: "wi_weight",
        headerName: "WI Weight",
        minWidth: 120,
      },
      {
        field: "start_date",
        headerName: "Start Date",
        minWidth: 130,
      },
      {
        field: "end_date",
        headerName: "End Date",
        minWidth: 130,
      },
      {
        field: "is_active",
        headerName: "Status",
        minWidth: 130,
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
                      ? `/admin/kpis/${row.kpi_key}`
                      : `/super-admin/kpis/${row.kpi_key}`,
                  )
                }
              >
                <PreviewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEditKpis && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? `/admin/kpis/${row.kpi_key}/edit`
                        : `/super-admin/kpis/${row.kpi_key}/edit`,
                    )
                  }
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteKpis && (
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deleteLoading}
                    onClick={() => handleDelete(row.kpi_key)}
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
      canDeleteKpis,
      canEditKpis,
      companyNameById,
      deleteLoading,
      handleDelete,
      navigate,
      role,
      themeNameByKey,
    ],
  );

  return (
    <Layout role={role} title="KPI Master">
      <Stack spacing={2}>
        {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
        {listError && <Alert severity="error">{listError}</Alert>}
        {deleteError && <Alert severity="error">{deleteError}</Alert>}
        {deleteMessage && <Alert severity="success">{deleteMessage}</Alert>}

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
                KPI Master
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
                Create, review, update, and deactivate KPIs using the API-backed admin flow.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {canCreateKpis && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? "/admin/kpis/add"
                        : "/super-admin/kpis/add",
                    )
                  }
                >
                  Add KPI
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={handleRefresh}
                disabled={listLoading}
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
                lg: "repeat(4, minmax(0, 1fr)) auto auto",
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
                  themeKey: "",
                }))
              }
              disabled={role === "admin"}
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
            <TextField
              label="Theme"
              select
              value={filters.themeKey}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  themeKey: event.target.value,
                }))
              }
              disabled={!filters.companyId}
              fullWidth
              sx={filterFieldSx}
            >
              <MenuItem value="">All Themes</MenuItem>
              {filteredThemeItems.map((item) => (
                <MenuItem key={item.theme_key} value={item.theme_key}>
                  {item.theme_display_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Search KPI"
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
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total KPIs: {total}
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
    </Layout>
  );
}
