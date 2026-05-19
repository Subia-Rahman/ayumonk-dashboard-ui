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
  clearMenuMasterCreateState,
  clearMenuMasterDetailState,
  clearMenuMasterUpdateState,
  createMenu,
  fetchMenuById,
  fetchMenus,
  updateMenu,
} from "../../store/menuMasterSlice";
import { getSurfaceBackground } from "../../theme";
import usePermissions from "../../hooks/usePermissions";

const defaultFormValues = {
  name: "",
  slug: "",
  path: "",
  parent_id: "",
  icon: "",
  order_no: 0,
  is_active: true,
};

const normalizeFormValues = (item) => ({
  name: item?.name || "",
  slug: item?.slug || "",
  path: item?.path || "",
  parent_id:
    item?.parent_id === null || item?.parent_id === undefined
      ? ""
      : String(item.parent_id),
  icon: item?.icon || "",
  order_no:
    item?.order_no === null || item?.order_no === undefined
      ? 0
      : Number(item.order_no),
  is_active: item?.is_active ?? true,
});

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function MenuForm({ mode = "add" }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    items: existingMenus,
    selectedMenu,
    detailLoading,
    detailError,
    createLoading,
    createError,
    updateLoading,
    updateError,
  } = useSelector((state) => state.menuMaster);

  const isEdit = mode === "edit";
  const isSubmitting = createLoading || updateLoading;

  const [formValues, setFormValues] = useState(defaultFormValues);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [formError, setFormError] = useState("");
  const [lastSyncedMenuId, setLastSyncedMenuId] = useState(null);
  const { canCreate, canEdit } = usePermissions();
  const canSubmitForm = isEdit ? canEdit("menus") : canCreate("menus");

  const pageTitle = useMemo(
    () => (isEdit ? "Edit Menu" : "Add Menu"),
    [isEdit],
  );

  useEffect(() => {
    dispatch(fetchMenus());
    if (isEdit && id) {
      dispatch(fetchMenuById(id));
    }
    return () => {
      dispatch(clearMenuMasterCreateState());
      dispatch(clearMenuMasterUpdateState());
      dispatch(clearMenuMasterDetailState());
    };
  }, [dispatch, id, isEdit]);

  if (
    isEdit &&
    selectedMenu &&
    String(selectedMenu.id) === String(id) &&
    lastSyncedMenuId !== selectedMenu.id
  ) {
    setLastSyncedMenuId(selectedMenu.id);
    setFormValues(normalizeFormValues(selectedMenu));
  }

  const parentOptions = useMemo(
    () =>
      existingMenus
        .filter((item) => item.id !== String(id))
        .map((item) => ({ id: item.id, name: item.name })),
    [existingMenus, id],
  );

  const handleChange = (field, value) => {
    setFormValues((current) => {
      const next = { ...current, [field]: value };
      if (!slugTouched && field === "name") {
        next.slug = slugify(value);
      }
      return next;
    });
    setFormError("");
  };

  const handleSlugChange = (value) => {
    setSlugTouched(true);
    setFormValues((current) => ({ ...current, slug: value }));
    setFormError("");
  };

  const validate = () => {
    if (!formValues.name.trim()) return "Name is required.";
    if (!formValues.slug.trim()) return "Slug is required.";
    if (!formValues.path.trim()) return "Path is required.";
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
      slug: formValues.slug.trim(),
      path: formValues.path.trim(),
      parent_id: formValues.parent_id
        ? Number(formValues.parent_id)
        : null,
      icon: formValues.icon.trim(),
      order_no: Number(formValues.order_no) || 0,
      is_active: Boolean(formValues.is_active),
    };

    try {
      if (isEdit) {
        await dispatch(updateMenu({ menuId: id, payload })).unwrap();
        navigate("/super-admin/menus", {
          replace: true,
          state: {
            feedback: {
              severity: "success",
              message: "Menu updated successfully.",
            },
          },
        });
        return;
      }

      await dispatch(createMenu(payload)).unwrap();
      navigate("/super-admin/menus", {
        replace: true,
        state: {
          feedback: {
            severity: "success",
            message: "Menu created successfully.",
          },
        },
      });
    } catch {
      // Redux state already stores the error.
    }
  };

  if (isEdit && detailLoading && !selectedMenu) {
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
          <Typography>Loading menu...</Typography>
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
                ? "Update the menu definition. Slug retains its existing value unless edited."
                : "Define a menu entry. Slug auto-fills from the name; override if needed."}
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/super-admin/menus")}
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
              label="Name"
              value={formValues.name}
              onChange={(event) => handleChange("name", event.target.value)}
              fullWidth
              disabled={isEdit}
            />
            <TextField
              label="Slug"
              value={formValues.slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              fullWidth
              helperText={
                isEdit
                  ? "Edit to change the slug."
                  : "Auto-fills from name; edit to override."
              }
            />
            <TextField
              label="Path"
              value={formValues.path}
              onChange={(event) => handleChange("path", event.target.value)}
              fullWidth
              helperText="e.g. /admin/dashboard"
            />
            <TextField
              label="Parent Menu"
              select
              value={formValues.parent_id}
              onChange={(event) => handleChange("parent_id", event.target.value)}
              fullWidth
              disabled={isEdit}
              helperText={
                parentOptions.length === 0
                  ? "No parent menus available"
                  : "Leave empty for a root-level menu"
              }
            >
              <MenuItem value="">— No parent (root) —</MenuItem>
              {parentOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Icon"
              value={formValues.icon}
              onChange={(event) => handleChange("icon", event.target.value)}
              fullWidth
              helperText="Icon name or identifier"
            />
            <TextField
              label="Order"
              type="number"
              value={formValues.order_no}
              onChange={(event) => handleChange("order_no", event.target.value)}
              fullWidth
              inputProps={{ min: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formValues.is_active}
                  onChange={(event) =>
                    handleChange("is_active", event.target.checked)
                  }
                />
              }
              label={
                formValues.is_active ? "Menu is active" : "Menu is inactive"
              }
              sx={{ alignSelf: "center" }}
            />
          </Box>

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
                    : "Create Menu"}
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate("/super-admin/menus")}
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
