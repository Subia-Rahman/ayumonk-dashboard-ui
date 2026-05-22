import {
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

const headerSx = {
  fontSize: 10,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "text.secondary",
  fontWeight: 700,
};

export default function KpiMappingTable({
  rows,
  formulaType,
  knownKpiKeys,
  onChangeWeight,
  onChangeThreshold,
  onRemove,
}) {
  const theme = useTheme();
  const showThreshold = formulaType === "DEFICIT_SUM";
  const knownSet = knownKpiKeys instanceof Set ? knownKpiKeys : new Set(knownKpiKeys || []);

  if (!rows || rows.length === 0) {
    return (
      <Box
        sx={{
          py: 4,
          textAlign: "center",
          color: "text.secondary",
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="body2">
          No mapping configured.
        </Typography>
        <Typography variant="caption">
          Click "Reset to platform defaults" to apply AyuMonk defaults, or add KPIs
          manually using the button below.
        </Typography>
      </Box>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={headerSx}>KPI</TableCell>
          <TableCell sx={{ ...headerSx, width: 140 }}>Weight</TableCell>
          {showThreshold && (
            <TableCell sx={{ ...headerSx, width: 140 }}>Threshold</TableCell>
          )}
          <TableCell sx={{ ...headerSx, width: 60, textAlign: "right" }}>
            Actions
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => {
          const isDeactivated = knownSet.size > 0 && !knownSet.has(row.kpi_key);
          return (
            <TableRow key={row.kpi_key} hover>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontSize: 13 }}>
                    {row.kpi_name || row.kpi_key}
                  </Typography>
                  {isDeactivated && (
                    <Tooltip title="This KPI has been deactivated. It can be removed but not edited.">
                      <Chip
                        size="small"
                        label="deactivated"
                        color="warning"
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    </Tooltip>
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  size="small"
                  value={row.weight}
                  disabled={isDeactivated || !onChangeWeight}
                  onChange={(event) =>
                    onChangeWeight?.(row.kpi_key, event.target.value)
                  }
                  inputProps={{
                    step: 0.001,
                    min: 0,
                    max: formulaType === "WEIGHTED_AVG" ? 1 : undefined,
                    "aria-label": `Weight for ${row.kpi_name || row.kpi_key}`,
                  }}
                  sx={{ width: 110 }}
                />
              </TableCell>
              {showThreshold && (
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={row.threshold ?? ""}
                    disabled={isDeactivated || !onChangeThreshold}
                    onChange={(event) =>
                      onChangeThreshold?.(row.kpi_key, event.target.value)
                    }
                    inputProps={{
                      step: 0.1,
                      min: 1,
                      max: 5,
                      "aria-label": `Threshold for ${row.kpi_name || row.kpi_key}`,
                    }}
                    sx={{ width: 110 }}
                  />
                </TableCell>
              )}
              <TableCell sx={{ textAlign: "right" }}>
                <IconButton
                  size="small"
                  aria-label={`Remove ${row.kpi_name || row.kpi_key}`}
                  onClick={() => onRemove?.(row.kpi_key)}
                  disabled={!onRemove}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
