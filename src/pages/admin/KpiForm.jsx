import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
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
import { fetchThemes } from "../../store/themeSlice";
import {
  clearKpiCreateState,
  clearKpiDetailState,
  clearKpiUpdateState,
  createKpi,
  fetchKpiById,
  updateKpi,
} from "../../store/kpiSlice";
import { fetchCompanies } from "../../store/companySlice";
import { getCompanyId } from "../../utils/roleHelper";
import { getSurfaceBackground } from "../../theme";
import usePermissions from "../../hooks/usePermissions";

const today = new Date().toISOString().slice(0, 10);

export default function KpiForm({ mode, role = "superadmin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { items: themeItems } = useSelector((state) => state.theme);
  const { companies } = useSelector((state) => state.company);
  const { selectedKpi, createLoading, createError, detailLoading, detailError, updateLoading, updateError } =
    useSelector((state) => state.kpi);
  const [form, setForm] = useState({
    displayName: "",
    themeKey: "",
    domainCategory: "",
    wiWeight: "",
    startDate: today,
    endDate: today,
    isActive: true,
    companyId: role === "admin" ? getCompanyId() : "",
  });
  const [formError, setFormError] = useState("");
  const { canCreate, canEdit } = usePermissions();
  const canSubmitForm = mode === "edit" ? canEdit("kpis") : canCreate("kpis");

  const selectedCompanyId = useMemo(
    () => (role === "superadmin" ? form.companyId : getCompanyId()),
    [form.companyId, role],
  );

  const themeItemsByCompany = useMemo(
    () =>
      selectedCompanyId
        ? themeItems.filter((item) => item.company_id === selectedCompanyId)
        : themeItems,
    [selectedCompanyId, themeItems],
  );

  useEffect(() => {
    dispatch(fetchThemes({ companyId: selectedCompanyId || undefined }));
    dispatch(fetchCompanies());
    if (mode === "edit" && id) {
      dispatch(fetchKpiById(id));
    }
  }, [dispatch, id, mode, selectedCompanyId]);

  useEffect(() => {
    if (mode === "edit" && selectedKpi) {
      setForm({
        displayName: selectedKpi.display_name || "",
        themeKey: selectedKpi.theme_key || "",
        domainCategory: selectedKpi.domain_category || "",
        wiWeight:
          selectedKpi.wi_weight === null || selectedKpi.wi_weight === undefined
            ? ""
            : String(selectedKpi.wi_weight),
        startDate: selectedKpi.start_date || today,
        endDate: selectedKpi.end_date || today,
        isActive: Boolean(selectedKpi.is_active),
        companyId: selectedKpi.company_id || "",
      });
    }
  }, [mode, selectedKpi]);

  useEffect(() => {
    return () => {
      dispatch(clearKpiCreateState());
      dispatch(clearKpiUpdateState());
      dispatch(clearKpiDetailState());
    };
  }, [dispatch]);

  const pageTitle = useMemo(() => (mode === "edit" ? "Edit KPI" : "Add KPI"), [mode]);

  const resolvedForm = useMemo(() => form, [form]);

  const handleSave = async () => {
    if (
      !resolvedForm.displayName.trim() ||
      !resolvedForm.themeKey ||
      !resolvedForm.startDate ||
      !resolvedForm.endDate
    ) {
      setFormError("Theme, KPI name, start date, and end date are required.");
      return;
    }
    if (resolvedForm.startDate > resolvedForm.endDate) {
      setFormError("End date must be on or after the start date.");
      return;
    }
    if (role === "superadmin" && !resolvedForm.companyId) {
      setFormError("Company is required.");
      return;
    }

    setFormError("");

    try {
      const payload = {
        displayName: resolvedForm.displayName.trim(),
        themeKey: resolvedForm.themeKey,
        domainCategory: resolvedForm.domainCategory.trim(),
        wiWeight: resolvedForm.wiWeight === "" ? null : Number(resolvedForm.wiWeight),
        startDate: resolvedForm.startDate,
        endDate: resolvedForm.endDate,
        companyId: role === "superadmin" ? resolvedForm.companyId : getCompanyId(),
      };

      if (mode === "edit") {
        await dispatch(
          updateKpi({
            kpiKey: id,
            ...payload,
            isActive: resolvedForm.isActive,
          }),
        ).unwrap();
        navigate(role === "admin" ? "/admin/kpis" : "/super-admin/kpis", {
          replace: true,
          state: { feedback: { severity: "success", message: "KPI updated successfully." } },
        });
        return;
      }

      await dispatch(createKpi(payload)).unwrap();
      navigate("/super-admin/kpis", {
        replace: true,
        state: { feedback: { severity: "success", message: "KPI added successfully." } },
      });
    } catch {
      // Error is already handled in redux state.
    }
  };

  if (mode === "edit" && detailLoading) {
    return (
      <Layout role={role} title={pageTitle}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: getSurfaceBackground(theme) }}>
          <Typography>Loading KPI...</Typography>
        </Paper>
      </Layout>
    );
  }

  return (
    <Layout role={role} title={pageTitle}>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: getSurfaceBackground(theme) }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 750 }}>{pageTitle}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {mode === "edit" ? "Update the KPI details below." : "Create a new KPI using the API-backed form."}
            </Typography>
          </Box>
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(role === "admin" ? "/admin/kpis" : "/super-admin/kpis")}>
            Back to list
          </Button>
        </Stack>

        {(formError || createError || updateError || detailError) && (
          <Alert severity="error" sx={{ mb: 2 }}>{formError || createError || updateError || detailError}</Alert>
        )}

        <Stack spacing={2}>
          {role === "superadmin" && (
            <TextField
              label="Company"
              value={resolvedForm.companyId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyId: event.target.value,
                  themeKey: "",
                }))
              }
              select
              fullWidth
            >
              <MenuItem value="">Select Company</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>{company.company_name}</MenuItem>
              ))}
            </TextField>
          )}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Theme"
              value={resolvedForm.themeKey}
              onChange={(event) => setForm((current) => ({ ...current, themeKey: event.target.value }))}
              select
              fullWidth
            >
              <MenuItem value="">Select Theme</MenuItem>
              {themeItemsByCompany.map((themeItem) => (
                <MenuItem key={themeItem.theme_key} value={themeItem.theme_key}>{themeItem.theme_display_name}</MenuItem>
              ))}
            </TextField>
            <TextField label="KPI Name" value={resolvedForm.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} fullWidth />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Domain Category" value={resolvedForm.domainCategory} onChange={(event) => setForm((current) => ({ ...current, domainCategory: event.target.value }))} fullWidth />
            <TextField label="WI Weight" type="number" inputProps={{ min: 0 }} value={resolvedForm.wiWeight} onChange={(event) => setForm((current) => ({ ...current, wiWeight: event.target.value }))} fullWidth />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Start Date" type="date" value={resolvedForm.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="End Date" type="date" value={resolvedForm.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
          </Stack>
          {mode === "edit" && (
            <FormControlLabel control={<Switch checked={resolvedForm.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />} label="Active" />
          )}
        </Stack>

        <Stack direction="row" spacing={1.25} sx={{ mt: 3 }}>
          {canSubmitForm && (
            <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={handleSave} disabled={createLoading || updateLoading}>
              {createLoading || updateLoading ? "Saving..." : "Save"}
            </Button>
          )}
          <Button variant="outlined" onClick={() => navigate(role === "admin" ? "/admin/kpis" : "/super-admin/kpis")}>Cancel</Button>
        </Stack>
      </Paper>
    </Layout>
  );
}
