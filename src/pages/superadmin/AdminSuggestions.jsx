import { useEffect, useMemo, useState } from "react";
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
  clearAdminSuggestionDeleteState,
  clearAdminSuggestionListState,
  deleteAdminSuggestion,
  fetchAdminSuggestions,
} from "../../store/adminSuggestionSlice";
import { getSurfaceBackground } from "../../theme";
import { formatDateTimeIST } from "../../utils/dateTime";

const suggestionTypeOptions = ["aahar", "vihar", "aushadh"];
const doshaOptions = ["all", "vata", "pitta", "kapha"];
const difficultyOptions = ["easy", "moderate", "advanced"];

export default function AdminSuggestions() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;
  const {
    items,
    listLoading,
    listError,
    deleteLoading,
    deleteError,
    deleteMessage,
  } = useSelector((state) => state.adminSuggestion);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    suggestionType: "",
    doshaType: "",
    difficulty: "",
    status: "all",
  });

  useEffect(() => {
    dispatch(fetchAdminSuggestions());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearAdminSuggestionListState());
      dispatch(clearAdminSuggestionDeleteState());
    };
  }, [dispatch]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        [item.title, item.description, item.url]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));

      const matchesSuggestionType =
        !filters.suggestionType ||
        item.suggestion_type === filters.suggestionType;
      const matchesDosha =
        !filters.doshaType || item.dosha_type === filters.doshaType;
      const matchesDifficulty =
        !filters.difficulty || item.difficulty === filters.difficulty;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" ? item.is_active : !item.is_active);

      return (
        matchesSearch &&
        matchesSuggestionType &&
        matchesDosha &&
        matchesDifficulty &&
        matchesStatus
      );
    });
  }, [filters, items, search]);

  const handleDelete = async (suggestionId, title) => {
    if (!window.confirm(`Delete suggestion "${title}"?`)) return;

    try {
      await dispatch(deleteAdminSuggestion(suggestionId)).unwrap();
    } catch {
      // Redux state already stores the API error.
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "title",
        headerName: "Title",
        flex: 1.25,
        minWidth: 220,
      },
      {
        field: "suggestion_type",
        headerName: "Suggestion Type",
        minWidth: 150,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            label={value || "-"}
            color="primary"
            variant="outlined"
          />
        ),
      },
      {
        field: "dosha_type",
        headerName: "Dosha Type",
        minWidth: 130,
        valueGetter: (_, row) => row.dosha_type || "all",
      },
      {
        field: "difficulty",
        headerName: "Difficulty",
        minWidth: 130,
      },
      {
        field: "duration_mins",
        headerName: "Duration",
        minWidth: 120,
        valueGetter: (_, row) =>
          row.duration_mins ? `${row.duration_mins} mins` : "-",
      },
      {
        field: "url",
        headerName: "Reference URL",
        flex: 1,
        minWidth: 220,
        valueGetter: (_, row) => row.url || "-",
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
        minWidth: 190,
        flex: 1,
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
                  navigate(`/super-admin/admin-suggestions/${row.id}`, { state: { returnBase: '/super-admin/admin-suggestions' } })
                }
              >
                <PreviewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() =>
                  navigate(`/super-admin/admin-suggestions/${row.id}/edit`, { state: { returnBase: '/super-admin/admin-suggestions' } })
                }
              >
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
          </Stack>
        ),
      },
    ],
    [deleteLoading, navigate],
  );

  return (
    <Layout role="superadmin" title="Admin Suggestion">
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
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                Admin Suggestion
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.75, maxWidth: 760 }}
              >
                Create and manage recommendation records for aahar, vihar, and
                aushadh suggestions with dosha and difficulty metadata.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => navigate("/super-admin/admin-suggestions/add", { state: { returnBase: '/super-admin/admin-suggestions' } })}
              >
                Add Suggestion
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => dispatch(fetchAdminSuggestions())}
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
                xl: "1.4fr 1fr 1fr 1fr 1fr auto",
              },
              alignItems: { xl: "end" },
            }}
          >
            <TextField
              label="Search Suggestion"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
            />
            <TextField
              label="Suggestion Type"
              select
              value={filters.suggestionType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  suggestionType: event.target.value,
                }))
              }
              fullWidth
            >
              <MenuItem value="">All Types</MenuItem>
              {suggestionTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Dosha Type"
              select
              value={filters.doshaType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  doshaType: event.target.value,
                }))
              }
              fullWidth
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
              value={filters.difficulty}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  difficulty: event.target.value,
                }))
              }
              fullWidth
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
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              fullWidth
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              onClick={() =>
                setFilters({
                  suggestionType: "",
                  doshaType: "",
                  difficulty: "",
                  status: "all",
                })
              }
              sx={{ minHeight: 56, px: 3, whiteSpace: "nowrap" }}
            >
              Reset Filters
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filteredItems.length} suggestions
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
                  sorting: {
                    sortModel: [{ field: "created_at", sort: "desc" }],
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
