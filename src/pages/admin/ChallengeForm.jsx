import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Layout from "../../layouts/commonLayout/Layout";
import { fetchCompanies } from "../../store/companySlice";
import { fetchKpiById, fetchKpis } from "../../store/kpiSlice";
import { fetchThemes } from "../../store/themeSlice";
import {
  clearChallengeCreateState,
  clearChallengeDetailState,
  clearChallengeMappingState,
  clearChallengeUpdateState,
  createChallenge,
  fetchChallengeById,
  updateChallenge,
} from "../../store/challengeSlice";
import { getSurfaceBackground } from "../../theme";
import { getCompanyId, setCompanyId } from "../../utils/roleHelper";
import usePermissions from "../../hooks/usePermissions";
import api, { getApiErrorMessage } from "../../services/api";
import { API_URLS } from "../../services/apiUrls";

const CHALLENGE_ICON_OPTIONS = [
  { value: "🏆", label: "Trophy" },
  { value: "🎯", label: "Target" },
  { value: "🔥", label: "Streak" },
  { value: "⚡", label: "Energy" },
  { value: "🌟", label: "Star" },
  { value: "💪", label: "Strength" },
  { value: "🚀", label: "Boost" },
  { value: "🥇", label: "Winner" },
  { value: "🎉", label: "Celebrate" },
  { value: "🧠", label: "Focus" },
  { value: "💧", label: "Hydration" },
  { value: "🌿", label: "Wellness" },
];

const CHALLENGE_TYPE_OPTIONS = [
  "Counter",
  "Toggle",
  "Choice",
  "Multi",
  "Timer",
  "Rating",
];

// Per-type UI rules for the platform admin form:
//   counter / timer  → target_value shown, no options
//   toggle / rating  → neither (server defaults / ignores target_value here)
//   choice           → options repeater required (min 2 labels), no target_value
//   multi            → options repeater required (min 1 label), no target_value
const normalizeChallengeType = (challengeType) =>
  String(challengeType || "").toLowerCase();

const showsTargetValue = (challengeType) => {
  const type = normalizeChallengeType(challengeType);
  return type === "counter" || type === "timer";
};

const showsOptions = (challengeType) => {
  const type = normalizeChallengeType(challengeType);
  return type === "choice" || type === "multi";
};

const minOptionsFor = (challengeType) =>
  normalizeChallengeType(challengeType) === "choice" ? 2 : 1;

const defaultMapping = () => ({
  localId: `${Date.now()}-${Math.random()}`,
  kpiKey: "",
  startDate: "",
  endDate: "",
});

const defaultOption = () => ({
  localId: `opt-${Date.now()}-${Math.random()}`,
  label: "",
});

export default function ChallengeForm({ mode, role = "superadmin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { companies } = useSelector((state) => state.company);
  const { items: kpiItems } = useSelector((state) => state.kpi);
  const { items: themeItems } = useSelector((state) => state.theme);
  const {
    selectedChallenge,
    createLoading,
    createError,
    detailLoading,
    detailError,
    updateLoading,
    updateError,
  } = useSelector((state) => state.challenge);
  const [draftForm, setDraftForm] = useState({
    companyId: role === "admin" ? getCompanyId() : "",
    name: "",
    challengeType: "",
    description: "",
    targetValue: 0,
    xpReward: 0,
    icon: "",
    isDaily: true,
    isActive: true,
  });
  const [draftMappings, setDraftMappings] = useState([defaultMapping()]);
  const [draftOptions, setDraftOptions] = useState([defaultOption(), defaultOption()]);
  const [hasStartedEditing, setHasStartedEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [companyMe, setCompanyMe] = useState(null);
  const [companyMeError, setCompanyMeError] = useState("");
  const { canCreate, canEdit } = usePermissions();
  const canSubmitForm = mode === "edit" ? canEdit("challenges") : canCreate("challenges");

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

          const resolvedCompanyId = payload.data?.id || payload.data?.company_id || "";
          setCompanyMe(payload.data);
          setCompanyMeError("");
          setCompanyId(resolvedCompanyId);
        } catch (error) {
          setCompanyMe(null);
          setCompanyMeError(getApiErrorMessage(error, "Failed to fetch company details."));
        }
      };

      fetchCompanyMe();
    }

    if (mode === "edit" && id) {
      dispatch(fetchChallengeById(id));
    }
  }, [dispatch, id, mode, role]);

  useEffect(() => {
    if (mode !== "edit" || !selectedChallenge) return;

    setDraftForm({
      companyId: selectedChallenge.company_id || "",
      name: selectedChallenge.name || "",
      challengeType: selectedChallenge.challenge_type || "",
      description: selectedChallenge.description || "",
      targetValue: selectedChallenge.target_value || 0,
      xpReward: selectedChallenge.xp_reward || 0,
      icon: selectedChallenge.icon || "",
      isDaily: Boolean(selectedChallenge.is_daily),
      isActive: Boolean(selectedChallenge.is_active),
    });

    setDraftMappings(
      selectedChallenge.kpi_mappings?.length
        ? selectedChallenge.kpi_mappings.map((mapping, index) => ({
            localId: mapping.id || `${mapping.kpi_key || "mapping"}-${index}`,
            kpiKey: mapping.kpi_key || "",
            startDate: mapping.start_date || "",
            endDate: mapping.end_date || "",
          }))
        : [defaultMapping()],
    );

    const existingOptions = Array.isArray(selectedChallenge.options)
      ? selectedChallenge.options
      : [];
    if (existingOptions.length) {
      setDraftOptions(
        existingOptions.map((label, index) => ({
          localId: `opt-${index}-${label}`,
          label: String(label || ""),
        })),
      );
    } else {
      const min = minOptionsFor(selectedChallenge.challenge_type);
      setDraftOptions(
        Array.from({ length: Math.max(min, 1) }, () => defaultOption()),
      );
    }
  }, [mode, selectedChallenge]);

  useEffect(() => {
    return () => {
      dispatch(clearChallengeCreateState());
      dispatch(clearChallengeUpdateState());
      dispatch(clearChallengeDetailState());
      dispatch(clearChallengeMappingState());
    };
  }, [dispatch]);

  const pageTitle = useMemo(
    () => (mode === "edit" ? "Edit Challenge" : "Add Challenge"),
    [mode],
  );

  const form = useMemo(() => {
    if (mode === "edit" && selectedChallenge && !hasStartedEditing) {
      return {
        companyId: selectedChallenge.company_id || "",
        name: selectedChallenge.name || "",
        challengeType: selectedChallenge.challenge_type || "",
        description: selectedChallenge.description || "",
        targetValue: selectedChallenge.target_value || 0,
        xpReward: selectedChallenge.xp_reward || 0,
        icon: selectedChallenge.icon || "",
        isDaily: Boolean(selectedChallenge.is_daily),
        isActive: Boolean(selectedChallenge.is_active),
      };
    }

    return draftForm;
  }, [draftForm, hasStartedEditing, mode, selectedChallenge]);

  const mappings = useMemo(() => {
    if (mode === "edit" && selectedChallenge && !hasStartedEditing) {
      return selectedChallenge.kpi_mappings?.length
        ? selectedChallenge.kpi_mappings.map((mapping, index) => ({
            localId: mapping.id || `${mapping.kpi_key || "mapping"}-${index}`,
            kpiKey: mapping.kpi_key || "",
            startDate: mapping.start_date || "",
            endDate: mapping.end_date || "",
          }))
        : [defaultMapping()];
    }

    return draftMappings;
  }, [draftMappings, hasStartedEditing, mode, selectedChallenge]);

  const options = useMemo(() => {
    if (mode === "edit" && selectedChallenge && !hasStartedEditing) {
      const existing = Array.isArray(selectedChallenge.options)
        ? selectedChallenge.options
        : [];
      if (existing.length) {
        return existing.map((label, index) => ({
          localId: `opt-${index}-${label}`,
          label: String(label || ""),
        }));
      }
      const min = minOptionsFor(selectedChallenge.challenge_type);
      return Array.from({ length: Math.max(min, 1) }, () => defaultOption());
    }

    return draftOptions;
  }, [draftOptions, hasStartedEditing, mode, selectedChallenge]);

  const optionsRequired = showsOptions(form.challengeType);
  const targetRequired = showsTargetValue(form.challengeType);

  const selectedCompanyId = useMemo(() => {
    if (role === "superadmin") {
      return form.companyId;
    }

    return companyMe?.id || companyMe?.company_id || form.companyId || getCompanyId();
  }, [companyMe, form.companyId, role]);

  const selectedCompanyName = useMemo(() => {
    if (companyMe?.company_name) {
      return companyMe.company_name;
    }

    const selectedCompany = companies.find(
      (company) => String(company.id) === String(selectedCompanyId),
    );

    return selectedCompany?.company_name || selectedCompanyId || "";
  }, [companies, companyMe, selectedCompanyId]);

  useEffect(() => {
    if (role !== "admin" || !selectedCompanyId) return;

    setDraftForm((current) =>
      current.companyId === selectedCompanyId
        ? current
        : { ...current, companyId: selectedCompanyId },
    );
  }, [role, selectedCompanyId]);

  // Keep the options repeater at or above the per-type minimum (choice ≥ 2,
  // multi ≥ 1) whenever the admin flips between challenge types.
  useEffect(() => {
    if (!showsOptions(form.challengeType)) return;
    const min = minOptionsFor(form.challengeType);
    setDraftOptions((current) => {
      if (current.length >= min) return current;
      const padded = [...current];
      while (padded.length < min) padded.push(defaultOption());
      return padded;
    });
  }, [form.challengeType]);

  const filteredKpis = useMemo(
    () => {
      if (!selectedCompanyId) {
        return [];
      }

      return kpiItems.filter(
        (kpi) =>
          !kpi.company_id || String(kpi.company_id) === String(selectedCompanyId),
      );
    },
    [kpiItems, selectedCompanyId],
  );

  useEffect(() => {
    if (selectedCompanyId) {
      dispatch(fetchKpis({ isActive: true, companyId: selectedCompanyId }));
      dispatch(fetchThemes({ isActive: true, companyId: selectedCompanyId }));
    }
  }, [dispatch, selectedCompanyId]);

  const themeNameByKey = useMemo(
    () =>
      themeItems.reduce((accumulator, item) => {
        accumulator[item.theme_key] = item.theme_display_name;
        return accumulator;
      }, {}),
    [themeItems],
  );

  const getKpiDatesFromList = (kpiKey) => {
    const selectedKpi = filteredKpis.find((item) => item.kpi_key === kpiKey);

    return {
      startDate: selectedKpi?.start_date || "",
      endDate: selectedKpi?.end_date || "",
    };
  };

  const hydrateMappingDates = async (kpiKey) => {
    const listDates = getKpiDatesFromList(kpiKey);
    if (listDates.startDate && listDates.endDate) {
      return listDates;
    }

    try {
      const kpiDetail = await dispatch(fetchKpiById(kpiKey)).unwrap();

      return {
        startDate: kpiDetail?.start_date || "",
        endDate: kpiDetail?.end_date || "",
      };
    } catch {
      return {
        startDate: "",
        endDate: "",
      };
    }
  };

  const validateDateRange = (startDate, endDate) =>
    Boolean(startDate) && Boolean(endDate) && startDate <= endDate;

  const handleSave = async () => {
    if (!form.name.trim() || !form.challengeType.trim() || !form.description.trim()) {
      setFormError("Challenge name, type, and description are required.");
      return;
    }

    if (role === "superadmin" && !selectedCompanyId) {
      setFormError("Company is required.");
      return;
    }

    if (!mappings.length) {
      setFormError("Add at least one KPI mapping.");
      return;
    }

    const hasInvalidMapping = mappings.some(
      (mapping) =>
        !mapping.kpiKey ||
        !validateDateRange(mapping.startDate, mapping.endDate),
    );

    if (hasInvalidMapping) {
      setFormError(
        "Each KPI mapping needs a KPI, start date, and an end date on or after the start date.",
      );
      return;
    }

    const trimmedOptionLabels = options
      .map((option) => option.label.trim())
      .filter((label) => label.length > 0);
    const minOptions = minOptionsFor(form.challengeType);

    if (optionsRequired && trimmedOptionLabels.length < minOptions) {
      setFormError(
        normalizeChallengeType(form.challengeType) === "choice"
          ? "Choice challenges need at least two non-empty option labels."
          : "Multi challenges need at least one non-empty option label.",
      );
      return;
    }

    setFormError("");

    const resolvedTargetValue = targetRequired
      ? Number(form.targetValue) || 0
      : 0;
    //const resolvedOptions = optionsRequired ? trimmedOptionLabels : [];
    const resolvedOptions = optionsRequired ? trimmedOptionLabels : undefined;

    try {
      if (mode === "edit") {
        await dispatch(
          updateChallenge({
            challengeKey: id,
            companyId: selectedCompanyId || undefined,
            name: form.name.trim(),
            challengeType: form.challengeType.trim(),
            description: form.description.trim(),
            targetValue: resolvedTargetValue,
            xpReward: Number(form.xpReward) || 0,
            icon: form.icon.trim(),
            isDaily: form.isDaily,
            isActive: form.isActive,
            options: resolvedOptions,
            kpiMappings: mappings.map((mapping) => ({
              kpi_key: mapping.kpiKey,
              start_date: mapping.startDate,
              end_date: mapping.endDate,
            })),
          }),
        ).unwrap();
        //navigate("/admin/challenges", {
          navigate(role === "superadmin" ? "/super-admin/challenges" : "/admin/challenges", {
          replace: true,
          state: {
            feedback: {
              severity: "success",
              message: "Challenge updated successfully.",
            },
          },
        });
        return;
      }

      await dispatch(
        createChallenge({
          companyId: selectedCompanyId || undefined,
          name: form.name.trim(),
          challengeType: form.challengeType.trim(),
          description: form.description.trim(),
          targetValue: resolvedTargetValue,
          xpReward: Number(form.xpReward) || 0,
          icon: form.icon.trim(),
          isDaily: form.isDaily,
          options: resolvedOptions,
          kpiMappings: mappings.map((mapping) => ({
            kpi_key: mapping.kpiKey,
            start_date: mapping.startDate,
            end_date: mapping.endDate,
          })),
        }),
      ).unwrap();
      //navigate("/admin/challenges", {
      navigate(role === "superadmin" ? "/super-admin/challenges" : "/admin/challenges", {
        replace: true,
        state: {
          feedback: {
            severity: "success",
            message: "Challenge added successfully.",
          },
        },
      });
    } catch {
      // Error is already handled in redux state.
    }
  };

  const handleAddMappingRow = () => {
    setHasStartedEditing(true);
    setDraftMappings((current) => [...current, defaultMapping()]);
  };

  const handleRemoveMappingRow = (localId) => {
    setHasStartedEditing(true);
    setDraftMappings((current) =>
      current.length === 1 ? current : current.filter((item) => item.localId !== localId),
    );
  };

  const handleMappingKpiChange = async (localId, kpiKey) => {
    setFormError("");
    setHasStartedEditing(true);

    setDraftMappings((current) =>
      current.map((item) =>
        item.localId === localId
          ? { ...item, kpiKey, startDate: "", endDate: "" }
          : item,
      ),
    );

    const kpiDates = await hydrateMappingDates(kpiKey);

    setDraftMappings((current) =>
      current.map((item) =>
        item.localId === localId
          ? {
              ...item,
              kpiKey,
              startDate: kpiDates.startDate,
              endDate: kpiDates.endDate,
            }
          : item,
      ),
    );
  };

  const handleMappingDateChange = (localId, field, value) => {
    setFormError("");
    setHasStartedEditing(true);
    setDraftMappings((current) =>
      current.map((item) =>
        item.localId === localId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleAddOptionRow = () => {
    setFormError("");
    setHasStartedEditing(true);
    setDraftOptions((current) => [...current, defaultOption()]);
  };

  const handleRemoveOptionRow = (localId) => {
    setFormError("");
    setHasStartedEditing(true);
    setDraftOptions((current) => {
      const min = minOptionsFor(form.challengeType);
      if (current.length <= min) return current;
      return current.filter((item) => item.localId !== localId);
    });
  };

  const handleOptionLabelChange = (localId, value) => {
    setFormError("");
    setHasStartedEditing(true);
    setDraftOptions((current) =>
      current.map((item) =>
        item.localId === localId ? { ...item, label: value } : item,
      ),
    );
  };

  if (mode === "edit" && detailLoading) {
    return (
      <Layout role="admin" title={pageTitle}>
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
          <Typography>Loading challenge...</Typography>
        </Paper>
      </Layout>
    );
  }

  return (
    <Layout role="admin" title={pageTitle}>
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
                  ? "Update the challenge details below."
                  : "Create a challenge and assign one or more KPI mappings."}
              </Typography>
            </Box>
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => 
              //navigate("/admin/challenges")}
              navigate(role === "superadmin" ? "/super-admin/challenges" : "/admin/challenges")}
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
            {role === "superadmin" ? (
              <TextField
                label="Company"
                select
                value={form.companyId}
                onChange={(event) => {
                  setFormError("");
                setHasStartedEditing(true);
                setDraftForm((current) => ({
                  ...current,
                  companyId: event.target.value,
                }));
                setDraftMappings([defaultMapping()]);
              }}
                fullWidth
              >
                <MenuItem value="">Select Company</MenuItem>
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
              label="Challenge Name"
              value={form.name}
              onChange={(event) => {
                setFormError("");
                setHasStartedEditing(true);
                setDraftForm((current) => ({ ...current, name: event.target.value }));
              }}
              fullWidth
            />
            <TextField
              label="Challenge Type"
              select
              value={form.challengeType}
              onChange={(event) => {
                setFormError("");
                setHasStartedEditing(true);
                setDraftForm((current) => ({
                  ...current,
                  challengeType: event.target.value,
                }));
              }}
              fullWidth
            >
              <MenuItem value="">Select challenge type</MenuItem>
              {CHALLENGE_TYPE_OPTIONS.map((challengeType) => (
                <MenuItem key={challengeType} value={challengeType}>
                  {challengeType}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              value={form.description}
              onChange={(event) => {
                setFormError("");
                setHasStartedEditing(true);
                setDraftForm((current) => ({
                  ...current,
                  description: event.target.value,
                }));
              }}
              multiline
              minRows={4}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              {targetRequired && (
                <TextField
                  label={
                    normalizeChallengeType(form.challengeType) === "timer"
                      ? "Target Value (seconds)"
                      : "Target Value"
                  }
                  type="number"
                  value={form.targetValue}
                  onChange={(event) => {
                    setHasStartedEditing(true);
                    setDraftForm((current) => ({
                      ...current,
                      targetValue: event.target.value,
                    }));
                  }}
                  fullWidth
                />
              )}
              <TextField
                label="XP Reward"
                type="number"
                value={form.xpReward}
                onChange={(event) => {
                  setHasStartedEditing(true);
                  setDraftForm((current) => ({
                    ...current,
                    xpReward: event.target.value,
                  }));
                }}
                fullWidth
              />
            </Stack>

            {optionsRequired && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: "background.default",
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>
                        {normalizeChallengeType(form.challengeType) === "choice"
                          ? "Choice Options"
                          : "Multi Options"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {normalizeChallengeType(form.challengeType) === "choice"
                          ? "Provide at least two labels — the employee picks exactly one."
                          : "Provide at least one label — the employee selects all that apply before completing."}
                      </Typography>
                    </Box>
                    <Button
                      startIcon={<AddRoundedIcon />}
                      onClick={handleAddOptionRow}
                    >
                      Add Option
                    </Button>
                  </Stack>

                  <Stack spacing={1.25}>
                    {options.map((option, index) => (
                      <Stack
                        key={option.localId}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                      >
                        <TextField
                          label={`Option ${index + 1}`}
                          value={option.label}
                          onChange={(event) =>
                            handleOptionLabelChange(option.localId, event.target.value)
                          }
                          fullWidth
                        />
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveOptionRow(option.localId)}
                          disabled={options.length <= minOptionsFor(form.challengeType)}
                        >
                          <DeleteOutlineRoundedIcon />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            )}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "background.default",
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Challenge Icon</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Pick an icon that will look good on the user dashboard, or enter a custom
                    emoji/icon below.
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
                      {form.icon || "✨"}
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
                      {CHALLENGE_ICON_OPTIONS.map((iconOption) => {
                        const selected = form.icon === iconOption.value;

                        return (
                          <Button
                            key={iconOption.value}
                            variant={selected ? "contained" : "outlined"}
                            color={selected ? "primary" : "inherit"}
                            onClick={() => {
                              setHasStartedEditing(true);
                              setDraftForm((current) => ({
                                ...current,
                                icon: iconOption.value,
                              }));
                            }}
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
                  onChange={(event) => {
                    setHasStartedEditing(true);
                    setDraftForm((current) => ({ ...current, icon: event.target.value }));
                  }}
                  helperText="You can paste any emoji or short icon text that should appear on the user dashboard."
                  fullWidth
                />
              </Stack>
            </Paper>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isDaily}
                    onChange={(event) => {
                      setHasStartedEditing(true);
                      setDraftForm((current) => ({
                        ...current,
                        isDaily: event.target.checked,
                      }));
                    }}
                  />
                }
                label="Daily Challenge"
              />

              {mode === "edit" && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isActive}
                      onChange={(event) => {
                        setHasStartedEditing(true);
                        setDraftForm((current) => ({
                          ...current,
                          isActive: event.target.checked,
                        }));
                      }}
                    />
                  }
                  label="Active"
                />
              )}
            </Stack>
          </Stack>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  KPI Mappings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Each mapping links one KPI to this challenge for a specific date range.
                </Typography>
              </Box>
              <Button startIcon={<AddRoundedIcon />} onClick={handleAddMappingRow}>
                Add Mapping
              </Button>
            </Stack>

            {mappings.map((mapping, index) => (
              <Paper key={mapping.localId} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                  >
                    <Typography sx={{ fontWeight: 600 }}>
                      Mapping {index + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveMappingRow(mapping.localId)}
                      disabled={mappings.length === 1}
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="KPI"
                      select
                      value={mapping.kpiKey}
                      disabled={!selectedCompanyId}
                      onChange={(event) =>
                        handleMappingKpiChange(mapping.localId, event.target.value)
                      }
                      fullWidth
                    >
                      <MenuItem value="">
                        {selectedCompanyId ? "Select KPI" : "Select a company first"}
                      </MenuItem>
                      {filteredKpis.map((kpi) => (
                        <MenuItem key={kpi.kpi_key} value={kpi.kpi_key}>
                          {`${themeNameByKey[kpi.theme_key] || kpi.theme_key || "Unknown Theme"} - ${kpi.display_name}`}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={mapping.startDate}
                      onChange={(event) =>
                        handleMappingDateChange(
                          mapping.localId,
                          "startDate",
                          event.target.value,
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      value={mapping.endDate}
                      onChange={(event) =>
                        handleMappingDateChange(
                          mapping.localId,
                          "endDate",
                          event.target.value,
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Stack>
                </Stack>
              </Paper>
            ))}
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
            <Button variant="outlined" onClick={() => 
            //navigate("/admin/challenges")}
            navigate(role === "superadmin" ? "/super-admin/challenges" : "/admin/challenges")}
            >
              Cancel
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Layout>
  );
}
