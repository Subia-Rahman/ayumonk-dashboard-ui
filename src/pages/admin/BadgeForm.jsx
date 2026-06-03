import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Layout from "../../layouts/commonLayout/Layout";
import {
  clearBadgeCreateState,
  clearBadgeDetailState,
  clearBadgeUpdateState,
  createBadge,
  fetchBadgeById,
  updateBadge,
} from "../../store/badgeSlice";
import { fetchCompanies } from "../../store/companySlice";
import { fetchKpis } from "../../store/kpiSlice";
import { fetchThemes } from "../../store/themeSlice";
import usePermissions from "../../hooks/usePermissions";
import { getCompanyId, setCompanyId } from "../../utils/roleHelper";
import { getSurfaceBackground } from "../../theme";
import api, { getApiErrorMessage } from "../../services/api";
import { API_URLS } from "../../services/apiUrls";

const LEVEL_OPTIONS = [
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "legend", label: "Legend" },
  { value: "platinum", label: "Platinum" },
];

const TRIGGER_TYPE_OPTIONS = [
  { value: "streak", label: "Streak (either KPI-bound or global)" },
  { value: "kpi_completions", label: "KPI Completions (KPI required)" },
  { value: "level", label: "Level (no KPI — global)" },
];

const BADGE_ICON_OPTIONS = [
  { value: "🏆", label: "Trophy" },
  { value: "🥇", label: "Gold" },
  { value: "🥈", label: "Silver" },
  { value: "🥉", label: "Bronze" },
  { value: "🎖", label: "Medal" },
  { value: "⭐", label: "Star" },
  { value: "🌟", label: "Sparkle" },
  { value: "🔥", label: "Streak" },
  { value: "💎", label: "Diamond" },
  { value: "👑", label: "Crown" },
  { value: "⚡", label: "Energy" },
  { value: "🚀", label: "Boost" },
];

const isKpiAllowed = (triggerType) =>
  triggerType === "streak" || triggerType === "kpi_completions";

const isKpiRequired = (triggerType) => triggerType === "kpi_completions";

const basePathFor = (role) =>
  role === "superadmin" ? "/super-admin/badges" : "/admin/badges";

const emptyForm = {
  badgeKey: "",
  label: "",
  description: "",
  icon: "",
  level: "",
  triggerType: "",
  triggerValue: 1,
  kpiKey: "",
  isActive: true,
};

export default function BadgeForm({ mode, role = "admin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const basePath = basePathFor(role);
  const { companies } = useSelector((state) => state.company);
  const { items: themeItems } = useSelector((state) => state.theme);
  const { items: kpiItems } = useSelector((state) => state.kpi);
  const {
    selectedBadge,
    createLoading,
    createError,
    detailLoading,
    detailError,
    updateLoading,
    updateError,
  } = useSelector((state) => state.badge);
  const { canCreate, canEdit } = usePermissions();
  const canSubmitForm =
    mode === "edit" ? canEdit("badges") : canCreate("badges");

  const [draftForm, setDraftForm] = useState({});
  const [scope, setScope] = useState({
    companyId: role === "admin" ? getCompanyId() : "",
    themeKey: "",
  });
  const [companyMe, setCompanyMe] = useState(null);
  const [companyMeError, setCompanyMeError] = useState("");
  const [formError, setFormError] = useState("");
  const [clearKpiOnSave, setClearKpiOnSave] = useState(false);

  useEffect(() => {
    dispatch(fetchCompanies());

    if (role === "admin") {
      const fetchCompanyMe = async () => {
        try {
          const response = await api.get(API_URLS.companyMe);
          const payload = response?.data || {};

          if (!payload?.success || !payload?.data) {
            throw new Error(payload?.message || "Failed to fetch company details.");
          }

          const resolvedCompanyId =
            payload.data?.id || payload.data?.company_id || "";
          setCompanyMe(payload.data);
          setCompanyMeError("");
          setCompanyId(resolvedCompanyId);
          setScope((current) =>
            current.companyId === resolvedCompanyId
              ? current
              : { ...current, companyId: resolvedCompanyId },
          );
        } catch (error) {
          setCompanyMe(null);
          setCompanyMeError(
            getApiErrorMessage(error, "Failed to fetch company details."),
          );
        }
      };

      fetchCompanyMe();
    }

    if (mode === "edit" && id) {
      dispatch(fetchBadgeById(id));
    }
  }, [dispatch, id, mode, role]);

  useEffect(() => {
    dispatch(
      fetchThemes({
        isActive: true,
        companyId: scope.companyId || undefined,
      }),
    );
  }, [dispatch, scope.companyId]);

  useEffect(() => {
    dispatch(
      fetchKpis({
        isActive: true,
        companyId: scope.companyId || undefined,
        themeKey: scope.themeKey || undefined,
      }),
    );
  }, [dispatch, scope.companyId, scope.themeKey]);

  // When a superadmin opens an existing badge bound to a KPI, derive the
  // Company / Theme scope from that KPI so the cascading dropdowns render
  // the saved KPI value instead of falling back to an empty Select.
  useEffect(() => {
    if (
      mode !== "edit" ||
      role !== "superadmin" ||
      !selectedBadge?.kpi_key ||
      scope.companyId
    ) {
      return;
    }
    const matchedKpi = kpiItems.find(
      (item) => item.kpi_key === selectedBadge.kpi_key,
    );
    if (!matchedKpi?.company_id) return;
    setScope((current) =>
      current.companyId
        ? current
        : {
            companyId: String(matchedKpi.company_id),
            themeKey: matchedKpi.theme_key || "",
          },
    );
  }, [kpiItems, mode, role, scope.companyId, selectedBadge]);

  useEffect(() => {
    return () => {
      dispatch(clearBadgeCreateState());
      dispatch(clearBadgeUpdateState());
      dispatch(clearBadgeDetailState());
    };
  }, [dispatch]);

  const filteredThemeItems = useMemo(
    () =>
      scope.companyId
        ? themeItems.filter(
            (item) => String(item.company_id) === String(scope.companyId),
          )
        : themeItems,
    [scope.companyId, themeItems],
  );

  const filteredKpiItems = useMemo(
    () =>
      scope.companyId
        ? kpiItems.filter(
            (item) => String(item.company_id) === String(scope.companyId),
          )
        : kpiItems,
    [scope.companyId, kpiItems],
  );

  const themeNameByKey = useMemo(
    () =>
      themeItems.reduce((accumulator, item) => {
        accumulator[item.theme_key] = item.theme_display_name;
        return accumulator;
      }, {}),
    [themeItems],
  );

  const selectedCompanyName = useMemo(() => {
    if (companyMe?.company_name) return companyMe.company_name;
    const match = companies.find(
      (company) => String(company.id) === String(scope.companyId),
    );
    return match?.company_name || scope.companyId || "";
  }, [companies, companyMe, scope.companyId]);

  const baseForm = useMemo(() => {
    if (mode === "edit" && selectedBadge) {
      return {
        badgeKey: selectedBadge.badge_key || "",
        label: selectedBadge.label || "",
        description: selectedBadge.description || "",
        icon: selectedBadge.icon || "",
        level: selectedBadge.level || "",
        triggerType: selectedBadge.trigger_type || "",
        triggerValue: Number(selectedBadge.trigger_value) || 1,
        kpiKey: selectedBadge.kpi_key || "",
        isActive: Boolean(selectedBadge.is_active),
      };
    }
    return emptyForm;
  }, [mode, selectedBadge]);

  const form = useMemo(
    () => ({ ...baseForm, ...draftForm }),
    [baseForm, draftForm],
  );

  const pageTitle = useMemo(
    () => (mode === "edit" ? "Edit Badge" : "Add Badge"),
    [mode],
  );

  const updateField = (field, value) => {
    setFormError("");
    setDraftForm((current) => ({ ...current, [field]: value }));
  };

  const handleTriggerTypeChange = (value) => {
    setFormError("");
    setDraftForm((current) => ({
      ...current,
      triggerType: value,
      kpiKey: isKpiAllowed(value) ? current.kpiKey ?? baseForm.kpiKey : "",
    }));
    if (mode === "edit" && !isKpiAllowed(value)) {
      setClearKpiOnSave(true);
    } else {
      setClearKpiOnSave(false);
    }
  };

  const validate = () => {
    if (mode !== "edit" && !form.badgeKey.trim()) {
      return "Badge key is required.";
    }
    if (!form.label.trim()) {
      return "Label is required.";
    }
    if (!form.level) {
      return "Level is required.";
    }
    if (!form.triggerType) {
      return "Trigger type is required.";
    }
    const triggerValueNum = Number(form.triggerValue);
    if (!Number.isFinite(triggerValueNum) || triggerValueNum <= 0) {
      return "Trigger value must be greater than 0.";
    }
    if (isKpiRequired(form.triggerType) && !form.kpiKey) {
      return "KPI is required when trigger type is 'kpi_completions'.";
    }
    if (form.triggerType === "level" && form.kpiKey) {
      return "KPI must be empty when trigger type is 'level'.";
    }
    return "";
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError("");

    try {
      if (mode === "edit") {
        const badgeId = selectedBadge?.badge_id || id;
        await dispatch(
          updateBadge({
            badgeId,
            label: form.label.trim(),
            description: form.description.trim(),
            icon: form.icon.trim(),
            level: form.level,
            triggerType: form.triggerType,
            triggerValue: Number(form.triggerValue),
            kpiKey: isKpiAllowed(form.triggerType) ? form.kpiKey : "",
            clearKpiKey: clearKpiOnSave || !isKpiAllowed(form.triggerType),
            isActive: form.isActive,
          }),
        ).unwrap();

        navigate(basePath, {
          replace: true,
          state: {
            feedback: {
              severity: "success",
              message: "Badge updated successfully.",
            },
          },
        });
        return;
      }

      await dispatch(
        createBadge({
          badgeKey: form.badgeKey.trim(),
          label: form.label.trim(),
          description: form.description.trim(),
          icon: form.icon.trim(),
          level: form.level,
          triggerType: form.triggerType,
          triggerValue: Number(form.triggerValue),
          kpiKey: isKpiAllowed(form.triggerType) ? form.kpiKey : "",
        }),
      ).unwrap();

      navigate(basePath, {
        replace: true,
        state: {
          feedback: {
            severity: "success",
            message: "Badge added successfully.",
          },
        },
      });
    } catch {
      // Error is already handled in redux state.
    }
  };

  if (mode === "edit" && detailLoading && !selectedBadge) {
    return (
      <Layout role={role} title={pageTitle}>
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
          <Typography>Loading badge...</Typography>
        </Paper>
      </Layout>
    );
  }

  return (
    <Layout role={role} title={pageTitle}>
      <Stack spacing={2.5}>
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
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                {pageTitle}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                {mode === "edit"
                  ? "Update badge attributes. Editing trigger_value or kpi_key follows freeze-on-edit — existing user_badges rows are preserved."
                  : "Define a badge with a level, trigger, and optional KPI binding."}
              </Typography>
            </Box>
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate(basePath)}
            >
              Back to list
            </Button>
          </Stack>

          {(formError || companyMeError || createError || updateError || detailError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError || companyMeError || createError || updateError || detailError}
            </Alert>
          )}

          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              {role === "superadmin" ? (
                <TextField
                  label="Company"
                  select
                  value={scope.companyId}
                  onChange={(event) =>
                    setScope({
                      companyId: event.target.value,
                      themeKey: "",
                    })
                  }
                  helperText="Used to narrow the Theme and KPI lists. Badges are platform-level — this is not saved on the badge."
                  fullWidth
                >
                  <MenuItem value="">Select company</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.company_name}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  label="Company"
                  value={selectedCompanyName}
                  helperText="Selected from your admin profile."
                  fullWidth
                  disabled
                />
              )}
              <TextField
                label="Theme"
                select
                value={scope.themeKey}
                onChange={(event) =>
                  setScope((current) => ({
                    ...current,
                    themeKey: event.target.value,
                  }))
                }
                disabled={!scope.companyId}
                helperText={
                  scope.companyId
                    ? "Filters KPIs by theme."
                    : "Select a company first."
                }
                fullWidth
              >
                <MenuItem value="">All Themes</MenuItem>
                {filteredThemeItems.map((item) => (
                  <MenuItem key={item.theme_key} value={item.theme_key}>
                    {item.theme_display_name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Badge Key"
              value={form.badgeKey}
              onChange={(event) => updateField("badgeKey", event.target.value)}
              disabled={mode === "edit"}
              helperText={
                mode === "edit"
                  ? "Badge key is immutable — it is the stable cross-system identifier."
                  : "Unique, case-insensitive identifier (e.g. streak_30, hydration_master)."
              }
              fullWidth
            />
            <TextField
              label="Label"
              value={form.label}
              onChange={(event) => updateField("label", event.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Level"
                select
                value={form.level}
                onChange={(event) => updateField("level", event.target.value)}
                fullWidth
              >
                <MenuItem value="">Select level</MenuItem>
                {LEVEL_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Trigger Type"
                select
                value={form.triggerType}
                onChange={(event) => handleTriggerTypeChange(event.target.value)}
                fullWidth
              >
                <MenuItem value="">Select trigger type</MenuItem>
                {TRIGGER_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Trigger Value"
                type="number"
                value={form.triggerValue}
                onChange={(event) =>
                  updateField("triggerValue", event.target.value)
                }
                inputProps={{ min: 1 }}
                helperText="Must be greater than 0."
                fullWidth
              />
              <TextField
                label="KPI"
                select
                value={form.kpiKey}
                onChange={(event) => {
                  updateField("kpiKey", event.target.value);
                  setClearKpiOnSave(false);
                }}
                disabled={
                  !isKpiAllowed(form.triggerType) || !scope.companyId
                }
                helperText={
                  form.triggerType === "level"
                    ? "Not applicable — 'level' badges are global."
                    : !scope.companyId
                      ? "Select a company first."
                      : form.triggerType === "kpi_completions"
                        ? "Required for 'kpi_completions' badges."
                        : "Optional — leave blank for a global streak badge."
                }
                fullWidth
              >
                <MenuItem value="">
                  {isKpiAllowed(form.triggerType)
                    ? "No KPI (global badge)"
                    : "Not applicable"}
                </MenuItem>
                {filteredKpiItems.map((kpi) => (
                  <MenuItem key={kpi.kpi_key} value={kpi.kpi_key}>
                    {`${themeNameByKey[kpi.theme_key] || kpi.theme_key || "Unknown Theme"} - ${kpi.display_name}`}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2.5, bgcolor: "background.default" }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Badge Icon</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Pick a preset icon or enter a custom emoji below.
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      width: { xs: "100%", md: 160 },
                      minHeight: 132,
                      px: 2,
                      py: 2.5,
                      borderRadius: 3,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Typography sx={{ fontSize: 36, lineHeight: 1 }}>
                      {form.icon || "🏅"}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Live Preview
                    </Typography>
                    <Chip
                      size="small"
                      label={form.icon ? "Selected" : "Default Preview"}
                      color={form.icon ? "primary" : "default"}
                      variant={form.icon ? "filled" : "outlined"}
                    />
                  </Paper>

                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(4, minmax(0, 1fr))",
                          sm: "repeat(6, minmax(0, 1fr))",
                        },
                        gap: 1,
                      }}
                    >
                      {BADGE_ICON_OPTIONS.map((iconOption) => {
                        const selected = form.icon === iconOption.value;

                        return (
                          <Button
                            key={iconOption.value}
                            variant={selected ? "contained" : "outlined"}
                            color={selected ? "primary" : "inherit"}
                            onClick={() => updateField("icon", iconOption.value)}
                            sx={{
                              minWidth: 0,
                              minHeight: 72,
                              borderRadius: 2.5,
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                              px: 1,
                            }}
                          >
                            <Box component="span" sx={{ fontSize: 24, lineHeight: 1 }}>
                              {iconOption.value}
                            </Box>
                            <Box
                              component="span"
                              sx={{
                                fontSize: 11,
                                lineHeight: 1.2,
                                textTransform: "none",
                                textAlign: "center",
                              }}
                            >
                              {iconOption.label}
                            </Box>
                          </Button>
                        );
                      })}
                    </Box>
                  </Box>
                </Stack>

                <TextField
                  label="Custom Icon / Emoji"
                  value={form.icon}
                  onChange={(event) => updateField("icon", event.target.value)}
                  helperText="Paste any emoji or short icon text."
                  fullWidth
                />
              </Stack>
            </Paper>

            {mode === "edit" && (
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(event) =>
                      updateField("isActive", event.target.checked)
                    }
                  />
                }
                label="Active"
              />
            )}
          </Stack>

          <Stack direction="row" spacing={1.25} sx={{ mt: 3 }}>
            {canSubmitForm && (
              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                onClick={handleSave}
                disabled={createLoading || updateLoading}
              >
                {createLoading || updateLoading ? "Saving..." : "Save"}
              </Button>
            )}
            <Button variant="outlined" onClick={() => navigate(basePath)}>
              Cancel
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Layout>
  );
}
