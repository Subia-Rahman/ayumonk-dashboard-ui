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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearMenuMasterListState,
  fetchMenus,
} from "../../store/menuMasterSlice";
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

export default function Menus() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;
  const { items, listLoading, listError } = useSelector(
    (state) => state.menuMaster,
  );
  // "menus" slug → "platform" resource (per audit's resource map).
  const { canCreate, canEdit } = usePermissions();
  const canCreateMenus = canCreate("menus");
  const canEditMenus = canEdit("menus");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [parentFilter, setParentFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchMenus());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearMenuMasterListState());
    };
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchMenus());
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setParentFilter("all");
  };

  const nameById = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [items]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.slug, item.path]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? item.is_active : !item.is_active);
      const matchesParent =
        parentFilter === "all" ||
        (parentFilter === "root" ? !item.parent_id : Boolean(item.parent_id));
      return matchesSearch && matchesStatus && matchesParent;
    });
  }, [items, parentFilter, search, statusFilter]);

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        minWidth: 80,
        headerAlign: "left",
      },
      {
        field: "name",
        headerName: "Name",
        flex: 1.1,
        minWidth: 180,
        headerAlign: "left",
      },
      {
        field: "slug",
        headerName: "Slug",
        flex: 1,
        minWidth: 160,
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
        field: "path",
        headerName: "Path",
        flex: 1.1,
        minWidth: 200,
        headerAlign: "left",
      },
      {
        field: "parent_id",
        headerName: "Parent",
        flex: 1,
        minWidth: 160,
        headerAlign: "left",
        renderCell: ({ value }) =>
          value ? nameById.get(String(value)) || `#${value}` : "—",
      },
      {
        field: "icon",
        headerName: "Icon",
        minWidth: 130,
        headerAlign: "left",
      },
      {
        field: "order_no",
        headerName: "Order",
        minWidth: 90,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "is_active",
        headerName: "Status",
        minWidth: 120,
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
              label={value ? "Active" : "Inactive"}
              color={value ? "success" : "default"}
              variant={value ? "filled" : "outlined"}
            />
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        minWidth: 130,
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
                  onClick={() => navigate(`/super-admin/menus/${row.id}`)}
                >
                  <PreviewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canEditMenus && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() =>
                      navigate(`/super-admin/menus/${row.id}/edit`)
                    }
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        ),
      },
    ],
    [canEditMenus, nameById, navigate, theme.palette.primary.main],
  );

  return (
    <Layout role="superadmin" title="Menu Master">
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
                  Menus
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Manage menu definitions used by role-based navigation.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {canCreateMenus && (
                  <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={() => navigate("/super-admin/menus/add")}
                  >
                    Add Menu
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
                label="Hierarchy"
                select
                value={parentFilter}
                onChange={(event) => setParentFilter(event.target.value)}
                fullWidth
                sx={filterFieldSx}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="root">Root only</MenuItem>
                <MenuItem value="children">Child only</MenuItem>
              </TextField>
              <TextField
                label="Status"
                select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                fullWidth
                sx={filterFieldSx}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
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
              Showing {filteredRows.length} menu
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
                    sorting: {
                      sortModel: [{ field: "order_no", sort: "asc" }],
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
