import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
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
  clearCompanyCreateState,
  clearCompanyDetailState,
  clearCompanyUpdateState,
  createCompany,
  fetchCompanyById,
  updateCompany,
} from "../../store/companySlice";
import { fetchLocations, resetLocations } from "../../store/locationSlice";
import api, { getApiErrorMessage } from "../../services/api";
import { API_URLS } from "../../services/apiUrls";
import { getCompanyId, setCompanyId } from "../../utils/roleHelper";
import { getSurfaceBackground } from "../../theme";
import usePermissions from "../../hooks/usePermissions";

const createCompanyDefaults = {
  company_name: "",
  industry: "",
  size_bucket: "",
  email: "",
  phone: "",
  location_id: "",
  location_name: "",
  no_of_employees: 0,
  is_active: true,
};

export default function CompanyDataForm({ mode, role = "superadmin" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    selectedCompany,
    detailLoading,
    detailError,
    createLoading,
    createError,
    updateLoading,
    updateError,
    assignAdminLoading,
    assignAdminError,
  } = useSelector((state) => state.company);
  const [companyForm, setCompanyForm] = useState(() =>
    mode === "edit" ? {} : createCompanyDefaults,
  );
  const [formError, setFormError] = useState("");
  const [companyMe, setCompanyMe] = useState(null);
  const [companyMeError, setCompanyMeError] = useState("");
  const { canCreate, canEdit } = usePermissions();
  const canSubmitForm =
    role === "admin" || mode === "edit"
      ? canEdit("company-data")
      : canCreate("company-data");

  const {
    items: locationItems,
    listLoading: locationsLoading,
    listError: locationsError,
  } = useSelector((state) => state.location);
  const [locationSearch, setLocationSearch] = useState("");

  const pageTitle = useMemo(
    () =>
      role === "admin"
        ? "Edit Company Details"
        : mode === "edit"
          ? "Edit Company"
          : "Add Company",
    [mode, role],
  );

  const resolvedCompanyId = useMemo(() => {
    if (role === "admin") {
      return id || getCompanyId() || "";
    }
    return id || "";
  }, [id, role]);

  useEffect(() => {
    let isMounted = true;

    if (role === "admin") {
      const fetchCompanyMe = async () => {
        try {
          const response = await api.get(API_URLS.companyMe);
          const payload = response?.data || {};
          if (!payload?.success || !payload?.data) {
            throw new Error(payload?.message || "Failed to fetch company details.");
          }

          if (isMounted) {
            setCompanyMe(payload.data);
            setCompanyMeError("");
            setCompanyId(payload.data?.id || payload.data?.company_id || "");
          }
        } catch (error) {
          if (isMounted) {
            setCompanyMe(null);
            setCompanyMeError(
              getApiErrorMessage(error, "Failed to fetch company details."),
            );
          }
        }
      };

      fetchCompanyMe();

      return () => {
        isMounted = false;
      };
    }

    if (mode === "edit" && id) {
      dispatch(fetchCompanyById(id));
    }

    return () => {
      dispatch(clearCompanyCreateState());
      dispatch(clearCompanyUpdateState());
      dispatch(clearCompanyDetailState());
      dispatch(resetLocations());
    };
  }, [dispatch, id, mode, role]);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchLocations({ search: locationSearch, isActive: true }));
    }, 250);
    return () => clearTimeout(handle);
  }, [dispatch, locationSearch]);

  const activeCompany = role === "admin" ? companyMe : selectedCompany;

  const resolvedCompanyForm = useMemo(() => {
    if (mode !== "edit") {
      return companyForm;
    }

    return {
      company_name: activeCompany?.company_name || "",
      industry: activeCompany?.industry || "",
      size_bucket: activeCompany?.size_bucket || "",
      email: activeCompany?.email || "",
      phone: activeCompany?.phone || "",
      location_id: activeCompany?.location_id || "",
      location_name: activeCompany?.location_name || "",
      no_of_employees: activeCompany?.no_of_employees ?? 0,
      is_active: Boolean(activeCompany?.is_active),
      ...companyForm,
    };
  }, [activeCompany, companyForm, mode]);

  const validate = () => {
    const companyName = String(resolvedCompanyForm.company_name || "").trim();
    if (!companyName) {
      return "Company name is required.";
    }

    if (role === "admin" && !resolvedCompanyId) {
      return "Company details are unavailable. Please refresh and try again.";
    }

    return "";
  };

  const handleSave = async () => {
    const nextError = validate();
    if (nextError) {
      setFormError(nextError);
      return;
    }

    setFormError("");

    const trimSafe = (value) => String(value ?? "").trim();

    const buildCompanyPayload = (source) => ({
      company_name: trimSafe(source.company_name),
      industry: trimSafe(source.industry),
      size_bucket: source.size_bucket || "",
      email: trimSafe(source.email),
      phone: trimSafe(source.phone),
      location: trimSafe(source.location_name),
      no_of_employees: Number(source.no_of_employees) || 0,
      is_active: Boolean(source.is_active),
    });

    const buildCreateCompanyPayload = (source) => ({
      company_name: trimSafe(source.company_name),
      industry: trimSafe(source.industry),
      size_bucket: source.size_bucket || "",
      email: trimSafe(source.email),
      phone: trimSafe(source.phone),
      location: trimSafe(source.location_name),
      no_of_employees: Number(source.no_of_employees) || 0,
    });

    try {
      if (role === "admin") {
        await dispatch(
          updateCompany({
            companyId: resolvedCompanyId,
            company: buildCompanyPayload(resolvedCompanyForm),
          }),
        ).unwrap();

        navigate("/admin/dashboard", {
          replace: true,
          state: {
            feedback: {
              severity: "success",
              message: "Company details updated successfully.",
            },
          },
        });
        return;
      }

      if (mode === "edit") {
        await dispatch(
          updateCompany({
            companyId: id,
            company: buildCompanyPayload(resolvedCompanyForm),
          }),
        ).unwrap();

        navigate("/super-admin/company-data", {
          replace: true,
          state: {
            feedback: {
              severity: "success",
              message: "Company updated successfully.",
            },
          },
        });
        return;
      }

      await dispatch(
        createCompany({
          company: buildCreateCompanyPayload(companyForm),
          admin: null,
        }),
      ).unwrap();

      navigate("/super-admin/company-data", {
        replace: true,
        state: {
          feedback: {
            severity: "success",
            message: "Company created successfully.",
          },
        },
      });
    } catch (error) {
      const message =
        (typeof error === "string" && error) ||
        error?.message ||
        "";
      if (message) setFormError(message);
    }
  };

  const backPath = role === "admin" ? "/admin/dashboard" : "/super-admin/company-data";

  if (mode === "edit" && (detailLoading || (role === "admin" && !companyMe && !companyMeError))) {
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
          <Typography>Loading company...</Typography>
        </Paper>
      </Layout>
    );
  }

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
                ? role === "admin"
                  ? "Update your company profile and activation state."
                  : "Update the company profile and activation state."
                : "Create a company. Admin details can be added later."}
            </Typography>
          </Box>
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(backPath)}>
            Back to list
          </Button>
        </Stack>

        {(formError ||
          detailError ||
          createError ||
          updateError ||
          companyMeError ||
          assignAdminError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError ||
              detailError ||
              createError ||
              updateError ||
              companyMeError ||
              assignAdminError}
          </Alert>
        )}

        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Company Details
            </Typography>
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
                label="Company Name"
                value={resolvedCompanyForm.company_name}
                onChange={(event) =>
                  setCompanyForm((current) => ({
                    ...current,
                    company_name: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Industry"
                value={resolvedCompanyForm.industry}
                onChange={(event) =>
                  setCompanyForm((current) => ({
                    ...current,
                    industry: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Size Bucket"
                value={resolvedCompanyForm.size_bucket}
                onChange={(event) =>
                  setCompanyForm((current) => ({
                    ...current,
                    size_bucket: event.target.value,
                  }))
                }
                select
                fullWidth
              >
                <MenuItem value="">Select Size Bucket</MenuItem>
                {[
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" },
                  { value: "enterprise", label: "Enterprise" },
                ].map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Company Email"
                value={resolvedCompanyForm.email}
                onChange={(event) =>
                  setCompanyForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Phone"
                value={resolvedCompanyForm.phone}
                onChange={(event) =>
                  setCompanyForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                fullWidth
              />
              {(() => {
                const optionsMap = new Map(
                  locationItems.map((item) => [String(item.id), item]),
                );
                const optionsByName = new Map(
                  locationItems.map((item) => [
                    String(item.name || "").trim().toLowerCase(),
                    item,
                  ]),
                );

                let selectedLocation = null;
                if (resolvedCompanyForm.location_id) {
                  selectedLocation = {
                    id: String(resolvedCompanyForm.location_id),
                    name:
                      resolvedCompanyForm.location_name ||
                      optionsMap.get(String(resolvedCompanyForm.location_id))
                        ?.name ||
                      "",
                  };
                  if (!optionsMap.has(selectedLocation.id)) {
                    optionsMap.set(selectedLocation.id, selectedLocation);
                  }
                } else if (resolvedCompanyForm.location_name) {
                  selectedLocation = resolvedCompanyForm.location_name;
                }

                const locationOptions = Array.from(optionsMap.values());
                const getName = (opt) =>
                  typeof opt === "string" ? opt : opt?.name || "";

                return (
                  <Autocomplete
                    freeSolo
                    selectOnFocus
                    handleHomeEndKeys
                    options={locationOptions}
                    value={selectedLocation}
                    loading={locationsLoading}
                    getOptionLabel={getName}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return false;
                      if (typeof option === "string" || typeof value === "string") {
                        return getName(option) === getName(value);
                      }
                      return String(option.id) === String(value.id);
                    }}
                    filterOptions={(opts) => opts}
                    onChange={(_event, newValue) => {
                      if (!newValue) {
                        setCompanyForm((current) => ({
                          ...current,
                          location_id: "",
                          location_name: "",
                        }));
                        return;
                      }
                      if (typeof newValue === "string") {
                        const match = optionsByName.get(
                          newValue.trim().toLowerCase(),
                        );
                        setCompanyForm((current) => ({
                          ...current,
                          location_id: match ? String(match.id) : "",
                          location_name: match ? match.name : newValue,
                        }));
                        return;
                      }
                      setCompanyForm((current) => ({
                        ...current,
                        location_id: String(newValue.id),
                        location_name: newValue.name || "",
                      }));
                    }}
                    onInputChange={(_event, newInput, reason) => {
                      if (reason === "input") {
                        setLocationSearch(newInput);
                        const match = optionsByName.get(
                          (newInput || "").trim().toLowerCase(),
                        );
                        setCompanyForm((current) => ({
                          ...current,
                          location_id: match ? String(match.id) : "",
                          location_name: newInput,
                        }));
                      } else if (reason === "clear") {
                        setLocationSearch("");
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Location"
                        error={Boolean(locationsError)}
                        helperText={
                          locationsError ||
                          "Pick an existing location or type a new one"
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {locationsLoading ? (
                                <CircularProgress
                                  color="inherit"
                                  size={18}
                                  sx={{ mr: 1 }}
                                />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    fullWidth
                  />
                );
              })()}
              <TextField
                label="No. of Employees"
                type="number"
                value={resolvedCompanyForm.no_of_employees}
                onChange={(event) =>
                  setCompanyForm((current) => ({
                    ...current,
                    no_of_employees: event.target.value,
                  }))
                }
                fullWidth
              />
            </Box>

            {mode === "edit" && role === "superadmin" && (
              <FormControlLabel
                sx={{ mt: 2 }}
                control={
                  <Switch
                    checked={resolvedCompanyForm.is_active}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                }
                label="Company is active"
              />
            )}
          </Box>

        </Stack>

        <Stack direction="row" spacing={1.25} sx={{ mt: 3 }}>
          {canSubmitForm && (
            <Button
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              onClick={handleSave}
              disabled={createLoading || updateLoading || assignAdminLoading}
            >
              {createLoading || updateLoading || assignAdminLoading
                ? "Saving..."
                : role === "admin"
                  ? "Update Company"
                  : mode === "edit"
                    ? "Update Company"
                    : "Create Company"}
            </Button>
          )}
          <Button variant="outlined" onClick={() => navigate(backPath)}>
            Cancel
          </Button>
        </Stack>
      </Paper>
    </Layout>
  );
}
