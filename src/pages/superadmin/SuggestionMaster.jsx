import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
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
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearAdminSuggestionDeleteState,
  clearAdminSuggestionListState,
  deleteAdminSuggestion,
  fetchAdminSuggestions,
} from "../../store/adminSuggestionSlice";
import usePermissions from "../../hooks/usePermissions";
import { getRaisedGradient, getSurfaceBackground } from "../../theme";
import { formatDateTimeIST } from "../../utils/dateTime";

const suggestionTypeOptions = ["aahar", "vihar", "aushadh"];
const doshaOptions = ["all", "vata", "pitta", "kapha"];
const difficultyOptions = ["easy", "moderate", "advanced"];
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

function MetricCard({ label, value, note, color, icon }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(color, 0.18),
        background: getRaisedGradient(theme, color),
        height: "100%",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Avatar
          sx={{
            bgcolor: alpha(color, 0.14),
            color,
            width: 42,
            height: 42,
          }}
        >
          {icon}
        </Avatar>
        <Chip
          label={note}
          size="small"
          sx={{
            bgcolor: alpha(color, 0.1),
            color,
            fontWeight: 700,
          }}
        />
      </Stack>
      <Typography color="text.secondary" sx={{ mt: 1.5 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.4, color }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function SuggestionMaster() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;
  const { items, listLoading, listError, deleteLoading, deleteError, deleteMessage } =
    useSelector((state) => state.adminSuggestion);
  // "suggestion-master" slug → "suggestion" resource (per audit's resource map).
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateSuggestions = canCreate("suggestion-master");
  const canEditSuggestions = canEdit("suggestion-master");
  const canDeleteSuggestions = canDelete("suggestion-master");

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [typeFilterInput, setTypeFilterInput] = useState("");
  const [appliedTypeFilter, setAppliedTypeFilter] = useState("");
  const [doshaFilterInput, setDoshaFilterInput] = useState("");
  const [appliedDoshaFilter, setAppliedDoshaFilter] = useState("");
  const [difficultyFilterInput, setDifficultyFilterInput] = useState("");
  const [appliedDifficultyFilter, setAppliedDifficultyFilter] = useState("");
  const [statusFilterInput, setStatusFilterInput] = useState("all");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all");

  const fetchList = (search = appliedSearch, typeFilter = appliedTypeFilter, statusFilter = appliedStatusFilter) => {
    const params = {
      skip: 0,
      limit: 50,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (typeFilter) {
      params.suggestion_type = typeFilter;
    }

    if (statusFilter !== "all") {
      params.is_active = statusFilter === "active";
    }

    dispatch(fetchAdminSuggestions(params));
  };

  const handleApplyFilters = () => {
    setAppliedSearch(searchInput);
    setAppliedTypeFilter(typeFilterInput);
    setAppliedDoshaFilter(doshaFilterInput);
    setAppliedDifficultyFilter(difficultyFilterInput);
    setAppliedStatusFilter(statusFilterInput);
    
    const params = {
      skip: 0,
      limit: 50,
    };

    if (searchInput.trim()) {
      params.search = searchInput.trim();
    }

    if (typeFilterInput) {
      params.suggestion_type = typeFilterInput;
    }

    if (statusFilterInput !== "all") {
      params.is_active = statusFilterInput === "active";
    }

    dispatch(fetchAdminSuggestions(params));
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    return () => {
      dispatch(clearAdminSuggestionListState());
      dispatch(clearAdminSuggestionDeleteState());
    };
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const term = appliedSearch.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        [item.title, item.description, item.suggestion_type, item.dosha_type, item.url]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      const matchesType = !appliedTypeFilter || item.suggestion_type === appliedTypeFilter;
      const matchesDosha = !appliedDoshaFilter || item.dosha_type === appliedDoshaFilter;
      const matchesDifficulty =
        !appliedDifficultyFilter || item.difficulty === appliedDifficultyFilter;
      const matchesStatus =
        appliedStatusFilter === "all" ||
        (appliedStatusFilter === "active" ? item.is_active : !item.is_active);

      return (
        matchesSearch &&
        matchesType &&
        matchesDosha &&
        matchesDifficulty &&
        matchesStatus
      );
    });
  }, [appliedDifficultyFilter, appliedDoshaFilter, items, appliedSearch, appliedStatusFilter, appliedTypeFilter]);

  const handleDelete = async (suggestionId, title) => {
    if (!window.confirm(`Delete suggestion "${title}"?`)) return;

    try {
      await dispatch(deleteAdminSuggestion(suggestionId)).unwrap();
    } catch {
      // Redux state already stores the error.
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setTypeFilterInput("");
    setDoshaFilterInput("");
    setDifficultyFilterInput("");
    setStatusFilterInput("all");
    setAppliedSearch("");
    setAppliedTypeFilter("");
    setAppliedDoshaFilter("");
    setAppliedDifficultyFilter("");
    setAppliedStatusFilter("all");
    dispatch(
      fetchAdminSuggestions({
        skip: 0,
        limit: 50,
      }),
    );
  };

  const columns = useMemo(
    () => [
      {
        field: "suggestion_type",
        headerName: "Type",
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
              label={value}
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
        field: "title",
        headerName: "Title",
        flex: 1.1,
        minWidth: 220,
        headerAlign: "left",
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.4,
        minWidth: 280,
        headerAlign: "left",
      },
      {
        field: "dosha_type",
        headerName: "Dosha",
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
              label={value}
              variant="outlined"
              sx={{ textTransform: "capitalize", fontWeight: 700 }}
            />
          </Box>
        ),
      },
      {
        field: "difficulty",
        headerName: "Difficulty",
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
              label={value}
              color={
                value === "easy"
                  ? "success"
                  : value === "moderate"
                    ? "warning"
                    : "error"
              }
              variant="outlined"
              sx={{ textTransform: "capitalize", fontWeight: 700 }}
            />
          </Box>
        ),
      },
      {
        field: "duration_mins",
        headerName: "Duration",
        minWidth: 120,
        headerAlign: "left",
        valueGetter: (_, row) => `${Number(row.duration_mins || 0)} mins`,
      },
      {
        field: "url",
        headerName: "URL",
        flex: 1,
        minWidth: 340,
        headerAlign: "left",
        renderCell: ({ value }) => (
          <Stack
            direction="row"
            spacing={0.8}
            alignItems="center"
            sx={{ minWidth: 0, width: "100%", height: "100%" }}
          >
            <LinkRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" noWrap>
              {value || "-"}
            </Typography>
          </Stack>
        ),
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
        field: "created_at",
        headerName: "Created At",
        flex: 1.05,
        minWidth: 220,
        headerAlign: "left",
        valueFormatter: (value) => formatDateTimeIST(value),
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        minWidth: 160,
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
                  onClick={() => navigate(`/super-admin/suggestion-master/${row.id}`)}
                >
                  <PreviewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canEditSuggestions && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() =>
                      navigate(`/super-admin/suggestion-master/${row.id}/edit`)
                    }
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canDeleteSuggestions && (
                <Tooltip title="Delete">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deleteLoading}
                      onClick={() => handleDelete(row.id, row.title)}
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
      canDeleteSuggestions,
      canEditSuggestions,
      deleteLoading,
      handleDelete,
      navigate,
      theme.palette.primary.main,
    ],
  );

  return (
    <Layout role="superadmin" title="Suggestion Master">
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
                    Suggestion Library
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Live suggestion records from the admin APIs with dedicated add,
                    view, and edit pages.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {canCreateSuggestions && (
                    <Button
                      variant="contained"
                      startIcon={<AddRoundedIcon />}
                      onClick={() => navigate("/super-admin/suggestion-master/add")}
                    >
                      Add Suggestion
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={fetchList}
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
                    lg: "repeat(3, minmax(0, 1fr))",
                    xl: "repeat(5, minmax(0, 1fr)) auto auto",
                  },
                  alignItems: { xl: "end" },
                }}
              >
                <TextField
                  label="Search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  fullWidth
                  sx={filterFieldSx}
                />
                <TextField
                  label="Type"
                  select
                  value={typeFilterInput}
                  onChange={(event) => setTypeFilterInput(event.target.value)}
                  fullWidth
                  sx={filterFieldSx}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {suggestionTypeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Dosha"
                  select
                  value={doshaFilterInput}
                  onChange={(event) => setDoshaFilterInput(event.target.value)}
                  fullWidth
                  sx={filterFieldSx}
                >
                  <MenuItem value="">All Dosha</MenuItem>
                  {doshaOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Difficulty"
                  select
                  value={difficultyFilterInput}
                  onChange={(event) => setDifficultyFilterInput(event.target.value)}
                  fullWidth
                  sx={filterFieldSx}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {difficultyOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
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
                Showing {filteredRows.length} suggestions
              </Typography>

              <Box sx={{ width: "100%", overflowX: "auto" }}>
                <Box sx={{ height: 560, width: "100%" }}>
                  <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    loading={listLoading}
                    disableRowSelectionOnClick
                    rowHeight={74}
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
                        sortModel: [{ field: "created_at", sort: "desc" }],
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
