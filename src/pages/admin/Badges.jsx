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
import usePermissions from "../../hooks/usePermissions";
import {
  clearBadgeDeleteState,
  clearBadgeListError,
  deleteBadge,
  fetchBadges,
} from "../../store/badgeSlice";
import { fetchCompanies } from "../../store/companySlice";
import { fetchKpis } from "../../store/kpiSlice";
import { fetchThemes } from "../../store/themeSlice";
import { getCompanyId } from "../../utils/roleHelper";
import { getSurfaceBackground } from "../../theme";
import { formatDateTimeIST } from "../../utils/dateTime";

const filterFieldSx = {
  "& .MuiInputBase-root": {
    minHeight: 56,
  },
};

const TRIGGER_TYPE_OPTIONS = [
  { value: "streak", label: "Streak" },
  { value: "kpi_completions", label: "KPI Completions" },
  { value: "level", label: "Level" },
];

const LEVEL_OPTIONS = [
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "legend", label: "Legend" },
  { value: "platinum", label: "Platinum" },
];

const LEVEL_COLORS = {
  bronze: "warning",
  silver: "default",
  gold: "warning",
  legend: "secondary",
  platinum: "primary",
};

const basePathFor = (role) =>
  role === "superadmin" ? "/super-admin/badges" : "/admin/badges";

export default function Badges({ role = "admin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateBadges = canCreate("badges");
  const canEditBadges = canEdit("badges");
  const canDeleteBadges = canDelete("badges");
  const basePath = basePathFor(role);
  const { companies } = useSelector((state) => state.company);
  const { items: themeItems } = useSelector((state) => state.theme);
  const { items: kpiItems } = useSelector((state) => state.kpi);
  const {
    items,
    total,
    listLoading,
    listError,
    deleteLoading,
    deleteError,
    deleteMessage,
  } = useSelector((state) => state.badge);

  const defaultFilters = useMemo(
    () => ({
      companyId: role === "admin" ? getCompanyId() : "",
      themeKey: "",
      search: "",
      status: "all",
      triggerType: "",
      level: "",
      kpiKey: "",
    }),
    [role],
  );
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const isActive =
    appliedFilters.status === "all"
      ? undefined
      : appliedFilters.status === "active";

  const badgeQuery = useMemo(
    () => ({
      isActive,
      triggerType: appliedFilters.triggerType,
      level: appliedFilters.level,
      kpiKey: appliedFilters.kpiKey,
      search: appliedFilters.search,
    }),
    [
      appliedFilters.kpiKey,
      appliedFilters.level,
      appliedFilters.search,
      appliedFilters.triggerType,
      isActive,
    ],
  );

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchThemes({
        isActive: true,
        companyId: filters.companyId || undefined,
      }),
    );
  }, [dispatch, filters.companyId]);

  useEffect(() => {
    dispatch(
      fetchKpis({
        isActive: true,
        companyId: filters.companyId || undefined,
        themeKey: filters.themeKey || undefined,
      }),
    );
  }, [dispatch, filters.companyId, filters.themeKey]);

  useEffect(() => {
    dispatch(fetchBadges(badgeQuery));
  }, [badgeQuery, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearBadgeListError());
      dispatch(clearBadgeDeleteState());
    };
  }, [dispatch]);

  const filteredThemeItems = useMemo(
    () =>
      filters.companyId
        ? themeItems.filter(
            (item) => String(item.company_id) === String(filters.companyId),
          )
        : themeItems,
    [filters.companyId, themeItems],
  );

  const filteredKpiItems = useMemo(
    () =>
      filters.companyId
        ? kpiItems.filter(
            (item) => String(item.company_id) === String(filters.companyId),
          )
        : kpiItems,
    [filters.companyId, kpiItems],
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

  const handleRefresh = () => {
    dispatch(fetchBadges(badgeQuery));
  };

  const handleDelete = useCallback(
    async (badgeId, badgeLabel) => {
      if (!window.confirm(`Delete badge "${badgeLabel}"?`)) return;

      try {
        await dispatch(deleteBadge(badgeId)).unwrap();
        dispatch(fetchBadges(badgeQuery));
      } catch {
        // Error is already handled in redux state.
      }
    },
    [badgeQuery, dispatch],
  );

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const columns = useMemo(
    () => [
      {
        field: "badge_key",
        headerName: "Badge Key",
        flex: 1,
        minWidth: 180,
      },
      {
        field: "label",
        headerName: "Label",
        flex: 1.2,
        minWidth: 200,
      },
      {
        field: "icon",
        headerName: "Icon",
        minWidth: 80,
        renderCell: ({ value }) => (
          <Typography sx={{ fontSize: 22, lineHeight: 1 }}>
            {value || "—"}
          </Typography>
        ),
      },
      {
        field: "level",
        headerName: "Level",
        minWidth: 120,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            label={value ? value.charAt(0).toUpperCase() + value.slice(1) : "-"}
            color={LEVEL_COLORS[value] || "default"}
            variant="filled"
          />
        ),
      },
      {
        field: "trigger_type",
        headerName: "Trigger Type",
        minWidth: 150,
        valueGetter: (_, row) => row.trigger_type || "-",
      },
      {
        field: "trigger_value",
        headerName: "Trigger Value",
        minWidth: 130,
        valueGetter: (_, row) => row.trigger_value ?? "-",
      },
      {
        field: "kpi_key",
        headerName: "KPI",
        flex: 1,
        minWidth: 180,
        valueGetter: (_, row) =>
          row.kpi_key ? kpiNameByKey[row.kpi_key] || row.kpi_key : "—",
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
        field: "created_at",
        headerName: "Created At",
        flex: 1,
        minWidth: 180,
        valueFormatter: (value) => formatDateTimeIST(value),
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
        minWidth: 170,
        renderCell: ({ row }) => {
          const rowId = row.badge_id || row.badge_key;

          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={() => navigate(`${basePath}/${rowId}`)}
                >
                  <PreviewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canEditBadges && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`${basePath}/${rowId}/edit`)}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canDeleteBadges && (
                <Tooltip title="Delete">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deleteLoading || !row.is_active}
                      onClick={() => handleDelete(rowId, row.label)}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
          );
        },
      },
    ],
    [
      basePath,
      canDeleteBadges,
      canEditBadges,
      deleteLoading,
      handleDelete,
      kpiNameByKey,
      navigate,
    ],
  );

  return (
    <Layout role={role} title="Badges">
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
                Badge Master
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.75, maxWidth: 720 }}
              >
                Create, review, update, and deactivate platform badges with
                level, trigger, and KPI configuration.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {canCreateBadges && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => navigate(`${basePath}/add`)}
                >
                  Add Badge
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
                md: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
                xl: "1.1fr 1fr 1fr 1fr 1fr 1fr 0.9fr auto auto",
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
                  kpiKey: "",
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
                  kpiKey: "",
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
              {filteredKpiItems.map((kpi) => (
                <MenuItem key={kpi.kpi_key} value={kpi.kpi_key}>
                  {`${themeNameByKey[kpi.theme_key] || kpi.theme_key || "Unknown Theme"} - ${kpi.display_name}`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Search (key or label)"
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
              label="Trigger Type"
              select
              value={filters.triggerType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  triggerType: event.target.value,
                }))
              }
              fullWidth
              sx={filterFieldSx}
            >
              <MenuItem value="">All Triggers</MenuItem>
              {TRIGGER_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Level"
              select
              value={filters.level}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  level: event.target.value,
                }))
              }
              fullWidth
              sx={filterFieldSx}
            >
              <MenuItem value="">All Levels</MenuItem>
              {LEVEL_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
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
            Showing {items.length} of {total} badges
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
