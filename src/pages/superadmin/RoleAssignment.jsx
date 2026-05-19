import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Layout from "../../layouts/commonLayout/Layout";
import { fetchCompanies } from "../../store/companySlice";
import { fetchRolesByTenant } from "../../store/roleSlice";
import { fetchPermissionsMaster } from "../../store/permissionMasterSlice";
import { fetchPolicies } from "../../store/policySlice";
import { fetchMenus } from "../../store/menuMasterSlice";
import {
  addRoleMenus,
  addRolePermissions,
  addRolePolicies,
  clearRoleAssignmentFeedback,
  clearRoleMenusList,
  clearRolePermissionsList,
  fetchRoleMenus,
  fetchRolePermissions,
  removeRoleMenus,
  removeRolePermissions,
  removeRolePolicies,
} from "../../store/roleAssignmentSlice";
import { getSurfaceBackground } from "../../theme";

const accessLevelOptions = ["view", "full"];

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

function PermissionsPanel({ disabled, tenantId, roleId }) {
  const dispatch = useDispatch();
  const { items: permissions, listLoading } = useSelector(
    (state) => state.permissionMaster,
  );
  const {
    loading,
    rolePermissions,
    rolePermissionsLoading,
    rolePermissionsError,
    rolePermissionsRoleId,
  } = useSelector((state) => state.roleAssignment);
  const [selected, setSelected] = useState([]);
  const [isOverride, setIsOverride] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState(null);

  useEffect(() => {
    dispatch(fetchPermissionsMaster());
  }, [dispatch]);

  useEffect(() => {
    if (tenantId && roleId) {
      dispatch(fetchRolePermissions({ roleId, tenantId }));
    } else {
      dispatch(clearRolePermissionsList());
    }
  }, [dispatch, roleId, tenantId]);

  const refreshAssigned = () => {
    if (tenantId && roleId) {
      dispatch(fetchRolePermissions({ roleId, tenantId }));
    }
  };

  const buildPayload = (ids = selected.map((item) => Number(item.id))) => ({
    permission_ids: ids,
    tenant_id: tenantId,
    is_override: isOverride,
  });

  const canSubmit = !disabled && selected.length > 0;

  const handleAdd = async () => {
    if (!canSubmit) return;
    try {
      await dispatch(
        addRolePermissions({ roleId, payload: buildPayload() }),
      ).unwrap();
      setSelected([]);
      refreshAssigned();
    } catch {
      // error tracked in slice
    }
  };

  const handleBulkRemove = async () => {
    if (!canSubmit) return;
    try {
      await dispatch(
        removeRolePermissions({ roleId, payload: buildPayload() }),
      ).unwrap();
      setSelected([]);
      refreshAssigned();
    } catch {
      // error tracked in slice
    }
  };

  const handleRemoveOne = async (assignment) => {
    if (disabled || !assignment) return;
    if (
      !window.confirm(
        `Remove permission "${assignment.name || assignment.codename || `#${assignment.id}`}" from this role?`,
      )
    ) {
      return;
    }
    try {
      setPendingRemoveId(assignment.id);
      await dispatch(
        removeRolePermissions({
          roleId,
          payload: {
            permission_ids: [Number(assignment.id)],
            tenant_id: tenantId,
            is_override: assignment.is_override ?? false,
          },
        }),
      ).unwrap();
      refreshAssigned();
    } catch {
      // error tracked in slice
    } finally {
      setPendingRemoveId(null);
    }
  };

  const permissionMasterById = useMemo(() => {
    const map = new Map();
    permissions.forEach((permission) => {
      map.set(String(permission.id), permission);
    });
    return map;
  }, [permissions]);

  const enrichedAssigned = useMemo(() => {
    if (rolePermissionsRoleId !== String(roleId)) return [];
    return rolePermissions.map((item) => {
      const master = permissionMasterById.get(String(item.id));
      if (!master) return item;
      return {
        ...item,
        name: item.name || master.name || "",
        codename: item.codename || master.codename || "",
        module: item.module || master.module || "",
        action: item.action || master.action || "",
        resource: item.resource || master.resource || "",
      };
    });
  }, [permissionMasterById, roleId, rolePermissions, rolePermissionsRoleId]);

  const isAssignedListLoading =
    rolePermissionsLoading || rolePermissionsRoleId !== String(roleId);

  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
        <Autocomplete
          multiple
          loading={listLoading}
          options={permissions}
          value={selected}
          onChange={(_, value) => setSelected(value)}
          disabled={disabled}
          getOptionLabel={(option) =>
            option.codename
              ? `${option.name} (${option.codename})`
              : option.name || `#${option.id}`
          }
          isOptionEqualToValue={(option, value) => option.id === value.id}
          filterSelectedOptions
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                size="small"
                variant="outlined"
                label={option.codename || option.name}
                {...getTagProps({ index })}
                key={option.id}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Permissions"
              placeholder="Search permissions"
            />
          )}
        />

        <FormControlLabel
          control={
            <Switch
              checked={isOverride}
              onChange={(event) => setIsOverride(event.target.checked)}
              disabled={disabled}
            />
          }
          label="Override existing permissions"
        />

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleAdd}
            disabled={!canSubmit || loading.permissionsAdd}
          >
            {loading.permissionsAdd ? "Adding..." : "Add to role"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RemoveRoundedIcon />}
            onClick={handleBulkRemove}
            disabled={!canSubmit || loading.permissionsRemove}
          >
            {loading.permissionsRemove ? "Removing..." : "Remove from role"}
          </Button>
        </Stack>
      </Stack>

      <Divider />

      <Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700 }}>
              Currently assigned
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Permissions already attached to this role.
            </Typography>
          </Box>
          {!disabled && (
            <Button
              size="small"
              variant="text"
              onClick={refreshAssigned}
              disabled={isAssignedListLoading}
            >
              Refresh
            </Button>
          )}
        </Stack>

        {disabled ? (
          <Typography variant="body2" color="text.secondary">
            Pick a tenant and role to view current assignments.
          </Typography>
        ) : rolePermissionsError ? (
          <Alert severity="error">{rolePermissionsError}</Alert>
        ) : isAssignedListLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading assigned permissions...
          </Typography>
        ) : enrichedAssigned.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No permissions assigned to this role yet.
          </Typography>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
            <Stack divider={<Divider />}>
              {enrichedAssigned.map((assignment) => {
                const showCodename =
                  assignment.codename &&
                  assignment.codename !== assignment.name;
                const detailLine = [
                  assignment.module,
                  assignment.action,
                  assignment.resource,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const removing =
                  pendingRemoveId === assignment.id || loading.permissionsRemove;
                return (
                  <Stack
                    key={assignment.id}
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ p: 1.5 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {assignment.name ||
                          assignment.codename ||
                          `#${assignment.id}`}
                      </Typography>
                      {(showCodename || detailLine) && (
                        <Typography variant="caption" color="text.secondary">
                          {showCodename ? assignment.codename : ""}
                          {showCodename && detailLine ? " · " : ""}
                          {detailLine}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      {assignment.is_override && (
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
                        label={
                          assignment.is_granted === false
                            ? "Denied"
                            : "Granted"
                        }
                        color={
                          assignment.is_granted === false ? "error" : "success"
                        }
                        variant={
                          assignment.is_granted === false ? "outlined" : "filled"
                        }
                        sx={{ fontWeight: 600 }}
                      />
                      <Tooltip title="Remove from role">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={removing}
                            onClick={() => handleRemoveOne(assignment)}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}

function PoliciesPanel({ disabled, tenantId, roleId }) {
  const dispatch = useDispatch();
  const { items: policies, listLoading } = useSelector(
    (state) => state.policy,
  );
  const { loading } = useSelector((state) => state.roleAssignment);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (tenantId) {
      dispatch(fetchPolicies({ tenantId }));
    }
  }, [dispatch, tenantId]);

  const buildPayload = () => ({
    policy_ids: selected.map((item) => Number(item.id)),
    tenant_id: tenantId,
  });

  const canSubmit = !disabled && selected.length > 0;

  const handleAdd = async () => {
    if (!canSubmit) return;
    try {
      await dispatch(
        addRolePolicies({ roleId, payload: buildPayload() }),
      ).unwrap();
      setSelected([]);
    } catch {
      // error tracked in slice
    }
  };

  const handleRemove = async () => {
    if (!canSubmit) return;
    try {
      await dispatch(
        removeRolePolicies({ roleId, payload: buildPayload() }),
      ).unwrap();
      setSelected([]);
    } catch {
      // error tracked in slice
    }
  };

  return (
    <Stack spacing={2}>
      <Autocomplete
        multiple
        loading={listLoading}
        options={policies}
        value={selected}
        onChange={(_, value) => setSelected(value)}
        disabled={disabled}
        getOptionLabel={(option) =>
          option.module
            ? `${option.name} — ${option.module}/${option.effect || ""}`.trim()
            : option.name || `#${option.id}`
        }
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterSelectedOptions
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              size="small"
              variant="outlined"
              label={option.name || `#${option.id}`}
              {...getTagProps({ index })}
              key={option.id}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Policies"
            placeholder="Search policies"
          />
        )}
      />

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={handleAdd}
          disabled={!canSubmit || loading.policiesAdd}
        >
          {loading.policiesAdd ? "Adding..." : "Add to role"}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<RemoveRoundedIcon />}
          onClick={handleRemove}
          disabled={!canSubmit || loading.policiesRemove}
        >
          {loading.policiesRemove ? "Removing..." : "Remove from role"}
        </Button>
      </Stack>
    </Stack>
  );
}

function MenusPanel({ disabled, tenantId, roleId }) {
  const dispatch = useDispatch();
  const { items: rawMenus, listLoading: menusLoading } = useSelector(
    (state) => state.menuMaster,
  );
  const {
    loading,
    roleMenus,
    roleMenusLoading,
    roleMenusError,
    roleMenusRoleId,
  } = useSelector((state) => state.roleAssignment);

  const [defaultAccess, setDefaultAccess] = useState("view");
  const [selected, setSelected] = useState([]);
  const [pendingRemoveId, setPendingRemoveId] = useState(null);

  const menuOptions = useMemo(
    () =>
      (rawMenus || []).map((menu) => ({
        id: Number(menu.id),
        raw_id: menu.id,
        name: menu.name || menu.slug || `Menu #${menu.id}`,
        slug: menu.slug || "",
        path: menu.path || "",
      })),
    [rawMenus],
  );

  useEffect(() => {
    dispatch(fetchMenus());
  }, [dispatch]);

  useEffect(() => {
    if (tenantId && roleId) {
      dispatch(fetchRoleMenus({ roleId, tenantId }));
    } else {
      dispatch(clearRoleMenusList());
    }
  }, [dispatch, roleId, tenantId]);

  const refreshAssigned = () => {
    if (tenantId && roleId) {
      dispatch(fetchRoleMenus({ roleId, tenantId }));
    }
  };

  const handlePickMenu = (option) => {
    if (!option) return;
    if (selected.some((item) => item.id === option.id)) return;
    setSelected((current) => [
      ...current,
      { ...option, access_level: defaultAccess },
    ]);
  };

  const handleAccessChange = (id, value) => {
    setSelected((current) =>
      current.map((item) =>
        item.id === id ? { ...item, access_level: value } : item,
      ),
    );
  };

  const handleRemoveSelected = (id) => {
    setSelected((current) => current.filter((item) => item.id !== id));
  };

  const buildPayload = () => ({
    menu_ids: selected.map((item) => item.id),
    items: selected.map((item) => ({
      menu_id: item.id,
      access_level: item.access_level,
    })),
    access_level: defaultAccess,
    tenant_id: tenantId,
  });

  const canSubmit = !disabled && selected.length > 0;

  const handleAdd = async () => {
    if (!canSubmit) return;
    try {
      await dispatch(addRoleMenus({ roleId, payload: buildPayload() })).unwrap();
      setSelected([]);
      refreshAssigned();
    } catch {
      // error tracked in slice
    }
  };

  const handleBulkRemove = async () => {
    if (!canSubmit) return;
    try {
      await dispatch(
        removeRoleMenus({ roleId, payload: buildPayload() }),
      ).unwrap();
      setSelected([]);
      refreshAssigned();
    } catch {
      // error tracked in slice
    }
  };

  const handleRemoveOne = async (assignment) => {
    if (disabled || !assignment) return;
    if (
      !window.confirm(
        `Remove menu "${assignment.name || assignment.slug || `#${assignment.id}`}" from this role?`,
      )
    ) {
      return;
    }
    const numericId = Number(assignment.id);
    const accessLevel = assignment.access_level || defaultAccess || "view";
    try {
      setPendingRemoveId(assignment.id);
      await dispatch(
        removeRoleMenus({
          roleId,
          payload: {
            menu_ids: [numericId],
            items: [{ menu_id: numericId, access_level: accessLevel }],
            access_level: accessLevel,
            tenant_id: tenantId,
          },
        }),
      ).unwrap();
      refreshAssigned();
    } catch {
      // error tracked in slice
    } finally {
      setPendingRemoveId(null);
    }
  };

  const menuMasterById = useMemo(() => {
    const map = new Map();
    menuOptions.forEach((menu) => {
      map.set(String(menu.id), menu);
    });
    return map;
  }, [menuOptions]);

  const enrichedAssigned = useMemo(() => {
    if (roleMenusRoleId !== String(roleId)) return [];
    return roleMenus.map((item) => {
      const master = menuMasterById.get(String(item.id));
      if (!master) return item;
      return {
        ...item,
        name: item.name || master.name || "",
        slug: item.slug || master.slug || "",
        path: item.path || master.path || "",
      };
    });
  }, [menuMasterById, roleId, roleMenus, roleMenusRoleId]);

  const isAssignedListLoading =
    roleMenusLoading || roleMenusRoleId !== String(roleId);

  const availableMenus = useMemo(
    () =>
      menuOptions.filter(
        (option) => !selected.some((item) => item.id === option.id),
      ),
    [menuOptions, selected],
  );

  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
            gap: 2,
          }}
        >
          <Autocomplete
            options={availableMenus}
            loading={menusLoading}
            value={null}
            onChange={(_, value) => handlePickMenu(value)}
            disabled={disabled}
            getOptionLabel={(option) =>
              option.slug ? `${option.name} (${option.slug})` : option.name
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add Menu"
                placeholder="Search menus to add"
              />
            )}
          />
          <TextField
            label="Default access level"
            select
            value={defaultAccess}
            onChange={(event) => setDefaultAccess(event.target.value)}
            disabled={disabled}
          >
            {accessLevelOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Paper
          variant="outlined"
          sx={{ borderRadius: 2.5, p: selected.length ? 0 : 2 }}
        >
          {selected.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Pick menus from the search above to build the assignment list.
            </Typography>
          ) : (
            <Stack divider={<Divider />}>
              {selected.map((item) => (
                <Stack
                  key={item.id}
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  spacing={1.5}
                  sx={{ p: 1.5 }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                    {item.slug && (
                      <Typography variant="caption" color="text.secondary">
                        {item.slug}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      select
                      value={item.access_level}
                      onChange={(event) =>
                        handleAccessChange(item.id, event.target.value)
                      }
                      sx={{ minWidth: 120 }}
                    >
                      {accessLevelOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Tooltip title="Remove from selection">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveSelected(item.id)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleAdd}
            disabled={!canSubmit || loading.menusAdd}
          >
            {loading.menusAdd ? "Adding..." : "Add to role"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RemoveRoundedIcon />}
            onClick={handleBulkRemove}
            disabled={!canSubmit || loading.menusRemove}
          >
            {loading.menusRemove ? "Removing..." : "Remove from role"}
          </Button>
        </Stack>
      </Stack>

      <Divider />

      <Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700 }}>
              Currently assigned
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Menus already attached to this role.
            </Typography>
          </Box>
          {!disabled && (
            <Button
              size="small"
              variant="text"
              onClick={refreshAssigned}
              disabled={isAssignedListLoading}
            >
              Refresh
            </Button>
          )}
        </Stack>

        {disabled ? (
          <Typography variant="body2" color="text.secondary">
            Pick a tenant and role to view current assignments.
          </Typography>
        ) : roleMenusError ? (
          <Alert severity="error">{roleMenusError}</Alert>
        ) : isAssignedListLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading assigned menus...
          </Typography>
        ) : enrichedAssigned.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No menus assigned to this role yet.
          </Typography>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
            <Stack divider={<Divider />}>
              {enrichedAssigned.map((assignment) => {
                const subtitleParts = [assignment.slug, assignment.path].filter(
                  (value, index, all) =>
                    value && all.indexOf(value) === index,
                );
                const removing =
                  pendingRemoveId === assignment.id || loading.menusRemove;
                return (
                  <Stack
                    key={assignment.id}
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ p: 1.5 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {assignment.name ||
                          assignment.slug ||
                          `#${assignment.id}`}
                      </Typography>
                      {subtitleParts.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {subtitleParts.join(" · ")}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      {assignment.access_level && (
                        <Chip
                          size="small"
                          label={assignment.access_level}
                          color={
                            assignment.access_level === "full"
                              ? "success"
                              : "default"
                          }
                          variant={
                            assignment.access_level === "full"
                              ? "filled"
                              : "outlined"
                          }
                          sx={{ textTransform: "capitalize", fontWeight: 600 }}
                        />
                      )}
                      <Tooltip title="Remove from role">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={removing}
                            onClick={() => handleRemoveOne(assignment)}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}

export default function RoleAssignment() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { companies } = useSelector((state) => state.company);
  const { items: roles, listLoading: rolesLoading } = useSelector(
    (state) => state.role,
  );
  const { error, message } = useSelector((state) => state.roleAssignment);

  const [tenantId, setTenantId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    if (tenantId) {
      dispatch(fetchRolesByTenant(tenantId));
    }
  }, [dispatch, tenantId]);

  useEffect(() => {
    return () => {
      dispatch(clearRoleAssignmentFeedback());
    };
  }, [dispatch]);

  const handleTenantChange = (value) => {
    setTenantId(value);
    setRoleId("");
  };

  const panelKey = `${tenantId}::${roleId}`;
  const disabled = !tenantId || !roleId;

  return (
    <Layout role="superadmin" title="Role Assignments">
      <Stack spacing={2.5}>
        {message && (
          <Alert
            severity="success"
            onClose={() => dispatch(clearRoleAssignmentFeedback())}
          >
            {message}
          </Alert>
        )}
        {error && (
          <Alert
            severity="error"
            onClose={() => dispatch(clearRoleAssignmentFeedback())}
          >
            {error}
          </Alert>
        )}

        <SectionCard>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Role Assignments
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Attach or detach permissions, policies, and menus for a role
                under a tenant.
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <TextField
              label="Company"
              select
              value={tenantId}
              onChange={(event) => handleTenantChange(event.target.value)}
              fullWidth
            >
              <MenuItem value="">Select tenant</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.company_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Role"
              select
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              fullWidth
              disabled={!tenantId || rolesLoading}
              helperText={
                !tenantId
                  ? "Select a tenant first"
                  : rolesLoading
                    ? "Loading roles..."
                    : roles.length === 0
                      ? "No roles found for this tenant"
                      : ""
              }
            >
              <MenuItem value="">Select role</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </SectionCard>

        <SectionCard>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{
              mb: 2.5,
              "& .MuiTab-root": { fontWeight: 700, textTransform: "none" },
              "& .MuiTabs-indicator": { height: 3, borderRadius: 3 },
            }}
          >
            <Tab label="Permissions" />
            <Tab label="Policies" />
            <Tab label="Menus" />
          </Tabs>

          {disabled && (
            <Alert
              severity="info"
              sx={{
                mb: 2,
                bgcolor: alpha(theme.palette.info.main, 0.08),
              }}
            >
              Pick a tenant and role to enable assignments.
            </Alert>
          )}

          {tab === 0 && (
            <PermissionsPanel
              key={`permissions-${panelKey}`}
              disabled={disabled}
              tenantId={tenantId}
              roleId={roleId}
            />
          )}
          {tab === 1 && (
            <PoliciesPanel
              key={`policies-${panelKey}`}
              disabled={disabled}
              tenantId={tenantId}
              roleId={roleId}
            />
          )}
          {tab === 2 && (
            <MenusPanel
              key={`menus-${panelKey}`}
              disabled={disabled}
              tenantId={tenantId}
              roleId={roleId}
            />
          )}
        </SectionCard>
      </Stack>
    </Layout>
  );
}
