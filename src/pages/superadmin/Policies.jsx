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
  clearPolicyListState,
  fetchPolicies,
  setSelectedPolicyModule,
  setSelectedPolicyTenantId,
} from "../../store/policySlice";
import { fetchCompanies } from "../../store/companySlice";
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

const effectColor = (effect) => {
  const value = String(effect || "").toLowerCase();
  if (value === "allow") return "success";
  if (value === "deny") return "error";
  return "default";
};

export default function Policies() {
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
    selectedModule,
  } = useSelector((state) => state.policy);
  const { companies } = useSelector((state) => state.company);
  // "policies" slug → "platform" resource (per audit's resource map).
  const { canCreate } = usePermissions();
  const canCreatePolicies = canCreate("policies");

  const [tenantId, setTenantId] = useState(selectedTenantId || "");
  const [moduleFilter, setModuleFilter] = useState(selectedModule || "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [effectFilter, setEffectFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    if (tenantId) {
      dispatch(fetchPolicies({ tenantId, module: moduleFilter }));
    }
    // module is part of the request payload — refetch on change too
  }, [dispatch, tenantId, moduleFilter]);

  useEffect(() => {
    return () => {
      dispatch(clearPolicyListState());
    };
  }, [dispatch]);

  const handleTenantChange = (value) => {
    setTenantId(value);
    dispatch(setSelectedPolicyTenantId(value));
  };

  const handleModuleChange = (value) => {
    setModuleFilter(value);
    dispatch(setSelectedPolicyModule(value));
  };

  const refresh = () => {
    if (tenantId) {
      dispatch(fetchPolicies({ tenantId, module: moduleFilter }));
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setEffectFilter("all");
    handleModuleChange("");
  };

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !term ||
        [item.name, item.description, item.module, item.scope, item.effect]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? item.is_active : !item.is_active);
      const matchesEffect =
        effectFilter === "all" ||
        String(item.effect || "").toLowerCase() === effectFilter;
      return matchesSearch && matchesStatus && matchesEffect;
    });
  }, [effectFilter, items, search, statusFilter]);

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
        flex: 1.2,
        minWidth: 200,
        headerAlign: "left",
      },
      {
        field: "module",
        headerName: "Module",
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
        field: "scope",
        headerName: "Scope",
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
              label={value || "-"}
              variant="outlined"
              sx={{ textTransform: "capitalize", fontWeight: 700 }}
            />
          </Box>
        ),
      },
      {
        field: "effect",
        headerName: "Effect",
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
              label={value || "-"}
              color={effectColor(value)}
              variant="filled"
              sx={{ textTransform: "capitalize", fontWeight: 700 }}
            />
          </Box>
        ),
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.4,
        minWidth: 280,
        headerAlign: "left",
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
        minWidth: 110,
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
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => navigate(`/super-admin/policies/${row.id}`)}
              >
                <PreviewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [navigate, theme.palette.primary.main],
  );

  return (
    <Layout role="superadmin" title="Policy Master">
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
                  Policies
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Manage tenant-scoped access policies. Pick a tenant (and
                  optionally a module) to load matching policies.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {canCreatePolicies && (
                  <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={() => navigate("/super-admin/policies/add")}
                  >
                    Add Policy
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
                  lg: "repeat(5, minmax(0, 1fr)) auto auto",
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
                <MenuItem value="">Select Company</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.company_name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Module"
                value={moduleFilter}
                onChange={(event) => handleModuleChange(event.target.value)}
                fullWidth
                sx={filterFieldSx}
               
              />
              <TextField
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                fullWidth
                sx={filterFieldSx}
              />
              <TextField
                label="Effect"
                select
                value={effectFilter}
                onChange={(event) => setEffectFilter(event.target.value)}
                fullWidth
                sx={filterFieldSx}
              >
                <MenuItem value="all">All Effects</MenuItem>
                <MenuItem value="allow">Allow</MenuItem>
                <MenuItem value="deny">Deny</MenuItem>
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
              {tenantId
                ? `Showing ${filteredRows.length} polic${filteredRows.length === 1 ? "y" : "ies"}`
                : "Select a tenant to load policies."}
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
