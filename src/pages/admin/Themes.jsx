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
import {
  clearThemeDeleteState,
  clearThemeListError,
  deleteTheme,
  fetchThemes,
} from "../../store/themeSlice";
import { fetchCompanies } from "../../store/companySlice";
import usePermissions from "../../hooks/usePermissions";
import { getSurfaceBackground } from "../../theme";
import { formatDateTimeIST } from "../../utils/dateTime";

const filterFieldSx = {
  "& .MuiInputBase-root": {
    minHeight: 56,
  },
};

export default function Themes({ role = "admin" }) {
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
  } = useSelector((state) => state.theme);
  const { companies } = useSelector((state) => state.company);
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateThemes = canCreate("themes");
  const canEditThemes = canEdit("themes");
  const canDeleteThemes = canDelete("themes");
  const [filters, setFilters] = useState({
    companyId: "",
    search: "",
    status: "all",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    companyId: "",
    search: "",
    status: "all",
  });

  const isActive =
    appliedFilters.status === "all"
      ? undefined
      : appliedFilters.status === "active";

  const companyIdParam =
    role === "superadmin" ? appliedFilters.companyId || undefined : undefined;

  useEffect(() => {
    if (role === "superadmin") {
      dispatch(fetchCompanies());
    }
  }, [dispatch, role]);

  useEffect(() => {
    dispatch(
      fetchThemes({
        search: appliedFilters.search.trim(),
        isActive: role === "admin" ? true : isActive,
        companyId: companyIdParam,
      }),
    );
  }, [appliedFilters.search, companyIdParam, dispatch, isActive, role]);

  const companyNameById = useMemo(
    () =>
      companies.reduce((accumulator, company) => {
        accumulator[company.id] = company.company_name;
        return accumulator;
      }, {}),
    [companies],
  );

  useEffect(() => {
    return () => {
      dispatch(clearThemeListError());
      dispatch(clearThemeDeleteState());
    };
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(
      fetchThemes({
        search: appliedFilters.search.trim(),
        isActive: role === "admin" ? true : isActive,
        companyId: companyIdParam,
      }),
    );
  };

  const handleDelete = useCallback(async (themeKey) => {
    try {
      await dispatch(deleteTheme(themeKey)).unwrap();
      dispatch(
        fetchThemes({
          search: appliedFilters.search.trim(),
          isActive: role === "admin" ? true : isActive,
          companyId: companyIdParam,
        }),
      );
    } catch {
      // Error is already handled in redux state.
    }
  }, [appliedFilters.search, companyIdParam, dispatch, isActive, role]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      companyId: filters.companyId,
      search: filters.search,
      status: filters.status,
    });
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      companyId: "",
      search: "",
      status: "all",
    };

    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    dispatch(
      fetchThemes({
        search: "",
        isActive: role === "admin" ? true : undefined,
        companyId: undefined,
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
              flex: 1.1,
              minWidth: 200,
              valueGetter: (_, row) =>
                companyNameById[row.company_id] || row.company_id || "-",
            },
          ]
        : []),
      {
        field: "theme_display_name",
        headerName: "Theme Name",
        flex: 1.3,
        minWidth: 240,
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.6,
        minWidth: 260,
      },
      {
        field: "duration_days",
        headerName: "Duration (Days)",
        minWidth: 150,
      },
      {
        field: "target_audience",
        headerName: "Target Audience",
        flex: 1.1,
        minWidth: 200,
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
        field: "created_at",
        headerName: "Created At",
        flex: 1,
        minWidth: 190,
        valueFormatter: (value) => formatDateTimeIST(value),
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
                onClick={() =>
                  navigate(
                    role === "admin"
                      ? `/admin/themes/${row.theme_key}`
                      : `/super-admin/themes/${row.theme_key}`,
                  )
                }
              >
                <PreviewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEditThemes && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? `/admin/themes/${row.theme_key}/edit`
                        : `/super-admin/themes/${row.theme_key}/edit`,
                    )
                  }
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteThemes && (
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deleteLoading}
                    onClick={() => handleDelete(row.theme_key)}
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
      canDeleteThemes,
      canEditThemes,
      companyNameById,
      deleteLoading,
      handleDelete,
      navigate,
      role,
    ],
  );

  return (
    <Layout role={role} title="Theme Master">
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
                Theme Master
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
                Create, review, update, and deactivate themes using the API-backed admin flow.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {canCreateThemes && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? "/admin/themes/add"
                        : "/super-admin/themes/add",
                    )
                  }
                >
                  Add Theme
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
                lg:
                  role === "superadmin"
                    ? "repeat(3, minmax(0, 1fr)) auto auto"
                    : "repeat(2, minmax(0, 1fr))",
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
              label="Search Theme"
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
            {role === "superadmin" ? (
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
            ) : null}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total themes: {total}
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
