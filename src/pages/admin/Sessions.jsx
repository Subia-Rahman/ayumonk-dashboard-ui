import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import PublishIcon from "@mui/icons-material/Publish";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RefreshIcon from "@mui/icons-material/Refresh";
import Layout from "../../layouts/commonLayout/Layout";
import { fetchCompanies } from "../../store/companySlice";
import {
  clearSessionPreview,
  clearSessionListError,
  clearSessionMessages,
  deleteSession,
  fetchSessionPreview,
  fetchSessions,
  publishSession,
} from "../../store/sessionSlice";
import { getSurfaceBackground } from "../../theme";
import { alpha } from "@mui/material/styles";
import { formatDateTimeIST } from "../../utils/dateTime";
import { getCompanyId } from "../../utils/roleHelper";
import usePermissions from "../../hooks/usePermissions";

export default function Sessions({ role = "admin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canCreateSessions = canCreate("sessions");
  const canEditSessions = canEdit("sessions");
  const canDeleteSessions = canDelete("sessions");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    companyId: role === "admin" ? getCompanyId() : "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    companyId: role === "admin" ? getCompanyId() : "",
  });
  const {
    sessions,
    listLoading,
    deleteLoading,
    previewLoading,
    publishLoading,
    deleteMessage,
    deleteError,
    listError,
    previewError,
    publishError,
    previewMessage,
    publishMessage,
    sessionPreview,
  } = useSelector((state) => state.session);
  const { companies } = useSelector((state) => state.company);
  const sessionQuery = useMemo(
    () => ({
      ...(appliedFilters.companyId ? { companyId: appliedFilters.companyId } : {}),
    }),
    [appliedFilters.companyId],
  );

  useEffect(() => {
    dispatch(fetchCompanies());
    dispatch(fetchSessions(sessionQuery));
  }, [dispatch, sessionQuery]);

  const sessionRows = useMemo(
    () =>
      sessions.map((session) => ({
        ...session,
        id: session.id,
        company_name:
          companies.find((company) => company.id === session.company_id)
            ?.company_name || session.company_id,
      })),
    [sessions, companies],
  );

  const handleDeleteSession = useCallback(
    (row) => {
      if (!window.confirm(`Are you sure you want to delete session "${row.title || row.id}"?`)) {
        return;
      }

      dispatch(clearSessionMessages());
      dispatch(deleteSession(row.id))
        .unwrap()
        .then(() => {
          dispatch(fetchSessions(sessionQuery));
        })
        .catch(() => {
          // Redux state already contains the error.
        });
    },
    [dispatch, sessionQuery],
  );

  const handlePreviewSession = useCallback(
    async (sessionId) => {
      setPreviewDialogOpen(true);

      try {
        await dispatch(fetchSessionPreview(sessionId)).unwrap();
      } catch {
        // Redux state already contains the error.
      }
    },
    [dispatch],
  );

  const handlePublishSession = async () => {
    if (!sessionPreview?.session_id) return;

    try {
      await dispatch(publishSession(sessionPreview.session_id)).unwrap();
      dispatch(fetchSessions(sessionQuery));
    } catch {
      // Redux state already contains the error.
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      companyId: filters.companyId,
    });
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      companyId: role === "admin" ? getCompanyId() : "",
    };

    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleClosePreviewDialog = () => {
    setPreviewDialogOpen(false);
    dispatch(clearSessionPreview());
  };

  const sessionColumns = useMemo(
    () => [
      {
        field: "title",
        headerName: "Title",
        flex: 1.1,
        minWidth: 160,
        renderCell: (params) => (
          <Tooltip title={params.value || "-"}>
            <Typography variant="body2" noWrap sx={{ width: "100%" }}>
              {params.value || "-"}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.5,
        minWidth: 220,
        renderCell: (params) => (
          <Tooltip title={params.value || "-"}>
            <Typography variant="body2" noWrap sx={{ width: "100%" }}>
              {params.value || "-"}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: "company_name",
        headerName: "Company",
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
          <Tooltip title={params.value || "-"}>
            <Typography variant="body2" noWrap sx={{ width: "100%" }}>
              {params.value || "-"}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: "is_active",
        headerName: "Active",
        minWidth: 90,
        renderCell: ({ value }) => (value ? "Yes" : "No"),
      },
      {
        field: "created_at",
        headerName: "Created At",
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          const displayValue = formatDateTimeIST(params.value);
          return (
            <Tooltip title={displayValue}>
              <Typography variant="body2" noWrap sx={{ width: "100%" }}>
                {displayValue}
              </Typography>
            </Tooltip>
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        minWidth: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%", height: "100%" }}
          >
            <Tooltip title="Manage Session">
              <IconButton
                size="small"
                color="secondary"
                onClick={() =>
                  navigate(
                    role === "admin"
                      ? `/admin/sessions/${params.row.id}/manage`
                      : `/super-admin/sessions/${params.row.id}/manage`,
                  )
                }
              >
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Preview Form">
              <IconButton
                size="small"
                color="success"
                onClick={() => handlePreviewSession(params.row.id)}
              >
                <PreviewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {canEditSessions && (
              <Tooltip title="Edit Session">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? `/admin/sessions/${params.row.id}/edit`
                        : `/super-admin/sessions/${params.row.id}/edit`,
                    )
                  }
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {canDeleteSessions && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteSession(params.row)}
                  disabled={deleteLoading}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ],
    [
      canDeleteSessions,
      canEditSessions,
      deleteLoading,
      handleDeleteSession,
      handlePreviewSession,
      navigate,
      role,
    ],
  );

  return (
    <Layout role={role} title="Sessions">
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
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750, mb: 0.7 }}>
                Sessions Listing
              </Typography>
              <Typography color="text.secondary">
                This page only shows the session list. Open a session to manage questions, summary, and preview on a dedicated page.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {canCreateSessions && (
                <Button
                  variant="contained"
                  onClick={() =>
                    navigate(
                      role === "admin"
                        ? "/admin/sessions/add"
                        : "/super-admin/sessions/add",
                    )
                  }
                >
                  Add Session
                </Button>
              )}
              <Tooltip title="Refresh Sessions">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => {
                      dispatch(clearSessionListError());
                      dispatch(fetchSessions(sessionQuery));
                    }}
                    disabled={listLoading}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          {!!listError && <Alert severity="error">{listError}</Alert>}
          {!!deleteError && <Alert severity="error">{deleteError}</Alert>}
          {!!deleteMessage && <Alert severity="success">{deleteMessage}</Alert>}

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              mb: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: role === "superadmin"
                  ? "repeat(2, minmax(0, 1fr)) auto auto"
                  : "repeat(1, minmax(0, 1fr)) auto auto",
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
              >
                <MenuItem value="">All Companies</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.company_name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {role === "superadmin" && (
              <Button
                variant="outlined"
                onClick={handleApplyFilters}
                disabled={listLoading}
                sx={{ minHeight: 56, px: 3, whiteSpace: "nowrap" }}
              >
                Apply Filters
              </Button>
            )}
            {role === "superadmin" && (
              <Button
                variant="text"
                onClick={handleResetFilters}
                sx={{ minHeight: 56, px: 2, whiteSpace: "nowrap" }}
              >
                Reset
              </Button>
            )}
          </Box>

          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ height: 520, width: "100%" }}>
              <DataGrid
                loading={listLoading}
                rows={sessionRows}
                columns={sessionColumns}
                rowHeight={66}
                columnHeaderHeight={56}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                }}
                sx={{
                  border: 0,
                  "& .MuiDataGrid-columnHeader": {
                    display: "flex",
                    alignItems: "center",
                  },
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                  },
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                    outline: "none",
                  },
                  "& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within": {
                    outline: "none",
                  },
                }}
              />
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Dialog
        open={previewDialogOpen}
        onClose={handleClosePreviewDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="h6">Form Preview</Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {!sessionPreview?.is_published && !!sessionPreview && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PublishIcon />}
                  onClick={handlePublishSession}
                  disabled={publishLoading}
                >
                  {publishLoading ? "Publishing..." : "Publish Form"}
                </Button>
              )}
              <Button onClick={handleClosePreviewDialog}>Close</Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            bgcolor: "background.default",
            px: { xs: 1.5, sm: 3 },
            py: { xs: 2, sm: 3 },
          }}
        >
          {previewLoading && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={18} />
              <Typography>Loading form preview...</Typography>
            </Stack>
          )}

          {!!previewError && !previewLoading && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {previewError}
            </Alert>
          )}

          {!!publishError && !previewLoading && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {publishError}
            </Alert>
          )}

          {!!previewMessage && !previewLoading && !previewError && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {previewMessage}
            </Alert>
          )}

          {!!publishMessage && !previewLoading && !publishError && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {publishMessage}
            </Alert>
          )}

          {!!sessionPreview && !previewLoading && (
            <Stack spacing={2}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: getSurfaceBackground(theme, 0.92),
                  backdropFilter: "blur(6px)",
                }}
              >
                <Box sx={{ height: 10, bgcolor: "primary.main" }} />
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h4" sx={{ fontSize: { xs: 24, sm: 32 }, mb: 1 }}>
                    {sessionPreview.title || "-"}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {sessionPreview.description || "No description provided."}
                  </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} useFlexGap flexWrap="wrap">
                    <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 2, minWidth: 180 }}>
                      <Typography variant="caption" color="text.secondary">
                        Session ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {sessionPreview.session_id}
                      </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 2, minWidth: 180 }}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {sessionPreview.is_published ? "Published" : "Draft"}
                      </Typography>
                    </Paper>
                    {!!sessionPreview.preview_url && (
                      <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 2, minWidth: 180 }}>
                        <Typography variant="caption" color="text.secondary">
                          Preview URL
                        </Typography>
                        <Stack direction="row" spacing={0.7} alignItems="center">
                          <LinkIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {sessionPreview.preview_url}
                          </Typography>
                        </Stack>
                      </Paper>
                    )}
                    {!!sessionPreview.final_url && (
                      <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 2, minWidth: 180 }}>
                        <Typography variant="caption" color="text.secondary">
                          Final URL
                        </Typography>
                        <Stack direction="row" spacing={0.7} alignItems="center">
                          <LinkIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {sessionPreview.final_url}
                          </Typography>
                        </Stack>
                      </Paper>
                    )}
                  </Stack>
                </Box>
              </Paper>

              {(sessionPreview.questions || []).map((question) => (
                <Paper
                  key={question.question_id}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack spacing={1.4}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {question.display_order}. {question.question_text}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {question.theme_display_name} • {question.kpi_display_name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {question.question_code}
                      </Typography>
                    </Stack>

                    <Stack spacing={1}>
                      {(question.options || []).map((option, index) => (
                        <Paper
                          key={`${question.question_id}-${index}`}
                          variant="outlined"
                          sx={{
                            p: 1.4,
                            borderRadius: 999,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.2,
                            bgcolor: alpha(
                              theme.palette.primary.main,
                              theme.palette.mode === "dark" ? 0.08 : 0.04,
                            ),
                            borderColor: alpha(
                              theme.palette.primary.main,
                              theme.palette.mode === "dark" ? 0.28 : 0.18,
                            ),
                          }}
                        >
                          <RadioButtonUncheckedIcon
                            sx={{ color: "text.secondary", fontSize: 20 }}
                          />
                          <Typography variant="body2">{option}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              ))}

              {!sessionPreview.questions?.length && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: "1px dashed",
                    borderColor: "divider",
                    textAlign: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    No questions are available in this preview yet.
                  </Typography>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreviewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
