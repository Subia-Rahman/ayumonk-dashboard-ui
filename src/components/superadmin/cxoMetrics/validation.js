// Mirror of the backend validation rules. Keep in sync with the server.

export const WEIGHT_TOLERANCE = 0.001;

export function sumWeights(rows) {
  return (rows || []).reduce((acc, row) => acc + (Number(row?.weight) || 0), 0);
}

// Returns { isValid, errors: string[], weightSum }
export function validateMapping({
  formulaType,
  kpiMappings,
  signalMappings,
}) {
  const errors = [];
  const kpis = Array.isArray(kpiMappings) ? kpiMappings : [];
  const signals = Array.isArray(signalMappings) ? signalMappings : [];

  if (formulaType === "WEIGHTED_AVG") {
    if (signals.length > 0) {
      errors.push("WEIGHTED_AVG metrics must not have signal mappings.");
    }
    const sum = sumWeights(kpis);
    if (Math.abs(sum - 1) > WEIGHT_TOLERANCE) {
      errors.push(`Weights must sum to 1.000, got ${sum.toFixed(3)}.`);
    }
    kpis.forEach((row) => {
      if (row.threshold != null && row.threshold !== "") {
        errors.push(
          `${row.kpi_name || row.kpi_key}: threshold must be null for WEIGHTED_AVG.`,
        );
      }
      if (Number(row.weight) < 0) {
        errors.push(`${row.kpi_name || row.kpi_key}: weight must be ≥ 0.`);
      }
    });
    checkDuplicates(kpis, "kpi_key", "KPI", errors);
    return { isValid: errors.length === 0, errors, weightSum: sum };
  }

  if (formulaType === "DEFICIT_SUM") {
    if (signals.length > 0) {
      errors.push("DEFICIT_SUM metrics must not have signal mappings.");
    }
    kpis.forEach((row) => {
      if (row.threshold == null || row.threshold === "" || Number.isNaN(Number(row.threshold))) {
        errors.push(
          `${row.kpi_name || row.kpi_key}: threshold is required for DEFICIT_SUM.`,
        );
      } else {
        const t = Number(row.threshold);
        if (t < 1 || t > 5) {
          errors.push(
            `${row.kpi_name || row.kpi_key}: threshold must be between 1.0 and 5.0.`,
          );
        }
      }
      if (Number(row.weight) < 0) {
        errors.push(`${row.kpi_name || row.kpi_key}: weight must be ≥ 0.`);
      }
    });
    checkDuplicates(kpis, "kpi_key", "KPI", errors);
    return { isValid: errors.length === 0, errors, weightSum: sumWeights(kpis) };
  }

  if (formulaType === "COMPOSITE") {
    if (kpis.length > 0) {
      errors.push("COMPOSITE metrics must not have KPI mappings.");
    }
    const sum = sumWeights(signals);
    if (Math.abs(sum - 1) > WEIGHT_TOLERANCE) {
      errors.push(`Signal weights must sum to 1.000, got ${sum.toFixed(3)}.`);
    }
    signals.forEach((row) => {
      if (Number(row.weight) < 0) {
        errors.push(`${row.signal_name || row.signal_code}: weight must be ≥ 0.`);
      }
    });
    checkDuplicates(signals, "signal_code", "Signal", errors);
    return { isValid: errors.length === 0, errors, weightSum: sum };
  }

  return { isValid: false, errors: ["Unknown formula type."], weightSum: 0 };
}

function checkDuplicates(rows, key, label, errors) {
  const seen = new Set();
  rows.forEach((row) => {
    const id = row?.[key];
    if (id && seen.has(id)) {
      errors.push(`Duplicate ${label}: ${id}.`);
    }
    seen.add(id);
  });
}
