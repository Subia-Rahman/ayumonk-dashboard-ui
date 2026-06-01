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

export default function SignalMappingTable({
  rows,
  knownSignalCodes,
  onChangeWeight,
  onRemove,
}) {
  const theme = useTheme();
  const knownSet =
    knownSignalCodes instanceof Set
      ? knownSignalCodes
      : new Set(knownSignalCodes || []);

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
        <Typography variant="body2">No mapping configured.</Typography>
        <Typography variant="caption">
          Click "Reset to platform defaults" to apply AyuMonk defaults, or add
          signals manually using the button below.
        </Typography>
      </Box>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={headerSx}>Signal</TableCell>
          <TableCell sx={{ ...headerSx, width: 140 }}>Weight</TableCell>
          <TableCell sx={{ ...headerSx, width: 60, textAlign: "right" }}>
            Actions
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => {
          const isDeactivated =
            knownSet.size > 0 && !knownSet.has(row.signal_code);
          return (
            <TableRow key={row.signal_code} hover>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontSize: 13 }}>
                    {row.signal_name || row.signal_code}
                  </Typography>
                  {isDeactivated && (
                    <Tooltip title="This signal has been deactivated. It can be removed but not edited.">
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
                    onChangeWeight?.(row.signal_code, event.target.value)
                  }
                  inputProps={{
                    step: 0.001,
                    min: 0,
                    max: 1,
                    "aria-label": `Weight for ${row.signal_name || row.signal_code}`,
                  }}
                  sx={{ width: 110 }}
                />
              </TableCell>
              <TableCell sx={{ textAlign: "right" }}>
                <IconButton
                  size="small"
                  aria-label={`Remove ${row.signal_name || row.signal_code}`}
                  onClick={() => onRemove?.(row.signal_code)}
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
