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
import { fetchCompanies } from "../../store/companySlice";
import {
  clearChallengeDeleteState,
  clearChallengeListError,
  deleteChallenge,
  fetchChallenges,
} from "../../store/challengeSlice";
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

export default function Challenges({ role = "admin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateChallenges = canCreate("challenges");
  const canEditChallenges = canEdit("challenges");
  const canDeleteChallenges = canDelete("challenges");
  const { companies } = useSelector((state) => state.company);
  const { items: kpiItems } = useSelector((state) => state.kpi);
  const { items: themeItems } = useSelector((state) => state.theme);
  const {
    items,
    total,
    listLoading,
    listError,
    deleteLoading,
    deleteError,
    deleteMessage,
  } = useSelector((state) => state.challenge);
  const [filters, setFilters] = useState({
    companyId: role === "admin" ? getCompanyId() : "",
    search: "",
    status: "active",
    themeKey: "",
    kpiKey: "",
    startDate: "",
    endDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    companyId: role === "admin" ? getCompanyId() : "",
    search: "",
    status: "active",
    themeKey: "",
    kpiKey: "",
    startDate: "",
    endDate: "",
  });

  const isActive =
    appliedFilters.status === "all"
      ? undefined
      : appliedFilters.status === "active";

  const challengeQuery = useMemo(
    () => ({
      isActive,
      kpiKey: appliedFilters.kpiKey,
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      companyId: appliedFilters.companyId || undefined,
    }),
    [
      appliedFilters.companyId,
      appliedFilters.endDate,
      appliedFilters.kpiKey,
      appliedFilters.startDate,
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
    dispatch(fetchChallenges(challengeQuery));
  }, [challengeQuery, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearChallengeListError());
      dispatch(clearChallengeDeleteState());
    };
  }, [dispatch]);

  const filteredItems = useMemo(() => {
    const term = appliedFilters.search.trim().toLowerCase();
    if (!term) {
      return items;
    }

    return items.filter((item) =>
      [item.name, item.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [appliedFilters.search, items]);

  const companyNameById = useMemo(
    () =>
      companies.reduce((accumulator, company) => {
        accumulator[company.id] = company.company_name;
        return accumulator;
      }, {}),
    [companies],
  );

  const themeNameByKey = useMemo(
    () =>
      themeItems.reduce((accumulator, item) => {
        accumulator[item.theme_key] = item.theme_display_name;
        return accumulator;
      }, {}),
    [themeItems],
  );

  const handleRefresh = () => {
    dispatch(fetchChallenges(challengeQuery));
  };

  const handleDelete = useCallback(async (challengeKey, challengeName) => {
    if (!window.confirm(`Delete challenge "${challengeName}"?`)) return;

    try {
      await dispatch(deleteChallenge(challengeKey)).unwrap();
      dispatch(fetchChallenges(challengeQuery));
    } catch {
      // Error is already handled in redux state.
    }
  }, [challengeQuery, dispatch]);

  const handleResetFilters = () => {
    const defaultFilters = {
      companyId: role === "admin" ? getCompanyId() : "",
      search: "",
      status: "active",
      themeKey: "",
      kpiKey: "",
      startDate: "",
      endDate: "",
    };

    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    dispatch(
      fetchChallenges({
        isActive: true,
        kpiKey: "",
        startDate: "",
        endDate: "",
        companyId: role === "admin" ? getCompanyId() : undefined,
      }),
    );
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      companyId: filters.companyId,
      search: filters.search,
      status: filters.status,
      themeKey: filters.themeKey,
      kpiKey: filters.kpiKey,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  };

  const columns = useMemo(
    () => [
      {
        field: "company_id",
        headerName: "Company",
        flex: 1,
        minWidth: 220,
        valueGetter: (_, row) => companyNameById[row.company_id] || row.company_id || "-",
      },
      {
        field: "name",
        headerName: "Challenge Name",
        flex: 1.2,
        minWidth: 220,
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.6,
        minWidth: 260,
        valueGetter: (_, row) => row.description || "-",
      },
      {
        field: "challenge_type",
        headerName: "Type",
        minWidth: 150,
        valueGetter: (_, row) => row.challenge_type || "-",
      },
      {
        field: "target_value",
        headerName: "Target",
        minWidth: 110,
        valueGetter: (_, row) => row.target_value ?? "-",
      },
      {
        field: "xp_reward",
        headerName: "XP Reward",
        minWidth: 110,
        valueGetter: (_, row) => row.xp_reward ?? "-",
      },
      {
        field: "is_daily",
        headerName: "Daily",
        minWidth: 100,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            label={value ? "Yes" : "No"}
            color={value ? "primary" : "default"}
            variant={value ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "start_date",
        headerName: "Start Date",
        minWidth: 130,
        valueGetter: (_, row) => row.start_date || "-",
      },
      {
        field: "end_date",
        headerName: "End Date",
        minWidth: 130,
        valueGetter: (_, row) => row.end_date || "-",
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
                    ? `/admin/challenges/${row.challenge_key}`
                    : `/super-admin/challenges/${row.challenge_key}`,
                )
                }
              >
                <PreviewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEditChallenges && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() =>
                    navigate(`/super-admin/challenges/${row.challenge_key}/edit`)
                  }
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteChallenges && (
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deleteLoading}
                    onClick={() => handleDelete(row.challenge_key, row.name)}
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
      canDeleteChallenges,
      canEditChallenges,
      companyNameById,
      deleteLoading,
      handleDelete,
      navigate,
      role,
    ],
  );

  return (
    <Layout role={role} title="Challenges">
      <Stack spacing={2}>
        {feedback && (
          <Alert severity={feedback.severity}>{feedback.message}</Alert>
        )}
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
                Challenge Master
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.75, maxWidth: 720 }}
              >
                Create, review, update, and deactivate challenges with KPI
                mappings.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {canCreateChallenges && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? "/admin/challenges/add"
                        : "/super-admin/challenges/add",
                    )
                  }
                >
                  Add Challenge
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
                md: "repeat(2, minmax(0, 1fr))",
                lg: role === "superadmin"
                  ? "repeat(4, minmax(0, 1fr))"
                  : "repeat(4, minmax(0, 1fr))",
                xl: role === "superadmin"
                  ? "1.15fr 1fr 1fr 1fr 1fr 1.4fr 0.9fr auto auto"
                  : "1fr 1fr 1fr 1fr 1.4fr 0.9fr auto auto",
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
                    themeKey: "",
                    kpiKey: "",
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
              <MenuItem value="">All KPI</MenuItem>
              {kpiItems.map((kpi) => (
                <MenuItem key={kpi.kpi_key} value={kpi.kpi_key}>
                  {`${themeNameByKey[kpi.theme_key] || kpi.theme_key || "Unknown Theme"} - ${kpi.display_name}`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={filterFieldSx}
            />
            <TextField
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={filterFieldSx}
            />
            <TextField
              label="Search Challenge"
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
            Showing {filteredItems.length} of {total} challenges
          </Typography>

          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ height: 560, width: "100%" }}>
              <DataGrid
                rows={filteredItems}
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
