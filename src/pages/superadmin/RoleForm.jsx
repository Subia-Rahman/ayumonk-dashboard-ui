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
import {
  clearRoleCreateState,
  clearRoleDetailState,
  clearRoleUpdateState,
  createRole,
  fetchRoleById,
  updateRole,
} from "../../store/roleSlice";
import { fetchCompanies } from "../../store/companySlice";
import { getSurfaceBackground } from "../../theme";
import usePermissions from "../../hooks/usePermissions";

const defaultFormValues = {
  name: "",
  tenant_id: "",
  is_active: true,
};

const normalizeFormValues = (item) => ({
  name: item?.name || "",
  tenant_id: item?.tenant_id || "",
  is_active: item?.is_active ?? true,
});

export default function RoleForm({ mode = "add" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    selectedRole,
    detailLoading,
    detailError,
    createLoading,
    createError,
    updateLoading,
    updateError,
    selectedTenantId,
  } = useSelector((state) => state.role);
  const { companies } = useSelector((state) => state.company);

  const isEdit = mode === "edit";

  const [formValues, setFormValues] = useState({
    ...defaultFormValues,
    tenant_id: isEdit ? "" : selectedTenantId || "",
  });
  const [formError, setFormError] = useState("");
  const [lastSyncedRoleId, setLastSyncedRoleId] = useState(null);
  const { canCreate, canEdit } = usePermissions();
  const canSubmitForm = isEdit ? canEdit("roles") : canCreate("roles");

  const pageTitle = useMemo(() => (isEdit ? "Edit Role" : "Add Role"), [isEdit]);
  const isSubmitting = createLoading || updateLoading;

  useEffect(() => {
    dispatch(fetchCompanies());
    if (isEdit && id && selectedTenantId) {
      dispatch(fetchRoleById({ roleId: id, tenantId: selectedTenantId }));
    }
    return () => {
      dispatch(clearRoleCreateState());
      dispatch(clearRoleUpdateState());
      dispatch(clearRoleDetailState());
    };
  }, [dispatch, id, isEdit, selectedTenantId]);

  if (
    isEdit &&
    selectedRole &&
    String(selectedRole.id) === String(id) &&
    lastSyncedRoleId !== selectedRole.id
  ) {
    setLastSyncedRoleId(selectedRole.id);
    setFormValues(normalizeFormValues(selectedRole));
  }

  const handleChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormError("");
  };

  const validate = () => {
    if (!formValues.name.trim()) return "Role name is required.";
    if (!formValues.tenant_id) return "Tenant is required.";
    return "";
  };

  const handleSave = async () => {
    const nextError = validate();
    if (nextError) {
      setFormError(nextError);
      return;
    }

    const payload = {
      name: formValues.name.trim(),
      tenant_id: formValues.tenant_id,
      is_active: Boolean(formValues.is_active),
    };

    try {
      if (isEdit) {
        await dispatch(updateRole({ roleId: id, payload })).unwrap();
        navigate("/super-admin/roles", {
          replace: true,
          state: {
            feedback: {
              severity: "success",
              message: "Role updated successfully.",
            },
          },
        });
        return;
      }

      await dispatch(createRole(payload)).unwrap();
      navigate("/super-admin/roles", {
        replace: true,
        state: {
          feedback: {
            severity: "success",
            message: "Role created successfully.",
          },
        },
      });
    } catch {
      // Redux state already stores the error.
    }
  };

  if (isEdit && detailLoading) {
    return (
      <Layout role="superadmin" title={pageTitle}>
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
          <Typography>Loading role...</Typography>
        </Paper>
      </Layout>
    );
  }

  return (
    <Layout role="superadmin" title={pageTitle}>
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
              {isEdit
                ? "Update the role's name, tenant binding, and status."
                : "Create a new role and attach it to a tenant."}
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/super-admin/roles")}
          >
            Back to list
          </Button>
        </Stack>

        {(formError || detailError || createError || updateError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError || detailError || createError || updateError}
          </Alert>
        )}

        <Stack spacing={3}>
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
              label="Role Name"
              value={formValues.name}
              onChange={(event) => handleChange("name", event.target.value)}
              fullWidth
            />
            <TextField
              label="Company"
              select
              value={formValues.tenant_id}
              onChange={(event) => handleChange("tenant_id", event.target.value)}
              fullWidth
            >
              <MenuItem value="">Select tenant</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.company_name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={formValues.is_active}
                onChange={(event) =>
                  handleChange("is_active", event.target.checked)
                }
              />
            }
            label={formValues.is_active ? "Role is active" : "Role is inactive"}
          />

          <Stack direction="row" spacing={1.5}>
            {canSubmitForm && (
              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Role"}
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate("/super-admin/roles")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Layout>
  );
}
