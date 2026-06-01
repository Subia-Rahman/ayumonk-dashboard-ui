import { Box, Skeleton, Stack, Typography } from "@mui/material";
import KpiMappingTable from "./KpiMappingTable";
import SignalMappingTable from "./SignalMappingTable";
import AddMappingDropdown from "./AddMappingDropdown";
import WeightSumBadge from "./WeightSumBadge";
import { getValidationRule } from "./weightSum";

export default function MappingEditor({
  metric,
  kpiMappings,
  signalMappings,
  weightSum,
  isLoading,
  options,
  optionsLoading,
  onChangeKpiWeight,
  onChangeKpiThreshold,
  onRemoveKpi,
  onAddKpi,
  onChangeSignalWeight,
  onRemoveSignal,
  onAddSignal,
}) {
  if (isLoading) {
    return (
      <Stack spacing={1} sx={{ mt: 2 }}>
        <Skeleton variant="rectangular" height={36} />
        <Skeleton variant="rectangular" height={36} />
        <Skeleton variant="rectangular" height={36} />
        <Skeleton variant="rectangular" height={36} />
      </Stack>
    );
  }

  if (!metric) {
    return null;
  }

  const isComposite = metric.formula_type === "COMPOSITE";
  const knownKpiKeys = new Set((options?.kpis || []).map((k) => k.kpi_key));
  const knownSignalCodes = new Set(
    (options?.signals || []).map((s) => s.signal_code),
  );

  const availableKpis = (options?.kpis || []).filter(
    (kpi) => !kpiMappings.some((row) => row.kpi_key === kpi.kpi_key),
  );
  const availableSignals = (options?.signals || []).filter(
    (signal) =>
      !signalMappings.some((row) => row.signal_code === signal.signal_code),
  );

  const showSumBadge =
    metric.formula_type === "WEIGHTED_AVG" || metric.formula_type === "COMPOSITE";

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ mb: 1.5 }}
        flexWrap="wrap"
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {metric.display_name}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          · {metric.formula_type}
        </Typography>
        {metric.methodology_ref && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            · {metric.methodology_ref}
          </Typography>
        )}
        {metric.baseline != null && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            · baseline {metric.baseline}
          </Typography>
        )}
      </Stack>

      {isComposite ? (
        <SignalMappingTable
          rows={signalMappings}
          knownSignalCodes={knownSignalCodes}
          onChangeWeight={onChangeSignalWeight}
          onRemove={onRemoveSignal}
        />
      ) : (
        <KpiMappingTable
          rows={kpiMappings}
          formulaType={metric.formula_type}
          knownKpiKeys={knownKpiKeys}
          onChangeWeight={onChangeKpiWeight}
          onChangeThreshold={onChangeKpiThreshold}
          onRemove={onRemoveKpi}
        />
      )}

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}
      >
        {showSumBadge ? (
          <WeightSumBadge
            sum={weightSum}
            target={1}
            rule={getValidationRule(metric.formula_type)}
          />
        ) : (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {getValidationRule(metric.formula_type)}
          </Typography>
        )}

        {isComposite ? (
          <AddMappingDropdown
            options={availableSignals}
            loading={optionsLoading}
            label="Add Signal"
            onSelect={onAddSignal}
          />
        ) : (
          <AddMappingDropdown
            options={availableKpis}
            loading={optionsLoading}
            label="Add KPI"
            onSelect={onAddKpi}
          />
        )}
      </Stack>

      <Typography
        variant="caption"
        sx={{ color: "text.secondary", display: "block", mt: 1.5 }}
      >
        Rule: {getValidationRule(metric.formula_type)}
      </Typography>
    </Box>
  );
}
