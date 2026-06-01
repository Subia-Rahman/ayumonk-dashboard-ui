import { useState } from "react";
import { Autocomplete, Box, Button, TextField } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

export default function AddMappingDropdown({
  options,
  loading,
  disabled,
  label = "Add KPI",
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);

  if (!open) {
    return (
      <Button
        size="small"
        startIcon={<AddRoundedIcon />}
        disabled={disabled || loading}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", minWidth: 280 }}>
      <Autocomplete
        size="small"
        sx={{ minWidth: 240, flex: 1 }}
        options={options}
        loading={loading}
        value={value}
        onChange={(_event, newValue) => setValue(newValue)}
        getOptionLabel={(option) => option?.display_name || ""}
        isOptionEqualToValue={(a, b) =>
          (a?.kpi_key && a.kpi_key === b?.kpi_key) ||
          (a?.signal_code && a.signal_code === b?.signal_code)
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder="Select…"
            autoFocus
          />
        )}
      />
      <Button
        size="small"
        variant="contained"
        disabled={!value}
        onClick={() => {
          if (value) {
            onSelect(value);
            setValue(null);
            setOpen(false);
          }
        }}
      >
        Add
      </Button>
      <Button
        size="small"
        onClick={() => {
          setValue(null);
          setOpen(false);
        }}
      >
        Cancel
      </Button>
    </Box>
  );
}
