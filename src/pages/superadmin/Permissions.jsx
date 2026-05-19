import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearPermissionMasterListState,
  fetchPermissionsMaster,
} from "../../store/permissionMasterSlice";
import usePermissions from "../../hooks/usePermissions";
import { getSurfaceBackground } from "../../theme";

const filterFieldSx = {
  "& .MuiInputBase-root": {
    minHeight: 56,
  },
};

function SectionCard({ children, sx }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: getSurfaceBackground(theme),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

export default function Permissions() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;
  const { items, listLoading, listError } = useSelector(
    (state) => state.permissionMaster,
  );
  // "permissions" slug → "platform" resource (per audit's resource map).
  const { canCreate } = usePermissions();
  const canCreatePermissions = canCreate("permissions");

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    dispatch(fetchPermissionsMaster());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearPermissionMasterListState());
    };
  }, [dispatch]);

  const moduleOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.module).filter(Boolean))).sort(),
    [items],
  );
  const actionOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.action).filter(Boolean))).sort(),
    [items],
  );

  const refresh = () => {
    dispatch(fetchPermissionsMaster());
  };

  const resetFilters = () => {
    setSearch("");
    setModuleFilter("");
    setActionFilter("");
  };

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.codename, item.resource, item.module, item.action]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      const matchesModule = !moduleFilter || item.module === moduleFilter;
      const matchesAction = !actionFilter || item.action === actionFilter;
      return matchesSearch && matchesModule && matchesAction;
    });
  }, [actionFilter, items, moduleFilter, search]);

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        minWidth: 90,
        headerAlign: "left",
      },
      {
        field: "name",
        headerName: "Name",
        flex: 1.1,
        minWidth: 200,
        headerAlign: "left",
      },
      {
        field: "codename",
        headerName: "Codename",
        flex: 1,
        minWidth: 200,
        headerAlign: "left",
        renderCell: ({ value }) => (
          <Chip
            size="small"
            label={value || "-"}
            variant="outlined"
            sx={{
              fontWeight: 600,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              borderColor: alpha(theme.palette.primary.main, 0.3),
              color: "primary.main",
            }}
          />
        ),
      },
      {
        field: "module",
        headerName: "Module",
        minWidth: 150,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Chip
              size="small"
              label={value || "-"}
              sx={{
                textTransform: "capitalize",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                fontWeight: 700,
              }}
            />
          </Box>
        ),
      },
      {
        field: "action",
        headerName: "Action",
        minWidth: 130,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }) => (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Chip
              size="small"
              label={value || "-"}
              variant="outlined"
              sx={{ textTransform: "capitalize", fontWeight: 700 }}
            />
          </Box>
        ),
      },
      {
        field: "resource",
        headerName: "Resource",
        flex: 1,
        minWidth: 180,
        headerAlign: "left",
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        minWidth: 140,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={() =>
                    navigate(`/super-admin/permissions/${row.id}`)
                  }
                >
                  <PreviewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        ),
      },
    ],
    [navigate, theme.palette.primary.main],
  );

  return (
    <Layout role="superadmin" title="Permission Master">
      <Stack spacing={2.5}>
        {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
        {listError && <Alert severity="error">{listError}</Alert>}
        <Grid size={{ xs: 12 }}>
          <SectionCard>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Permissions
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Manage the permission catalogue used to compose role-based
                  access policies.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {canCreatePermissions && (
                  <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={() => navigate("/super-admin/permissions/add")}
                  >
                    Add Permission
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={refresh}
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
                  lg: "repeat(3, minmax(0, 1fr)) auto auto",
                },
                alignItems: { lg: "end" },
              }}
            >
              <TextField
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                fullWidth
                sx={filterFieldSx}
              />
              <TextField
                label="Module"
                select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                fullWidth
                sx={filterFieldSx}
              >
                <MenuItem value="">All Modules</MenuItem>
                {moduleOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Action"
                select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                fullWidth
                sx={filterFieldSx}
              >
                <MenuItem value="">All Actions</MenuItem>
                {actionOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                onClick={refresh}
                disabled={listLoading}
                sx={{ minHeight: 56, px: 3, whiteSpace: "nowrap" }}
              >
                Apply Filters
              </Button>
              <Button
                variant="text"
                onClick={resetFilters}
                sx={{ minHeight: 56, px: 2, whiteSpace: "nowrap" }}
              >
                Reset
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filteredRows.length} permission
              {filteredRows.length === 1 ? "" : "s"}
            </Typography>

            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Box sx={{ height: 560, width: "100%" }}>
                <DataGrid
                  rows={filteredRows}
                  columns={columns}
                  loading={listLoading}
                  disableRowSelectionOnClick
                  rowHeight={68}
                  sx={{
                    "& .MuiDataGrid-columnHeaders": {
                      bgcolor: alpha(theme.palette.common.black, 0.02),
                    },
                    "& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell": {
                      px: 2,
                    },
                    "& .MuiDataGrid-cell": {
                      display: "flex",
                      alignItems: "center",
                    },
                  }}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 10, page: 0 },
                    },
                  }}
                />
              </Box>
            </Box>
          </SectionCard>
        </Grid>
      </Stack>
    </Layout>
  );
}
