import { Tabs, Tab, Box } from "@mui/material";

export default function MetricTabs({ metrics, activeMetricCode, onChange }) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  const value = metrics.findIndex((m) => m.metric_code === activeMetricCode);
  const safeValue = value >= 0 ? value : 0;

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        value={safeValue}
        onChange={(_event, newIndex) => {
          const next = metrics[newIndex];
          if (next && next.metric_code !== activeMetricCode) {
            onChange(next.metric_code);
          }
        }}
        role="tablist"
        aria-label="CXO metric selector"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: 44 }}
      >
        {metrics.map((metric) => (
          <Tab
            key={metric.metric_code}
            label={metric.display_name}
            role="tab"
            aria-selected={metric.metric_code === activeMetricCode}
            sx={{ textTransform: "none", fontWeight: 700, minHeight: 44 }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
