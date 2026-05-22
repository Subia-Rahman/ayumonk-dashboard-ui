const TOLERANCE = 0.001;
const WARN_BAND = 0.05;

export function evaluateWeightSum(sum, target = 1) {
  const delta = Math.abs(sum - target);
  if (delta <= TOLERANCE) return "valid";
  if (delta <= WARN_BAND) return "warn";
  return "invalid";
}

export function getValidationRule(formulaType) {
  if (formulaType === "WEIGHTED_AVG") {
    return "WEIGHTED_AVG: KPI weights must sum to 1.000 (±0.001).";
  }
  if (formulaType === "COMPOSITE") {
    return "COMPOSITE: Signal weights must sum to 1.000 (±0.001).";
  }
  if (formulaType === "DEFICIT_SUM") {
    return "DEFICIT_SUM: Thresholds required (1.0–5.0). Weights can be any non-negative number.";
  }
  return "";
}
