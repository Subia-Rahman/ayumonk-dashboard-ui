import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
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
  Divider,
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
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearRoleDeleteState,
  clearRoleListState,
  deleteRole,
  fetchRolesByTenant,
  setSelectedTenantId,
} from "../../store/roleSlice";
import {
  clearRoleMenusList,
  clearRolePermissionsList,
  fetchRoleMenus,
  fetchRolePermissions,
} from "../../store/roleAssignmentSlice";
import { fetchCompanies } from "../../store/companySlice";
import { fetchPermissionsMaster } from "../../store/permissionMasterSlice";
import { fetchMenus } from "../../store/menuMasterSlice";
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

function EmptyOrLoading({ loading, error, emptyMessage }) {
  if (loading) {
    return (
      <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Stack>
    );
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 1 }}>
        {error}
      </Alert>
    );
  }
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
      {emptyMessage}
    </Typography>
  );
}

function RolePermissionsList({ loading, error, items }) {
  if (loading || error || items.length === 0) {
    return (
      <EmptyOrLoading
        loading={loading}
        error={error}
        emptyMessage="No permissions assigned to this role."
      />
    );
  }
  return (
    <Stack divider={<Divider flexItem />} spacing={0}>
      {items.map((permission) => {
        const showCodename =
          permission.codename && permission.codename !== permission.name;
        const detailLine = [
          permission.module,
          permission.action,
          permission.resource,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <Stack
            key={permission.id}
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ py: 1.25 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }}>
                {permission.name || permission.codename || `#${permission.id}`}
              </Typography>
              {(showCodename || detailLine) && (
                <Typography variant="caption" color="text.secondary">
                  {showCodename ? permission.codename : ""}
                  {showCodename && detailLine ? " · " : ""}
                  {detailLine}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap>
              {permission.is_override && (
                <Chip
                  size="small"
                  label="Override"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
              <Chip
                size="small"
                label={permission.is_granted ? "Granted" : "Denied"}
                color={permission.is_granted ? "success" : "error"}
                variant={permission.is_granted ? "filled" : "outlined"}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}

function RoleMenusList({ loading, error, items }) {
  if (loading || error || items.length === 0) {
    return (
      <EmptyOrLoading
        loading={loading}
        error={error}
        emptyMessage="No menus assigned to this role."
      />
    );
  }
  return (
    <Stack divider={<Divider flexItem />} spacing={0}>
      {items.map((menu) => {
        const subtitleParts = [menu.slug, menu.path].filter(
          (value, index, all) => value && all.indexOf(value) === index,
        );
        return (
          <Stack
            key={menu.id}
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ py: 1.25 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }}>
                {menu.name || menu.slug || `#${menu.id}`}
              </Typography>
              {subtitleParts.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {subtitleParts.join(" · ")}
                </Typography>
              )}
            </Box>
            {menu.access_level && (
              <Chip
                size="small"
                label={menu.access_level}
                color={menu.access_level === "full" ? "success" : "default"}
                variant={menu.access_level === "full" ? "filled" : "outlined"}
                sx={{ textTransform: "capitalize", fontWeight: 600 }}
              />
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

export default function Roles() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;
  const {
    items,
    listLoading,
    listError,
    selectedTenantId,
    deleteLoading,
    deleteError,
    deleteMessage,
  } = useSelector((state) => state.role);
  const { companies } = useSelector((state) => state.company);
  const {
    rolePermissions,
    rolePermissionsLoading,
    rolePermissionsError,
    rolePermissionsRoleId,
    roleMenus,
    roleMenusLoading,
    roleMenusError,
    roleMenusRoleId,
  } = useSelector((state) => state.roleAssignment);
  const { items: permissionsMaster } = useSelector(
    (state) => state.permissionMaster,
  );
  const { items: menusMaster } = useSelector((state) => state.menuMaster);
  // "roles" slug → "platform" resource (per audit's resource map).
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateRoles = canCreate("roles");
  const canEditRoles = canEdit("roles");
  const canDeleteRoles = canDelete("roles");

  const [tenantId, setTenantId] = useState(selectedTenantId || "");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilterInput, setStatusFilterInput] = useState("all");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all");
  const [appliedTenantId, setAppliedTenantId] = useState("");
  const [detailDialog, setDetailDialog] = useState(null);

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    if (appliedTenantId) {
      dispatch(fetchRolesByTenant(appliedTenantId));
    }
  }, [dispatch, appliedTenantId]);

  useEffect(() => {
    return () => {
      dispatch(clearRoleListState());
      dispatch(clearRoleDeleteState());
      dispatch(clearRolePermissionsList());
      dispatch(clearRoleMenusList());
    };
  }, [dispatch]);

  const handleTenantChange = (value) => {
    setTenantId(value);
    dispatch(setSelectedTenantId(value));
  };

  const isProtectedRole = useCallback((roleName) => {
    const normalized = String(roleName || "")
      .trim()
      .toLowerCase()
      .replace(/[_\s-]+/g, "");
    return normalized === "companyadmin" || normalized === "employee";
  }, []);

  const handleDelete = useCallback(
    async (roleId, roleName) => {
      if (!window.confirm(`Delete role "${roleName}"?`)) return;
      try {
        await dispatch(deleteRole({ roleId, tenantId })).unwrap();
      } catch {
        // Redux state stores the error.
      }
    },
    [dispatch, tenantId],
  );

  const openPermissions = useCallback(
    (row) => {
      setDetailDialog({ type: "permissions", role: row });
      dispatch(fetchRolePermissions({ roleId: row.id, tenantId }));
      dispatch(fetchPermissionsMaster());
    },
    [dispatch, tenantId],
  );

  const openMenus = useCallback(
    (row) => {
      setDetailDialog({ type: "menus", role: row });
      dispatch(fetchRoleMenus({ roleId: row.id, tenantId }));
      dispatch(fetchMenus());
    },
    [dispatch, tenantId],
  );

  const closeDialog = () => {
    setDetailDialog(null);
    dispatch(clearRolePermissionsList());
    dispatch(clearRoleMenusList());
  };

  const refresh = () => {
    if (tenantId) {
      dispatch(fetchRolesByTenant(tenantId));
    }
  };

  const handleApplyFilters = () => {
    setAppliedTenantId(tenantId);
    setAppliedSearch(searchInput);
    setAppliedStatusFilter(statusFilterInput);
  };

  const resetFilters = () => {
    setTenantId("");
    setSearchInput("");
    setStatusFilterInput("all");
    setAppliedTenantId("");
    setAppliedSearch("");
    setAppliedStatusFilter("all");
    dispatch(clearRoleListState());
  };

  const filteredRows = useMemo(() => {
    const term = appliedSearch.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !term || item.name.toLowerCase().includes(term);
      const matchesStatus =
        appliedStatusFilter === "all" ||
        (appliedStatusFilter === "active" ? item.is_active : !item.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [items, appliedSearch, appliedStatusFilter]);

  const companyNameById = useMemo(() => {
    const map = new Map();
    companies.forEach((company) => {
      map.set(String(company.id), company.company_name);
    });
    return map;
  }, [companies]);

  const permissionMasterById = useMemo(() => {
    const map = new Map();
    permissionsMaster.forEach((permission) => {
      map.set(String(permission.id), permission);
    });
    return map;
  }, [permissionsMaster]);

  const menuMasterById = useMemo(() => {
    const map = new Map();
    menusMaster.forEach((menu) => {
      map.set(String(menu.id), menu);
    });
    return map;
  }, [menusMaster]);

  const enrichedRolePermissions = useMemo(() => {
    if (!detailDialog || detailDialog.type !== "permissions") return [];
    if (rolePermissionsRoleId !== String(detailDialog.role.id)) return [];
    return rolePermissions.map((item) => {
      const master = permissionMasterById.get(String(item.id));
      if (!master) return item;
      return {
        ...item,
        name: item.name || master.name || "",
        module: item.module || master.module || "",
        action: item.action || master.action || "",
        codename: item.codename || master.codename || "",
        resource: item.resource || master.resource || "",
      };
    });
  }, [detailDialog, permissionMasterById, rolePermissions, rolePermissionsRoleId]);

  const enrichedRoleMenus = useMemo(() => {
    if (!detailDialog || detailDialog.type !== "menus") return [];
    if (roleMenusRoleId !== String(detailDialog.role.id)) return [];
    return roleMenus.map((item) => {
      const master = menuMasterById.get(String(item.id));
      if (!master) return item;
      return {
        ...item,
        name: item.name || master.name || "",
        slug: item.slug || master.slug || "",
        path: item.path || master.path || "",
        icon: item.icon || master.icon || "",
      };
    });
  }, [detailDialog, menuMasterById, roleMenus, roleMenusRoleId]);

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        minWidth: 100,
        headerAlign: "left",
      },
      {
        field: "name",
        headerName: "Role Name",
        flex: 1.2,
        minWidth: 220,
        headerAlign: "left",
      },
      {
        field: "tenant_id",
        headerName: "Company",
        flex: 1.2,
        minWidth: 240,
        headerAlign: "left",
        renderCell: ({ value, row }) => {
          if (!value) return "—";
          const name =
            companyNameById.get(String(value)) || row?.tenant_name || "";
          return (
            <Tooltip title={value} placement="top" arrow>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {name || value}
              </Typography>
            </Tooltip>
          );
        },
      },
      {
        field: "is_active",
        headerName: "Status",
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
        minWidth: 250,
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
                  onClick={() => navigate(`/super-admin/roles/${row.id}`)}
                >
                  <PreviewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Permissions">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={!tenantId}
                    onClick={() => openPermissions(row)}
                  >
                    <VpnKeyOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Menus">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={!tenantId}
                    onClick={() => openMenus(row)}
                  >
                    <MenuBookOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              {canEditRoles && !isProtectedRole(row.name) && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() =>
                      navigate(`/super-admin/roles/${row.id}/edit`)
                    }
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canDeleteRoles && !isProtectedRole(row.name) && (
                <Tooltip title="Delete">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deleteLoading}
                      onClick={() => handleDelete(row.id, row.name)}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
          </Box>
        ),
      },
    ],
    [
      canDeleteRoles,
      canEditRoles,
      companyNameById,
      deleteLoading,
      handleDelete,
      isProtectedRole,
      navigate,
      openMenus,
      openPermissions,
      tenantId,
    ],
  );

  return (
    <Layout role="superadmin" title="Role Master">
      <Stack spacing={2.5}>
        {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
        {listError && <Alert severity="error">{listError}</Alert>}
        {deleteError && <Alert severity="error">{deleteError}</Alert>}
        {deleteMessage && <Alert severity="success">{deleteMessage}</Alert>}
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
                  Roles
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Manage tenant-level roles. Select a tenant to view and create
                  roles for that tenant.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {canCreateRoles && (
                  <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={() => navigate("/super-admin/roles/add")}
                  >
                    Add Role
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={refresh}
                  disabled={listLoading || !tenantId}
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
                value={tenantId}
                onChange={(event) => handleTenantChange(event.target.value)}
                fullWidth
                sx={filterFieldSx}
              >
                <MenuItem value="">Select tenant</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.company_name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                fullWidth
                sx={filterFieldSx}
              />
              <TextField
                label="Status"
                select
                value={statusFilterInput}
                onChange={(event) => setStatusFilterInput(event.target.value)}
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
                disabled={listLoading || !tenantId}
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
              {appliedTenantId
                ? `Showing ${filteredRows.length} role${filteredRows.length === 1 ? "" : "s"}`
                : "Select a tenant and click 'Apply Filters' to load roles."}
            </Typography>

            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Box sx={{ height: 520, width: "100%" }}>
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

      <Dialog
        open={Boolean(detailDialog)}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
      >
        {detailDialog && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>
              {detailDialog.type === "permissions"
                ? "Role Permissions"
                : "Role Menus"}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {detailDialog.role.name}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {detailDialog.type === "permissions" ? (
                <RolePermissionsList
                  loading={
                    rolePermissionsLoading ||
                    rolePermissionsRoleId !== String(detailDialog.role.id)
                  }
                  error={rolePermissionsError}
                  items={enrichedRolePermissions}
                />
              ) : (
                <RoleMenusList
                  loading={
                    roleMenusLoading ||
                    roleMenusRoleId !== String(detailDialog.role.id)
                  }
                  error={roleMenusError}
                  items={enrichedRoleMenus}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Layout>
  );
}
