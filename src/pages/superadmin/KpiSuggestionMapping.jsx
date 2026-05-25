import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
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
import { fetchAdminSuggestions } from "../../store/adminSuggestionSlice";
import { fetchKpis } from "../../store/kpiSlice";
import {
  clearKpiSuggestionMappingDeleteState,
  clearKpiSuggestionMappingListState,
  deleteKpiSuggestionMapping,
  fetchKpiSuggestionMappings,
} from "../../store/kpiSuggestionMappingSlice";
import { fetchQuestions } from "../../store/questionSlice";
import { fetchThemes } from "../../store/themeSlice";
import usePermissions from "../../hooks/usePermissions";
import { getSurfaceBackground } from "../../theme";
import { formatDateTimeIST } from "../../utils/dateTime";

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const triggerModeOptions = [
  { label: "All Trigger Modes", value: "" },
  { label: "KPI Risk", value: "kpi_risk" },
  { label: "Question Score", value: "question_score" },
  { label: "Both", value: "both" },
];

const filterFieldSx = {
  "& .MuiInputBase-root": {
    minHeight: 56,
  },
};

export default function KpiSuggestionMapping() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;
  const { items: kpiItems } = useSelector((state) => state.kpi);
  const { items: questionItems } = useSelector((state) => state.question);
  const { items: suggestionItems } = useSelector((state) => state.adminSuggestion);
  const { items: themeItems } = useSelector((state) => state.theme);
  const {
    items,
    listLoading,
    listError,
    deleteLoading,
    deleteError,
    deleteMessage,
  } = useSelector((state) => state.kpiSuggestionMapping);
  // "kpi-suggestion-mapping" slug → "suggestion" resource (per audit's resource map).
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateMappings = canCreate("kpi-suggestion-mapping");
  const canEditMappings = canEdit("kpi-suggestion-mapping");
  const canDeleteMappings = canDelete("kpi-suggestion-mapping");

  const defaultFilters = useMemo(
    () => ({
      kpi_key: "",
      question_key: "",
      suggestion_id: "",
      trigger_mode: "",
      status: "all",
    }),
    [],
  );

  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const buildListParams = useCallback((sourceFilters) => {
    const params = {
      skip: 0,
      limit: 50,
    };

    if (sourceFilters.kpi_key.trim()) {
      params.kpi_key = sourceFilters.kpi_key.trim();
    }

    if (sourceFilters.suggestion_id.trim()) {
      params.suggestion_id = sourceFilters.suggestion_id.trim();
    }

    if (sourceFilters.question_key.trim()) {
      params.question_key = sourceFilters.question_key.trim();
    }

    if (sourceFilters.trigger_mode.trim()) {
      params.trigger_mode = sourceFilters.trigger_mode.trim();
    }

    if (sourceFilters.status !== "all") {
      params.is_active = sourceFilters.status === "active";
    }

    return params;
  }, []);

  const fetchList = useCallback(
    (sourceFilters = appliedFilters) => {
      dispatch(fetchKpiSuggestionMappings(buildListParams(sourceFilters)));
    },
    [appliedFilters, buildListParams, dispatch],
  );

  useEffect(() => {
    dispatch(fetchThemes({ limit: 100, isActive: true }));
    dispatch(fetchKpis({ limit: 100, isActive: true }));
    dispatch(fetchQuestions({ limit: 100, isActive: true }));
    dispatch(fetchAdminSuggestions({ limit: 100, is_active: true }));
    dispatch(fetchKpiSuggestionMappings(buildListParams(defaultFilters)));
  }, [buildListParams, defaultFilters, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearKpiSuggestionMappingListState());
      dispatch(clearKpiSuggestionMappingDeleteState());
    };
  }, [dispatch]);

  const handleDelete = useCallback(async (mappingId) => {
    if (!window.confirm("Delete this KPI suggestion mapping?")) return;

    try {
      await dispatch(deleteKpiSuggestionMapping(mappingId)).unwrap();
    } catch {
      // Redux state already stores the error.
    }
  }, [dispatch]);

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    fetchList(draftFilters);
  };

  const resetFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    dispatch(fetchKpiSuggestionMappings(buildListParams(defaultFilters)));
  };

  const columns = useMemo(
    () => [
      {
        field: "kpi_name",
        headerName: "KPI",
        minWidth: 220,
        flex: 1.1,
        valueGetter: (_, row) => row.kpi_name || row.kpi_key || "-",
        renderCell: ({ row }) => (
          <Tooltip title={row.kpi_key || ""} placement="top" arrow>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {row.kpi_name || row.kpi_key || "-"}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: "trigger_mode",
        headerName: "Trigger Mode",
        minWidth: 140,
        renderCell: ({ value }) => (
          <Chip size="small" label={value || "-"} variant="outlined" />
        ),
      },
      {
        field: "risk_level",
        headerName: "Risk Level",
        minWidth: 120,
        valueGetter: (_, row) => row.risk_level || "-",
      },
      {
        field: "question_label",
        headerName: "Question",
        minWidth: 280,
        flex: 1.4,
        valueGetter: (_, row) => {
          if (row.question_code && row.question_text) {
            return `${row.question_code} - ${row.question_text}`;
          }
          return row.question_code || row.question_text || row.question_key || "-";
        },
        renderCell: ({ row }) => {
          const code = row.question_code || row.question_key || "";
          const text = row.question_text || "";
          if (!code && !text) return "-";
          return (
            <Tooltip title={text || ""} placement="top" arrow>
              <Typography variant="body2" noWrap>
                {code && text ? `${code} - ${text}` : code || text}
              </Typography>
            </Tooltip>
          );
        },
      },
      {
        field: "suggestion_title",
        headerName: "Suggestion",
        minWidth: 220,
        flex: 1,
        valueGetter: (_, row) => row.suggestion_title || row.suggestion_id || "-",
        renderCell: ({ row }) => (
          <Tooltip title={row.suggestion_id || ""} placement="top" arrow>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {row.suggestion_title || row.suggestion_id || "-"}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: "priority",
        headerName: "Priority",
        minWidth: 100,
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
          <Chip
            size="small"
            label={value ? "Active" : "Inactive"}
            color={value ? "success" : "default"}
            variant={value ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "updated_at",
        headerName: "Updated At",
        minWidth: 190,
        flex: 1,
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
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => navigate(`/super-admin/kpi-suggestion-mapping/${row.id}`)}
              >
                <PreviewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEditMappings && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() =>
                    navigate(`/super-admin/kpi-suggestion-mapping/${row.id}/edit`)
                  }
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteMappings && (
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deleteLoading}
                    onClick={() => handleDelete(row.id)}
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
    [canDeleteMappings, canEditMappings, deleteLoading, handleDelete, navigate],
  );

  const filteredQuestionItems = useMemo(() => {
    if (!draftFilters.kpi_key) {
      return questionItems;
    }

    return questionItems.filter((item) => item.kpi_key === draftFilters.kpi_key);
  }, [draftFilters.kpi_key, questionItems]);

  const selectedAppliedQuestion = useMemo(
    () =>
      questionItems.find(
        (item) => String(item.id) === String(appliedFilters.question_key),
      ) || null,
    [appliedFilters.question_key, questionItems],
  );

  const filteredRows = useMemo(() => {
    return items.filter((item) => {
      const matchesKpi =
        !appliedFilters.kpi_key || item.kpi_key === appliedFilters.kpi_key;
      const matchesSuggestion =
        !appliedFilters.suggestion_id ||
        String(item.suggestion_id) === String(appliedFilters.suggestion_id);
      const matchesTriggerMode =
        !appliedFilters.trigger_mode ||
        item.trigger_mode === appliedFilters.trigger_mode;
      const matchesStatus =
        appliedFilters.status === "all" ||
        (appliedFilters.status === "active" ? item.is_active : !item.is_active);

      const matchesQuestion =
        !appliedFilters.question_key ||
        String(item.question_key) === String(appliedFilters.question_key) ||
        String(item.question_code) === String(selectedAppliedQuestion?.question_code || "") ||
        String(item.question_key) === String(selectedAppliedQuestion?.question_code || "");

      return (
        matchesKpi &&
        matchesSuggestion &&
        matchesTriggerMode &&
        matchesStatus &&
        matchesQuestion
      );
    });
  }, [appliedFilters, items, selectedAppliedQuestion]);

  const themeNameByKey = useMemo(
    () =>
      themeItems.reduce((accumulator, item) => {
        accumulator[item.theme_key] = item.theme_display_name;
        return accumulator;
      }, {}),
    [themeItems],
  );

  return (
    <Layout role="superadmin" title="KPI Suggestion Mapping">
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
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                KPI Suggestion Mapping
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
                Manage KPI-to-suggestion trigger rules with threshold, trigger mode,
                and priority metadata.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {canCreateMappings && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => navigate("/super-admin/kpi-suggestion-mapping/add")}
                >
                  Add Mapping
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
                xl: "repeat(4, minmax(0, 1fr)) auto auto",
              },
              alignItems: { xl: "end" },
            }}
          >
            <TextField
              label="KPI"
              select
              value={draftFilters.kpi_key}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  kpi_key: event.target.value,
                  question_key:
                    current.question_key &&
                    !questionItems.some(
                      (item) =>
                        String(item.id) === String(current.question_key) &&
                        item.kpi_key === event.target.value,
                    )
                      ? ""
                      : current.question_key,
                }))
              }
              fullWidth
              sx={filterFieldSx}
            >
              <MenuItem value="">All KPI</MenuItem>
              {kpiItems.map((item) => (
                <MenuItem key={item.kpi_key} value={item.kpi_key}>
                  {`${themeNameByKey[item.theme_key] || item.theme_key || "Unknown Theme"} - ${item.display_name}`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Question"
              select
              value={draftFilters.question_key}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  question_key: event.target.value,
                }))
              }
              fullWidth
              sx={filterFieldSx}
            >
              <MenuItem value="">All Questions</MenuItem>
              {filteredQuestionItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.question_code || item.question_text || item.id}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Suggestion"
              select
              value={draftFilters.suggestion_id}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  suggestion_id: event.target.value,
                }))
              }
              fullWidth
              sx={filterFieldSx}
            >
              <MenuItem value="">All Suggestions</MenuItem>
              {suggestionItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Trigger Mode"
              select
              value={draftFilters.trigger_mode}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  trigger_mode: event.target.value,
                }))
              }
              fullWidth
              sx={filterFieldSx}
            >
              {triggerModeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Status"
              select
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, status: event.target.value }))
              }
              fullWidth
              sx={filterFieldSx}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              onClick={applyFilters}
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
            Showing {filteredRows.length} mappings
          </Typography>

          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ height: 560, width: "100%" }}>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                loading={listLoading}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                  sorting: {
                    sortModel: [{ field: "updated_at", sort: "desc" }],
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
